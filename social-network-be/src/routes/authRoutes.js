import express from "express";
import { registerUser, loginUser, socialLogin } from "../controllers/authControllers.js";

const router = express.Router();

// ===== ĐĂNG KÝ TÀI KHOẢN MỚI =====
router.post("/register", async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!username || !password || (!email && !phone)) {
            return res.status(400).json({ message: "Thiếu thông tin đăng ký!" });
        }

        const result = await registerUser({ username, email, phone, password });
        res.status(201).json(result);
    } catch (err) {
        console.error("Lỗi khi đăng ký:", err.message);
        res.status(400).json({ message: err.message });
    }
});

// ===== ĐĂNG NHẬP (EMAIL HOẶC SĐT) =====
router.post("/login", async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Kiểm tra thông tin đăng nhập
        if (!identifier || !password) {
            return res.status(400).json({ message: "Sai thông tin tài khoản hoặc mật khẩu!" });
        }

        const result = await loginUser({ identifier, password });
        res.status(200).json(result);
    } catch (err) {
        console.error("Lỗi khi đăng nhập:", err.message);
        res.status(400).json({ message: err.message });
    }
});

// ===== ĐĂNG NHẬP QUA MẠNG XÃ HỘI (FB / GOOGLE) =====
router.post("/social-login", async (req, res) => {
    try {
        const { provider, socialId, username, email } = req.body;

        // Kiểm tra dữ liệu mạng xã hội
        if (!provider || !socialId) {
            return res.status(400).json({ message: "Thiếu thông tin mạng xã hội!" });
        }

        const result = await socialLogin({ provider, socialId, username, email });
        res.status(200).json(result);
    } catch (err) {
        console.error("Lỗi khi đăng nhập mạng xã hội:", err.message);
        res.status(400).json({ message: err.message });
    }
});

export default router;
