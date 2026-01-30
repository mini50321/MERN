import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  user_id: string;
  full_name?: string;
  last_name?: string;
  specialisation?: string;
  bio?: string;
  phone?: string;
  country_code?: string;
  location?: string;
  state?: string;
  country?: string;
  city?: string;
  pincode?: string;
  profile_picture_url?: string;
  resume_url?: string;
  experience?: string;
  skills?: string;
  education?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  instagram_visibility?: string;
  facebook_visibility?: string;
  linkedin_visibility?: string;
  is_verified: boolean;
  is_open_to_work: boolean;
  subscription_tier: string;
  referral_code: string;
  account_type?: string;
  profession?: string;
  business_name?: string;
  email?: string;
  patient_email?: string;
  patient_latitude?: number;
  patient_longitude?: number;
  onboarding_completed: boolean;
  is_admin?: boolean;
  role?: string;
  push_notifications?: boolean;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>({
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  full_name: String,
  last_name: String,
  specialisation: String,
  bio: String,
  phone: String,
  country_code: String,
  location: String,
  state: String,
  country: String,
  city: String,
  pincode: String,
  profile_picture_url: String,
  resume_url: String,
  experience: String,
  skills: String,
  education: String,
  instagram_url: String,
  facebook_url: String,
  linkedin_url: String,
  instagram_visibility: String,
  facebook_visibility: String,
  linkedin_visibility: String,
  is_verified: {
    type: Boolean,
    default: false
  },
  is_open_to_work: {
    type: Boolean,
    default: false
  },
  subscription_tier: {
    type: String,
    default: 'free'
  },
  referral_code: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  account_type: String,
  profession: String,
  business_name: String,
  email: String,
  patient_email: String,
  patient_latitude: Number,
  patient_longitude: Number,
  onboarding_completed: {
    type: Boolean,
    default: false
  },
  is_admin: {
    type: Boolean,
    default: false
  },
  role: String,
  push_notifications: {
    type: Boolean,
    default: true
  },
  email_notifications: {
    type: Boolean,
    default: true
  },
  sms_notifications: {
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

UserSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);
