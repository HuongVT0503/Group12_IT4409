const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware'); 

router.get('/:id', ctrl.getProfile);
router.put('/me', verifyToken, ctrl.updateProfile);
router.post('/:id/follow', verifyToken, ctrl.follow); 
router.delete('/:id/follow', verifyToken, ctrl.unfollow);
router.get('/:id/followers', ctrl.getFollowers);
router.get('/:id/following', ctrl.getFollowing);

module.exports = router;