import { Router } from 'express';
import { body, query } from 'express-validator';
import { memoryDb } from '../db/memoryStore.js';
import { toPublicUser } from '../utils/auth.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { TASK_CATEGORIES } from '../config/index.js';
import type { AuthRequest, ITask } from '../types/index.js';

const router = Router();

function enrichTask(task: ITask) {
  const poster = memoryDb.users.findById(task.posterId);
  const worker = task.workerId ? memoryDb.users.findById(task.workerId) : null;
  const bidCount = memoryDb.bids.find((b) => b.taskId === task._id && b.status === 'Pending').length;
  return {
    ...task,
    poster: poster ? toPublicUser(poster) : null,
    worker: worker ? toPublicUser(worker) : null,
    bidCount,
  };
}

router.get('/', optionalAuth, (req, res) => {
  const {
    search,
    category,
    location,
    minBudget,
    maxBudget,
    status,
    sort = 'newest',
    mine,
    accepted,
    posted,
  } = req.query;

  let tasks = memoryDb.tasks.find();

  if (mine === 'posted' && (req as AuthRequest).user) {
    tasks = tasks.filter((t) => t.posterId === (req as AuthRequest).user!.id);
  } else if (mine === 'accepted' && (req as AuthRequest).user) {
    tasks = tasks.filter((t) => t.workerId === (req as AuthRequest).user!.id);
  } else if (posted !== 'true') {
    tasks = tasks.filter((t) => !['Cancelled'].includes(t.status));
  }

  if (search) {
    const s = String(search).toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s) ||
        t.location.toLowerCase().includes(s)
    );
  }
  if (category) tasks = tasks.filter((t) => t.category === category);
  if (location) {
    const loc = String(location).toLowerCase();
    tasks = tasks.filter((t) => t.location.toLowerCase().includes(loc));
  }
  if (minBudget) tasks = tasks.filter((t) => t.budget >= Number(minBudget));
  if (maxBudget) tasks = tasks.filter((t) => t.budget <= Number(maxBudget));
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (accepted === 'true' && (req as AuthRequest).user) {
    tasks = tasks.filter((t) => t.workerId === (req as AuthRequest).user!.id);
  }

  tasks.sort((a, b) => {
    switch (sort) {
      case 'budget-high':
        return b.budget - a.budget;
      case 'budget-low':
        return a.budget - b.budget;
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  res.json({ tasks: tasks.map(enrichTask), categories: TASK_CATEGORIES });
});

router.get('/featured', (_req, res) => {
  const tasks = memoryDb.tasks
    .find((t) => ['Open', 'Bidding'].includes(t.status))
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 6)
    .map(enrichTask);
  res.json({ tasks });
});

router.get('/:id', optionalAuth, (req, res) => {
  const task = memoryDb.tasks.findById(req.params.id);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  res.json({ task: enrichTask(task) });
});

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
  (req: AuthRequest, res) => {
    const task = memoryDb.tasks.create({
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
    const poster = memoryDb.users.findById(req.user!.id);
    if (poster) {
      memoryDb.users.update(poster._id, { postedTasks: poster.postedTasks + 1 });
    }
    res.status(201).json({ task: enrichTask(task) });
  }
);

router.patch('/:id/status', authenticate, (req: AuthRequest, res) => {
  const task = memoryDb.tasks.findById(req.params.id);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  const { status, note } = req.body;
  const userId = req.user!.id;
  const isPoster = task.posterId === userId;
  const isWorker = task.workerId === userId;

  if (status === 'In Progress' && isWorker && task.status === 'Assigned') {
    const updated = memoryDb.tasks.update(task._id, {
      status: 'In Progress',
      progressNotes: [
        ...(task.progressNotes || []),
        { note: note || 'Task started', status: 'In Progress', createdAt: new Date() },
      ],
    });
    res.json({ task: enrichTask(updated!) });
    return;
  }

  if (status === 'Completed' && isWorker && task.status === 'In Progress') {
    const updated = memoryDb.tasks.update(task._id, {
      status: 'Completed',
      progressNotes: [
        ...(task.progressNotes || []),
        { note: note || 'Task marked as completed by worker', status: 'Completed', createdAt: new Date() },
      ],
    });
    res.json({ task: enrichTask(updated!) });
    return;
  }

  if (status === 'Completed' && isPoster && task.status === 'Completed') {
    res.json({ task: enrichTask(task), message: 'Awaiting payment and review' });
    return;
  }

  if (status === 'Cancelled' && isPoster && ['Open', 'Bidding'].includes(task.status)) {
    const updated = memoryDb.tasks.update(task._id, { status: 'Cancelled' });
    res.json({ task: enrichTask(updated!) });
    return;
  }

  res.status(400).json({ message: 'Invalid status transition' });
});

router.post('/:id/confirm-completion', authenticate, (req: AuthRequest, res) => {
  const task = memoryDb.tasks.findById(req.params.id);
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
  const worker = memoryDb.users.findById(task.workerId!);
  if (worker) {
    memoryDb.users.update(worker._id, { completedTasks: worker.completedTasks + 1 });
  }
  res.json({ task: enrichTask(task), message: 'Completion confirmed. Proceed to payment.' });
});

export default router;
