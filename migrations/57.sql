
ALTER TABLE learning_courses ADD COLUMN instructor_bio TEXT;
ALTER TABLE learning_courses ADD COLUMN instructor_image_url TEXT;
ALTER TABLE learning_courses ADD COLUMN instructor_credentials TEXT;
ALTER TABLE learning_courses ADD COLUMN learning_objectives TEXT;
ALTER TABLE learning_courses ADD COLUMN prerequisites TEXT;
ALTER TABLE learning_courses ADD COLUMN average_rating REAL DEFAULT 0;
ALTER TABLE learning_courses ADD COLUMN total_reviews INTEGER DEFAULT 0;
ALTER TABLE learning_courses ADD COLUMN total_enrollments INTEGER DEFAULT 0;
