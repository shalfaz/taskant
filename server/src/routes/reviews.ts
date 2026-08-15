import { Router } from 'express';
import { body } from 'express-validator';
import { memoryDb } from '../db/memoryStore.js';
import { toPublicUser } from '../utils/auth.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createNotification } from '../services/notifications.js';
import type { AuthRequest } from '../types/index.js';

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
  (req: AuthRequest, res) => {
    const { taskId, revieweeId, rating, comment } = req.body;
    const task = memoryDb.tasks.findById(taskId);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    if (task.status !== 'Completed') {
      res.status(400).json({ message: 'Can only review completed tasks' });
      return;
    }
    const existing = memoryDb.reviews.findOne(
      (r) => r.taskId === taskId && r.reviewerId === req.user!.id
    );
    if (existing) {
      res.status(400).json({ message: 'You have already reviewed this task' });
      return;
    }
    const payment = memoryDb.payments.findOne(
      (p) => p.taskId === taskId && p.status === 'Completed'
    );
    if (!payment && task.posterId === req.user!.id) {
      res.status(400).json({ message: 'Please complete demo payment before reviewing' });
      return;
    }
    const review = memoryDb.reviews.create({
      taskId,
      reviewerId: req.user!.id,
      revieweeId,
      rating: Number(rating),
      comment,
    });
    const reviewee = memoryDb.users.findById(revieweeId);
    if (reviewee) {
      const allReviews = memoryDb.reviews.find((r) => r.revieweeId === revieweeId);
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      memoryDb.users.update(revieweeId, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
      });
    }
    createNotification({
      userId: revieweeId,
      type: 'new_review',
      title: 'New Review',
      message: `You received a ${rating}-star review`,
      link: `/profile/${revieweeId}`,
    });
    res.status(201).json({ review });
  }
);

router.get('/user/:userId', (req, res) => {
  const reviews = memoryDb.reviews
    .find((r) => r.revieweeId === req.params.userId)
    .map((r) => {
      const reviewer = memoryDb.users.findById(r.reviewerId);
      const task = memoryDb.tasks.findById(r.taskId);
      return {
        ...r,
        reviewer: reviewer ? toPublicUser(reviewer) : null,
        taskTitle: task?.title,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ reviews });
});

export default router;
