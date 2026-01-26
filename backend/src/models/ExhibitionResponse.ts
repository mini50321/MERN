import mongoose, { Schema, Document } from 'mongoose';

export interface IExhibitionResponse extends Document {
  exhibition_id: string;
  user_id: string;
  response_type: 'going' | 'not_going';
  created_at: Date;
  updated_at: Date;
}

const ExhibitionResponseSchema = new Schema<IExhibitionResponse>({
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
  response_type: {
    type: String,
    enum: ['going', 'not_going'],
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

ExhibitionResponseSchema.index({ exhibition_id: 1, user_id: 1 }, { unique: true });

ExhibitionResponseSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const ExhibitionResponse = mongoose.model<IExhibitionResponse>('ExhibitionResponse', ExhibitionResponseSchema);

