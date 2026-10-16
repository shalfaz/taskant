import { Router } from 'express';
import type { Request, Response } from 'express';
import { body } from 'express-validator';
import { findRecord, insertRecord, toRecord } from '../db/records';
import { User } from '../models/index';
import type { IUser } from '../types/index';
import { hashPassword, comparePassword, signToken, toPublicUser } from '../utils/auth';
import { validate, asyncHandler } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../types/index';

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
  asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email, phone, password, location } = req.body;
    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean().exec();
    if (existing) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }
    let user: IUser;
    try {
      user = await insertRecord<IUser>(User, {
        fullName,
        email: normalizedEmail,
        phone,
        password: await hashPassword(password),
        location,
        role: 'user',
        verificationStatus: 'Unverified',
        rating: 0,
        reviewCount: 0,
        completedTasks: 0,
        postedTasks: 0,
        isSuspended: false,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        res.status(400).json({ message: 'Email already registered' });
        return;
      }
      throw error;
    }
    const token = signToken(user._id, user.role);
    res.status(201).json({ token, user: toPublicUser(user, true) });
  })
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() }).lean().exec();
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const record = toRecord<IUser>(user);
    if (record.isSuspended) {
      res.status(403).json({ message: 'Your account has been suspended' });
      return;
    }
    if (!(await comparePassword(password, record.password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const token = signToken(record._id, record.role);
    res.json({ token, user: toPublicUser(record, true) });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await findRecord<IUser>(User, req.user!.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user: toPublicUser(user, true) });
  })
);

export default router;
