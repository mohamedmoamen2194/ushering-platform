-- Aura Platform Enhancement: Notification System & Dynamic Rating System
-- Date: September 25, 2025
-- Features: Enhanced notifications, dynamic 5-star rating system

-- ============================================================================
-- STEP 1: Enhanced Notification System
-- ============================================================================

-- Add reference_id to notifications table for linking to specific entities
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);

-- Add notification preferences for users
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  whatsapp_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  gig_updates BOOLEAN DEFAULT TRUE,
  payment_updates BOOLEAN DEFAULT TRUE,
  application_updates BOOLEAN DEFAULT TRUE,
  chat_messages BOOLEAN DEFAULT TRUE,
  announcements BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- STEP 2: Dynamic 5-Star Rating System
-- ============================================================================

-- Add detailed rating columns to ushers table
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS attendance_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS brand_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Create gig_ratings table for detailed rating tracking
CREATE TABLE IF NOT EXISTS gig_ratings (
  id SERIAL PRIMARY KEY,
  gig_id INT REFERENCES gigs(id) ON DELETE CASCADE,
  usher_id INT REFERENCES users(id) ON DELETE CASCADE,
  brand_rating INT CHECK (brand_rating >= 1 AND brand_rating <= 5),
  attendance_days INT NOT NULL DEFAULT 0,
  total_gig_days INT NOT NULL DEFAULT 1,
  attendance_rating DECIMAL(3,2) DEFAULT 0.00,
  brand_rating_stars DECIMAL(3,2) DEFAULT 0.00,
  final_rating DECIMAL(3,2) DEFAULT 0.00,
  rating_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gig_id, usher_id)
);

-- ============================================================================
-- STEP 3: Enhanced Gig Messages (Already exists, but add indexes)
-- ============================================================================

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_reference_id ON notifications(reference_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_gig_ratings_gig_id ON gig_ratings(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_ratings_usher_id ON gig_ratings(usher_id);
CREATE INDEX IF NOT EXISTS idx_ushers_rating ON ushers(rating);

-- ============================================================================
-- STEP 4: Rating Calculation Function
-- ============================================================================

-- Function to calculate dynamic rating
CREATE OR REPLACE FUNCTION calculate_dynamic_rating(
  p_attendance_days INT,
  p_total_gig_days INT,
  p_brand_rating INT
) RETURNS DECIMAL(3,2) AS $$
DECLARE
  attendance_stars DECIMAL(3,2);
  brand_stars DECIMAL(3,2);
  final_rating DECIMAL(3,2);
BEGIN
  -- Calculate attendance stars (max 2 stars)
  attendance_stars := (p_attendance_days::DECIMAL / p_total_gig_days::DECIMAL) * 2.0;
  
  -- Calculate brand rating stars (max 3 stars)
  brand_stars := (p_brand_rating::DECIMAL / 5.0) * 3.0;
  
  -- Calculate final rating
  final_rating := attendance_stars + brand_stars;
  
  -- Round to 2 decimal places and ensure it's between 0 and 5
  final_rating := ROUND(final_rating, 2);
  final_rating := GREATEST(0.00, LEAST(5.00, final_rating));
  
  RETURN final_rating;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Trigger to Update Usher Overall Rating
-- ============================================================================

-- Function to update usher's overall rating when a new gig rating is added
CREATE OR REPLACE FUNCTION update_usher_overall_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the usher's overall rating based on all their gig ratings
  UPDATE ushers SET
    rating = (
      SELECT COALESCE(AVG(final_rating), 0.00)
      FROM gig_ratings
      WHERE usher_id = NEW.usher_id
    ),
    attendance_rating = (
      SELECT COALESCE(AVG(attendance_rating), 0.00)
      FROM gig_ratings
      WHERE usher_id = NEW.usher_id
    ),
    brand_rating = (
      SELECT COALESCE(AVG(brand_rating_stars), 0.00)
      FROM gig_ratings
      WHERE usher_id = NEW.usher_id
    ),
    updated_at = NOW()
  WHERE user_id = NEW.usher_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_usher_rating ON gig_ratings;
CREATE TRIGGER trigger_update_usher_rating
  AFTER INSERT OR UPDATE ON gig_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_usher_overall_rating();

-- ============================================================================
-- STEP 6: Insert Default Notification Preferences for Existing Users
-- ============================================================================

-- Insert default notification preferences for all existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 7: Sample Data for Testing (Optional)
-- ============================================================================

-- This section can be uncommented for testing purposes
/*
-- Sample gig rating
INSERT INTO gig_ratings (gig_id, usher_id, brand_rating, attendance_days, total_gig_days, attendance_rating, brand_rating_stars, final_rating)
VALUES (1, 2, 5, 3, 3, 2.00, 3.00, 5.00)
ON CONFLICT (gig_id, usher_id) DO NOTHING;

-- Sample notification
INSERT INTO notifications (user_id, title, message, type, reference_id)
VALUES (2, 'Test Notification', 'This is a test notification for the enhanced system', 'system', 'test_001')
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if all tables exist
SELECT 
  'notifications' as table_name, 
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') as exists
UNION ALL
SELECT 
  'notification_preferences' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') as exists
UNION ALL
SELECT 
  'gig_ratings' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'gig_ratings') as exists;

-- Check if new columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'ushers' 
  AND column_name IN ('attendance_rating', 'brand_rating', 'profile_photo_url')
ORDER BY column_name;

-- Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('calculate_dynamic_rating', 'update_usher_overall_rating')
  AND routine_schema = 'public';

COMMIT;
