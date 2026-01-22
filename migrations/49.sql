
CREATE TABLE pending_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT,
  image_url TEXT,
  source_url TEXT,
  location TEXT,
  event_start_date DATE,
  event_end_date DATE,
  contact_number TEXT,
  website_url TEXT,
  hashtags TEXT,
  approval_status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  fetched_by TEXT DEFAULT 'auto',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pending_content_status ON pending_content(approval_status);
CREATE INDEX idx_pending_content_type ON pending_content(content_type);

CREATE TABLE content_fetch_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fetch_type TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  items_fetched INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fetch_logs_date ON content_fetch_logs(created_at);
