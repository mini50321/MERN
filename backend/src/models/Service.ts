import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  title: string;
  description?: string;
  service_type?: string;
  price_range?: string;
  location?: string;
  availability?: string;
  contact_email?: string;
  contact_phone?: string;
  image_url?: string;
  provider_name?: string;
  provider_picture?: string;
  posted_by_user_id?: string;
  created_at: Date;
  updated_at: Date;
}

const ServiceSchema = new Schema<IService>({
  title: {
    type: String,
    required: true
  },
  description: String,
  service_type: String,
  price_range: String,
  location: String,
  availability: String,
  contact_email: String,
  contact_phone: String,
  image_url: String,
  provider_name: String,
  provider_picture: String,
  posted_by_user_id: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

ServiceSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Service = mongoose.model<IService>('Service', ServiceSchema);

