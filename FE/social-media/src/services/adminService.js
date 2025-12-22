import api from "./api";

export const getAdminStats = async () => {
  return await api.get("/admin/stats");
};

export const getAllUsers = async () => {
  return await api.get("/admin/users");
};

export const banUser = async (userId, isBanned) => {
  return await api.patch(`/admin/users/${userId}/ban`, { isBanned });
};

export const getReports = async () => {
  return await api.get("/admin/reports");
};

export const deletePost = async (postId) => {
  return await api.delete(`/admin/posts/${postId}`);
};

export const dismissReport = async (reportId) => {
  return await api.delete(`/admin/reports/${reportId}`);
};
