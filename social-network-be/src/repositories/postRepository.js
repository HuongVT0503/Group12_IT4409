import { getSession, neo4j } from '../config/neo4j.js';

async function createPost({
  id,
  authorId,
  content,
  media = [],
  privacy = "public",
}) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User {id:$authorId})
       CREATE (p:Post {id:$id, content:$content, media:$media, privacy:$privacy, created_at: datetime()})
       CREATE (u)-[:AUTHORED]->(p)
       RETURN p, u`,
      { id, authorId, content, media, privacy }
    );
    if (!res.records.length) return null;
    const post = res.records[0].get("p").properties;
    const author = res.records[0].get("u").properties;

    if (post.created_at) post.created_at = new Date(post.created_at).toISOString();
    
    return { post, author };
  } finally {
    await session.close();
  }
}

async function getPostById(id) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u)-[:AUTHORED]->(p:Post {id:$id}) RETURN p, u LIMIT 1`,
      { id }
    );
    if (!res.records.length) return null;
    const post = res.records[0].get('p').properties;
    const author = res.records[0].get('u').properties;
    
    if (post.created_at) post.created_at = new Date(post.created_at).toISOString();

    return { post, author };
  } finally {
    await session.close();
  }
}

async function deletePost(id, userId) {
  const session = getSession();
  try {
    // ensure user is author
    await session.run(
      `MATCH (u:User {id:$userId})-[:AUTHORED]->(p:Post {id:$id})
       DETACH DELETE p`,
      { id, userId }
    );
    return true;
  } finally {
    await session.close();
  }
}

async function getRecentPublicPosts(limit = 20) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u)-[:AUTHORED]->(p:Post)
       WHERE p.privacy='public'
       RETURN p, u ORDER BY p.created_at DESC LIMIT $limit`,
      { limit: neo4j.int(limit) }
    );
    return res.records.map((r) => {
      const post = r.get("p").properties;
      const author = r.get("u").properties;

      if (post.created_at) {
        post.created_at = new Date(post.created_at).toISOString();
      }

      return { post, author };
    });
  } finally {
    await session.close();
  }
}

async function getPostsByAuthor(authorId, limit = 20) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User {id:$authorId})-[:AUTHORED]->(p:Post)
       RETURN p, u ORDER BY p.created_at DESC LIMIT $limit`,
      { authorId, limit: neo4j.int(limit) }
    );
    return res.records.map((r) => {
      const post = r.get("p").properties;
      const author = r.get("u").properties;
      if (post.created_at) post.created_at = new Date(post.created_at).toISOString();
      return { post, author };
    });
  } finally {
    await session.close();
  }
}

async function likePost(userId, postId) {
  const session = getSession();
  try {
    await session.run(
      `MATCH (u:User {id:$userId}), (p:Post {id:$postId})
       MERGE (u)-[l:LIKED]->(p)
       SET l.created_at = datetime()`,
      { userId, postId }
    );
    return true;
  } finally {
    await session.close();
  }
}

async function unlikePost(userId, postId) {
  const session = getSession();
  try {
    await session.run(
      `MATCH (u:User {id:$userId})-[l:LIKED]->(p:Post {id:$postId})
       DELETE l`,
      { userId, postId }
    );
    return true;
  } finally {
    await session.close();
  }
}

async function countLikes(postId) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (:User)-[l:LIKED]->(p:Post {id:$postId}) RETURN count(l) as c`,
      { postId }
    );
    return res.records[0].get("c").toNumber();
  } finally {
    await session.close();
  }
}

export {
  createPost,
  getPostById,
  deletePost,
  getRecentPublicPosts,
  getPostsByAuthor, //
  likePost,
  unlikePost,
  countLikes,
};
