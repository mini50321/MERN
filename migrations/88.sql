
ALTER TABLE service_orders ADD COLUMN service_category TEXT;
ALTER TABLE service_orders ADD COLUMN preferred_date DATE;
ALTER TABLE service_orders ADD COLUMN preferred_time TEXT;
ALTER TABLE service_orders ADD COLUMN patient_address TEXT;
ALTER TABLE service_orders ADD COLUMN patient_city TEXT;
ALTER TABLE service_orders ADD COLUMN patient_state TEXT;
ALTER TABLE service_orders ADD COLUMN patient_pincode TEXT;
ALTER TABLE service_orders ADD COLUMN patient_latitude REAL;
ALTER TABLE service_orders ADD COLUMN patient_longitude REAL;
