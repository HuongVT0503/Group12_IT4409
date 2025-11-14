const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/comment.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/posts/:postId', ctrl.getComments);
router.post('/posts/:postId', auth, ctrl.createComment);

module.exports = router;
