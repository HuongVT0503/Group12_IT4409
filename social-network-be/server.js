import app from './src/app.js';
import dotenv from 'dotenv';
//import http from 'http';
import { socketAuthMiddleware } from './src/middlewares/socketMiddleware.js';
import { Server } from 'socket.io';

dotenv.config();
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Cấu hình Socket.io
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

export { io };
io.use(socketAuthMiddleware);

// Socket.io
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => console.log(`Server running on ${PORT}`));