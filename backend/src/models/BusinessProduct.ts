import mongoose, { Schema, Document } from 'mongoose';

export interface IBusinessProduct extends Document {
  business_user_id: string;
  name: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  model_number?: string;
  specifications?: string;
  dealer_price?: number;
  customer_price?: number;
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const BusinessProductSchema = new Schema<IBusinessProduct>({
  business_user_id: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: String,
  manufacturer: String,
  model_number: String,
  specifications: String,
  dealer_price: Number,
  customer_price: Number,
  currency: {
    type: String,
    default: 'INR'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

BusinessProductSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const BusinessProduct = mongoose.model<IBusinessProduct>('BusinessProduct', BusinessProductSchema);
