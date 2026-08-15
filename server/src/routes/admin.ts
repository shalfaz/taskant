import { Router } from 'express';
import { body } from 'express-validator';
import { memoryDb } from '../db/memoryStore.js';
import { toPublicUser } from '../utils/auth.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createNotification } from '../services/notifications.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/stats', (_req, res) => {
  const users = memoryDb.users.find();
  const tasks = memoryDb.tasks.find();
  const payments = memoryDb.payments.find();
  const reports = memoryDb.reports.find();
  const verifications = memoryDb.verifications.find();

  res.json({
    stats: {
      totalUsers: users.filter((u) => u.role === 'user').length,
      verifiedUsers: users.filter((u) => u.verificationStatus === 'Verified').length,
      totalTasks: tasks.length,
      activeTasks: tasks.filter((t) => ['Open', 'Bidding', 'Assigned', 'In Progress'].includes(t.status)).length,
      completedTasks: tasks.filter((t) => t.status === 'Completed').length,
      totalTransactions: payments.filter((p) => p.status === 'Completed').length,
      totalRevenue: payments.filter((p) => p.status === 'Completed').reduce((s, p) => s + p.serviceFee, 0),
      pendingReports: reports.filter((r) => r.status === 'Pending').length,
      pendingVerifications: verifications.filter((v) => v.status === 'Pending').length,
    },
    recentTasks: tasks.slice(-5).reverse(),
    recentUsers: users.filter((u) => u.role === 'user').slice(-5).reverse().map((u) => toPublicUser(u)),
  });
});

router.get('/users', (_req, res) => {
  const users = memoryDb.users.find().map((u) => toPublicUser(u, true));
  res.json({ users });
});

router.patch('/users/:id/suspend', (req, res) => {
  const user = memoryDb.users.update(req.params.id, { isSuspended: req.body.suspended ?? true });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ user: toPublicUser(user, true) });
});

router.get('/tasks', (_req, res) => {
  const tasks = memoryDb.tasks.find().map((t) => {
    const poster = memoryDb.users.findById(t.posterId);
    return { ...t, poster: poster ? toPublicUser(poster) : null };
  });
  res.json({ tasks });
});

router.get('/verifications', (_req, res) => {
  const items = memoryDb.verifications.find().map((v) => {
    const user = memoryDb.users.findById(v.userId);
    return { ...v, user: user ? toPublicUser(user, true) : null };
  });
  res.json({ verifications: items });
});

router.patch(
  '/verifications/:id',
  [body('status').isIn(['Verified', 'Rejected'])],
  validate,
  (req, res) => {
    const verification = memoryDb.verifications.update(req.params.id, {
      status: req.body.status,
      adminNotes: req.body.adminNotes,
    });
    if (!verification) {
      res.status(404).json({ message: 'Verification not found' });
      return;
    }
    memoryDb.users.update(verification.userId, {
      verificationStatus: req.body.status,
    });
    createNotification({
      userId: verification.userId,
      type: 'verification_update',
      title: 'Verification Update',
      message: `Your verification request has been ${req.body.status.toLowerCase()}`,
      link: '/profile',
    });
    res.json({ verification });
  }
);

router.get('/reports', (_req, res) => {
  const items = memoryDb.reports.find().map((r) => {
    const reporter = memoryDb.users.findById(r.reporterId);
    return { ...r, reporter: reporter ? toPublicUser(reporter) : null };
  });
  res.json({ reports: items });
});

router.patch('/reports/:id', (req, res) => {
  const report = memoryDb.reports.update(req.params.id, {
    status: req.body.status,
    adminNotes: req.body.adminNotes,
  });
  if (!report) {
    res.status(404).json({ message: 'Report not found' });
    return;
  }
  createNotification({
    userId: report.reporterId,
    type: 'report_update',
    title: 'Report Update',
    message: `Your report status has been updated to ${req.body.status}`,
    link: '/safety',
  });
  res.json({ report });
});

export default router;
