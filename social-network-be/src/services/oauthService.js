import { v4 as uuidv4 } from 'uuid';
import * as userRepo from '../repositories/userRepository.js';
import * as tokenRepo from '../repositories/tokenRepository.js';
import { sha256 } from '../utils/hash.js';
import { signAccessToken } from '../utils/JWT.js';

export async function handleGoogleAuth(profile) {
  try {
    let user = await userRepo.findByGoogleId(profile.id);
    if (user) {
      if (profile.photos && profile.photos[0]) {
        await userRepo.updateOAuthProfile(user.id, 'google', profile.id, profile.photos[0].value);
        user.avatar = profile.photos[0].value;
      }
      return user;
    }
    user = await userRepo.findByEmail(profile.emails[0].value);

    if (user) {
      await userRepo.updateOAuthProfile(user.id, 'google', profile.id, profile.photos?.[0]?.value);
      user.google_id = profile.id;
      if (profile.photos?.[0]) {
        user.avatar = profile.photos[0].value;
      }
      return user;
    }
    const newUser = await userRepo.createOAuthUser({
      id: uuidv4(),
      email: profile.emails[0].value,
      display_name: profile.displayName,
      provider: 'google',
      providerId: profile.id,
      profilePicture: profile.photos?.[0]?.value
    });

    return newUser;
  } catch (error) {
    throw { 
      status: 500, 
      message: 'Error processing Google authentication',
      error: error.message 
    };
  }
}

export async function handleFacebookAuth(profile) {
  try {
    let user = await userRepo.findByFacebookId(profile.id);
    if (user) {
      if (profile.photos && profile.photos[0]) {
        await userRepo.updateOAuthProfile(user.id, 'facebook', profile.id, profile.photos[0].value);
        user.avatar = profile.photos[0].value;
      }
      return user;
    }
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await userRepo.findByEmail(email);
      if (user) {
        await userRepo.updateOAuthProfile(user.id, 'facebook', profile.id, profile.photos?.[0]?.value);
        user.facebook_id = profile.id;
        if (profile.photos?.[0]) {
          user.avatar = profile.photos[0].value;
        }
        return user;
      }
    }

    const newUser = await userRepo.createOAuthUser({
      id: uuidv4(),
      email: email || `fb_${profile.id}@facebook.com`,
      display_name: profile.displayName,
      provider: 'facebook',
      providerId: profile.id,
      profilePicture: profile.photos?.[0]?.value
    });

    return newUser;
  } catch (error) {
    throw { 
      status: 500, 
      message: 'Error processing Facebook authentication',
      error: error.message 
    };
  }
}

export async function generateTokens(user) {
  try {
    if (user.isBanned === true) {
      throw { status: 403, message: 'Your account has been locked' };
    }

    const accessToken = signAccessToken({ 
      sub: user.id, 
      id: user.id, 
      role: user.role || 'user' 
    });

    const rawRefresh = uuidv4() + '.' + uuidv4();
    const tokenHash = sha256(rawRefresh);

    const expiresAt = new Date(
      Date.now() + 
      (Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30) * 24 * 3600 * 1000)
    ).toISOString();

    await tokenRepo.saveRefreshToken(user.id, tokenHash, expiresAt);

    return {
      accessToken,
      refreshToken: rawRefresh,
      expiresAt
    };
  } catch (error) {
    throw error;
  }
}
