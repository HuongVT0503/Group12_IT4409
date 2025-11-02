import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import driver from './config/neo4j.js';
dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/db-test', async (req, res) => {
  const session = driver.session();
  try {
    const r = await session.run('RETURN "connected" AS msg');
    res.json({ msg: r.records[0].get('msg') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

export default app;