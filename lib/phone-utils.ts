// Phone number validation and formatting utilities

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Check if it starts with + (international format)
  if (cleaned.startsWith('+')) {
    // International format: +[country code][number]
    // Minimum length: +1 + 7 digits = 8 characters
    // Maximum length: +3 + 15 digits = 18 characters
    return cleaned.length >= 8 && cleaned.length <= 18
  }
  
  // Egyptian format: 01XXXXXXXXX (11 digits)
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return true
  }
  
  // Egyptian format: 1XXXXXXXXX (10 digits)
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    return true
  }
  
  return false
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // If already in international format, return as is
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  // Handle Egyptian numbers
  if (cleaned.startsWith('01')) {
    // 01XXXXXXXXX -> +201XXXXXXXXX
    return '+20' + cleaned.substring(1)
  }
  
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    // 1XXXXXXXXX -> +201XXXXXXXXX
    return '+20' + cleaned
  }
  
  // If it's a 10-digit number without country code, assume Egypt
  if (cleaned.length === 10) {
    return '+20' + cleaned
  }
  
  // If it's an 11-digit number starting with 0, assume Egypt
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return '+20' + cleaned.substring(1)
  }
  
  // For other cases, just add + prefix
  return '+' + cleaned
} 