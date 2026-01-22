
CREATE TABLE service_engineers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  role TEXT,
  specialization TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_engineers_user ON service_engineers(business_user_id);
CREATE INDEX idx_engineers_location ON service_engineers(country, state, city);
