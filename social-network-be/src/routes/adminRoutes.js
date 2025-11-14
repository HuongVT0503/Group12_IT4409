const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const auth = require('../middlewares/auth.middleware');

router.delete('/posts/:id', auth, ctrl.deletePost);

module.exports = router;
