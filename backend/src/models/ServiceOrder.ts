import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceOrder extends Document {
  patient_user_id: string;
  patient_name: string;
  patient_contact: string;
  patient_email?: string;
  patient_location?: string;
  service_type: string;
  service_category?: string;
  equipment_name?: string;
  equipment_model?: string;
  issue_description: string;
  urgency_level: string;
  assigned_engineer_id?: string;
  status: string;
  quoted_price?: number;
  quoted_currency: string;
  engineer_notes?: string;
  preferred_date?: Date;
  preferred_time?: string;
  patient_address?: string;
  patient_city?: string;
  patient_state?: string;
  patient_pincode?: string;
  patient_latitude?: number;
  patient_longitude?: number;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_address?: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  dropoff_address?: string;
  billing_frequency?: string;
  monthly_visits_count?: number;
  patient_condition?: string;
  responded_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const ServiceOrderSchema = new Schema<IServiceOrder>({
  patient_user_id: {
    type: String,
    required: true,
    index: true
  },
  patient_name: {
    type: String,
    required: true
  },
  patient_contact: {
    type: String,
    required: true
  },
  patient_email: String,
  patient_location: String,
  service_type: {
    type: String,
    required: true
  },
  service_category: String,
  equipment_name: String,
  equipment_model: String,
  issue_description: {
    type: String,
    required: true
  },
  urgency_level: {
    type: String,
    default: 'normal'
  },
  assigned_engineer_id: {
    type: String,
    index: true
  },
  status: {
    type: String,
    default: 'pending',
    index: true
  },
  quoted_price: Number,
  quoted_currency: {
    type: String,
    default: 'INR'
  },
  engineer_notes: String,
  preferred_date: Date,
  preferred_time: String,
  patient_address: String,
  patient_city: String,
  patient_state: String,
  patient_pincode: String,
  patient_latitude: Number,
  patient_longitude: Number,
  pickup_latitude: Number,
  pickup_longitude: Number,
  pickup_address: String,
  dropoff_latitude: Number,
  dropoff_longitude: Number,
  dropoff_address: String,
  billing_frequency: String,
  monthly_visits_count: Number,
  patient_condition: String,
  responded_at: Date,
  completed_at: Date,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

ServiceOrderSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const ServiceOrder = mongoose.model<IServiceOrder>('ServiceOrder', ServiceOrderSchema);
