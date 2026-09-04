import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class TSApiError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
    this.name = 'TSApiError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError && err.statusCode < 500) logger.warn('HTTP', err.message);
  else if (err instanceof TSApiError && err.code === 1281) logger.info('TeamSpeak', 'Request returned an empty result set');
  else logger.error('HTTP', `${err.name}: ${err.message}`, err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof TSApiError) {
    res.status(502).json({
      error: 'TeamSpeak API Error',
      code: err.code,
      details: err.message,
    });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}
