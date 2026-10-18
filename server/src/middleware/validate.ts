import type { ErrorRequestHandler, RequestHandler } from 'express';
import { validationResult } from 'express-validator';

export function logDevelopmentDiagnostic(
  requestId: string,
  stage: string,
  error: unknown
): void {
  if (process.env.NODE_ENV !== 'development') return;

  const errorName =
    error instanceof Error && /^[A-Za-z][A-Za-z0-9]{0,39}$/.test(error.name)
      ? error.name
      : 'UnknownError';
  const rawCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : undefined;
  const errorCode =
    typeof rawCode === 'number' && Number.isSafeInteger(rawCode)
      ? rawCode
      : typeof rawCode === 'string' && /^[A-Z0-9_]{1,32}$/.test(rawCode)
        ? rawCode
        : undefined;

  console.error(
    '[TaskAnt diagnostic]',
    JSON.stringify({ requestId, stage, errorName, errorCode })
  );
}

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  void _next;
  const requestId = res.locals.requestId;
  const stage = res.locals.diagnosticStage;
  if (typeof requestId === 'string' && typeof stage === 'string') {
    logDevelopmentDiagnostic(requestId, stage, err);
  }
  res.status(500).json({ message: 'Internal server error' });
};

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
