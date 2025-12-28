import * as commentService from '../services/commentService.js';
import { emitNotification, emitPostUpdate } from '../services/realtimeService.js';
import * as postRepo from '../repositories/postRepository.js';
import * as notificationRepo from '../repositories/notificationRepository.js';
import {v4 as uuidv4} from 'uuid';

async function createComment(req, res, next) {
  try {
    const authorId = req.user.id;
    const postId = req.params.postId;
    const { content, parent_comment_id } = req.body;
    const comment = await commentService.createComment({
      authorId,
      postId,
      content,
      parentCommentId: parent_comment_id,
    });

    // Xác định người cần nhận thông báo
    let recipientId = null;
    let notificationText = "";

    // Nếu là Reply: Thông báo cho chủ của comment cha
    if (parent_comment_id) {
        const parentComment = await commentService.getCommentById(parent_comment_id);        if (parentComment && parentComment.author.id !== authorId) {
            recipientId = parentComment.author.id;
            notificationText = "replied to your comment";
        }
    } else {
        // Nếu là cmt mới: Gửi cho chủ post
        const postData = await postRepo.getPostById(postId);
        if (postData?.author && postData.author.id !== authorId) {
            recipientId = postData.author.id;
            notificationText = "commented on your post";
        }
    }
    // Gửi thông báo
      if (recipientId) {
      //save to db
      await notificationRepo.createNotification({
        id: uuidv4(),
        userId: recipientId,
        type: "comment",
        data: JSON.stringify({
          from: authorId,
          postId: postId,
          text: notificationText,
          commentId: comment.id
        }),
      });

      emitNotification(recipientId, {
        type: "comment",
        postId,
        comment,
        from: authorId,
        text: notificationText
      });
    }
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

async function editComment(req, res, next) {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;
        const { content } = req.body;

        const result = await commentService.editComment(commentId, userId, content);
        const postId = req.params.postId;
        if (postId) {
            emitPostUpdate(postId, { updatedComment: result });
        }

        res.json({ message: "Comment updated successfully", comment: result });
    } catch (err) {
        next(err);
    }
}

export { createComment, getComments, deleteComment, editComment };
