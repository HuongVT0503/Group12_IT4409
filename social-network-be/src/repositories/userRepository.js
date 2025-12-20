import { getSession } from '../config/neo4j.js';

async function createUser({ id, username, email, password_hash, display_name }) {
  const session = getSession();
  try {
    const res = await session.run(
      `CREATE (u:User {id:$id, username:$username, email:$email, password_hash:$password_hash, display_name:$display_name, role: $role, isBanned: false, created_at: datetime()})
       RETURN u`,
      { id, username, email, password_hash, display_name }
    );
    return res.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function findByEmail(email) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User {email:$email}) RETURN u LIMIT 1`, { email }
    );
    if (!res.records.length) return null;
    return res.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function findByUsername(username) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User {username:$username}) RETURN u LIMIT 1`, { username }
    );
    if (!res.records.length) return null;
    return res.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function findById(id) {
  const session = getSession();
  try {
    const res = await session.run(`MATCH (u:User {id:$id}) RETURN u LIMIT 1`, { id });
    if (!res.records.length) return null;
    return res.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function updateProfile(id, patch) {
  const session = getSession();
  try {
    const sets = Object.keys(patch).map(k => `u.${k} = $${k}`).join(', ');
    const params = { id, ...patch };
    const res = await session.run(`MATCH (u:User {id:$id}) SET ${sets} RETURN u`, params);
    return res.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function followUser(followerId, followeeId) {
  const session = getSession();
  try {
    await session.run(
      `MATCH (a:User {id:$followerId}), (b:User {id:$followeeId})
       MERGE (a)-[r:FOLLOW]->(b)
       RETURN r`,
      { followerId, followeeId }
    );
    return true;
  } finally {
    await session.close();
  }
}

async function unfollowUser(followerId, followeeId) {
  const session = getSession();
  try {
    await session.run(
      `MATCH (a:User {id:$followerId})-[r:FOLLOW]->(b:User {id:$followeeId}) DELETE r`,
      { followerId, followeeId }
    );
    return true;
  } finally {
    await session.close();
  }
}

async function getFollowers(userId, limit = 50) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User {id:$userId})<-[:FOLLOW]-(f:User)
       RETURN f LIMIT $limit`, { userId, limit: Number(limit) }
    );
    return res.records.map(r => r.get('f').properties);
  } finally {
    await session.close();
  }
}

async function getFollowing(userId, limit = 50) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User {id:$userId})-[:FOLLOW]->(f:User)
       RETURN f LIMIT $limit`, { userId, limit: Number(limit) }
    );
    return res.records.map(r => r.get('f').properties);
  } finally {
    await session.close();
  }
}

// User tạo báo cáo
async function createReport({ reportId, reporterId, targetId, targetType, reason }) {
  const session = getSession();
  try {
    const idField = targetType === 'User' ? 'userId' : 'postId';
    const res = await session.run(
        `MATCH (reporter:User {userId: $reporterId})
         MATCH (target:${targetType} {${idField}: $targetId})
         MERGE (reporter)-[r:REPORTED]->(target)
         ON CREATE SET 
            r.reportId = $reportId,
            r.reason = $reason,
            r.createdAt = datetime()
         ON MATCH SET
            r.reason = $reason,
            r.updatedAt = datetime()
         RETURN r`,
        { reportId, reporterId, targetId, reason }
    );
    return res.records.length > 0;
  } finally {
    await session.close();
  }
}

export {
  createUser, findByEmail, findByUsername, findById, updateProfile,
  followUser, unfollowUser, getFollowers, getFollowing, createReport
};
