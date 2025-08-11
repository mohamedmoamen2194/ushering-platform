import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing database connection...")
    console.log("📝 DATABASE_URL exists:", !!process.env.DATABASE_URL)
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time, COUNT(*) as gig_count FROM gigs`
    
    console.log("✅ Database connection successful!")
    console.log("🕐 Current time:", result[0].current_time)
    console.log("📊 Total gigs:", result[0].gig_count)
    
    return NextResponse.json({
      success: true,
      message: "Database connected successfully",
      data: {
        currentTime: result[0].current_time,
        totalGigs: result[0].gig_count
      }
    })
    
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    
    return NextResponse.json({ 
      success: false, 
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
      envCheck: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
      }
    }, { status: 500 })
  }
}
