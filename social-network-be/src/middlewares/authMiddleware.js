import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();

export function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Thiếu token!' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Token không hợp lệ!' });
        req.user = decoded;
        next();
    });
}


