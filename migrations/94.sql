
-- Table to store system configuration settings
CREATE TABLE IF NOT EXISTS system_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT,
  config_category TEXT NOT NULL,
  is_sensitive INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration entries
INSERT OR IGNORE INTO system_configurations (config_key, config_value, config_category, is_sensitive, description) VALUES
  ('GEMINI_API_KEY', '', 'ai_services', 1, 'Google Gemini API Key for AI features'),
  ('OPENAI_API_KEY', '', 'ai_services', 1, 'OpenAI API Key for GPT models'),
  ('MODEL_HOSTING_URL', '', 'ai_services', 0, 'Custom model hosting URL'),
  ('FAST2SMS_API_KEY', '', 'sms_service', 1, 'Fast2SMS API Key for OTP and notifications'),
  ('RESEND_API_KEY', '', 'email_service', 1, 'Resend API Key for email services'),
  ('MONGODB_URI', '', 'database', 1, 'MongoDB connection string'),
  ('MONGODB_DATABASE', '', 'database', 0, 'MongoDB database name'),
  ('R2_ACCESS_KEY', '', 'storage', 1, 'Cloudflare R2 access key'),
  ('R2_SECRET_KEY', '', 'storage', 1, 'Cloudflare R2 secret key'),
  ('R2_BUCKET_NAME', '', 'storage', 0, 'R2 bucket name'),
  ('S3_ACCESS_KEY', '', 'storage', 1, 'AWS S3 access key ID'),
  ('S3_SECRET_KEY', '', 'storage', 1, 'AWS S3 secret access key'),
  ('S3_BUCKET_NAME', '', 'storage', 0, 'S3 bucket name'),
  ('S3_REGION', '', 'storage', 0, 'AWS S3 region'),
  ('GITHUB_REPO_URL', '', 'version_control', 0, 'GitHub repository URL'),
  ('GITHUB_ACCESS_TOKEN', '', 'version_control', 1, 'GitHub personal access token'),
  ('CUSTOM_API_ENDPOINT', '', 'custom', 0, 'Custom API endpoint URL'),
  ('CUSTOM_API_KEY', '', 'custom', 1, 'Custom API authentication key');

CREATE INDEX idx_system_configurations_category ON system_configurations(config_category);
CREATE INDEX idx_system_configurations_key ON system_configurations(config_key);
