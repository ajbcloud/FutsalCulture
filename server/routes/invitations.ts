import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { 
  inviteTokens, 
  tenants, 
  users, 
  players, 
  tenantMemberships
} from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAdmin } from '../admin-routes';
import { isAuthenticated as requireAuth } from '../auth';
import { 
  generateInviteCode, 
  generateInviteToken, 
  lookupTenantByCode, 
  checkExistingMembership,
  createTenantMembership,
  validateAndConsumeToken
} from '../utils/invite-helpers';
import { sendInvitationEmail, sendWelcomeEmail } from '../utils/email-service';

const router = Router();

// Validation schemas
const inviteUserSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['parent', 'player']),
  playerId: z.string().uuid().optional(), // For player-specific invites
  birthdate: z.string().optional(), // For player creation
});

const acceptInviteSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const addMembershipSchema = z.object({
  code: z.string().min(4),
  scope: z.enum(['parent', 'player']).default('parent'),
  playerId: z.string().uuid().optional(),
});

/**
 * POST /api/admin/invitations
 * Create invitation for parent or player
 */
router.post('/admin/invitations', requireAdmin, async (req, res) => {
  try {
    const adminUserId = (req as any).currentUser?.id;
    const adminTenantId = (req as any).currentUser?.tenantId || (req as any).currentUser?.tenant_id;
    
    const data = inviteUserSchema.parse(req.body);
    
    // Verify admin can invite to this tenant
    if (data.tenantId !== adminTenantId) {
      return res.status(403).json({ error: 'Cannot invite to different tenant' });
    }
    
    // Check if email is already registered
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    
    let userId = null;
    let playerId = null;
    
    // Create user record if email is new
    if (!existingUser[0]) {
      const [newUser] = await db.insert(users)
        .values({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          tenantId: data.tenantId,
          isApproved: false,
          registrationStatus: 'pending',
        })
        .returning();
      userId = newUser.id;
    } else {
      userId = existingUser[0].id;
    }
    
    // If inviting a player, create player record
    if (data.role === 'player') {
      const birthYear = data.birthdate ? new Date(data.birthdate).getFullYear() : 2010;
      const age = new Date().getFullYear() - birthYear;
      
      const [newPlayer] = await db.insert(players)
        .values({
          tenantId: data.tenantId,
          firstName: data.firstName,
          lastName: data.lastName,
          birthYear,
          dateOfBirth: data.birthdate,
          gender: 'boys', // Default, can be updated later
          parentId: adminUserId, // Temporary, will be updated when parent accepts
          userId: age >= 13 ? userId : null, // Only link if 13+
        })
        .returning();
      playerId = newPlayer.id;
    }
    
    // Generate invite token
    const token = generateInviteToken();
    
    // Create invite token record
    const [inviteToken] = await db.insert(inviteTokens)
      .values({
        token,
        tenantId: data.tenantId,
        invitedEmail: data.email,
        role: data.role as any,
        playerId,
        purpose: 'signup_welcome',
        createdBy: adminUserId,
      })
      .returning();
    
    // Send invitation email
    const inviteUrl = `${process.env.APP_URL || 'http://localhost:5000'}/accept-invite?token=${token}`;
    
    try {
      // Get tenant and admin info for email
      const tenantInfo = await db.select({ name: tenants.name })
        .from(tenants)
        .where(eq(tenants.id, data.tenantId))
        .limit(1);
      
      const adminInfo = await db.select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, adminUserId))
        .limit(1);
      
      if (tenantInfo[0] && adminInfo[0]) {
        await sendInvitationEmail({
          to: data.email,
          tenantName: tenantInfo[0].name,
          recipientName: data.firstName,
          senderName: `${adminInfo[0].firstName} ${adminInfo[0].lastName}`,
          role: data.role,
          inviteUrl,
          expiresAt: inviteToken.expiresAt,
        });
      }
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue without failing the entire request
    }
    
    res.status(201).json({
      message: 'Invitation created successfully',
      inviteId: inviteToken.id,
      inviteUrl, // For testing purposes
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

/**
 * GET /api/admin/tenant/invite-code
 * Get current tenant's invite code (admin only)
 */
router.get('/admin/tenant/invite-code', requireAdmin, async (req, res) => {
  try {
    const adminTenantId = (req as any).currentUser?.tenantId || (req as any).currentUser?.tenant_id;
    
    if (!adminTenantId) {
      console.error('Missing tenant ID for user:', (req as any).currentUser);
      return res.status(403).json({ error: 'Admin tenant ID required' });
    }
    
    // Get current tenant invite code
    const tenantResult = await db.select({
      inviteCode: tenants.inviteCode,
      inviteCodeUpdatedAt: tenants.inviteCodeUpdatedAt,
      inviteCodeUpdatedBy: tenants.inviteCodeUpdatedBy,
    })
    .from(tenants)
    .where(eq(tenants.id, adminTenantId))
    .limit(1);
    
    if (!tenantResult[0]) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const tenant = tenantResult[0];
    
    // If no invite code exists, generate one
    if (!tenant.inviteCode) {
      const newCode = generateInviteCode(Math.floor(Math.random() * 5) + 8); // 8-12 chars
      const adminUserId = (req as any).currentUser?.id;
      
      await db.update(tenants)
        .set({
          inviteCode: newCode,
          inviteCodeUpdatedAt: new Date(),
          inviteCodeUpdatedBy: adminUserId,
        })
        .where(eq(tenants.id, adminTenantId));
      
      return res.json({
        inviteCode: newCode,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
      });
    }
    
    // Get updater name if available
    let updatedBy = 'system';
    if (tenant.inviteCodeUpdatedBy) {
      const updaterResult = await db.select({
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, tenant.inviteCodeUpdatedBy))
      .limit(1);
      
      if (updaterResult[0]) {
        updatedBy = `${updaterResult[0].firstName} ${updaterResult[0].lastName}`;
      }
    }
    
    res.json({
      inviteCode: tenant.inviteCode,
      updatedAt: tenant.inviteCodeUpdatedAt?.toISOString(),
      updatedBy,
    });
  } catch (error) {
    console.error('Error fetching invite code:', error);
    res.status(500).json({ error: 'Failed to fetch invite code' });
  }
});

/**
 * POST /api/admin/tenants/current/rotate-invite-code
 * Rotate current tenant's invite code (admin only) - matches frontend expectation
 */
router.post('/admin/tenants/current/rotate-invite-code', requireAdmin, async (req, res) => {
  try {
    const adminUserId = (req as any).currentUser?.id;
    const adminTenantId = (req as any).currentUser?.tenantId || (req as any).currentUser?.tenant_id;
    
    if (!adminTenantId) {
      return res.status(403).json({ error: 'Admin tenant ID required' });
    }
    
    // Generate new invite code
    const newCode = generateInviteCode(Math.floor(Math.random() * 5) + 8); // 8-12 chars
    
    // Update tenant
    const [updatedTenant] = await db.update(tenants)
      .set({
        inviteCode: newCode,
        inviteCodeUpdatedAt: new Date(),
        inviteCodeUpdatedBy: adminUserId,
      })
      .where(eq(tenants.id, adminTenantId))
      .returning();
    
    res.json({
      message: 'Invite code rotated successfully',
      inviteCode: newCode,
    });
  } catch (error) {
    console.error('Error rotating invite code:', error);
    res.status(500).json({ error: 'Failed to rotate invite code' });
  }
});

/**
 * POST /api/admin/tenants/:tenantId/rotate-invite-code
 * Rotate tenant invite code (admin only) - legacy endpoint
 */
router.post('/admin/tenants/:tenantId/rotate-invite-code', requireAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const adminUserId = (req as any).currentUser?.id;
    const adminTenantId = (req as any).currentUser?.tenantId || (req as any).currentUser?.tenant_id;
    
    // Verify admin can manage this tenant
    if (tenantId !== adminTenantId) {
      return res.status(403).json({ error: 'Cannot manage different tenant' });
    }
    
    // Generate new invite code
    const newCode = generateInviteCode(Math.floor(Math.random() * 5) + 8); // 8-12 chars
    
    // Update tenant
    const [updatedTenant] = await db.update(tenants)
      .set({
        inviteCode: newCode,
        inviteCodeUpdatedAt: new Date(),
        inviteCodeUpdatedBy: adminUserId,
      })
      .where(eq(tenants.id, tenantId))
      .returning();
    
    res.json({
      message: 'Invite code rotated successfully',
      inviteCode: newCode,
    });
  } catch (error) {
    console.error('Error rotating invite code:', error);
    res.status(500).json({ error: 'Failed to rotate invite code' });
  }
});

/**
 * GET /api/admin/invitations
 * Get all invitations for current tenant (admin only)
 */
router.get('/admin/invitations', requireAdmin, async (req, res) => {
  try {
    const adminTenantId = (req as any).currentUser?.tenantId || (req as any).currentUser?.tenant_id;
    
    if (!adminTenantId) {
      console.error('Missing tenant ID for user:', (req as any).currentUser);
      return res.status(403).json({ error: 'Admin tenant ID required' });
    }
    
    // Get all invitations for this tenant
    const invitations = await db.select({
      id: inviteTokens.id,
      email: inviteTokens.invitedEmail,
      firstName: users.firstName,
      lastName: users.lastName,
      role: inviteTokens.role,
      status: sql<string>`
        CASE 
          WHEN ${inviteTokens.usedAt} IS NOT NULL THEN 'accepted'
          WHEN ${inviteTokens.expiresAt} < NOW() THEN 'expired'
          ELSE 'pending'
        END
      `.as('status'),
      createdAt: inviteTokens.createdAt,
      expiresAt: inviteTokens.expiresAt,
      usedAt: inviteTokens.usedAt,
    })
    .from(inviteTokens)
    .leftJoin(users, eq(users.email, inviteTokens.invitedEmail))
    .where(eq(inviteTokens.tenantId, adminTenantId))
    .orderBy(sql`${inviteTokens.createdAt} DESC`);
    
    // Format response to match frontend interface
    const formattedInvitations = invitations.map(invite => ({
      id: invite.id,
      email: invite.email,
      firstName: invite.firstName || invite.email.split('@')[0], // Fallback name
      lastName: invite.lastName || '',
      role: invite.role,
      status: invite.status,
      createdAt: invite.createdAt?.toISOString(),
      expiresAt: invite.expiresAt?.toISOString(),
      usedAt: invite.usedAt?.toISOString(),
    }));
    
    res.json(formattedInvitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

/**
 * GET /api/invitations/validate/:token
 * Validate invitation token and return invite details (public)
 */
router.get('/invitations/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find the token
    const inviteToken = await db.select({
      id: inviteTokens.id,
      tenantId: inviteTokens.tenantId,
      invitedEmail: inviteTokens.invitedEmail,
      role: inviteTokens.role,
      expiresAt: inviteTokens.expiresAt,
      usedAt: inviteTokens.usedAt,
    })
    .from(inviteTokens)
    .where(eq(inviteTokens.token, token))
    .limit(1);
    
    if (!inviteToken[0]) {
      return res.status(404).json({ error: 'Invalid invitation token' });
    }
    
    const invite = inviteToken[0];
    
    // Check if already used
    if (invite.usedAt) {
      return res.status(400).json({ error: 'This invitation has already been used' });
    }
    
    // Check if expired
    if (new Date() > new Date(invite.expiresAt)) {
      return res.status(400).json({ error: 'This invitation has expired' });
    }
    
    // Get tenant info
    const tenant = await db.select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, invite.tenantId))
      .limit(1);
    
    if (!tenant[0]) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({
      email: invite.invitedEmail,
      role: invite.role,
      tenantName: tenant[0].name,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('Error validating invitation token:', error);
    res.status(500).json({ error: 'Failed to validate invitation' });
  }
});

/**
 * GET /api/tenants/by-invite-code/:code
 * Lookup tenant by invite code (public)
 */
router.get('/tenants/by-invite-code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const tenant = await lookupTenantByCode(code);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }
    
    res.json({
      tenantId: tenant.id,
      tenantName: tenant.name,
    });
  } catch (error) {
    console.error('Error looking up tenant by code:', error);
    res.status(500).json({ error: 'Failed to lookup tenant' });
  }
});

/**
 * POST /api/signup/accept-invite
 * Accept invitation and create/link account
 */
router.post('/signup/accept-invite', async (req, res) => {
  try {
    const data = acceptInviteSchema.parse(req.body);
    
    // Validate and consume token
    const invite = await validateAndConsumeToken(data.token);
    
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, invite.invitedEmail))
      .limit(1);
    
    let userId;
    
    if (existingUser[0]) {
      // User exists - just link to tenant
      userId = existingUser[0].id;
    } else {
      // Create new user
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(data.password, 12);
      
      const [newUser] = await db.insert(users)
        .values({
          email: invite.invitedEmail,
          firstName: data.firstName || invite.invitedEmail.split('@')[0],
          lastName: data.lastName || '',
          passwordHash,
          authProvider: 'local',
          tenantId: invite.tenantId,
          isApproved: true,
          registrationStatus: 'approved',
        })
        .returning();
      userId = newUser.id;
    }
    
    // Create tenant membership
    await createTenantMembership(invite.tenantId, userId, invite.role);
    
    // If invite was for a player and player is 13+, link player to user
    if (invite.playerId && invite.role === 'player') {
      await db.update(players)
        .set({ userId })
        .where(eq(players.id, invite.playerId));
    }
    
    // Send welcome email
    try {
      const tenantInfo = await db.select({ name: tenants.name })
        .from(tenants)
        .where(eq(tenants.id, invite.tenantId))
        .limit(1);
      
      if (tenantInfo[0]) {
        await sendWelcomeEmail({
          to: invite.invitedEmail,
          firstName: data.firstName || invite.invitedEmail.split('@')[0],
          tenantName: tenantInfo[0].name,
          role: invite.role,
        });
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue without failing the response
    }
    
    res.json({
      message: 'Invitation accepted successfully',
      userId,
      tenantId: invite.tenantId,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    
    if (error instanceof Error && error.message.includes('token')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

/**
 * POST /api/memberships/add-by-code
 * Add tenant membership using invite code
 */
router.post('/memberships/add-by-code', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).currentUser?.id;
    const data = addMembershipSchema.parse(req.body);
    
    // Lookup tenant by code
    const tenant = await lookupTenantByCode(data.code);
    if (!tenant) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }
    
    // Check if user already has membership
    const existingMembership = await checkExistingMembership(
      tenant.id, 
      userId, 
      data.scope
    );
    
    if (existingMembership) {
      return res.status(409).json({ 
        error: 'Already joined',
        message: `You are already a ${data.scope} member of ${tenant.name}`
      });
    }
    
    // Create membership
    const membership = await createTenantMembership(tenant.id, userId, data.scope);
    
    // If adding player membership and playerId provided, link player
    if (data.scope === 'player' && data.playerId) {
      await db.update(players)
        .set({ userId })
        .where(eq(players.id, data.playerId));
    }
    
    res.json({
      message: `Successfully joined ${tenant.name} as ${data.scope}`,
      membership,
      tenantName: tenant.name,
    });
  } catch (error) {
    console.error('Error adding membership by code:', error);
    res.status(500).json({ error: 'Failed to join tenant' });
  }
});

export default router;