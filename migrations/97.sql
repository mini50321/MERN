
ALTER TABLE service_orders ADD COLUMN billing_frequency TEXT DEFAULT 'per_visit';
ALTER TABLE service_orders ADD COLUMN monthly_visits_count INTEGER;
