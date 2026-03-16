import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load env FIRST before any other imports that read env vars
dotenv.config();

import { validateEnv } from './utils/validateEnv';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import contentRoutes from './routes/contentRoutes';

// Validate required environment variables at startup
validateEnv();

const app = express();
const port = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS — restrict to known origins in production
const allowedOrigins = [
  'http://localhost:3000',  // Next.js dev
  'http://localhost:5173',  // Vite dev (if used)
];

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigins
    : true,  // Allow all origins in development
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// ============================================================
// ROUTES
// ============================================================

// Authentication (register, login, me)
app.use('/auth', authRoutes);

// Content generation (protected routes)
app.use('/api/content', contentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ============================================================
// ERROR HANDLING — must be AFTER all routes
// ============================================================
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
