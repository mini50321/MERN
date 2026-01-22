
CREATE TABLE authorized_dealers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_user_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  product_category TEXT,
  authorization_certificate_url TEXT,
  valid_from DATE,
  valid_until DATE,
  is_verified BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_authorized_dealers_user ON authorized_dealers(business_user_id);
