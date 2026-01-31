import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  tier_name: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  benefits: string;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  tier_name: {
    type: String,
    required: true,
    unique: true
  },
  monthly_price: {
    type: Number,
    required: true
  },
  yearly_price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  benefits: {
    type: String,
    default: '[]'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  display_order: {
    type: Number,
    default: 0
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

SubscriptionPlanSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);

