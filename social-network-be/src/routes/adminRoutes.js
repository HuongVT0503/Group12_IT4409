import express from 'express';
import ctrl from '../controllers/adminController.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.delete('/posts/:id', auth, ctrl.deletePost);

export default router;
