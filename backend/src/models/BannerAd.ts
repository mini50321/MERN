import mongoose, { Schema, Document } from 'mongoose';

export interface IBannerAd extends Document {
  title: string;
  image_url: string;
  target_url?: string;
  ad_type: string;
  display_mode: string;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

const BannerAdSchema = new Schema<IBannerAd>({
  title: {
    type: String,
    required: true
  },
  image_url: {
    type: String,
    required: true
  },
  target_url: String,
  ad_type: {
    type: String,
    default: 'image'
  },
  display_mode: {
    type: String,
    default: 'banner'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  display_order: {
    type: Number,
    default: 0
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

BannerAdSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const BannerAd = mongoose.model<IBannerAd>('BannerAd', BannerAdSchema);

