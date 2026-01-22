
ALTER TABLE learning_courses ADD COLUMN submitted_by_user_id TEXT;
ALTER TABLE learning_courses ADD COLUMN approval_status TEXT DEFAULT 'approved';
ALTER TABLE learning_courses ADD COLUMN price REAL;
ALTER TABLE learning_courses ADD COLUMN currency TEXT DEFAULT 'USD';
ALTER TABLE learning_courses ADD COLUMN rejection_reason TEXT;
