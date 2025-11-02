# Database Design — Social Network

## Entities
- User(userId, username, email, password, createdAt)
- Post(postId, content, createdAt)
- Comment(commentId, text, createdAt)
- Media(mediaId, url, type)
- Notification(notifId, type, message, createdAt)

## Relationships
- (User)-[:POSTED]->(Post)
- (User)-[:FOLLOWS]->(User)
- (User)-[:LIKED]->(Post)
- (User)-[:COMMENTED]->(Comment)
- (Post)-[:HAS_COMMENT]->(Comment)
- (Post)-[:HAS_MEDIA]->(Media)
- (Notification)-[:SENT_TO]->(User)
