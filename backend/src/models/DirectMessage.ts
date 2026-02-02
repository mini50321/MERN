import mongoose, { Document, Schema } from 'mongoose';

export interface IDirectMessage extends Document {
  sender_user_id: string;
  receiver_user_id: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

const DirectMessageSchema = new Schema<IDirectMessage>({
  sender_user_id: {
    type: String,
    required: true,
    index: true
  },
  receiver_user_id: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  is_read: {
    type: Boolean,
    default: false,
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

DirectMessageSchema.index({ sender_user_id: 1, receiver_user_id: 1 });
DirectMessageSchema.index({ receiver_user_id: 1, is_read: 1 });

const DirectMessage = mongoose.model<IDirectMessage>('DirectMessage', DirectMessageSchema);
export { DirectMessage };

