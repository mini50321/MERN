
CREATE TABLE contact_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  hospital_name TEXT,
  location TEXT,
  description TEXT,
  request_type TEXT DEFAULT 'vendor_contact',
  chat_scope TEXT NOT NULL,
  scope_value TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_requests_user_id ON contact_requests(user_id);
CREATE INDEX idx_contact_requests_chat_scope ON contact_requests(chat_scope);
CREATE INDEX idx_contact_requests_status ON contact_requests(status);

CREATE TABLE contact_request_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  contact_designation TEXT,
  additional_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_request_replies_request_id ON contact_request_replies(request_id);
