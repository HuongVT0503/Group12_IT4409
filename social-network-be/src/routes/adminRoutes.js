const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const auth = require('../middlewares/authMiddleware');

router.delete('/posts/:id', auth, ctrl.deletePost);

module.exports = router;
