import mongoose, { Schema, Document } from 'mongoose';

export interface INewsComment extends Document {
  news_id: string;
  user_id: string;
  comment: string;
  likes: string[];
  created_at: Date;
  updated_at: Date;
}

const NewsCommentSchema = new Schema<INewsComment>({
  news_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  comment: {
    type: String,
    required: true
  },
  likes: {
    type: [String],
    default: []
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

NewsCommentSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const NewsComment = mongoose.model<INewsComment>('NewsComment', NewsCommentSchema);


