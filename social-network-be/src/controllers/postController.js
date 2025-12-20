import * as postService from "../services/postService.js";
import * as userService from "../services/userService.js";
import {
  emitNewPost,
  emitPostUpdate,
  emitNotification,
} from "../services/realtimeService.js";
import { v4 as uuidv4 } from "uuid";
import * as notificationRepo from "../repositories/notificationRepository.js";

// Tạo bài viết mới
async function createPost(req, res, next) {
  try {
    const authorId = req.user.id; // Lấy từ JWT
    const { content, media, privacy } = req.body;
    const post = await postService.createPost({
      authorId,
      content,
      media,
      privacy,
    });

    //Lấy danh sách follower
    const followers = await userService.getFollowers(authorId);
    // Emit cho followers để cập nhật newsfeed
    emitNewPost(
      post,
      followers.map((f) => f.id)
    );

    //create noti for FOLLOWERS
    const notificationPromise = followers.map(async (follower) => {
        const notifId = uuidv4();
        const notifData = {
            from: authorId,
            postId: post.post.id,
            text: "posted a new update",
            senderName: req.user.display_name, 
            senderAvatar: req.user.avatar_url
        };
        //save to db
        await notificationRepo.createNotification({
            id: notifId,
            userId: follower.id,
            type: "new_post",
            data: JSON.stringify(notifData),
        });
        //emit REALTIME noti
        emitNotification(follower.id, {
            type: "new_post",
            id: notifId,
            created_at: new Date().toISOString(),
            read: false,
            data: notifData
        });
    });

    await Promise.all(notificationPromise);


    emitPostUpdate(post.post.id, { newPost: post });

    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

// Lấy bài viết theo id
async function getPost(req, res, next) {
  try {
    const id = req.params.id;
    const post = await postService.getPost(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

// Xóa bài viết
async function deletePost(req, res, next) {
  try {
    const id = req.params.id;
    const userId = req.user.id; // Lấy từ JWT
    await postService.deletePost(id, userId);

    emitPostUpdate(id, { deleted: true });

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// Lấy feed
async function getFeed(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const posts = await postService.getFeed(limit);
    res.json({ posts });
  } catch (err) {
    next(err);
  }
}

async function getUserPosts(req, res, next) {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 20;
    const posts = await postService.getPostsByUser(userId, limit);
    res.json({ posts });
  } catch (err) {
    next(err);
  }
}

// Like bài viết
async function likePost(req, res, next) {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const result = await postService.likePost(userId, postId);

    // Like bài viết
    emitPostUpdate(postId, { likedBy: userId });

    const postData = await postService.getPost(postId); //fetch post data

    const liker = await userService.getProfile(userId);

    //dont notify if liking own post
    if (postData && postData.author && postData.author.id !== userId) {
      emitNotification(postData.author.id, {
        type: "like",
        data: {
          from: userId,
          postId: postId,
          text: "liked your post", //safety fallback
          senderName: liker.display_name,
          senderAvatar: liker.avatar_url,
        },
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Unlike bài viết
async function unlikePost(req, res, next) {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const result = await postService.unlikePost(userId, postId);

    // Unlike
    emitPostUpdate(postId, { unlikedBy: userId });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Lấy số lượt like của bài viết
async function countLikes(req, res, next) {
  try {
    const postId = req.params.id;
    const count = await postService.countLikes(postId);
    res.json({ likes_count: count });
  } catch (err) {
    next(err);
  }
}

async function sharePost(req, res, next) {
  try {
    const userId = req.user.id;
    const originalPostId = req.params.id;

    //captiom
    const { content } = req.body;

    //call service
    const result = await postService.sharePost(userId, originalPostId, content);

    const originalAuthorId=result.sharedPost?.author?.id;

    //notify folloers
    const followers = await userService.getFollowers(userId);
    emitNewPost(
      result,
      followers.map((f) => f.id)
    );

    //noti shared post
    const notiSharePromise =  followers.map(async (follower) => {
      if (originalAuthorId&&follower.id===originalAuthorId) return;// skip if og author is a follower

        const notifId = uuidv4();
        const notifData = {
            from: userId,
            postId: result.post.id, //id of the NEW share post
            text: "shared a post",
            senderName: req.user.display_name,
            senderAvatar: req.user.avatar_url
        };

        await notificationRepo.createNotification({
            id: notifId,
            userId: follower.id,
            type: "share_post", 
            data: JSON.stringify(notifData),
        });

        emitNotification(follower.id, {
            type: "share_post",
            id: notifId,
            created_at: new Date().toISOString(),
            read: false,
            data: notifData
        });
    });

    await Promise.all(notiSharePromise);


    if (originalAuthorId && originalAuthorId !== userId) {
      const authorNotifId = uuidv4();
        const authorNotifData = {
            from: userId,
            postId: result.post.id,
            text: "shared your post", 
            senderName: req.user.display_name,
            senderAvatar: req.user.avatar_url
        };

        //save to db
        await notificationRepo.createNotification({
            id: authorNotifId,
            userId: originalAuthorId,
            type: "share_post",
            data: JSON.stringify(authorNotifData),
        });


        emitNotification(originalAuthorId, {
            type: "share_post",
            id: authorNotifId, //temp ID
            created_at: new Date().toISOString(),
            read: false,
            data: authorNotifData
        });
    }

    res.status(201).json({ post: result });
  } catch (err) {
    next(err);
  }
}

export {
  createPost,
  getPost,
  deletePost,
  getFeed,
  getUserPosts,
  likePost,
  unlikePost,
  countLikes,
  sharePost,
};
