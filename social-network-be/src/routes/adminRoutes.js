import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';

const router = express.Router();
router.use(verifyToken, isAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/ban', adminController.handleBan);
router.get('/reports', adminController.getReportList);
router.get('/posts/:id', adminController.getPostDetail);
router.delete('/posts/:id', adminController.deletePost);
router.delete('/reports/:reportId', adminController.dismissReport);

export default router;
