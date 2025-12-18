//import { io } from '../../server.js';

let io; //local var

export const setIO = (socketInstance) => {
    io = socketInstance;
};

export function emitNotification(userId, payload) {
    io.to(userId).emit('notification', payload);
}

export function emitNewPost(post, followers = []) {
    followers.forEach(followerId => {
        io.to(followerId).emit('new_post', post);
    });
}

export function emitPostUpdate(postId, payload) {
    const postRoomId = `post_${postId}`;
    io.to(postRoomId).emit('post_update', payload);
}

export function emitCommentUpdate(postId, payload) {
    const postRoomId = `post_${postId}`;
    io.to(postRoomId).emit('comment_update', payload);
}

export function emitLikeUpdate(postId, payload) {
    const postRoomId = `post_${postId}`;
    io.to(postRoomId).emit('like_update', payload);
}

export function emitFollowUpdate(followeeId, payload) {
    io.to(followeeId).emit('follow_update', payload);
}

export function emitNotificationRead(userId, notificationId) {
    io.to(userId).emit('notification_read', { id: notificationId });
}
