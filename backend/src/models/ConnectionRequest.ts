import mongoose, { Document, Schema } from 'mongoose';

export interface IConnectionRequest extends Document {
  sender_user_id: string;
  receiver_user_id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

const ConnectionRequestSchema = new Schema<IConnectionRequest>({
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
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'accepted', 'rejected'],
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

ConnectionRequestSchema.index({ sender_user_id: 1, receiver_user_id: 1 }, { unique: true });

const ConnectionRequest = mongoose.model<IConnectionRequest>('ConnectionRequest', ConnectionRequestSchema);
export { ConnectionRequest };

