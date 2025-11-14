const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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

module.exports = { saveFileFromBuffer };
