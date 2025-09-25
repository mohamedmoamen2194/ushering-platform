import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting notification and rating system migration...')

    // Step 1: Add reference_id to notifications table if not exists
    console.log('📝 Adding reference_id column to notifications table...')
    await sql`
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100)
    `

    // Step 2: Create notification_preferences table
    console.log('📝 Creating notification_preferences table...')
    await sql`
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
      )
    `

    // Step 3: Add rating columns to ushers table
    console.log('📝 Adding rating columns to ushers table...')
    await sql`
      ALTER TABLE ushers ADD COLUMN IF NOT EXISTS attendance_rating DECIMAL(3,2) DEFAULT 0.00
    `
    await sql`
      ALTER TABLE ushers ADD COLUMN IF NOT EXISTS brand_rating DECIMAL(3,2) DEFAULT 0.00
    `
    await sql`
      ALTER TABLE ushers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT
    `

    // Step 4: Create gig_ratings table
    console.log('📝 Creating gig_ratings table...')
    await sql`
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
      )
    `

    // Step 5: Create indexes
    console.log('📝 Creating performance indexes...')
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_reference_id ON notifications(reference_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_gig_ratings_gig_id ON gig_ratings(gig_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_gig_ratings_usher_id ON gig_ratings(usher_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_ushers_rating ON ushers(rating)`

    // Step 6: Create rating calculation function
    console.log('📝 Creating rating calculation function...')
    await sql`
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
      $$ LANGUAGE plpgsql
    `

    // Step 7: Create trigger function
    console.log('📝 Creating trigger function for automatic rating updates...')
    await sql`
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
          )
        WHERE user_id = NEW.usher_id;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `

    // Step 8: Create trigger
    console.log('📝 Creating automatic rating update trigger...')
    await sql`DROP TRIGGER IF EXISTS trigger_update_usher_rating ON gig_ratings`
    await sql`
      CREATE TRIGGER trigger_update_usher_rating
        AFTER INSERT OR UPDATE ON gig_ratings
        FOR EACH ROW
        EXECUTE FUNCTION update_usher_overall_rating()
    `

    // Step 9: Insert default notification preferences for existing users
    console.log('📝 Creating default notification preferences for existing users...')
    await sql`
      INSERT INTO notification_preferences (user_id)
      SELECT id FROM users
      WHERE id NOT IN (SELECT user_id FROM notification_preferences WHERE user_id IS NOT NULL)
      ON CONFLICT (user_id) DO NOTHING
    `

    // Step 10: Verification
    console.log('🔍 Verifying migration...')
    
    // Check tables exist
    const tableCheck = await sql`
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
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'gig_ratings') as exists
    `

    // Check new columns exist
    const columnCheck = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'ushers' 
        AND column_name IN ('attendance_rating', 'brand_rating', 'profile_photo_url')
      ORDER BY column_name
    `

    // Check functions exist
    const functionCheck = await sql`
      SELECT 
        routine_name,
        routine_type
      FROM information_schema.routines 
      WHERE routine_name IN ('calculate_dynamic_rating', 'update_usher_overall_rating')
        AND routine_schema = 'public'
    `

    // Count notification preferences
    const preferencesCount = await sql`
      SELECT COUNT(*) as count FROM notification_preferences
    `

    console.log('✅ Migration completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Notification and rating system migration completed successfully',
      verification: {
        tables: tableCheck,
        columns: columnCheck,
        functions: functionCheck,
        notificationPreferences: preferencesCount[0].count
      }
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
