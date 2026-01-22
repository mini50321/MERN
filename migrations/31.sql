
ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'admin';

CREATE TABLE admin_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id INTEGER NOT NULL,
  tab_name TEXT NOT NULL,
  permission_level TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(admin_user_id, tab_name)
);

CREATE INDEX idx_admin_permissions_admin_user_id ON admin_permissions(admin_user_id);

UPDATE admin_users SET role = 'super_admin' WHERE email = 'info@themavy.com';
