require('dotenv').config();
const http = require('http');
const app = require('./src/app'); // Imports the app we just exported
const { socketAuthMiddleware } = require('./src/middlewares/socketMiddleware');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Cấu hình Socket.io
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

exports = { io };

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