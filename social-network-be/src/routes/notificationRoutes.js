const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notification.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', auth, ctrl.getNotifications);
router.patch('/:id/read', auth, ctrl.markAsRead);

module.exports = router;
