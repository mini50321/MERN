import mongoose, { Schema, Document } from 'mongoose';

export interface IChatReply extends Document {
  parent_message_id: string;
  user_id: string;
  message: string;
  created_at: Date;
  updated_at: Date;
}

const ChatReplySchema = new Schema<IChatReply>({
  parent_message_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  message: {
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

ChatReplySchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const ChatReply = mongoose.model<IChatReply>('ChatReply', ChatReplySchema);

