import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// Store active impersonation sessions in memory (in production, use Redis or DB)
const impersonationSessions = new Map<string, {
  superAdminId: string;
  tenantId: string;
  createdAt: Date;
  expiresAt: Date;
}>();

// Create impersonation session
router.post('/api/super-admin/impersonate', async (req, res) => {
  try {
    // Check if user is super admin
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Store session (expires in 4 hours)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    
    impersonationSessions.set(sessionToken, {
      superAdminId: req.user.id,
      tenantId,
      createdAt: now,
      expiresAt
    });

    // Clean up expired sessions
    for (const [token, session] of impersonationSessions.entries()) {
      if (session.expiresAt < now) {
        impersonationSessions.delete(token);
      }
    }

    res.json({ 
      sessionToken,
      expiresAt
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({ error: 'Failed to create impersonation session' });
  }
});

// End impersonation session
router.post('/api/super-admin/impersonate/end', async (req, res) => {
  try {
    const { sessionToken } = req.body;
    
    if (sessionToken && impersonationSessions.has(sessionToken)) {
      impersonationSessions.delete(sessionToken);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('End impersonation error:', error);
    res.status(500).json({ error: 'Failed to end impersonation session' });
  }
});

// Validate impersonation session (middleware)
export function validateImpersonation(req: any, res: any, next: any) {
  const impersonateToken = req.query.impersonate || req.headers['x-impersonate-token'];
  
  if (impersonateToken) {
    const session = impersonationSessions.get(impersonateToken);
    
    if (session && session.expiresAt > new Date()) {
      // Set tenant context for impersonation
      req.impersonationSession = session;
      req.tenantId = session.tenantId;
      req.isSuperAdminImpersonating = true;
    }
  }
  
  next();
}

export default router;