
CREATE TABLE nursing_service_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL UNIQUE,
  per_visit_price REAL NOT NULL,
  monthly_price REAL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO nursing_service_prices (service_name, per_visit_price, monthly_price, description) VALUES
('Injection / IV / Simple Procedure', 200, NULL, 'IM/IV/SC injection, basic assistance'),
('Vitals Check', 150, NULL, 'BP, Sugar, SpO₂ monitoring'),
('Wound Dressing', 300, NULL, 'Simple wounds (consumables extra)'),
('Catheter / Ryles Tube Care', 400, NULL, 'Insertion, change, cleaning'),
('Nebulization / Oxygen Monitoring', 250, NULL, 'Respiratory therapy and oxygen support'),
('General Home Nursing Visit', 400, 10000, 'Post-op care, medicines, hygiene, monitoring'),
('Post-Operative Home Nursing', 600, 12000, 'Specialized recovery support after surgery'),
('Elderly Care Nursing (Day Shift)', 800, 18000, 'Up to 8 hours daily support'),
('24-Hour Elderly Nursing (Live-in)', 1200, 30000, 'Full-time residential care'),
('Pediatric / Newborn Nursing', 800, 25000, 'Specialized infant/child care');
