const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/commentController');
const auth = require('../middlewares/authMiddleware');

router.get('/posts/:postId', ctrl.getComments);
router.post('/posts/:postId', auth, ctrl.createComment);

module.exports = router;
