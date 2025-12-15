import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function saveFileFromBuffer({ buffer, originalname }) {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  const ext = path.extname(originalname) || '.bin';
  const name = uuidv4() + ext;
  const filepath = path.join(uploadsDir, name);
  fs.writeFileSync(filepath, buffer);
  const url = (process.env.MEDIA_BASE_URL || 'http://localhost:4000/uploads') + '/' + name;
  return { url, path: filepath };
}

export { saveFileFromBuffer };
