import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing database connection...")
    
    // Test basic connection
    const testResult = await sql`SELECT NOW() as current_time, 'Database connected!' as message`
    console.log("✅ Database connection successful:", testResult[0])
    
    // Check if verification_codes table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'verification_codes'
      ) as table_exists
    `
    
    // List all tables
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      currentTime: testResult[0].current_time,
      verificationTableExists: tableCheck[0].table_exists,
      allTables: allTables.map(t => t.table_name),
      environment: process.env.NODE_ENV
    })
    
  } catch (error) {
    console.error("❌ Database test failed:", error)
    return NextResponse.json({
      success: false,
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
}
