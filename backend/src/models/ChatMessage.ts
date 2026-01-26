import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  user_id: string;
  message: string;
  chat_scope: string;
  scope_value: string | null;
  profession: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  created_at: Date;
  updated_at: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  chat_scope: {
    type: String,
    required: true,
    enum: ['state', 'country', 'global'],
    index: true
  },
  scope_value: {
    type: String,
    default: null,
    index: true
  },
  profession: {
    type: String,
    default: null,
    index: true
  },
  attachment_url: {
    type: String,
    default: null
  },
  attachment_type: {
    type: String,
    default: null
  },
  attachment_name: {
    type: String,
    default: null
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

ChatMessageSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

