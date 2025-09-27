import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { brandId: string } }) {
  try {
    const brandId = params.brandId

    if (!brandId) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 })
    }

    // Get query parameters for filtering
    const status = request.nextUrl.searchParams.get("status") // 'pending', 'approved', 'rejected', 'all'
    const includeRejected = request.nextUrl.searchParams.get("includeRejected") === "true"

    // Build the status filter
    let statusFilter = sql``
    if (status && status !== "all") {
      statusFilter = sql`AND a.status = ${status}`
    } else if (!includeRejected) {
      // By default, exclude rejected applications
      statusFilter = sql`AND a.status != 'rejected'`
    }

    // Get all applications for gigs created by this brand with contact info
    const result = await sql`
      SELECT 
        a.id,
        a.gig_id,
        a.usher_id,
        a.status,
        a.applied_at,
        a.reviewed_at,
        g.title as gig_title,
        g.location as gig_location,
        COALESCE(g.start_datetime, g.datetime) as gig_datetime,
        COALESCE(g.duration_hours, 8) as gig_duration_hours,
        u.name as usher_name,
        u.phone as usher_phone,
        u.email as usher_email,
        COALESCE(ush.rating, 0) as usher_rating,
        COALESCE(ush.experience_years, 0) as usher_experience_years,
        COALESCE(ush.skills, '{}') as usher_skills,
        COALESCE(ush.vcash_number, '') as usher_vcash_number,
        ush.profile_photo_url as usher_profile_photo_url
      FROM applications a
      JOIN gigs g ON a.gig_id = g.id
      JOIN users u ON a.usher_id = u.id
      LEFT JOIN ushers ush ON u.id = ush.user_id
      WHERE g.brand_id = ${brandId}
      ${statusFilter}
      ORDER BY 
        CASE a.status 
          WHEN 'pending' THEN 1 
          WHEN 'approved' THEN 2 
          WHEN 'rejected' THEN 3 
        END,
        a.applied_at DESC
    `

    return NextResponse.json({
      success: true,
      applications: result,
    })
  } catch (error) {
    console.error("Applications fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
  }
}
