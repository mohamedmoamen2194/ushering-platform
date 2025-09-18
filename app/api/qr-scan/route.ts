export const dynamic = 'force-dynamic'
export const revalidate = 0

import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { qrCodeToken, usherId, action } = await request.json()

    if (!qrCodeToken || !usherId || !action) {
      return NextResponse.json({ 
        error: "QR code token, usher ID, and action are required" 
      }, { status: 400 })
    }

    if (!['check_in', 'check_out'].includes(action)) {
      return NextResponse.json({ 
        error: "Action must be either 'check_in' or 'check_out'" 
      }, { status: 400 })
    }

    // Verify QR code is valid and active (fetch only required fields)
    const qrResult = await sql`
      SELECT qcs.id, qcs.gig_id, qcs.expires_at, qcs.is_active,
             g.title, g.duration_hours, g.pay_rate
      FROM qr_code_sessions qcs
      JOIN gigs g ON qcs.gig_id = g.id
      WHERE qcs.qr_code_token = ${qrCodeToken}
      AND qcs.is_active = true
      AND qcs.expires_at > NOW()
    `

    if (qrResult.length === 0) {
      return NextResponse.json({ 
        error: "Invalid or expired QR code" 
      }, { status: 400 })
    }

    const qrCode = qrResult[0]

    // Verify usher is approved for this gig
    const applicationResult = await sql`
      SELECT id, status FROM applications 
      WHERE gig_id = ${qrCode.gig_id} 
      AND usher_id = ${usherId}
      AND status = 'approved'
    `

    if (applicationResult.length === 0) {
      return NextResponse.json({ 
        error: "You are not approved for this gig" 
      }, { status: 403 })
    }

    // Check if shift already exists
    let shiftResult = await sql`
      SELECT id, check_in_verified, check_out_verified, attendance_status
      FROM shifts 
      WHERE gig_id = ${qrCode.gig_id} 
      AND usher_id = ${usherId}
    `

    let shiftId: number

    if (shiftResult.length === 0) {
      // Create new shift for check-in
      if (action === 'check_out') {
        return NextResponse.json({ 
          error: "Cannot check out without checking in first" 
        }, { status: 400 })
      }

      const newShiftResult = await sql`
        INSERT INTO shifts (gig_id, usher_id, check_in_time, qr_code_used, check_in_verified, attendance_status)
        VALUES (${qrCode.gig_id}, ${usherId}, NOW(), ${qrCodeToken}, true, 'checked_in')
        RETURNING id
      `
      shiftId = newShiftResult[0].id
    } else {
      // Update existing shift
      const shift = shiftResult[0]
      shiftId = shift.id

      if (action === 'check_in' && shift.check_in_verified) {
        return NextResponse.json({ 
          error: "Already checked in for this gig" 
        }, { status: 400 })
      }

      if (action === 'check_out' && !shift.check_in_verified) {
        return NextResponse.json({ 
          error: "Must check in before checking out" 
        }, { status: 400 })
      }

      if (action === 'check_out' && shift.check_out_verified) {
        return NextResponse.json({ 
          error: "Already checked out for this gig" 
        }, { status: 400 })
      }

      // Update shift based on action
      if (action === 'check_in') {
        await sql`
          UPDATE shifts 
          SET check_in_time = NOW(), qr_code_used = ${qrCodeToken}, 
              check_in_verified = true, attendance_status = 'checked_in'
          WHERE id = ${shiftId}
        `
      } else if (action === 'check_out') {
        const checkInTime = await sql`
          SELECT check_in_time FROM shifts WHERE id = ${shiftId}
        `
        
        const hoursWorked = checkInTime[0]?.check_in_time 
          ? (Date.now() - new Date(checkInTime[0].check_in_time).getTime()) / (1000 * 60 * 60)
          : qrCode.duration_hours

        await sql`
          UPDATE shifts 
          SET check_out_time = NOW(), 
              hours_worked = ${Math.min(hoursWorked, qrCode.duration_hours)},
              payout_amount = ${Math.min(hoursWorked, qrCode.duration_hours) * qrCode.pay_rate},
              check_out_verified = true, 
              attendance_status = 'checked_out'
          WHERE id = ${shiftId}
        `
      }
    }

    // Add usher to scanned list (handle NULL array)
    await sql`
      UPDATE qr_code_sessions 
      SET scanned_by_ushers = array_append(COALESCE(scanned_by_ushers, ARRAY[]::int[]), ${usherId}::int)
      WHERE id = ${qrCode.id}
    `

    const res = NextResponse.json({
      success: true,
      message: `Successfully ${action === 'check_in' ? 'checked in' : 'checked out'} for ${qrCode.title}`,
      action: action,
      shiftId: shiftId,
      timestamp: new Date().toISOString()
    })
    res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res

  } catch (error) {
    console.error("QR scan error:", error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to process QR scan: ${message}` }, { status: 500 })
  }
} 