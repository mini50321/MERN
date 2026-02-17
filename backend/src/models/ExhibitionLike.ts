import mongoose, { Document, Schema } from 'mongoose';

export interface IExhibitionLike extends Document {
  exhibition_id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

const ExhibitionLikeSchema = new Schema<IExhibitionLike>({
  exhibition_id: {
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

ExhibitionLikeSchema.index({ exhibition_id: 1, user_id: 1 }, { unique: true });

const ExhibitionLike = mongoose.model<IExhibitionLike>('ExhibitionLike', ExhibitionLikeSchema);
export { ExhibitionLike };

