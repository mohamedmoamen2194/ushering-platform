import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Convert a local date/time in a given IANA time zone to a UTC ISO string
function toUtcFromZoned(datePart: string, timePart: string, timeZone: string): string {
  const [y, m, d] = datePart.split("-").map(Number)
  const [hh, mm] = timePart.split(":").map(Number)
  const naiveUtc = new Date(Date.UTC(y, m - 1, d, hh, mm, 0))
  const locale = naiveUtc.toLocaleString("en-US", { timeZone })
  const zoned = new Date(locale)
  const offsetMinutes = (zoned.getTime() - naiveUtc.getTime()) / 60000
  const trueUtc = new Date(naiveUtc.getTime() - offsetMinutes * 60000)
  return trueUtc.toISOString()
}

// Format now as Cairo local date (YYYY-MM-DD)
function getTodayCairoDate(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" })
  return formatter.format(now) // YYYY-MM-DD
}

// Extract Cairo start time HH:MM from a UTC datetime
function getGigStartTimeCairoHHMM(startDatetimeUtc: string): string {
  return new Date(startDatetimeUtc).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Cairo" })
}

// Generate QR code for a gig (brand only)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gigId = params.id
    const { brandId } = await request.json()

    if (!gigId || !brandId) {
      return NextResponse.json({ error: "Gig ID and Brand ID are required" }, { status: 400 })
    }

    // Verify the gig belongs to this brand and fetch date range
    const gigResult = await sql`
      SELECT id, start_datetime, start_date, end_date, duration_hours, status
      FROM gigs 
      WHERE id = ${gigId} AND brand_id = ${brandId}
    `

    if (gigResult.length === 0) {
      return NextResponse.json({ error: "Gig not found or access denied" }, { status: 404 })
    }

    const gig = gigResult[0]

    if (gig.status !== 'active') {
      return NextResponse.json({ error: "Can only generate QR codes for active gigs" }, { status: 400 })
    }

    // Determine today's Cairo window
    const todayCairo = getTodayCairoDate() // YYYY-MM-DD in Cairo
    const startHHMM = getGigStartTimeCairoHHMM(gig.start_datetime)

    // If date range exists, ensure today is within [start_date, end_date]
    if (gig.start_date && gig.end_date) {
      if (todayCairo < gig.start_date || todayCairo > gig.end_date) {
        return NextResponse.json({ 
          error: "QR code can only be generated during the gig time window",
          reason: "outside_date_range",
          todayCairo, start_date: gig.start_date, end_date: gig.end_date
        }, { status: 400 })
      }
    }

    // Compute today's start window in UTC from Cairo local
    const [yy, mm, dd] = todayCairo.split("-").map(Number)
    const [hh, mi] = startHHMM.split(":").map(Number)
    const windowRow = await sql`SELECT make_timestamptz(${yy}, ${mm}, ${dd}, ${hh}, ${mi}, 0, 'Africa/Cairo') AS window_start`
    const windowStart = new Date(windowRow[0].window_start)
    const windowEnd = new Date(windowStart.getTime() + 10 * 60 * 1000)

    const now = new Date()
    if (now < windowStart || now > windowEnd) {
      return NextResponse.json({
        error: "QR code can only be generated during the gig time window",
        reason: "outside_time_window",
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
        currentTime: now.toISOString(),
        storedStartUtc: gig.start_datetime,
        gigStartCairoHHMM: startHHMM
      }, { status: 400 })
    }

    // Generate new QR code session expiring at window end
    const qrResult = await sql`
      INSERT INTO qr_code_sessions (gig_id, qr_code_token, expires_at)
      VALUES (${gigId}, uuid_generate_v4(), ${windowEnd.toISOString()})
      RETURNING id, qr_code_token, expires_at
    `

    const qrSession = qrResult[0]

    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrSession.id,
        token: qrSession.qr_code_token,
        expiresAt: qrSession.expires_at,
        gigId: gigId,
        validFrom: windowStart.toISOString(),
        validUntil: windowEnd.toISOString()
      }
    })
  } catch (error) {
    console.error("QR code generation error:", error)
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}

// Get active QR code for a gig
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gigId = params.id
    const brandId = request.nextUrl.searchParams.get('brandId')

    if (!gigId || !brandId) {
      return NextResponse.json({ error: "Gig ID and Brand ID are required" }, { status: 400 })
    }

    // Get active QR code for this gig
    const qrResult = await sql`
      SELECT qcs.id, qcs.qr_code_token, qcs.expires_at, qcs.is_active,
             g.title, g.start_datetime, g.duration_hours
      FROM qr_code_sessions qcs
      JOIN gigs g ON qcs.gig_id = g.id
      WHERE qcs.gig_id = ${gigId} 
      AND g.brand_id = ${brandId}
      AND qcs.is_active = true
      AND qcs.expires_at > NOW()
      ORDER BY qcs.created_at DESC
      LIMIT 1
    `

    if (qrResult.length > 0) {
      const qrCode = qrResult[0]
      return NextResponse.json({
        success: true,
        qrCode: {
          id: qrCode.id,
          token: qrCode.qr_code_token,
          expiresAt: qrCode.expires_at,
          isActive: qrCode.is_active,
          gigTitle: qrCode.title,
          gigStartTime: qrCode.start_datetime,
          durationHours: qrCode.duration_hours
        }
      })
    }

    // No active QR: attempt auto-generation if within the allowed time window
    const gigRows = await sql`
      SELECT id, brand_id, title, start_datetime, start_date, end_date, duration_hours, status
      FROM gigs
      WHERE id = ${gigId} AND brand_id = ${brandId}
      LIMIT 1
    `

    if (gigRows.length === 0) {
      return NextResponse.json({ error: "Gig not found or access denied" }, { status: 404 })
    }

    const gig = gigRows[0]
    if (gig.status !== 'active') {
      return NextResponse.json({ error: "Gig is not active" }, { status: 400 })
    }

    const todayCairo = getTodayCairoDate()
    const startHHMM = getGigStartTimeCairoHHMM(gig.start_datetime)

    if (gig.start_date && gig.end_date) {
      if (todayCairo < gig.start_date || todayCairo > gig.end_date) {
        return NextResponse.json({ error: "No active QR code found for this gig" }, { status: 404 })
      }
    }

    const windowStartUtcISO = toUtcFromZoned(todayCairo, startHHMM, 'Africa/Cairo')
    const [yy2, mm2, dd2] = todayCairo.split("-").map(Number)
    const [hh2, mi2] = startHHMM.split(":").map(Number)
    const windowRow2 = await sql`SELECT make_timestamptz(${yy2}, ${mm2}, ${dd2}, ${hh2}, ${mi2}, 0, 'Africa/Cairo') AS window_start`
    const windowStart = new Date(windowRow2[0].window_start)
    const windowEnd = new Date(windowStart.getTime() + 10 * 60 * 1000)

    const now = new Date()
    if (now < windowStart || now > windowEnd) {
      return NextResponse.json({ error: "No active QR code found for this gig" }, { status: 404 })
    }

    // Auto-create QR since we're within the window
    const insertResult = await sql`
      INSERT INTO qr_code_sessions (gig_id, qr_code_token, expires_at)
      VALUES (${gigId}, uuid_generate_v4(), ${windowEnd.toISOString()})
      RETURNING id, qr_code_token, expires_at
    `

    const newQr = insertResult[0]
    return NextResponse.json({
      success: true,
      qrCode: {
        id: newQr.id,
        token: newQr.qr_code_token,
        expiresAt: newQr.expires_at,
        isActive: true,
        gigTitle: gig.title,
        gigStartTime: gig.start_datetime,
        durationHours: gig.duration_hours,
        validFrom: windowStart.toISOString(),
        validUntil: windowEnd.toISOString()
      }
    })
  } catch (error) {
    console.error("QR code fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch QR code" }, { status: 500 })
  }
} 