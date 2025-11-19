import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { AppError } from '../../../core/errors/AppError';

export interface AuthRequest extends Request {
  userId?: string;
  tenantId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; tenantId?: string };

    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;

    next();
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
}

