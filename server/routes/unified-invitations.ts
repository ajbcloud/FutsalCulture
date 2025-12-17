import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import {
  unifiedInvitations,
  invitationBatches,
  invitationAnalytics,
  inviteTokens,
  tenants,
  users,
  createInvitationSchema,
  batchInvitationRequestSchema,
  insertUnifiedInvitationSchema,
  insertInvitationBatchSchema,
  insertInvitationAnalyticsSchema,
  type UnifiedInvitation,
  type InvitationBatch,
  type CreateInvitationRequest,
  type BatchInvitationRequest,
} from '@shared/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { requireAdmin } from '../admin-routes';
import crypto from 'crypto';

// Generate a secure random token for invitations
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
import { sendInvitationEmail } from '../utils/email-service';

const router = Router();

/**
 * UNIFIED INVITATION API ENDPOINTS
 * According to specification:
 * POST /api/invitations - Create invitations (batch support)
 * GET /api/invitations - List invitations with filters
 * GET /api/invitations/:id - Get invitation details
 * PUT /api/invitations/:id - Update invitation
 * DELETE /api/invitations/:id - Cancel invitation
 * POST /api/invitations/:token/accept - Accept invitation
 * GET /api/invitations/:token/validate - Validate token
 * GET /api/invitations/:token/preview - Preview invitation (track views)
 * GET /api/invitations/analytics - Invitation analytics
 */

// Validation schemas
const invitationFiltersSchema = z.object({
  type: z.enum(['email', 'code', 'parent2', 'player']).optional(),
  status: z.enum(['pending', 'sent', 'viewed', 'accepted', 'expired', 'cancelled']).optional(),
  role: z.enum(['parent', 'player', 'coach', 'admin']).optional(),
  batchId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['created_at', 'updated_at', 'expires_at', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const updateInvitationSchema = z.object({
  status: z.enum(['pending', 'sent', 'viewed', 'accepted', 'expired', 'cancelled']).optional(),
  customMessage: z.string().optional(),
  expiresAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/invitations
 * Create single invitation or batch invitations
 */
router.post('/', requireAdmin, async (req: any, res) => {
  try {
    const adminTenantId = req.adminTenantId;
    const adminUserId = req.user?.id; // Virtual users will have undefined here

    // Check if this is a batch request or single invitation
    const isBatchRequest = Array.isArray(req.body.recipients);
    
    if (isBatchRequest) {
      // Handle batch invitation
      const validatedData = batchInvitationRequestSchema.parse(req.body);
      
      // Create batch record
      const [batch] = await db.insert(invitationBatches)
        .values({
          tenantId: adminTenantId,
          createdBy: req.user?.id || null,
          totalInvitations: validatedData.recipients.length,
          status: 'processing',
          metadata: validatedData.metadata || {},
        })
        .returning();

      const invitationPromises = validatedData.recipients.map(async (recipient) => {
        const token = generateInviteToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + validatedData.expirationDays);

        try {
          // Create unified invitation
          const [invitation] = await db.insert(unifiedInvitations)
            .values({
              tenantId: adminTenantId,
              batchId: batch.id,
              type: validatedData.type,
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              role: validatedData.role as any,
              token,
              customMessage: validatedData.customMessage,
              metadata: { ...validatedData.metadata, ...recipient.metadata },
              expiresAt,
              createdBy: req.user?.id || null,
            })
            .returning();

          // Send email if type is email
          if (validatedData.type === 'email') {
            await sendInvitationEmail({
              to: invitation.recipientEmail,
              tenantName: 'SkoreHQ',
              recipientName: invitation.recipientName || 'User',
              senderName: 'Admin',
              role: invitation.role as any,
              inviteUrl: `${process.env.NODE_ENV === 'production' ? 'https://skorehq.app' : (process.env.REPLIT_APP_URL || 'http://localhost:5000')}/accept-invite?token=${invitation.token}`,
              expiresAt: new Date(invitation.expiresAt)
            });
            
            // Update status to sent
            await db.update(unifiedInvitations)
              .set({ status: 'sent', sentAt: new Date() })
              .where(eq(unifiedInvitations.id, invitation.id));
          }

          // Track analytics
          await db.insert(invitationAnalytics)
            .values({
              invitationId: invitation.id,
              tenantId: adminTenantId,
              eventType: 'sent',
              eventData: { method: 'batch', type: validatedData.type },
            });

          return { success: true, invitation };
        } catch (error: any) {
          console.error('Failed to create invitation for:', recipient.email, error);
          return { success: false, email: recipient.email, error: error.message };
        }
      });

      const results = await Promise.allSettled(invitationPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      // Update batch status
      await db.update(invitationBatches)
        .set({
          successfulInvitations: successful,
          failedInvitations: failed,
          status: failed > 0 ? 'completed' : 'completed',
          completedAt: new Date(),
        })
        .where(eq(invitationBatches.id, batch.id));

      res.status(201).json({
        message: 'Batch invitation processing completed',
        batchId: batch.id,
        total: results.length,
        successful,
        failed,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }),
      });

    } else {
      // Handle single invitation
      const validatedData = createInvitationSchema.parse(req.body);
      const token = generateInviteToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validatedData.expirationDays);

      // Create unified invitation
      const [invitation] = await db.insert(unifiedInvitations)
        .values({
          tenantId: adminTenantId,
          type: validatedData.type,
          recipientEmail: validatedData.recipientEmail,
          recipientName: validatedData.recipientName,
          role: validatedData.role as any,
          token,
          customMessage: validatedData.customMessage,
          metadata: validatedData.metadata || {},
          expiresAt,
          createdBy: req.user?.id || null,
        })
        .returning();

      // Send email if type is email
      if (validatedData.type === 'email') {
        await sendInvitationEmail({
          to: invitation.recipientEmail,
          tenantName: 'SkoreHQ',
          recipientName: invitation.recipientName || 'User',
          senderName: 'Admin',
          role: invitation.role as any,
          inviteUrl: `${process.env.NODE_ENV === 'production' ? 'https://skorehq.app' : (process.env.REPLIT_APP_URL || 'http://localhost:5000')}/accept-invite?token=${invitation.token}`,
          expiresAt: new Date(invitation.expiresAt)
        });
        
        // Update status to sent
        await db.update(unifiedInvitations)
          .set({ status: 'sent', sentAt: new Date() })
          .where(eq(unifiedInvitations.id, invitation.id));
      }

      // Track analytics
      await db.insert(invitationAnalytics)
        .values({
          invitationId: invitation.id,
          tenantId: adminTenantId,
          eventType: 'sent',
          eventData: { method: 'single', type: validatedData.type },
        });

      const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://skorehq.app' 
      : (process.env.REPLIT_APP_URL || 'https://8726fb33-956e-4063-81a8-0b67be518e51-00-1v16mgios7gh8.riker.replit.dev');
      
      res.status(201).json({
        message: 'Invitation created successfully',
        invitation: {
          ...invitation,
          inviteUrl: `${baseUrl}/accept-invite?token=${token}`,
        },
      });
    }

  } catch (error) {
    console.error('Error creating invitation:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create invitation' });
  }
});

/**
 * GET /api/invitations
 * List invitations with filters and pagination
 */
router.get('/', requireAdmin, async (req: any, res) => {
  try {
    const adminTenantId = req.adminTenantId;
    const filters = invitationFiltersSchema.parse(req.query);

    // Build base query with proper conditions
    let whereConditions = [eq(unifiedInvitations.tenantId, adminTenantId)];

    // Apply filters
    if (filters.type) {
      whereConditions.push(eq(unifiedInvitations.type, filters.type));
    }

    if (filters.status) {
      whereConditions.push(eq(unifiedInvitations.status, filters.status));
    }

    if (filters.role) {
      whereConditions.push(eq(unifiedInvitations.role, filters.role));
    }

    if (filters.batchId) {
      whereConditions.push(eq(unifiedInvitations.batchId, filters.batchId));
    }

    // Apply sorting
    const sortColumn = unifiedInvitations[filters.sortBy === 'created_at' ? 'createdAt' : 
                                        filters.sortBy === 'updated_at' ? 'updatedAt' :
                                        filters.sortBy === 'expires_at' ? 'expiresAt' : 'createdAt'];
    const orderByClause = filters.sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

    const invitations = await db.select({
      id: unifiedInvitations.id,
      type: unifiedInvitations.type,
      recipientEmail: unifiedInvitations.recipientEmail,
      recipientName: unifiedInvitations.recipientName,
      role: unifiedInvitations.role,
      status: unifiedInvitations.status,
      customMessage: unifiedInvitations.customMessage,
      metadata: unifiedInvitations.metadata,
      expiresAt: unifiedInvitations.expiresAt,
      sentAt: unifiedInvitations.sentAt,
      viewedAt: unifiedInvitations.viewedAt,
      acceptedAt: unifiedInvitations.acceptedAt,
      createdAt: unifiedInvitations.createdAt,
      updatedAt: unifiedInvitations.updatedAt,
      batchId: unifiedInvitations.batchId,
      createdByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('createdByName'),
    })
    .from(unifiedInvitations)
    .leftJoin(users, eq(users.id, unifiedInvitations.createdBy))
    .where(and(...whereConditions))
    .orderBy(orderByClause)
    .limit(filters.limit)
    .offset(filters.offset);

    // Get total count for pagination
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(unifiedInvitations)
      .where(eq(unifiedInvitations.tenantId, adminTenantId));

    const total = totalResult[0]?.count || 0;

    res.json({
      invitations,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total,
      },
      filters,
    });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid filter parameters', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to fetch invitations' });
  }
});

/**
 * GET /api/invitations/:id
 * Get invitation details
 */
router.get('/:id', requireAdmin, async (req: any, res) => {
  try {
    const adminTenantId = req.adminTenantId;
    const { id } = req.params;

    const invitation = await db.select({
      id: unifiedInvitations.id,
      tenantId: unifiedInvitations.tenantId,
      batchId: unifiedInvitations.batchId,
      type: unifiedInvitations.type,
      recipientEmail: unifiedInvitations.recipientEmail,
      recipientName: unifiedInvitations.recipientName,
      role: unifiedInvitations.role,
      token: unifiedInvitations.token,
      status: unifiedInvitations.status,
      customMessage: unifiedInvitations.customMessage,
      metadata: unifiedInvitations.metadata,
      expiresAt: unifiedInvitations.expiresAt,
      sentAt: unifiedInvitations.sentAt,
      viewedAt: unifiedInvitations.viewedAt,
      acceptedAt: unifiedInvitations.acceptedAt,
      createdAt: unifiedInvitations.createdAt,
      updatedAt: unifiedInvitations.updatedAt,
      createdByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('createdByName'),
    })
    .from(unifiedInvitations)
    .leftJoin(users, eq(users.id, unifiedInvitations.createdBy))
    .where(and(
      eq(unifiedInvitations.id, id),
      eq(unifiedInvitations.tenantId, adminTenantId)
    ))
    .limit(1);

    if (!invitation[0]) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Get analytics for this invitation
    const analytics = await db.select()
      .from(invitationAnalytics)
      .where(eq(invitationAnalytics.invitationId, id))
      .orderBy(desc(invitationAnalytics.createdAt));

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://skorehq.app' 
      : (process.env.REPLIT_APP_URL || 'https://8726fb33-956e-4063-81a8-0b67be518e51-00-1v16mgios7gh8.riker.replit.dev');

    res.json({
      ...invitation[0],
      inviteUrl: `${baseUrl}/accept-invite?token=${invitation[0].token}`,
      analytics,
    });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ message: 'Failed to fetch invitation' });
  }
});

/**
 * Helper function to send invitation email using unified system
 */
// Removed unused function that was causing import issues

/**
 * PUT /api/invitations/:id
 * Update invitation
 */
router.put('/:id', requireAdmin, async (req: any, res) => {
  try {
    const adminTenantId = req.adminTenantId;
    const { id } = req.params;
    const validatedData = updateInvitationSchema.parse(req.body);

    // Check if invitation exists and belongs to tenant
    const existing = await db.select()
      .from(unifiedInvitations)
      .where(and(
        eq(unifiedInvitations.id, id),
        eq(unifiedInvitations.tenantId, adminTenantId)
      ))
      .limit(1);

    if (!existing[0]) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Update invitation
    const [updated] = await db.update(unifiedInvitations)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(unifiedInvitations.id, id))
      .returning();

    // Track analytics for status changes
    if (validatedData.status && validatedData.status !== existing[0].status) {
      await db.insert(invitationAnalytics)
        .values({
          invitationId: id,
          tenantId: adminTenantId,
          eventType: 'sent',
          eventData: { 
            previousStatus: existing[0].status,
            newStatus: validatedData.status,
            updatedBy: 'admin'
          },
        });
    }

    res.json({
      message: 'Invitation updated successfully',
      invitation: updated,
    });

  } catch (error) {
    console.error('Error updating invitation:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update invitation' });
  }
});

/**
 * DELETE /api/invitations/:id
 * Cancel invitation (soft delete by setting status to cancelled)
 */
router.delete('/:id', requireAdmin, async (req: any, res) => {
  try {
    const adminTenantId = req.adminTenantId;
    const { id } = req.params;

    // Check if invitation exists and belongs to tenant
    const existing = await db.select()
      .from(unifiedInvitations)
      .where(and(
        eq(unifiedInvitations.id, id),
        eq(unifiedInvitations.tenantId, adminTenantId)
      ))
      .limit(1);

    if (!existing[0]) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (existing[0].status === 'accepted') {
      return res.status(400).json({ message: 'Cannot cancel an already accepted invitation' });
    }

    // Cancel invitation (soft delete)
    await db.update(unifiedInvitations)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(unifiedInvitations.id, id));

    // Track analytics
    await db.insert(invitationAnalytics)
      .values({
        invitationId: id,
        tenantId: adminTenantId,
        eventType: 'sent',
        eventData: { 
          previousStatus: existing[0].status,
          cancelledBy: 'admin'
        },
      });

    res.json({ message: 'Invitation cancelled successfully' });

  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ message: 'Failed to cancel invitation' });
  }
});

/**
 * GET /api/invitations/:token/validate
 * Validate invitation token (public endpoint for invite acceptance flow)
 */
router.get('/:token/validate', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await db.select({
      id: unifiedInvitations.id,
      tenantId: unifiedInvitations.tenantId,
      type: unifiedInvitations.type,
      recipientEmail: unifiedInvitations.recipientEmail,
      recipientName: unifiedInvitations.recipientName,
      role: unifiedInvitations.role,
      status: unifiedInvitations.status,
      customMessage: unifiedInvitations.customMessage,
      expiresAt: unifiedInvitations.expiresAt,
      tenantName: tenants.name,
    })
    .from(unifiedInvitations)
    .leftJoin(tenants, eq(tenants.id, unifiedInvitations.tenantId))
    .where(eq(unifiedInvitations.token, token))
    .limit(1);

    if (!invitation[0]) {
      return res.status(404).json({ 
        valid: false,
        message: 'Invalid invitation token' 
      });
    }

    const inv = invitation[0];

    // Check if expired
    if (new Date() > new Date(inv.expiresAt)) {
      // Update status to expired if not already
      if (inv.status !== 'expired') {
        await db.update(unifiedInvitations)
          .set({ status: 'expired', updatedAt: new Date() })
          .where(eq(unifiedInvitations.token, token));

        // Track analytics
        await db.insert(invitationAnalytics)
          .values({
            invitationId: inv.id,
            tenantId: inv.tenantId,
            eventType: 'expired',
            eventData: { expiredAt: new Date() },
          });
      }

      return res.status(410).json({ 
        valid: false,
        message: 'Invitation has expired' 
      });
    }

    // Check if already used
    if (inv.status === 'accepted') {
      return res.status(410).json({ 
        valid: false,
        message: 'Invitation has already been used' 
      });
    }

    // Check if cancelled
    if (inv.status === 'cancelled') {
      return res.status(410).json({ 
        valid: false,
        message: 'Invitation has been cancelled' 
      });
    }

    res.json({
      valid: true,
      invitation: {
        id: inv.id,
        type: inv.type,
        recipientEmail: inv.recipientEmail,
        recipientName: inv.recipientName,
        role: inv.role,
        tenantName: inv.tenantName,
        customMessage: inv.customMessage,
        expiresAt: inv.expiresAt,
      }
    });

  } catch (error) {
    console.error('Error validating invitation token:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Failed to validate invitation' 
    });
  }
});

/**
 * GET /api/invitations/:token/preview
 * Preview invitation and track view (public endpoint)
 */
router.get('/:token/preview', async (req, res) => {
  try {
    const { token } = req.params;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;

    const invitation = await db.select()
      .from(unifiedInvitations)
      .where(eq(unifiedInvitations.token, token))
      .limit(1);

    if (!invitation[0]) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    const inv = invitation[0];

    // Update view status and track analytics
    if (inv.status === 'sent' || inv.status === 'pending') {
      await db.update(unifiedInvitations)
        .set({ 
          status: 'viewed',
          viewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(unifiedInvitations.id, inv.id));
    }

    // Track view analytics
    await db.insert(invitationAnalytics)
      .values({
        invitationId: inv.id,
        tenantId: inv.tenantId,
        eventType: 'viewed',
        eventData: { 
          viewedAt: new Date(),
          userAgent: userAgent?.substring(0, 500), // Limit length
          source: 'preview'
        },
        userAgent: userAgent?.substring(0, 500),
        ipAddress: ipAddress?.substring(0, 45), // IPv6 max length
      });

    // Get tenant info for display
    const tenantInfo = await db.select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, inv.tenantId))
      .limit(1);

    res.json({
      invitation: {
        id: inv.id,
        type: inv.type,
        recipientEmail: inv.recipientEmail,
        recipientName: inv.recipientName,
        role: inv.role,
        customMessage: inv.customMessage,
        tenantName: tenantInfo[0]?.name,
        expiresAt: inv.expiresAt,
      }
    });

  } catch (error) {
    console.error('Error previewing invitation:', error);
    res.status(500).json({ message: 'Failed to preview invitation' });
  }
});

/**
 * POST /api/invitations/:token/accept
 * Accept invitation (public endpoint)
 */
router.post('/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;

    // First validate the token
    const invitation = await db.select()
      .from(unifiedInvitations)
      .where(eq(unifiedInvitations.token, token))
      .limit(1);

    if (!invitation[0]) {
      return res.status(404).json({ message: 'Invalid invitation token' });
    }

    const inv = invitation[0];

    // Check if expired
    if (new Date() > new Date(inv.expiresAt)) {
      return res.status(410).json({ message: 'Invitation has expired' });
    }

    // Check if already used
    if (inv.status === 'accepted') {
      return res.status(410).json({ message: 'Invitation has already been used' });
    }

    // Check if cancelled
    if (inv.status === 'cancelled') {
      return res.status(410).json({ message: 'Invitation has been cancelled' });
    }

    // Update invitation status
    await db.update(unifiedInvitations)
      .set({ 
        status: 'accepted',
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(unifiedInvitations.id, inv.id));

    // Track analytics
    await db.insert(invitationAnalytics)
      .values({
        invitationId: inv.id,
        tenantId: inv.tenantId,
        eventType: 'accepted',
        eventData: { 
          acceptedAt: new Date(),
          method: 'unified_api'
        },
      });

    // Create or update user account with password
    const { firstName, lastName, email, password } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields: firstName, lastName, email, password' });
    }

    // Validate email matches invitation
    if (email.toLowerCase() !== inv.recipientEmail.toLowerCase()) {
      return res.status(400).json({ message: 'Email does not match invitation' });
    }

    // Hash password
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if user already exists
    let existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Map invitation role to user role (handle mismatch between tables)
    const mapInvitationRoleToUserRole = (invRole: string): any => {
      if (invRole === 'admin') return 'tenant_admin';
      if (invRole === 'assistant') return 'player'; // Assistant doesn't exist in users table
      return invRole as any; // parent, player pass through
    };

    const userRole = mapInvitationRoleToUserRole(inv.role);

    let user;
    if (existingUser[0]) {
      // Update existing user with password and role
      [user] = await db.update(users)
        .set({
          firstName: firstName,
          lastName: lastName,
          passwordHash: passwordHash,
          role: userRole,
          tenantId: inv.tenantId,
          isAdmin: ['admin', 'tenant_admin'].includes(inv.role),
          isAssistant: inv.role === 'assistant',
          isApproved: true,
          registrationStatus: 'approved',
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();
    } else {
      // Create new user
      const insertedUsers = await db.insert(users)
        .values({
          email: email.toLowerCase(),
          firstName: firstName,
          lastName: lastName,
          passwordHash: passwordHash,
          role: userRole,
          tenantId: inv.tenantId,
          isAdmin: ['admin', 'tenant_admin'].includes(inv.role),
          isAssistant: inv.role === 'assistant',
          isApproved: true,
          registrationStatus: 'approved',
          emailVerifiedAt: new Date(),
        })
        .returning();
      user = insertedUsers[0];
    }

    res.json({
      message: 'Account created successfully! You can now sign in.',
      invitation: {
        id: inv.id,
        tenantId: inv.tenantId,
        recipientEmail: inv.recipientEmail,
        role: inv.role,
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    });

  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      severity: error?.severity,
      stack: error?.stack
    });
    
    const errorMessage = error?.message || 'Failed to accept invitation';
    
    // Handle database connection errors
    if (error?.code === '57P01' || error?.code === '08006' || 
        errorMessage.includes('terminating connection') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('pool ended')) {
      return res.status(503).json({ 
        message: 'Database connection issue. Please try again in a moment.',
        error: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    // Handle duplicate key errors
    if (error?.code === '23505' || 
        errorMessage.includes('duplicate key') || 
        errorMessage.includes('unique constraint')) {
      return res.status(400).json({ 
        message: 'An account with this email already exists.',
        error: 'DUPLICATE_EMAIL'
      });
    }
    
    // Handle column not found errors (schema mismatch)
    if (error?.code === '42703' || errorMessage.includes('column') || errorMessage.includes('does not exist')) {
      console.error('Schema mismatch error - checking column names');
      return res.status(500).json({ 
        message: 'Database schema error. Please contact support.',
        error: 'SCHEMA_ERROR'
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to accept invitation. Please try again.',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        code: error?.code,
        severity: error?.severity
      } : undefined
    });
  }
});

/**
 * GET /api/invitations/analytics
 * Get invitation analytics
 */
router.get('/analytics', requireAdmin, async (req: any, res) => {
  try {
    const adminTenantId = req.adminTenantId;

    // Get overall statistics
    const stats = await db.select({
      status: unifiedInvitations.status,
      type: unifiedInvitations.type,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(unifiedInvitations)
    .where(eq(unifiedInvitations.tenantId, adminTenantId))
    .groupBy(unifiedInvitations.status, unifiedInvitations.type);

    // Get recent activity
    const recentActivity = await db.select({
      eventType: invitationAnalytics.eventType,
      count: sql<number>`count(*)`.as('count'),
      day: sql<string>`date_trunc('day', ${invitationAnalytics.createdAt})`.as('day'),
    })
    .from(invitationAnalytics)
    .where(eq(invitationAnalytics.tenantId, adminTenantId))
    .groupBy(invitationAnalytics.eventType, sql`date_trunc('day', ${invitationAnalytics.createdAt})`)
    .orderBy(desc(sql`date_trunc('day', ${invitationAnalytics.createdAt})`))
    .limit(30);

    // Get conversion rates
    const totalInvitations = await db.select({ count: sql<number>`count(*)` })
      .from(unifiedInvitations)
      .where(eq(unifiedInvitations.tenantId, adminTenantId));

    const acceptedInvitations = await db.select({ count: sql<number>`count(*)` })
      .from(unifiedInvitations)
      .where(and(
        eq(unifiedInvitations.tenantId, adminTenantId),
        eq(unifiedInvitations.status, 'accepted')
      ));

    const total = totalInvitations[0]?.count || 0;
    const accepted = acceptedInvitations[0]?.count || 0;
    const conversionRate = total > 0 ? (accepted / total) * 100 : 0;

    res.json({
      overview: {
        totalInvitations: total,
        acceptedInvitations: accepted,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      statusBreakdown: stats,
      recentActivity,
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

export default router;