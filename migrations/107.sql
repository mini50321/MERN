
ALTER TABLE support_tickets ADD COLUMN booking_id INTEGER;
ALTER TABLE support_tickets ADD COLUMN admin_response TEXT;
ALTER TABLE support_tickets ADD COLUMN resolved_at DATETIME;
ALTER TABLE support_tickets ADD COLUMN resolved_by_admin_id INTEGER;
