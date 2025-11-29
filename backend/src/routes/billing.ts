import express, { Request, Response, NextFunction } from 'express';
import { BillModel, CreateBillDTO, BillFilters, TransactionStatus } from '../models/mysql/Bill';
import { AppError } from '../middleware/errorHandler';
import { Log } from '../models/mongodb/Log';

const router = express.Router();

/**
 * POST /api/billing
 * Create a new billing record
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId,
      bookingType,
      bookingId,
      totalAmount,
      paymentMethod,
      transactionStatus,
      invoiceDetails,
    } = req.body;

    // Validate required fields
    if (!userId || !bookingType || !bookingId || totalAmount === undefined || !paymentMethod) {
      const error: AppError = new Error('Missing required fields: userId, bookingType, bookingId, totalAmount, paymentMethod');
      error.statusCode = 400;
      return next(error);
    }

    // Validate bookingType enum
    if (!['FLIGHT', 'HOTEL', 'CAR'].includes(bookingType)) {
      const error: AppError = new Error('Invalid bookingType. Must be FLIGHT, HOTEL, or CAR');
      error.statusCode = 400;
      return next(error);
    }

    // Validate paymentMethod enum
    if (!['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'OTHER'].includes(paymentMethod)) {
      const error: AppError = new Error('Invalid paymentMethod. Must be CREDIT_CARD, DEBIT_CARD, PAYPAL, or OTHER');
      error.statusCode = 400;
      return next(error);
    }

    // Validate transactionStatus if provided
    if (transactionStatus && !['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(transactionStatus)) {
      const error: AppError = new Error('Invalid transactionStatus. Must be PENDING, PAID, OVERDUE, or CANCELLED');
      error.statusCode = 400;
      return next(error);
    }

    // Validate totalAmount is a positive number
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      const error: AppError = new Error('totalAmount must be a positive number');
      error.statusCode = 400;
      return next(error);
    }

    const createData: CreateBillDTO = {
      userId,
      bookingType,
      bookingId,
      totalAmount,
      paymentMethod,
      transactionStatus: transactionStatus || 'PAID',
      invoiceDetails: invoiceDetails || null,
    };

    const bill = await BillModel.create(createData);

    // Log the creation
    try {
      await Log.create({
        level: 'info',
        message: `Bill created: ${bill.invoice_number}`,
        service: 'billing-api',
        billing_record_id: bill.billing_id.toString(),
        customer_id: bill.user_id,
        metadata: {
          invoice_number: bill.invoice_number,
          total_amount: bill.total_amount,
          booking_type: bill.booking_type,
        },
      });
    } catch (logError) {
      console.error('Logging error:', logError);
    }

    res.status(201).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billing
 * List billing records with optional filters
 * Query params: status, userId, from, to
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, userId, bookingType, from, to } = req.query;

    const filters: BillFilters = {};

    if (status) {
      if (!['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status as string)) {
        const error: AppError = new Error('Invalid status. Must be PENDING, PAID, OVERDUE, or CANCELLED');
        error.statusCode = 400;
        return next(error);
      }
      filters.status = status as TransactionStatus;
    }

    if (userId) {
      filters.userId = userId as string;
    }

    if (bookingType) {
      if (!['FLIGHT', 'HOTEL', 'CAR'].includes(bookingType as string)) {
        const error: AppError = new Error('Invalid bookingType. Must be FLIGHT, HOTEL, or CAR');
        error.statusCode = 400;
        return next(error);
      }
      filters.bookingType = bookingType as 'FLIGHT' | 'HOTEL' | 'CAR';
    }

    if (from) {
      // Validate date format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from as string)) {
        const error: AppError = new Error('Invalid from date format. Use YYYY-MM-DD');
        error.statusCode = 400;
        return next(error);
      }
      filters.from = from as string;
    }

    if (to) {
      // Validate date format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(to as string)) {
        const error: AppError = new Error('Invalid to date format. Use YYYY-MM-DD');
        error.statusCode = 400;
        return next(error);
      }
      filters.to = to as string;
    }

    const bills = await BillModel.findAll(filters);

    res.json({
      success: true,
      data: bills,
      count: bills.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billing/:id
 * Get a single billing record by billing_id
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Validate id is a number
    const billingId = parseInt(id, 10);
    if (isNaN(billingId)) {
      const error: AppError = new Error('Invalid billing ID. Must be a number');
      error.statusCode = 400;
      return next(error);
    }

    const bill = await BillModel.findById(billingId);

    if (!bill) {
      const error: AppError = new Error('Billing record not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/billing/:id
 * Delete a billing record by billing_id
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Validate id is a number
    const billingId = parseInt(id, 10);
    if (isNaN(billingId)) {
      const error: AppError = new Error('Invalid billing ID. Must be a number');
      error.statusCode = 400;
      return next(error);
    }

    // Check if bill exists
    const bill = await BillModel.findById(billingId);
    if (!bill) {
      const error: AppError = new Error('Billing record not found');
      error.statusCode = 404;
      return next(error);
    }

    // Delete the bill
    const deleted = await BillModel.delete(billingId);

    if (!deleted) {
      const error: AppError = new Error('Failed to delete billing record');
      error.statusCode = 500;
      return next(error);
    }

    // Log the deletion
    try {
      await Log.create({
        level: 'info',
        message: `Bill deleted: ${bill.invoice_number}`,
        service: 'billing-api',
        billing_record_id: bill.billing_id.toString(),
        customer_id: bill.user_id,
        metadata: {
          invoice_number: bill.invoice_number,
          total_amount: bill.total_amount,
          booking_type: bill.booking_type,
        },
      });
    } catch (logError) {
      console.error('Logging error:', logError);
    }

    res.json({
      success: true,
      message: 'Billing record deleted successfully',
      data: {
        billing_id: billingId,
        invoice_number: bill.invoice_number,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
