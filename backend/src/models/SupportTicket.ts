import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  user_id: string;
  subject: string;
  message: string;
  status: string;
  order_id?: string;
  booking_id?: string;
  service_type?: string;
  admin_response?: string;
  resolved_at?: Date;
  resolved_by_admin_id?: string;
  created_at: Date;
  updated_at: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'open'
  },
  order_id: String,
  booking_id: String,
  service_type: String,
  admin_response: String,
  resolved_at: Date,
  resolved_by_admin_id: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

SupportTicketSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
