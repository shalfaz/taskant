import { Router } from 'express';
import type { Response } from 'express';
import { body } from 'express-validator';
import { findRecord, findRecords, insertRecord } from '../db/records';
import { Payment, Review, Task, User } from '../models/index';
import type { IReview, ITask, IUser } from '../types/index';
import { toPublicUser } from '../utils/auth';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validate';
import { createNotification } from '../services/notifications';
import type { AuthRequest } from '../types/index';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('taskId').notEmpty(),
    body('revieweeId').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty(),
  ],
  validate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { taskId, revieweeId, rating, comment } = req.body;
    const task = await findRecord<ITask>(Task, String(taskId));
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    if (task.status !== 'Completed') {
      res.status(400).json({ message: 'Can only review completed tasks' });
      return;
    }
    const existing = await Review.exists({ taskId, reviewerId: req.user!.id });
    if (existing) {
      res.status(400).json({ message: 'You have already reviewed this task' });
      return;
    }
    const payment = await Payment.exists({ taskId, status: 'Completed' });
    if (!payment && task.posterId === req.user!.id) {
      res.status(400).json({ message: 'Please complete demo payment before reviewing' });
      return;
    }
    const review = await insertRecord<IReview>(Review, {
      taskId,
      reviewerId: req.user!.id,
      revieweeId,
      rating: Number(rating),
      comment,
    });
    const reviewee = await findRecord<IUser>(User, String(revieweeId));
    if (reviewee) {
      const allReviews = await findRecords<IReview>(Review, { revieweeId: String(revieweeId) });
      const average = allReviews.reduce((sum, item) => sum + item.rating, 0) / allReviews.length;
      await User.findByIdAndUpdate(revieweeId, {
        $set: { rating: Math.round(average * 10) / 10, reviewCount: allReviews.length },
      }).exec();
    }
    await createNotification({
      userId: String(revieweeId),
      type: 'new_review',
      title: 'New Review',
      message: `You received a ${rating}-star review`,
      link: `/profile/${revieweeId}`,
    });
    res.status(201).json({ review });
  })
);

router.get('/user/:userId', asyncHandler(async (req, res) => {
  const reviews = await findRecords<IReview>(Review, { revieweeId: req.params.userId }, { createdAt: -1 });
  res.json({
    reviews: await Promise.all(reviews.map(async (review) => {
      const [reviewer, task] = await Promise.all([
        findRecord<IUser>(User, review.reviewerId),
        findRecord<ITask>(Task, review.taskId),
      ]);
      return {
        ...review,
        reviewer: reviewer ? toPublicUser(reviewer) : null,
        taskTitle: task?.title,
      };
    })),
  });
}));

export default router;
