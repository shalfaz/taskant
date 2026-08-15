import { Router } from 'express';
import { body } from 'express-validator';
import { memoryDb } from '../db/memoryStore.js';
import { toPublicUser } from '../utils/auth.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createNotification } from '../services/notifications.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

function enrichBid(bid: ReturnType<typeof memoryDb.bids.findById>) {
  if (!bid) return null;
  const bidder = memoryDb.users.findById(bid.bidderId);
  return { ...bid, bidder: bidder ? toPublicUser(bidder) : null };
}

router.get('/task/:taskId', authenticate, (req, res) => {
  const bids = memoryDb.bids
    .find((b) => b.taskId === req.params.taskId)
    .map((b) => enrichBid(b)!)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ bids });
});

router.get('/my/pending', authenticate, (req: AuthRequest, res) => {
  const bids = memoryDb.bids
    .find((b) => b.bidderId === req.user!.id && b.status === 'Pending')
    .map((b) => {
      const task = memoryDb.tasks.findById(b.taskId);
      return { ...b, task };
    });
  res.json({ bids });
});

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
  (req: AuthRequest, res) => {
    const task = memoryDb.tasks.findById(req.body.taskId);
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
    const existing = memoryDb.bids.find(
      (b) => b.taskId === task._id && b.bidderId === req.user!.id && b.status === 'Pending'
    );
    if (existing.length > 0) {
      res.status(400).json({ message: 'You already have a pending bid on this task' });
      return;
    }
    const bid = memoryDb.bids.create({
      taskId: task._id,
      bidderId: req.user!.id,
      amount: Number(req.body.amount),
      message: req.body.message,
      estimatedCompletion: req.body.estimatedCompletion,
      status: 'Pending',
    });
    if (task.status === 'Open') {
      memoryDb.tasks.update(task._id, { status: 'Bidding' });
    }
    const bidder = memoryDb.users.findById(req.user!.id);
    createNotification({
      userId: task.posterId,
      type: 'new_bid',
      title: 'New Bid Received',
      message: `${bidder?.fullName || 'A user'} submitted a bid of ৳${bid.amount} on "${task.title}"`,
      link: `/tasks/${task._id}`,
    });
    res.status(201).json({ bid: enrichBid(bid) });
  }
);

router.post('/:id/accept', authenticate, (req: AuthRequest, res) => {
  const bid = memoryDb.bids.findById(req.params.id);
  if (!bid) {
    res.status(404).json({ message: 'Bid not found' });
    return;
  }
  const task = memoryDb.tasks.findById(bid.taskId);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  if (task.posterId !== req.user!.id) {
    res.status(403).json({ message: 'Only the task poster can accept bids' });
    return;
  }
  memoryDb.bids.update(bid._id, { status: 'Accepted' });
  memoryDb.bids
    .find((b) => b.taskId === task._id && b._id !== bid._id && b.status === 'Pending')
    .forEach((b) => memoryDb.bids.update(b._id, { status: 'Rejected' }));

  const updatedTask = memoryDb.tasks.update(task._id, {
    status: 'Assigned',
    workerId: bid.bidderId,
    acceptedBidId: bid._id,
    progressNotes: [
      ...(task.progressNotes || []),
      { note: 'Worker assigned', status: 'Assigned', createdAt: new Date() },
    ],
  });

  createNotification({
    userId: bid.bidderId,
    type: 'bid_accepted',
    title: 'Bid Accepted!',
    message: `Your bid on "${task.title}" has been accepted. You are now assigned to this task.`,
    link: `/tasks/${task._id}`,
  });
  createNotification({
    userId: task.posterId,
    type: 'task_assigned',
    title: 'Task Assigned',
    message: `A worker has been assigned to "${task.title}"`,
    link: `/tasks/${task._id}`,
  });

  res.json({ task: updatedTask, bid: enrichBid(bid) });
});

export default router;
