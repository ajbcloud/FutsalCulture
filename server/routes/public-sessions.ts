import { Router, Request, Response } from 'express';
import { db } from '../db';
import { futsalSessions, tenants, signups } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

const router = Router();

router.get('/:tenantSlug/sessions', async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    
    if (!tenantSlug) {
      return res.status(400).json({ error: 'Tenant slug is required' });
    }

    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const now = new Date();

    const sessions = await db.select({
      id: futsalSessions.id,
      title: futsalSessions.title,
      location: futsalSessions.location,
      locationName: futsalSessions.locationName,
      city: futsalSessions.city,
      state: futsalSessions.state,
      ageGroups: futsalSessions.ageGroups,
      genders: futsalSessions.genders,
      startTime: futsalSessions.startTime,
      endTime: futsalSessions.endTime,
      capacity: futsalSessions.capacity,
      priceCents: futsalSessions.priceCents,
      status: futsalSessions.status,
      visibility: futsalSessions.visibility,
      hasAccessCode: futsalSessions.hasAccessCode,
    })
    .from(futsalSessions)
    .where(
      and(
        eq(futsalSessions.tenantId, tenant.id),
        sql`${futsalSessions.visibility} IN ('public', 'access_code_required')`,
        gte(futsalSessions.startTime, now)
      )
    );

    const sessionIds = sessions.map(s => s.id);
    
    let signupCounts: Record<string, number> = {};
    if (sessionIds.length > 0) {
      const counts = await db.select({
        sessionId: signups.sessionId,
        count: sql<number>`count(*)::int`
      })
      .from(signups)
      .where(sql`${signups.sessionId} = ANY(${sessionIds})`)
      .groupBy(signups.sessionId);
      
      signupCounts = counts.reduce((acc, row) => {
        acc[row.sessionId] = row.count;
        return acc;
      }, {} as Record<string, number>);
    }

    const sessionsWithCounts = sessions.map(session => ({
      ...session,
      signupsCount: signupCounts[session.id] || 0,
      spotsRemaining: session.capacity - (signupCounts[session.id] || 0)
    }));

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      sessions: sessionsWithCounts
    });
  } catch (error) {
    console.error('Error fetching public sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/:tenantSlug/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { tenantSlug, sessionId } = req.params;
    const { accessCode } = req.query;
    
    if (!tenantSlug || !sessionId) {
      return res.status(400).json({ error: 'Tenant slug and session ID are required' });
    }

    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const [session] = await db.select()
      .from(futsalSessions)
      .where(
        and(
          eq(futsalSessions.id, sessionId),
          eq(futsalSessions.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.visibility === 'private') {
      return res.status(403).json({ 
        error: 'This session is private',
        requiresAuth: true 
      });
    }

    if (session.visibility === 'access_code_required') {
      if (!accessCode) {
        return res.status(403).json({ 
          error: 'Access code required',
          requiresAccessCode: true 
        });
      }
      
      const normalizedInput = String(accessCode).trim().toUpperCase();
      const normalizedStored = String(session.accessCode || '').trim().toUpperCase();
      
      if (normalizedInput !== normalizedStored) {
        return res.status(403).json({ 
          error: 'Invalid access code',
          requiresAccessCode: true 
        });
      }
    }

    const signupCount = await db.select({
      count: sql<number>`count(*)::int`
    })
    .from(signups)
    .where(eq(signups.sessionId, session.id));

    const count = signupCount[0]?.count || 0;

    const { accessCode: _, ...sessionWithoutCode } = session;
    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      session: {
        ...sessionWithoutCode,
        signupsCount: count,
        spotsRemaining: session.capacity - count
      }
    });
  } catch (error) {
    console.error('Error fetching public session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

export { router as publicSessionsRouter };
