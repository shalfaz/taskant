import type { ErrorRequestHandler, RequestHandler } from 'express';
import { validationResult } from 'express-validator';

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  void err;
  void _next;
  res.status(500).json({ message: 'Internal server error' });
};

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
