import { v4 as uuidv4 } from 'uuid';
import * as commentRepo from '../repositories/commentRepository.js';
import * as notificationRepo from '../repositories/notificationRepository.js';

export async function createComment({ authorId, postId, content, parentCommentId = null }) {
  const id = uuidv4();
  const comment = await commentRepo.createComment({
    id,
    authorId,
    postId,
    content,
    parentCommentId
  });

  // TODO: notify author using notificationRepo

  return comment;
}

export async function getComments(postId, limit = 50) {
  return await commentRepo.getCommentsForPost(postId, limit);
}
