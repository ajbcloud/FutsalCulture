/**
 * Phone number formatting utilities for E.164 format
 * E.164 format: +[country code][number] e.g., +12345678912
 */

/**
 * Strip all non-numeric characters except leading +
 */
export function stripPhoneNumber(phone: string): string {
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Format a phone number to E.164 format (+12345678912)
 * Assumes US/Canada (+1) if no country code provided
 */
export function formatPhoneE164(input: string): string {
  if (!input) return '';
  
  // Strip to just digits
  const digits = input.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  
  // If starts with 1 and has 11 digits, it's a US number with country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If 10 digits, assume US/Canada and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If already has country code (starts with digit, more than 10 digits)
  if (digits.length > 10) {
    return `+${digits}`;
  }
  
  // Return as-is with + prefix for partial numbers
  return `+${digits}`;
}

/**
 * Format phone for display: +1 (234) 567-8912
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  
  // Get E.164 format first
  const e164 = formatPhoneE164(phone);
  if (!e164) return '';
  
  // Extract just the digits
  const digits = e164.replace(/\D/g, '');
  
  // Format US/Canada numbers (+1)
  if (digits.length === 11 && digits.startsWith('1')) {
    const areaCode = digits.slice(1, 4);
    const exchange = digits.slice(4, 7);
    const subscriber = digits.slice(7, 11);
    return `+1 (${areaCode}) ${exchange}-${subscriber}`;
  }
  
  // Format 10-digit numbers as US
  if (digits.length === 10) {
    const areaCode = digits.slice(0, 3);
    const exchange = digits.slice(3, 6);
    const subscriber = digits.slice(6, 10);
    return `+1 (${areaCode}) ${exchange}-${subscriber}`;
  }
  
  // Return E.164 format for other lengths
  return e164;
}

/**
 * Validate if a phone number is in valid E.164 format
 */
export function isValidE164(phone: string): boolean {
  if (!phone) return false;
  
  // E.164 format: + followed by 10-15 digits
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  
  const e164 = formatPhoneE164(phone);
  return e164Regex.test(e164);
}

/**
 * Format phone number as user types (for input masking)
 */
export function formatPhoneInput(input: string): string {
  // Strip to just digits
  const digits = input.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  
  // Format as user types
  if (digits.length <= 3) {
    return `(${digits}`;
  }
  
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  
  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // If more than 10 digits, include country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }
  
  // For other lengths, just show with + prefix
  return `+${digits}`;
}

/**
 * Get the raw digits from a formatted phone number
 */
export function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}
