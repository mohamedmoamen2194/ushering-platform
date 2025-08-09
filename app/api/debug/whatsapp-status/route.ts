import { NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp-service'

export async function GET() {
  try {
    const status = whatsappService.getStatus()
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      status: status,
      recommendations: {
        configured: status.configured ? 'WhatsApp is configured and ready' : 'Add WhatsApp Business API credentials',
        action: status.configured ? 'WhatsApp service is ready to send messages' : 'Configure WhatsApp Business API for real messaging'
      },
      setup: {
        url: 'https://developers.facebook.com/',
        steps: [
          '1. Create Meta Developer account at developers.facebook.com',
          '2. Create WhatsApp Business app',
          '3. Get Access Token and Phone Number ID',
          '4. Create message template named "aura"',
          '5. Add WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID to .env.local'
        ],
        template: {
          name: 'aura',
          category: 'Authentication',
          content: 'Your Aura verification code is: {{1}}. Valid for 10 minutes.\n\nDo not share this code with anyone.'
        }
      },
      benefits: [
        'No trial limitations - send to any verified number',
        'Free tier: 1000 messages/month',
        'Higher delivery rates (99%+)',
        'Better user experience than SMS',
        'Professional business-grade platform'
      ]
    })

  } catch (error) {
    console.error('❌ Error checking WhatsApp status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check WhatsApp status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 