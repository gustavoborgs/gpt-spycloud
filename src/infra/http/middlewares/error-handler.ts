import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../core/errors/AppError';
import { logger } from '../../../config/logger';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn({ err, path: req.path, method: req.method }, 'Application error');
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Unexpected error
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

