-- Add QR code and event completion functionality
-- This script adds the necessary columns and tables for the QR code system

-- Add QR code fields to gigs table
ALTER TABLE gigs 
ADD COLUMN IF NOT EXISTS qr_code_token UUID DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS qr_code_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS qr_code_active BOOLEAN DEFAULT FALSE;

-- Create QR code sessions table for active QR codes
CREATE TABLE IF NOT EXISTS qr_code_sessions (
  id SERIAL PRIMARY KEY,
  gig_id INT REFERENCES gigs(id) ON DELETE CASCADE,
  qr_code_token UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  scanned_by_ushers INT[] DEFAULT ARRAY[]::INT[],
  UNIQUE(gig_id, qr_code_token)
);

-- Add check-in/check-out tracking to shifts
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS qr_code_used UUID,
ADD COLUMN IF NOT EXISTS check_in_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS check_out_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS attendance_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'checked_in', 'checked_out', 'completed', 'no_show'

-- Create usher ratings table
CREATE TABLE IF NOT EXISTS usher_ratings (
  id SERIAL PRIMARY KEY,
  gig_id INT REFERENCES gigs(id) ON DELETE CASCADE,
  usher_id INT REFERENCES users(id) ON DELETE CASCADE,
  brand_id INT REFERENCES users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  rated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gig_id, usher_id, brand_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_code_sessions_gig_id ON qr_code_sessions(gig_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_sessions_token ON qr_code_sessions(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_qr_code_sessions_expires ON qr_code_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_shifts_qr_code ON shifts(qr_code_used);
CREATE INDEX IF NOT EXISTS idx_usher_ratings_gig_usher ON usher_ratings(gig_id, usher_id);

-- Function to automatically complete gigs after end date
CREATE OR REPLACE FUNCTION complete_expired_gigs()
RETURNS void AS $$
BEGIN
  -- Update gigs that have passed their end date
  UPDATE gigs 
  SET status = 'completed' 
  WHERE end_date < CURRENT_DATE 
  AND status = 'active';
  
  -- Update shifts for completed gigs
  UPDATE shifts s
  SET attendance_status = CASE 
    WHEN s.check_in_verified = true AND s.check_out_verified = true THEN 'completed'
    WHEN s.check_in_verified = true THEN 'checked_in'
    ELSE 'no_show'
  END
  FROM gigs g
  WHERE s.gig_id = g.id 
  AND g.status = 'completed'
  AND s.attendance_status = 'pending';
  
  -- Deactivate expired QR codes
  UPDATE qr_code_sessions 
  SET is_active = FALSE 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql; 