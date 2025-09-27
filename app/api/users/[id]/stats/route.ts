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
      // Get usher stats with better handling of missing data
      const statsResult = await sql`
        SELECT 
          COALESCE(u.rating, 0) as rating,
          COALESCE(u.total_gigs_completed, 0) as total_gigs_completed,
          COALESCE(SUM(CASE 
            WHEN s.payout_status = 'completed' THEN s.payout_amount 
            WHEN s.payout_status = 'pending' AND s.check_out_verified = true THEN s.payout_amount
            ELSE 0 
          END), 0) as total_earnings,
          COUNT(CASE 
            WHEN s.payout_status = 'completed' THEN 1
            WHEN s.payout_status = 'pending' AND s.check_out_verified = true THEN 1
            WHEN s.check_out_verified = true THEN 1
          END) as actual_completed_gigs,
          COUNT(CASE WHEN s.check_in_verified = true THEN 1 END) as total_attended_gigs
        FROM users usr
        LEFT JOIN ushers u ON usr.id = u.user_id
        LEFT JOIN shifts s ON usr.id = s.usher_id
        WHERE usr.id = ${userId}
        GROUP BY usr.id, u.rating, u.total_gigs_completed
      `

      const stats = statsResult[0] || {
        rating: 0,
        total_gigs_completed: 0,
        total_earnings: 0,
        actual_completed_gigs: 0,
      }

      // Use actual completed gigs from shifts if available, otherwise fall back to profile data
      const completedGigs = Math.max(
        Number.parseInt(stats.actual_completed_gigs) || 0,
        Number.parseInt(stats.total_gigs_completed) || 0
      )

      return NextResponse.json({
        success: true,
        stats: {
          rating: Number.parseFloat(stats.rating) || 0,
          completed_gigs: completedGigs,
          total_earnings: Number.parseFloat(stats.total_earnings) || 0,
        },
      })
    } else if (user.role === "brand") {
      // Get brand stats
      const statsResult = await sql`
        SELECT 
          COALESCE(b.wallet_balance, 0) as wallet_balance,
          COUNT(DISTINCT g.id) as total_gigs_created,
          COUNT(DISTINCT CASE 
            WHEN g.status = 'active' OR (
              g.start_datetime IS NOT NULL AND 
              g.duration_hours IS NOT NULL AND
              (g.start_datetime + INTERVAL '1 hour' * g.duration_hours) > NOW()
            ) THEN g.id 
          END) as active_gigs,
          COUNT(DISTINCT a.usher_id) as total_ushers_hired
        FROM users usr
        LEFT JOIN brands b ON usr.id = b.user_id
        LEFT JOIN gigs g ON usr.id = g.brand_id
        LEFT JOIN applications a ON g.id = a.gig_id AND a.status = 'approved'
        WHERE usr.id = ${userId}
        GROUP BY usr.id, b.wallet_balance
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
