import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
dotenv.config();

const configuredJwtSecret = process.env.JWT_SECRET?.trim();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: configuredJwtSecret || 'taskant-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI?.trim() || '',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

if (
  config.nodeEnv === 'production' &&
  (!configuredJwtSecret ||
    config.jwtSecret === 'taskant-dev-secret-change-me' ||
    config.jwtSecret.length < 32 ||
    new Set(config.jwtSecret).size < 12)
) {
  throw new Error('JWT_SECRET must be a strong, unique secret of at least 32 characters in production.');
}

export const TASK_CATEGORIES = [
  'Document & Office Work',
  'Parcel & Delivery',
  'Shopping & Purchase',
  'Academic Services',
  'Local Errands',
  'Government/Institutional Assistance',
  'Personal Assistance',
  'Other',
] as const;

export const TASK_STATUSES = [
  'Open',
  'Bidding',
  'Assigned',
  'In Progress',
  'Completed',
  'Cancelled',
] as const;

export const VERIFICATION_STATUSES = [
  'Unverified',
  'Pending',
  'Verified',
  'Rejected',
] as const;

export const REPORT_TYPES = [
  'Suspicious User',
  'Suspicious Task',
  'Fraud',
  'Inappropriate Behavior',
  'Payment Issue',
  'Other',
] as const;

export const PAYMENT_METHODS = ['bKash Demo', 'Nagad Demo', 'Card Demo'] as const;
