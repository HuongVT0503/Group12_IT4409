import * as notificationService from '../services/notificationService.js';
import { emitNotificationRead } from '../services/realtimeService.js';

async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const data = await notificationService.getNotifications(userId, req.query.limit || 50);
    res.json({ data });
  } catch (err) { next(err); }
}

async function markAsRead(req, res, next) {
  try {
    const id = req.params.id;
    await notificationService.markAsRead(id);

    //Emit realtime
    const userId = req.user.id;
    emitNotificationRead(userId, id);

    res.status(204).send();
  } catch (err) { next(err); }
}

export { getNotifications, markAsRead };
