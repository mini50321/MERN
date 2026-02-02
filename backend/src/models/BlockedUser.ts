import mongoose, { Document, Schema } from 'mongoose';

export interface IBlockedUser extends Document {
  blocker_user_id: string;
  blocked_user_id: string;
  created_at: Date;
  updated_at: Date;
}

const BlockedUserSchema = new Schema<IBlockedUser>({
  blocker_user_id: {
    type: String,
    required: true,
    index: true
  },
  blocked_user_id: {
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

BlockedUserSchema.index({ blocker_user_id: 1, blocked_user_id: 1 }, { unique: true });

const BlockedUser = mongoose.model<IBlockedUser>('BlockedUser', BlockedUserSchema);
export { BlockedUser };

