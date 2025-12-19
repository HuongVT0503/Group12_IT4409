import express from 'express';
import multer from 'multer';
import { upload as uploadCtrl } from '../controllers/mediaController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', verifyToken, upload.array('files', 10), uploadCtrl);

export default router;
