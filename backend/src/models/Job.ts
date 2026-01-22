import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description?: string;
  job_type?: string;
  location?: string;
  compensation?: string;
  experience?: string;
  company_name?: string;
  contact_email?: string;
  contact_number?: string;
  posted_by_user_id?: string;
  status: string;
  deadline_date?: Date;
  created_at: Date;
  updated_at: Date;
}

const JobSchema = new Schema<IJob>({
  title: {
    type: String,
    required: true
  },
  description: String,
  job_type: {
    type: String,
    index: true
  },
  location: String,
  compensation: String,
  experience: String,
  company_name: String,
  contact_email: String,
  contact_number: String,
  posted_by_user_id: String,
  status: {
    type: String,
    default: 'open',
    index: true
  },
  deadline_date: Date,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

JobSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Job = mongoose.model<IJob>('Job', JobSchema);
