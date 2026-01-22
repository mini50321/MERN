
ALTER TABLE user_profiles ADD COLUMN state TEXT;
ALTER TABLE user_profiles ADD COLUMN country TEXT;

CREATE TABLE location_change_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  current_state TEXT,
  current_country TEXT,
  requested_state TEXT NOT NULL,
  requested_country TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_location_change_requests_user_id ON location_change_requests(user_id);
CREATE INDEX idx_location_change_requests_status ON location_change_requests(status);
