
DROP INDEX idx_admin_permissions_admin_user_id;
DROP TABLE admin_permissions;
ALTER TABLE admin_users DROP COLUMN role;
