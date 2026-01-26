import mongoose, { Schema, Document } from 'mongoose';

export interface IEngineer extends Document {
  business_user_id: string;
  name: string;
  email: string;
  phone?: string;
  specialisation?: string;
  experience_years?: number;
  certifications?: string;
  city?: string;
  state?: string;
  country?: string;
  created_at: Date;
  updated_at: Date;
}

const EngineerSchema = new Schema<IEngineer>({
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
  specialisation: String,
  experience_years: Number,
  certifications: String,
  city: String,
  state: String,
  country: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

EngineerSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Engineer = mongoose.model<IEngineer>('Engineer', EngineerSchema);

