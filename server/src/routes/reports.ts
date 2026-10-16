import { Router } from 'express';
import type { Response } from 'express';
import { body } from 'express-validator';
import { findRecords, insertRecord } from '../db/records';
import { Report } from '../models/index';
import type { IReport } from '../types/index';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validate';
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
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const report = await insertRecord<IReport>(Report, {
      reporterId: req.user!.id,
      reportType: req.body.reportType,
      description: req.body.description,
      relatedUserId: req.body.relatedUserId,
      relatedTaskId: req.body.relatedTaskId,
      attachment: req.body.attachment,
      status: 'Pending',
    });
    res.status(201).json({ report });
  })
);

router.get('/my', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const reports = await findRecords<IReport>(
    Report,
    { reporterId: req.user!.id },
    { createdAt: -1 }
  );
  res.json({ reports });
}));

export default router;
