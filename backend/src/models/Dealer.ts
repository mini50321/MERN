import mongoose, { Schema, Document } from 'mongoose';

export interface IDealer extends Document {
  business_user_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

const DealerSchema = new Schema<IDealer>({
  business_user_id: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: String,
  address: String,
  city: String,
  state: String,
  country: String,
  pincode: String,
  is_verified: {
    type: Boolean,
    default: false
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

DealerSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Dealer = mongoose.model<IDealer>('Dealer', DealerSchema);

