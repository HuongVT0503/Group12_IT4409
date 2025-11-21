const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware');

router.get('/:id', ctrl.getProfile);
router.put('/me', auth, ctrl.updateProfile);
router.post('/:id/follow', auth, ctrl.follow);
router.delete('/:id/follow', auth, ctrl.unfollow);
router.get('/:id/followers', ctrl.getFollowers);
router.get('/:id/following', ctrl.getFollowing);

module.exports = router;
