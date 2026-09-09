import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import projectRoutes from './routes/projects';
import tagRoutes from './routes/tags';
import notificationRoutes from './routes/notifications';
import analyticsRoutes from './routes/analytics';
import focusRoutes from './routes/focus';
import aiRoutes from './routes/ai';
import timeRoutes from './routes/time';
import { startReminderScheduler } from './services/reminderScheduler';
import { apiLimiter } from './middleware/rateLimiter';

const app: Express = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(helmet());

// Allowed origins for CORS (supports local, configured CLIENT_URL, comma-separated lists, and Vercel domains)
const allowedOrigins = [
  config.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];
if (config.CLIENT_URL && config.CLIENT_URL.includes(',')) {
  config.CLIENT_URL.split(',').forEach((url) => allowedOrigins.push(url.trim()));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile native apps, curl, Render health checks)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Production Health Check (unthrottled for Render health checks and uptime monitoring)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    env: config.NODE_ENV,
    version: '1.0.0',
  });
});

if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/time', timeRoutes);

app.use(errorHandler);

// Start background services
startReminderScheduler();

app.listen(config.PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  console.log(`URL: http://localhost:${config.PORT}`);
});
