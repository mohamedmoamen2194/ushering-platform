#!/usr/bin/env node

/**
 * Aura Platform Enhancement Migration Runner
 * Executes the database schema updates for new features
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runEnhancementMigration() {
  console.log('🚀 Starting Aura Platform Enhancement Migration...\n');

  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('📝 Please ensure your .env.local file contains DATABASE_URL');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '10-enhancement-migration.sql');
    console.log('📄 Reading migration file:', migrationPath);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error('Migration file not found: ' + migrationPath);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded successfully\n');

    // Execute the migration
    console.log('⚡ Executing database migration...');
    console.log('⏳ This may take a few moments...\n');

    let successCount = 0;
    let skipCount = 0;

    try {
      // Execute each migration step individually
      
      // 1. Add photo upload support for ushers
      console.log('📸 Adding photo upload support...');
      try {
        await sql`ALTER TABLE ushers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT`;
        await sql`ALTER TABLE ushers ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMPTZ`;
        console.log('✅ Added photo columns to ushers table');
        successCount += 2;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ Photo columns already exist');
          skipCount += 2;
        } else throw error;
      }

      // 2. Create gig messages table
      console.log('💬 Creating gig messages table...');
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS gig_messages (
            id SERIAL PRIMARY KEY,
            gig_id INT REFERENCES gigs(id) ON DELETE CASCADE,
            sender_id INT REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            message_type VARCHAR(20) DEFAULT 'message' CHECK (message_type IN ('message', 'announcement')),
            is_announcement BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;
        console.log('✅ Created gig_messages table');
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ gig_messages table already exists');
          skipCount++;
        } else throw error;
      }

      // 3. Create gig ratings table
      console.log('⭐ Creating gig ratings table...');
      try {
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
        `;
        console.log('✅ Created gig_ratings table');
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ gig_ratings table already exists');
          skipCount++;
        } else throw error;
      }

      // 4. Create daily attendance table
      console.log('📅 Creating daily attendance table...');
      try {
        await sql`
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
          )
        `;
        console.log('✅ Created daily_attendance table');
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ daily_attendance table already exists');
          skipCount++;
        } else throw error;
      }

      // 5. Create file uploads table
      console.log('📁 Creating file uploads table...');
      try {
        await sql`
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
          )
        `;
        console.log('✅ Created file_uploads table');
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ file_uploads table already exists');
          skipCount++;
        } else throw error;
      }

      // 6. Add enhanced rating fields to ushers
      console.log('📊 Adding enhanced rating fields...');
      try {
        await sql`ALTER TABLE ushers ADD COLUMN IF NOT EXISTS attendance_rating DECIMAL(3,2) DEFAULT 0.00`;
        await sql`ALTER TABLE ushers ADD COLUMN IF NOT EXISTS brand_rating_avg DECIMAL(3,2) DEFAULT 0.00`;
        await sql`ALTER TABLE ushers ADD COLUMN IF NOT EXISTS total_ratings_count INT DEFAULT 0`;
        console.log('✅ Added enhanced rating fields to ushers');
        successCount += 3;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ Enhanced rating fields already exist');
          skipCount += 3;
        } else throw error;
      }

      // 7. Add notification enhancements
      console.log('🔔 Adding notification enhancements...');
      try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"whatsapp": true, "email": false, "push": true}'`;
        await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed'))`;
        await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ`;
        await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) DEFAULT 'whatsapp' CHECK (delivery_method IN ('whatsapp', 'email', 'push', 'in_app'))`;
        await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100)`;
        console.log('✅ Added notification enhancements');
        successCount += 5;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ Notification enhancements already exist');
          skipCount += 5;
        } else throw error;
      }

      // 8. Add gig duration tracking
      console.log('⏰ Adding gig duration tracking...');
      try {
        await sql`ALTER TABLE gigs ADD COLUMN IF NOT EXISTS start_datetime TIMESTAMPTZ`;
        await sql`ALTER TABLE gigs ADD COLUMN IF NOT EXISTS end_datetime TIMESTAMPTZ`;
        await sql`ALTER TABLE gigs ADD COLUMN IF NOT EXISTS total_days INT DEFAULT 1`;
        console.log('✅ Added gig duration tracking');
        successCount += 3;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ Gig duration fields already exist');
          skipCount += 3;
        } else throw error;
      }

      console.log('🎯 Creating indexes...');
      // Create indexes (these are safe to run multiple times)
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_gig_messages_gig_id ON gig_messages(gig_id)',
        'CREATE INDEX IF NOT EXISTS idx_gig_messages_sender_id ON gig_messages(sender_id)',
        'CREATE INDEX IF NOT EXISTS idx_gig_ratings_gig_id ON gig_ratings(gig_id)',
        'CREATE INDEX IF NOT EXISTS idx_gig_ratings_usher_id ON gig_ratings(usher_id)',
        'CREATE INDEX IF NOT EXISTS idx_daily_attendance_gig_id ON daily_attendance(gig_id)',
        'CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id)'
      ];

      for (const indexSQL of indexes) {
        try {
          // Use individual SQL calls for indexes
          if (indexSQL.includes('idx_gig_messages_gig_id')) {
            await sql`CREATE INDEX IF NOT EXISTS idx_gig_messages_gig_id ON gig_messages(gig_id)`;
          } else if (indexSQL.includes('idx_gig_messages_sender_id')) {
            await sql`CREATE INDEX IF NOT EXISTS idx_gig_messages_sender_id ON gig_messages(sender_id)`;
          } else if (indexSQL.includes('idx_gig_ratings_gig_id')) {
            await sql`CREATE INDEX IF NOT EXISTS idx_gig_ratings_gig_id ON gig_ratings(gig_id)`;
          } else if (indexSQL.includes('idx_gig_ratings_usher_id')) {
            await sql`CREATE INDEX IF NOT EXISTS idx_gig_ratings_usher_id ON gig_ratings(usher_id)`;
          } else if (indexSQL.includes('idx_daily_attendance_gig_id')) {
            await sql`CREATE INDEX IF NOT EXISTS idx_daily_attendance_gig_id ON daily_attendance(gig_id)`;
          } else if (indexSQL.includes('idx_file_uploads_user_id')) {
            await sql`CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id)`;
          }
          successCount++;
        } catch (error) {
          if (error.message.includes('already exists')) {
            skipCount++;
          } else {
            console.warn(`⚠️ Index creation warning: ${error.message}`);
            skipCount++;
          }
        }
      }

    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      throw error;
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Statistics:`);
    console.log(`   ✅ Successful operations: ${successCount}`);
    console.log(`   ⚠️ Skipped operations: ${skipCount}`);

    // Verify the migration by checking for new tables
    console.log('\n🔍 Verifying migration...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('gig_messages', 'gig_ratings', 'daily_attendance', 'file_uploads')
      ORDER BY table_name
    `;

    console.log('✅ New tables created:');
    tables.forEach(table => {
      console.log(`   📋 ${table.table_name}`);
    });

    // Check for new columns in existing tables
    const newColumns = await sql`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'ushers', 'notifications', 'gigs')
      AND column_name IN (
        'profile_photo_url', 'photo_uploaded_at', 'notification_preferences', 
        'status', 'sent_at', 'delivery_method', 'reference_id',
        'start_datetime', 'end_datetime', 'total_days',
        'attendance_rating', 'brand_rating_avg', 'total_ratings_count'
      )
      ORDER BY table_name, column_name
    `;

    if (newColumns.length > 0) {
      console.log('\n✅ New columns added:');
      let currentTable = '';
      newColumns.forEach(col => {
        if (col.table_name !== currentTable) {
          currentTable = col.table_name;
          console.log(`   📋 ${col.table_name}:`);
        }
        console.log(`      🔹 ${col.column_name}`);
      });
    }

    console.log('\n🎯 Next Steps:');
    console.log('   1. Update your application code to use the new features');
    console.log('   2. Test the new functionality in development');
    console.log('   3. Update API endpoints for new features');
    console.log('   4. Update UI components');
    
    console.log('\n✨ Enhancement migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your DATABASE_URL is correct');
    console.error('   2. Ensure database is accessible');
    console.error('   3. Verify you have necessary permissions');
    console.error('   4. Check the migration SQL file for syntax errors');
    
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  runEnhancementMigration()
    .then(() => {
      console.log('\n🏁 Migration process completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { runEnhancementMigration };
