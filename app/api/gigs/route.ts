import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Convert a local date/time in a given IANA time zone to a UTC ISO string
function toUtcFromZoned(datePart: string | null, timePart: string | null, timeZone: string): string {
  // Expect datePart as YYYY-MM-DD or null, timePart as HH:MM or full ISO without TZ or null
  // Build components
  let year: number, month: number, day: number, hour = 0, minute = 0, second = 0

  if (datePart) {
    const [y, m, d] = datePart.split("-").map(Number)
    year = y
    month = m
    day = d
  } else if (timePart && /^\d{4}-\d{2}-\d{2}T/.test(timePart)) {
    const d = new Date(timePart)
    year = d.getUTCFullYear()
    month = d.getUTCMonth() + 1
    day = d.getUTCDate()
  } else {
    throw new Error("Invalid date/time input: missing date")
  }

  if (timePart) {
    if (/^\d{2}:\d{2}$/.test(timePart)) {
      const [h, mm] = timePart.split(":").map(Number)
      hour = h
      minute = mm
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(timePart)) {
      const d = new Date(timePart)
      hour = d.getHours()
      minute = d.getMinutes()
      second = d.getSeconds()
    }
  }

  // Create a naive UTC date for the given components
  const naiveUtc = new Date(Date.UTC(year!, month! - 1, day!, hour, minute, second))

  // Compute the timezone offset at that instant using Intl
  const locale = naiveUtc.toLocaleString("en-US", { timeZone })
  const zoned = new Date(locale)
  const offsetMinutes = (zoned.getTime() - naiveUtc.getTime()) / 60000

  // Adjust the naive UTC by subtracting the offset to get true UTC instant for the zoned wall time
  const trueUtc = new Date(naiveUtc.getTime() - offsetMinutes * 60000)
  return trueUtc.toISOString()
}

export async function GET(request: NextRequest) {
  try {
    const location = request.nextUrl.searchParams.get("location")
    const role = request.nextUrl.searchParams.get("role")
    const userId = request.nextUrl.searchParams.get("userId")

    console.log("🔄 Fetching fresh gigs from database for userId:", userId, "role:", role)

    // Check if the new columns exist
    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gigs' AND column_name IN ('start_date', 'end_date', 'is_recurring')
    `

    const hasNewColumns = columnsCheck.length > 0
    console.log("📋 Has new columns:", hasNewColumns)

    if (role === "brand" && userId) {
      // Get gigs created by this brand
      const result = await sql`
        SELECT g.*, 
               (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'approved') as approved_ushers,
               (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'pending') as pending_applications,
               to_char((g.start_datetime AT TIME ZONE 'Africa/Cairo'), 'HH24:MI') as start_time_24h,
               to_char((g.start_datetime AT TIME ZONE 'Africa/Cairo'), 'YYYY-MM-DD') as start_date_display
        FROM gigs g
        WHERE g.brand_id = ${userId}
        ORDER BY g.start_datetime DESC
      `
      
      console.log("✅ Brand gigs fetched:", result.length, "gigs")
      
      const response = NextResponse.json({ gigs: result })
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    } else {
      // Get available gigs for ushers - SIMPLIFIED LOGIC
      let gigQuery

      if (userId) {
        // Only hide gigs where user has APPROVED applications
        gigQuery = sql`
          SELECT g.*, u.name as brand_name, b.company_name, u.email as brand_email,
                 (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'approved') as approved_ushers,
                 (SELECT status FROM applications a WHERE a.gig_id = g.id AND a.usher_id = ${userId} ORDER BY a.applied_at DESC LIMIT 1) as application_status,
                 to_char((g.start_datetime AT TIME ZONE 'Africa/Cairo'), 'HH24:MI') as start_time_24h,
                 to_char((g.start_datetime AT TIME ZONE 'Africa/Cairo'), 'YYYY-MM-DD') as start_date_display
          FROM gigs g
          JOIN users u ON g.brand_id = u.id
          JOIN brands b ON u.id = b.user_id
          WHERE g.status = 'active' 
          AND g.start_datetime > NOW()
          ${location ? sql`AND g.location ILIKE ${`%${location}%`}` : sql``}
          AND NOT EXISTS (
            SELECT 1 FROM applications a 
            WHERE a.gig_id = g.id 
            AND a.usher_id = ${userId} 
            AND a.status = 'approved'
          )
          ORDER BY g.start_datetime ASC
        `
      } else {
        // No user ID provided
        gigQuery = sql`
          SELECT g.*, u.name as brand_name, b.company_name,
                 (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'approved') as approved_ushers,
                 NULL as application_status,
                 to_char((g.start_datetime AT TIME ZONE 'Africa/Cairo'), 'HH24:MI') as start_time_24h,
                 to_char((g.start_datetime AT TIME ZONE 'Africa/Cairo'), 'YYYY-MM-DD') as start_date_display
          FROM gigs g
          JOIN users u ON g.brand_id = u.id
          JOIN brands b ON u.id = b.user_id
          WHERE g.status = 'active' 
          AND g.start_datetime > NOW()
          ${location ? sql`AND g.location ILIKE ${`%${location}%`}` : sql``}
          ORDER BY g.start_datetime ASC
        `
      }

      let result = await gigQuery
      console.log("✅ Available gigs fetched:", result.length, "gigs")

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

        console.log("📝 User pending applications:", pendingApps.length)

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
              console.log(`🚫 Filtering out gig ${gig.id} (${gig.title}) due to pending conflict`)
            }

            return !hasConflict
          })

          console.log(`🔍 Filtered gigs: ${beforeFilter} -> ${result.length}`)
        }
      }

      const response = NextResponse.json({ gigs: result, hasNewColumns })
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }
  } catch (error) {
    console.error("❌ Gigs fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch gigs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
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

    // Get brand ID from the request body (this should be automatically set by the frontend)
    const brandId = body.brand_id

    if (!brandId) {
      return NextResponse.json({ 
        error: "Brand ID is required. Please ensure you are logged in as a brand." 
      }, { status: 400 })
    }

    // Verify the user is actually a brand
    const userCheck = await sql`
      SELECT id, role FROM users WHERE id = ${brandId}
    `

    if (userCheck.length === 0) {
      return NextResponse.json({ 
        error: "User not found" 
      }, { status: 404 })
    }

    if (userCheck[0].role !== 'brand') {
      return NextResponse.json({ 
        error: "Only brands can create gigs" 
      }, { status: 403 })
    }

    // Validate required fields
    if (!title || !location || !duration_hours || !pay_rate || !total_ushers_needed) {
      return NextResponse.json({ 
        error: "Missing required fields: title, location, duration_hours, pay_rate, total_ushers_needed" 
      }, { status: 400 })
    }

    // Check if the new columns exist
    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gigs' AND column_name = 'start_date'
    `

    const hasNewColumns = columnsCheck.length > 0

    let result

    if (hasNewColumns) {
      // Compose start_datetime on the DB using Africa/Cairo via make_timestamptz
      if (!start_date && !start_datetime) {
        return NextResponse.json({ 
          error: "Either start_date or start_datetime must be provided" 
        }, { status: 400 })
      }

      const startDatePart: string | null = start_date || null
      const timePartRaw: string | null = start_datetime || null

      if (!startDatePart && timePartRaw) {
        return NextResponse.json({ 
          error: "start_date is required when only time is provided" 
        }, { status: 400 })
      }

      // Parse components for make_timestamptz
      const [yy, mm, dd] = (startDatePart || "").split("-").map(Number)

      // Accept either HH:MM or an ISO-like string
      let hh = 0, mi = 0
      if (timePartRaw) {
        if (/^\d{2}:\d{2}$/.test(timePartRaw)) {
          const [h, m] = timePartRaw.split(":").map(Number)
          hh = h; mi = m
        } else {
          const parsed = new Date(timePartRaw)
          if (isNaN(parsed.getTime())) {
            return NextResponse.json({ error: "Invalid start_datetime format" }, { status: 400 })
          }
          // Interpret provided time as wall time in Cairo by extracting local clock parts in Cairo
          const cairoFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false })
          const parts = cairoFmt.formatToParts(parsed)
          const hourStr = parts.find(p => p.type === 'hour')?.value || "00"
          const minStr = parts.find(p => p.type === 'minute')?.value || "00"
          hh = parseInt(hourStr, 10)
          mi = parseInt(minStr, 10)
        }
      }

      // Basic validation
      if (!yy || !mm || !dd || hh < 0 || hh > 23 || mi < 0 || mi > 59) {
        return NextResponse.json({ error: "Invalid start date/time components" }, { status: 400 })
      }

      const startDateTimeExpr = sql`make_timestamptz(${yy}, ${mm}, ${dd}, ${hh}, ${mi}, 0, 'Africa/Cairo')`

      result = await sql`
        INSERT INTO gigs (
          brand_id, title, description, location, 
          start_datetime, start_date, end_date,
          duration_hours, pay_rate, total_ushers_needed, 
          skills_required, is_recurring
        )
        VALUES (
          ${brandId}, ${title}, ${description}, ${location}, 
          ${startDateTimeExpr}, ${start_date || null}, ${end_date || null}, 
          ${duration_hours}, ${pay_rate}, ${total_ushers_needed}, 
          ${skills_required || []}, ${is_recurring || false}
        )
        RETURNING *
      `
    } else {
      // Old schema: compute start_datetime in DB with Africa/Cairo via make_timestamptz
      if (!start_date && !start_datetime) {
        return NextResponse.json({ 
          error: "Either start_date or start_datetime must be provided" 
        }, { status: 400 })
      }

      const startDatePart: string | null = start_date || null
      const timePart: string | null = start_datetime || null

      if (!startDatePart && timePart) {
        return NextResponse.json({ 
          error: "start_date is required when only time is provided" 
        }, { status: 400 })
      }

      const [yy, mm, dd] = (startDatePart || "").split("-").map(Number)
      const [hh, mi] = (timePart || "09:00").split(":").map(Number)

      const startDateTimeExpr = sql`make_timestamptz(${yy}, ${mm}, ${dd}, ${hh}, ${mi}, 0, 'Africa/Cairo')`

      result = await sql`
        INSERT INTO gigs (
          brand_id, title, description, location, 
          start_datetime, duration_hours, pay_rate, 
          total_ushers_needed, skills_required
        )
        VALUES (
          ${brandId}, ${title}, ${description}, ${location}, 
          ${startDateTimeExpr}, ${duration_hours}, ${pay_rate}, 
          ${total_ushers_needed}, ${skills_required || []}
        )
        RETURNING *
      `
    }

    console.log("✅ Gig created successfully for brand:", brandId, "Gig:", result[0])

    return NextResponse.json({
      success: true,
      gig: result[0],
    })
  } catch (error) {
    console.error("Gig creation error:", error)
    return NextResponse.json({ 
      error: "Failed to create gig",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
