const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, ctrl.getNotifications);
router.patch('/:id/read', verifyToken, ctrl.markAsRead);

module.exports = router;