import { Router } from 'express';
import { body } from 'express-validator';
import { memoryDb } from '../db/memoryStore.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createNotification } from '../services/notifications.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('documentType').trim().notEmpty(),
    body('documentNumber').trim().notEmpty(),
  ],
  validate,
  (req: AuthRequest, res) => {
    const existing = memoryDb.verifications.findOne(
      (v) => v.userId === req.user!.id && v.status === 'Pending'
    );
    if (existing) {
      res.status(400).json({ message: 'You already have a pending verification request' });
      return;
    }
    const verification = memoryDb.verifications.create({
      userId: req.user!.id,
      documentType: req.body.documentType,
      documentNumber: req.body.documentNumber,
      notes: req.body.notes,
      status: 'Pending',
    });
    memoryDb.users.update(req.user!.id, { verificationStatus: 'Pending' });
    res.status(201).json({ verification });
  }
);

router.get('/status', authenticate, (req: AuthRequest, res) => {
  const user = memoryDb.users.findById(req.user!.id);
  const verification = memoryDb.verifications.find(
    (v) => v.userId === req.user!.id
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  res.json({ status: user?.verificationStatus, verification });
});

export default router;
