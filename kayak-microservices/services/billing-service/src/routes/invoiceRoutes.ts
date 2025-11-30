import express, { Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import { BillModel } from '../models/mysql/Bill';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

/**
 * GET /api/billing/invoices/test
 * Test endpoint to list all bills (for debugging)
 */
router.get('/invoices/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bills = await BillModel.findAll();
    res.json({
      success: true,
      count: bills.length,
      bills: bills.map(b => ({
        billing_id: b.billing_id,
        invoice_number: b.invoice_number,
        user_id: b.user_id,
        total_amount: b.total_amount,
        invoice_url: `/api/billing/${b.billing_id}/invoice`
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billing/:id/invoice
 * Generate and stream a PDF invoice for a billing record
 */
router.get('/:id/invoice', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== Invoice Route Hit ===');
    console.log('Billing ID:', req.params.id);
    console.log('Full URL:', req.url);
    console.log('Full path:', req.path);
    
    const { id } = req.params;

    // Validate id is a number
    const billingId = parseInt(id, 10);
    if (isNaN(billingId)) {
      console.error(`Invalid billing ID: ${id}`);
      const error: AppError = new Error('Invalid billing ID. Must be a number');
      error.statusCode = 400;
      return next(error);
    }

    console.log(`Looking up billing record ${billingId} in database...`);
    
    // Look up the billing record
    const bill = await BillModel.findById(billingId);

    if (!bill) {
      console.error(`Billing record ${billingId} not found in database`);
      // Return 404 HTML error page for better iframe display
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Invoice Not Found</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #dc2626;">Invoice Not Found</h1>
          <p>Billing record #${billingId} does not exist in the database.</p>
          <p style="color: #6b7280;">Please check the billing ID and try again.</p>
        </body>
        </html>
      `);
    }

    console.log(`Found billing record:`, {
      billing_id: bill.billing_id,
      invoice_number: bill.invoice_number,
      user_id: bill.user_id,
      total_amount: bill.total_amount
    });
    console.log('Generating PDF...');

    // Convert total_amount to number (MySQL may return as string)
    const totalAmount = typeof bill.total_amount === 'string' 
      ? parseFloat(bill.total_amount) 
      : bill.total_amount;

    // Set PDF headers before creating the document
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${bill.invoice_number}.pdf`);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Handle PDF stream errors (just log, can't send response after piping starts)
    doc.on('error', (error) => {
      console.error('PDF generation error:', error);
      if (!res.writableEnded) {
        res.end();
      }
    });

    // Pipe PDF to response AFTER setting up error handlers
    doc.pipe(res);

    // Title
    doc.fontSize(24)
       .text('KAYAK Billing Invoice', { align: 'center' })
       .moveDown(2);

    // Invoice Number
    doc.fontSize(14)
       .text(`Invoice Number: ${bill.invoice_number}`, { align: 'left' })
       .moveDown(1);

    // Transaction Date
    const transactionDate = new Date(bill.transaction_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Transaction Date: ${transactionDate}`, { align: 'left' })
       .moveDown(1);

    // User ID
    doc.text(`User ID: ${bill.user_id}`, { align: 'left' })
       .moveDown(1);

    // Booking Type
    doc.text(`Booking Type: ${bill.booking_type}`, { align: 'left' })
       .moveDown(1);

    // Booking ID
    doc.text(`Booking ID: ${bill.booking_id}`, { align: 'left' })
       .moveDown(1);

    // Total Amount
    doc.fontSize(16)
       .text(`Total Amount: $${totalAmount.toFixed(2)}`, { align: 'left' })
       .moveDown(1);

    // Payment Method
    doc.fontSize(14)
       .text(`Payment Method: ${bill.payment_method}`, { align: 'left' })
       .moveDown(1);

    // Transaction Status
    doc.text(`Transaction Status: ${bill.transaction_status}`, { align: 'left' })
       .moveDown(2);

    // Invoice Details
    if (bill.invoice_details) {
      doc.fontSize(12)
         .text('Invoice Details:', { align: 'left' })
         .moveDown(0.5)
         .fontSize(10)
         .text(bill.invoice_details, { align: 'left' });
    }

    // Finalize PDF
    doc.end();

    // Handle response errors
    res.on('error', (error) => {
      console.error('Response error:', error);
    });

    console.log('✅ PDF generated successfully');
  } catch (error) {
    console.error('Error generating invoice:', error);
    // Only call next if headers haven't been sent
    if (!res.headersSent) {
      next(error);
    } else {
      // Can't send error response after streaming started
      console.error('Error after headers sent - ending response');
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
});

export default router;

