import { Request, Response } from 'express';
import { storage } from '../../storage';
import { db } from '../../db';
import { tenants, payments, users, players, futsalSessions, signups, auditLogs } from '../../../shared/schema';
import { eq, desc, sql, gte, lte, and, isNotNull } from 'drizzle-orm';

/**
 * Platform Overview Stats
 * 
 * Database Mapping:
 * - Platform revenue: payments table, status='paid', sum(amount)
 * - Players: players table, count(*)
 * - Active tenants: tenants table, count(*)
 * - Sessions: sessions table, created_at in range, count(*)
 * - Pending platform payments: payments, status='pending', count(*)
 */
export async function getStats(req: Request, res: Response) {
  try {
    const { tenantId, from, to } = req.query as { tenantId?: string, from?: string, to?: string };
    
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Get real stats from storage methods
    const totalPlatformRevenue = await storage.getSuperAdminTotalRevenue();
    const totalPlayers = await storage.getSuperAdminPlayerCount();
    const activeTenants = (await storage.getTenants()).length;
    
    // Get session count with date filtering
    let sessionConditions = [];
    if (from || to) {
      if (from) sessionConditions.push(gte(futsalSessions.startTime, fromDate));
      if (to) sessionConditions.push(lte(futsalSessions.startTime, toDate));
    }
    
    const sessionCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(futsalSessions)
      .where(sessionConditions.length > 0 ? and(...sessionConditions) : undefined);
    
    // Get pending payments count
    const pendingPayments = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(payments)
      .where(eq(payments.status, 'pending'));

    const stats = {
      totalPlatformRevenue: totalPlatformRevenue / 100, // Convert cents to dollars
      totalPlayers,
      activeTenants,
      totalSessions: Number(sessionCount[0]?.count || 0),
      pendingPlatformPayments: Number(pendingPayments[0]?.count || 0)
    };

    // Get top tenants by revenue (real data)
    const topTenantsByRevenue = await db
      .select({
        tenant: tenants.name,
        revenue: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`
      })
      .from(tenants)
      .leftJoin(payments, eq(tenants.id, payments.tenantId))
      .where(eq(payments.status, 'paid'))
      .groupBy(tenants.id, tenants.name)
      .orderBy(desc(sql`COALESCE(SUM(${payments.amountCents}), 0)`))
      .limit(5);

    const topTenantsByPlatformRevenue = topTenantsByRevenue.map(t => ({
      tenant: t.tenant,
      revenue: Number(t.revenue) / 100 // Convert cents to dollars
    }));

    // Get recent activity from audit logs or recent signups/payments
    const recentPayments = await db
      .select({
        id: payments.id,
        when: payments.paidAt,
        tenantName: tenants.name,
        amount: payments.amountCents
      })
      .from(payments)
      .leftJoin(tenants, eq(payments.tenantId, tenants.id))
      .where(and(eq(payments.status, 'paid'), isNotNull(payments.paidAt)))
      .orderBy(desc(payments.paidAt))
      .limit(5);

    const recentTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        createdAt: tenants.createdAt
      })
      .from(tenants)
      .orderBy(desc(tenants.createdAt))
      .limit(5);

    const recentUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
        tenantName: tenants.name
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .orderBy(desc(users.createdAt))
      .limit(5);

    // Combine and sort recent activity
    const recentActivity = [
      ...recentPayments.map(p => ({
        id: `payment-${p.id}`,
        when: p.when?.toISOString() || new Date().toISOString(),
        text: `Payment received $${(p.amount / 100).toFixed(2)} from ${p.tenantName}`
      })),
      ...recentTenants.map(t => ({
        id: `tenant-${t.id}`,
        when: t.createdAt?.toISOString() || new Date().toISOString(),
        text: `New tenant ${t.name} activated`
      })),
      ...recentUsers.map(u => ({
        id: `user-${u.id}`,
        when: u.createdAt?.toISOString() || new Date().toISOString(),
        text: `New user ${u.firstName} ${u.lastName} registered${u.tenantName ? ` at ${u.tenantName}` : ''}`
      }))
    ]
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
      .slice(0, 10);

    console.log(`Super Admin: platform stats retrieved by ${(req as any).user?.id || 'unknown'}`);

    res.json({
      totals: stats,
      topTenantsByPlatformRevenue,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching platform overview stats:', error);
    res.status(500).json({ message: 'Failed to fetch platform overview stats' });
  }
}