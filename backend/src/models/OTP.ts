import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  phone_number: string;
  otp: string;
  expires_at: Date;
  verified: boolean;
  created_at: Date;
}

const OTPSchema = new Schema<IOTP>({
  phone_number: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  expires_at: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  verified: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

OTPSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const OTP = mongoose.model<IOTP>('OTP', OTPSchema);
