import { Router } from 'express';
import type { Response } from 'express';
import { body } from 'express-validator';
import { findRecord, findRecords, insertRecord } from '../db/records';
import { Bid, Payment, Task } from '../models/index';
import type { IBid, IPayment, ITask } from '../types/index';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validate';
import { generateTransactionId, calculateServiceFee } from '../utils/auth';
import { createNotification } from '../services/notifications';
import { PAYMENT_METHODS } from '../config/index';
import type { AuthRequest } from '../types/index';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const payments = await findRecords<IPayment>(
    Payment,
    { $or: [{ payerId: req.user!.id }, { payeeId: req.user!.id }] },
    { createdAt: -1 }
  );
  res.json({
    payments: await Promise.all(payments.map(async (payment) => {
      const task = await findRecord<ITask>(Task, payment.taskId);
      return { ...payment, taskTitle: task?.title };
    })),
    methods: PAYMENT_METHODS,
  });
}));

router.post(
  '/',
  authenticate,
  [body('taskId').notEmpty(), body('method').isIn([...PAYMENT_METHODS])],
  validate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const task = await findRecord<ITask>(Task, String(req.body.taskId));
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
    const existing = await Payment.exists({ taskId: task._id, status: 'Completed' });
    if (existing) {
      res.status(400).json({ message: 'Payment already completed for this task' });
      return;
    }
    const bid = task.acceptedBidId ? await findRecord<IBid>(Bid, task.acceptedBidId) : null;
    const amount = bid?.amount || task.budget;
    const serviceFee = calculateServiceFee(amount);
    const payment = await insertRecord<IPayment>(Payment, {
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
    await createNotification({
      userId: task.workerId,
      type: 'payment_update',
      title: 'Payment Received (Demo)',
      message: `Demo payment of ৳${amount} received for "${task.title}"`,
      link: '/payments',
    });
    res.status(201).json({ payment, message: 'Demo payment completed successfully' });
  })
);

export default router;
