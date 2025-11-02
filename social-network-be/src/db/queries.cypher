// Lấy danh sách bài viết của 1 user
MATCH (u:User {userId:$userId})-[:POSTED]->(p:Post)
RETURN p ORDER BY p.createdAt DESC;

// Tìm các user mà người dùng đang theo dõi
MATCH (u:User {userId:$userId})-[:FOLLOWS]->(f:User)
RETURN f.username, f.userId;

// Lấy toàn bộ comment của 1 post
MATCH (p:Post {postId:$postId})-[:HAS_COMMENT]->(c:Comment)
RETURN c.text, c.createdAt;
