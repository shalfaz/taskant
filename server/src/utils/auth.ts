import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import type { IUser, PublicUser } from '../types/index.js';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string, role: 'user' | 'admin'): string {
  return jwt.sign({ id: userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token: string): { id: string; role: 'user' | 'admin' } | null {
  try {
    return jwt.verify(token, config.jwtSecret) as { id: string; role: 'user' | 'admin' };
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
