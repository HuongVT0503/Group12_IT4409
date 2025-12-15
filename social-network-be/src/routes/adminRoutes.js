import express from 'express';
import { deletePost } from '../controllers/adminController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.delete('/posts/:id', verifyToken, deletePost);

export default router;
