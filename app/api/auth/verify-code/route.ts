import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ 
        error: "Phone number and verification code are required" 
      }, { status: 400 })
    }

    // Check if verification_codes table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'verification_codes'
      )
    `

    if (!tableExists[0].exists) {
      return NextResponse.json({ 
        error: "Verification system not initialized. Please try sending a code first." 
      }, { status: 400 })
    }

    // Find the most recent valid verification code
    const verificationResult = await sql`
      SELECT id, code, expires_at, attempts, verified
      FROM verification_codes 
      WHERE phone = ${phone} 
      AND expires_at > NOW()
      AND verified = false
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (verificationResult.length === 0) {
      return NextResponse.json({ 
        error: "No valid verification code found. Please request a new code." 
      }, { status: 400 })
    }

    const verification = verificationResult[0]

    // Check if too many attempts
    if (verification.attempts >= 3) {
      return NextResponse.json({ 
        error: "Too many verification attempts. Please request a new code." 
      }, { status: 400 })
    }

    // Increment attempts
    await sql`
      UPDATE verification_codes 
      SET attempts = attempts + 1 
      WHERE id = ${verification.id}
    `

    // Check if code matches
    if (verification.code !== code) {
      return NextResponse.json({ 
        error: "Invalid verification code",
        attemptsLeft: 3 - (verification.attempts + 1)
      }, { status: 400 })
    }

    // Mark as verified
    await sql`
      UPDATE verification_codes 
      SET verified = true, verified_at = NOW()
      WHERE id = ${verification.id}
    `

    // Check if user exists
    const userResult = await sql`
      SELECT u.*, 
             CASE 
               WHEN u.role = 'usher' THEN json_build_object(
                 'skills', ush.skills,
                 'id_verified', ush.id_verified,
                 'vcash_number', ush.vcash_number,
                 'experience_years', ush.experience_years,
                 'rating', ush.rating,
                 'total_gigs_completed', ush.total_gigs_completed
               )
               WHEN u.role = 'brand' THEN json_build_object(
                 'company_name', b.company_name,
                 'industry', b.industry,
                 'wallet_balance', b.wallet_balance,
                 'contact_person', b.contact_person
               )
             END as profile
      FROM users u
      LEFT JOIN ushers ush ON u.id = ush.user_id AND u.role = 'usher'
      LEFT JOIN brands b ON u.id = b.user_id AND u.role = 'brand'
      WHERE u.phone = ${phone} AND u.is_active = true
    `

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
      user: userResult.length > 0 ? {
        id: userResult[0].id,
        phone: userResult[0].phone,
        name: userResult[0].name,
        email: userResult[0].email,
        role: userResult[0].role,
        language: userResult[0].language,
        profile: userResult[0].profile,
      } : null,
      isNewUser: userResult.length === 0,
    })

  } catch (error) {
    console.error("Verify code error:", error)
    return NextResponse.json({ 
      error: "Failed to verify code",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
