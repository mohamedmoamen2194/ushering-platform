-- Update gigs table to support date ranges
ALTER TABLE gigs 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Update the datetime column to be start_datetime for clarity
ALTER TABLE gigs 
RENAME COLUMN datetime TO start_datetime;

-- Add indexes for date range queries
CREATE INDEX IF NOT EXISTS idx_gigs_date_range ON gigs(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_applications_date_range ON applications(gig_id, usher_id, status);

-- Update existing gigs to have proper date ranges (for existing data)
UPDATE gigs 
SET start_date = start_datetime::date,
    end_date = start_datetime::date
WHERE start_date IS NULL;
