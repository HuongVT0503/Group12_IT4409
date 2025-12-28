import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import * as userRepo from '../repositories/userRepository.js';
import * as tokenRepo from '../repositories/tokenRepository.js';

import { sha256 } from '../utils/hash.js';
import { signAccessToken } from '../utils/JWT.js';

const SALT_ROUNDS = 10;

export async function register({ username, email, password, display_name, date_of_birth, gender, phone }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw { status: 400, message: 'Email already in use' };

  const usernameExist = await userRepo.findByUsername(username);
  if (usernameExist) throw { status: 400, message: 'Username already in use' };

  const id = uuidv4();
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  return await userRepo.createUser({
    id,
    username,
    email,
    password_hash,
    display_name,
    date_of_birth,
    gender,
    phone
  });
}

export async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw { status: 401, message: 'Invalid credentials' };

  // Kiểm tra tài khoản bị ban
  if (user.isBanned === true) {
    throw { status: 403, message: 'Your account has been locked' };
  }

  const ok = await bcrypt.compare(password, user.password_hash || '');
  if (!ok) throw { status: 401, message: 'Invalid credentials' };

  const accessToken = signAccessToken({ sub: user.id, id: user.id, role: user.role || 'user' });
  const rawRefresh = uuidv4() + '.' + uuidv4();
  const tokenHash = sha256(rawRefresh);

  const expiresAt = new Date(
    Date.now() +
      (Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30) * 24 * 3600 * 1000)
  ).toISOString();

  await tokenRepo.saveRefreshToken(user.id, tokenHash, expiresAt);

  return { 
    user, 
    accessToken, 
    refreshToken: rawRefresh,
    expiresAt 
  };
}

export async function refresh({ refreshToken }) {
  const hash = sha256(refreshToken);
  const stored = await tokenRepo.findRefreshToken(hash);
  if (!stored) throw { status: 401, message: 'Invalid refresh token' };

  if (new Date() > new Date(stored.expiresAt)) {
    throw { status: 401, message: 'Refresh token expired' };
  }

  const user = await userRepo.findById(stored.user_id || stored.userId);
  if (!user) throw { status: 401, message: 'User not found' };

  // Kiểm tra tài khoản bị ban
  if (user.isBanned === true) {
      throw { status: 403, message: 'Your account has been locked' };
  }
  const accessToken = signAccessToken({ sub: user.id, id: user.id, role: user.role || 'user' });

  const newRawRefresh = uuidv4() + '.' + uuidv4();
  const newTokenHash = sha256(newRawRefresh);
  const newExpiresAt = new Date(Date.now() + (Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30) * 24 * 3600 * 1000)).toISOString();

  await tokenRepo.revokeRefreshToken(hash);
  await tokenRepo.saveRefreshToken(user.id, newTokenHash, newExpiresAt);
  return { accessToken, user, refreshToken: newRawRefresh }
}

export async function logout({ refreshToken }) {
  const hash = sha256(refreshToken);
  await tokenRepo.revokeRefreshToken(hash);
}

export async function changePassword({ userId, oldPassword, newPassword }) {
  const user = await userRepo.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };

  if (!user.password_hash) throw { status: 400, message: 'This account does not have a password set' };

  const ok = await bcrypt.compare(oldPassword, user.password_hash || '');
  if (!ok) throw { status: 401, message: 'Old password is incorrect' };

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const updated = await userRepo.updateProfile(userId, { password_hash: newHash });
  return updated;
}
