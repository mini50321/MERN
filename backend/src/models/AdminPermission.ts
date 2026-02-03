import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminPermission extends Document {
  admin_user_id: string;
  tab_name: string;
  permission_level: string;
  created_at: Date;
  updated_at: Date;
}

const AdminPermissionSchema = new Schema<IAdminPermission>({
  admin_user_id: {
    type: String,
    required: true,
    index: true
  },
  tab_name: {
    type: String,
    required: true
  },
  permission_level: {
    type: String,
    required: true,
    enum: ['view', 'edit']
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

AdminPermissionSchema.index({ admin_user_id: 1, tab_name: 1 }, { unique: true });

AdminPermissionSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const AdminPermission = mongoose.model<IAdminPermission>('AdminPermission', AdminPermissionSchema);

