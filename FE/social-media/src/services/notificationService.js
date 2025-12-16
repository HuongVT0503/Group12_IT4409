import api from './api';

export const getNotifications = async (limit = 20) => {
  //GET /api/v1/notifications
  return await api.get(`/notifications?limit=${limit}`);
};

export const markAsRead = async (id) => {
  //PATCH /api/v1/notifications/:id/read
  return await api.patch(`/notifications/${id}/read`);
};