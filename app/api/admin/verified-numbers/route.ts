import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp-service'
import { sql } from '@/lib/db'

// GET - List all verified phone numbers
export async function GET() {
  try {
    const verifiedNumbers = await sql`
      SELECT 
        vpn.id,
        vpn.phone,
        vpn.user_id,
        u.name as user_name,
        u.role as user_role,
        vpn.verified_by,
        vpn.verified_at,
        vpn.is_active,
        vpn.notes,
        vpn.created_at
      FROM verified_phone_numbers vpn
      LEFT JOIN users u ON vpn.user_id = u.id
      ORDER BY vpn.created_at DESC
    `

    return NextResponse.json({
      success: true,
      data: verifiedNumbers
    })
  } catch (error) {
    console.error('❌ Error fetching verified numbers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch verified numbers' },
      { status: 500 }
    )
  }
}

// POST - Add a new verified phone number
export async function POST(request: NextRequest) {
  try {
    const { phone, userId, notes } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const success = await whatsappService.addVerifiedPhone(phone, userId, notes)

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Phone number ${phone} added to verified list`
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to add phone number' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Error adding verified number:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add verified number' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a verified phone number
export async function DELETE(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const success = await whatsappService.removeVerifiedPhone(phone)

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Phone number ${phone} removed from verified list`
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to remove phone number' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Error removing verified number:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove verified number' },
      { status: 500 }
    )
  }
} 