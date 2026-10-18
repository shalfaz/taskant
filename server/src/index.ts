import express from 'express';
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { assertProductionConfig, config } from './config/index';
import { checkMongoConnection, isMongoConfigured } from './db/mongo';
import { errorHandler } from './middleware/validate';
import { seedOnStartup } from './seed/startup';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import taskRoutes from './routes/tasks';
import bidRoutes from './routes/bids';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import paymentRoutes from './routes/payments';
import reviewRoutes from './routes/reviews';
import verificationRoutes from './routes/verification';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import dashboardRoutes from './routes/dashboard';
import uploadRoutes from './routes/uploads';

export const app = express();
app.set('trust proxy', 1);

app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  const suppliedId = req.get('x-request-id');
  const requestId =
    suppliedId && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(suppliedId)
      ? suppliedId
      : randomUUID();
  res.locals.requestId = requestId;
  res.locals.diagnosticStage = 'api.request';
  res.setHeader('X-Request-ID', requestId);
  next();
});
app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: { message: 'Too many requests, please try again later' },
  })
);

app.get('/api/health', async (_req, res) => {
  try {
    await checkMongoConnection();
    return res.json({ status: 'ok', name: 'TaskAnt API', version: '1.0.0' });
  } catch {
    return res.status(503).json({ status: 'error', message: 'Application database is not ready.' });
  }
});

app.get('/api/health/mongodb', async (_req, res) => {
  if (!isMongoConfigured()) {
    return res.status(503).json({
      status: 'error',
      message: 'MongoDB is not configured.',
    });
  }

  try {
    await checkMongoConnection();
    return res.json({ status: 'ok', database: 'MongoDB' });
  } catch {
    return res.status(503).json({
      status: 'error',
      message: 'Application database is not ready.',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(errorHandler);

let initialization: Promise<void> | undefined;

export function initializeApi(): Promise<void> {
  initialization ??= Promise.resolve()
    .then(() => {
      assertProductionConfig();
      return seedOnStartup();
    })
    .catch((error: unknown) => {
      initialization = undefined;
      throw error;
    });
  return initialization;
}
