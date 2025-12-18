import api from './api';

export const getProfile = async (idOrUsername) => {
  //if no ID ("me", my profile) be/logic?
  return await api.get(`/users/${idOrUsername}`);
};

export const updateProfile = async (data) => {
  return await api.put('/users/me', data);
};

export const followUser = async (userId) => {
  return await api.post(`/users/${userId}/follow`);
};

export const unfollowUser = async (userId) => {
  return await api.delete(`/users/${userId}/follow`);
};

export const getFollowers = async (userId) => {
  return await api.get(`/users/${userId}/followers`);
};


export const getFollowing = async (userId) => {
  return await api.get(`/users/${userId}/following`);
};


export const searchUsers = async (query) => {
  return await api.get(`/users/search?q=${query}`);
};