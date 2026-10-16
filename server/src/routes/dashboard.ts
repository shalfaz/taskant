import { Router } from 'express';
import { findRecords } from '../db/records';
import { Bid, Notification, Payment, Task } from '../models/index';
import type { IBid, IPayment, ITask, INotification } from '../types/index';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/validate';
import type { AuthRequest } from '../types/index';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [postedTasks, acceptedTasks, pendingBids, notifications, payments, availableTasks] =
    await Promise.all([
      findRecords<ITask>(Task, { posterId: userId }, { createdAt: -1 }),
      findRecords<ITask>(Task, { workerId: userId }, { createdAt: -1 }),
      findRecords<IBid>(Bid, { bidderId: userId, status: 'Pending' }, { createdAt: -1 }),
      findRecords<INotification>(Notification, { userId, read: false }),
      findRecords<IPayment>(Payment, { $or: [{ payerId: userId }, { payeeId: userId }] }),
      findRecords<ITask>(Task, { status: { $in: ['Open', 'Bidding'] }, posterId: { $ne: userId } }),
    ]);
  const earnings = payments
    .filter((payment) => payment.payeeId === userId && payment.status === 'Completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const spending = payments
    .filter((payment) => payment.payerId === userId && payment.status === 'Completed')
    .reduce((sum, payment) => sum + payment.total, 0);
  const active = (task: ITask) => ['Assigned', 'In Progress'].includes(task.status);
  res.json({
    stats: {
      postedCount: postedTasks.length,
      acceptedCount: acceptedTasks.length,
      activePosted: postedTasks.filter(active).length,
      activeAccepted: acceptedTasks.filter(active).length,
      completedPosted: postedTasks.filter((task) => task.status === 'Completed').length,
      completedAccepted: acceptedTasks.filter((task) => task.status === 'Completed').length,
      pendingBids: pendingBids.length,
      unreadNotifications: notifications.length,
      earnings,
      spending,
    },
    recentPosted: postedTasks.slice(0, 3),
    recentAccepted: acceptedTasks.slice(0, 3),
    availableTasks: availableTasks.slice(0, 4),
    pendingBids: await Promise.all(pendingBids.slice(0, 5).map(async (bid) => ({
      ...bid,
      task: (await Task.findById(bid.taskId).lean().exec()),
    }))),
  });
}));

export default router;
