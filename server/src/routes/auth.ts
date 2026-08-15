import { Router } from 'express';
import { body } from 'express-validator';
import { memoryDb } from '../db/memoryStore.js';
import { hashPassword, comparePassword, signToken, toPublicUser } from '../utils/auth.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('location').trim().notEmpty().withMessage('Location is required'),
  ],
  validate,
  async (req, res) => {
    const { fullName, email, phone, password, location } = req.body;
    const existing = memoryDb.users.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }
    const hashed = await hashPassword(password);
    const user = memoryDb.users.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      password: hashed,
      location,
      role: 'user',
      verificationStatus: 'Unverified',
      rating: 0,
      reviewCount: 0,
      completedTasks: 0,
      postedTasks: 0,
      isSuspended: false,
    });
    const token = signToken(user._id, user.role);
    res.status(201).json({ token, user: toPublicUser(user, true) });
  }
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;
    const user = memoryDb.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    if (user.isSuspended) {
      res.status(403).json({ message: 'Your account has been suspended' });
      return;
    }
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const token = signToken(user._id, user.role);
    res.json({ token, user: toPublicUser(user, true) });
  }
);

router.get('/me', authenticate, (req: AuthRequest, res) => {
  const user = memoryDb.users.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ user: toPublicUser(user, true) });
});

export default router;
