import { Router } from 'express';
import type { Response } from 'express';
import { body } from 'express-validator';
import { findRecord, findRecords, toRecord, validId, updateRecord } from '../db/records';
import { Payment, Report, Task, User, Verification } from '../models/index';
import type { IReport, ITask, IUser, IVerification } from '../types/index';
import { toPublicUser } from '../utils/auth';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validate';
import { createNotification } from '../services/notifications';
import type { AuthRequest } from '../types/index';
import { disconnectUserSockets } from '../socket/sessions';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/stats', asyncHandler(async (_req, res) => {
  const [users, tasks, payments, pendingReports, pendingVerifications, recentTasks, recentUsers] =
    await Promise.all([
      User.find({ role: 'user' }).lean().exec(),
      Task.find({}).lean().exec(),
      Payment.find({ status: 'Completed' }).lean().exec(),
      Report.countDocuments({ status: 'Pending' }),
      Verification.countDocuments({ status: 'Pending' }),
      findRecords<ITask>(Task, {}, { createdAt: -1 }),
      findRecords<IUser>(User, { role: 'user' }, { createdAt: -1 }),
    ]);
  const tasksAsRecords = tasks.map((task) => task as unknown as ITask);
  res.json({
    stats: {
      totalUsers: users.length,
      verifiedUsers: users.filter((user) => user.verificationStatus === 'Verified').length,
      totalTasks: tasks.length,
      activeTasks: tasksAsRecords.filter((task) => ['Open', 'Bidding', 'Assigned', 'In Progress'].includes(task.status)).length,
      completedTasks: tasksAsRecords.filter((task) => task.status === 'Completed').length,
      totalTransactions: payments.length,
      totalRevenue: payments.reduce((sum, payment) => sum + Number(payment.serviceFee), 0),
      pendingReports,
      pendingVerifications,
    },
    recentTasks: recentTasks.slice(0, 5),
    recentUsers: recentUsers.slice(0, 5).map((user) => toPublicUser(user)),
  });
}));

router.get('/users', asyncHandler(async (_req, res) => {
  const users = await findRecords<IUser>(User);
  res.json({ users: users.map((user) => toPublicUser(user, true)) });
}));

router.patch('/users/:id/suspend', asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: { isSuspended: req.body.suspended ?? true },
      $inc: { tokenVersion: 1 },
    },
    { new: true, runValidators: true }
  ).lean().exec();
  const user = document ? toRecord<IUser>(document) : null;
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (user.isSuspended) disconnectUserSockets(user._id);
  res.json({ user: toPublicUser(user, true) });
}));

router.get('/tasks', asyncHandler(async (_req, res) => {
  const tasks = await findRecords<ITask>(Task);
  res.json({
    tasks: await Promise.all(tasks.map(async (task) => {
      const poster = await findRecord<IUser>(User, task.posterId);
      return { ...task, poster: poster ? toPublicUser(poster) : null };
    })),
  });
}));

router.get('/verifications', asyncHandler(async (_req, res) => {
  const items = await findRecords<IVerification>(Verification);
  res.json({
    verifications: await Promise.all(items.map(async (verification) => {
      const user = await findRecord<IUser>(User, verification.userId);
      return { ...verification, user: user ? toPublicUser(user, true) : null };
    })),
  });
}));

router.patch(
  '/verifications/:id',
  [body('status').isIn(['Verified', 'Rejected'])],
  validate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const verification = await updateRecord<IVerification>(Verification, req.params.id, {
      status: req.body.status,
      adminNotes: req.body.adminNotes,
    });
    if (!verification) {
      res.status(404).json({ message: 'Verification not found' });
      return;
    }
    await updateRecord<IUser>(User, verification.userId, { verificationStatus: req.body.status });
    await createNotification({
      userId: verification.userId,
      type: 'verification_update',
      title: 'Verification Update',
      message: `Your verification request has been ${req.body.status.toLowerCase()}`,
      link: '/profile',
    });
    res.json({ verification });
  })
);

router.get('/reports', asyncHandler(async (_req, res) => {
  const items = await findRecords<IReport>(Report);
  res.json({
    reports: await Promise.all(items.map(async (report) => {
      const reporter = await findRecord<IUser>(User, report.reporterId);
      return { ...report, reporter: reporter ? toPublicUser(reporter) : null };
    })),
  });
}));

router.patch('/reports/:id', asyncHandler(async (req, res) => {
  const report = await updateRecord<IReport>(Report, req.params.id, {
    status: req.body.status,
    adminNotes: req.body.adminNotes,
  });
  if (!report) {
    res.status(404).json({ message: 'Report not found' });
    return;
  }
  await createNotification({
    userId: report.reporterId,
    type: 'report_update',
    title: 'Report Update',
    message: `Your report status has been updated to ${req.body.status}`,
    link: '/safety',
  });
  res.json({ report });
}));

export default router;
