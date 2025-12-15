import express from 'express';
import * as ctrl from '../controllers/notificationController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, ctrl.getNotifications);
router.patch('/:id/read', verifyToken, ctrl.markAsRead);

export default router;
