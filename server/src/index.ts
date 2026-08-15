import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config } from './config/index.js';
import { initMemoryStore } from './db/memoryStore.js';
import { errorHandler } from './middleware/validate.js';
import { setSocketServer } from './services/notifications.js';
import { setupSocket } from './socket/index.js';
import { seedOnStartup } from './seed/startup.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import bidRoutes from './routes/bids.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import paymentRoutes from './routes/payments.js';
import reviewRoutes from './routes/reviews.js';
import verificationRoutes from './routes/verification.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: { message: 'Too many requests, please try again later' },
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'TaskAnt API', version: '1.0.0' });
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

app.use(errorHandler);

async function start() {
  initMemoryStore();
  await seedOnStartup();

  const io = setupSocket(httpServer);
  setSocketServer(io);

  httpServer.listen(config.port, () => {
    console.log(`🐜 TaskAnt API running on http://localhost:${config.port}`);
    console.log(`📦 Using in-memory database (persists to server/data/store.json)`);
  });
}

start().catch(console.error);
