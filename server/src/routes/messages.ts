import { Router } from 'express';
import type { Response } from 'express';
import { body } from 'express-validator';
import { findRecord, findRecords, insertRecord } from '../db/records';
import { Message, Task, User } from '../models/index';
import type { IMessage, ITask, IUser } from '../types/index';
import { toPublicUser } from '../utils/auth';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validate';
import { createNotification, emitToTask } from '../services/notifications';
import type { AuthRequest } from '../types/index';

const router = Router();

async function canAccessTask(userId: string, taskId: string): Promise<ITask | null> {
  const task = await findRecord<ITask>(Task, taskId);
  if (!task || (task.posterId !== userId && task.workerId !== userId)) return null;
  return task;
}

router.get('/conversations', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const tasks = await findRecords<ITask>(Task, { $or: [{ posterId: userId }, { workerId: userId }] });
  const conversations = await Promise.all(tasks.map(async (task) => {
    const otherId = task.posterId === userId ? task.workerId : task.posterId;
    const [other, messages] = await Promise.all([
      otherId ? findRecord<IUser>(User, otherId) : Promise.resolve(null),
      findRecords<IMessage>(Message, { taskId: task._id }, { createdAt: -1 }),
    ]);
    const unread = messages.filter((message) => message.receiverId === userId && !message.read).length;
    return {
      taskId: task._id,
      taskTitle: task.title,
      otherUser: other ? toPublicUser(other) : null,
      lastMessage: messages[0],
      unread,
    };
  }));
  res.json({
    conversations: conversations.filter((conversation) => conversation.otherUser)
      .sort((a, b) => new Date(b.lastMessage?.createdAt || 0).getTime() -
        new Date(a.lastMessage?.createdAt || 0).getTime()),
  });
}));

router.get('/task/:taskId', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const task = await canAccessTask(req.user!.id, req.params.taskId);
  if (!task) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }
  const messages = await findRecords<IMessage>(Message, { taskId: task._id }, { createdAt: 1 });
  const enriched = await Promise.all(messages.map(async (message) => {
    const sender = await findRecord<IUser>(User, message.senderId);
    return { ...message, sender: sender ? toPublicUser(sender) : null };
  }));
  await Message.updateMany(
    { taskId: task._id, receiverId: req.user!.id },
    { $set: { read: true } }
  ).exec();
  res.json({ messages: enriched });
}));

router.post(
  '/',
  authenticate,
  [body('taskId').notEmpty(), body('content').trim().notEmpty()],
  validate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { taskId, content, attachment } = req.body;
    const task = await canAccessTask(req.user!.id, String(taskId));
    if (!task) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    const receiverId = task.posterId === req.user!.id ? task.workerId : task.posterId;
    if (!receiverId) {
      res.status(400).json({ message: 'A worker must be assigned before messaging' });
      return;
    }
    const message = await insertRecord<IMessage>(Message, {
      taskId: task._id,
      senderId: req.user!.id,
      receiverId,
      content,
      attachment,
      read: false,
    });
    const sender = await findRecord<IUser>(User, req.user!.id);
    await createNotification({
      userId: receiverId,
      type: 'new_message',
      title: 'New Message',
      message: `${sender?.fullName || 'Someone'} sent you a message about "${task.title}"`,
      link: `/chat/${task._id}`,
    });
    const result = { ...message, sender: sender ? toPublicUser(sender) : null };
    emitToTask(task._id, 'new_message', result);
    res.status(201).json({ message: result });
  })
);

export default router;
