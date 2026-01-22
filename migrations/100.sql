
CREATE TABLE ambulance_service_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL UNIQUE,
  minimum_fare REAL NOT NULL,
  minimum_km INTEGER NOT NULL DEFAULT 5,
  per_km_charge REAL NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ambulance_service_prices (service_name, minimum_fare, minimum_km, per_km_charge, description, is_active) VALUES
('Basic Ambulance (Non-Emergency)', 1200, 5, 20, 'From home to hospital or hospital to home', 1),
('Emergency Ambulance', 1800, 5, 25, 'Oxygen support, trained staff', 1),
('ICU Ambulance', 4500, 5, 50, 'Ventilator, cardiac monitor, critical care', 1),
('Dead Body / Mortuary Ambulance', 2000, 5, 25, 'Mortuary transport services', 1);
