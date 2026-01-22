
CREATE TABLE user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  full_name TEXT,
  specialisation TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  profile_picture_url TEXT,
  is_verified BOOLEAN DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free',
  referral_code TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_referral_code ON user_profiles(referral_code);

CREATE TABLE service_manuals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  equipment_type TEXT,
  description TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  uploaded_by_user_id TEXT,
  is_verified BOOLEAN DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_manuals_equipment_type ON service_manuals(equipment_type);
CREATE INDEX idx_service_manuals_manufacturer ON service_manuals(manufacturer);

CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  job_type TEXT,
  location TEXT,
  compensation TEXT,
  posted_by_user_id TEXT,
  status TEXT DEFAULT 'open',
  deadline_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);

CREATE TABLE news_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  image_url TEXT,
  source_url TEXT,
  published_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_news_updates_category ON news_updates(category);
CREATE INDEX idx_news_updates_published_date ON news_updates(published_date);
