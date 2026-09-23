import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from the backend directory so local dev, PM2, and deployment runners
// can start the API from different working directories.
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import quizRoutes from './routes/quiz.js';
import authRoutes from './routes/auth.js';
import forumRoutes from './routes/forum.js';
import citationRoutes from './routes/citation.js';
import cornellNotesRoutes from './routes/cornellNotes.js';
import streaksRoutes from './routes/streaks.js';
import doubtRoutes from './routes/doubt.js';
import waitlistRoutes from './routes/waitlist.js';
import userRoutes from './routes/user.js';
import summarizerRoutes from './routes/summarizerRoutes.js';
import studyGuideRoutes from './routes/studyGuideRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import mathSolverRoutes from './routes/mathSolverRoutes.js';
import mindMapRoutes from './routes/mindMapRoutes.js';
import conceptMapRoutes from './routes/conceptMapRoutes.js';
import practiceTestRoutes from './routes/practiceTestRoutes.js';
import worksheetRoutes from './routes/worksheetRoutes.js';
import productivityRoutes from './routes/productivity.js';
import groupTimerRoutes from './routes/groupTimer.js';
import audioRoutes from './routes/audio.js';
import goalsRoutes from './routes/goals.js';
import analyticsRoutes from './routes/analytics.js';
import gamificationRoutes from './routes/gamification.js';
import organizationRoutes from './routes/organization.js';
import socialRoutes from './routes/social.js';
import { assertRequiredSecrets, trustProxySetting } from './utils/envGuard.js';
import { securityHeaders } from './middleware/securityHeaders.js';

// Guard against stdout/stderr EPIPE when the log sink closes unexpectedly (keeps server alive)
const handlePipeError = (err) => {
  if (err.code !== 'EPIPE') throw err;
};
process.stdout.on('error', handlePipeError);
process.stderr.on('error', handlePipeError);

const secretCheck = assertRequiredSecrets(process.env);
if (!secretCheck.ok) {
  console.error(`ERROR: ${secretCheck.reason}`);
  process.exit(1);
}

let trustProxy;
try {
  trustProxy = trustProxySetting(process.env.TRUST_PROXY);
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

app.disable('x-powered-by');
app.set('trust proxy', trustProxy);

app.use(securityHeaders);

// CORS configuration - only allow requests from frontend
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.ADDITIONAL_ORIGINS ? process.env.ADDITIONAL_ORIGINS.split(',').map(o => o.trim()) : []),
  'https://quiz.inspir.uk', // Deployed frontend
  'http://localhost:5173', // Dev frontend
  'http://127.0.0.1:5173', // Dev frontend
  'http://localhost:3000', // Dev testing
  'http://127.0.0.1:3000' // Dev testing
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const corsError = new Error('Not allowed by CORS');
      corsError.status = 403;
      callback(corsError);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/citations', citationRoutes);
app.use('/api/cornell-notes', cornellNotesRoutes);
app.use('/api/streaks', streaksRoutes);
app.use('/api/doubt', doubtRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/user', userRoutes);
app.use('/api/summarizer', summarizerRoutes);
app.use('/api/study-guides', studyGuideRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/math-solver', mathSolverRoutes);
app.use('/api/mindmap', mindMapRoutes);
app.use('/api/conceptmap', conceptMapRoutes);
app.use('/api/practice-tests', practiceTestRoutes);
app.use('/api/worksheets', worksheetRoutes);
app.use('/api/productivity', productivityRoutes);
app.use('/api/group-timer', groupTimerRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/social', socialRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Quiz app backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (res.headersSent) {
    return next(err);
  }
  const status = Number(err.status || err.statusCode) || 500;
  if (status >= 500) {
    return res.status(500).json({ error: 'Something went wrong!' });
  }
  const clientMessage = typeof err.message === 'string' && err.message.length > 0 && err.message.length < 200
    ? err.message
    : 'Request failed';
  return res.status(status).json({ error: clientMessage });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
