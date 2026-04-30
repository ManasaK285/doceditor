import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initDb } from './db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

async function start() {
  // ✅ DB must be ready before we import routes (routes call dbHelpers at module level)
  await initDb();
  console.log('✓ Database ready');

  // Import routes AFTER db is initialised
  const { default: authRoutes }     = await import('./routes/auth.js');
  const { default: documentRoutes } = await import('./routes/documents.js');
  const { default: uploadRoutes }   = await import('./routes/upload.js');

  const app = express();

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.use('/api/auth',      authRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/upload',    uploadRoutes);

  // Error handler
  app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message, err.stack);
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 5MB)' });
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  app.listen(PORT, () => console.log(`✓ DocEditor API running on http://localhost:${PORT}`));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
