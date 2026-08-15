import { Router } from 'express';
import { memoryDb } from '../db/memoryStore.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res) => {
  const notifications = memoryDb.notifications
    .find((n) => n.userId === req.user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = notifications.filter((n) => !n.read).length;
  res.json({ notifications, unreadCount });
});

router.patch('/:id/read', authenticate, (req: AuthRequest, res) => {
  const notification = memoryDb.notifications.find((n) => n._id === req.params.id)[0];
  if (!notification || notification.userId !== req.user!.id) {
    res.status(404).json({ message: 'Notification not found' });
    return;
  }
  const updated = memoryDb.notifications.update(req.params.id, { read: true });
  res.json({ notification: updated });
});

router.patch('/read-all', authenticate, (req: AuthRequest, res) => {
  memoryDb.notifications
    .find((n) => n.userId === req.user!.id && !n.read)
    .forEach((n) => memoryDb.notifications.update(n._id, { read: true }));
  res.json({ message: 'All notifications marked as read' });
});

export default router;
