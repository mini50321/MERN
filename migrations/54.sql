
CREATE TABLE business_territories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_user_id TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT,
  city TEXT,
  pincode TEXT,
  is_primary BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_territories_user ON business_territories(business_user_id);
