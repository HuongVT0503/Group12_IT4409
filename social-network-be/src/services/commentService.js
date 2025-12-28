import { v4 as uuidv4 } from 'uuid';
import * as commentRepo from '../repositories/commentRepository.js';

export async function createComment({ authorId, postId, content, parentCommentId = null }) {
  const id = uuidv4();
  const comment = await commentRepo.createComment({
    id,
    authorId,
    postId,
    content,
    parentCommentId
  });
  return comment;
}

export async function getCommentById(id) {
  return await commentRepo.getCommentById(id);
}

export async function getComments(postId, limit = 50) {
  return await commentRepo.getCommentsForPost(postId, limit);
}

export async function deleteComment(commentId, userId) {
    return await commentRepo.deleteComment(commentId, userId);
}

export async function editComment(commentId, userId, newContent) {
  const result = await commentRepo.editComment(commentId, userId, newContent);
  if (!result) {
    throw { status: 403, message: "No editing rights" };
  }
  return result;
}