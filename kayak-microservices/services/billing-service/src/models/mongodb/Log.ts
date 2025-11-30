import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  service: string;
  billing_record_id?: string;
  invoice_id?: string;
  customer_id?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const LogSchema = new Schema<ILog>(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug'],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      required: true,
      index: true,
    },
    billing_record_id: {
      type: String,
      index: true,
    },
    invoice_id: {
      type: String,
      index: true,
    },
    customer_id: {
      type: String,
      index: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// TTL index to auto-delete logs older than 90 days
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

export const Log = mongoose.model<ILog>('Log', LogSchema);


