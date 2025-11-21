import postService from '../services/postService.js';

// Tạo bài viết mới
async function createPost(req, res, next) {
    try {
        const authorId = req.user.id; // Lấy từ JWT
        const { content, media, privacy } = req.body;
        const post = await postService.createPost({ authorId, content, media, privacy });
        res.status(201).json({ post });
    } catch (err) {
        next(err);
    }
}

// Lấy bài viết theo id
async function getPost(req, res, next) {
    try {
        const id = req.params.id;
        const post = await postService.getPost(id);
        if (!post) return res.status(404).json({ message: "Post not found" });
        res.json({ post });
    } catch (err) {
        next(err);
    }
}

// Xóa bài viết
async function deletePost(req, res, next) {
    try {
        const id = req.params.id;
        const userId = req.user.id; // Lấy từ JWT
        await postService.deletePost(id, userId);
        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        next(err);
    }
}

// Lấy feed
async function getFeed(req, res, next) {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const posts = await postService.getFeed(limit);
        res.json({ posts });
    } catch (err) {
        next(err);
    }
}

// Like bài viết
async function likePost(req, res, next) {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const result = await postService.likePost(userId, postId);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

// Unlike bài viết
async function unlikePost(req, res, next) {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const result = await postService.unlikePost(userId, postId);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

// Lấy số lượt like của bài viết
async function countLikes(req, res, next) {
    try {
        const postId = req.params.id;
        const count = await postService.countLikes(postId);
        res.json({ likes_count: count });
    } catch (err) {
        next(err);
    }
}

export default { createPost, getPost, deletePost, getFeed, likePost, unlikePost, countLikes };
