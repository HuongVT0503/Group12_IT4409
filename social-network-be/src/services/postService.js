const { v4: uuidv4 } = require('uuid');
const postRepo = require('../repositories/post.repository');
const notificationRepo = require('../repositories/notification.repository');

async function createPost({ authorId, content, media, privacy }) {
  const id = uuidv4();
  const result = await postRepo.createPost({ id, authorId, content, media, privacy });
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

async function likePost(userId, postId) {
  await postRepo.likePost(userId, postId);
  const post = await postRepo.getPostById(postId);
  if (post && post.author) {
    const notif = {
      id: require('uuid').v4(),
      userId: post.author.id,
      type: 'like',
      data: JSON.stringify({ from: userId, postId })
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

module.exports = { createPost, getPost, deletePost, getFeed, likePost, unlikePost, countLikes };