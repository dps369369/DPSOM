import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Backend PIN verification endpoint
  // Never exposes the PIN to client-side code
  app.post('/api/verify-pin', (req, res) => {
    const { pin } = req.body;
    const serverPin = (process.env.CATEGORY_ADMIN_PIN || '369369').trim();

    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ success: false, message: 'PIN is required.' });
    }

    if (pin.trim() === serverPin) {
      return res.json({ success: true, message: 'PIN verified successfully.' });
    }

    return res.status(401).json({ success: false, message: 'Incorrect PIN. Access denied.' });
  });

  const isProd = process.env.NODE_ENV === 'production';
  const port = isProd && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProd) {
    // Initialize Vite concurrently so port 3000 binds immediately
    const vitePromise = createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`DPSOM server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
