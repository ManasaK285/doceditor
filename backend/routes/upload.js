import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbHelpers } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
router.use(requireAuth);

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ['.txt', '.md'].includes(ext) ? cb(null, true) : cb(new Error('Only .txt and .md files are supported'));
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const raw = fs.readFileSync(req.file.path, 'utf-8');
    fs.unlinkSync(req.file.path);
    const originalName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const title = originalName || 'Imported Document';
    const paragraphs = raw.split(/\n+/).filter(l => l.trim() !== '');
    const content = {
      type: 'doc',
      content: paragraphs.map(line => {
        const h1 = line.match(/^#\s+(.+)/), h2 = line.match(/^##\s+(.+)/), h3 = line.match(/^###\s+(.+)/);
        if (h3) return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: h3[1] }] };
        if (h2) return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: h2[1] }] };
        if (h1) return { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: h1[1] }] };
        return { type: 'paragraph', content: [{ type: 'text', text: line }] };
      })
    };
    const doc = { id: uuidv4(), title, content: JSON.stringify(content), owner_id: req.user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await dbHelpers.createDocument(doc);
    res.status(201).json({ document: doc });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

export default router;
