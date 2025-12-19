import { v4 as uuidv4 } from "uuid";
import * as chatRepo from "../repositories/chatRepository.js";

async function getOrCreateConversation(userId1, userId2) {
  const newId = uuidv4();
  return await chatRepo.getOrCreateConversation(userId1, userId2, newId);
}

async function getUserConversations(userId) {
  return await chatRepo.getUserConversations(userId);
}

async function sendMessage(senderId, receiverId, content, mediaUrl = null) {
  let conversation = await chatRepo.findConversationByUsers(senderId, receiverId);
  
  if (!conversation) {
    conversation = await chatRepo.getOrCreateConversation(senderId, receiverId);
  }
  
  if (!conversation) {
    throw new Error("Cannot create or find conversation");
  }
  
  const messageId = uuidv4();
  const message = await chatRepo.createMessage({
    id: messageId,
    conversationId: conversation.id,
    senderId,
    content,
    mediaUrl,
  });
  
  return { message: message.message, sender: message.sender, conversationId: conversation.id };
}

async function getConversationMessages(conversationId, limit = 50, offset = 0) {
  return await chatRepo.getConversationMessages(conversationId, limit, offset);
}

async function markMessageAsRead(messageId) {
  return await chatRepo.markMessageAsRead(messageId);
}

async function markConversationAsRead(conversationId, userId) {
  return await chatRepo.markConversationAsRead(conversationId, userId);
}

async function deleteMessage(messageId, userId) {
  return await chatRepo.deleteMessage(messageId, userId);
}

async function getUnreadMessageCount(userId) {
  return await chatRepo.getUnreadMessageCount(userId);
}

async function findConversationById(conversationId) {
  return await chatRepo.findConversationById(conversationId);
}

async function findConversationByUsers(userId1, userId2) {
  return await chatRepo.findConversationByUsers(userId1, userId2);
}

export {
  getOrCreateConversation,
  getUserConversations,
  sendMessage,
  getConversationMessages,
  markMessageAsRead,
  markConversationAsRead,
  deleteMessage,
  getUnreadMessageCount,
  findConversationById,
  findConversationByUsers,
};
