-- Aura Platform Enhancement Migration
-- Date: 2025-09-25
-- Description: Database schema updates for new features

-- =====================================================
-- 1. ADD PHOTO UPLOAD SUPPORT FOR USHERS
-- =====================================================

-- Add profile photo URL to ushers table
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Add photo upload timestamp
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMPTZ;

-- =====================================================
-- 2. GIG-SPECIFIC CHAT/MESSAGING SYSTEM
-- =====================================================

-- Create gig messages table for chat system
CREATE TABLE IF NOT EXISTS gig_messages (
  id SERIAL PRIMARY KEY,
  gig_id INT REFERENCES gigs(id) ON DELETE CASCADE,
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'message' CHECK (message_type IN ('message', 'announcement')),
  is_announcement BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for gig messages
CREATE INDEX IF NOT EXISTS idx_gig_messages_gig_id ON gig_messages(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_messages_sender_id ON gig_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_gig_messages_created_at ON gig_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_gig_messages_type ON gig_messages(message_type);

-- =====================================================
-- 3. ENHANCED RATING SYSTEM
-- =====================================================

-- Create gig ratings table for detailed rating tracking
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

-- Add enhanced rating fields to ushers table
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS attendance_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS brand_rating_avg DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS total_ratings_count INT DEFAULT 0;

-- Create indexes for gig ratings
CREATE INDEX IF NOT EXISTS idx_gig_ratings_gig_id ON gig_ratings(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_ratings_usher_id ON gig_ratings(usher_id);
CREATE INDEX IF NOT EXISTS idx_gig_ratings_final_rating ON gig_ratings(final_rating);

-- =====================================================
-- 4. ENHANCED NOTIFICATIONS SYSTEM
-- =====================================================

-- Add notification preferences to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"whatsapp": true, "email": false, "push": true}';

-- Add notification status tracking
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) DEFAULT 'whatsapp' CHECK (delivery_method IN ('whatsapp', 'email', 'push', 'in_app'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100); -- For tracking external service IDs

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_delivery_method ON notifications(delivery_method);

-- =====================================================
-- 5. GIG DURATION TRACKING
-- =====================================================

-- Add multi-day gig support
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS start_datetime TIMESTAMPTZ;
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS end_datetime TIMESTAMPTZ;
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS total_days INT DEFAULT 1;

-- Update existing gigs to use new datetime fields (if datetime column exists)
UPDATE gigs 
SET start_datetime = datetime, 
    end_datetime = datetime + (duration_hours || ' hours')::INTERVAL,
    total_days = CASE 
      WHEN duration_hours <= 24 THEN 1
      ELSE CEIL(duration_hours::DECIMAL / 24)
    END
WHERE start_datetime IS NULL AND datetime IS NOT NULL;

-- =====================================================
-- 6. ATTENDANCE TRACKING ENHANCEMENT
-- =====================================================

-- Create daily attendance tracking
CREATE TABLE IF NOT EXISTS daily_attendance (
  id SERIAL PRIMARY KEY,
  gig_id INT REFERENCES gigs(id) ON DELETE CASCADE,
  usher_id INT REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  hours_worked DECIMAL(4,2) DEFAULT 0.00,
  is_present BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gig_id, usher_id, attendance_date)
);

-- Create indexes for daily attendance
CREATE INDEX IF NOT EXISTS idx_daily_attendance_gig_id ON daily_attendance(gig_id);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_usher_id ON daily_attendance(usher_id);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_date ON daily_attendance(attendance_date);

-- =====================================================
-- 7. FILE UPLOADS TRACKING
-- =====================================================

-- Create file uploads table for tracking all uploaded files
CREATE TABLE IF NOT EXISTS file_uploads (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  upload_purpose VARCHAR(50) CHECK (upload_purpose IN ('profile_photo', 'id_document', 'gig_attachment')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for file uploads
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_purpose ON file_uploads(upload_purpose);
CREATE INDEX IF NOT EXISTS idx_file_uploads_active ON file_uploads(is_active);

-- =====================================================
-- 8. UPDATE EXISTING DATA COMPATIBILITY
-- =====================================================

-- Update existing shifts to link with daily attendance
-- This will help maintain historical data while supporting new features

-- Create a function to calculate rating based on new system
CREATE OR REPLACE FUNCTION calculate_usher_rating(usher_user_id INT)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  avg_attendance_rating DECIMAL(3,2);
  avg_brand_rating DECIMAL(3,2);
  total_rating DECIMAL(3,2);
BEGIN
  -- Calculate average attendance rating (2 stars max)
  SELECT COALESCE(AVG(attendance_rating), 0.00) 
  INTO avg_attendance_rating
  FROM gig_ratings 
  WHERE usher_id = usher_user_id;
  
  -- Calculate average brand rating (3 stars max)
  SELECT COALESCE(AVG(brand_rating_stars), 0.00)
  INTO avg_brand_rating
  FROM gig_ratings 
  WHERE usher_id = usher_user_id;
  
  -- Total rating (5 stars max)
  total_rating := avg_attendance_rating + avg_brand_rating;
  
  -- Ensure rating doesn't exceed 5.00
  IF total_rating > 5.00 THEN
    total_rating := 5.00;
  END IF;
  
  RETURN ROUND(total_rating, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a function to update usher ratings
CREATE OR REPLACE FUNCTION update_usher_ratings()
RETURNS VOID AS $$
DECLARE
  usher_record RECORD;
BEGIN
  FOR usher_record IN SELECT user_id FROM ushers LOOP
    UPDATE ushers 
    SET rating = calculate_usher_rating(usher_record.user_id),
        total_ratings_count = (SELECT COUNT(*) FROM gig_ratings WHERE usher_id = usher_record.user_id)
    WHERE user_id = usher_record.user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update usher rating when gig rating is added/updated
CREATE OR REPLACE FUNCTION trigger_update_usher_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the usher's overall rating
  UPDATE ushers 
  SET rating = calculate_usher_rating(NEW.usher_id),
      total_ratings_count = (SELECT COUNT(*) FROM gig_ratings WHERE usher_id = NEW.usher_id),
      updated_at = NOW()
  WHERE user_id = NEW.usher_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_usher_rating_trigger ON gig_ratings;
CREATE TRIGGER update_usher_rating_trigger
  AFTER INSERT OR UPDATE ON gig_ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_usher_rating();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to new tables
DROP TRIGGER IF EXISTS update_gig_messages_updated_at ON gig_messages;
CREATE TRIGGER update_gig_messages_updated_at
  BEFORE UPDATE ON gig_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gig_ratings_updated_at ON gig_ratings;
CREATE TRIGGER update_gig_ratings_updated_at
  BEFORE UPDATE ON gig_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_attendance_updated_at ON daily_attendance;
CREATE TRIGGER update_daily_attendance_updated_at
  BEFORE UPDATE ON daily_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. SAMPLE DATA FOR TESTING (OPTIONAL)
-- =====================================================

-- Insert sample notification preferences for existing users
UPDATE users 
SET notification_preferences = '{"whatsapp": true, "email": false, "push": true}'
WHERE notification_preferences IS NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
INSERT INTO notifications (user_id, title, message, type) 
SELECT 1, 'Database Migration', 'Enhancement migration completed successfully', 'system'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1 AND role = 'admin');

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE '✅ Aura Platform Enhancement Migration Completed Successfully!';
  RAISE NOTICE '📊 New Tables Created: gig_messages, gig_ratings, daily_attendance, file_uploads';
  RAISE NOTICE '🔧 Enhanced Tables: users, ushers, notifications, gigs';
  RAISE NOTICE '⚡ Functions Created: calculate_usher_rating, update_usher_ratings';
  RAISE NOTICE '🎯 Triggers Created: Rating updates, timestamp updates';
END $$;
