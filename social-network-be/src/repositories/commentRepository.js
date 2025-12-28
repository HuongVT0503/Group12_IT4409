import { getSession, neo4j } from "../config/neo4j.js";

async function createComment({ id, authorId, postId, content, parentCommentId = null, media = [] }) {
  const session = getSession();
  try {
    let query = `
        MATCH (u:User {id:$authorId}), (p:Post {id:$postId})
        CREATE (c:Comment {id:$id, content:$content, media:$media, created_at: datetime()})
        CREATE (u)-[:COMMENTED]->(c)
        CREATE (c)-[:ON]->(p)
        WITH c, u, p
        OPTIONAL MATCH (parent:Comment {id: $parentCommentId})
        FOREACH (x IN CASE WHEN parent IS NOT NULL THEN [1] ELSE [] END |
          CREATE (c)-[:REPLY_TO]->(parent)
        )
        RETURN c, u, p
    `;
    const res = await session.run(query, { id, authorId, postId, content, parentCommentId, media });
    if (res.records.length === 0) throw new Error("Could not create comment");
    const properties = res.records[0].get("c").properties;
    const author = res.records[0].get("u").properties;
    if (properties.created_at) properties.created_at = new Date(properties.created_at).toISOString();
    return { ...properties, parentId: parentCommentId, author };
  } finally { await session.close(); }
}

async function getCommentById(id) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User)-[:COMMENTED]->(c:Comment {id: $id}) RETURN c, u`,
      { id }
    );
    if (res.records.length === 0) return null;
    return {
      ...res.records[0].get("c").properties,
      author: res.records[0].get("u").properties
    };
  } finally { await session.close(); }
}

async function getCommentsForPost(postId, limit = 50, userId = null) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u)-[:COMMENTED]->(c)-[:ON]->(p:Post {id:$postId})
      WHERE u.isBanned = false
      OPTIONAL MATCH (c)-[:REPLY_TO]->(parent:Comment)
      OPTIONAL MATCH (likers:User)-[:REACTED]->(c)
      WITH c, u, parent.id AS parentId, count(likers) as likeCount
      OPTIONAL MATCH (currentUser:User {id: $userId})-[:REACTED]->(c)
      WITH c, u, parentId, likeCount, CASE WHEN currentUser IS NOT NULL THEN true ELSE false END as isLiked
      RETURN c, u, parentId, likeCount, isLiked
      ORDER BY c.created_at ASC LIMIT $limit`,
      { postId, limit: neo4j.int(limit), userId }
    );
    return res.records.map((r) => {
      const comment = r.get("c").properties;
      const author = r.get("u").properties;
      const parentId = r.get("parentId");
      const likeCount = r.get("likeCount").toNumber ? r.get("likeCount").toNumber() : r.get("likeCount");
      if (comment.created_at) comment.created_at = new Date(comment.created_at).toISOString();
      comment.stats = { likes: likeCount };
      return { comment, author, parentId, isLiked: r.get("isLiked") };
    });
  } finally { await session.close(); }
}

async function deleteComment(commentId, userId) {
  const session = getSession();
  try {
    const query = `
      MATCH (c:Comment {id: $commentId})-[:ON]->(p:Post)
      OPTIONAL MATCH (uAuthor:User {id: $userId})-[:COMMENTED]->(c)
      OPTIONAL MATCH (uMod:User {id: $userId})-[:AUTHORED]->(p)
      WITH c, p, uAuthor, uMod
      WHERE uAuthor IS NOT NULL OR uMod IS NOT NULL
      OPTIONAL MATCH (c)<-[:REPLY_TO*0..]-(descendants)
      DETACH DELETE c, descendants
      RETURN p.id as postId
    `;
    const res = await session.run(query, { commentId, userId });
    return res.records.length === 0 ? null : res.records[0].get('postId');
  } finally { await session.close(); }
}

async function editComment(commentId, userId, newContent) {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:COMMENTED]->(c:Comment {id: $commentId})-[:ON]->(p:Post)
      SET c.content = $newContent, c.updated_at = datetime()
      RETURN c, u, p.id AS postId
    `;
    const res = await session.run(query, { commentId, userId, newContent });
    if (res.records.length === 0) return null;
    const properties = res.records[0].get("c").properties;
    const author = res.records[0].get("u").properties;
    if (properties.created_at) properties.created_at = new Date(properties.created_at).toISOString();
    if (properties.updated_at) properties.updated_at = new Date(properties.updated_at).toISOString();
    return { ...properties, author, postId: res.records[0].get("postId") };
  } finally { await session.close(); }
}

async function getCommentAuthor(commentId) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User)-[:COMMENTED]->(c:Comment {id: $commentId}) RETURN u`,
      { commentId }
    );
    return res.records.length === 0 ? null : res.records[0].get("u").properties;
  } finally { await session.close(); }
}

async function reactToComment({ commentId, userId, reactionType }) {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id:$userId}), (c:Comment {id:$commentId})
      MERGE (u)-[r:REACTED]->(c)
      SET r.type = $reactionType, r.created_at = datetime()
      RETURN r, u, c
    `;
    const res = await session.run(query, { commentId, userId, reactionType });
    if (res.records.length === 0) return null;
    const r = res.records[0].get('r').properties;
    if (r.created_at) r.created_at = new Date(r.created_at).toISOString();
    return r;
  } finally { await session.close(); }
}

async function removeReaction({ commentId, userId }) {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id:$userId})-[r:REACTED]->(c:Comment {id:$commentId})
      DELETE r RETURN c.id as commentId
    `;
    const res = await session.run(query, { commentId, userId });
    return res.records.length > 0 ? res.records[0].get('commentId') : null;
  } finally { await session.close(); }
}

async function getCommentPostId(commentId) {
  const session = getSession();
  try {
    const query = `
      MATCH (c:Comment {id:$commentId})-[:ON]->(p:Post)
      RETURN p.id as postId
    `;
    const res = await session.run(query, { commentId });
    return res.records.length === 0 ? null : res.records[0].get('postId');
  } finally { await session.close(); }
}

export {
  createComment, getCommentById, getCommentsForPost, deleteComment, editComment, getCommentAuthor,
  reactToComment, removeReaction, getCommentPostId
};