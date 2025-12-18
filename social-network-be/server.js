import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';

import app from './src/app.js';
import { socketAuthMiddleware } from './src/middlewares/socketMiddleware.js';
import { setIO } from './src/services/realtimeService.js';

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

setIO(io);

export { io };

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id, 'User:', socket.user?.id);

    // Join user's personal room
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined personal room`);
    });

    socket.on('join_post', (postId) => {
        const postRoomId = `post_${postId}`;
        socket.join(postRoomId);
        console.log(`Socket ${socket.id} (User: ${socket.user?.id}) joined post room: ${postRoomId}`);
    });

    socket.on('leave_post', (postId) => {
        const postRoomId = `post_${postId}`;
        socket.leave(postRoomId);
        console.log(`Socket ${socket.id} (User: ${socket.user?.id}) left post room: ${postRoomId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
