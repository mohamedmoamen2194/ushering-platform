-- Debug current gig and application data

-- Show all gigs with their date ranges
SELECT 
  g.id,
  g.title,
  g.location,
  g.datetime,
  g.start_date,
  g.end_date,
  g.status,
  CASE 
    WHEN g.start_date IS NOT NULL AND g.end_date IS NOT NULL THEN
      (g.end_date - g.start_date + 1)
    ELSE 1
  END as duration_days,
  (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id) as total_apps,
  (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'pending') as pending_apps,
  (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'approved') as approved_apps
FROM gigs g
ORDER BY g.start_date NULLS LAST, g.datetime;

-- Show all applications
SELECT 
  a.id,
  a.status,
  a.applied_at,
  g.title as gig_title,
  g.start_date,
  g.end_date,
  u.name as usher_name,
  u.id as usher_id
FROM applications a
JOIN gigs g ON a.gig_id = g.id
JOIN users u ON a.usher_id = u.id
ORDER BY a.applied_at DESC;

-- Check for date overlaps between gigs
SELECT 
  g1.id as gig1_id,
  g1.title as gig1_title,
  g1.start_date as gig1_start,
  g1.end_date as gig1_end,
  g2.id as gig2_id,
  g2.title as gig2_title,
  g2.start_date as gig2_start,
  g2.end_date as gig2_end
FROM gigs g1
CROSS JOIN gigs g2
WHERE g1.id < g2.id
  AND g1.start_date IS NOT NULL 
  AND g1.end_date IS NOT NULL
  AND g2.start_date IS NOT NULL 
  AND g2.end_date IS NOT NULL
  AND g1.start_date <= g2.end_date 
  AND g1.end_date >= g2.start_date;
