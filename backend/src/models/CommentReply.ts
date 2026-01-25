import mongoose, { Schema, Document } from 'mongoose';

export interface ICommentReply extends Document {
  comment_id: string;
  user_id: string;
  reply: string;
  created_at: Date;
  updated_at: Date;
}

const CommentReplySchema = new Schema<ICommentReply>({
  comment_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  reply: {
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

CommentReplySchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const CommentReply = mongoose.model<ICommentReply>('CommentReply', CommentReplySchema);

