const { getSession } = require('../config/neo4j');

async function createUser({ id, username, email, password_hash, display_name }) {
  const session = getSession();
  try {
    const res = await session.run(
      `CREATE (u:User {id:$id, username:$username, email:$email, password_hash:$password_hash, display_name:$display_name, created_at: datetime()})
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
    const res = await session.run(
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

module.exports = {
  createUser, findByEmail, findByUsername, findById, updateProfile,
  followUser, unfollowUser, getFollowers, getFollowing
};
