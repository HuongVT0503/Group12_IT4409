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
  const isSaved = r.keys.includes('isSaved') ? r.get('isSaved') : false;

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

  return { post, author, stats, sharedPost, isLiked, isSaved };
};

async function getPostById(id, currentUserId = null) {
  const session = getSession();
  try {
    const res = await session.run(
        `MATCH (u:User)-[:AUTHORED]->(p:Post {id:$id})
      OPTIONAL MATCH (:User)-[l:LIKED]->(p)
      OPTIONAL MATCH (c:Comment)-[:ON]->(p)
      OPTIONAL MATCH (s:Post)-[:SHARES]->(p)
      OPTIONAL MATCH (p)-[:SHARES]->(sp:Post)<-[:AUTHORED]-(sa:User)

      OPTIONAL MATCH (me:User {id:$currentUserId})-[myLike:LIKED]->(p)
      OPTIONAL MATCH (me)-[mySave:SAVED]->(p)
      RETURN p, u, 
             count(DISTINCT l) as likes, 
             count(DISTINCT c) as comments, 
             count(DISTINCT s) as shares, 
             sp, sa, 
             count(DISTINCT myLike) > 0 as isLiked, 
             count(DISTINCT mySave) > 0 as isSaved 
      LIMIT 1`,
        { id, currentUserId }
    );
    if (!res.records.length) return null;
    const record = res.records[0];
    const author = record.get("u").properties;
    if (author.isBanned === true && author.id !== currentUserId) return null;

    return mapPostResult(record);
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
        `MATCH (u:User)-[:AUTHORED]->(p:Post)
       WHERE p.privacy='public' AND u.isBanned = false
       OPTIONAL MATCH (:User)-[l:LIKED]->(p)
       OPTIONAL MATCH (c:Comment)-[:ON]->(p)
       OPTIONAL MATCH (s:Post)-[:SHARES]->(p)
       OPTIONAL MATCH (p)-[:SHARES]->(sp:Post)<-[:AUTHORED]-(sa:User)

       OPTIONAL MATCH (me:User {id:$currentUserId})-[myLike:LIKED]->(p)
       OPTIONAL MATCH (me)-[mySave:SAVED]->(p)
       RETURN p, u, count(DISTINCT l) as likes, count(DISTINCT c) as comments, count(DISTINCT s) as shares, sp, sa, count(DISTINCT myLike) > 0 as isLiked, count(DISTINCT mySave) > 0 as isSaved
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
      OPTIONAL MATCH (me)-[mySave:SAVED]->(p)
      RETURN p, u, count(DISTINCT l) as likes, count(DISTINCT c) as comments, count(DISTINCT s) as shares,sp,sa, count(DISTINCT myLike) > 0 as isLiked, count(DISTINCT mySave)>0 as isSaved
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

async function editPost(postId, userId, newContent) {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:AUTHORED]->(p:Post {id: $postId})
      SET p.content = $newContent,
          p.updated_at = datetime() // Đồng nhất với created_at
      RETURN p, u
    `;
    const res = await session.run(query, { postId, userId, newContent });

    if (res.records.length === 0) return null;
    const post = res.records[0].get("p").properties;
    const author = res.records[0].get("u").properties;
    if (post.created_at) post.created_at = new Date(post.created_at).toISOString();
    if (post.updated_at) post.updated_at = new Date(post.updated_at).toISOString();

    return { post, author };
  } finally {
    await session.close();
  }
}

async function savePost(userId, postId) {
  const session = getSession();
  try {
    await session.run(
        `MATCH (u:User {id:$userId}), (p:Post {id:$postId})
       MERGE (u)-[s:SAVED]->(p)
       SET s.created_at = datetime()`,
        { userId, postId }
    );
    return true;
  } finally {
    await session.close();
  }
}

async function unsavePost(userId, postId) {
  const session = getSession();
  try {
    await session.run(
        `MATCH (u:User {id:$userId})-[s:SAVED]->(p:Post {id:$postId})
       DELETE s`,
        { userId, postId }
    );
    return true;
  } finally {
    await session.close();
  }
}

// Lấy danh sách các bài viết đã lưu của một user
async function getSavedPosts(userId, limit = 20) {
  const session = getSession();
  try {
    const res = await session.run(
        `MATCH (me:User {id:$userId})-[mySave:SAVED]->(p:Post)<-[:AUTHORED]-(u:User)
       WHERE u.isBanned = false
       OPTIONAL MATCH (:User)-[l:LIKED]->(p)
       OPTIONAL MATCH (c:Comment)-[:ON]->(p)
       OPTIONAL MATCH (shared:Post)-[:SHARES]->(p)
       OPTIONAL MATCH (p)-[:SHARES]->(sp:Post)<-[:AUTHORED]-(sa:User)
       
       OPTIONAL MATCH (me)-[myLike:LIKED]->(p)
       RETURN p, u, 
              count(DISTINCT l) as likes, 
              count(DISTINCT c) as comments, 
              count(DISTINCT shared) as shares, 
              sp, sa, 
              count(DISTINCT myLike) > 0 as isLiked, 
              true as isSaved,
              mySave.created_at as savedAt
       ORDER BY savedAt DESC LIMIT $limit`,
        { userId, limit: neo4j.int(limit) }
    );
    return res.records.map(mapPostResult);
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
  editPost,
  savePost,
  unsavePost,
  getSavedPosts
};
