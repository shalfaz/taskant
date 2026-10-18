import type { Response, NextFunction } from 'express';
import type { AuthRequest, IUser } from '../types/index';
import { findRecord } from '../db/records';
import { User } from '../models/index';
import { verifyToken } from '../utils/auth';
import { asyncHandler } from './validate';

export const authenticate = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const decoded = verifyToken(header.split(' ')[1]);
    if (!decoded) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }
    const user = await findRecord<IUser>(User, decoded.id);
    if (!user || user.isSuspended) {
      res.status(401).json({ message: 'Account not found or suspended' });
      return;
    }
    if (decoded.tokenVersion !== (user.tokenVersion ?? 0)) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }
    req.user = { id: decoded.id, role: user.role };
    _next();
  }
);

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
}

export const optionalAuth = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const decoded = verifyToken(header.split(' ')[1]);
      if (decoded) {
        const user = await findRecord<IUser>(User, decoded.id);
        if (
          user &&
          !user.isSuspended &&
          decoded.tokenVersion === (user.tokenVersion ?? 0)
        ) {
          req.user = { id: decoded.id, role: user.role };
        }
      }
    }
    next();
  }
);
