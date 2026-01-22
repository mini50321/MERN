
-- Add ambulance-specific fields to service_orders table
ALTER TABLE service_orders ADD COLUMN pickup_latitude REAL;
ALTER TABLE service_orders ADD COLUMN pickup_longitude REAL;
ALTER TABLE service_orders ADD COLUMN pickup_address TEXT;
ALTER TABLE service_orders ADD COLUMN dropoff_latitude REAL;
ALTER TABLE service_orders ADD COLUMN dropoff_longitude REAL;
ALTER TABLE service_orders ADD COLUMN dropoff_address TEXT;
ALTER TABLE service_orders ADD COLUMN patient_condition TEXT;
