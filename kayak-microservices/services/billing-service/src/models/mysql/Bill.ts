import { mysqlPool } from '../../config/database';

export type BookingType = 'FLIGHT' | 'HOTEL' | 'CAR';
export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'OTHER';
export type TransactionStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Bill {
  billing_id: number;
  user_id: string;
  booking_type: BookingType;
  booking_id: string;
  transaction_date: Date | string;
  total_amount: number;
  payment_method: PaymentMethod;
  transaction_status: TransactionStatus;
  invoice_details: string | null;
  invoice_number: string;
}

export interface CreateBillDTO {
  userId: string;
  bookingType: BookingType;
  bookingId: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  transactionStatus?: TransactionStatus;
  invoiceDetails?: string | null;
}

export interface BillFilters {
  status?: TransactionStatus;
  userId?: string;
  bookingType?: BookingType;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

export class BillModel {
  /**
   * Generate invoice number in format: KAY-YYYYMMDD-<billing_id>
   */
  static generateInvoiceNumber(billingId: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `KAY-${year}${month}${day}-${billingId}`;
  }

  /**
   * Create a new bill
   */
  static async create(data: CreateBillDTO): Promise<Bill> {
    const connection = await mysqlPool.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

      // Generate a temporary invoice number (will be updated after we get the billing_id)
      const tempInvoiceNumber = `TEMP-${Date.now()}`;

      // Insert the bill with temporary invoice_number
      const [result] = await connection.execute(
        `INSERT INTO bills 
         (user_id, booking_type, booking_id, total_amount, payment_method, transaction_status, invoice_details, invoice_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.userId,
          data.bookingType,
          data.bookingId,
          data.totalAmount,
          data.paymentMethod,
          data.transactionStatus || 'PAID',
          data.invoiceDetails || null,
          tempInvoiceNumber,
        ]
      );

      const insertResult = result as any;
      const billingId = insertResult.insertId;

      // Generate the actual invoice number
      const invoiceNumber = this.generateInvoiceNumber(billingId);

      // Update the row with the actual invoice number
      await connection.execute(
        'UPDATE bills SET invoice_number = ? WHERE billing_id = ?',
        [invoiceNumber, billingId]
      );

      // Commit transaction
      await connection.commit();

      // Fetch and return the complete record
      const bill = await this.findById(billingId);
      if (!bill) {
        throw new Error('Failed to retrieve created bill');
      }
      return bill;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find bill by billing_id
   */
  static async findById(billingId: number): Promise<Bill | null> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM bills WHERE billing_id = ?',
      [billingId]
    );

    const bills = rows as Bill[];
    return bills.length > 0 ? bills[0] : null;
  }

  /**
   * Find all bills with optional filters
   */
  static async findAll(filters?: BillFilters): Promise<Bill[]> {
    let query = 'SELECT * FROM bills WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND transaction_status = ?';
      params.push(filters.status);
    }

    if (filters?.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters?.bookingType) {
      query += ' AND booking_type = ?';
      params.push(filters.bookingType);
    }

    if (filters?.from) {
      query += ' AND DATE(transaction_date) >= ?';
      params.push(filters.from);
    }

    if (filters?.to) {
      query += ' AND DATE(transaction_date) <= ?';
      params.push(filters.to);
    }

    query += ' ORDER BY transaction_date DESC';

    const [rows] = await mysqlPool.execute(query, params);
    return rows as Bill[];
  }

  /**
   * Delete a bill by billing_id
   */
  static async delete(billingId: number): Promise<boolean> {
    const [result] = await mysqlPool.execute(
      'DELETE FROM bills WHERE billing_id = ?',
      [billingId]
    );

    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
  }
}

