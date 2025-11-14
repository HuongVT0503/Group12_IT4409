
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getSession, driver } = require('../config/neo4j');

async function runFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const statements = content.split(/;\s*$/m).filter(Boolean);
  const session = getSession();
  try {
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      await session.run(trimmed);
      console.log('Ran statement:', trimmed.split('\n')[0]);
    }
  } finally {
    await session.close();
  }
}

async function main() {
  try {
    const schemaPath = path.join(__dirname, 'schema.cypher');
    const seedPath = path.join(__dirname, 'seed.cypher');
    await runFile(schemaPath);
    console.log('Schema applied.');
    // optional seed
    if (fs.existsSync(seedPath)) {
      await runFile(seedPath);
      console.log('Seed applied.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await driver.close();
    process.exit(0);
  }
}

main();
