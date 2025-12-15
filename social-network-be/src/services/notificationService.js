import * as notificationRepo from '../repositories/notificationRepository.js';

async function getNotifications(userId, limit) {
  return await notificationRepo.getNotifications(userId, limit);
}

async function markAsRead(notificationId) {
  await notificationRepo.markAsRead(notificationId);
}

export { getNotifications, markAsRead };
