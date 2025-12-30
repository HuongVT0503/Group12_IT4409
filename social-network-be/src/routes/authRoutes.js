import express from 'express';
//import passport from 'passport';
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

export default router;

