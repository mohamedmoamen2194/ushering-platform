import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(process.cwd(), ".env.local") })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  try {
    console.log("Adding missing columns to ushers table...")
    await sql`ALTER TABLE ushers ADD COLUMN IF NOT EXISTS id_photo_url TEXT`
    await sql`ALTER TABLE ushers ADD COLUMN IF NOT EXISTS id_photo_uploaded_at TIMESTAMPTZ`
    await sql`ALTER TABLE ushers ADD COLUMN IF NOT EXISTS payment_method JSONB DEFAULT '{}'::jsonb`
    await sql`ALTER TABLE ushers ADD COLUMN IF NOT EXISTS payment_method_set BOOLEAN DEFAULT FALSE`
    
    console.log("Adding missing columns to brands table...")
    await sql`ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url TEXT`
    await sql`ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_uploaded_at TIMESTAMPTZ`
    await sql`ALTER TABLE brands ADD COLUMN IF NOT EXISTS company_description TEXT`
    await sql`ALTER TABLE brands ADD COLUMN IF NOT EXISTS company_website TEXT`
    
    console.log("Verifying ushers columns...")
    const usherCols = await sql`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'ushers' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    console.log("Ushers columns:", usherCols.map(c => c.column_name).join(", "))
    
    console.log("Verifying brands columns...")
    const brandCols = await sql`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'brands' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    console.log("Brands columns:", brandCols.map(c => c.column_name).join(", "))
    
    console.log("Done!")
  } catch (e) {
    console.error("Error:", e)
  }
}

main()
