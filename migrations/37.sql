
-- Service requests/inquiries table
CREATE TABLE service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  requester_user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  contact_preference TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_requests ON service_requests(service_id);
CREATE INDEX idx_requester ON service_requests(requester_user_id);
