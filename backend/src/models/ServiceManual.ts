import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceManual extends Document {
  title: string;
  manufacturer?: string;
  model_number?: string;
  equipment_type?: string;
  description?: string;
  file_url?: string;
  thumbnail_url?: string;
  uploaded_by_user_id?: string;
  is_verified: boolean;
  download_count: number;
  tags?: string;
  created_at: Date;
  updated_at: Date;
}

const ServiceManualSchema = new Schema<IServiceManual>({
  title: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String,
    index: true
  },
  model_number: String,
  equipment_type: {
    type: String,
    index: true
  },
  description: String,
  file_url: String,
  thumbnail_url: String,
  uploaded_by_user_id: String,
  is_verified: {
    type: Boolean,
    default: false
  },
  download_count: {
    type: Number,
    default: 0
  },
  tags: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

ServiceManualSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const ServiceManual = mongoose.model<IServiceManual>('ServiceManual', ServiceManualSchema);
