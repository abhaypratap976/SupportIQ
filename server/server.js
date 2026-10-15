import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { connectDB, disconnectDB, getDBStatus } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { seedDatabase } from './scripts/seed.js';

import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import userRoutes from './routes/userRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Vite dev server compatibility
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins dynamically (echoes requesting origin back, fully supporting credentials)
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-bootstrap-secret']
  })
);

// 3. Body & Cookie Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 4. Rate Limiting for general API
app.use('/api/', apiLimiter);

// 5. Health Check Endpoint (Sanitized - never leaks secrets)
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  return res.status(200).json({
    status: 'ok',
    service: 'supportiq-api',
    database: dbStatus.state,
    isMemoryServer: dbStatus.isMemoryServer,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// 6. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// 7. 404 Route Handler for undefined /api routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  }
  next();
});

// 8. Centralized Error Handler
app.use(errorHandler);

// 9. Serve Vite frontend build (SPA) from dist/
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing (SPA) in Express 5
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.originalUrl.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  }
  next();
});

let serverInstance = null;

/**
 * Start the HTTP server and connect to database
 */
export async function startServer(port = PORT) {
  try {
    await connectDB();

    // Auto-seed demo data if database is empty in development or memory server fallback
    const dbStatus = getDBStatus();
    if (process.env.NODE_ENV !== 'production' || dbStatus.isMemoryServer) {
      await seedDatabase(false);
    }

    return new Promise((resolve, reject) => {
      serverInstance = app.listen(port, () => {
        console.log(`[SupportIQ Server] Listening on http://localhost:${port}`);
        resolve({ app, server: serverInstance });
      });
      serverInstance.on('error', reject);
    });
  } catch (err) {
    console.error('[SupportIQ Server] Startup failed:', err);
    throw err;
  }
}

/**
 * Stop server and disconnect database cleanly
 */
export async function stopServer() {
  if (serverInstance) {
    await new Promise(resolve => serverInstance.close(resolve));
    serverInstance = null;
    console.log('[SupportIQ Server] HTTP server stopped.');
  }
  await disconnectDB();
}

// Handle termination signals
process.on('SIGTERM', async () => {
  console.log('[SupportIQ Server] SIGTERM received. Shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[SupportIQ Server] SIGINT received. Shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

// Self-start if run directly
if (process.argv[1]?.endsWith('server.js')) {
  startServer().catch(() => process.exit(1));
}

export default app;
