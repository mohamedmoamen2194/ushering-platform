import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { usherId: string } }) {
  try {
    const usherId = params.usherId

    if (!usherId) {
      return NextResponse.json({ error: "Usher ID is required" }, { status: 400 })
    }

    // Check if the new columns exist
    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gigs' AND column_name IN ('start_date', 'end_date')
    `

    const hasNewColumns = columnsCheck.length > 0

    let result

    if (hasNewColumns) {
      // Query with new columns
      result = await sql`
        SELECT 
          a.id,
          a.gig_id,
          a.status,
          a.applied_at,
          a.reviewed_at,
          g.title as gig_title,
          g.location as gig_location,
          g.start_datetime as gig_datetime,
          g.start_datetime,
          g.duration_hours,
          g.pay_rate,
          g.start_date,
          g.end_date,
          u.name as brand_name,
          u.email as brand_email,
          b.company_name
        FROM applications a
        JOIN gigs g ON a.gig_id = g.id
        JOIN users u ON g.brand_id = u.id
        LEFT JOIN brands b ON u.id = b.user_id
        WHERE a.usher_id = ${usherId}
        AND a.status IN ('pending', 'approved')
        ORDER BY 
          CASE a.status 
            WHEN 'pending' THEN 1 
            WHEN 'approved' THEN 2 
          END,
          a.applied_at DESC
      `
    } else {
      // Query without new columns (original schema)
      result = await sql`
        SELECT 
          a.id,
          a.gig_id,
          a.status,
          a.applied_at,
          a.reviewed_at,
          g.title as gig_title,
          g.location as gig_location,
          g.start_datetime as gig_datetime,
          g.start_datetime,
          g.duration_hours,
          g.pay_rate,
          NULL as start_date,
          NULL as end_date,
          u.name as brand_name,
          u.email as brand_email,
          b.company_name
        FROM applications a
        JOIN gigs g ON a.gig_id = g.id
        JOIN users u ON g.brand_id = u.id
        LEFT JOIN brands b ON u.id = b.user_id
        WHERE a.usher_id = ${usherId}
        AND a.status IN ('pending', 'approved')
        ORDER BY 
          CASE a.status 
            WHEN 'pending' THEN 1 
            WHEN 'approved' THEN 2 
          END,
          a.applied_at DESC
      `
    }

    return NextResponse.json({
      success: true,
      applications: result,
    })
  } catch (error) {
    console.error("Usher applications fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
  }
}
