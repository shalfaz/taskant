import { Router } from 'express';
import { body } from 'express-validator';
import { memoryDb } from '../db/memoryStore.js';
import { toPublicUser } from '../utils/auth.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.get('/:id', (req, res) => {
  const user = memoryDb.users.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

router.get('/:id/reviews', (req, res) => {
  const reviews = memoryDb.reviews.find((r) => r.revieweeId === req.params.id);
  const enriched = reviews.map((r) => {
    const reviewer = memoryDb.users.findById(r.reviewerId);
    return {
      ...r,
      reviewer: reviewer ? toPublicUser(reviewer) : null,
    };
  });
  res.json({ reviews: enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
});

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
  (req: AuthRequest, res) => {
    const { fullName, phone, location, bio, skills, profilePhoto } = req.body;
    const updated = memoryDb.users.update(req.user!.id, {
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
  }
);

router.get('/recommendations/:taskId', authenticate, (req: AuthRequest, res) => {
  const task = memoryDb.tasks.findById(req.params.taskId);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  const users = memoryDb.users
    .find()
    .filter(
      (u) =>
        u._id !== task.posterId &&
        u.role === 'user' &&
        !u.isSuspended &&
        u.verificationStatus === 'Verified'
    )
    .map((u) => {
      const locationMatch = u.location.toLowerCase().includes(task.location.toLowerCase()) ||
        task.location.toLowerCase().includes(u.location.toLowerCase());
      const score =
        (locationMatch ? 40 : 0) +
        u.rating * 10 +
        Math.min(u.completedTasks, 20) +
        (u.skills?.length ? 5 : 0);
      return { user: toPublicUser(u), score, locationMatch };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  res.json({ recommendations: users });
});

export default router;
