import { Router } from 'express';
import type { Response } from 'express';
import { body } from 'express-validator';
import { findRecord, findRecords, insertRecord, updateRecord } from '../db/records';
import { User, Verification } from '../models/index';
import type { IVerification, IUser } from '../types/index';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validate';
import type { AuthRequest } from '../types/index';

const router = Router();

router.post(
  '/',
  authenticate,
  [body('documentType').trim().notEmpty(), body('documentNumber').trim().notEmpty()],
  validate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const existing = await Verification.exists({ userId: req.user!.id, status: 'Pending' });
    if (existing) {
      res.status(400).json({ message: 'You already have a pending verification request' });
      return;
    }
    const verification = await insertRecord<IVerification>(Verification, {
      userId: req.user!.id,
      documentType: req.body.documentType,
      documentNumber: req.body.documentNumber,
      notes: req.body.notes,
      status: 'Pending',
    });
    await updateRecord<IUser>(User, req.user!.id, { verificationStatus: 'Pending' });
    res.status(201).json({ verification });
  })
);

router.get('/status', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const [user, verifications] = await Promise.all([
    findRecord<IUser>(User, req.user!.id),
    findRecords<IVerification>(Verification, { userId: req.user!.id }, { createdAt: -1 }),
  ]);
  res.json({ status: user?.verificationStatus, verification: verifications[0] });
}));

export default router;
