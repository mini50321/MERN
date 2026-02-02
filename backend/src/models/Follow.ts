import mongoose, { Document, Schema } from 'mongoose';

export interface IFollow extends Document {
  follower_user_id: string;
  following_user_id: string;
  created_at: Date;
  updated_at: Date;
}

const FollowSchema = new Schema<IFollow>({
  follower_user_id: {
    type: String,
    required: true,
    index: true
  },
  following_user_id: {
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

FollowSchema.index({ follower_user_id: 1, following_user_id: 1 }, { unique: true });

const Follow = mongoose.model<IFollow>('Follow', FollowSchema);
export { Follow };

