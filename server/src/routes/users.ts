import { Router } from 'express';
import type { Response } from 'express';
import { body } from 'express-validator';
import { findRecord, findRecords, updateRecord } from '../db/records';
import { Review, Task, User } from '../models/index';
import type { IReview, ITask, IUser } from '../types/index';
import { toPublicUser } from '../utils/auth';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validate';
import type { AuthRequest } from '../types/index';

const router = Router();

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await findRecord<IUser>(User, req.params.id);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ user: toPublicUser(user) });
}));

router.get('/:id/reviews', asyncHandler(async (req, res) => {
  const reviews = await findRecords<IReview>(Review, { revieweeId: req.params.id }, { createdAt: -1 });
  const enriched = await Promise.all(reviews.map(async (review) => {
    const reviewer = await findRecord<IUser>(User, review.reviewerId);
    return { ...review, reviewer: reviewer ? toPublicUser(reviewer) : null };
  }));
  res.json({ reviews: enriched });
}));

router.put(
  '/profile',
  authenticate,
  [
    body('fullName').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('location').optional().trim().notEmpty(),
    body('bio').optional().trim(),
    body('skills').optional().isArray(),
  ],
  validate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fullName, phone, location, bio, skills, profilePhoto } = req.body;
    const updated = await updateRecord<IUser>(User, req.user!.id, {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(location && { location }),
      ...(bio !== undefined && { bio }),
      ...(skills && { skills }),
      ...(profilePhoto !== undefined && { profilePhoto }),
    });
    if (!updated) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user: toPublicUser(updated, true) });
  })
);

router.get('/recommendations/:taskId', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const task = await findRecord<ITask>(Task, req.params.taskId);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  const users = await findRecords<IUser>(User, {
    role: 'user',
    isSuspended: false,
    verificationStatus: 'Verified',
    _id: { $ne: task.posterId },
  });
  const recommendations = users.map((user) => {
    const locationMatch = user.location.toLowerCase().includes(task.location.toLowerCase()) ||
      task.location.toLowerCase().includes(user.location.toLowerCase());
    const score = (locationMatch ? 40 : 0) + user.rating * 10 +
      Math.min(user.completedTasks, 20) + (user.skills?.length ? 5 : 0);
    return { user: toPublicUser(user), score, locationMatch };
  }).sort((a, b) => b.score - a.score).slice(0, 5);
  res.json({ recommendations });
}));

export default router;
