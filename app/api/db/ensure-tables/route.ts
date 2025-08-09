import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Check and create verification_codes table if it doesn't exist
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'verification_codes'
      )
    `

    if (!tableExists[0].exists) {
      // Create table
      await sql`
        CREATE TABLE verification_codes (
          id SERIAL PRIMARY KEY,
          phone VARCHAR(15) NOT NULL,
          code VARCHAR(6) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          attempts INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          verified_at TIMESTAMPTZ
        )
      `

      // Create indexes separately
      await sql`CREATE INDEX idx_verification_codes_phone ON verification_codes(phone)`
      await sql`CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at)`

      console.log("✅ Created verification_codes table with indexes")
    }

    // Check all required tables
    const requiredTables = [
      'users', 'ushers', 'brands', 'gigs', 'applications', 
      'shifts', 'wallet_transactions', 'notifications', 'verification_codes'
    ]

    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY(${requiredTables})
    `

    const existingTableNames = existingTables.map(t => t.table_name)
    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table))

    return NextResponse.json({
      success: true,
      message: "Database tables checked and created if needed",
      existingTables: existingTableNames,
      missingTables,
      allTablesExist: missingTables.length === 0
    })

  } catch (error) {
    console.error("Database table creation error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to ensure database tables exist",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
