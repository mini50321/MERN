
CREATE TABLE user_product_brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_product_id INTEGER NOT NULL,
  brand_name TEXT NOT NULL,
  is_authorized BOOLEAN DEFAULT 0,
  authorization_certificate_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_product_id) REFERENCES user_products(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_product_brands_user_product ON user_product_brands(user_product_id);
