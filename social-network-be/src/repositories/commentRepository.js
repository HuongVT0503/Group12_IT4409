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

    return res.records[0].get('c').properties;
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
    return res.records.map(r => ({ comment: r.get('c').properties, author: r.get('u').properties }));
  } finally {
    await session.close();
  }
}

export { createComment, getCommentsForPost };
