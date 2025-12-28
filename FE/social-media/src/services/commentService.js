import api from "./api";

export const getComments = async (postId) => {
  return await api.get(`/comments/posts/${postId}`);
};

export const createComment = async (
  postId,
  content,
  parentCommentId = null,
  mediaUrl = null
) => {
  return await api.post(`/comments/posts/${postId}`, {
    content,
    parent_comment_id: parentCommentId,
    media: mediaUrl ? [mediaUrl] : [],
  });
};

export const deleteComment = async (commentId) => {
  return await api.delete(`/comments/${commentId}`);
};

export const likeComment = async (commentId) => {
  return await api.post(`/comments/${commentId}/reactions`, { type: 'like' });
};

export const unlikeComment = async (commentId) => {
  return await api.delete(`/comments/${commentId}/reactions`);
};