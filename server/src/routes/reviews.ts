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
    const reviewerId = req.user!.id;
    let expectedRevieweeId: string;
    if (task.posterId === reviewerId) {
      if (!task.workerId) {
        res.status(400).json({ message: 'Task has no assigned worker to review' });
        return;
      }
      expectedRevieweeId = task.workerId;
    } else if (task.workerId === reviewerId) {
      expectedRevieweeId = task.posterId;
    } else {
      res.status(403).json({ message: 'Only task participants can submit a review' });
      return;
    }
    if (String(revieweeId) !== expectedRevieweeId) {
      res.status(400).json({ message: 'You can only review the other task participant' });
      return;
    }
    const existing = await Review.exists({ taskId: task._id, reviewerId });
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
      taskId: task._id,
      reviewerId,
      revieweeId: expectedRevieweeId,
      rating: Number(rating),
      comment,
    });
    const reviewee = await findRecord<IUser>(User, expectedRevieweeId);
    if (reviewee) {
      const allReviews = await findRecords<IReview>(Review, { revieweeId: expectedRevieweeId });
      const average = allReviews.reduce((sum, item) => sum + item.rating, 0) / allReviews.length;
      await User.findByIdAndUpdate(expectedRevieweeId, {
        $set: { rating: Math.round(average * 10) / 10, reviewCount: allReviews.length },
      }).exec();
    }
    await createNotification({
      userId: expectedRevieweeId,
      type: 'new_review',
      title: 'New Review',
      message: `You received a ${rating}-star review`,
      link: `/profile/${expectedRevieweeId}`,
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
