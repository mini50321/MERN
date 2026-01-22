
-- Update the existing admin password
UPDATE admin_users SET password_hash = 'MavyTech@2025', updated_at = CURRENT_TIMESTAMP WHERE email = 'info@themavy.com';

-- Add new admin account
INSERT INTO admin_users (email, password_hash) VALUES ('mavytechsolutions@gmail.com', 'MavyAdmin@2025');
