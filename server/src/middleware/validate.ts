import type { ErrorRequestHandler, RequestHandler } from 'express';
import { validationResult } from 'express-validator';

const diagnosticSecretPatterns = [
  /mongodb(?:\+srv)?:\/\/[^\s'"`,]+/gi,
  /(?:password|pwd|secret|token)=[^&\s'"`,]+/gi,
  /([?&](?:username|password|authSource|replicaSet)=)[^&\s'"`,]+/gi,
];

function redactDiagnosticText(value: string): string {
  let redacted = value.slice(0, 500);
  for (const pattern of diagnosticSecretPatterns) {
    redacted = redacted.replace(pattern, (match) => {
      if (/^mongodb(?:\+srv)?:\/\//i.test(match)) {
        return '[MongoDB URI redacted]';
      }
      return match.includes('=') ? `${match.slice(0, match.indexOf('=') + 1)}[redacted]` : '[redacted]';
    });
  }
  return redacted;
}

export function getSafeErrorDiagnostic(error: unknown): {
  errorName: string;
  errorMessage: string;
  errorCode?: string | number;
  causeName?: string;
  causeMessage?: string;
} {
  if (!(error instanceof Error)) {
    return {
      errorName: typeof error,
      errorMessage: redactDiagnosticText(String(error)),
    };
  }

  const rawCode =
    'code' in error
      ? error.code
      : undefined;
  const errorCode =
    typeof rawCode === 'number' && Number.isSafeInteger(rawCode)
      ? rawCode
      : typeof rawCode === 'string'
        ? rawCode.slice(0, 32)
        : undefined;
  const diagnostic: {
    errorName: string;
    errorMessage: string;
    errorCode?: string | number;
    causeName?: string;
    causeMessage?: string;
  } = {
    errorName: /^[A-Za-z][A-Za-z0-9]{0,39}$/.test(error.name)
      ? error.name
      : 'UnknownError',
    errorMessage: redactDiagnosticText(error.message || 'No error message'),
    ...(errorCode !== undefined ? { errorCode } : {}),
  };

  const cause = 'cause' in error ? error.cause : undefined;
  if (cause instanceof Error) {
    diagnostic.causeName = /^[A-Za-z][A-Za-z0-9]{0,39}$/.test(cause.name)
      ? cause.name
      : 'UnknownError';
    diagnostic.causeMessage = redactDiagnosticText(cause.message || 'No error message');
  }

  return diagnostic;
}

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
