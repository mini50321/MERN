
-- Update primary admin password to plain text for first login (will be hashed automatically)
UPDATE admin_users SET password_hash = 'MavyTech@2025!' WHERE email = 'info@themavy.com';

-- Add new admin account with plain text password (will be hashed on first login)
INSERT OR IGNORE INTO admin_users (email, password_hash) VALUES ('mavytechsolutions@gmail.com', 'MavyAdmin@2025!');
