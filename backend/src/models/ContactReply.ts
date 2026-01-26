import mongoose, { Schema, Document } from 'mongoose';

export interface IContactReply extends Document {
  request_id: string;
  user_id: string;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  contact_designation: string | null;
  additional_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

const ContactReplySchema = new Schema<IContactReply>({
  request_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  contact_name: {
    type: String,
    required: true
  },
  contact_phone: {
    type: String,
    default: null
  },
  contact_email: {
    type: String,
    default: null
  },
  contact_designation: {
    type: String,
    default: null
  },
  additional_notes: {
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

ContactReplySchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const ContactReply = mongoose.model<IContactReply>('ContactReply', ContactReplySchema);

