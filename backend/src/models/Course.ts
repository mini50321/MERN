import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  category: string;
  video_url: string;
  image_url: string | null;
  thumbnail_url: string | null;
  instructor_name: string;
  instructor_bio: string | null;
  instructor_image_url: string | null;
  instructor_credentials: string | null;
  learning_objectives: string | null;
  prerequisites: string | null;
  course_outline: string | null;
  duration_hours: number;
  modules_count: number;
  price: number;
  currency: string;
  equipment_name: string | null;
  equipment_model: string | null;
  content: string | null;
  submitted_by_user_id: string;
  status: string;
  is_active: boolean;
  average_rating: number;
  total_reviews: number;
  total_enrollments: number;
  created_at: Date;
  updated_at: Date;
}

const CourseSchema = new Schema<ICourse>({
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
  video_url: {
    type: String,
    required: true
  },
  image_url: String,
  thumbnail_url: String,
  instructor_name: {
    type: String,
    required: true
  },
  instructor_bio: String,
  instructor_image_url: String,
  instructor_credentials: String,
  learning_objectives: String,
  prerequisites: String,
  course_outline: String,
  duration_hours: {
    type: Number,
    default: 0
  },
  modules_count: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  equipment_name: String,
  equipment_model: String,
  content: String,
  submitted_by_user_id: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    default: 'pending',
    index: true
  },
  is_active: {
    type: Boolean,
    default: false
  },
  average_rating: {
    type: Number,
    default: 0
  },
  total_reviews: {
    type: Number,
    default: 0
  },
  total_enrollments: {
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

CourseSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Course = mongoose.model<ICourse>('Course', CourseSchema);

