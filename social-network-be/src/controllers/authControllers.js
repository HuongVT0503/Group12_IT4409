import * as authService from '../services/authService.js';
import * as oauthService from '../services/oauthService.js';

export async function registerUser(req, res, next) {
    try {
        const { username, email, password, display_name, date_of_birth, gender, phone } = req.body;
            if (!username || !email || !password) {
            return res.status(400).json({ message: 'Thiếu thông tin đăng ký!' });
        }

            const user = await authService.register({ username, email, password, display_name, date_of_birth, gender, phone });
        res.status(201).json({ message: 'Đăng ký thành công!', user });
    } catch (err) {
        next(err);
    }
}

export async function loginUser(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu!' });
        }

        const result = await authService.login({ email, password });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function refreshToken(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Thiếu refresh token!' });
        }

        const result = await authService.refresh({ refreshToken });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function logoutUser(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Thiếu refresh token!' });
        }

        await authService.logout({ refreshToken });
        res.status(200).json({ message: 'Đăng xuất thành công!' });
    } catch (err) {
        next(err);
    }
}

export async function googleCallback(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Xác thực Google thất bại' });
        }

        const user = await oauthService.handleGoogleAuth(req.user);
        const tokens = await oauthService.generateTokens(user);

        const redirectUrl = `${process.env.FRONTEND_URL}/auth/oauth-success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&userId=${user.id}`;
        res.redirect(redirectUrl);
    } catch (err) {
        next(err);
    }
}

export async function facebookCallback(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Xác thực Facebook thất bại' });
        }

        const user = await oauthService.handleFacebookAuth(req.user);
        const tokens = await oauthService.generateTokens(user);

        const redirectUrl = `${process.env.FRONTEND_URL}/auth/oauth-success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&userId=${user.id}`;
        res.redirect(redirectUrl);
    } catch (err) {
        next(err);
    }
}

export async function getOAuthProfile(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Không được xác thực' });
        }

        res.status(200).json({ 
            user: req.user,
            message: 'Thông tin hồ sơ OAuth' 
        });
    } catch (err) {
        next(err);
    }
}

