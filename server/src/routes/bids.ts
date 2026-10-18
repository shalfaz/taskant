import { Router } from 'express';
import type { Response } from 'express';
import { body } from 'express-validator';
import { findRecord, findRecords, insertRecord, updateRecord } from '../db/records';
import { Bid, Task, User } from '../models/index';
import type { IBid, ITask, IUser } from '../types/index';
import { toPublicUser } from '../utils/auth';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validate';
import { createNotification } from '../services/notifications';
import type { AuthRequest } from '../types/index';

const router = Router();

async function enrichBid(bid: IBid) {
  const bidder = await findRecord<IUser>(User, bid.bidderId);
  return { ...bid, bidder: bidder ? toPublicUser(bidder) : null };
}

router.get('/task/:taskId', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const task = await findRecord<ITask>(Task, req.params.taskId);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  if (task.posterId !== req.user!.id) {
    res.status(403).json({ message: 'Only the task poster can view bids' });
    return;
  }
  const bids = await findRecords<IBid>(Bid, { taskId: req.params.taskId }, { createdAt: -1 });
  res.json({ bids: await Promise.all(bids.map(enrichBid)) });
}));

router.get('/my/pending', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const bids = await findRecords<IBid>(Bid, { bidderId: req.user!.id, status: 'Pending' });
  res.json({
    bids: await Promise.all(bids.map(async (bid) => ({
      ...bid,
      task: await findRecord<ITask>(Task, bid.taskId),
    }))),
  });
}));

router.post(
  '/',
  authenticate,
  [
    body('taskId').notEmpty(),
    body('amount').isFloat({ min: 1 }),
    body('message').trim().notEmpty(),
    body('estimatedCompletion').trim().notEmpty(),
  ],
  validate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const task = await findRecord<ITask>(Task, String(req.body.taskId));
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    if (task.posterId === req.user!.id) {
      res.status(400).json({ message: 'You cannot bid on your own task' });
      return;
    }
    if (!['Open', 'Bidding'].includes(task.status)) {
      res.status(400).json({ message: 'Task is not accepting bids' });
      return;
    }
    const existing = await Bid.exists({
      taskId: task._id,
      bidderId: req.user!.id,
      status: 'Pending',
    });
    if (existing) {
      res.status(400).json({ message: 'You already have a pending bid on this task' });
      return;
    }
    const bid = await insertRecord<IBid>(Bid, {
      taskId: task._id,
      bidderId: req.user!.id,
      amount: Number(req.body.amount),
      message: req.body.message,
      estimatedCompletion: req.body.estimatedCompletion,
      status: 'Pending',
    });
    if (task.status === 'Open') await Task.findByIdAndUpdate(task._id, { $set: { status: 'Bidding' } }).exec();
    const bidder = await findRecord<IUser>(User, req.user!.id);
    await createNotification({
      userId: task.posterId,
      type: 'new_bid',
      title: 'New Bid Received',
      message: `${bidder?.fullName || 'A user'} submitted a bid of ৳${bid.amount} on "${task.title}"`,
      link: `/tasks/${task._id}`,
    });
    res.status(201).json({ bid: await enrichBid(bid) });
  })
);

router.post('/:id/accept', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const bid = await findRecord<IBid>(Bid, req.params.id);
  if (!bid) {
    res.status(404).json({ message: 'Bid not found' });
    return;
  }
  const task = await findRecord<ITask>(Task, bid.taskId);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  if (task.posterId !== req.user!.id) {
    res.status(403).json({ message: 'Only the task poster can accept bids' });
    return;
  }
  await Bid.findByIdAndUpdate(bid._id, { $set: { status: 'Accepted' } }).exec();
  await Bid.updateMany(
    { taskId: task._id, _id: { $ne: bid._id }, status: 'Pending' },
    { $set: { status: 'Rejected' } }
  ).exec();
  const updatedTask = await updateRecord<ITask>(Task, task._id, {
    status: 'Assigned',
    workerId: bid.bidderId,
    acceptedBidId: bid._id,
    progressNotes: [
      ...(task.progressNotes || []),
      { note: 'Worker assigned', status: 'Assigned', createdAt: new Date() },
    ],
  });
  await Promise.all([
    createNotification({
      userId: bid.bidderId,
      type: 'bid_accepted',
      title: 'Bid Accepted!',
      message: `Your bid on "${task.title}" has been accepted. You are now assigned to this task.`,
      link: `/tasks/${task._id}`,
    }),
    createNotification({
      userId: task.posterId,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `A worker has been assigned to "${task.title}"`,
      link: `/tasks/${task._id}`,
    }),
  ]);
  res.json({ task: updatedTask, bid: await enrichBid(bid) });
}));

export default router;
