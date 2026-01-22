
CREATE TABLE profile_field_xp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, field_name)
);

CREATE INDEX idx_profile_field_xp_user_id ON profile_field_xp(user_id);
