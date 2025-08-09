-- Update existing gigs with proper start and end dates for testing
-- This will create overlapping June gigs and a separate August gig

-- First, let's see what gigs we currently have
SELECT id, title, location, datetime, start_date, end_date FROM gigs ORDER BY datetime;

-- Update gigs to have overlapping date ranges
-- Gig 1: June 15-20, 2024
UPDATE gigs 
SET start_date = '2024-06-15',
    end_date = '2024-06-20',
    datetime = '2024-06-15 18:00:00+02'
WHERE id = (SELECT MIN(id) FROM gigs WHERE datetime < '2024-08-01');

-- Gig 2: June 18-22, 2024 (overlaps with first gig)
UPDATE gigs 
SET start_date = '2024-06-18',
    end_date = '2024-06-22',
    datetime = '2024-06-18 16:00:00+02'
WHERE id = (SELECT MIN(id) + 1 FROM gigs WHERE datetime < '2024-08-01');

-- Gig 3: August 10-12, 2024 (no overlap)
UPDATE gigs 
SET start_date = '2024-08-10',
    end_date = '2024-08-12',
    datetime = '2024-08-10 19:00:00+02'
WHERE datetime >= '2024-08-01' OR id = (SELECT MAX(id) FROM gigs);

-- Verify the updates
SELECT 
  id, 
  title, 
  location, 
  datetime, 
  start_date, 
  end_date,
  (end_date - start_date + 1) as duration_days
FROM gigs 
ORDER BY start_date, datetime;
