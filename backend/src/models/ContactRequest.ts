import mongoose, { Schema, Document } from 'mongoose';

export interface IContactRequest extends Document {
  user_id: string;
  company_name: string;
  hospital_name: string | null;
  location: string | null;
  description: string | null;
  status: string;
  chat_scope: string;
  scope_value: string | null;
  created_at: Date;
  updated_at: Date;
}

const ContactRequestSchema = new Schema<IContactRequest>({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  company_name: {
    type: String,
    required: true
  },
  hospital_name: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected']
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
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

ContactRequestSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const ContactRequest = mongoose.model<IContactRequest>('ContactRequest', ContactRequestSchema);

