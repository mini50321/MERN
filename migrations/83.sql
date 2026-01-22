
CREATE TABLE service_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_name TEXT NOT NULL,
  patient_contact TEXT NOT NULL,
  patient_email TEXT,
  patient_location TEXT,
  service_type TEXT NOT NULL,
  equipment_name TEXT,
  equipment_model TEXT,
  issue_description TEXT NOT NULL,
  urgency_level TEXT DEFAULT 'normal',
  assigned_engineer_id TEXT,
  status TEXT DEFAULT 'pending',
  quoted_price REAL,
  quoted_currency TEXT DEFAULT 'INR',
  engineer_notes TEXT,
  responded_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_orders_engineer ON service_orders(assigned_engineer_id);
CREATE INDEX idx_service_orders_status ON service_orders(status);
CREATE INDEX idx_service_orders_created ON service_orders(created_at);
