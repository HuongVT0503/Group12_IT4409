
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSession, driver } from '../config/neo4j.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const statements = content.split(/;\s*$/m).filter(stmt => stmt.trim().length > 0);
  const session = getSession();
  try {
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      await session.run(trimmed);
      console.log('Ran statement:', trimmed.split('\n')[0]);
    }
  } catch (err) {
    console.error('Error executing statement:', err);
    throw err;
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
