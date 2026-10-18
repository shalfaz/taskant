import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/index';
import type { IUser, PublicUser } from '../types/index';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface AuthToken {
  id: string;
  role: 'user' | 'admin';
  tokenVersion: number;
}

export function signToken(
  userId: string,
  role: 'user' | 'admin',
  tokenVersion: number
): string {
  return jwt.sign({ id: userId, role, tokenVersion }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.id !== 'string' ||
      !decoded.id ||
      (decoded.role !== 'user' && decoded.role !== 'admin') ||
      !Number.isSafeInteger(decoded.tokenVersion) ||
      decoded.tokenVersion < 0
    ) {
      return null;
    }
    return {
      id: decoded.id,
      role: decoded.role,
      tokenVersion: decoded.tokenVersion,
    };
  } catch {
    return null;
  }
}

export function toPublicUser(user: IUser, includePrivate = false): PublicUser {
  const base: PublicUser = {
    _id: user._id,
    fullName: user.fullName,
    location: user.location,
    bio: user.bio,
    skills: user.skills,
    profilePhoto: user.profilePhoto,
    role: user.role,
    verificationStatus: user.verificationStatus,
    rating: user.rating,
    reviewCount: user.reviewCount,
    completedTasks: user.completedTasks,
    postedTasks: user.postedTasks,
    createdAt: user.createdAt,
  };
  if (includePrivate) {
    base.email = user.email;
    base.phone = user.phone;
  }
  return base;
}

export function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function calculateServiceFee(amount: number): number {
  return Math.round(amount * 0.05);
}
