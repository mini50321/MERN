
-- Remove ambulance-specific fields from service_orders table
ALTER TABLE service_orders DROP COLUMN patient_condition;
ALTER TABLE service_orders DROP COLUMN dropoff_address;
ALTER TABLE service_orders DROP COLUMN dropoff_longitude;
ALTER TABLE service_orders DROP COLUMN dropoff_latitude;
ALTER TABLE service_orders DROP COLUMN pickup_address;
ALTER TABLE service_orders DROP COLUMN pickup_longitude;
ALTER TABLE service_orders DROP COLUMN pickup_latitude;
