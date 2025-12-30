import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function saveFileFromBuffer({ buffer, originalname }) {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  const ext = path.extname(originalname) || '.bin';
  const name = uuidv4() + ext;
  const filepath = path.join(uploadsDir, name);
  fs.writeFileSync(filepath, buffer);
  const url = '/uploads/' + name;
  return { url, path: filepath };
}

export { saveFileFromBuffer };
