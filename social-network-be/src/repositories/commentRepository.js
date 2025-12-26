import { getSession, neo4j } from "../config/neo4j.js";

async function createComment({
  id,
  authorId,
  postId,
  content,
  parentCommentId = null,
  media = []
}) {
  const session = getSession();
  try {
    let query = `
       MATCH (u:User {id:$authorId}), (p:Post {id:$postId})
       CREATE (c:Comment {id:$id, content:$content, media:$media, created_at: datetime()})
       CREATE (u)-[:COMMENTED]->(c)
       CREATE (c)-[:ON]->(p)
    `;

    //if is reply->link to parent cmt
    if (parentCommentId) {
      query += `
        WITH c, u, p
        MATCH (parent:Comment {id: $parentCommentId})
        CREATE (c)-[:REPLY_TO]->(parent)
      `;
    }

    query += ` RETURN c, u, p`;

    const res = await session.run(query, {
      id,
      authorId,
      postId,
      content,
      parentCommentId,
      media
    });

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

async function getCommentAuthor(commentId) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User)-[:COMMENTED]->(c:Comment {id: $commentId}) 
       RETURN u`,
      { commentId }
    );
    
    if (res.records.length === 0) return null;
    
    const author = res.records[0].get("u").properties;
    return author;
  } finally {
    await session.close();
  }
}

export { createComment, getCommentsForPost, deleteComment, getCommentAuthor };

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
  } finally {
    await session.close();
  }
}

async function removeReaction({ commentId, userId }) {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id:$userId})-[r:REACTED]->(c:Comment {id:$commentId})
      WITH r, u, c
      DELETE r
      RETURN c.id as commentId
    `;
    const res = await session.run(query, { commentId, userId });
    return res.records.length > 0 ? res.records[0].get('commentId') : null;
  } finally {
    await session.close();
  }
}

async function getReactionsForComment(commentId) {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User)-[r:REACTED]->(c:Comment {id:$commentId})
      RETURN r.type as type, count(r) as count, collect(u.id) as users
    `;
    const res = await session.run(query, { commentId });
    return res.records.map((rec) => ({
      type: rec.get('type'),
      count: rec.get('count').toNumber ? rec.get('count').toNumber() : rec.get('count'),
      users: rec.get('users')
    }));
  } finally {
    await session.close();
  }
}

export { reactToComment, removeReaction, getReactionsForComment };

async function getCommentPostId(commentId) {
  const session = getSession();
  try {
    const query = `
      MATCH (c:Comment {id:$commentId})-[:ON]->(p:Post)
      RETURN p.id as postId
    `;
    const res = await session.run(query, { commentId });
    if (res.records.length === 0) return null;
    return res.records[0].get('postId');
  } finally {
    await session.close();
  }
}

export { getCommentPostId };
