import express from "express";
import * as ctrl from "../controllers/postController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import multer from 'multer';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", ctrl.getFeed);
router.get("/:id", ctrl.getPost);
router.post("/", verifyToken, upload.array('files', 10), ctrl.createPost);
router.delete("/:id", verifyToken, ctrl.deletePost);
router.post("/:id/share", verifyToken, ctrl.sharePost); //share - repost
router.post("/:id/like", verifyToken, ctrl.likePost);
router.delete("/:id/like", verifyToken, ctrl.unlikePost);
router.get("/:id/likes", ctrl.countLikes);
router.get("/user/:userId", ctrl.getUserPosts); // Lấy bài viết của người dùng
router.put("/:id", verifyToken, ctrl.editPost);
router.post("/:id/save", verifyToken, ctrl.savePost);
router.delete("/:id/save", verifyToken, ctrl.unsavePost);
router.get("/saved/all", verifyToken, ctrl.getSavedPosts); // Xem danh sách đã lưu
export default router;
