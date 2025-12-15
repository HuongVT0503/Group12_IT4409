const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.delete('/posts/:id', verifyToken, ctrl.deletePost);

module.exports = router;
