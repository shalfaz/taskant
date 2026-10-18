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
import { disconnectUserSockets } from '../socket/sessions';

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
    const token = signToken(user._id, user.role, user.tokenVersion ?? 0);
    res.status(201).json({ token, user: toPublicUser(user, true) });
  })
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    res.locals.diagnosticStage = 'auth.login.user_lookup';
    const user = await User.findOne({ email: String(email).toLowerCase() }).lean().exec();
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    res.locals.diagnosticStage = 'auth.login.user_normalize';
    const record = toRecord<IUser>(user);
    if (record.isSuspended) {
      res.status(403).json({ message: 'Your account has been suspended' });
      return;
    }
    res.locals.diagnosticStage = 'auth.login.password_compare';
    if (!(await comparePassword(password, record.password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    res.locals.diagnosticStage = 'auth.login.jwt_sign';
    const token = signToken(record._id, record.role, record.tokenVersion ?? 0);
    res.locals.diagnosticStage = 'auth.login.response';
    res.json({ token, user: toPublicUser(record, true) });
  })
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await User.updateOne(
      { _id: req.user!.id },
      { $inc: { tokenVersion: 1 } }
    ).exec();
    if (result.matchedCount === 0) {
      res.status(401).json({ message: 'Account not found' });
      return;
    }
    disconnectUserSockets(req.user!.id);
    res.status(204).end();
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
