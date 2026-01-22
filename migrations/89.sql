
-- Create patient notification settings table
CREATE TABLE IF NOT EXISTS patient_notification_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  push_notifications BOOLEAN DEFAULT 1,
  email_alerts BOOLEAN DEFAULT 1,
  sms_alerts BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patient_notification_settings_user_id ON patient_notification_settings(user_id);
