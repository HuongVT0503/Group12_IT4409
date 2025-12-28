import { v4 as uuidv4 } from 'uuid';
import * as commentRepo from '../repositories/commentRepository.js';

export async function createComment({ authorId, postId, content, parentCommentId = null, media = [] }) {
  const id = uuidv4();
  const comment = await commentRepo.createComment({
    id, authorId, postId, content, parentCommentId, media
  });
  return comment;
}

export async function getCommentById(id) {
  return await commentRepo.getCommentById(id);
}

export async function getComments(postId, userId = null, limit = 50) {
  return await commentRepo.getCommentsForPost(postId, limit, userId);
}

export async function deleteComment(commentId, userId) {
  return await commentRepo.deleteComment(commentId, userId);
}

export async function editComment(commentId, userId, newContent) {
  const result = await commentRepo.editComment(commentId, userId, newContent);
  if (!result) throw { status: 403, message: "No editing rights" };
  return result;
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