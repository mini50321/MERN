
ALTER TABLE user_profiles ADD COLUMN profession TEXT DEFAULT 'biomedical_engineer';
ALTER TABLE user_profiles ADD COLUMN business_type TEXT;

ALTER TABLE jobs ADD COLUMN target_profession TEXT;
ALTER TABLE news_updates ADD COLUMN target_profession TEXT;
ALTER TABLE medical_exhibitions ADD COLUMN target_profession TEXT;
ALTER TABLE learning_courses ADD COLUMN target_profession TEXT;
ALTER TABLE service_listings ADD COLUMN target_profession TEXT;
