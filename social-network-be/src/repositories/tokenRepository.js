import { getSession } from '../config/neo4j.js';

async function saveRefreshToken(userId, tokenHash, expiresAtISO) {
  const session = getSession();
  try {
    await session.run(
      `MERGE (t:RefreshToken {token_hash:$tokenHash})
       SET t.expires_at = datetime($expiresAt), t.user_id = $userId`,
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
    const res = await session.run(`MATCH (t:RefreshToken {token_hash:$tokenHash}) RETURN t LIMIT 1`, { tokenHash });
    if (!res.records.length) return null;
    return res.records[0].get('t').properties;
  } finally {
    await session.close();
  }
}

export { saveRefreshToken, revokeRefreshToken, findRefreshToken };
