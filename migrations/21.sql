
CREATE TABLE global_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  chat_scope TEXT NOT NULL,
  scope_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_global_chat_scope ON global_chat_messages(chat_scope, scope_value, created_at DESC);
CREATE INDEX idx_global_chat_user ON global_chat_messages(user_id);
