let io;

function getIo() {
    if (!io) {
        io = require('../../server').io;
    }
    return io;
}

function emitNotification(userId, payload) {
    const socketIo = getIo();
    if (socketIo) socketIo.to(userId).emit('notification', payload);
}

function emitNewPost(post, followers = []) {
    const socketIo = getIo();
    if (socketIo) {
        followers.forEach(followerId => {
            socketIo.to(followerId).emit('new_post', post);
        });
    }
}

function emitPostUpdate(postId, payload) {
    const socketIo = getIo();
    if (socketIo) socketIo.to(`post_${postId}`).emit('post_update', payload);
}

function emitFollowUpdate(followeeId, payload) {
    const socketIo = getIo();
    if (socketIo) socketIo.to(followeeId).emit('follow_update', payload);
}

function emitNotificationRead(userId, notificationId) {
    const socketIo = getIo();
    if (socketIo) socketIo.to(userId).emit('notification_read', { id: notificationId });
}

module.exports = { 
    emitNotification, 
    emitNewPost, 
    emitPostUpdate, 
    emitFollowUpdate, 
    emitNotificationRead 
};