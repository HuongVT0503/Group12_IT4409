import { getSession } from '../config/neo4j.js';

async function saveRefreshToken(userId, tokenHash, expiresAtISO) {
  const session = getSession();
  try {
    await session.run(
        `MATCH (u:User {userId: $userId})
       MERGE (t:RefreshToken {token_hash: $tokenHash})
       SET t.expires_at = datetime($expiresAt), 
           t.userId = $userId
       MERGE (u)-[:HAS_TOKEN]->(t)`,
        { tokenHash, expiresAt: expiresAtISO, userId }
    );
  } finally {
    await session.close();
  }
}

async function revokeRefreshToken(tokenHash) {
  const session = getSession();
  try {
    await session.run(`MATCH (t:RefreshToken {token_hash:$tokenHash}) DETACH DELETE t`, { tokenHash });
  } finally {
    await session.close();
  }
}

async function findRefreshToken(tokenHash) {
  const session = getSession();
  try {
    const res = await session.run(
        `MATCH (t:RefreshToken {token_hash: $tokenHash}) 
       RETURN t, toString(t.expires_at) AS expiresAtStr LIMIT 1`,
        { tokenHash }
    );
    if (!res.records.length) return null;

    const props = res.records[0].get('t').properties;
    return {
      ...props,
      expiresAt: res.records[0].get('expiresAtStr')
    };
  } finally {
    await session.close();
  }
}

export { saveRefreshToken, revokeRefreshToken, findRefreshToken };
