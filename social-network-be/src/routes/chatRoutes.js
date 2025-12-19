import express from 'express';
import * as chatController from '../controllers/chatController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.get('/', chatController.getConversations);
router.get('/unread/count', chatController.getUnreadCount);
router.get('/conversation/:userId', chatController.getOrCreateConversation);
router.get('/:conversationId/messages', chatController.getMessages);
router.post('/send', chatController.sendMessage);
router.patch('/:messageId/read', chatController.markMessageAsRead);
router.delete('/:messageId', chatController.deleteMessage);

export default router;
