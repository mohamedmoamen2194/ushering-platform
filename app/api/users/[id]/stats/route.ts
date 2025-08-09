import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user role first
    const userResult = await sql`
      SELECT role FROM users WHERE id = ${userId}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userResult[0]

    if (user.role === "usher") {
      // Get usher stats
      const statsResult = await sql`
        SELECT 
          u.rating,
          u.total_gigs_completed,
          COALESCE(SUM(s.payout_amount), 0) as total_earnings
        FROM ushers u
        LEFT JOIN shifts s ON u.user_id = s.usher_id AND s.payout_status = 'completed'
        WHERE u.user_id = ${userId}
        GROUP BY u.rating, u.total_gigs_completed
      `

      const stats = statsResult[0] || {
        rating: 0,
        total_gigs_completed: 0,
        total_earnings: 0,
      }

      return NextResponse.json({
        success: true,
        stats: {
          rating: Number.parseFloat(stats.rating) || 0,
          completed_gigs: Number.parseInt(stats.total_gigs_completed) || 0,
          total_earnings: Number.parseFloat(stats.total_earnings) || 0,
        },
      })
    } else if (user.role === "brand") {
      // Get brand stats
      const statsResult = await sql`
        SELECT 
          b.wallet_balance,
          COUNT(DISTINCT g.id) as total_gigs_created,
          COUNT(DISTINCT CASE WHEN g.status = 'active' THEN g.id END) as active_gigs,
          COUNT(DISTINCT a.usher_id) as total_ushers_hired
        FROM brands b
        LEFT JOIN gigs g ON b.user_id = g.brand_id
        LEFT JOIN applications a ON g.id = a.gig_id AND a.status = 'approved'
        WHERE b.user_id = ${userId}
        GROUP BY b.wallet_balance
      `

      const stats = statsResult[0] || {
        wallet_balance: 0,
        total_gigs_created: 0,
        active_gigs: 0,
        total_ushers_hired: 0,
      }

      return NextResponse.json({
        success: true,
        stats: {
          wallet_balance: Number.parseFloat(stats.wallet_balance) || 0,
          total_gigs_created: Number.parseInt(stats.total_gigs_created) || 0,
          active_gigs: Number.parseInt(stats.active_gigs) || 0,
          total_ushers_hired: Number.parseInt(stats.total_ushers_hired) || 0,
        },
      })
    }

    return NextResponse.json({ error: "Invalid user role" }, { status: 400 })
  } catch (error) {
    console.error("Stats fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
