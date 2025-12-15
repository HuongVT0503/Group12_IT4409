const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/postController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', ctrl.getFeed);
router.get('/:id', ctrl.getPost);
router.post('/', verifyToken, ctrl.createPost);
router.delete('/:id', verifyToken, ctrl.deletePost);
router.post('/:id/like', verifyToken, ctrl.likePost);
router.delete('/:id/like', verifyToken, ctrl.unlikePost);
router.get('/:id/likes', ctrl.countLikes);

module.exports = router;