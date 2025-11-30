import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceDocument extends Document {
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
  created_at: Date;
  updated_at: Date;
}

const InvoiceDocumentSchema = new Schema<IInvoiceDocument>(
  {
    invoice_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    billing_record_id: {
      type: String,
      required: true,
      index: true,
    },
    invoice_number: {
      type: String,
      required: true,
      index: true,
    },
    customer_id: {
      type: String,
      required: true,
      index: true,
    },
    customer_name: {
      type: String,
      required: true,
    },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit_price: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    pdf_url: {
      type: String,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const InvoiceDocument = mongoose.model<IInvoiceDocument>(
  'InvoiceDocument',
  InvoiceDocumentSchema
);


