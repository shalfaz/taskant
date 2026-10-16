import { Router } from 'express';
import { findRecord, findRecords, updateRecord } from '../db/records';
import { Notification } from '../models/index';
import type { INotification } from '../types/index';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/validate';
import type { AuthRequest } from '../types/index';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const notifications = await findRecords<INotification>(
    Notification,
    { userId: req.user!.id },
    { createdAt: -1 }
  );
  res.json({ notifications, unreadCount: notifications.filter((item) => !item.read).length });
}));

router.patch('/:id/read', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const notification = await findRecord<INotification>(Notification, req.params.id);
  if (!notification || notification.userId !== req.user!.id) {
    res.status(404).json({ message: 'Notification not found' });
    return;
  }
  const updated = await updateRecord<INotification>(Notification, req.params.id, { read: true });
  res.json({ notification: updated });
}));

router.patch('/read-all', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  await Notification.updateMany(
    { userId: req.user!.id, read: false },
    { $set: { read: true } }
  ).exec();
  res.json({ message: 'All notifications marked as read' });
}));

export default router;
