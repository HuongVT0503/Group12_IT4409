import { io } from '../../server.js';

export function emitNotification(userId, payload) {
    io.to(userId).emit('notification', payload);
}

export function emitNewPost(post, followers = []) {
    followers.forEach(followerId => {
        io.to(followerId).emit('new_post', post);
    });
}

export function emitPostUpdate(postId, payload) {
    io.to(`post_${postId}`).emit('post_update', payload);
}

export function emitFollowUpdate(followeeId, payload) {
    io.to(followeeId).emit('follow_update', payload);
}

export function emitNotificationRead(userId, notificationId) {
    io.to(userId).emit('notification_read', { id: notificationId });
}
