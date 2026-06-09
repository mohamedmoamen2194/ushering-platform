-- Add new columns to gigs table
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS dress_code VARCHAR(255);
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS location_link TEXT;
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS additional_requirements TEXT;
