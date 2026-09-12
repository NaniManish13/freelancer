import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/src/config/db.js';
import { createApp } from './server/src/app.js';
import { seedDatabase } from './server/src/utils/seed.js';

dotenv.config();

// Enforce mandatory JWT_SECRET in production mode
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    console.error('FATAL ERROR: JWT_SECRET environment variable is mandatory in production mode. Server startup aborted.');
    process.exit(1);
  }
} else {
  // In development/test environments, ensure a fallback secret if none provided in .env
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'freelanceflow_local_dev_secret_key';
  }
}

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    // 1. Connect MongoDB (in-memory fallback automatically if no external URI)
    await connectDB();

    // 2. Initialize demo user and seed data
    try {
      await seedDatabase();
    } catch (seedErr) {
      console.warn('Initial demo seed notice:', seedErr);
    }

    // 3. Create Express app with all API routes and security middleware
    const app = createApp();

    // 4. Vite middleware for development vs static build in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Mounting Vite middleware in development mode...');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      console.log('Serving production static assets from dist...');
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    // 5. Start listening on 0.0.0.0:3000
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`FreelanceFlow server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal server startup error:', error);
    process.exit(1);
  }
}

startServer();
