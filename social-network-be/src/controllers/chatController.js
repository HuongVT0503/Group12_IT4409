import * as chatService from "../services/chatService.js";
import { 
  emitMessage,
  emitMessageRead,
  emitTypingIndicator,
  emitNotification
} from "../services/realtimeService.js";
import {v4 as uuidv4} from "uuid";
import * as notificationRepo from "../repositories/notificationRepository.js";
import { saveFileFromBuffer } from '../services/mediaService.js';

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
    
    const unreadNotis = await notificationRepo.getUnreadNotificationsByType(userId, 'new_message');

    const relatedNotis = unreadNotis.filter(n => {
        try {
            const data = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
            return data.conversationId === conversationId;
        } catch (e) { return false; }
    });

    await Promise.all(relatedNotis.map(n => notificationRepo.markAsRead(n.id)));

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
    const { receiverId, content } = req.body;
    let mediaUrl = req.body.mediaUrl || null;
    if (req.files && req.files.length) {
      const f = req.files[0];
      const s = await saveFileFromBuffer({ buffer: f.buffer, originalname: f.originalname });
      mediaUrl = s.url;
    }
    const senderId = req.user.id;
    
    if (!receiverId || (!content && !mediaUrl)) {
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

    //notif Logic
    //is there ALREADY an unread noti from this sender
    const unreadNotis = await notificationRepo.getUnreadNotificationsByType(receiverId, 'new_message');
    
    //is any unread notification from the current sender
    const alreadyHasNoti = unreadNotis.some(n => {
        try {
            const data = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
            return data.from === senderId;
        } catch (e) {
            return false;
        }
    });

    //ONLY create notification if 1 doesn't already exist (or has been read)
    if (!alreadyHasNoti) {
        const notifId = uuidv4();
        const notifData = {
            from: senderId,
            text: "sent you a message",
            senderName: result.sender.display_name,
            senderAvatar: result.sender.avatar_url,
            conversationId: result.conversationId
        };

        await notificationRepo.createNotification({
            id: notifId,
            userId: receiverId,
            type: "new_message",
            data: JSON.stringify(notifData)
        });

        emitNotification(receiverId, {
            id: notifId,
            type: "new_message",
            created_at: new Date().toISOString(),
            read: false,
            data: notifData
        });
    }
    
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
    
    const message = await chatService.markMessageAsRead(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
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
