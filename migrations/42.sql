
-- Add onboarding fields to user_profiles
ALTER TABLE user_profiles ADD COLUMN account_type TEXT;
ALTER TABLE user_profiles ADD COLUMN business_name TEXT;
ALTER TABLE user_profiles ADD COLUMN gst_number TEXT;
ALTER TABLE user_profiles ADD COLUMN gst_document_url TEXT;
ALTER TABLE user_profiles ADD COLUMN gst_verification_status TEXT DEFAULT 'pending';
ALTER TABLE user_profiles ADD COLUMN workplace_type TEXT;
ALTER TABLE user_profiles ADD COLUMN workplace_name TEXT;
ALTER TABLE user_profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN city TEXT;
ALTER TABLE user_profiles ADD COLUMN pincode TEXT;
