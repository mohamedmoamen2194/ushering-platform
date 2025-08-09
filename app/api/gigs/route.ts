import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")
    const role = searchParams.get("role")
    const userId = searchParams.get("userId")

    console.log("Fetching gigs for userId:", userId, "role:", role)

    // Check if the new columns exist
    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gigs' AND column_name IN ('start_date', 'end_date', 'is_recurring')
    `

    const hasNewColumns = columnsCheck.length > 0
    console.log("Has new columns:", hasNewColumns)

    if (role === "brand" && userId) {
      // Get gigs created by this brand
      const result = await sql`
        SELECT g.*, 
               (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'approved') as approved_ushers,
               (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'pending') as pending_applications
        FROM gigs g
        WHERE g.brand_id = ${userId}
        ORDER BY g.datetime DESC
      `
      return NextResponse.json({ gigs: result })
    } else {
      // Get available gigs for ushers - SIMPLIFIED LOGIC
      let gigQuery

      if (userId) {
        // Only hide gigs where user has APPROVED applications
        gigQuery = sql`
          SELECT g.*, u.name as brand_name, b.company_name, u.email as brand_email,
                 (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'approved') as approved_ushers,
                 (SELECT status FROM applications a WHERE a.gig_id = g.id AND a.usher_id = ${userId} ORDER BY a.applied_at DESC LIMIT 1) as application_status
          FROM gigs g
          JOIN users u ON g.brand_id = u.id
          JOIN brands b ON u.id = b.user_id
          WHERE g.status = 'active' 
          AND g.datetime > NOW()
          ${location ? sql`AND g.location ILIKE ${`%${location}%`}` : sql``}
          AND NOT EXISTS (
            SELECT 1 FROM applications a 
            WHERE a.gig_id = g.id 
            AND a.usher_id = ${userId} 
            AND a.status = 'approved'
          )
          ORDER BY g.datetime ASC
        `
      } else {
        // No user ID provided
        gigQuery = sql`
          SELECT g.*, u.name as brand_name, b.company_name,
                 (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'approved') as approved_ushers,
                 NULL as application_status
          FROM gigs g
          JOIN users u ON g.brand_id = u.id
          JOIN brands b ON u.id = b.user_id
          WHERE g.status = 'active' 
          AND g.datetime > NOW()
          ${location ? sql`AND g.location ILIKE ${`%${location}%`}` : sql``}
          ORDER BY g.datetime ASC
        `
      }

      let result = await gigQuery
      console.log("Initial gigs found:", result.length)

      // ONLY filter for date conflicts if user has PENDING applications
      if (userId && hasNewColumns && result.length > 0) {
        // Get user's pending applications
        const pendingApps = await sql`
          SELECT g.id as gig_id, g.start_date, g.end_date, g.title
          FROM applications a
          JOIN gigs g ON a.gig_id = g.id
          WHERE a.usher_id = ${userId} 
          AND a.status = 'pending'
          AND g.start_date IS NOT NULL
          AND g.end_date IS NOT NULL
        `

        console.log("User pending applications:", pendingApps.length)

        if (pendingApps.length > 0) {
          const beforeFilter = result.length

          result = result.filter((gig: any) => {
            if (!gig.start_date || !gig.end_date) return true

            const hasConflict = pendingApps.some((pendingApp: any) => {
              const gigStart = new Date(gig.start_date)
              const gigEnd = new Date(gig.end_date)
              const pendingStart = new Date(pendingApp.start_date)
              const pendingEnd = new Date(pendingApp.end_date)

              return gigStart <= pendingEnd && gigEnd >= pendingStart
            })

            if (hasConflict) {
              console.log(`Filtering out gig ${gig.id} (${gig.title}) due to pending conflict`)
            }

            return !hasConflict
          })

          console.log(`Filtered gigs: ${beforeFilter} -> ${result.length}`)
        }
      }

      return NextResponse.json({ gigs: result, hasNewColumns })
    }
  } catch (error) {
    console.error("Gigs fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch gigs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      brandId,
      title,
      description,
      location,
      start_datetime,
      start_date,
      end_date,
      duration_hours,
      pay_rate,
      total_ushers_needed,
      skills_required,
      is_recurring,
    } = body

    // Check if the new columns exist
    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gigs' AND column_name = 'start_date'
    `

    const hasNewColumns = columnsCheck.length > 0

    let result

    if (hasNewColumns) {
      // Create the full datetime by combining date and time if both are provided
      const fullDateTime = start_date && start_datetime ? `${start_date} ${start_datetime}:00` : start_datetime

      result = await sql`
        INSERT INTO gigs (
          brand_id, title, description, location, 
          datetime, start_date, end_date, 
          duration_hours, pay_rate, total_ushers_needed, 
          skills_required, is_recurring
        )
        VALUES (
          ${brandId}, ${title}, ${description}, ${location}, 
          ${fullDateTime}, ${start_date || null}, ${end_date || null}, 
          ${duration_hours}, ${pay_rate}, ${total_ushers_needed}, 
          ${skills_required || []}, ${is_recurring || false}
        )
        RETURNING *
      `
    } else {
      // Use old schema without the new columns
      // For old schema, we need to create a proper datetime from the inputs
      const fullDateTime = start_date && start_datetime ? `${start_date} ${start_datetime}:00` : start_datetime

      result = await sql`
        INSERT INTO gigs (
          brand_id, title, description, location, 
          datetime, duration_hours, pay_rate, 
          total_ushers_needed, skills_required
        )
        VALUES (
          ${brandId}, ${title}, ${description}, ${location}, 
          ${fullDateTime}, ${duration_hours}, ${pay_rate}, 
          ${total_ushers_needed}, ${skills_required || []}
        )
        RETURNING *
      `
    }

    return NextResponse.json({
      success: true,
      gig: result[0],
    })
  } catch (error) {
    console.error("Gig creation error:", error)
    return NextResponse.json({ error: "Failed to create gig" }, { status: 500 })
  }
}
