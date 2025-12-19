import { v4 as uuidv4 } from "uuid";
import * as postRepo from "../repositories/postRepository.js";
import * as notificationRepo from "../repositories/notificationRepository.js";

async function createPost({ authorId, content, media, privacy }) {
  const id = uuidv4();
  const result = await postRepo.createPost({
    id,
    authorId,
    content,
    media,
    privacy,
  });
  return result;
}

async function getPost(id) {
  return await postRepo.getPostById(id);
}

async function deletePost(id, userId) {
  return await postRepo.deletePost(id, userId);
}

async function getFeed(limit) {
  return await postRepo.getRecentPublicPosts(limit);
}

async function getPostsByUser(userId, limit) {
  return await postRepo.getPostsByAuthor(userId, limit);
}

async function likePost(userId, postId) {
  await postRepo.likePost(userId, postId);
  const post = await postRepo.getPostById(postId);
  if (post && post.author && post.author.id !== userId) {
    const notif = {
      id: uuidv4(),
      userId: post.author.id,
      type: "like",
      data: JSON.stringify({ from: userId, postId }),
    };
    await notificationRepo.createNotification(notif);
  }
  const count = await postRepo.countLikes(postId);
  return { liked: true, likes_count: count };
}

async function unlikePost(userId, postId) {
  await postRepo.unlikePost(userId, postId);
  const count = await postRepo.countLikes(postId);
  return { liked: false, likes_count: count };
}

async function countLikes(postId) {
  return await postRepo.countLikes(postId);
}

async function sharePost(userId, originalPostId, content = "") {
  //fetch og post
  const original = await postRepo.getPostById(originalPostId);
  if (!original || !original.post) {
    throw { status: 404, message: "Original post not found" };
  }

  //if nested share-> share the og og post, not the shared shared
  const targetPostId = original.sharedPost
    ? original.sharedPost.id
    : original.post.id;

  //
  const id = uuidv4();
  const newPostData = await postRepo.createPost({
    id,
    authorId: userId,
    content: content||"", //newpost caption
    media: [], //ref og media
    privacy: original.post.privacy || "public",
    sharedPostId: targetPostId,
  });


  return await postRepo.getPostById(id);
}

export {
  createPost,
  getPost,
  deletePost,
  getFeed,
  getPostsByUser,
  likePost,
  unlikePost,
  countLikes,
  sharePost,
};
