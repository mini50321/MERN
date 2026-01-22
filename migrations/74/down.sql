
ALTER TABLE service_listings DROP COLUMN target_profession;
ALTER TABLE learning_courses DROP COLUMN target_profession;
ALTER TABLE medical_exhibitions DROP COLUMN target_profession;
ALTER TABLE news_updates DROP COLUMN target_profession;
ALTER TABLE jobs DROP COLUMN target_profession;

ALTER TABLE user_profiles DROP COLUMN business_type;
ALTER TABLE user_profiles DROP COLUMN profession;
