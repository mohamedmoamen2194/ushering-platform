const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  console.log("📝 To fix this:");
  console.log("1. Add Neon integration to your project");
  console.log("2. Or set DATABASE_URL manually in your environment");
  console.log("3. Or ensure .env.local file exists with DATABASE_URL");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log("🚀 Starting password migration...");
    
    // Check if the column already exists
    const existingColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_hash'
    `;
    
    if (existingColumn.length > 0) {
      console.log("✅ password_hash column already exists in users table");
    } else {
      console.log("📝 Adding password_hash column to users table...");
      
      // Add the column
      await sql`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)`;
      console.log("✅ Added password_hash column");
    }
    
    // Create index (this will not fail if it already exists)
    console.log("📝 Creating index on password_hash...");
    await sql`CREATE INDEX IF NOT EXISTS idx_users_password_hash ON users(password_hash) WHERE password_hash IS NOT NULL`;
    console.log("✅ Index created/verified");
    
    // Verify the column was added
    const checkResult = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_hash'
    `;
    
    if (checkResult.length > 0) {
      console.log("✅ password_hash column verified in users table");
      console.log("Column details:", checkResult[0]);
    } else {
      console.log("❌ password_hash column still not found after migration");
      console.log("This might be a database permission issue.");
    }
    
    // Show final table structure
    console.log("\n📋 Final users table structure:");
    const tableStructure = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    tableStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 