
-- Remove new admin
DELETE FROM admin_permissions WHERE admin_user_id IN (SELECT id FROM admin_users WHERE email = 'mavytechsolutions@gmail.com');
DELETE FROM admin_users WHERE email = 'mavytechsolutions@gmail.com';

-- Restore old admin
INSERT INTO admin_users (email, password_hash, role, created_at, updated_at)
VALUES ('info@themavy.com', '', 'super_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
