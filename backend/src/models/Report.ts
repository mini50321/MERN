import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  report_type: 'post' | 'exhibition' | 'profile';
  reported_item_id: string;
  reporter_user_id: string;
  reported_user_id?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'resolved';
  admin_notes?: string;
  created_at: Date;
  updated_at: Date;
}

const ReportSchema = new Schema<IReport>({
  report_type: {
    type: String,
    required: true,
    enum: ['post', 'exhibition', 'profile'],
    index: true
  },
  reported_item_id: {
    type: String,
    required: true,
    index: true
  },
  reporter_user_id: {
    type: String,
    required: true,
    index: true
  },
  reported_user_id: {
    type: String,
    index: true
  },
  reason: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    required: true,
    enum: ['pending', 'resolved'],
    default: 'pending',
    index: true
  },
  admin_notes: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

ReportSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Report = mongoose.model<IReport>('Report', ReportSchema);

