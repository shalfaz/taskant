import { Router } from 'express';
import { body } from 'express-validator';
import { memoryDb } from '../db/memoryStore.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { generateTransactionId, calculateServiceFee } from '../utils/auth.js';
import { createNotification } from '../services/notifications.js';
import { PAYMENT_METHODS } from '../config/index.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res) => {
  const payments = memoryDb.payments
    .find((p) => p.payerId === req.user!.id || p.payeeId === req.user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((p) => {
      const task = memoryDb.tasks.findById(p.taskId);
      return { ...p, taskTitle: task?.title };
    });
  res.json({ payments, methods: PAYMENT_METHODS });
});

router.post(
  '/',
  authenticate,
  [body('taskId').notEmpty(), body('method').isIn([...PAYMENT_METHODS])],
  validate,
  (req: AuthRequest, res) => {
    const task = memoryDb.tasks.findById(req.body.taskId);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    if (task.posterId !== req.user!.id) {
      res.status(403).json({ message: 'Only the task poster can make payment' });
      return;
    }
    if (task.status !== 'Completed' || !task.workerId) {
      res.status(400).json({ message: 'Task must be completed with an assigned worker' });
      return;
    }
    const existing = memoryDb.payments.findOne(
      (p) => p.taskId === task._id && p.status === 'Completed'
    );
    if (existing) {
      res.status(400).json({ message: 'Payment already completed for this task' });
      return;
    }
    const bid = task.acceptedBidId ? memoryDb.bids.findById(task.acceptedBidId) : null;
    const amount = bid?.amount || task.budget;
    const serviceFee = calculateServiceFee(amount);
    const payment = memoryDb.payments.create({
      taskId: task._id,
      payerId: req.user!.id,
      payeeId: task.workerId,
      amount,
      serviceFee,
      total: amount + serviceFee,
      method: req.body.method,
      transactionId: generateTransactionId(),
      status: 'Completed',
    });
    createNotification({
      userId: task.workerId,
      type: 'payment_update',
      title: 'Payment Received (Demo)',
      message: `Demo payment of ৳${amount} received for "${task.title}"`,
      link: `/payments`,
    });
    res.status(201).json({ payment, message: 'Demo payment completed successfully' });
  }
);

export default router;
