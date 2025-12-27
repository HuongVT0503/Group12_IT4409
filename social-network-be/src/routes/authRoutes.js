import express from 'express';
import passport from 'passport';
import { 
    registerUser, 
    loginUser, 
    refreshToken, 
    logoutUser,
    googleCallback,
    facebookCallback,
    getOAuthProfile,
    changePassword
} from '../controllers/authControllers.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', logoutUser);

router.post('/change-password', verifyToken, changePassword);

router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed` }),
    googleCallback
);

router.get(
    '/facebook',
    passport.authenticate('facebook', { scope: ['public_profile', 'email'] })
);

router.get(
    '/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=facebook_auth_failed` }),
    facebookCallback
);

router.get('/oauth/profile', getOAuthProfile);

export default router;

