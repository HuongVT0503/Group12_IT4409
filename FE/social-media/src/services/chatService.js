import api from './api';

export const getConversations = async () => {
  return await api.get('/chat');
};

export const getMessages = async (conversationId, offset = 0) => {
  return await api.get(`/chat/${conversationId}/messages?limit=20&offset=${offset}`);
};

export const sendMessage = async (receiverId, content, mediaUrl=null) => {
  return await api.post('/chat/send', { receiverId, content, mediaUrl });
};

export const getOrCreateConversation = async (userId) => {
  return await api.get(`/chat/conversation/${userId}`);
};

export const getUnreadCount = async () => {
  return await api.get('/chat/unread/count');
};

export const searchMessages = async (conversationId, query) => {
  return await api.get(`/chat/search/${conversationId}?q=${query}`);
};