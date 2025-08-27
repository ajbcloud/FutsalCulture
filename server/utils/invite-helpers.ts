import { randomBytes } from 'crypto';

/**
 * Generate a secure invite token
 * @param length - Length of the random bytes (default: 32)
 * @returns A base64 encoded token
 */
export function generateInviteToken(length: number = 32): string {
  const buffer = randomBytes(length);
  return buffer.toString('base64url'); // Use base64url for URL-safe tokens
}

/**
 * Generate a simple invite token with a type prefix
 * @param type - The type of invite (e.g., 'player', 'parent2', 'email')
 * @param id - The ID to encode in the token
 * @returns A base64 encoded token with type prefix
 */
export function generateTypedInviteToken(type: string, id: string): string {
  const data = `${type}:${id}:${Date.now()}`;
  return Buffer.from(data).toString('base64');
}

/**
 * Decode a typed invite token
 * @param token - The base64 encoded token
 * @returns Object with type, id, and timestamp or null if invalid
 */
export function decodeTypedInviteToken(token: string): { type: string; id: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    
    return {
      type: parts[0],
      id: parts[1],
      timestamp: parseInt(parts[2], 10)
    };
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired
 * @param token - The token to check
 * @param maxAgeMs - Maximum age in milliseconds (default: 7 days)
 * @returns True if expired, false if valid
 */
export function isTokenExpired(token: string, maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): boolean {
  const decoded = decodeTypedInviteToken(token);
  if (!decoded) return true;
  
  return Date.now() - decoded.timestamp > maxAgeMs;
}