import express from 'express';
import * as ctrl from '../controllers/userController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/search', ctrl.searchUsers);
router.get('/:id', ctrl.getProfile);
router.put('/me', verifyToken, ctrl.updateProfile);
router.post('/:id/follow', verifyToken, ctrl.follow);
router.delete('/:id/follow', verifyToken, ctrl.unfollow);
router.get('/:id/followers', ctrl.getFollowers);
router.get('/:id/following', ctrl.getFollowing);
router.post('/report', verifyToken, ctrl.submitReport);

export default router;
