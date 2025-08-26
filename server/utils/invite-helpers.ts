import crypto from 'crypto';
import { db } from '../db';
import { tenants, inviteTokens, tenantMemberships } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a secure random invite code (8-12 characters, uppercase alphanumeric)
 * Avoids confusing characters like 0, O, 1, I, L
 */
export function generateInviteCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let result = '';
  const bytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
}

/**
 * Generate a secure random invite token (48+ characters)
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(36).toString('hex'); // 72 characters
}

/**
 * Lookup tenant by invite code
 */
export async function lookupTenantByCode(code: string) {
  const tenant = await db.select({
    id: tenants.id,
    name: tenants.name
  })
  .from(tenants)
  .where(eq(tenants.inviteCode, code.toUpperCase()))
  .limit(1);
  
  return tenant[0] || null;
}

/**
 * Check if user already has membership for tenant and role
 */
export async function checkExistingMembership(tenantId: string, userId: string, role: string) {
  const existing = await db.select()
    .from(tenantMemberships)
    .where(eq(tenantMemberships.tenantId, tenantId))
    .where(eq(tenantMemberships.userId, userId))
    .where(eq(tenantMemberships.role, role as any))
    .limit(1);
    
  return existing[0] || null;
}

/**
 * Create tenant membership
 */
export async function createTenantMembership(tenantId: string, userId: string, role: string) {
  const [membership] = await db.insert(tenantMemberships)
    .values({
      tenantId,
      userId,
      role: role as any,
      status: 'active'
    })
    .returning();
    
  return membership;
}

/**
 * Validate and consume invite token
 */
export async function validateAndConsumeToken(token: string) {
  // Find the token
  const inviteToken = await db.select()
    .from(inviteTokens)
    .where(eq(inviteTokens.token, token))
    .limit(1);
    
  if (!inviteToken[0]) {
    throw new Error('Invalid invite token');
  }
  
  const invite = inviteToken[0];
  
  // Check if already used
  if (invite.usedAt) {
    throw new Error('Invite token has already been used');
  }
  
  // Check if expired
  if (new Date() > new Date(invite.expiresAt)) {
    throw new Error('Invite token has expired');
  }
  
  // Mark as used
  await db.update(inviteTokens)
    .set({ usedAt: new Date() })
    .where(eq(inviteTokens.id, invite.id));
    
  return invite;
}