import { mysqlPool } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface BillingRecord {
  id: string;
  customer_id: string;
  customer_name: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBillingRecordDTO {
  customer_id: string;
  customer_name: string;
  invoice_number: string;
  amount: number;
  currency?: string;
  due_date: string;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
}

export interface UpdateBillingRecordDTO {
  customer_name?: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date?: string;
}

export class BillingRecordModel {
  static async create(data: CreateBillingRecordDTO): Promise<BillingRecord> {
    const id = uuidv4();
    
    const [result] = await mysqlPool.execute(
      `INSERT INTO billing_records 
       (id, customer_id, customer_name, invoice_number, amount, currency, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.customer_id,
        data.customer_name,
        data.invoice_number,
        data.amount,
        data.currency || 'USD',
        data.status || 'pending',
        data.due_date,
      ]
    );
    
    const created = await this.findById(id);
    if (!created) {
      throw new Error('Failed to create billing record');
    }
    return created;
  }

  static async findById(id: string): Promise<BillingRecord | null> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM billing_records WHERE id = ?',
      [id]
    );
    
    const records = rows as BillingRecord[];
    return records.length > 0 ? records[0] : null;
  }

  static async findAll(filters?: {
    customer_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<BillingRecord[]> {
    let query = 'SELECT * FROM billing_records WHERE 1=1';
    const params: any[] = [];

    if (filters?.customer_id) {
      query += ' AND customer_id = ?';
      params.push(filters.customer_id);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const [rows] = await mysqlPool.execute(query, params);
    return rows as BillingRecord[];
  }

  static async update(id: string, data: UpdateBillingRecordDTO): Promise<BillingRecord | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.customer_name !== undefined) {
      fields.push('customer_name = ?');
      values.push(data.customer_name);
    }
    if (data.amount !== undefined) {
      fields.push('amount = ?');
      values.push(data.amount);
    }
    if (data.currency !== undefined) {
      fields.push('currency = ?');
      values.push(data.currency);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(data.due_date);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await mysqlPool.execute(
      `UPDATE billing_records SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const [result] = await mysqlPool.execute(
      'DELETE FROM billing_records WHERE id = ?',
      [id]
    );
    
    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
  }

  static async findByInvoiceNumber(invoice_number: string): Promise<BillingRecord | null> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM billing_records WHERE invoice_number = ?',
      [invoice_number]
    );
    
    const records = rows as BillingRecord[];
    return records.length > 0 ? records[0] : null;
  }
}

