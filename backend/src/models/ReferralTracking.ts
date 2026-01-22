import mongoose, { Schema, Document } from 'mongoose';

export interface IReferralTracking extends Document {
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  referral_stage?: string;
  referrer_reward_amount: number;
  referred_reward_amount: number;
  reward_status: string;
  created_at: Date;
  updated_at: Date;
}

const ReferralTrackingSchema = new Schema<IReferralTracking>({
  referrer_user_id: {
    type: String,
    required: true,
    index: true
  },
  referred_user_id: {
    type: String,
    required: true,
    index: true
  },
  referral_code: {
    type: String,
    required: true
  },
  referral_stage: String,
  referrer_reward_amount: {
    type: Number,
    default: 0
  },
  referred_reward_amount: {
    type: Number,
    default: 0
  },
  reward_status: {
    type: String,
    default: 'pending'
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

ReferralTrackingSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const ReferralTracking = mongoose.model<IReferralTracking>('ReferralTracking', ReferralTrackingSchema);
