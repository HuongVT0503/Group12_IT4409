import { getSession, neo4j } from "../config/neo4j.js";

async function createPost({
  id,
  authorId,
  content,
  media = [],
  privacy = "public",
  sharedPostId = null,
}) {
  const session = getSession();
  try {
    let query = `MATCH (u:User {id:$authorId})
       CREATE (p:Post {id:$id, content:$content, media:$media, privacy:$privacy, created_at: datetime()})
       CREATE (u)-[:AUTHORED]->(p)`;

    if (sharedPostId) {
      query += `
         WITH p, u
         MATCH (sp:Post {id:$sharedPostId})
         CREATE (p)-[:SHARES]->(sp)
       `;
    }
    query += `RETURN p, u`;
    const res = await session.run(query, {
      id,
      authorId,
      content,
      media,
      privacy,
      sharedPostId,
    });
    if (!res.records.length) return null;
    const post = res.records[0].get("p").properties;
    const author = res.records[0].get("u").properties;

    if (post.created_at)
      post.created_at = new Date(post.created_at).toISOString();

    return { post, author };
  } finally {
    await session.close();
  }
}

//map Neo4j results including shared posts
const mapPostResult = (r) => {
  const post = r.get("p").properties;
  const author = r.get("u").properties;
  const stats = {
    likes: r.get("likes").toNumber(),
    comments: r.get("comments").toNumber(),
    shares: r.get("shares").toNumber(),
  };

  const isLiked = r.keys.includes('isLiked') ? r.get('isLiked') : false;

  if (post.created_at)
    post.created_at = new Date(post.created_at).toISOString();

  //hanfle shared post data
  let sharedPost = null;
  const sp = r.get("sp") ? r.get("sp").properties : null;
  const sa = r.get("sa") ? r.get("sa").properties : null;

  if (sp && sa) {
    if (sp.created_at) sp.created_at = new Date(sp.created_at).toISOString();
    sharedPost = { ...sp, author: sa };
  }

  return { post, author, stats, sharedPost, isLiked };
};

async function getPostById(id, currentUserId=null) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u)-[:AUTHORED]->(p:Post {id:$id})
      OPTIONAL MATCH (:User)-[l:LIKED]->(p)
      OPTIONAL MATCH (c:Comment)-[:ON]->(p)
      OPTIONAL MATCH (s:Post)-[:SHARES]->(p)
      OPTIONAL MATCH (p)-[:SHARES]->(sp:Post)<-[:AUTHORED]-(sa:User)

      OPTIONAL MATCH (me:User {id:$currentUserId})-[myLike:LIKED]->(p)
      RETURN p, u,count(DISTINCT l) as likes, count(DISTINCT c) as comments, count(DISTINCT s) as shares,sp,sa, count (myLike)>0 as isLiked LIMIT 1`,
      { id, currentUserId }
    );
    if (!res.records.length) return null;
    const record = res.records[0];
    const author = record.get("u").properties;
    if (author.isBanned === true && author.id !== currentUserId) {
      return null;
    }

    return mapPostResult(res.records[0]);
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
      OPTIONAL MATCH (c:Comment)-[:ON]->(p)
      DETACH DELETE p, c`,
      { id, userId }
    );
    return true;
  } finally {
    await session.close();
  }
}

async function getRecentPublicPosts(limit = 20, currentUserId=null) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u)-[:AUTHORED]->(p:Post)
       WHERE p.privacy='public' AND u.isBanned = false
       OPTIONAL MATCH (:User)-[l:LIKED]->(p)
       OPTIONAL MATCH (c:Comment)-[:ON]->(p)
       OPTIONAL MATCH (s:Post)-[:SHARES]->(p)
       OPTIONAL MATCH (p)-[:SHARES]->(sp:Post)<-[:AUTHORED]-(sa:User)

       OPTIONAL MATCH (me:User {id:$currentUserId})-[myLike:LIKED]->(p)
       RETURN p, u, count(DISTINCT l) as likes, count(DISTINCT c) as comments, count(DISTINCT s) as shares, sp, sa, count (myLike)>0 as isLiked
       ORDER BY p.created_at DESC LIMIT $limit`,
      { limit: neo4j.int(limit), currentUserId   }
    );
    return res.records.map(mapPostResult);
  } finally {
    await session.close();
  }
}

async function getPostsByAuthor(authorId, limit = 20, currentUserId=null) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User {id:$authorId})-[:AUTHORED]->(p:Post)
      WHERE u.isBanned = false OR u.id = $currentUserId
      OPTIONAL MATCH (:User)-[l:LIKED]->(p)
      OPTIONAL MATCH (c:Comment)-[:ON]->(p)
      OPTIONAL MATCH (s:Post)-[:SHARES]->(p)
      OPTIONAL MATCH (p)-[:SHARES]->(sp:Post)<-[:AUTHORED]-(sa:User)

      OPTIONAL MATCH (me:User {id:$currentUserId})-[myLike:LIKED]->(p)
      RETURN p, u, count(DISTINCT l) as likes, count(DISTINCT c) as comments, count(DISTINCT s) as shares,sp,sa, count (myLike)>0 as isLiked
      ORDER BY p.created_at DESC LIMIT $limit`,
      { authorId, limit: neo4j.int(limit), currentUserId }
    );
    return res.records.map(mapPostResult);
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
