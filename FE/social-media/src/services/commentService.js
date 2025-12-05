import api from './api';

export const getComments = async (postId) => {
  return await api.get(`/comments/posts/${postId}`);
};

export const createComment = async (postId, content) => {
  return await api.post(`/comments/posts/${postId}`, { content });
};