const notificationRepo = require('../repositories/notificationRepository');

async function getNotifications(userId, limit) {
  return await notificationRepo.getNotifications(userId, limit);
}

async function markAsRead(notificationId) {
  await notificationRepo.markAsRead(notificationId);
}

module.exports = { getNotifications, markAsRead };
