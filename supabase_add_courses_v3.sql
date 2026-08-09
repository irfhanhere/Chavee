ALTER TABLE courses
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS estimated_launch_date TEXT;
