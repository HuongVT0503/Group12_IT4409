import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import * as userRepo from '../repositories/userRepository.js';
import * as tokenRepo from '../repositories/tokenRepository.js';

import { sha256 } from '../utils/hash.js';
import { signAccessToken } from '../utils/JWT.js';

const SALT_ROUNDS = 10;

export async function register({ username, email, password, display_name }) {
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
    display_name
  });
}

export async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw { status: 401, message: 'Invalid credentials' };

  const ok = await bcrypt.compare(password, user.password_hash || '');
  if (!ok) throw { status: 401, message: 'Invalid credentials' };

  const accessToken = signAccessToken({ sub: user.id });
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

  // TODO: Check expiry here
  const user = await userRepo.findById(stored.user_id || stored.userId);
  if (!user) throw { status: 401, message: 'User not found' };

  const accessToken = signAccessToken({ sub: user.id });

  return { accessToken, user };
}

export async function logout({ refreshToken }) {
  const hash = sha256(refreshToken);
  await tokenRepo.revokeRefreshToken(hash);
}
