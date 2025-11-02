import driver from '../config/neo4j.js';
import fs from 'fs';

async function runCypherFile(path) {
  const session = driver.session();
  const cypher = fs.readFileSync(path, 'utf8');
  try {
    await session.run(cypher);
    console.log(`✅ Executed ${path}`);
  } catch (err) {
    console.error(`❌ Error executing ${path}:`, err);
  } finally {
    await session.close();
  }
}

await runCypherFile('src/db/schema.cypher');
await runCypherFile('src/db/seed.cypher');

process.exit(0);
