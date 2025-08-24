import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { impersonationEvents, auditLogs, tenants, platformSettings } from '../../../shared/schema';

const SECRET = process.env.IMPERSONATION_SECRET || 'fallback-secret-for-dev';
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost:5000';

export async function start(req: Request, res: Response) {
  try {
    if (!SECRET || !ROOT_DOMAIN) {
      return res.status(500).json({ error: 'server_misconfig' });
    }

    // Check platform policy (optional)
    const policyResult = await db.select({ allowImpersonation: platformSettings.allowImpersonation })
      .from(platformSettings)
      .limit(1);
    
    const policy = policyResult[0]?.allowImpersonation ?? true;
    if (!policy) {
      return res.status(403).json({ error: 'impersonation_disabled' });
    }

    const { tenantId, reason } = req.body as { tenantId?: string; reason?: string };
    if (!tenantId || !reason) {
      return res.status(400).json({ error: 'tenantId and reason required' });
    }

    // Get tenant info
    const tenantResult = await db.select({
      id: tenants.id,
      subdomain: tenants.subdomain,
      name: tenants.name
    }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);

    const tenant = tenantResult[0];
    if (!tenant) {
      return res.status(404).json({ error: 'tenant_not_found' });
    }

    const jti = uuid();
    const now = new Date();
    const exp = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    // Create impersonation event
    const eventResult = await db.insert(impersonationEvents).values({
      tenantId,
      superAdminId: (req as any).user.id,
      reason,
      jti,
      startedAt: now,
      expiresAt: exp,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || ''
    }).returning({ id: impersonationEvents.id });

    const event = eventResult[0];

    // Create JWT token
    const token = jwt.sign(
      {
        iss: 'super-admin',
        aud: 'tenant-app',
        sub: (req as any).user.id,
        tenantId,
        tenantSub: tenant.subdomain,
        jti,
        typ: 'impersonation'
      },
      SECRET,
      { expiresIn: '5m' }
    );

    // Create impersonation URL
    const url = `https://${tenant.subdomain}.${ROOT_DOMAIN}/impersonate?token=${encodeURIComponent(token)}`;

    // Audit log
    await db.insert(auditLogs).values({
      tenantId,
      userId: (req as any).user.id,
      actorId: (req as any).user.id,
      actorRole: 'super_admin',
      section: 'impersonation',
      action: 'start',
      targetId: tenantId,
      meta: { reason, jti, tenantName: tenant.name },
      ip: req.ip || '',
      isImpersonated: false,
      impersonatorId: (req as any).user.id,
      impersonationEventId: event.id
    });

    res.json({ url, eventId: event.id });
  } catch (error) {
    console.error('Impersonation start error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
}