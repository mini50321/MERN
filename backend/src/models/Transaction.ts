import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  user_id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  description?: string;
  status: string;
  payment_method?: string;
  created_at: Date;
  updated_at: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  transaction_type: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    default: 'completed'
  },
  payment_method: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

TransactionSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
