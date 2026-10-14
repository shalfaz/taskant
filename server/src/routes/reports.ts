import { Router } from 'express';
import type { Response } from 'express';
import { body } from 'express-validator';
import { memoryDb } from '../db/memoryStore';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { REPORT_TYPES } from '../config/index';
import type { AuthRequest } from '../types/index';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('reportType').isIn([...REPORT_TYPES]),
    body('description').trim().notEmpty().isLength({ min: 10 }),
  ],
  validate,
  (req: AuthRequest, res: Response) => {
    const report = memoryDb.reports.create({
      reporterId: req.user!.id,
      reportType: req.body.reportType,
      description: req.body.description,
      relatedUserId: req.body.relatedUserId,
      relatedTaskId: req.body.relatedTaskId,
      attachment: req.body.attachment,
      status: 'Pending',
    });
    res.status(201).json({ report });
  }
);

router.get('/my', authenticate, (req: AuthRequest, res) => {
  const reports = memoryDb.reports
    .find((r) => r.reporterId === req.user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ reports });
});

export default router;
