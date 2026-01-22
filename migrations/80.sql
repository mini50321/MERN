
CREATE TABLE product_brand_territories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL,
  country TEXT NOT NULL,
  state TEXT,
  city TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_brand_engineers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL,
  territory_id INTEGER,
  name TEXT NOT NULL,
  email TEXT,
  contact TEXT NOT NULL,
  designation TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_brand_territories_brand_id ON product_brand_territories(brand_id);
CREATE INDEX idx_product_brand_engineers_brand_id ON product_brand_engineers(brand_id);
CREATE INDEX idx_product_brand_engineers_territory_id ON product_brand_engineers(territory_id);
