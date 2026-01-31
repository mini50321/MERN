import mongoose, { Schema, Document } from 'mongoose';

export interface IKYCSubmission extends Document {
  user_id: string;
  full_name: string;
  id_proof_url: string;
  pan_card_url: string;
  experience_certificate_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by_admin_id?: string;
  submitted_at: Date;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const KYCSubmissionSchema = new Schema<IKYCSubmission>({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  full_name: {
    type: String,
    required: true
  },
  id_proof_url: {
    type: String,
    required: true
  },
  pan_card_url: {
    type: String,
    required: true
  },
  experience_certificate_url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejection_reason: String,
  reviewed_by_admin_id: String,
  submitted_at: {
    type: Date,
    default: Date.now
  },
  reviewed_at: Date,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

KYCSubmissionSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const KYCSubmission = mongoose.model<IKYCSubmission>('KYCSubmission', KYCSubmissionSchema);

