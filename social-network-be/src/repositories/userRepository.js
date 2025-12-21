import { getSession, neo4j } from '../config/neo4j.js';

async function createUser({ id, username, email, password_hash, display_name, date_of_birth, gender, phone }) {
  const session = getSession();
  try {
    const res = await session.run(
      `CREATE (u:User {
         id:$id,
         username:$username,
         email:$email,
         password_hash:$password_hash,
         display_name:$display_name,
         date_of_birth:$date_of_birth,
         gender:$gender,
         phone:$phone,
         role: $role, 
         isBanned: false,
         created_at: datetime()
       }) RETURN u`,
      { id, username, email, password_hash, display_name, date_of_birth, gender, phone }
    );
    return res.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function createOAuthUser({ id, email, display_name, provider, providerId, profilePicture }) {
  const session = getSession();
  try {
    const baseUsername = display_name ? display_name.replace(/\s+/g, '').toLowerCase() : email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    let existing = await findByUsername(username);
    while (existing) {
      username = `${baseUsername}${counter}`;
      existing = await findByUsername(username);
      counter++;
    }

    const oauthFieldName = `${provider}_id`;
    const params = {
      id,
      email,
      username,
      display_name: display_name || email.split('@')[0],
      providerId,
      profilePicture: profilePicture || null,
      role: 'user',
      isBanned: false
    };

    const setClause = `
      id: $id,
      email: $email,
      username: $username,
      display_name: $display_name,
      ${oauthFieldName}: $providerId,
      avatar: $profilePicture,
      role: $role,
      isBanned: $isBanned,
      created_at: datetime()
    `;

    const res = await session.run(
      `CREATE (u:User {${setClause}}) RETURN u`,
      params
    );
    return res.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function findByGoogleId(googleId) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User {google_id:$googleId}) RETURN u LIMIT 1`, 
      { googleId }
    );
    if (!res.records.length) return null;
    return res.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function findByFacebookId(facebookId) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User {facebook_id:$facebookId}) RETURN u LIMIT 1`, 
      { facebookId }
    );
    if (!res.records.length) return null;
    return res.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function updateOAuthProfile(userId, provider, providerId, profilePicture) {
  const session = getSession();
  try {
    const oauthFieldName = `${provider}_id`;
    const params = {
      userId,
      providerId,
      profilePicture: profilePicture || null
    };

    const res = await session.run(
      `MATCH (u:User {id:$userId}) 
       SET u.${oauthFieldName} = $providerId, u.avatar = $profilePicture 
       RETURN u`,
      params
    );
    
    if (!res.records.length) return null;
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
       RETURN f LIMIT $limit`, { userId, limit: neo4j.int(limit) }
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
       RETURN f LIMIT $limit`, { userId, limit: neo4j.int(limit) }
    );
    return res.records.map(r => r.get('f').properties);
  } finally {
    await session.close();
  }
}

async function searchByUsername(q, limit = 50, skip = 0) {
    const session = getSession();
    try {
        const res = await session.run(
            `MATCH (u:User)
       WHERE toLower(u.username) CONTAINS toLower($q)
       RETURN u SKIP $skip LIMIT $limit`,
            { q, limit: neo4j.int(limit), skip: neo4j.int(skip) }
        );
        return res.records.map(r => r.get('u').properties);
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
  createUser, 
  createOAuthUser,
  findByEmail, 
  findByUsername, 
  findById, 
  findByGoogleId,
  findByFacebookId,
  updateProfile,
  updateOAuthProfile,
  followUser, 
  unfollowUser, 
  getFollowers, 
  getFollowing,
  searchByUsername, 
  createReport
};
