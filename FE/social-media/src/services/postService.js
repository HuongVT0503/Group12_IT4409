//getPosts,createPost,updatePost,deletePost,likePost,unlikePost


import api from './api';

export const getFeed = async (limit = 20) => {
  //be returns { posts: [...] }
  return await api.get(`/posts?limit=${limit}`);
};

export const createPost = async (content, mediaUrl = null) => {
  //be expects: { content, media: [], privacy }
  return await api.post('/posts', {
    content,
    media: mediaUrl ? [mediaUrl] : [],
    privacy: 'public'
  });
};

export const likePost = async (postId) => {
  return await api.post(`/posts/${postId}/like`);
};

export const unlikePost = async (postId) => {
  return await api.delete(`/posts/${postId}/like`);
};

export const deletePost = async (postId) => {
  return await api.delete(`/posts/${postId}`);
};

export const getPostLikes = async (postId) => {
  return await api.get(`/posts/${postId}/likes`);
}