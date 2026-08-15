import { Router } from 'express';
import { body } from 'express-validator';
import { memoryDb } from '../db/memoryStore.js';
import { toPublicUser } from '../utils/auth.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createNotification, emitToTask } from '../services/notifications.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

function canAccessTask(userId: string, taskId: string): boolean {
  const task = memoryDb.tasks.findById(taskId);
  if (!task) return false;
  return task.posterId === userId || task.workerId === userId;
}

router.get('/conversations', authenticate, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const tasks = memoryDb.tasks.find(
    (t) => t.posterId === userId || t.workerId === userId
  );
  const conversations = tasks.map((task) => {
    const otherId = task.posterId === userId ? task.workerId : task.posterId;
    const other = otherId ? memoryDb.users.findById(otherId) : null;
    const messages = memoryDb.messages.find((m) => m.taskId === task._id);
    const lastMessage = messages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    const unread = messages.filter((m) => m.receiverId === userId && !m.read).length;
    return {
      taskId: task._id,
      taskTitle: task.title,
      otherUser: other ? toPublicUser(other) : null,
      lastMessage,
      unread,
    };
  }).filter((c) => c.otherUser);
  conversations.sort(
    (a, b) =>
      new Date(b.lastMessage?.createdAt || 0).getTime() -
      new Date(a.lastMessage?.createdAt || 0).getTime()
  );
  res.json({ conversations });
});

router.get('/task/:taskId', authenticate, (req: AuthRequest, res) => {
  if (!canAccessTask(req.user!.id, req.params.taskId)) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }
  const messages = memoryDb.messages
    .find((m) => m.taskId === req.params.taskId)
    .map((m) => {
      const sender = memoryDb.users.findById(m.senderId);
      return { ...m, sender: sender ? toPublicUser(sender) : null };
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  memoryDb.messages.updateMany(
    (m) => m.taskId === req.params.taskId && m.receiverId === req.user!.id,
    { read: true }
  );

  res.json({ messages });
});

router.post(
  '/',
  authenticate,
  [body('taskId').notEmpty(), body('content').trim().notEmpty()],
  validate,
  (req: AuthRequest, res) => {
    const { taskId, content, attachment } = req.body;
    if (!canAccessTask(req.user!.id, taskId)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    const task = memoryDb.tasks.findById(taskId)!;
    const receiverId = task.posterId === req.user!.id ? task.workerId! : task.posterId;
    const message = memoryDb.messages.create({
      taskId,
      senderId: req.user!.id,
      receiverId,
      content,
      attachment,
      read: false,
    });
    const sender = memoryDb.users.findById(req.user!.id);
    createNotification({
      userId: receiverId,
      type: 'new_message',
      title: 'New Message',
      message: `${sender?.fullName || 'Someone'} sent you a message about "${task.title}"`,
      link: `/chat/${taskId}`,
    });
    emitToTask(taskId, 'new_message', {
      ...message,
      sender: sender ? toPublicUser(sender) : null,
    });
    res.status(201).json({ message: { ...message, sender: sender ? toPublicUser(sender) : null } });
  }
);

export default router;
