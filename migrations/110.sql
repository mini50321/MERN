
CREATE TABLE manual_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_manual_requests_user_id ON manual_requests(user_id);
CREATE INDEX idx_manual_requests_status ON manual_requests(status);

CREATE TABLE manual_request_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT,
  manual_file_url TEXT NOT NULL,
  manual_title TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_manual_request_replies_request_id ON manual_request_replies(request_id);
