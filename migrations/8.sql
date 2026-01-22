
ALTER TABLE user_profiles ADD COLUMN last_name TEXT;
ALTER TABLE user_profiles ADD COLUMN country_code TEXT;
ALTER TABLE user_profiles ADD COLUMN experience TEXT;
ALTER TABLE user_profiles ADD COLUMN skills TEXT;
ALTER TABLE user_profiles ADD COLUMN education TEXT;
ALTER TABLE user_profiles ADD COLUMN is_open_to_work BOOLEAN DEFAULT 0;
