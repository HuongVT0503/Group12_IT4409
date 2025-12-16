import { getSession, neo4j } from '../config/neo4j.js';

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
      { userId, limit: neo4j.int(limit) }
    );
    return res.records.map((r) => {
      const props = r.get("n").properties;
      if (props.created_at) {
        //convert to string
        props.created_at = new Date(props.created_at).toISOString();
      }
      return props;
    });
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

export { createNotification, getNotifications, markAsRead };
