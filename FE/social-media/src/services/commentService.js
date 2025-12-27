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
    media: mediaUrl ? [mediaUrl] : [], // Assuming BE accepts 'media' array or similar
  });
};

export const deleteComment = async (commentId) => {
  return await api.delete(`/comments/${commentId}`);
};
