import { Router } from 'express';
import { memoryDb } from '../db/memoryStore.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const postedTasks = memoryDb.tasks.find((t) => t.posterId === userId);
  const acceptedTasks = memoryDb.tasks.find((t) => t.workerId === userId);
  const pendingBids = memoryDb.bids.find((b) => b.bidderId === userId && b.status === 'Pending');
  const notifications = memoryDb.notifications.find((n) => n.userId === userId && !n.read);
  const payments = memoryDb.payments.find((p) => p.payerId === userId || p.payeeId === userId);
  const earnings = payments.filter((p) => p.payeeId === userId && p.status === 'Completed').reduce((s, p) => s + p.amount, 0);
  const spending = payments.filter((p) => p.payerId === userId && p.status === 'Completed').reduce((s, p) => s + p.total, 0);
  const availableTasks = memoryDb.tasks.find((t) => ['Open', 'Bidding'].includes(t.status) && t.posterId !== userId);

  res.json({
    stats: {
      postedCount: postedTasks.length,
      acceptedCount: acceptedTasks.length,
      activePosted: postedTasks.filter((t) => ['Assigned', 'In Progress'].includes(t.status)).length,
      activeAccepted: acceptedTasks.filter((t) => ['Assigned', 'In Progress'].includes(t.status)).length,
      completedPosted: postedTasks.filter((t) => t.status === 'Completed').length,
      completedAccepted: acceptedTasks.filter((t) => t.status === 'Completed').length,
      pendingBids: pendingBids.length,
      unreadNotifications: notifications.length,
      earnings,
      spending,
    },
    recentPosted: postedTasks.slice(-3).reverse(),
    recentAccepted: acceptedTasks.slice(-3).reverse(),
    availableTasks: availableTasks.slice(0, 4),
    pendingBids: pendingBids.slice(0, 5).map((b) => ({
      ...b,
      task: memoryDb.tasks.findById(b.taskId),
    })),
  });
});

export default router;
