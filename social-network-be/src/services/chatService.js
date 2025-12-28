import { v4 as uuidv4 } from "uuid";
import * as chatRepo from "../repositories/chatRepository.js";

async function getOrCreateConversation(userId1, userId2) {
  const newId = uuidv4();
  const [sortedId1, sortedId2] = [userId1, userId2].sort(); // sort to make sure conversation is the same for both users
  return await chatRepo.getOrCreateConversation(sortedId1, sortedId2, newId);
}

async function getUserConversations(userId) {
  return await chatRepo.getUserConversations(userId);
}

async function sendMessage(senderId, receiverId, content, mediaUrl = null) {
  const sender = await chatRepo.getUserById(senderId);
  if (sender && sender.isBanned === true) {
    throw {
      status: 403,
      message: "You have been banned and cannot send messages",
      code: "USER_BANNED",
    };
  }

  const receiver = await chatRepo.getUserById(receiverId);
  if (receiver && receiver.isBanned === true) {
    throw {
      status: 403,
      message: "This user has been banned and cannot receive messages",
      code: "USER_BANNED",
    };
  }

  let conversation = await chatRepo.findConversationByUsers(
    senderId,
    receiverId
  );

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

  return {
    message: message.message,
    sender: message.sender,
    conversationId: conversation.id,
  };
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
