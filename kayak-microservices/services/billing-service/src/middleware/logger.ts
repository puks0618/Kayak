import { Request, Response, NextFunction } from 'express';
import { Log } from '../models/mongodb/Log';

export const logRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Log to console for debugging
  console.log(`[${req.method}] ${req.path}`, req.params);
  
  try {
    await Log.create({
      level: 'info',
      message: `${req.method} ${req.path}`,
      service: 'billing-api',
      metadata: {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
      },
    });
  } catch (error) {
    // Don't block request if logging fails
    console.error('Logging error:', error);
  }
  next();
};

export const logError = async (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Log.create({
      level: 'error',
      message: error.message,
      service: 'billing-api',
      metadata: {
        method: req.method,
        path: req.path,
        stack: error.stack,
      },
    });
  } catch (logError) {
    console.error('Error logging failed:', logError);
  }
  next(error);
};

