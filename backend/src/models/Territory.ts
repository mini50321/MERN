import mongoose, { Schema, Document } from 'mongoose';

export interface ITerritory extends Document {
  business_user_id: string;
  country: string;
  state?: string;
  city?: string;
  pincode?: string;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

const TerritorySchema = new Schema<ITerritory>({
  business_user_id: {
    type: String,
    required: true,
    index: true
  },
  country: {
    type: String,
    required: true
  },
  state: String,
  city: String,
  pincode: String,
  is_primary: {
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

TerritorySchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Territory = mongoose.model<ITerritory>('Territory', TerritorySchema);

