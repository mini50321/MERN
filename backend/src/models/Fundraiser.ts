import mongoose, { Schema, Document } from 'mongoose';

export interface IFundraiser extends Document {
  title: string;
  description: string;
  category: string;
  case_type: string;
  goal_amount: number;
  current_amount: number;
  currency: string;
  beneficiary_name: string;
  beneficiary_contact: string | null;
  image_url: string | null;
  end_date: Date | null;
  documents: Array<{
    document_type: string;
    file_url: string;
    file_name: string;
  }>;
  created_by_user_id: string;
  status: string;
  donations_count: number;
  created_at: Date;
  updated_at: Date;
}

const FundraiserSchema = new Schema<IFundraiser>({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  case_type: {
    type: String,
    required: true
  },
  goal_amount: {
    type: Number,
    required: true
  },
  current_amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  beneficiary_name: {
    type: String,
    required: true
  },
  beneficiary_contact: String,
  image_url: String,
  end_date: Date,
  documents: [{
    document_type: String,
    file_url: String,
    file_name: String
  }],
  created_by_user_id: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    default: 'pending',
    index: true
  },
  donations_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

FundraiserSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Fundraiser = mongoose.model<IFundraiser>('Fundraiser', FundraiserSchema);

