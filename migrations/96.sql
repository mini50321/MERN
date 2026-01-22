
-- Add Google Maps configuration
INSERT INTO system_configurations (config_key, config_category, description, is_sensitive) VALUES
('GOOGLE_MAPS_API_KEY', 'maps_service', 'Google Maps API Key for map features', 1),
('MAPS_PROVIDER', 'maps_service', 'Map provider selection: leaflet or google_maps (default: leaflet)', 0);

-- Set default value for maps provider
UPDATE system_configurations SET config_value = 'leaflet' WHERE config_key = 'MAPS_PROVIDER';
