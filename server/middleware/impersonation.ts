import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { impersonationEvents, auditLogs } from '../../shared/schema';

const SECRET = process.env.IMPERSONATION_SECRET || 'fallback-secret-for-dev';

interface ImpersonationToken {
  iss: string;
  aud: string;
  sub: string;
  tenantId: string;
  tenantSub: string;
  jti: string;
  typ: string;
}

export async function consumeImpersonationToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid token' });
    }

    let decoded: ImpersonationToken;
    try {
      decoded = jwt.verify(token, SECRET) as ImpersonationToken;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (decoded.typ !== 'impersonation' || !decoded.jti || !decoded.tenantId) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const eventResult = await db.select({
      id: impersonationEvents.id,
      superAdminId: impersonationEvents.superAdminId,
      tenantId: impersonationEvents.tenantId,
      usedAt: impersonationEvents.usedAt,
      endedAt: impersonationEvents.endedAt,
      expiresAt: impersonationEvents.expiresAt
    })
    .from(impersonationEvents)
    .where(eq(impersonationEvents.jti, decoded.jti))
    .limit(1);

    const event = eventResult[0];
    if (!event) {
      return res.status(401).json({ error: 'Impersonation event not found' });
    }

    if (event.endedAt) {
      return res.status(401).json({ error: 'Impersonation session has ended' });
    }

    if (event.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Impersonation token has expired' });
    }

    if (!event.usedAt) {
      await db.update(impersonationEvents)
        .set({ usedAt: new Date() })
        .where(eq(impersonationEvents.id, event.id));
    }

    (req as any).session.impersonation = {
      superAdminId: event.superAdminId,
      tenantId: event.tenantId,
      eventId: event.id,
      startedAt: new Date()
    };

    await db.insert(auditLogs).values({
      tenantId: event.tenantId,
      userId: event.superAdminId,
      actorId: event.superAdminId,
      actorRole: 'super_admin',
      section: 'impersonation',
      action: 'session_started',
      targetId: event.tenantId,
      meta: { eventId: event.id },
      ip: req.ip || '',
      isImpersonated: true,
      impersonatorId: event.superAdminId,
      impersonationEventId: event.id
    });

    res.redirect('/admin');
  } catch (error) {
    console.error('Impersonation token consumption error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function impersonationContext(req: Request, res: Response, next: NextFunction) {
  const impersonation = (req as any).session?.impersonation;
  
  if (impersonation) {
    (req as any).impersonation = {
      isImpersonated: true,
      superAdminId: impersonation.superAdminId,
      tenantId: impersonation.tenantId,
      eventId: impersonation.eventId,
      startedAt: impersonation.startedAt
    };
  } else {
    (req as any).impersonation = {
      isImpersonated: false
    };
  }
  
  next();
}

export async function endImpersonationSession(req: Request, res: Response) {
  try {
    const impersonation = (req as any).session?.impersonation;
    
    if (!impersonation) {
      return res.status(400).json({ error: 'No active impersonation session' });
    }
    
    await db.update(impersonationEvents)
      .set({ endedAt: new Date() })
      .where(eq(impersonationEvents.id, impersonation.eventId));
    
    await db.insert(auditLogs).values({
      tenantId: impersonation.tenantId,
      userId: impersonation.superAdminId,
      actorId: impersonation.superAdminId,
      actorRole: 'super_admin',
      section: 'impersonation',
      action: 'session_ended',
      targetId: impersonation.tenantId,
      meta: { eventId: impersonation.eventId },
      ip: req.ip || '',
      isImpersonated: true,
      impersonatorId: impersonation.superAdminId,
      impersonationEventId: impersonation.eventId
    });
    
    delete (req as any).session.impersonation;
    
    res.json({ success: true, message: 'Impersonation session ended' });
  } catch (error) {
    console.error('Error ending impersonation session:', error);
    res.status(500).json({ error: 'Failed to end impersonation session' });
  }
}