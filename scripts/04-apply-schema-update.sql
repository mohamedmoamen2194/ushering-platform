-- Check if the columns already exist and handle the datetime column rename
DO $$
BEGIN
    -- Check if start_date column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'gigs' AND column_name = 'start_date'
    ) THEN
        -- Add the new columns
        ALTER TABLE gigs 
        ADD COLUMN start_date DATE,
        ADD COLUMN end_date DATE,
        ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;

        -- Update the existing gigs to have proper date ranges (using the original datetime column)
        UPDATE gigs 
        SET start_date = datetime::date,
            end_date = datetime::date
        WHERE start_date IS NULL;

        -- Add indexes for date range queries
        CREATE INDEX IF NOT EXISTS idx_gigs_date_range ON gigs(start_date, end_date);
        CREATE INDEX IF NOT EXISTS idx_applications_date_range ON applications(gig_id, usher_id, status);
        
        RAISE NOTICE 'Schema updated successfully with new date range columns';
    ELSE
        RAISE NOTICE 'Schema already has the required columns';
    END IF;
END $$;
