
-- Fundraiser documents table
CREATE TABLE fundraiser_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fundraiser_id INTEGER NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fundraiser_docs ON fundraiser_documents(fundraiser_id);
