import { v4 as uuidv4 } from 'uuid';
import * as commentRepo from '../repositories/commentRepository.js';
import * as notificationRepo from '../repositories/notificationRepository.js';
import * as postRepo from '../repositories/postRepository.js';
import { emitPostUpdate, emitNotification } from './realtimeService.js';

export async function createComment({ authorId, postId, content, parentCommentId = null, media = [] }) {
  const id = uuidv4();
  const comment = await commentRepo.createComment({
    id,
    authorId,
    postId,
    content,
    parentCommentId,
    media
  });

  // TODO: notify author using notificationRepo

  return comment;
}

export async function getComments(postId, userId = null, limit = 50) {
  return await commentRepo.getCommentsForPost(postId, limit, userId);
}

export async function deleteComment(commentId, userId) {
    return await commentRepo.deleteComment(commentId, userId);
}

export async function reactToComment({ commentId, userId, reactionType }) {
  const r = await commentRepo.reactToComment({ commentId, userId, reactionType });
  const author = await commentRepo.getCommentAuthor(commentId);
  const postId = await commentRepo.getCommentPostId(commentId);

  return { reaction: r, author, postId };
}

export async function removeReaction({ commentId, userId }) {
  const deleted = await commentRepo.removeReaction({ commentId, userId });
  const postId = await commentRepo.getCommentPostId(commentId);
  return { deleted, postId };
}