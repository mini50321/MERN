import z from "zod";

export const MedicalExhibitionSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  image_url: z.string().nullable(),
  website_url: z.string().nullable(),
  contact_number: z.string().nullable(),
  location: z.string().nullable(),
  event_start_date: z.string().nullable(),
  event_end_date: z.string().nullable(),
  organizer_name: z.string().nullable(),
  posted_by_user_id: z.string().nullable(),
  is_user_post: z.number().nullable(),
  hashtags: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MedicalExhibition = z.infer<typeof MedicalExhibitionSchema>;

export interface ExhibitionWithCounts extends MedicalExhibition {
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  going_count: number;
  not_going_count: number;
  user_liked: boolean;
  user_saved: boolean;
  user_response: string | null;
  attending_friends: Array<{
    user_id: string;
    full_name: string;
    profile_picture_url: string | null;
  }>;
  author_name?: string | null;
  author_profile_picture_url?: string | null;
}

export interface ExhibitionCommentWithCounts {
  id: number;
  exhibition_id: number;
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

export interface ExhibitionCommentReply {
  id: number;
  comment_id: number;
  user_id: string;
  reply: string;
  full_name: string | null;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
}
