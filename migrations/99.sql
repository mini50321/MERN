
CREATE TABLE physiotherapy_service_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL UNIQUE,
  per_session_price REAL NOT NULL,
  monthly_price REAL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO physiotherapy_service_prices (service_name, per_session_price, monthly_price, description) VALUES
('Basic Physiotherapy Session (Home Visit)', 400, NULL, 'General musculoskeletal treatment and rehabilitation'),
('Post-Operative Physiotherapy', 500, 10000, 'Specialized recovery support after surgery'),
('Stroke / Neuro Rehabilitation', 600, 12000, 'Recovery from stroke, spinal injury, or neurological conditions'),
('Elderly Physiotherapy', 400, 9000, 'Mobility training and fall prevention for seniors'),
('Orthopedic Pain Management', 400, NULL, 'Treatment for joint, bone, and muscle pain'),
('Pediatric Physiotherapy', 600, 12000, 'Specialized therapy for infants and children'),
('Respiratory Physiotherapy', 500, NULL, 'Breathing exercises and chest physiotherapy');
