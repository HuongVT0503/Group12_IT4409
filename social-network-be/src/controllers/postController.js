import { v4 as uuidv4 } from "uuid";
import driver from "../config/neo4j.js";

// Đóng session an toàn
async function safeClose(session) {
    try {
        await session.close();
    } catch (e) {
    }
}

// ================= POSTS ================= //

// Tạo bài viết mới
export async function createPost({ userId, text = "", imageUrl = null }) {
    const session = driver.session();
    try {
        const id = uuidv4();
        const query = `
      MATCH (u:User {id: $userId})
      CREATE (p:Post {
        id: $id,
        text: $text,
        imageUrl: $imageUrl,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      CREATE (u)-[:POSTED]->(p)
      RETURN p
    `;
        const res = await session.run(query, { userId, id, text, imageUrl });

        /* Tag bạn bè
        for (const mentionedId of mentionedUserIds) {
            await session.run(`
        MATCH (p:Post {id:$postId}), (m:User {id:$mentionedId})
        CREATE (p)-[:MENTIONED]->(m)
      `, { postId: id, mentionedId });
        }
        */
        return res.records[0].get("p").properties;
    } finally {
        await safeClose(session);
    }
}

// Lấy bài viết theo id (cả số lượng like và comment)
export async function getPost({ postId }) {
    const session = driver.session();
    try {
        const query = `
      MATCH (p:Post {id: $postId})
      OPTIONAL MATCH (p)<-[:POSTED]-(author:User)
      OPTIONAL MATCH (c:Comment)-[:ON]->(p)
      RETURN p, author,
        size((p)<-[:LIKED]-()) AS likes,
        count(c) AS comments
    `;
        const res = await session.run(query, { postId });
        if (res.records.length === 0) return null;
        const rec = res.records[0];
        const p = rec.get("p").properties;
        const author = rec.get("author") ? rec.get("author").properties : null;
        const likes = rec.get("likes").toNumber ? rec.get("likes").toNumber() : rec.get("likes");
        const comments = rec.get("comments").toNumber ? rec.get("comments").toNumber() : rec.get("comments");
        return { post: p, author, likes, comments };
    } finally {
        await safeClose(session);
    }
}

// Liệt kê bài viết
export async function listPosts({ page = 1, limit = 10 }) {
    const session = driver.session();
    try {
        const skip = (page - 1) * limit;
        const query = `
      MATCH (u:User)-[:POSTED]->(p:Post)
      RETURN p, u
      ORDER BY p.createdAt DESC
      SKIP $skip LIMIT $limit
    `;
        const res = await session.run(query, { skip: parseInt(skip), limit: parseInt(limit) });
        return res.records.map(r => ({
            post: r.get("p").properties,
            author: r.get("u").properties
        }));
    } finally {
        await safeClose(session);
    }
}

// Cập nhật bài viết
export async function updatePost({ postId, userId, text, imageUrl }) {
    const session = driver.session();
    try {
        // Kiểm tra quyền sở hữu
        const check = await session.run(`
      MATCH (u:User {id: $userId})-[:POSTED]->(p:Post {id: $postId})
      RETURN p
    `, { userId, postId });
        if (check.records.length === 0) throw new Error("Không tìm thấy bài viết hoặc không có quyền");

        // Cập nhật nội dung
        const q = `
      MATCH (p:Post {id: $postId})
      SET p.text = $text, p.imageUrl = $imageUrl, p.updatedAt = datetime()
      RETURN p
    `;
        const res = await session.run(q, { postId, text, imageUrl });

        /* Xóa tag cũ
        await session.run(`
      MATCH (p:Post {id:$postId})-[r:MENTIONED]->()
      DELETE r
    `, { postId });

        // Tag mới
        for (const mentionedId of mentionedUserIds) {
            await session.run(`
        MATCH (p:Post {id:$postId}), (m:User {id:$mentionedId})
        CREATE (p)-[:MENTIONED]->(m)
      `, { postId, mentionedId });
        }
         */

        return res.records[0].get("p").properties;
    } finally {
        await safeClose(session);
    }
}

// Xóa bài viết
export async function deletePost({ postId, userId }) {
    const session = driver.session();
    try {
        // Kiểm tra quyền sở hữu
        const check = await session.run(`
      MATCH (u:User {id:$userId})-[:POSTED]->(p:Post {id:$postId})
      RETURN p
    `, { userId, postId });
        if (check.records.length === 0) throw new Error("Không tìm thấy bài viết hoặc không có quyền");

        // Xóa bài viết và mọi quan hệ liên quan
        await session.run(`
      MATCH (p:Post {id:$postId})
      OPTIONAL MATCH (p)<-[r]-()
      DETACH DELETE p
    `, { postId });
        return { message: "Xóa bài viết thành công" };
    } finally {
        await safeClose(session);
    }
}

/* Chia sẻ bài viết (share/repost)
export async function sharePost({ userId, originalPostId, text = "" }) {
    const session = driver.session();
    try {
        const id = uuidv4();
        const query = `
      MATCH (u:User {id:$userId}), (orig:Post {id:$originalPostId})
      CREATE (p:Post {id:$id, text:$text, createdAt:datetime(), updatedAt:datetime()})
      CREATE (u)-[:POSTED]->(p)
      CREATE (p)-[:SHARED_FROM]->(orig)
      RETURN p
    `;
        const res = await session.run(query, { userId, originalPostId, id, text });
        return res.records[0].get("p").properties;
    } finally {
        await safeClose(session);
    }
}
 */

// ================= COMMENTS ================= //

// Tạo comment cho bài viết
export async function createComment({ postId, userId, text }) {
    const session = driver.session();
    try {
        const id = uuidv4();
        const q = `
      MATCH (u:User {id:$userId}), (p:Post {id:$postId})
      CREATE (c:Comment { id: $id, text: $text, createdAt: datetime() })
      CREATE (u)-[:COMMENTED]->(c)-[:ON]->(p)
      RETURN c
    `;
        const res = await session.run(q, { userId, postId, id, text });

        /* Nếu là reply thì tạo quan hệ REPLY_TO
        if (parentCommentId) {
            await session.run(`
        MATCH (c:Comment {id:$commentId}), (parent:Comment {id:$parentCommentId})
        CREATE (c)-[:REPLY_TO]->(parent)
      `, { commentId: id, parentCommentId });
        }

        // Tag người dùng
        for (const mentionedId of mentionedUserIds) {
            await session.run(`
        MATCH (c:Comment {id:$commentId}), (m:User {id:$mentionedId})
        CREATE (c)-[:MENTIONED]->(m)
      `, { commentId: id, mentionedId });
        }
         */

        return res.records[0].get("c").properties;
    } finally {
        await safeClose(session);
    }
}

// Cập nhật comment
export async function updateComment({ commentId, userId, text }) {
    const session = driver.session();
    try {
        const check = await session.run(`
      MATCH (u:User {id:$userId})-[:COMMENTED]->(c:Comment {id:$commentId})
      RETURN c
    `, { userId, commentId });
        if (check.records.length === 0) throw new Error("Không tìm thấy comment hoặc không có quyền");

        const q = `
      MATCH (c:Comment {id:$commentId})
      SET c.text = $text, c.updatedAt = datetime()
      RETURN c
    `;
        const r = await session.run(q, { commentId, text });

        /* Xóa tag cũ
        await session.run(`
      MATCH (c:Comment {id:$commentId})-[r:MENTIONED]->()
      DELETE r
    `, { commentId });

        // Tag mới
        for (const mentionedId of mentionedUserIds) {
            await session.run(`
        MATCH (c:Comment {id:$commentId}), (m:User {id:$mentionedId})
        CREATE (c)-[:MENTIONED]->(m)
      `, { commentId, mentionedId });
        }
         */

        return r.records[0].get("c").properties;
    } finally {
        await safeClose(session);
    }
}

// Xóa comment
export async function deleteComment({ commentId, userId }) {
    const session = driver.session();
    try {
        const check = await session.run(`
      MATCH (u:User {id:$userId})-[:COMMENTED]->(c:Comment {id:$commentId})
      RETURN c
    `, { userId, commentId });
        if (check.records.length === 0) throw new Error("Không tìm thấy comment hoặc không có quyền");

        await session.run(`
      MATCH (c:Comment {id:$commentId})
      DETACH DELETE c
    `, { commentId });
        return { message: "Xóa comment thành công" };
    } finally {
        await safeClose(session);
    }
}

// Liệt kê comment của bài viết
export async function listComments({ postId, page = 1, limit = 20 }) {
    const session = driver.session();
    try {
        const skip = (page - 1) * limit;
        const q = `
      MATCH (u:User)-[:COMMENTED]->(c:Comment)-[:ON]->(p:Post {id:$postId})
      RETURN c, u
      ORDER BY c.createdAt ASC
      SKIP $skip LIMIT $limit
    `;
        const res = await session.run(q, { postId, skip: parseInt(skip), limit: parseInt(limit) });
        return res.records.map(r => ({
            comment: r.get("c").properties,
            author: r.get("u").properties
        }));
    } finally {
        await safeClose(session);
    }
}

// ================= LIKE / UNLIKE ================= //

// Like hoặc unlike bài viết
export async function toggleLikePost({ postId, userId }) {
    const session = driver.session();
    try {
        const check = await session.run(`
      MATCH (u:User {id:$userId}), (p:Post {id:$postId})
      OPTIONAL MATCH (u)-[l:LIKED]->(p)
      RETURN l
    `, { userId, postId });

        if (check.records.length === 0) throw new Error("User hoặc Post không tồn tại");

        const l = check.records[0].get("l");
        if (l) {
            // Nếu đã like, bỏ like
            await session.run(`
        MATCH (u:User {id:$userId})-[l:LIKED]->(p:Post {id:$postId})
        DELETE l
      `, { userId, postId });
            return { liked: false };
        } else {
            // Nếu chưa like, tạo quan hệ LIKE
            await session.run(`
        MATCH (u:User {id:$userId}), (p:Post {id:$postId})
        CREATE (u)-[:LIKED]->(p)
      `, { userId, postId });
            return { liked: true };
        }
    } finally {
        await safeClose(session);
    }
}

// Like hoặc unlike comment
export async function toggleLikeComment({ commentId, userId }) {
    const session = driver.session();
    try {
        const check = await session.run(`
      MATCH (u:User {id:$userId}), (c:Comment {id:$commentId})
      OPTIONAL MATCH (u)-[l:LIKED]->(c)
      RETURN l
    `, { userId, commentId });

        if (check.records.length === 0) throw new Error("User hoặc Comment không tồn tại");

        const l = check.records[0].get("l");
        if (l) {
            await session.run(`
        MATCH (u:User {id:$userId})-[l:LIKED]->(c:Comment {id:$commentId})
        DELETE l
      `, { userId, commentId });
            return { liked: false };
        } else {
            await session.run(`
        MATCH (u:User {id:$userId}), (c:Comment {id:$commentId})
        CREATE (u)-[:LIKED]->(c)
      `, { userId, commentId });
            return { liked: true };
        }
    } finally {
        await safeClose(session);
    }
}

// ================= STATS =================== //

// Thống kê số like và comment của bài viết
export async function postStats({ postId }) {
    const session = driver.session();
    try {
        const q = `
      MATCH (p:Post {id:$postId})
      OPTIONAL MATCH (p)<-[:LIKED]-()
      OPTIONAL MATCH (c:Comment)-[:ON]->(p)
      RETURN size((p)<-[:LIKED]-()) AS likes, count(c) AS comments
    `;
        const res = await session.run(q, { postId });
        if (res.records.length === 0) return { likes: 0, comments: 0 };
        const r = res.records[0];
        const likes = r.get("likes").toNumber ? r.get("likes").toNumber() : r.get("likes");
        const comments = r.get("comments").toNumber ? r.get("comments").toNumber() : r.get("comments");
        return { likes, comments };
    } finally {
        await safeClose(session);
    }
}
