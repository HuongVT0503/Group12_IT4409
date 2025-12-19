import { saveFileFromBuffer } from '../services/mediaService.js';

async function upload(req, res, next) {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ message: 'No files uploaded' });
    const results = [];
    for (const f of req.files) {
      const saved = await saveFileFromBuffer({ buffer: f.buffer, originalname: f.originalname });
      results.push({ filename: f.originalname, url: saved.url });
    }
    res.json({ files: results });
  } catch (err) { next(err); }
}

export { upload };
