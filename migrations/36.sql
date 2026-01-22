
-- Service listings table
CREATE TABLE service_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  service_type TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  price_range TEXT,
  location TEXT,
  availability TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_provider ON service_listings(provider_user_id);
CREATE INDEX idx_service_type ON service_listings(service_type, status);
