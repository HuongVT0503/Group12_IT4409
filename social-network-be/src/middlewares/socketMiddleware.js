import jwt from 'jsonwebtoken';

export function socketAuthMiddleware(socket, next) {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication error'));

        socket.user = jwt.verify(token, process.env.SECRET_KEY);
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
}
