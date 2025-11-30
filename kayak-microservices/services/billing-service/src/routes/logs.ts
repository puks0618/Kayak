import express, { Request, Response, NextFunction } from 'express';
import { Log } from '../models/mongodb/Log';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Get logs with filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level, service, billing_record_id, customer_id, limit = '100' } = req.query;

    const query: any = {};
    if (level) query.level = level;
    if (service) query.service = service;
    if (billing_record_id) query.billing_record_id = billing_record_id;
    if (customer_id) query.customer_id = customer_id;

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
      .lean();

    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    next(error);
  }
});

// Create a log entry
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level, message, service, billing_record_id, invoice_id, customer_id, metadata } = req.body;

    if (!level || !message || !service) {
      const error: AppError = new Error('Missing required fields: level, message, service');
      error.statusCode = 400;
      return next(error);
    }

    const log = await Log.create({
      level,
      message,
      service,
      billing_record_id,
      invoice_id,
      customer_id,
      metadata,
    });

    res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

export default router;


