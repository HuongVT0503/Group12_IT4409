// ==========================
// SCHEMA: Constraints & Indexes
// ==========================

// User
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.userId IS UNIQUE;

// Post
CREATE CONSTRAINT post_id_unique IF NOT EXISTS
FOR (p:Post) REQUIRE p.postId IS UNIQUE;

// Comment
CREATE CONSTRAINT comment_id_unique IF NOT EXISTS
FOR (c:Comment) REQUIRE c.commentId IS UNIQUE;

// Media
CREATE CONSTRAINT media_id_unique IF NOT EXISTS
FOR (m:Media) REQUIRE m.mediaId IS UNIQUE;

// Notification
CREATE CONSTRAINT notif_id_unique IF NOT EXISTS
FOR (n:Notification) REQUIRE n.notifId IS UNIQUE;

// Optional: Indexes
CREATE INDEX user_username_index IF NOT EXISTS FOR (u:User) ON (u.username);
CREATE INDEX post_createdAt_index IF NOT EXISTS FOR (p:Post) ON (p.createdAt);
CREATE INDEX user_ban_status_index IF NOT EXISTS FOR (u:User) ON (u.isBanned);

// Report ID
CREATE CONSTRAINT report_id_unique IF NOT EXISTS FOR (r:Report) REQUIRE r.reportId IS UNIQUE;

