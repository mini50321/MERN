
DROP INDEX idx_location_change_requests_status;
DROP INDEX idx_location_change_requests_user_id;
DROP TABLE location_change_requests;

ALTER TABLE user_profiles DROP COLUMN country;
ALTER TABLE user_profiles DROP COLUMN state;
