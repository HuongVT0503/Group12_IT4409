require('dotenv').config();
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || 3600; // seconds

function signAccessToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: Number(EXPIRES_IN) });
}

function verifyAccessToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signAccessToken, verifyAccessToken };
