const { getSession } = require('../config/neo4j');

async function createNotification({ id, userId, type, data }) {
  const session = getSession();
  try {
    await session.run(
      `MATCH (u:User {id:$userId})
       CREATE (n:Notification {id:$id, type:$type, data:$data, read:false, created_at: datetime()})
       CREATE (u)-[:HAS_NOTIFICATION]->(n)`,
      { id, userId, type, data }
    );
  } finally {
    await session.close();
  }
}

async function getNotifications(userId, limit = 50) {
  const session = getSession();
  try {
    const res = await session.run(
      `MATCH (u:User {id:$userId})-[:HAS_NOTIFICATION]->(n:Notification)
       RETURN n ORDER BY n.created_at DESC LIMIT $limit`,
      { userId, limit: Number(limit) }
    );
    return res.records.map(r => r.get('n').properties);
  } finally {
    await session.close();
  }
}

async function markAsRead(notificationId) {
  const session = getSession();
  try {
    await session.run(`MATCH (n:Notification {id:$id}) SET n.read = true`, { id: notificationId });
  } finally {
    await session.close();
  }
}

module.exports = { createNotification, getNotifications, markAsRead };
