import { getSession } from '../config/neo4j.js';

 // Lấy tổng số user và tổng số bài viết
export async function getAdminStats() {
    const session = getSession();
    try {
        const res = await session.run(
            `MATCH (u:User) WITH count(u) as totalUsers
       MATCH (p:Post) RETURN totalUsers, count(p) as totalPosts`
        );
        const record = res.records[0];
        return {
            totalUsers: record.get('totalUsers').low || 0,
            totalPosts: record.get('totalPosts').low || 0
        };
    } finally {
        await session.close();
    }
}

// Lấy danh sách user
export async function findAllUsers(statusFilter = 'all') {
    const session = getSession();
    try {
        let query = `MATCH (u:User) `;
        if (statusFilter === 'banned') query += `WHERE u.isBanned = true `;
        else if (statusFilter === 'active') query += `WHERE u.isBanned = false `;

        query += `RETURN u { .userId, .username, .email, .role, .isBanned, .createdAt } 
                  ORDER BY u.createdAt DESC`;
        const res = await session.run(query);
        return res.records.map(r => r.get('u'));
    } finally {
        await session.close();
    }
}

// Ban/Unban user
export async function setUserBanStatus(userId, isBanned) {
    const session = getSession();
    try {
        const res = await session.run(
            `MATCH (u:User {userId: $userId}) 
       SET u.isBanned = $isBanned 
       RETURN u { .userId, .username, .isBanned }`,
            { userId, isBanned }
        );
        return res.records[0]?.get('u') || null;
    } finally {
        await session.close();
    }
}

// Lấy danh sách báo cáo từ người dùng
export async function getAllReports() {
    const session = getSession();
    try {
        const res = await session.run(
            `MATCH (reporter:User)-[r:REPORTED]->(target)
       RETURN {
         reportId: r.reportId,
         fromUser: reporter.username,
         reason: r.reason,
         createdAt: r.createdAt,
         targetType: labels(target)[0],
         targetId: target.userId || target.postId
       } as reportData ORDER BY r.createdAt DESC`
        );
        return res.records.map(r => r.get('reportData'));
    } finally {
        await session.close();
    }
}

// Admin xóa bài viết vi phạm
export async function deletePostById(postId) {
    const session = getSession();
    try {
        await session.run(
            `MATCH (p:Post {postId: $postId}) 
       DETACH DELETE p`,
            { postId }
        );
        return true;
    } finally {
        await session.close();
    }
}

// Admin xem chi tiết post từ report
export async function getPostDetail(postId) {
    const session = getSession();
    try {
        const res = await session.run(
            `MATCH (u:User)-[:POSTED]->(p:Post {postId: $postId})
             RETURN p {.*, author: u.username}`,
            { postId }
        );
        return res.records[0]?.get('p') || null;
    } finally {
        await session.close();
    }
}

// Admin gỡ 1 báo cáo
export async function dismissReport(reportId) {
    const session = getSession();
    try {
        await session.run(
            `MATCH ()-[r:REPORTED {reportId: $reportId}]->() 
             DELETE r`,
            { reportId }
        );
        return true;
    } finally {
        await session.close();
    }
}