import authService from '../services/authService.js';

export async function registerUser(req, res, next) {
    try {
        const { username, email, password, display_name } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Thiếu thông tin đăng ký!' });
        }

        const user = await authService.register({ username, email, password, display_name });
        res.status(201).json({ message: 'Đăng ký thành công!', user });
    } catch (err) {
        console.error('Register error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server' });
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
        console.error('Login error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server' });
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
        console.error('Refresh token error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server' });
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
        console.error('Logout error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server' });
    }
}
