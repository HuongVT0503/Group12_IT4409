const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/commentController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/posts/:postId', ctrl.getComments);
router.post('/posts/:postId', verifyToken, ctrl.createComment);

module.exports = router;
