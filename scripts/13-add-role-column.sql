-- Add role column to applications table for assign roles feature
ALTER TABLE applications ADD COLUMN IF NOT EXISTS role VARCHAR(100);

-- Ensure daily_attendance table exists for attendance tracking
CREATE TABLE IF NOT EXISTS daily_attendance (
  id SERIAL PRIMARY KEY,
  gig_id INT REFERENCES gigs(id) ON DELETE CASCADE,
  usher_id INT REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  is_present BOOLEAN DEFAULT FALSE,
  hours_worked DECIMAL(4,2),
  UNIQUE(gig_id, usher_id, attendance_date)
);
