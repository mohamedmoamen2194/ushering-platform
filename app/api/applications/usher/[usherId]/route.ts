export const dynamic = 'force-dynamic'
export const revalidate = 0

import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { usherId: string } }) {
  try {
    const usherId = params.usherId

    if (!usherId) {
      return NextResponse.json({ error: "Usher ID is required" }, { status: 400 })
    }

    // Use try-catch to handle different database schemas gracefully
    let result
    try {
      // Try with new schema first (start_datetime, duration_hours)
      result = await sql`
        SELECT 
          a.id,
          a.gig_id,
          LOWER(a.status) as status,
          a.applied_at,
          a.reviewed_at,
          g.title as gig_title,
          g.location as gig_location,
          g.start_datetime as gig_datetime,
          g.start_datetime,
          (g.start_datetime AT TIME ZONE 'Africa/Cairo') as start_datetime_cairo,
          to_char((g.start_datetime AT TIME ZONE 'Africa/Cairo'), 'HH24:MI') as start_time_24h,
          to_char((g.start_datetime AT TIME ZONE 'Africa/Cairo'), 'YYYY-MM-DD') as start_date_display,
          g.duration_hours,
          g.pay_rate,
          -- attendance: count qr sessions scanned by this usher for this gig
          COALESCE((
            SELECT COUNT(*)::int FROM qr_code_sessions q
            WHERE q.gig_id = g.id
              AND q.scanned_by_ushers @> ARRAY[${usherId}]::int[]
          ), 0) AS attended_days,
          1::int AS total_days,
          u.name as brand_name,
          u.email as brand_email,
          b.company_name
        FROM applications a
        JOIN gigs g ON a.gig_id = g.id
        JOIN users u ON g.brand_id = u.id
        LEFT JOIN brands b ON u.id = b.user_id
        WHERE a.usher_id = ${usherId}
        AND LOWER(a.status) IN ('pending', 'approved')
        ORDER BY 
          CASE LOWER(a.status)
            WHEN 'pending' THEN 1 
            WHEN 'approved' THEN 2 
          END,
          a.applied_at DESC
      `
    } catch (error) {
      // Fallback to old schema (datetime, duration_hours)
      try {
        result = await sql`
          SELECT 
            a.id,
            a.gig_id,
            LOWER(a.status) as status,
            a.applied_at,
            a.reviewed_at,
            g.title as gig_title,
            g.location as gig_location,
            g.datetime as gig_datetime,
            g.datetime as start_datetime,
            (g.datetime AT TIME ZONE 'Africa/Cairo') as start_datetime_cairo,
            to_char((g.datetime AT TIME ZONE 'Africa/Cairo'), 'HH24:MI') as start_time_24h,
            to_char((g.datetime AT TIME ZONE 'Africa/Cairo'), 'YYYY-MM-DD') as start_date_display,
            g.duration_hours,
            g.pay_rate,
            -- attendance from sessions scanned
            COALESCE((
              SELECT COUNT(*)::int FROM qr_code_sessions q
              WHERE q.gig_id = g.id
                AND q.scanned_by_ushers @> ARRAY[${usherId}]::int[]
            ), 0) AS attended_days,
            1::int AS total_days,
            u.name as brand_name,
            u.email as brand_email,
            b.company_name
          FROM applications a
          JOIN gigs g ON a.gig_id = g.id
          JOIN users u ON g.brand_id = u.id
          LEFT JOIN brands b ON u.id = b.user_id
          WHERE a.usher_id = ${usherId}
          AND LOWER(a.status) IN ('pending', 'approved')
          ORDER BY 
            CASE LOWER(a.status)
              WHEN 'pending' THEN 1 
              WHEN 'approved' THEN 2 
            END,
            a.applied_at DESC
        `
      } catch (error2) {
        // Final fallback - minimal columns that should always exist
        result = await sql`
          SELECT 
            a.id,
            a.gig_id,
            LOWER(a.status) as status,
            a.applied_at,
            a.reviewed_at,
            g.title as gig_title,
            g.location as gig_location,
            g.created_at as gig_datetime,
            g.created_at as start_datetime,
            (g.created_at AT TIME ZONE 'Africa/Cairo') as start_datetime_cairo,
            to_char((g.created_at AT TIME ZONE 'Africa/Cairo'), 'HH24:MI') as start_time_24h,
            to_char((g.created_at AT TIME ZONE 'Africa/Cairo'), 'YYYY-MM-DD') as start_date_display,
            8 as duration_hours,
            0 as pay_rate,
            0 AS attended_days,
            1::int AS total_days,
            u.name as brand_name,
            u.email as brand_email,
            '' as company_name
          FROM applications a
          JOIN gigs g ON a.gig_id = g.id
          JOIN users u ON g.brand_id = u.id
          WHERE a.usher_id = ${usherId}
          AND LOWER(a.status) IN ('pending', 'approved')
          ORDER BY 
            CASE LOWER(a.status)
              WHEN 'pending' THEN 1 
              WHEN 'approved' THEN 2 
            END,
            a.applied_at DESC
        `
      }
    }

    console.log("Usher applications GET:", { usherId, count: result.length })
    
    // Log the gig IDs for debugging
    const gigIds = result.map(r => r.gig_id)
    console.log("📋 Gig IDs in applications:", gigIds)

    return NextResponse.json({
      success: true,
      applications: result,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error("Usher applications fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
  }
}
