import bcrypt from 'bcryptjs'

// Password hashing and verification utilities
export class PasswordUtils {
  // Hash a password with salt rounds
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  // Verify a password against a hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  // Generate a random password (for development/testing)
  static generateRandomPassword(length: number = 8): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  // Check password strength
  static checkPasswordStrength(password: string): {
    score: number
    feedback: string[]
    isStrong: boolean
  } {
    const feedback: string[] = []
    let score = 0

    // Length check
    if (password.length >= 8) score += 1
    else feedback.push('Password should be at least 8 characters long')

    // Contains lowercase
    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Password should contain lowercase letters')

    // Contains uppercase
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Password should contain uppercase letters')

    // Contains numbers
    if (/\d/.test(password)) score += 1
    else feedback.push('Password should contain numbers')

    // Contains special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
    else feedback.push('Password should contain special characters')

    return {
      score,
      feedback,
      isStrong: score >= 4
    }
  }
} 