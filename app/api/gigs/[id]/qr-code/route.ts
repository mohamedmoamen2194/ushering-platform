import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Generate QR code for a gig (brand only)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gigId = params.id
    const { brandId } = await request.json()

    if (!gigId || !brandId) {
      return NextResponse.json({ error: "Gig ID and Brand ID are required" }, { status: 400 })
    }

    // Verify the gig belongs to this brand
    const gigResult = await sql`
      SELECT id, start_datetime, duration_hours, status
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

    // Calculate QR code expiration (10 minutes after gig starts)
    const gigStartTime = new Date(gig.start_datetime)
    const qrExpiresAt = new Date(gigStartTime.getTime() + (10 * 60 * 1000)) // 10 minutes

    // Check if current time is within the valid window
    const now = new Date()
    if (now < gigStartTime || now > qrExpiresAt) {
      return NextResponse.json({ 
        error: "QR code can only be generated during the gig time window",
        gigStartTime: gigStartTime.toISOString(),
        qrExpiresAt: qrExpiresAt.toISOString(),
        currentTime: now.toISOString()
      }, { status: 400 })
    }

    // Generate new QR code session
    const qrResult = await sql`
      INSERT INTO qr_code_sessions (gig_id, qr_code_token, expires_at)
      VALUES (${gigId}, uuid_generate_v4(), ${qrExpiresAt})
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
        validUntil: qrExpiresAt
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
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')

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

    if (qrResult.length === 0) {
      return NextResponse.json({ error: "No active QR code found for this gig" }, { status: 404 })
    }

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
  } catch (error) {
    console.error("QR code fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch QR code" }, { status: 500 })
  }
} 