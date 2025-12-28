import { getSession, neo4j } from "../config/neo4j.js";

async function createComment({
  id,
  authorId,
  postId,
  content,
  parentCommentId = null,
}) {
  const session = getSession();
  try {
    let simpleQuery = `
       MATCH (u:User {id: $authorId}), (p:Post {id: $postId})
       CREATE (c:Comment {id: $id, content: $content, created_at: datetime()})
       CREATE (u)-[:COMMENTED]->(c)
       CREATE (c)-[:ON]->(p)
       WITH c, u, p
       OPTIONAL MATCH (parent:Comment {id: $parentCommentId})
       FOREACH (x IN CASE WHEN parent IS NOT NULL THEN [1] ELSE [] END |
         CREATE (c)-[:REPLY_TO]->(parent)
       )
       RETURN c, u, p
    `;

    const res = await session.run(simpleQuery, {
      id,
      authorId,
      postId,
      content,
      parentCommentId,
    });

    if (res.records.length === 0) {
      throw new Error("Could not create comment");
    }
    const record = res.records[0];
    const properties = res.records[0].get("c").properties;
    const author = res.records[0].get("u").properties;

    if (properties.created_at) {
      properties.created_at = new Date(properties.created_at).toISOString();
    } //convert neo4j date to string

    return { ...properties, parentId: parentCommentId, author };
  } finally {
    await session.close();
  }
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
  } finally {
    await session.close();
  }
}

async function getCommentsForPost(postId, limit = 50) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u)-[:COMMENTED]->(c)-[:ON]->(p:Post {id:$postId})\
      OPTIONAL MATCH (c)-[:REPLY_TO]->(parent:Comment)
      RETURN c, u, parent.id AS parentId
      ORDER BY c.created_at ASC LIMIT $limit`,
      { postId, limit: neo4j.int(limit) }
    );
    return res.records.map((r) => {
      const comment = r.get("c").properties;
      const author = r.get("u").properties;
      const parentId = r.get("parentId");

      if (comment.created_at) {
        comment.created_at = new Date(comment.created_at).toISOString();
      }
      return { comment, author, parentId };
    });
  } finally {
    await session.close();
  }
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

        if (res.records.length === 0) return null; //not found or unauthorized

        return res.records[0].get('postId');
    } finally {
        await session.close();
    }
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
  } finally {
    await session.close();
  }
}

export { createComment, getCommentById, getCommentsForPost, deleteComment, editComment };
