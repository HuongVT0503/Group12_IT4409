import dotenv from 'dotenv';
import neo4j from 'neo4j-driver';

dotenv.config();

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'neo4j';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
  maxConnectionPoolSize: 50
});

function getSession(mode = neo4j.session.WRITE) {
  return driver.session({ defaultAccessMode: mode });
}

export { driver, getSession, neo4j };
