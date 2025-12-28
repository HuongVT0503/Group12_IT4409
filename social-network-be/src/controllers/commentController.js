import * as commentService from '../services/commentService.js';
import { emitNotification, emitPostUpdate } from '../services/realtimeService.js';
import * as postRepo from '../repositories/postRepository.js';
import * as notificationRepo from '../repositories/notificationRepository.js';
import { saveFileFromBuffer } from '../services/mediaService.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const getUserIdFromRequest = (req) => {
  try {
    if (req.user) return req.user.id;
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (e) {
    return null;
  }
};

async function createComment(req, res, next) {
  try {
    const authorId = req.user.id;
    const postId = req.params.postId;
    const { content, parent_comment_id } = req.body;
    
    let mediaUrls = [];
    
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => saveFileFromBuffer(file));
      mediaUrls = await Promise.all(uploadPromises);
    } 
    else if (req.body.media) {
      mediaUrls = Array.isArray(req.body.media) ? req.body.media : [req.body.media];
    }
    
    const comment = await commentService.createComment({
      authorId, postId, content,
      parentCommentId: parent_comment_id,
      media: mediaUrls 
    });

    let recipientId = null;
    let notificationText = "";
    let type = "comment";

    if (parent_comment_id) {
      const parentComment = await commentService.getCommentById(parent_comment_id);
      if (parentComment && parentComment.author.id !== authorId) {
        recipientId = parentComment.author.id;
        notificationText = "replied to your comment";
        type = "reply";
      }
    } else {
      const postData = await postRepo.getPostById(postId);
      if (postData?.author && postData.author.id !== authorId) {
        recipientId = postData.author.id;
        notificationText = "commented on your post";
        type = "comment";
      }
    }

    if (recipientId) {
      const notifId = uuidv4();
      const notifData = { from: authorId, postId, text: notificationText, commentId: comment.id };
      await notificationRepo.createNotification({
        id: notifId, userId: recipientId, type, data: JSON.stringify(notifData),
      });
      emitNotification(recipientId, {
        id: notifId, type, postId, comment, from: authorId,
        text: notificationText, created_at: new Date().toISOString(), read: false, data: notifData
      });
    }

    emitPostUpdate(postId, { newComment: comment });
    res.status(201).json({ comment });
  } catch (err) { next(err); }
}

async function getComments(req, res, next) {
  try {
    const postId = req.params.postId;
    const userId = getUserIdFromRequest(req);
    const data = await commentService.getComments(postId, userId, req.query.limit || 50);
    res.json({ data });
  } catch (err) { next(err); }
}

async function deleteComment(req, res, next) {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.id;
    const postId = await commentService.deleteComment(commentId, userId);
    if (!postId) return res.status(403).json({ message: "Unauthorized or not found" });
    emitPostUpdate(postId, { deletedCommentId: commentId });
    res.status(200).json({ message: "Comment deleted" });
  } catch (err) { next(err); }
}

async function editComment(req, res, next) {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.id;
    const { content } = req.body;
    const result = await commentService.editComment(commentId, userId, content);
    if (result && result.postId) {
      emitPostUpdate(result.postId, { updatedComment: result });
    }
    res.json({ message: "Comment updated successfully", comment: result });
  } catch (err) { next(err); }
}

async function reactToComment(req, res, next) {
  try {
    const userId = req.user.id;
    const commentId = req.params.commentId;
    const { type } = req.body;
    const result = await commentService.reactToComment({ commentId, userId, reactionType: type });
    if (result.author && result.author.id !== userId) {
      const notifId = uuidv4();
      const notifData = { from: userId, postId: result.postId, commentId, text: `reacted ${type}`, reaction: type };
      await notificationRepo.createNotification({ id: notifId, userId: result.author.id, type: 'reaction', data: JSON.stringify(notifData) });
      emitNotification(result.author.id, { id: notifId, type: 'reaction', created_at: new Date().toISOString(), read: false, data: notifData });
    }
    if (result.postId) emitPostUpdate(result.postId, { reactionChange: { commentId, userId, reaction: type } });
    res.status(200).json({ reaction: result.reaction });
  } catch (err) { next(err); }
}

async function removeReaction(req, res, next) {
  try {
    const userId = req.user.id;
    const commentId = req.params.commentId;
    const result = await commentService.removeReaction({ commentId, userId });
    if (result.postId) emitPostUpdate(result.postId, { reactionChange: { commentId, userId, reaction: null } });
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
}

export { createComment, getComments, deleteComment, editComment, reactToComment, removeReaction };