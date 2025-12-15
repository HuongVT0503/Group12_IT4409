import express from 'express';
import * as ctrl from '../controllers/postController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', ctrl.getFeed);
router.get('/:id', ctrl.getPost);
router.post('/', verifyToken, ctrl.createPost);
router.delete('/:id', verifyToken, ctrl.deletePost);
router.post('/:id/like', verifyToken, ctrl.likePost);
router.delete('/:id/like', verifyToken, ctrl.unlikePost);
router.get('/:id/likes', ctrl.countLikes);

export default router;
