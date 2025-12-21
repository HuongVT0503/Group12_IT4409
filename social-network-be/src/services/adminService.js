import * as adminRepo from '../repositories/adminRepository.js';

// Xem danh sách user/post
export const getDashboardStats = async () => {
    return await adminRepo.getAdminStats();
};

// Lấy danh sách user
export const getAllUsers = async (statusFilter) => {
    return await adminRepo.findAllUsers(statusFilter);
};

// Ban/Unban user
export const toggleUserBan = async (targetUserId, isBanned, currentAdminId) => {
    if (targetUserId === currentAdminId) {
        throw { status: 400, message: "You can't lock yourself up" };
    }
    return await adminRepo.setUserBanStatus(targetUserId, isBanned);
};

// Lấy danh sách report
export const getReports = async () => {
    return await adminRepo.getAllReports();
};

// Xóa bài viết
export const removePost = async (postId) => {
    return await adminRepo.deletePostById(postId);
};

// Xem chi tiết bài viết bị tố cáo
export const getPostDetail = async (postId) => {
    const post = await adminRepo.getPostDetail(postId);
    if (!post) {
        throw { status: 404, message: "That article doesn't exist" };
    }
    return post;
};

// Xóa báo cáo
export const ignoreReport = async (reportId) => {
    const result = await adminRepo.dismissReport(reportId);
    if (!result) {
        throw { status: 404, message: "No report found." };
    }
    return { message: "Ignore report" };
};
