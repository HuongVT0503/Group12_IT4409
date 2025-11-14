const { v4: uuidv4 } = require('uuid');
const commentRepo = require('../repositories/commentRepository');
const notificationRepo = require('../repositories/notificationRepository');

async function createComment({ authorId, postId, content, parentCommentId = null }) {
  const id = uuidv4();
  const comment = await commentRepo.createComment({ id, authorId, postId, content, parentCommentId });
  // notify post author
  // find post & author (via post repository) — skip for brevity or call postRepo.getPostById
  return comment;
}

async function getComments(postId, limit = 50) {
  return await commentRepo.getCommentsForPost(postId, limit);
}

module.exports = { createComment, getComments };
