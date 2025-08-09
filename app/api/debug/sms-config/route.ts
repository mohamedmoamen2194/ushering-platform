import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER
    
    return NextResponse.json({
      success: true,
      config: {
        accountSid: accountSid ? `${accountSid.substring(0, 10)}...` : 'NOT SET',
        authToken: authToken ? `${authToken.substring(0, 10)}...` : 'NOT SET',
        phoneNumber: phoneNumber || 'NOT SET',
        isConfigured: !!(accountSid && authToken && phoneNumber),
        environment: process.env.NODE_ENV
      },
      message: !!(accountSid && authToken && phoneNumber) 
        ? "✅ Twilio is properly configured - real SMS should work!"
        : "❌ Twilio credentials missing - SMS will be simulated"
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to check SMS configuration"
    }, { status: 500 })
  }
}
