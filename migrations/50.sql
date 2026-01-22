
CREATE TABLE business_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  manufacturer TEXT,
  model_number TEXT,
  specifications TEXT,
  dealer_price REAL,
  customer_price REAL,
  currency TEXT DEFAULT 'INR',
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_products_user ON business_products(business_user_id);
