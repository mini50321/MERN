import mongoose, { Schema, Document } from 'mongoose';

export interface IExhibitionComment extends Document {
  exhibition_id: string;
  user_id: string;
  comment: string;
  created_at: Date;
  updated_at: Date;
}

const ExhibitionCommentSchema = new Schema<IExhibitionComment>({
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
  comment: {
    type: String,
    required: true
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

ExhibitionCommentSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const ExhibitionComment = mongoose.model<IExhibitionComment>('ExhibitionComment', ExhibitionCommentSchema);

