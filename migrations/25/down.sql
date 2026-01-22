
-- Remove the new admin
DELETE FROM admin_users WHERE email = 'mavytechsolutions@gmail.com';

-- Revert the password change
UPDATE admin_users SET password_hash = 'Madhu@1234', updated_at = CURRENT_TIMESTAMP WHERE email = 'info@themavy.com';
