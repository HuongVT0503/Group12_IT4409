import express from 'express';
import * as ctrl from '../controllers/commentController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/posts/:postId', ctrl.getComments);
router.post('/posts/:postId', verifyToken, ctrl.createComment);
router.delete('/:commentId', verifyToken, ctrl.deleteComment);
router.put('/:commentId', verifyToken, ctrl.editComment);

export default router;
