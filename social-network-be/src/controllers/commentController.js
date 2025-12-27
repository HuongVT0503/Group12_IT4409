import * as commentService from '../services/commentService.js';
import { emitNotification, emitPostUpdate } from '../services/realtimeService.js';
import * as postRepo from '../repositories/postRepository.js';
import * as notificationRepo from '../repositories/notificationRepository.js';
import * as commentRepo from '../repositories/commentRepository.js';
import {v4 as uuidv4} from 'uuid';
import { saveFileFromBuffer } from '../services/mediaService.js';


async function createComment(req, res, next) {
  try {
    const authorId = req.user.id;
    const postId = req.params.postId;
    const { content, parent_comment_id, media } = req.body;
    const comment = await commentService.createComment({
      authorId,
      postId,
      content,
      parentCommentId: parent_comment_id,
      media
    });

    //Lấy thông tin tác giả và emit notification cho tác giả nếu có cmt
    const postData = await postRepo.getPostById(postId);
    if (postData?.author && postData.author.id !== authorId) {
      const notifId = uuidv4();
      const notifData = {
        from: authorId,
        postId: postId,
        text: "commented on your post",
      };
      
      //save to db
      await notificationRepo.createNotification({
        id: notifId,
        userId: postData.author.id,
        type: "comment",
        data: JSON.stringify(notifData),
      });

      emitNotification(postData.author.id, {
        id: notifId,
        type: "comment",
        created_at: new Date().toISOString(),
        read: false,
        data: notifData,
      });
    }

    //emit notif to author of PARENT COMMENT
    if (parent_comment_id) {
      const parentAuthor = await commentRepo.getCommentAuthor(parent_comment_id);

      if (parentAuthor && parentAuthor.id !== authorId) { 
        const notifId = uuidv4();
        const notifData = {
          from: authorId,
          postId: postId,
          text: "replied to your comment", 
          commentId: comment.id, //of the reply
          parentCommentId: parent_comment_id
        };

        //save to db
        await notificationRepo.createNotification({
          id: notifId,
          userId: parentAuthor.id,
          type: "reply", 
          data: JSON.stringify(notifData),
        });

        emitNotification(parentAuthor.id, {
          id: notifId,
          type: "reply",
          created_at: new Date().toISOString(),
          read: false,
          data: notifData,
        });
      }}
    // Emit update realtime cho post
    emitPostUpdate(postId, { newComment: comment });

    res.status(201).json({ comment });
  } catch (err) { next(err); }
}

async function getComments(req, res, next) {
  try {
    const postId = req.params.postId;
    const data = await commentService.getComments(postId, req.query.limit || 50);
    res.json({ data });
  } catch (err) { next(err); }
}


async function deleteComment(req, res, next) {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;
        
        const postId = await commentService.deleteComment(commentId, userId);
        
        if (!postId) {
            return res.status(403).json({ message: "Cannot delete comment (not found or unauthorized)" });
        }

        emitPostUpdate(postId, { deletedCommentId: commentId });
        
        res.status(200).json({ message: "Comment deleted" });
    } catch (err) {
        next(err);
    }
}

async function reactToComment(req, res, next) {
  try {
    const userId = req.user.id;
    const commentId = req.params.commentId;
    const { type } = req.body; // e.g. 'like','love', 'haha'

    const result = await commentService.reactToComment({ commentId, userId, reactionType: type });

    // notify comment author
    if (result.author && result.author.id !== userId) {
      const notifId = uuidv4();
      const notifData = { from: userId, commentId, text: 'reacted to your comment', reaction: type };
      await notificationRepo.createNotification({ id: notifId, userId: result.author.id, type: 'reaction', data: JSON.stringify(notifData) });
      emitNotification(result.author.id, { id: notifId, type: 'reaction', created_at: new Date().toISOString(), read: false, data: notifData });
    }

    // emit realtime update to post room
    if (result.postId) {
      emitPostUpdate(result.postId, { reactionChange: { commentId, userId, reaction: type } });
    }

    res.status(200).json({ reaction: result.reaction });
  } catch (err) { next(err); }
}

async function removeReaction(req, res, next) {
  try {
    const userId = req.user.id;
    const commentId = req.params.commentId;

    const result = await commentService.removeReaction({ commentId, userId });

    if (result.postId) {
      emitPostUpdate(result.postId, { reactionChange: { commentId, userId, reaction: null } });
    }

    res.status(200).json({ success: true });
  } catch (err) { next(err); }
}

export { createComment, getComments, deleteComment, reactToComment, removeReaction };
