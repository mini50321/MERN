import mongoose, { Document, Schema } from 'mongoose';

export interface INewsLike extends Document {
  news_id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

const NewsLikeSchema = new Schema<INewsLike>({
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
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

NewsLikeSchema.index({ news_id: 1, user_id: 1 }, { unique: true });

const NewsLike = mongoose.model<INewsLike>('NewsLike', NewsLikeSchema);
export { NewsLike };

