import { neon } from "@neondatabase/serverless"

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set")
  console.log("📝 To fix this:")
  console.log("1. Add Neon integration to your project")
  console.log("2. Or set DATABASE_URL manually in your environment")
  throw new Error(
    "DATABASE_URL environment variable is required. Please add Neon integration or set DATABASE_URL manually.",
  )
}

export const sql = neon(process.env.DATABASE_URL)

// Test database connection
export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`
    console.log("✅ Database connection successful")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}

// Database helper functions
export async function getUserByPhone(phone: string) {
  try {
    const result = await sql`
      SELECT u.*, 
             CASE 
               WHEN u.role = 'usher' THEN json_build_object(
                 'skills', ush.skills,
                 'id_verified', ush.id_verified,
                 'vcash_number', ush.vcash_number,
                 'experience_years', ush.experience_years,
                 'rating', ush.rating,
                 'total_gigs_completed', ush.total_gigs_completed
               )
               WHEN u.role = 'brand' THEN json_build_object(
                 'company_name', b.company_name,
                 'industry', b.industry,
                 'wallet_balance', b.wallet_balance,
                 'contact_person', b.contact_person
               )
             END as profile
      FROM users u
      LEFT JOIN ushers ush ON u.id = ush.user_id AND u.role = 'usher'
      LEFT JOIN brands b ON u.id = b.user_id AND u.role = 'brand'
      WHERE u.phone = ${phone} AND u.is_active = true
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching user by phone:", error)
    throw error
  }
}

export async function createUser(userData: {
  phone: string
  name: string
  email?: string
  role: "usher" | "brand" | "admin"
  language?: string
  password_hash?: string
}) {
  try {
    const result = await sql`
      INSERT INTO users (phone, name, email, role, language, password_hash)
      VALUES (${userData.phone}, ${userData.name}, ${userData.email || null}, ${userData.role}, ${userData.language || "ar"}, ${userData.password_hash || null})
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function getActiveGigs(location?: string, userId?: number) {
  try {
    const result = await sql`
      SELECT g.*, u.name as brand_name, b.company_name,
             (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'approved') as approved_ushers,
             CASE WHEN ${userId}::int IS NOT NULL THEN
               (SELECT status FROM applications a WHERE a.gig_id = g.id AND a.usher_id = ${userId}::int)
             ELSE NULL END as application_status
      FROM gigs g
      JOIN users u ON g.brand_id = u.id
      JOIN brands b ON u.id = b.user_id
      WHERE g.status = 'active' 
      AND g.datetime > NOW()
      ${location ? sql`AND g.location ILIKE ${"%" + location + "%"}` : sql``}
      ORDER BY g.datetime ASC
    `
    return result
  } catch (error) {
    console.error("Error fetching gigs:", error)
    throw error
  }
}

// Update user password
export async function updateUserPassword(userId: number, passwordHash: string) {
  try {
    const result = await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, phone, role
    `
    return result[0]
  } catch (error) {
    console.error("Error updating user password:", error)
    throw error
  }
}

// Check if tables exist
export async function checkTablesExist() {
  try {
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'ushers', 'brands', 'gigs', 'applications', 'shifts', 'wallet_transactions', 'notifications')
    `
    return result.map((row) => row.table_name)
  } catch (error) {
    console.error("Error checking tables:", error)
    return []
  }
}
