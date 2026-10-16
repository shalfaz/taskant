import { Router } from 'express';
import type { Response } from 'express';
import { body } from 'express-validator';
import { findRecord, findRecords, insertRecord, updateRecord } from '../db/records';
import { Bid, Task, User } from '../models/index';
import type { ITask, IUser } from '../types/index';
import { toPublicUser } from '../utils/auth';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validate';
import { TASK_CATEGORIES } from '../config/index';
import type { AuthRequest } from '../types/index';

const router = Router();

async function enrichTask(task: ITask) {
  const [poster, worker, bidCount] = await Promise.all([
    findRecord<IUser>(User, task.posterId),
    task.workerId ? findRecord<IUser>(User, task.workerId) : Promise.resolve(null),
    Bid.countDocuments({ taskId: task._id, status: 'Pending' }),
  ]);
  return {
    ...task,
    poster: poster ? toPublicUser(poster) : null,
    worker: worker ? toPublicUser(worker) : null,
    bidCount,
  };
}

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { search, category, location, minBudget, maxBudget, status, sort = 'newest', mine, accepted, posted } = req.query;
  const query: Record<string, unknown> = {};
  const authUser = (req as AuthRequest).user;
  if (mine === 'posted' && authUser) query.posterId = authUser.id;
  else if (mine === 'accepted' && authUser) query.workerId = authUser.id;
  else if (posted !== 'true') query.status = { $ne: 'Cancelled' };
  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = { $regex: escaped, $options: 'i' };
    query.$or = [{ title: match }, { description: match }, { location: match }];
  }
  if (category) query.category = category;
  if (location) {
    const escaped = String(location).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.location = { $regex: escaped, $options: 'i' };
  }
  if (minBudget || maxBudget) {
    query.budget = {
      ...(minBudget && { $gte: Number(minBudget) }),
      ...(maxBudget && { $lte: Number(maxBudget) }),
    };
  }
  if (status) query.status = status;
  if (accepted === 'true' && authUser) query.workerId = authUser.id;

  const sortBy: Record<string, 1 | -1> =
    sort === 'budget-high' ? { budget: -1 } :
      sort === 'budget-low' ? { budget: 1 } :
        sort === 'deadline' ? { deadline: 1 } : { createdAt: -1 };
  const tasks = await findRecords<ITask>(Task, query, sortBy);
  res.json({ tasks: await Promise.all(tasks.map(enrichTask)), categories: TASK_CATEGORIES });
}));

router.get('/featured', asyncHandler(async (_req, res) => {
  const tasks = await findRecords<ITask>(Task, { status: { $in: ['Open', 'Bidding'] } }, { budget: -1 });
  res.json({ tasks: await Promise.all(tasks.slice(0, 6).map(enrichTask)) });
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const task = await findRecord<ITask>(Task, req.params.id);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  res.json({ task: await enrichTask(task) });
}));

router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('category').isIn([...TASK_CATEGORIES]),
    body('location').trim().notEmpty(),
    body('deadline').isISO8601(),
    body('budget').isFloat({ min: 1 }),
  ],
  validate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const task = await insertRecord<ITask>(Task, {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      location: req.body.location,
      deadline: new Date(req.body.deadline),
      budget: Number(req.body.budget),
      additionalInstructions: req.body.additionalInstructions,
      attachments: req.body.attachments || [],
      status: 'Open',
      posterId: req.user!.id,
      progressNotes: [],
    });
    await User.findByIdAndUpdate(req.user!.id, { $inc: { postedTasks: 1 } }).exec();
    res.status(201).json({ task: await enrichTask(task) });
  })
);

router.patch('/:id/status', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const task = await findRecord<ITask>(Task, req.params.id);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  const { status, note } = req.body;
  const userId = req.user!.id;
  const isPoster = task.posterId === userId;
  const isWorker = task.workerId === userId;
  let updated: ITask | null = null;
  if (status === 'In Progress' && isWorker && task.status === 'Assigned') {
    updated = await updateRecord<ITask>(Task, task._id, {
      status,
      progressNotes: [...(task.progressNotes || []), { note: note || 'Task started', status, createdAt: new Date() }],
    });
  } else if (status === 'Completed' && isWorker && task.status === 'In Progress') {
    updated = await updateRecord<ITask>(Task, task._id, {
      status,
      progressNotes: [...(task.progressNotes || []), { note: note || 'Task marked as completed by worker', status, createdAt: new Date() }],
    });
  } else if (status === 'Completed' && isPoster && task.status === 'Completed') {
    res.json({ task: await enrichTask(task), message: 'Awaiting payment and review' });
    return;
  } else if (status === 'Cancelled' && isPoster && ['Open', 'Bidding'].includes(task.status)) {
    updated = await updateRecord<ITask>(Task, task._id, { status });
  } else {
    res.status(400).json({ message: 'Invalid status transition' });
    return;
  }
  if (updated) {
    res.json({ task: await enrichTask(updated) });
    return;
  }
  res.status(404).json({ message: 'Task not found' });
}));

router.post('/:id/confirm-completion', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const task = await findRecord<ITask>(Task, req.params.id);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  if (task.posterId !== req.user!.id) {
    res.status(403).json({ message: 'Only the task poster can confirm completion' });
    return;
  }
  if (task.status !== 'Completed') {
    res.status(400).json({ message: 'Task must be marked completed by worker first' });
    return;
  }
  if (task.workerId) await User.findByIdAndUpdate(task.workerId, { $inc: { completedTasks: 1 } }).exec();
  res.json({ task: await enrichTask(task), message: 'Completion confirmed. Proceed to payment.' });
}));

export default router;
