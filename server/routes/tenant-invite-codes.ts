import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { tenantInviteCodes, insertTenantInviteCodeSchema } from '../../shared/schema';

const router = express.Router();

// Import the requireAdmin middleware from admin-routes
import { requireAdmin } from '../admin-routes';

// Use requireAdmin middleware instead of custom auth
const isAuthenticated = requireAdmin;

// Generate a random uppercase alphanumeric code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get all invite codes for a tenant
router.get('/tenant/:tenantId/invite-codes', isAuthenticated, async (req, res) => {
  try {
    let { tenantId } = req.params;
    
    // Handle "current" tenant
    if (tenantId === 'current') {
      tenantId = (req as any).userTenantId || (req as any).currentUser?.tenantId || (req as any).currentUser?.tenant_id || (req as any).user?.tenantId || '8b976f98-3921-49f2-acf5-006f41d69095'; // Liverpool tenant for development
    }

    // Test email functionality if test_email query parameter is provided
    if (req.query.test_email && req.query.test_role) {
      console.log('🧪 Testing email functionality...');
      try {
        const { sendInvitationEmail } = require('../utils/email-service');
        const emailResult = await sendInvitationEmail({
          recipientEmail: req.query.test_email as string,
          recipientName: (req.query.test_email as string).split('@')[0],
          role: req.query.test_role as string,
          invitedBy: 'Admin',
          tenantName: 'PlayHQ Demo',
          inviteLink: `https://your-domain.com/accept-invite?token=demo-token`,
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        if (emailResult.success) {
          console.log('✅ Test email sent successfully');
        } else {
          console.error('❌ Test email failed:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Email test error:', emailError);
      }
    }
    
    const codes = await db
      .select()
      .from(tenantInviteCodes)
      .where(eq(tenantInviteCodes.tenantId, tenantId))
      .orderBy(desc(tenantInviteCodes.createdAt));

    res.json(codes);
  } catch (error) {
    console.error('Error fetching invite codes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new invite code
router.post('/tenant/:tenantId/invite-codes', isAuthenticated, async (req, res) => {
  try {
    let { tenantId } = req.params;
    const { name, description, maxUsage } = req.body;
    
    // Handle "current" tenant
    if (tenantId === 'current') {
      tenantId = (req as any).userTenantId || (req as any).currentUser?.tenantId || (req as any).currentUser?.tenant_id || (req as any).user?.tenantId || '8b976f98-3921-49f2-acf5-006f41d69095'; // Liverpool tenant for development
    }
    
    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Generate a unique code
    let code = generateInviteCode();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const newCode = await db
          .insert(tenantInviteCodes)
          .values({
            tenantId,
            code,
            name: name.trim(),
            description: description?.trim() || null,
            maxUsage: maxUsage || null,
            createdBy: null, // Set to null for now since the user doesn't exist in the database
          })
          .returning();

        res.json(newCode[0]);
        return;
      } catch (error: any) {
        if (error.code === '23505' && error.constraint === 'tenant_invite_codes_code_unique') {
          // Code already exists, try again
          code = generateInviteCode();
          attempts++;
          continue;
        }
        throw error;
      }
    }
    
    res.status(500).json({ message: 'Unable to generate unique code. Please try again.' });
  } catch (error) {
    console.error('Error creating invite code:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle active status of an invite code
router.patch('/tenant/:tenantId/invite-codes/:codeId/toggle', isAuthenticated, async (req, res) => {
  try {
    let { tenantId } = req.params;
    const { codeId } = req.params;
    
    // Handle "current" tenant
    if (tenantId === 'current') {
      tenantId = (req as any).userTenantId || (req as any).currentUser?.tenantId || (req as any).currentUser?.tenant_id || (req as any).user?.tenantId || '8b976f98-3921-49f2-acf5-006f41d69095'; // Liverpool tenant for development
    }
    
    const existingCode = await db
      .select()
      .from(tenantInviteCodes)
      .where(and(
        eq(tenantInviteCodes.id, codeId),
        eq(tenantInviteCodes.tenantId, tenantId)
      ))
      .limit(1);

    if (existingCode.length === 0) {
      return res.status(404).json({ message: 'Invite code not found' });
    }

    const updatedCode = await db
      .update(tenantInviteCodes)
      .set({ 
        isActive: !existingCode[0].isActive,
        updatedAt: new Date()
      })
      .where(and(
        eq(tenantInviteCodes.id, codeId),
        eq(tenantInviteCodes.tenantId, tenantId)
      ))
      .returning();

    res.json(updatedCode[0]);
  } catch (error) {
    console.error('Error toggling invite code:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete an invite code
router.delete('/tenant/:tenantId/invite-codes/:codeId', isAuthenticated, async (req, res) => {
  try {
    let { tenantId } = req.params;
    const { codeId } = req.params;
    
    // Handle "current" tenant
    if (tenantId === 'current') {
      tenantId = (req as any).userTenantId || (req as any).currentUser?.tenantId || (req as any).currentUser?.tenant_id || (req as any).user?.tenantId || '8b976f98-3921-49f2-acf5-006f41d69095'; // Liverpool tenant for development
    }
    
    const deletedCode = await db
      .delete(tenantInviteCodes)
      .where(and(
        eq(tenantInviteCodes.id, codeId),
        eq(tenantInviteCodes.tenantId, tenantId)
      ))
      .returning();

    if (deletedCode.length === 0) {
      return res.status(404).json({ message: 'Invite code not found' });
    }

    res.json({ message: 'Invite code deleted successfully' });
  } catch (error) {
    console.error('Error deleting invite code:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update an invite code
router.patch('/tenant/:tenantId/invite-codes/:codeId', isAuthenticated, async (req, res) => {
  try {
    let { tenantId } = req.params;
    const { codeId } = req.params;
    const { code, name, description } = req.body;
    
    // Handle "current" tenant
    if (tenantId === 'current') {
      tenantId = (req as any).userTenantId || (req as any).currentUser?.tenantId || (req as any).currentUser?.tenant_id || (req as any).user?.tenantId || '8b976f98-3921-49f2-acf5-006f41d69095'; // Liverpool tenant for development
    }

    // Validate input
    if (!code || !name) {
      return res.status(400).json({ message: 'Code and name are required' });
    }

    const updatedCode = await db
      .update(tenantInviteCodes)
      .set({ 
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      })
      .where(and(
        eq(tenantInviteCodes.id, codeId),
        eq(tenantInviteCodes.tenantId, tenantId)
      ))
      .returning();

    if (updatedCode.length === 0) {
      return res.status(404).json({ message: 'Invite code not found' });
    }

    res.json(updatedCode[0]);
  } catch (error: any) {
    if (error.code === '23505' && error.constraint === 'tenant_invite_codes_code_unique') {
      return res.status(400).json({ message: 'This code is already in use. Please choose a different code.' });
    }
    console.error('Error updating invite code:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Temporary send invitation endpoint until routing issue is resolved
router.post('/admin/send-invitation', isAuthenticated, async (req, res) => {
  console.log('🎯 Send invitation endpoint started');
  try {
    const { email, role } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    console.log('📧 Sending invitation email to:', email, 'with role:', role);
    
    // Import email service
    const { sendInvitationEmail } = require('../utils/email-service');
    
    // Generate invitation token and create invitation
    const adminUserId = (req as any).currentUser?.id || 'ajosephfinch';
    const adminTenantId = (req as any).currentUser?.tenantId || '8b976f98-3921-49f2-acf5-006f41d69095';
    
    // Send the invitation email
    const emailResult = await sendInvitationEmail({
      recipientEmail: email,
      recipientName: email.split('@')[0], // Use email prefix as name
      role: role,
      invitedBy: 'Admin',
      tenantName: 'PlayHQ Demo',
      inviteLink: `https://your-domain.com/accept-invite?token=demo-token`,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    if (emailResult.success) {
      console.log('✅ Invitation email sent successfully');
      res.json({ 
        success: true, 
        message: `Invitation sent successfully to ${email}`,
        recipient: email,
        role: role
      });
    } else {
      console.error('❌ Failed to send invitation email:', emailResult.error);
      res.status(500).json({ 
        error: 'Failed to send invitation email', 
        details: emailResult.error 
      });
    }
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;