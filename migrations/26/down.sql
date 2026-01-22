
-- Remove new admin
DELETE FROM admin_users WHERE email = 'mavytechsolutions@gmail.com';

-- Restore old password
UPDATE admin_users SET password_hash = 'Madhu@1234' WHERE email = 'info@themavy.com';
