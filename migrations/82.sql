
-- Remove old admin
DELETE FROM admin_permissions WHERE admin_user_id IN (SELECT id FROM admin_users WHERE email = 'info@themavy.com');
DELETE FROM admin_users WHERE email = 'info@themavy.com';

-- Add new super admin
INSERT INTO admin_users (email, password_hash, role, created_at, updated_at)
VALUES ('mavytechsolutions@gmail.com', '', 'super_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(email) DO UPDATE SET role = 'super_admin', updated_at = CURRENT_TIMESTAMP;
