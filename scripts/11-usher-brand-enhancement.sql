-- =============================================================
-- Migration 11: Usher & Brand Profile Enhancement
-- Adds: ID photo, payment method, brand fields, notifications
-- =============================================================

-- 1. Usher enhancements
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS id_photo_url TEXT;
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS id_photo_uploaded_at TIMESTAMP;
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS payment_method JSONB DEFAULT '{}';
ALTER TABLE ushers ADD COLUMN IF NOT EXISTS payment_method_set BOOLEAN DEFAULT FALSE;

-- 2. Brand enhancements (add logo to brands table)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_uploaded_at TIMESTAMP;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS company_description TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS company_website TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS company_phone TEXT;

-- 3. Ensure notifications table has all needed columns
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 4. Create or update indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(user_id, created_at DESC);
