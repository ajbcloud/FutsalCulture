import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { users, coachTenantAssignments, coachSessionAssignments, futsalSessions, inviteCodes, tenants } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAdmin } from "../admin-routes";
import { nanoid } from "nanoid";
import { sendEmail } from "../utils/email-provider";

function generateCoachInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const router = Router();

// GET /api/admin/coaches - List all coaches for the tenant with their permission settings
router.get('/admin/coaches', requireAdmin, async (req: any, res: Response) => {
  try {
    const tenantId = req.currentUser?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const assignments = await db
      .select({
        assignment: coachTenantAssignments,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(coachTenantAssignments)
      .innerJoin(users, eq(coachTenantAssignments.userId, users.id))
      .where(eq(coachTenantAssignments.tenantId, tenantId))
      .orderBy(desc(coachTenantAssignments.createdAt));

    const coaches = assignments.map(({ assignment, user }) => ({
      ...assignment,
      user,
    }));

    res.json({ coaches });
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ message: 'Failed to fetch coaches' });
  }
});

// GET /api/admin/coaches/:id - Get a specific coach assignment by ID
router.get('/admin/coaches/:id', requireAdmin, async (req: any, res: Response) => {
  try {
    const tenantId = req.currentUser?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const [result] = await db
      .select({
        assignment: coachTenantAssignments,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(coachTenantAssignments)
      .innerJoin(users, eq(coachTenantAssignments.userId, users.id))
      .where(and(
        eq(coachTenantAssignments.id, id),
        eq(coachTenantAssignments.tenantId, tenantId)
      ));

    if (!result) {
      return res.status(404).json({ message: 'Coach assignment not found' });
    }

    res.json({
      ...result.assignment,
      user: result.user,
    });
  } catch (error) {
    console.error('Error fetching coach:', error);
    res.status(500).json({ message: 'Failed to fetch coach' });
  }
});

// POST /api/admin/coaches/invite - Invite a new coach by email (creates invite code, sends email)
router.post('/admin/coaches/invite', requireAdmin, async (req: any, res: Response) => {
  try {
    const tenantId = req.currentUser?.tenantId;
    const invitedBy = req.currentUser?.id;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const { email, firstName, lastName, permissions } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      const existingAssignment = await storage.getCoachAssignmentByUserAndTenant(existingUser.id, tenantId);
      if (existingAssignment) {
        return res.status(400).json({ message: 'This user is already a coach for this organization' });
      }
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    if (!tenant) {
      return res.status(400).json({ message: 'Tenant not found' });
    }

    const inviter = await storage.getUser(invitedBy);

    let code = generateCoachInviteCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const [existingCode] = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code));
      if (!existingCode) break;
      code = generateCoachInviteCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return res.status(500).json({ message: 'Unable to generate unique invite code. Please try again.' });
    }

    const [inviteCode] = await db
      .insert(inviteCodes)
      .values({
        id: nanoid(),
        tenantId,
        code,
        codeType: 'invite',
        description: `Coach invite for ${email}`,
        isActive: true,
        maxUses: 1,
        currentUses: 0,
        createdBy: invitedBy,
        metadata: {
          inviteType: 'coach_invite',
          recipientEmail: email,
          firstName: firstName || '',
          lastName: lastName || '',
          invitedBy,
          inviterName: inviter ? `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || 'Admin' : 'Admin',
          permissions: {
            canViewPii: permissions?.canViewPii ?? false,
            canManageSessions: permissions?.canManageSessions ?? false,
            canViewAnalytics: permissions?.canViewAnalytics ?? false,
            canViewAttendance: permissions?.canViewAttendance ?? true,
            canTakeAttendance: permissions?.canTakeAttendance ?? true,
            canViewFinancials: permissions?.canViewFinancials ?? false,
            canIssueRefunds: permissions?.canIssueRefunds ?? false,
            canIssueCredits: permissions?.canIssueCredits ?? false,
            canManageDiscounts: permissions?.canManageDiscounts ?? false,
            canAccessAdminPortal: permissions?.canAccessAdminPortal ?? false,
          },
        },
      })
      .returning();

    const baseUrl = process.env.REPLIT_APP_URL || process.env.REPLIT_DEV_DOMAIN || 'https://playhq.app';
    const joinUrl = `${baseUrl}/join-as-coach?code=${code}`;
    const tenantName = tenant.displayName || tenant.name;
    const inviterName = inviter ? `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || 'Admin' : 'Admin';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 20px 0;">You're Invited to Join as a Coach!</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            ${inviterName} has invited you to join <strong>${tenantName}</strong> as a coach on PlayHQ.
          </p>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Click the button below to accept your invitation and set up your account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${joinUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">
              Join as Coach
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This invitation was sent via PlayHQ. Your invite code is: <strong>${code}</strong>
          </p>
        </div>
      </body>
      </html>
    `;

    const emailResult = await sendEmail({
      to: email,
      subject: `You're invited to join ${tenantName} as a coach`,
      html: emailHtml,
      text: `${inviterName} has invited you to join ${tenantName} as a coach on PlayHQ. Visit ${joinUrl} to accept your invitation.`,
    });

    res.status(201).json({
      success: true,
      message: 'Coach invitation sent successfully',
      inviteCode: {
        id: inviteCode.id,
        code: inviteCode.code,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        emailSent: emailResult.success,
        emailError: emailResult.error,
      },
    });
  } catch (error) {
    console.error('Error inviting coach:', error);
    res.status(500).json({ message: 'Failed to invite coach' });
  }
});

// PUT /api/admin/coaches/:id - Update a coach's permissions
router.put('/admin/coaches/:id', requireAdmin, async (req: any, res: Response) => {
  try {
    const tenantId = req.currentUser?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const existingAssignment = await storage.getCoachTenantAssignment(id, tenantId);
    if (!existingAssignment) {
      return res.status(404).json({ message: 'Coach assignment not found' });
    }

    const {
      canViewPii,
      canManageSessions,
      canViewAnalytics,
      canViewAttendance,
      canTakeAttendance,
      canViewFinancials,
      canIssueRefunds,
      canIssueCredits,
      canManageDiscounts,
      canAccessAdminPortal,
      status,
    } = req.body;

    const updatedAssignment = await storage.updateCoachTenantAssignment(id, tenantId, {
      canViewPii: canViewPii ?? existingAssignment.canViewPii,
      canManageSessions: canManageSessions ?? existingAssignment.canManageSessions,
      canViewAnalytics: canViewAnalytics ?? existingAssignment.canViewAnalytics,
      canViewAttendance: canViewAttendance ?? existingAssignment.canViewAttendance,
      canTakeAttendance: canTakeAttendance ?? existingAssignment.canTakeAttendance,
      canViewFinancials: canViewFinancials ?? existingAssignment.canViewFinancials,
      canIssueRefunds: canIssueRefunds ?? existingAssignment.canIssueRefunds,
      canIssueCredits: canIssueCredits ?? existingAssignment.canIssueCredits,
      canManageDiscounts: canManageDiscounts ?? existingAssignment.canManageDiscounts,
      canAccessAdminPortal: canAccessAdminPortal ?? existingAssignment.canAccessAdminPortal,
      status: status ?? existingAssignment.status,
    });

    res.json({
      success: true,
      message: 'Coach permissions updated',
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error('Error updating coach:', error);
    res.status(500).json({ message: 'Failed to update coach' });
  }
});

// DELETE /api/admin/coaches/:id - Remove a coach from the tenant
router.delete('/admin/coaches/:id', requireAdmin, async (req: any, res: Response) => {
  try {
    const tenantId = req.currentUser?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const existingAssignment = await storage.getCoachTenantAssignment(id, tenantId);
    if (!existingAssignment) {
      return res.status(404).json({ message: 'Coach assignment not found' });
    }

    await storage.deleteCoachTenantAssignment(id, tenantId);

    res.json({
      success: true,
      message: 'Coach removed from organization',
    });
  } catch (error) {
    console.error('Error removing coach:', error);
    res.status(500).json({ message: 'Failed to remove coach' });
  }
});

// GET /api/admin/coaches/:id/sessions - Get sessions assigned to a coach
router.get('/admin/coaches/:id/sessions', requireAdmin, async (req: any, res: Response) => {
  try {
    const tenantId = req.currentUser?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const assignment = await storage.getCoachTenantAssignment(id, tenantId);
    if (!assignment) {
      return res.status(404).json({ message: 'Coach assignment not found' });
    }

    const sessionAssignments = await db
      .select({
        assignment: coachSessionAssignments,
        session: futsalSessions,
      })
      .from(coachSessionAssignments)
      .innerJoin(futsalSessions, eq(coachSessionAssignments.sessionId, futsalSessions.id))
      .where(eq(coachSessionAssignments.coachAssignmentId, id))
      .orderBy(desc(coachSessionAssignments.assignedAt));

    const sessions = sessionAssignments.map(({ assignment, session }) => ({
      ...assignment,
      session,
    }));

    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching coach sessions:', error);
    res.status(500).json({ message: 'Failed to fetch coach sessions' });
  }
});

// POST /api/admin/coaches/:id/sessions - Assign a coach to a session
router.post('/admin/coaches/:id/sessions', requireAdmin, async (req: any, res: Response) => {
  try {
    const tenantId = req.currentUser?.tenantId;
    const assignedBy = req.currentUser?.id;
    const { id } = req.params;
    const { sessionId, isLead, notes } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const assignment = await storage.getCoachTenantAssignment(id, tenantId);
    if (!assignment) {
      return res.status(404).json({ message: 'Coach assignment not found' });
    }

    const session = await storage.getSession(sessionId, tenantId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const sessionAssignment = await storage.assignCoachToSession({
      coachAssignmentId: id,
      sessionId,
      tenantId,
      isLead: isLead ?? false,
      notes: notes ?? null,
      assignedBy,
    });

    res.status(201).json({
      success: true,
      message: 'Coach assigned to session',
      assignment: sessionAssignment,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(400).json({ message: 'Coach is already assigned to this session' });
    }
    console.error('Error assigning coach to session:', error);
    res.status(500).json({ message: 'Failed to assign coach to session' });
  }
});

// DELETE /api/admin/coaches/:coachId/sessions/:sessionId - Remove coach from a session
router.delete('/admin/coaches/:coachId/sessions/:sessionId', requireAdmin, async (req: any, res: Response) => {
  try {
    const tenantId = req.currentUser?.tenantId;
    const { coachId, sessionId } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const [sessionAssignment] = await db
      .select()
      .from(coachSessionAssignments)
      .where(and(
        eq(coachSessionAssignments.coachAssignmentId, coachId),
        eq(coachSessionAssignments.sessionId, sessionId),
        eq(coachSessionAssignments.tenantId, tenantId)
      ));

    if (!sessionAssignment) {
      return res.status(404).json({ message: 'Session assignment not found' });
    }

    await storage.removeCoachFromSession(sessionAssignment.id, tenantId);

    res.json({
      success: true,
      message: 'Coach removed from session',
    });
  } catch (error) {
    console.error('Error removing coach from session:', error);
    res.status(500).json({ message: 'Failed to remove coach from session' });
  }
});

// GET /api/coach/my-tenants - Get current user's coach assignments across tenants (for club switcher)
// This endpoint is for coaches to see which clubs they're assigned to
router.get('/coach/my-tenants', async (req: any, res: Response) => {
  try {
    const userId = req.currentUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is a coach (isAssistant)
    const user = await storage.getUser(userId);
    if (!user?.isAssistant) {
      return res.json({ tenants: [] });
    }

    const assignments = await storage.getUserCoachAssignments(userId);
    
    // Filter to only active assignments and format response
    const tenants = assignments
      .filter(a => a.status === 'active')
      .map(a => ({
        id: a.id,
        tenantId: a.tenantId,
        tenantName: a.tenant.displayName || a.tenant.name,
        permissions: {
          canViewPii: a.canViewPii,
          canManageSessions: a.canManageSessions,
          canViewAnalytics: a.canViewAnalytics,
          canViewAttendance: a.canViewAttendance,
          canTakeAttendance: a.canTakeAttendance,
          canViewFinancials: a.canViewFinancials,
          canIssueRefunds: a.canIssueRefunds,
          canIssueCredits: a.canIssueCredits,
          canManageDiscounts: a.canManageDiscounts,
          canAccessAdminPortal: a.canAccessAdminPortal,
        },
      }));

    res.json({ tenants });
  } catch (error) {
    console.error('Error fetching coach tenants:', error);
    res.status(500).json({ message: 'Failed to fetch coach tenants' });
  }
});

// POST /api/coach/switch-tenant - Switch the coach's active tenant
router.post('/coach/switch-tenant', async (req: any, res: Response) => {
  try {
    const userId = req.currentUser?.id;
    const { tenantId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Verify the coach has an active assignment to this tenant
    const assignment = await storage.getCoachAssignmentByUserAndTenant(userId, tenantId);
    if (!assignment || assignment.status !== 'active') {
      return res.status(403).json({ message: 'Not authorized for this club' });
    }

    // Update user's tenantId to switch to this tenant
    await storage.updateUser(userId, { tenantId });

    res.json({
      success: true,
      message: 'Switched to club successfully',
      tenantId,
    });
  } catch (error) {
    console.error('Error switching tenant:', error);
    res.status(500).json({ message: 'Failed to switch club' });
  }
});

// GET /api/coach/my-sessions - Get current coach's assigned sessions for their current tenant
router.get('/coach/my-sessions', async (req: any, res: Response) => {
  try {
    const userId = req.currentUser?.id;
    const tenantId = req.currentUser?.tenantId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Check if user is a coach (isAssistant)
    const user = await storage.getUser(userId);
    if (!user?.isAssistant) {
      return res.status(403).json({ message: 'Not authorized - not a coach' });
    }

    // Get the coach's assignment for this tenant
    const assignment = await storage.getCoachAssignmentByUserAndTenant(userId, tenantId);
    if (!assignment || assignment.status !== 'active') {
      return res.status(403).json({ message: 'Not an active coach for this organization' });
    }

    // Get sessions assigned to this coach
    const sessionAssignments = await db
      .select({
        assignment: coachSessionAssignments,
        session: futsalSessions,
      })
      .from(coachSessionAssignments)
      .innerJoin(futsalSessions, eq(coachSessionAssignments.sessionId, futsalSessions.id))
      .where(eq(coachSessionAssignments.coachAssignmentId, assignment.id))
      .orderBy(desc(futsalSessions.startTime));

    // Get signup counts for each session
    const sessions = await Promise.all(sessionAssignments.map(async ({ assignment, session }) => {
      const signupsCount = await storage.getSignupsCount(session.id);
      return {
        id: assignment.id,
        sessionId: session.id,
        isLead: assignment.isLead,
        notes: assignment.notes,
        assignedAt: assignment.assignedAt,
        session: {
          id: session.id,
          title: session.title,
          startTime: session.startTime,
          endTime: session.endTime,
          location: session.location,
          capacity: session.capacity,
          currentSignups: signupsCount,
          ageGroups: session.ageGroups,
          genders: session.genders,
          status: session.status,
        },
      };
    }));

    res.json({ sessions, coachAssignmentId: assignment.id });
  } catch (error) {
    console.error('Error fetching coach sessions:', error);
    res.status(500).json({ message: 'Failed to fetch coach sessions' });
  }
});

// GET /api/coach/calendar/ics - Export coach's sessions as ICS calendar file
router.get('/coach/calendar/ics', async (req: any, res: Response) => {
  try {
    const userId = req.currentUser?.id;
    const tenantId = req.currentUser?.tenantId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.isAssistant) {
      return res.status(403).json({ message: 'Not authorized - not a coach' });
    }

    const assignment = await storage.getCoachAssignmentByUserAndTenant(userId, tenantId);
    if (!assignment || assignment.status !== 'active') {
      return res.status(403).json({ message: 'Not an active coach for this organization' });
    }

    const sessionAssignments = await db
      .select({
        assignment: coachSessionAssignments,
        session: futsalSessions,
      })
      .from(coachSessionAssignments)
      .innerJoin(futsalSessions, eq(coachSessionAssignments.sessionId, futsalSessions.id))
      .where(eq(coachSessionAssignments.coachAssignmentId, assignment.id))
      .orderBy(desc(futsalSessions.startTime));

    const formatDateToICS = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const escapeICSText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//PlayHQ//Coach Sessions//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n`;

    for (const { session } of sessionAssignments) {
      const startDate = new Date(session.startTime);
      const endDate = new Date(session.endTime);
      
      const ageGroupsText = session.ageGroups && session.ageGroups.length > 0 
        ? `Age Groups: ${session.ageGroups.join(', ')}` 
        : '';
      const gendersText = session.genders && session.genders.length > 0 
        ? `Genders: ${session.genders.join(', ')}` 
        : '';
      
      const descriptionParts = [
        session.location ? `Location: ${session.location}` : '',
        ageGroupsText,
        gendersText,
      ].filter(Boolean);
      
      const description = escapeICSText(descriptionParts.join('\\n'));

      icsContent += `BEGIN:VEVENT\r\n`;
      icsContent += `UID:${session.id}@playhq.com\r\n`;
      icsContent += `DTSTART:${formatDateToICS(startDate)}\r\n`;
      icsContent += `DTEND:${formatDateToICS(endDate)}\r\n`;
      icsContent += `SUMMARY:${escapeICSText(session.title)}\r\n`;
      if (description) {
        icsContent += `DESCRIPTION:${description}\r\n`;
      }
      if (session.location) {
        icsContent += `LOCATION:${escapeICSText(session.location)}\r\n`;
      }
      icsContent += `END:VEVENT\r\n`;
    }

    icsContent += `END:VCALENDAR\r\n`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="coach-sessions.ics"');
    res.send(icsContent);
  } catch (error) {
    console.error('Error generating ICS calendar:', error);
    res.status(500).json({ message: 'Failed to generate calendar file' });
  }
});

// GET /api/coach/validate-invite - Validate a coach invite code (PUBLIC - no auth required)
router.get('/coach/validate-invite', async (req: any, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, message: 'Invite code is required' });
    }

    const [inviteCode] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code));

    if (!inviteCode) {
      return res.status(404).json({ valid: false, message: 'Invalid invite code' });
    }

    if (!inviteCode.isActive) {
      return res.status(400).json({ valid: false, message: 'This invite code is no longer active' });
    }

    if (inviteCode.validUntil && new Date(inviteCode.validUntil) < new Date()) {
      return res.status(400).json({ valid: false, message: 'This invite code has expired' });
    }

    if (inviteCode.maxUses !== null && (inviteCode.currentUses || 0) >= inviteCode.maxUses) {
      return res.status(400).json({ valid: false, message: 'This invite code has already been used' });
    }

    const metadata = inviteCode.metadata as Record<string, any> | null;
    if (!metadata || metadata.inviteType !== 'coach_invite') {
      return res.status(400).json({ valid: false, message: 'Invalid invite code type' });
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, inviteCode.tenantId));
    if (!tenant) {
      return res.status(400).json({ valid: false, message: 'Organization not found' });
    }

    res.json({
      valid: true,
      tenantId: inviteCode.tenantId,
      tenantName: tenant.displayName || tenant.name,
      inviterName: metadata.inviterName || 'Admin',
      recipientEmail: metadata.recipientEmail || '',
      firstName: metadata.firstName || '',
      lastName: metadata.lastName || '',
    });
  } catch (error) {
    console.error('Error validating coach invite:', error);
    res.status(500).json({ valid: false, message: 'Failed to validate invite code' });
  }
});

// POST /api/coach/join - Accept a coach invite and join the organization (requires auth)
router.post('/coach/join', async (req: any, res: Response) => {
  try {
    const userId = req.currentUser?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const [inviteCode] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code));

    if (!inviteCode) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }

    if (!inviteCode.isActive) {
      return res.status(400).json({ success: false, message: 'This invite code is no longer active' });
    }

    if (inviteCode.validUntil && new Date(inviteCode.validUntil) < new Date()) {
      return res.status(400).json({ success: false, message: 'This invite code has expired' });
    }

    if (inviteCode.maxUses !== null && (inviteCode.currentUses || 0) >= inviteCode.maxUses) {
      return res.status(400).json({ success: false, message: 'This invite code has already been used' });
    }

    const metadata = inviteCode.metadata as Record<string, any> | null;
    if (!metadata || metadata.inviteType !== 'coach_invite') {
      return res.status(400).json({ success: false, message: 'Invalid invite code type' });
    }

    const existingAssignment = await storage.getCoachAssignmentByUserAndTenant(userId, inviteCode.tenantId);
    if (existingAssignment) {
      return res.status(400).json({ success: false, message: 'You are already a coach for this organization' });
    }

    const permissions = metadata.permissions || {};

    // Update user with explicit fields only (type-safe update)
    await db.update(users)
      .set({
        tenantId: inviteCode.tenantId,
        isAssistant: true,
        isUnaffiliated: false,
        ...(metadata.firstName ? { firstName: metadata.firstName } : {}),
        ...(metadata.lastName ? { lastName: metadata.lastName } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const assignment = await storage.createCoachTenantAssignment({
      userId,
      tenantId: inviteCode.tenantId,
      invitedBy: metadata.invitedBy,
      canViewPii: permissions.canViewPii ?? false,
      canManageSessions: permissions.canManageSessions ?? false,
      canViewAnalytics: permissions.canViewAnalytics ?? false,
      canViewAttendance: permissions.canViewAttendance ?? true,
      canTakeAttendance: permissions.canTakeAttendance ?? true,
      canViewFinancials: permissions.canViewFinancials ?? false,
      canIssueRefunds: permissions.canIssueRefunds ?? false,
      canIssueCredits: permissions.canIssueCredits ?? false,
      canManageDiscounts: permissions.canManageDiscounts ?? false,
      canAccessAdminPortal: permissions.canAccessAdminPortal ?? false,
      status: 'active',
    });

    await db
      .update(inviteCodes)
      .set({
        currentUses: (inviteCode.currentUses || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(inviteCodes.id, inviteCode.id));

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, inviteCode.tenantId));

    res.json({
      success: true,
      message: 'Successfully joined as a coach',
      tenantId: inviteCode.tenantId,
      tenantName: tenant?.displayName || tenant?.name || 'Organization',
      assignmentId: assignment.id,
      redirectUrl: '/coach/dashboard',
      requiresReload: true, // Tell client to reload to refresh session with new tenant
    });
  } catch (error) {
    console.error('Error joining as coach:', error);
    res.status(500).json({ success: false, message: 'Failed to join as coach' });
  }
});

export default router;
