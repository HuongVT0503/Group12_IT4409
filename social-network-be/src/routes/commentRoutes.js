import express from 'express';
import * as ctrl from '../controllers/commentController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/posts/:postId', ctrl.getComments);
router.post('/posts/:postId', verifyToken, upload.array('files', 4), ctrl.createComment);
router.delete('/:commentId', verifyToken, ctrl.deleteComment);

export default router;
