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
      // Get usher stats from multiple sources for accuracy
      const usherProfile = await sql`
        SELECT rating, total_gigs_completed, attendance_rating, brand_rating_avg
        FROM ushers WHERE user_id = ${userId}
      `

      // Get completed gigs from applications (more reliable)
      const completedGigsFromApps = await sql`
        SELECT COUNT(*) as completed_gigs
        FROM applications a
        JOIN gigs g ON a.gig_id = g.id
        WHERE a.usher_id = ${userId} 
        AND a.status = 'approved'
        AND (g.start_datetime + INTERVAL '1 hour' * COALESCE(g.duration_hours, 8)) < NOW()
      `

      // Get earnings from shifts (if shifts table exists)
      const earningsFromShifts = await sql`
        SELECT COALESCE(SUM(CASE 
          WHEN s.payout_status = 'completed' THEN s.payout_amount 
          WHEN s.payout_status = 'pending' AND s.check_out_verified = true THEN s.payout_amount
          ELSE 0 
        END), 0) as total_earnings
        FROM shifts s
        WHERE s.usher_id = ${userId}
      `

      // Fallback: Calculate estimated earnings from completed gigs
      const estimatedEarnings = await sql`
        SELECT COALESCE(SUM(g.pay_rate * COALESCE(g.duration_hours, 8)), 0) as estimated_earnings
        FROM applications a
        JOIN gigs g ON a.gig_id = g.id
        WHERE a.usher_id = ${userId} 
        AND a.status = 'approved'
        AND (g.start_datetime + INTERVAL '1 hour' * COALESCE(g.duration_hours, 8)) < NOW()
      `

      const profile = usherProfile[0] || { rating: 0, total_gigs_completed: 0 }
      const completedGigs = Math.max(
        parseInt(completedGigsFromApps[0]?.completed_gigs) || 0,
        parseInt(profile.total_gigs_completed) || 0
      )
      const totalEarnings = Math.max(
        parseFloat(earningsFromShifts[0]?.total_earnings) || 0,
        parseFloat(estimatedEarnings[0]?.estimated_earnings) || 0
      )

      console.log(`📊 Usher ${userId} stats:`, {
        rating: Number.parseFloat(profile.rating) || 0,
        completed_gigs: completedGigs,
        total_earnings: totalEarnings,
        profile_data: profile
      })

      return NextResponse.json({
        success: true,
        stats: {
          rating: Number.parseFloat(profile.rating) || 0,
          completed_gigs: completedGigs,
          total_earnings: totalEarnings,
        },
      })
    } else if (user.role === "brand") {
      // Get brand profile
      const brandProfile = await sql`
        SELECT wallet_balance FROM brands WHERE user_id = ${userId}
      `

      // Get total gigs created
      const totalGigs = await sql`
        SELECT COUNT(*) as total_gigs FROM gigs WHERE brand_id = ${userId}
      `

      // Get active gigs (future gigs or currently running)
      const activeGigs = await sql`
        SELECT COUNT(*) as active_gigs
        FROM gigs g
        WHERE g.brand_id = ${userId}
        AND (
          g.status = 'active' OR
          (g.start_datetime > NOW()) OR
          (g.start_datetime + INTERVAL '1 hour' * COALESCE(g.duration_hours, 8)) > NOW()
        )
      `

      // Get total unique ushers hired (approved applications)
      const ushersHired = await sql`
        SELECT COUNT(DISTINCT a.usher_id) as total_ushers_hired
        FROM applications a
        JOIN gigs g ON a.gig_id = g.id
        WHERE g.brand_id = ${userId} AND a.status = 'approved'
      `

      const stats = {
        wallet_balance: Number.parseFloat(brandProfile[0]?.wallet_balance) || 0,
        total_gigs_created: Number.parseInt(totalGigs[0]?.total_gigs) || 0,
        active_gigs: Number.parseInt(activeGigs[0]?.active_gigs) || 0,
        total_ushers_hired: Number.parseInt(ushersHired[0]?.total_ushers_hired) || 0,
      }

      console.log(`📊 Brand ${userId} stats:`, stats)

      return NextResponse.json({
        success: true,
        stats: stats,
      })
    }

    return NextResponse.json({ error: "Invalid user role" }, { status: 400 })
  } catch (error) {
    console.error("Stats fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
