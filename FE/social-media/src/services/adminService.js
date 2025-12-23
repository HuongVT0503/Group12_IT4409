import api from "./api";

//stats is only count
export const getAdminStats = async () => {
  return await api.get("/admin/stats");
};

export const getAllUsers = async (filter = "all") => {
  //filter can be 'all', 'active', 'banned'
  return await api.get(`/admin/users?status=${filter}`);
};

export const banUser = async (userId, isBanned) => {
  return await api.patch(`/admin/users/${userId}/ban`, { isBanned });
};

export const getReports = async () => {
  return await api.get("/admin/reports");
};

export const dismissReport = async (reportId) => {
  return await api.delete(`/admin/reports/${reportId}`);
};

//
export const getAdminPostDetail = async (postId) => {
  return await api.get(`/admin/posts/${postId}`);
};

export const adminDeletePost = async (postId) => {
  return await api.delete(`/admin/posts/${postId}`);
};