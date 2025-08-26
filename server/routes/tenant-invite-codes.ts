import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { tenantInviteCodes, insertTenantInviteCodeSchema } from '../../shared/schema';

const router = express.Router();

// Authentication middleware (similar to admin routes)
const requireAuth = (req: any, res: any, next: any) => {
  // Check for session or Replit auth or development mode
  const userId = req.session?.userId || req.user?.id || (process.env.NODE_ENV === 'development' ? 'ajosephfinch' : null);
  
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  req.currentUserId = userId;
  next();
};

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
router.get('/tenant/:tenantId/invite-codes', requireAuth, async (req, res) => {
  try {
    let { tenantId } = req.params;
    
    // Handle "current" tenant
    if (tenantId === 'current') {
      tenantId = (req as any).user?.tenantId || '8b976f98-3921-49f2-acf5-006f41d69095'; // Liverpool tenant for development
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
router.post('/tenant/:tenantId/invite-codes', requireAuth, async (req, res) => {
  try {
    let { tenantId } = req.params;
    const { name, description, maxUsage } = req.body;
    
    // Handle "current" tenant
    if (tenantId === 'current') {
      tenantId = (req as any).user?.tenantId || '8b976f98-3921-49f2-acf5-006f41d69095'; // Liverpool tenant for development
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
router.patch('/tenant/:tenantId/invite-codes/:codeId/toggle', requireAuth, async (req, res) => {
  try {
    let { tenantId } = req.params;
    const { codeId } = req.params;
    
    // Handle "current" tenant
    if (tenantId === 'current') {
      tenantId = (req as any).user?.tenantId || '8b976f98-3921-49f2-acf5-006f41d69095'; // Liverpool tenant for development
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
router.delete('/tenant/:tenantId/invite-codes/:codeId', requireAuth, async (req, res) => {
  try {
    let { tenantId } = req.params;
    const { codeId } = req.params;
    
    // Handle "current" tenant
    if (tenantId === 'current') {
      tenantId = (req as any).user?.tenantId || '8b976f98-3921-49f2-acf5-006f41d69095'; // Liverpool tenant for development
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

export default router;