import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateVerificationCode, isValidPhoneNumber, formatPhoneNumber } from "@/lib/phone-utils"
import { whatsappService } from "@/lib/whatsapp-service"

export async function POST(request: NextRequest) {
  try {
    const { phone, method = 'whatsapp' } = await request.json()
    console.log("📱 Phone number received:", phone)
    
    if (!phone) {
      return NextResponse.json({ 
        success: false,
        error: "Phone number is required" 
      }, { status: 400 })
    }

    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid phone number format. Egyptian numbers: +201XXXXXXXXX or 01XXXXXXXXX. International: +1234567890" 
      }, { status: 400 })
    }

    // Format phone number to international format
    const formattedPhone = formatPhoneNumber(phone)
    console.log("📱 Formatted phone:", formattedPhone)

    // Generate verification code
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    console.log("🔑 Generated verification code (not logged for security)")

    try {
      // Check if verification_codes table exists and create if needed
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'verification_codes'
        )
      `

      if (!tableExists[0].exists) {
        console.log("🔨 Creating verification_codes table...")
        
        await sql`
          CREATE TABLE verification_codes (
            id SERIAL PRIMARY KEY,
            phone VARCHAR(15) NOT NULL,
            code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            verified BOOLEAN DEFAULT FALSE,
            attempts INT DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            verified_at TIMESTAMPTZ
          )
        `

        await sql`CREATE INDEX idx_verification_codes_phone ON verification_codes(phone)`
        await sql`CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at)`
        
        console.log("✅ verification_codes table created")
      }

      // Store verification code in database
      await sql`
        INSERT INTO verification_codes (phone, code, expires_at)
        VALUES (${formattedPhone}, ${code}, ${expiresAt})
      `

      console.log("✅ Code stored in database")
    } catch (dbError) {
      console.error("⚠️ Database error (continuing with WhatsApp):", dbError)
      // Continue with WhatsApp even if database fails
    }

    // Send WhatsApp message
    const result = await whatsappService.sendVerificationCode(formattedPhone, code)

    if (!result.success) {
      console.error("❌ WhatsApp sending failed:", result.message)
      return NextResponse.json({ 
        success: false,
        error: result.message || "Failed to send verification code"
      }, { status: 500 })
    }

    console.log("✅ WhatsApp message sent successfully, messageId:", result.messageId)

    // Return response
    const response: any = {
      success: true,
      message: `Verification code sent via ${method}`,
      messageId: result.messageId,
      phone: formattedPhone,
    }

    // Only include code if WhatsApp is simulated or in development mode (for development/testing)
    if (result.messageId?.startsWith('sim_') || result.messageId?.startsWith('dev_')) {
      response.code = code
      if (result.messageId?.startsWith('dev_')) {
        response.devNote = "WhatsApp development mode - working with any phone number"
      } else {
        response.devNote = "WhatsApp is simulated - add WhatsApp Business API credentials for real messages"
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Send code error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to send verification code",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
