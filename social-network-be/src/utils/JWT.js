import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || 3600; // seconds

export function signAccessToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: Number(EXPIRES_IN) });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, SECRET);
}
