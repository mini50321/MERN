
-- Add patient-specific fields to user_profiles table
ALTER TABLE user_profiles ADD COLUMN patient_full_name TEXT;
ALTER TABLE user_profiles ADD COLUMN patient_contact TEXT;
ALTER TABLE user_profiles ADD COLUMN patient_email TEXT;
ALTER TABLE user_profiles ADD COLUMN patient_address TEXT;
ALTER TABLE user_profiles ADD COLUMN patient_city TEXT;
ALTER TABLE user_profiles ADD COLUMN patient_pincode TEXT;
ALTER TABLE user_profiles ADD COLUMN patient_latitude REAL;
ALTER TABLE user_profiles ADD COLUMN patient_longitude REAL;
