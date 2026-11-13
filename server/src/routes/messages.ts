import { Router } from 'express';
import type { Response } from 'express';
import { body } from 'express-validator';
import { findRecord, findRecords, insertRecord } from '../db/records';
import { Message, StoreListing, Task, User } from '../models/index';
import type { IMessage, IStoreListing, ITask, IUser } from '../types/index';
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
  const taskConversations = await Promise.all(tasks.map(async (task) => {
    const otherId = task.posterId === userId ? task.workerId : task.posterId;
    const [other, messages] = await Promise.all([
      otherId ? findRecord<IUser>(User, otherId) : Promise.resolve(null),
      findRecords<IMessage>(Message, { taskId: task._id }, { createdAt: -1 }),
    ]);
    const unread = messages.filter((message) => message.receiverId === userId && !message.read).length;
    return {
      type: 'task' as const,
      taskId: task._id,
      taskTitle: task.title,
      otherUser: other ? toPublicUser(other) : null,
      lastMessage: messages[0],
      unread,
    };
  }));
  const storeMessages = await findRecords<IMessage>(Message, {
    listingId: { $exists: true },
    $or: [{ senderId: userId }, { receiverId: userId }],
  });
  const storeConversationKeys = [...new Set(storeMessages.map((message) => {
    const listingId = message.listingId!;
    const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
    return `${listingId}:${otherUserId}`;
  }))];
  const storeConversations = await Promise.all(storeConversationKeys.map(async (key) => {
    const [listingId, otherUserId] = key.split(':');
    const [listing, other, messages] = await Promise.all([
      findRecord<IStoreListing>(StoreListing, listingId),
      findRecord<IUser>(User, otherUserId),
      findRecords<IMessage>(Message, {
        listingId,
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      }, { createdAt: -1 }),
    ]);
    if (!listing || !other || !messages.length) return null;
    return {
      type: 'listing' as const,
      listingId,
      taskTitle: listing.title,
      otherUserId,
      otherUser: toPublicUser(other),
      lastMessage: messages[0],
      unread: messages.filter((message) => message.receiverId === userId && !message.read).length,
    };
  }));
  const conversations = [
    ...taskConversations.filter((conversation) => conversation.otherUser),
    ...storeConversations.filter((conversation) => conversation !== null),
  ];
  res.json({
    conversations: conversations.sort((a, b) =>
      new Date(b.lastMessage?.createdAt || 0).getTime() -
      new Date(a.lastMessage?.createdAt || 0).getTime()),
  });
}));

router.get('/listing/:listingId/:otherUserId', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const listing = await findRecord<IStoreListing>(StoreListing, req.params.listingId);
  if (!listing) {
    res.status(404).json({ message: 'Listing not found' });
    return;
  }
  const userId = req.user!.id;
  const otherUserId = req.params.otherUserId;
  const isValidPair =
    (userId === listing.sellerId && otherUserId !== listing.sellerId) ||
    (userId !== listing.sellerId && otherUserId === listing.sellerId);
  if (!isValidPair) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }
  const messages = await findRecords<IMessage>(Message, {
    listingId: listing._id,
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  }, { createdAt: 1 });
  if (!messages.length) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }
  const enriched = await Promise.all(messages.map(async (message) => {
    const sender = await findRecord<IUser>(User, message.senderId);
    return { ...message, sender: sender ? toPublicUser(sender) : null };
  }));
  await Message.updateMany(
    {
      listingId: listing._id,
      receiverId: userId,
      senderId: otherUserId,
    },
    { $set: { read: true } }
  ).exec();
  res.json({ messages: enriched });
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
  '/store',
  authenticate,
  [body('listingId').notEmpty(), body('content').trim().notEmpty().isLength({ max: 2000 })],
  validate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const listing = await findRecord<IStoreListing>(StoreListing, String(req.body.listingId));
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    const senderId = req.user!.id;
    const receiverId = senderId === listing.sellerId
      ? String(req.body.receiverId || '')
      : listing.sellerId;
    if (senderId === listing.sellerId && !req.body.receiverId) {
      res.status(400).json({ message: 'Choose a buyer to reply to' });
      return;
    }
    if (!receiverId || receiverId === senderId) {
      res.status(400).json({ message: 'You cannot message yourself about a listing' });
      return;
    }
    if (senderId !== listing.sellerId && listing.status !== 'Available') {
      const existing = await Message.exists({
        listingId: listing._id,
        $or: [
          { senderId, receiverId: listing.sellerId },
          { senderId: listing.sellerId, receiverId: senderId },
        ],
      });
      if (!existing) {
        res.status(400).json({ message: 'This listing is no longer available' });
        return;
      }
    }
    if (senderId === listing.sellerId) {
      const existing = await Message.exists({
        listingId: listing._id,
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      });
      if (!existing) {
        res.status(403).json({ message: 'You can only reply to an existing conversation' });
        return;
      }
    }
    const message = await insertRecord<IMessage>(Message, {
      listingId: listing._id,
      senderId,
      receiverId,
      content: String(req.body.content).trim(),
      read: false,
    });
    const [sender, receiver] = await Promise.all([
      findRecord<IUser>(User, senderId),
      findRecord<IUser>(User, receiverId),
    ]);
    await createNotification({
      userId: receiverId,
      type: 'new_message',
      title: 'New Marketplace Message',
      message: `${sender?.fullName || 'Someone'} messaged you about "${listing.title}"`,
      link: `/messages?listing=${listing._id}&user=${senderId}`,
    });
    res.status(201).json({
      message: { ...message, sender: sender ? toPublicUser(sender) : null },
      receiver: receiver ? toPublicUser(receiver) : null,
    });
  })
);

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
