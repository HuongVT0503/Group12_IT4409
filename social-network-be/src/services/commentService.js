import { v4 as uuidv4 } from 'uuid';
import * as commentRepo from '../repositories/commentRepository.js';
import * as notificationRepo from '../repositories/notificationRepository.js';
import * as postRepo from '../repositories/postRepository.js';
import { emitNotification } from './realtimeService.js';

export async function createComment({ authorId, postId, content, parentCommentId = null }) {
  const id = uuidv4();
  const comment = await commentRepo.createComment({
    id,
    authorId,
    postId,
    content,
    parentCommentId
  });

  const post = await postRepo.getPostById(postId);
  if (post && post.author && post.author.id !== authorId) {
    const notifId = uuidv4();
    const notifData = {
      from: authorId,
      postId: postId,
      commentId: id,
    };
    
    await notificationRepo.createNotification({
      id: notifId,
      userId: post.author.id,
      type: "comment",
      data: JSON.stringify(notifData),
    });

    emitNotification(post.author.id, {
      id: notifId,
      type: "comment",
      created_at: new Date().toISOString(),
      read: false,
      data: notifData,
    });
  }

  return comment;
}

export async function getComments(postId, limit = 50) {
  return await commentRepo.getCommentsForPost(postId, limit);
}

export async function deleteComment(commentId, userId) {
    return await commentRepo.deleteComment(commentId, userId);
}