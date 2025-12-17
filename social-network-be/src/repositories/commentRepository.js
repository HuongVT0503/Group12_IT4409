import { getSession, neo4j } from '../config/neo4j.js';

async function createComment({ id, authorId, postId, content, parentCommentId = null }) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User {id:$authorId}), (p:Post {id:$postId})
       CREATE (c:Comment {id:$id, content:$content, created_at: datetime()})
       CREATE (u)-[:COMMENTED]->(c)
       CREATE (c)-[:ON]->(p)
       RETURN c, u, p`,
      { id, authorId, postId, content }
    );

    const properties = res.records[0].get('c').properties;
    if (properties.created_at) {
        properties.created_at = new Date(properties.created_at).toISOString();
    }//convert neo4j date to string

    return properties;
  } finally {
    await session.close();
  }
}

async function getCommentsForPost(postId, limit = 50) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u)-[:COMMENTED]->(c)-[:ON]->(p:Post {id:$postId})
       RETURN c, u ORDER BY c.created_at DESC LIMIT $limit`,
      { postId, limit: neo4j.int(limit) }
    );
    return res.records.map((r) => {
      const comment = r.get("c").properties;
      const author = r.get("u").properties;

      if (comment.created_at) {
        comment.created_at = new Date(comment.created_at).toISOString();
      }
      return { comment, author };
    });
  } finally {
    await session.close();
  }
}

export { createComment, getCommentsForPost };
