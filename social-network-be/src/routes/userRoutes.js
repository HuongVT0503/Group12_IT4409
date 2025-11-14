const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/:id', ctrl.getProfile);
router.put('/me', auth, ctrl.updateProfile);
router.post('/:id/follow', auth, ctrl.follow);
router.delete('/:id/follow', auth, ctrl.unfollow);
router.get('/:id/followers', ctrl.getFollowers);
router.get('/:id/following', ctrl.getFollowing);

module.exports = router;
