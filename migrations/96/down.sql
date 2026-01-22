
-- Remove Google Maps configuration
DELETE FROM system_configurations WHERE config_key IN ('GOOGLE_MAPS_API_KEY', 'MAPS_PROVIDER');
