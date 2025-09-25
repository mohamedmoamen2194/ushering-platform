import { sql } from '@/lib/db'
import { whatsappService } from '@/lib/whatsapp-service'

export interface NotificationData {
  userId: number
  title: string
  message: string
  type: 'gig_alert' | 'application' | 'payment' | 'gig_message' | 'announcement' | 'rating' | 'system'
  referenceId?: string
  priority?: 'low' | 'medium' | 'high'
  sendWhatsApp?: boolean
  sendEmail?: boolean
}

export interface NotificationPreferences {
  whatsappEnabled: boolean
  emailEnabled: boolean
  pushEnabled: boolean
  gigUpdates: boolean
  paymentUpdates: boolean
  applicationUpdates: boolean
  chatMessages: boolean
  announcements: boolean
}

class NotificationService {
  
  /**
   * Send a notification to a user with multiple delivery methods
   */
  async sendNotification(data: NotificationData): Promise<{ success: boolean; message: string; notificationId?: number }> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(data.userId)
      
      // Get user details for WhatsApp
      const userResult = await sql`
        SELECT phone, name, language FROM users WHERE id = ${data.userId} AND is_active = true
      `
      
      if (userResult.length === 0) {
        return { success: false, message: 'User not found or inactive' }
      }
      
      const user = userResult[0]
      
      // Check if user wants this type of notification
      if (!this.shouldSendNotification(data.type, preferences)) {
        console.log(`📵 User ${data.userId} has disabled ${data.type} notifications`)
        return { success: true, message: 'Notification disabled by user preferences' }
      }
      
      // Store notification in database
      const notificationResult = await sql`
        INSERT INTO notifications (user_id, title, message, type, reference_id)
        VALUES (${data.userId}, ${data.title}, ${data.message}, ${data.type}, ${data.referenceId || null})
        RETURNING id
      `
      
      const notificationId = notificationResult[0].id
      
      // Send WhatsApp notification if enabled and requested
      if (preferences.whatsappEnabled && (data.sendWhatsApp !== false)) {
        await this.sendWhatsAppNotification(user.phone, data.title, data.message, user.language)
      }
      
      // TODO: Send email notification if enabled
      if (preferences.emailEnabled && data.sendEmail) {
        // Email service integration would go here
        console.log(`📧 Email notification would be sent to user ${data.userId}`)
      }
      
      return {
        success: true,
        message: 'Notification sent successfully',
        notificationId
      }
      
    } catch (error) {
      console.error('❌ Error sending notification:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Send notifications to multiple users
   */
  async sendBulkNotifications(notifications: NotificationData[]): Promise<{ success: boolean; results: any[] }> {
    const results = []
    
    for (const notification of notifications) {
      const result = await this.sendNotification(notification)
      results.push({
        userId: notification.userId,
        ...result
      })
    }
    
    const successCount = results.filter(r => r.success).length
    
    return {
      success: successCount > 0,
      results
    }
  }
  
  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: number): Promise<NotificationPreferences> {
    try {
      const result = await sql`
        SELECT * FROM notification_preferences WHERE user_id = ${userId}
      `
      
      if (result.length === 0) {
        // Create default preferences if they don't exist
        await sql`
          INSERT INTO notification_preferences (user_id)
          VALUES (${userId})
          ON CONFLICT (user_id) DO NOTHING
        `
        
        // Return default preferences
        return {
          whatsappEnabled: true,
          emailEnabled: false,
          pushEnabled: true,
          gigUpdates: true,
          paymentUpdates: true,
          applicationUpdates: true,
          chatMessages: true,
          announcements: true
        }
      }
      
      const prefs = result[0]
      return {
        whatsappEnabled: prefs.whatsapp_enabled,
        emailEnabled: prefs.email_enabled,
        pushEnabled: prefs.push_enabled,
        gigUpdates: prefs.gig_updates,
        paymentUpdates: prefs.payment_updates,
        applicationUpdates: prefs.application_updates,
        chatMessages: prefs.chat_messages,
        announcements: prefs.announcements
      }
      
    } catch (error) {
      console.error('❌ Error getting user preferences:', error)
      // Return default preferences on error
      return {
        whatsappEnabled: true,
        emailEnabled: false,
        pushEnabled: true,
        gigUpdates: true,
        paymentUpdates: true,
        applicationUpdates: true,
        chatMessages: true,
        announcements: true
      }
    }
  }
  
  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: number, preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      await sql`
        INSERT INTO notification_preferences (
          user_id, whatsapp_enabled, email_enabled, push_enabled,
          gig_updates, payment_updates, application_updates,
          chat_messages, announcements, updated_at
        )
        VALUES (
          ${userId}, 
          ${preferences.whatsappEnabled ?? true},
          ${preferences.emailEnabled ?? false},
          ${preferences.pushEnabled ?? true},
          ${preferences.gigUpdates ?? true},
          ${preferences.paymentUpdates ?? true},
          ${preferences.applicationUpdates ?? true},
          ${preferences.chatMessages ?? true},
          ${preferences.announcements ?? true},
          NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          whatsapp_enabled = EXCLUDED.whatsapp_enabled,
          email_enabled = EXCLUDED.email_enabled,
          push_enabled = EXCLUDED.push_enabled,
          gig_updates = EXCLUDED.gig_updates,
          payment_updates = EXCLUDED.payment_updates,
          application_updates = EXCLUDED.application_updates,
          chat_messages = EXCLUDED.chat_messages,
          announcements = EXCLUDED.announcements,
          updated_at = NOW()
      `
      
      return true
    } catch (error) {
      console.error('❌ Error updating user preferences:', error)
      return false
    }
  }
  
  /**
   * Check if notification should be sent based on type and preferences
   */
  private shouldSendNotification(type: string, preferences: NotificationPreferences): boolean {
    switch (type) {
      case 'gig_alert':
        return preferences.gigUpdates
      case 'application':
        return preferences.applicationUpdates
      case 'payment':
        return preferences.paymentUpdates
      case 'gig_message':
        return preferences.chatMessages
      case 'announcement':
        return preferences.announcements
      case 'rating':
        return preferences.gigUpdates
      case 'system':
        return true // System notifications are always sent
      default:
        return true
    }
  }
  
  /**
   * Send WhatsApp notification
   */
  private async sendWhatsAppNotification(phone: string, title: string, message: string, language: string = 'en'): Promise<void> {
    try {
      const whatsappMessage = `🔔 ${title}\n\n${message}\n\n${language === 'ar' ? 'منصة أورا' : 'Aura Platform'}`
      
      // For now, we'll use the verification code method to send general messages
      // In a production environment, you'd want to create specific WhatsApp templates
      const result = await whatsappService.sendVerificationCode(phone, whatsappMessage)
      
      if (result.success) {
        console.log(`✅ WhatsApp notification sent to ${phone}`)
      } else {
        console.log(`⚠️ WhatsApp notification failed for ${phone}: ${result.message}`)
      }
    } catch (error) {
      console.error('❌ Error sending WhatsApp notification:', error)
    }
  }
  
  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId: number, page: number = 1, limit: number = 20): Promise<{
    notifications: any[]
    total: number
    hasMore: boolean
  }> {
    try {
      const offset = (page - 1) * limit
      
      // Get notifications
      const notifications = await sql`
        SELECT id, title, message, type, reference_id, is_read, created_at
        FROM notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      
      // Get total count
      const countResult = await sql`
        SELECT COUNT(*) as total FROM notifications WHERE user_id = ${userId}
      `
      
      const total = parseInt(countResult[0].total)
      const hasMore = offset + notifications.length < total
      
      return {
        notifications,
        total,
        hasMore
      }
    } catch (error) {
      console.error('❌ Error getting user notifications:', error)
      return {
        notifications: [],
        total: 0,
        hasMore: false
      }
    }
  }
  
  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    try {
      await sql`
        UPDATE notifications 
        SET is_read = true 
        WHERE id = ${notificationId} AND user_id = ${userId}
      `
      return true
    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
      return false
    }
  }
  
  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number): Promise<boolean> {
    try {
      await sql`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = ${userId} AND is_read = false
      `
      return true
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error)
      return false
    }
  }
  
  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: number): Promise<number> {
    try {
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = ${userId} AND is_read = false
      `
      return parseInt(result[0].count)
    } catch (error) {
      console.error('❌ Error getting unread count:', error)
      return 0
    }
  }
}

export const notificationService = new NotificationService()

// Helper functions for common notification types
export const NotificationHelpers = {
  
  // Application notifications
  newApplication: (brandId: number, gigTitle: string, usherName: string): NotificationData => ({
    userId: brandId,
    title: 'New Application',
    message: `${usherName} has applied for your gig "${gigTitle}"`,
    type: 'application',
    priority: 'medium'
  }),
  
  applicationStatusChange: (usherId: number, gigTitle: string, status: string): NotificationData => ({
    userId: usherId,
    title: `Application ${status}`,
    message: `Your application for "${gigTitle}" has been ${status}`,
    type: 'application',
    priority: 'high'
  }),
  
  // Gig notifications
  gigAnnouncement: (userId: number, gigTitle: string, message: string): NotificationData => ({
    userId,
    title: `Announcement: ${gigTitle}`,
    message,
    type: 'announcement',
    priority: 'high'
  }),
  
  // Payment notifications
  paymentReceived: (userId: number, amount: number, gigTitle: string): NotificationData => ({
    userId,
    title: 'Payment Received',
    message: `You received ${amount} EGP for "${gigTitle}"`,
    type: 'payment',
    priority: 'high'
  }),
  
  // Rating notifications
  newRating: (userId: number, rating: number, gigTitle: string): NotificationData => ({
    userId,
    title: 'New Rating',
    message: `You received a ${rating}-star rating for "${gigTitle}"`,
    type: 'rating',
    priority: 'medium'
  })
}
