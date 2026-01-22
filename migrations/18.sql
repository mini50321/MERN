
CREATE TABLE exhibition_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exhibition_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  response_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exhibition_id, user_id)
);

CREATE INDEX idx_exhibition_responses_exhibition_id ON exhibition_responses(exhibition_id);
CREATE INDEX idx_exhibition_responses_user_id ON exhibition_responses(user_id);
