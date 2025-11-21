const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/postController');
const auth = require('../middlewares/authMiddleware.js');

router.get('/', ctrl.getFeed);
router.get('/:id', ctrl.getPost);
router.post('/', auth, ctrl.createPost);
router.delete('/:id', auth, ctrl.deletePost);
router.post('/:id/like', auth, ctrl.likePost);
router.delete('/:id/like', auth, ctrl.unlikePost);
router.get('/:id/likes', ctrl.countLikes);

router.post('/', verifyToken, createPost);
router.delete('/:id', verifyToken, deletePost);

module.exports = router;
