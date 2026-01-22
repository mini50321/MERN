import z from "zod";

export const UserProfileSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  full_name: z.string().nullable(),
  last_name: z.string().nullable(),
  specialisation: z.string().nullable(),
  bio: z.string().nullable(),
  phone: z.string().nullable(),
  country_code: z.string().nullable(),
  location: z.string().nullable(),
  profile_picture_url: z.string().nullable(),
  resume_url: z.string().nullable(),
  experience: z.string().nullable(),
  skills: z.string().nullable(),
  education: z.string().nullable(),
  instagram_url: z.string().nullable(),
  facebook_url: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  instagram_visibility: z.string().nullable(),
  facebook_visibility: z.string().nullable(),
  linkedin_visibility: z.string().nullable(),
  is_verified: z.number(),
  is_open_to_work: z.number(),
  subscription_tier: z.string(),
  referral_code: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const ServiceManualSchema = z.object({
  id: z.number(),
  title: z.string(),
  manufacturer: z.string().nullable(),
  model_number: z.string().nullable(),
  equipment_type: z.string().nullable(),
  description: z.string().nullable(),
  file_url: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  uploaded_by_user_id: z.string().nullable(),
  is_verified: z.number(),
  download_count: z.number(),
  tags: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ServiceManual = z.infer<typeof ServiceManualSchema>;

export const JobSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  job_type: z.string().nullable(),
  location: z.string().nullable(),
  compensation: z.string().nullable(),
  experience: z.string().nullable(),
  company_name: z.string().nullable(),
  contact_email: z.string().nullable(),
  contact_number: z.string().nullable(),
  posted_by_user_id: z.string().nullable(),
  status: z.string(),
  deadline_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Job = z.infer<typeof JobSchema>;

export const NewsUpdateSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string().nullable(),
  category: z.string().nullable(),
  image_url: z.string().nullable(),
  source_url: z.string().nullable(),
  published_date: z.string().nullable(),
  posted_by_user_id: z.string().nullable(),
  is_user_post: z.number().nullable(),
  hashtags: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type NewsUpdate = z.infer<typeof NewsUpdateSchema>;

export const MedicalExhibitionSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  image_url: z.string().nullable(),
  location: z.string().nullable(),
  venue_name: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  event_start_date: z.string().nullable(),
  event_end_date: z.string().nullable(),
  organizer_name: z.string().nullable(),
  contact_number: z.string().nullable(),
  website_url: z.string().nullable(),
  registration_url: z.string().nullable(),
  google_maps_url: z.string().nullable(),
  posted_by_user_id: z.string().nullable(),
  is_user_post: z.number().nullable(),
  hashtags: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Exhibition = z.infer<typeof MedicalExhibitionSchema>;

export const TransactionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  amount: z.number(),
  currency: z.string(),
  transaction_type: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  payment_method: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const NotificationPreferencesSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  email_notifications: z.number(),
  push_notifications: z.number(),
  sms_notifications: z.number(),
  job_alerts: z.number(),
  news_updates: z.number(),
  community_messages: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

export const SupportTicketSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  subject: z.string(),
  message: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SupportTicket = z.infer<typeof SupportTicketSchema>;

export const ReferralTrackingSchema = z.object({
  id: z.number(),
  referrer_user_id: z.string(),
  referred_user_id: z.string(),
  referral_code: z.string(),
  reward_amount: z.number(),
  reward_status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ReferralTracking = z.infer<typeof ReferralTrackingSchema>;

export const NewsLikeSchema = z.object({
  id: z.number(),
  news_id: z.number(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type NewsLike = z.infer<typeof NewsLikeSchema>;

export const NewsCommentSchema = z.object({
  id: z.number(),
  news_id: z.number(),
  user_id: z.string(),
  comment: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type NewsComment = z.infer<typeof NewsCommentSchema>;

export const CommentReplySchema = z.object({
  id: z.number(),
  comment_id: z.number(),
  user_id: z.string(),
  reply: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CommentReply = z.infer<typeof CommentReplySchema>;

export const CommentLikeSchema = z.object({
  id: z.number(),
  comment_id: z.number(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CommentLike = z.infer<typeof CommentLikeSchema>;

export interface CommentWithCounts {
  id: number;
  news_id: number;
  user_id: string;
  comment: string;
  full_name: string | null;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  replies_count: number;
  user_liked: boolean;
}

export interface ReplyWithUser {
  id: number;
  comment_id: number;
  user_id: string;
  reply: string;
  full_name: string | null;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
}

export const NewsShareSchema = z.object({
  id: z.number(),
  news_id: z.number(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type NewsShare = z.infer<typeof NewsShareSchema>;

export interface NewsWithCounts extends NewsUpdate {
  likes_count: number;
  comments_count: number;
  shares_count: number;
  reposts_count: number;
  user_liked: boolean;
  user_saved: boolean;
  user_reposted: boolean;
  user_following_author: boolean;
  author_name?: string | null;
  author_profile_picture_url?: string | null;
}
