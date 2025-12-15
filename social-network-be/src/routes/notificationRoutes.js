const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const auth = require('../middlewares/authMiddleware');

router.get('/', auth, ctrl.getNotifications);
router.patch('/:id/read', auth, ctrl.markAsRead);

module.exports = router;
