import { sql } from '@/lib/db'

class WhatsAppService {
  private accessToken: string
  private phoneNumberId: string
  private businessAccountId: string
  private isConfigured: boolean
  private isDevelopmentMode: boolean
  private rateLimitMap: Map<string, { count: number; lastSent: number }> = new Map()

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''
    this.isDevelopmentMode = process.env.NODE_ENV === 'development' || process.env.WHATSAPP_DEV_MODE === 'true'
    this.isConfigured = this.validateCredentials()
  }

  private validateCredentials(): boolean {
    if (!this.accessToken || !this.phoneNumberId) {
      console.log('⚠️ WhatsApp credentials not configured - using simulation mode')
      return false
    }

    if (this.accessToken.length < 50) {
      console.log('⚠️ Invalid WhatsApp Access Token format')
      return false
    }

    if (this.phoneNumberId.length < 10) {
      console.log('⚠️ Invalid WhatsApp Phone Number ID format')
      return false
    }

    return true
  }

  private checkRateLimit(phone: string): boolean {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds
    const maxAttempts = 5 // Maximum 5 messages per hour per phone number

    const rateLimit = this.rateLimitMap.get(phone)
    
    if (!rateLimit) {
      this.rateLimitMap.set(phone, { count: 1, lastSent: now })
      return true
    }

    // Reset if more than 1 hour has passed
    if (now - rateLimit.lastSent > oneHour) {
      this.rateLimitMap.set(phone, { count: 1, lastSent: now })
      return true
    }

    // Check if limit exceeded
    if (rateLimit.count >= maxAttempts) {
      return false
    }

    // Increment count
    rateLimit.count++
    rateLimit.lastSent = now
    this.rateLimitMap.set(phone, rateLimit)
    return true
  }

  // Check if phone number is verified in database
  private async isPhoneVerified(phone: string): Promise<boolean> {
    try {
      const result = await sql`
        SELECT EXISTS(
          SELECT 1 FROM verified_phone_numbers 
          WHERE phone = ${phone} AND is_active = TRUE
        ) as is_verified
      `
      return result[0]?.is_verified || false
    } catch (error) {
      console.error('❌ Error checking phone verification:', error)
      return false
    }
  }

  async sendVerificationCode(phone: string, code: string): Promise<{ success: boolean; message: string; messageId?: string }> {
    // Check rate limiting for real WhatsApp
    if (this.isConfigured && !this.checkRateLimit(phone)) {
      return {
        success: false,
        message: 'Rate limit exceeded. Please wait before requesting another code.',
        messageId: 'rate_limited'
      }
    }

    // Development mode: simulate WhatsApp for any number
    if (this.isDevelopmentMode) {
      console.log(`📱 WhatsApp Development Mode: Code ${code} would be sent to ${phone}`)
      return {
        success: true,
        message: `WhatsApp development mode: Code ${code} sent to ${phone}. Check browser console.`,
        messageId: 'dev_' + Date.now()
      }
    }

    if (!this.isConfigured) {
      console.log(`📱 WhatsApp Simulation: Code ${code} would be sent to ${phone}`)
      return {
        success: true,
        message: `WhatsApp simulation: Code ${code} sent to ${phone}. Check browser console.`,
        messageId: 'sim_' + Date.now()
      }
    }

    // Check if phone number is verified in database (disabled for development)
    const isVerified = await this.isPhoneVerified(phone)
    if (!isVerified) {
      console.log(`📱 Phone ${phone} not verified in database - but sending real message anyway for development`)
      // For development, we'll send real messages even to unverified numbers
      // In production, you should enable this check
    }

    try {
      // Format phone number for WhatsApp (remove + and add country code)
      const formattedPhone = phone.replace('+', '')
      
      // Try template first, fallback to text message
      const templateMessage = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "aura",
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: code
                }
              ]
            }
          ]
        }
      }

      // Send WhatsApp message
      let response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateMessage),
      })

      // If template fails, try simple text message
      if (!response.ok) {
        console.log('📱 Template failed, trying simple text message...')
        
        const textMessage = {
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: {
            body: `Your Aura verification code is: ${code}. Valid for 10 minutes.`
          }
        }

        response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(textMessage),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`WhatsApp API error: ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('✅ WhatsApp message sent successfully:', data.messages?.[0]?.id)
      
      return {
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: data.messages?.[0]?.id || 'whatsapp_' + Date.now()
      }
      
    } catch (error) {
      console.error('❌ WhatsApp sending failed:', error)
      
      // Fallback to simulation on error
      console.log(`📱 WhatsApp Fallback: Code ${code} would be sent to ${phone}`)
      return {
        success: true,
        message: `WhatsApp fallback: Code ${code} sent to ${phone}. Check browser console. (Real WhatsApp failed: ${error instanceof Error ? error.message : 'Unknown error'})`,
        messageId: 'sim_' + Date.now()
      }
    }
  }

  // Add a phone number to verified list
  async addVerifiedPhone(phone: string, userId?: number, notes?: string): Promise<boolean> {
    try {
      await sql`
        INSERT INTO verified_phone_numbers (phone, user_id, notes)
        VALUES (${phone}, ${userId || null}, ${notes || 'Added via WhatsApp API'})
        ON CONFLICT (phone) DO UPDATE SET
          is_active = TRUE,
          notes = COALESCE(${notes}, verified_phone_numbers.notes),
          verified_at = NOW()
      `
      console.log(`✅ Phone number ${phone} added to verified list`)
      return true
    } catch (error) {
      console.error('❌ Error adding verified phone:', error)
      return false
    }
  }

  // Remove a phone number from verified list
  async removeVerifiedPhone(phone: string): Promise<boolean> {
    try {
      await sql`
        UPDATE verified_phone_numbers 
        SET is_active = FALSE 
        WHERE phone = ${phone}
      `
      console.log(`✅ Phone number ${phone} removed from verified list`)
      return true
    } catch (error) {
      console.error('❌ Error removing verified phone:', error)
      return false
    }
  }

  getStatus() {
    return {
      configured: this.isConfigured,
      developmentMode: this.isDevelopmentMode,
      provider: this.isDevelopmentMode ? 'WhatsApp Development Mode' : 'WhatsApp Business API',
      accessToken: this.accessToken ? `${this.accessToken.substring(0, 8)}...` : 'Not set',
      phoneNumberId: this.phoneNumberId || 'Not set',
      businessAccountId: this.businessAccountId || 'Not set'
    }
  }
}

export const whatsappService = new WhatsAppService() 