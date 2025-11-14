const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/post.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', ctrl.getFeed);
router.get('/:id', ctrl.getPost);
router.post('/', auth, ctrl.createPost);
router.delete('/:id', auth, ctrl.deletePost);
router.post('/:id/like', auth, ctrl.likePost);
router.delete('/:id/like', auth, ctrl.unlikePost);

module.exports = router;
