import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// New Bill interface matching the backend
export interface Bill {
  billing_id: number;
  user_id: string;
  booking_type: 'FLIGHT' | 'HOTEL' | 'CAR';
  booking_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'OTHER';
  transaction_status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  invoice_details: string | null;
  invoice_number: string;
}

// Legacy interfaces (kept for backward compatibility if needed)
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

export interface InvoiceDocument {
  invoice_id: string;
  billing_record_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  pdf_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export interface BillFilters {
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  userId?: string;
  bookingType?: 'FLIGHT' | 'HOTEL' | 'CAR';
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

// Billing API - Updated to use new Bill structure
export const billingApi = {
  /**
   * Get all bills with optional filters
   */
  getAll: async (filters?: BillFilters): Promise<ApiResponse<Bill[]>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.bookingType) params.append('bookingType', filters.bookingType);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);

    const response = await api.get(`/api/billing?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single bill by billing_id
   */
  getById: async (id: number): Promise<ApiResponse<Bill>> => {
    const response = await api.get(`/api/billing/${id}`);
    return response.data;
  },

  /**
   * Create a new bill
   */
  create: async (data: {
    userId: string;
    bookingType: 'FLIGHT' | 'HOTEL' | 'CAR';
    bookingId: string;
    totalAmount: number;
    paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'OTHER';
    transactionStatus?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    invoiceDetails?: string | null;
  }): Promise<ApiResponse<Bill>> => {
    const response = await api.post('/api/billing', data);
    return response.data;
  },

  // Legacy methods (kept for backward compatibility)
  getAllLegacy: async (filters?: {
    customer_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<BillingRecord[]>> => {
    const params = new URLSearchParams();
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/api/billing?${params.toString()}`);
    return response.data;
  },

  getByIdLegacy: async (id: string): Promise<ApiResponse<BillingRecord & { invoice_document?: InvoiceDocument }>> => {
    const response = await api.get(`/api/billing/${id}`);
    return response.data;
  },

  createLegacy: async (data: CreateBillingRecordDTO): Promise<ApiResponse<BillingRecord>> => {
    const response = await api.post('/api/billing', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBillingRecordDTO): Promise<ApiResponse<BillingRecord>> => {
    const response = await api.put(`/api/billing/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/billing/${id}`);
    return response.data;
  },

  createInvoice: async (
    id: string,
    data: {
      items: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        total: number;
      }>;
      subtotal: number;
      tax?: number;
      pdf_url?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ApiResponse<InvoiceDocument>> => {
    const response = await api.post(`/api/billing/${id}/invoice`, data);
    return response.data;
  },

  getInvoice: async (id: string): Promise<ApiResponse<InvoiceDocument>> => {
    const response = await api.get(`/api/billing/${id}/invoice`);
    return response.data;
  },
};

export default api;
