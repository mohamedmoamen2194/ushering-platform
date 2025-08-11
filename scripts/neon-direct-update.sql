-- =====================================================
-- NEON DATABASE DIRECT UPDATE SCRIPT
-- QR Code System Implementation
-- =====================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. UPDATE GIGS TABLE - Add start_datetime column
-- =====================================================

-- Check if start_datetime column exists, add if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gigs' AND column_name = 'start_datetime'
    ) THEN
        ALTER TABLE gigs ADD COLUMN start_datetime TIMESTAMPTZ;
        RAISE NOTICE 'Added start_datetime column to gigs table';
    ELSE
        RAISE NOTICE 'start_datetime column already exists in gigs table';
    END IF;
END $$;

-- =====================================================
-- 2. UPDATE SHIFTS TABLE - Add attendance tracking columns
-- =====================================================

-- Add qr_code_used column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shifts' AND column_name = 'qr_code_used'
    ) THEN
        ALTER TABLE shifts ADD COLUMN qr_code_used BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added qr_code_used column to shifts table';
    ELSE
        RAISE NOTICE 'qr_code_used column already exists in shifts table';
    END IF;
END $$;

-- Add check_in_verified column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shifts' AND column_name = 'check_in_verified'
    ) THEN
        ALTER TABLE shifts ADD COLUMN check_in_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added check_in_verified column to shifts table';
    ELSE
        RAISE NOTICE 'check_in_verified column already exists in shifts table';
    END IF;
END $$;

-- Add check_out_verified column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shifts' AND column_name = 'check_out_verified'
    ) THEN
        ALTER TABLE shifts ADD COLUMN check_out_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added check_out_verified column to shifts table';
    ELSE
        RAISE NOTICE 'check_out_verified column already exists in shifts table';
    END IF;
END $$;

-- Add attendance_status column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shifts' AND column_name = 'attendance_status'
    ) THEN
        ALTER TABLE shifts ADD COLUMN attendance_status VARCHAR(20) DEFAULT 'pending';
        RAISE NOTICE 'Added attendance_status column to shifts table';
    ELSE
        RAISE NOTICE 'attendance_status column already exists in shifts table';
    END IF;
END $$;

-- =====================================================
-- 3. CREATE QR CODE SESSIONS TABLE
-- =====================================================

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

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_qr_sessions_gig_id ON qr_code_sessions(gig_id);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_token ON qr_code_sessions(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_expires ON qr_code_sessions(expires_at);

-- =====================================================
-- 4. CREATE USHER RATINGS TABLE
-- =====================================================

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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_usher_ratings_gig_id ON usher_ratings(gig_id);
CREATE INDEX IF NOT EXISTS idx_usher_ratings_usher_id ON usher_ratings(usher_id);
CREATE INDEX IF NOT EXISTS idx_usher_ratings_brand_id ON usher_ratings(brand_id);

-- =====================================================
-- 5. CREATE FUNCTION TO COMPLETE EXPIRED GIGS
-- =====================================================

CREATE OR REPLACE FUNCTION complete_expired_gigs()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update gigs that have passed their end date
    UPDATE gigs 
    SET status = 'completed'
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE
    AND id NOT IN (
        SELECT DISTINCT gig_id 
        FROM shifts 
        WHERE status = 'active'
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Update shifts for completed gigs
    UPDATE shifts s
    SET status = 'completed',
        payout_status = 'pending',
        payout_amount = (
            SELECT hourly_rate * 
                   EXTRACT(EPOCH FROM (COALESCE(s.check_out_time, s.end_time) - s.check_in_time)) / 3600
            FROM gigs g
            WHERE g.id = s.gig_id
        )
    FROM gigs g
    WHERE s.gig_id = g.id 
    AND g.status = 'completed'
    AND s.status = 'active';
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check what was added
SELECT 'GIGS TABLE COLUMNS' as table_info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gigs' 
ORDER BY ordinal_position;

SELECT 'SHIFTS TABLE COLUMNS' as table_info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shifts' 
ORDER BY ordinal_position;

SELECT 'QR CODE SESSIONS TABLE' as table_info, COUNT(*) as row_count 
FROM qr_code_sessions;

SELECT 'USHER RATINGS TABLE' as table_info, COUNT(*) as row_count 
FROM usher_ratings;

-- =====================================================
-- 7. SAMPLE DATA INSERTION (Optional)
-- =====================================================

-- Insert a sample QR code session for testing (uncomment if needed)
-- INSERT INTO qr_code_sessions (gig_id, expires_at) 
-- SELECT id, NOW() + INTERVAL '24 hours' 
-- FROM gigs 
-- WHERE status = 'active' 
-- LIMIT 1;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'DATABASE UPDATE COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Added start_datetime to gigs table';
    RAISE NOTICE '✅ Added attendance tracking to shifts table';
    RAISE NOTICE '✅ Created qr_code_sessions table';
    RAISE NOTICE '✅ Created usher_ratings table';
    RAISE NOTICE '✅ Added indexes for performance';
    RAISE NOTICE '✅ Created complete_expired_gigs function';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'You can now create gigs with start_datetime!';
    RAISE NOTICE '=====================================================';
END $$; 