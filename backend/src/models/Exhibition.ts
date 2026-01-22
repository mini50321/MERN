import mongoose, { Schema, Document } from 'mongoose';

export interface IExhibition extends Document {
  title: string;
  description?: string;
  category?: string;
  image_url?: string;
  location?: string;
  venue_name?: string;
  city?: string;
  state?: string;
  country?: string;
  event_start_date?: Date;
  event_end_date?: Date;
  organizer_name?: string;
  contact_number?: string;
  website_url?: string;
  registration_url?: string;
  google_maps_url?: string;
  posted_by_user_id?: string;
  is_user_post: boolean;
  hashtags?: string;
  created_at: Date;
  updated_at: Date;
}

const ExhibitionSchema = new Schema<IExhibition>({
  title: {
    type: String,
    required: true
  },
  description: String,
  category: String,
  image_url: String,
  location: String,
  venue_name: String,
  city: String,
  state: String,
  country: String,
  event_start_date: Date,
  event_end_date: Date,
  organizer_name: String,
  contact_number: String,
  website_url: String,
  registration_url: String,
  google_maps_url: String,
  posted_by_user_id: String,
  is_user_post: {
    type: Boolean,
    default: false
  },
  hashtags: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

ExhibitionSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Exhibition = mongoose.model<IExhibition>('Exhibition', ExhibitionSchema);

