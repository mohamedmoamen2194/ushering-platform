import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("📊 Fetching platform stats...")

    // Try to get real stats from database
    try {
      const [totalUsers, totalGigs, totalApplications, activeUsers] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM users`,
        sql`SELECT COUNT(*) as count FROM gigs`,
        sql`SELECT COUNT(*) as count FROM applications`,
        sql`SELECT COUNT(DISTINCT usher_id) as count FROM applications WHERE applied_at > NOW() - INTERVAL '30 days'`
      ])

      const stats = {
        totalUsers: Number(totalUsers[0].count),
        totalGigs: Number(totalGigs[0].count),
        totalApplications: Number(totalApplications[0].count),
        activeUsers: Number(activeUsers[0].count),
        isDemo: false
      }

      console.log("✅ Real stats fetched:", stats)
      return NextResponse.json(stats)

    } catch (dbError) {
      console.warn("⚠️ Database not available, returning demo stats:", dbError)
      
      // Return demo stats if database is not available
      const demoStats = {
        totalUsers: 1250,
        totalGigs: 89,
        totalApplications: 456,
        activeUsers: 234,
        isDemo: true
      }

      return NextResponse.json(demoStats)
    }

  } catch (error) {
    console.error("❌ Platform stats error:", error)
    
    // Always return valid JSON, even on error
    return NextResponse.json({
      totalUsers: 0,
      totalGigs: 0,
      totalApplications: 0,
      activeUsers: 0,
      isDemo: true,
      error: "Failed to fetch stats"
    })
  }
}
