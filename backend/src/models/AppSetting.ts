import mongoose, { Schema, Document } from 'mongoose';

export interface IAppSetting extends Document {
  setting_key: string;
  setting_value: string;
  created_at: Date;
  updated_at: Date;
}

const AppSettingSchema = new Schema<IAppSetting>({
  setting_key: {
    type: String,
    required: true,
    unique: true
  },
  setting_value: {
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

AppSettingSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const AppSetting = mongoose.model<IAppSetting>('AppSetting', AppSettingSchema);

