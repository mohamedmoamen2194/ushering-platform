const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

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

async function setDefaultPasswords() {
  try {
    console.log("🚀 Setting default passwords for existing users...");
    
    // Get all users without passwords
    const usersWithoutPasswords = await sql`
      SELECT id, phone, name, role 
      FROM users 
      WHERE password_hash IS NULL AND is_active = true
    `;
    
    if (usersWithoutPasswords.length === 0) {
      console.log("✅ All users already have passwords set");
      return;
    }
    
    console.log(`📱 Found ${usersWithoutPasswords.length} users without passwords:`);
    usersWithoutPasswords.forEach(user => {
      console.log(`  - ${user.name} (${user.phone}) - ${user.role}`);
    });
    
    // Set default password for each user
    const defaultPassword = "Password123!"; // Strong default password
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    
    console.log(`\n🔐 Setting default password: ${defaultPassword}`);
    console.log("⚠️  Users should change this password on first login!");
    
    for (const user of usersWithoutPasswords) {
      await sql`
        UPDATE users 
        SET password_hash = ${passwordHash}, updated_at = NOW()
        WHERE id = ${user.id}
      `;
      console.log(`✅ Password set for ${user.name} (${user.phone})`);
    }
    
    console.log("\n🎉 All default passwords have been set!");
    console.log("📝 Users can now log in with:");
    console.log(`   Phone: their phone number`);
    console.log(`   Password: ${defaultPassword}`);
    console.log("\n⚠️  IMPORTANT: Users should change this password immediately!");
    
  } catch (error) {
    console.error("❌ Failed to set default passwords:", error);
    process.exit(1);
  }
}

// Run the script
setDefaultPasswords(); 