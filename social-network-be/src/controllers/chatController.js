import * as chatService from "../services/chatService.js";
import { 
  emitMessage,
  emitMessageRead,
  emitTypingIndicator,
  emitNotification
} from "../services/realtimeService.js";
import * as notificationRepo from "../repositories/notificationRepository.js";
import { v4 as uuidv4 } from "uuid";


async function getConversations(req, res, next) {
  try {
    const userId = req.user.id;
    const conversations = await chatService.getUserConversations(userId);
    
    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
}

async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;
    
    const conversation = await chatService.findConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }
    
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    
    const messages = await chatService.getConversationMessages(
      conversationId,
      parseInt(limit),
      parseInt(offset)
    );
    
    await chatService.markConversationAsRead(conversationId, userId);
    
    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { receiverId, content, mediaUrl } = req.body;
    const senderId = req.user.id;
    
    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: receiverId, content",
      });
    }
    
    const result = await chatService.sendMessage(
      senderId,
      receiverId,
      content,
      mediaUrl || null
    );
    
    emitMessage(receiverId, {
      conversationId: result.conversationId,
      message: result.message,
      sender: result.sender,
    });

    const notifId = uuidv4();
    const notifData = {
      from: senderId,
      conversationId: result.conversationId,
      messageId: result.message.id,
      content: content,
    };

    await notificationRepo.createNotification({
      id: notifId,
      userId: receiverId,
      type: "chat",
      data: JSON.stringify(notifData),
    });

    // Emit notis real-time
    emitNotification(receiverId, {
      id: notifId,
      type: "chat",
      created_at: new Date().toISOString(),
      read: false,
      data: notifData,
    });
    
    res.status(201).json({
      success: true,
      message: result.message,
      conversationId: result.conversationId,
    });
  } catch (error) {
    next(error);
  }
}

async function markMessageAsRead(req, res, next) {
  try {
    const { messageId } = req.params;
    const { conversationId } = req.body;
    
    const message = await chatService.markMessageAsRead(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Emit message read event to conversation participants
    if (conversationId) {
      emitMessageRead(conversationId, messageId);
    }
    
    res.json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    const deleted = await chatService.deleteMessage(messageId, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found or access denied",
      });
    }
    
    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;
    const unreadCount = await chatService.getUnreadMessageCount(userId);
    
    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

async function getOrCreateConversation(req, res, next) {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user.id;
    
    if (currentUserId === otherUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot create conversation with yourself",
      });
    }
    
    const conversation = await chatService.getOrCreateConversation(
      currentUserId,
      otherUserId
    );
    
    if (!conversation) {
      return res.status(500).json({
        success: false,
        message: "Error creating conversation",
      });
    }
    
    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
}

export {
  getConversations,
  getMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount,
  getOrCreateConversation,
};
