import mongoose, { Schema, Document } from 'mongoose';

export interface INewsUpdate extends Document {
  title: string;
  content?: string;
  category?: string;
  image_url?: string;
  source_url?: string;
  published_date?: Date;
  posted_by_user_id?: string;
  is_user_post: boolean;
  hashtags?: string;
  created_at: Date;
  updated_at: Date;
}

const NewsUpdateSchema = new Schema<INewsUpdate>({
  title: {
    type: String,
    required: true
  },
  content: String,
  category: {
    type: String,
    index: true
  },
  image_url: String,
  source_url: String,
  published_date: {
    type: Date,
    index: true
  },
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

NewsUpdateSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const NewsUpdate = mongoose.model<INewsUpdate>('NewsUpdate', NewsUpdateSchema);
