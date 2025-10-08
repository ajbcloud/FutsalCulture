import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { 
  payments, 
  tenants,
  players,
  users,
  futsalSessions,
  signups,
  auditLogs
} from '../../../shared/schema';
import { eq, and, gte, lte, count, sql, desc, sum, isNotNull, or, countDistinct } from 'drizzle-orm';

// Validation schemas
const analyticsQuerySchema = z.object({
  lane: z.enum(['platform', 'commerce', 'kpis']),
  status: z.enum(['all', 'paid', 'pending', 'refunded']).default('all'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  tenantId: z.string().uuid().optional(),
  interval: z.enum(['day', 'week', 'month', 'year']).default('day')
});

const paginationSchema = z.object({
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(25)
});

/**
 * Analytics Overview Endpoint
 */
export async function overview(req: Request, res: Response) {
  try {
    const { lane, status, from, to, tenantId } = analyticsQuerySchema.parse(req.query);
    
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();
    
    if (lane === 'platform') {
      // Get tenant counts by plan with real data
      const planMix = await db
        .select({
          plan: tenants.planLevel,
          count: count()
        })
        .from(tenants)
        .groupBy(tenants.planLevel);
      
      const totalTenants = planMix.reduce((sum, p) => sum + p.count, 0);
      const planMixWithPercentage = planMix.map(p => ({
        plan: p.plan ? p.plan.charAt(0).toUpperCase() + p.plan.slice(1) : 'Free',
        count: p.count,
        percentage: totalTenants > 0 ? (p.count / totalTenants) * 100 : 0
      }));
      
      // Get real platform revenue based on date range
      const platformRevenue = await db
        .select({
          total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`
        })
        .from(payments)
        .where(
          and(
            eq(payments.status, 'paid'),
            from ? gte(payments.paidAt, startDate) : sql`true`,
            to ? lte(payments.paidAt, endDate) : sql`true`
          )
        );
      
      // Calculate MRR (Monthly Recurring Revenue) - last 30 days of revenue
      const lastMonthStart = new Date();
      lastMonthStart.setDate(lastMonthStart.getDate() - 30);
      const mrrResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`
        })
        .from(payments)
        .where(
          and(
            eq(payments.status, 'paid'),
            gte(payments.paidAt, lastMonthStart)
          )
        );
      const mrr = Number(mrrResult[0]?.total || 0) / 100;
      const arr = mrr * 12; // Annual Recurring Revenue
      
      // Get top tenants by revenue with real data
      const topTenantsRevenue = await db
        .select({
          tenantId: tenants.id,
          tenantName: tenants.name,
          planLevel: tenants.planLevel,
          revenue: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`
        })
        .from(tenants)
        .leftJoin(payments, and(
          eq(tenants.id, payments.tenantId),
          eq(payments.status, 'paid'),
          from ? gte(payments.paidAt, startDate) : sql`true`,
          to ? lte(payments.paidAt, endDate) : sql`true`
        ))
        .groupBy(tenants.id, tenants.name, tenants.planLevel)
        .orderBy(desc(sql`COALESCE(SUM(${payments.amountCents}), 0)`))
        .limit(5);
      
      // Get failed payment count
      const failedPayments = await db
        .select({ count: count() })
        .from(payments)
        .where(
          and(
            eq(payments.status, 'failed'),
            from ? gte(payments.createdAt, startDate) : sql`true`,
            to ? lte(payments.createdAt, endDate) : sql`true`
          )
        );
      
      // Get tenants at risk of churning (no payments in last 60 days)
      const churnRiskDate = new Date();
      churnRiskDate.setDate(churnRiskDate.getDate() - 60);
      const churnCandidates = await db
        .select({
          tenantId: tenants.id,
          tenantName: tenants.name,
          lastPayment: sql<Date>`MAX(${payments.paidAt})`
        })
        .from(tenants)
        .leftJoin(payments, and(
          eq(tenants.id, payments.tenantId),
          eq(payments.status, 'paid')
        ))
        .groupBy(tenants.id, tenants.name)
        .having(or(
          sql`MAX(${payments.paidAt}) < ${churnRiskDate}`,
          sql`MAX(${payments.paidAt}) IS NULL`
        ))
        .limit(10);

      const platformData = {
        platformRevenue: Number(platformRevenue[0]?.total || 0),
        mrr,
        arr,
        activeTenants: totalTenants,
        planMix: planMixWithPercentage,
        failedCount: failedPayments[0]?.count || 0,
        outstandingReceivables: 0, // Would need invoice table to calculate properly
        topTenantsByPlatformRevenue: topTenantsRevenue.map(t => ({
          tenantId: t.tenantId,
          tenantName: t.tenantName,
          revenue: Number(t.revenue) / 100
        })),
        churnCandidates: churnCandidates.map(c => ({
          tenantId: c.tenantId,
          tenantName: c.tenantName,
          lastPayment: c.lastPayment?.toISOString()
        }))
      };

      return res.json(platformData);
    } else if (lane === 'commerce') {
      // Get real commerce revenue data
      const commerceRevenue = await db
        .select({
          total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`,
          count: count()
        })
        .from(payments)
        .where(
          and(
            eq(payments.status, 'paid'),
            from ? gte(payments.paidAt, startDate) : sql`true`,
            to ? lte(payments.paidAt, endDate) : sql`true`
          )
        );
      
      // Get failed and refunded payments
      const failedStats = await db
        .select({
          failed: sql<number>`COUNT(CASE WHEN ${payments.status} = 'failed' THEN 1 END)`,
          refunded: sql<number>`COUNT(CASE WHEN ${payments.status} = 'refunded' THEN 1 END)`
        })
        .from(payments)
        .where(
          and(
            from ? gte(payments.createdAt, startDate) : sql`true`,
            to ? lte(payments.createdAt, endDate) : sql`true`
          )
        );
      
      // Get registration count (signups)
      const registrations = await db
        .select({ count: count() })
        .from(signups)
        .where(
          and(
            from ? gte(signups.signedUpAt, startDate) : sql`true`,
            to ? lte(signups.signedUpAt, endDate) : sql`true`
          )
        );
      
      // Get active player count
      const activePlayers = await db
        .select({ count: countDistinct(signups.playerId) })
        .from(signups)
        .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
        .where(
          and(
            from ? gte(futsalSessions.startTime, startDate) : sql`true`,
            to ? lte(futsalSessions.startTime, endDate) : sql`true`
          )
        );
      
      const totalRevenue = Number(commerceRevenue[0]?.total || 0);
      const paymentCount = commerceRevenue[0]?.count || 0;
      const avgTicket = paymentCount > 0 ? totalRevenue / paymentCount : 0;
      const playerCount = activePlayers[0]?.count || 0;
      const revenuePerPlayer = playerCount > 0 ? totalRevenue / playerCount : 0;
      
      // Get top tenants by commerce revenue
      const topTenantsByCommerce = await db
        .select({
          tenantId: tenants.id,
          tenantName: tenants.name,
          revenue: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`
        })
        .from(tenants)
        .leftJoin(payments, and(
          eq(tenants.id, payments.tenantId),
          eq(payments.status, 'paid'),
          from ? gte(payments.paidAt, startDate) : sql`true`,
          to ? lte(payments.paidAt, endDate) : sql`true`
        ))
        .groupBy(tenants.id, tenants.name)
        .orderBy(desc(sql`COALESCE(SUM(${payments.amountCents}), 0)`))
        .limit(5);

      const commerceData = {
        commerceRevenue: totalRevenue,
        netRevenue: totalRevenue * 0.97, // Assuming 3% processing fee
        failedCount: Number(failedStats[0]?.failed || 0),
        refundCount: Number(failedStats[0]?.refunded || 0),
        totalRegistrations: registrations[0]?.count || 0,
        activePlayers: playerCount,
        avgTicket: avgTicket / 100, // Convert cents to dollars
        revenuePerPlayer: revenuePerPlayer / 100,
        topTenantsByCommerceRevenue: topTenantsByCommerce.map(t => ({
          tenantId: t.tenantId,
          tenantName: t.tenantName,
          revenue: Number(t.revenue) / 100
        }))
      };

      return res.json(commerceData);
    } else {
      // KPIs lane - real combined data
      const kpiData = await db.transaction(async (tx) => {
        const revenue = await tx
          .select({ total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)` })
          .from(payments)
          .where(eq(payments.status, 'paid'));
        
        const paymentCount = await tx
          .select({ count: count() })
          .from(payments)
          .where(eq(payments.status, 'paid'));
        
        const playerCount = await tx
          .select({ count: count() })
          .from(players);
        
        const totalRevenue = Number(revenue[0]?.total || 0);
        const totalPayments = paymentCount[0]?.count || 0;
        const activePlayers = playerCount[0]?.count || 0;
        const avgTicket = totalPayments > 0 ? totalRevenue / totalPayments : 0;
        const revenuePerPlayer = activePlayers > 0 ? totalRevenue / activePlayers : 0;
        
        return {
          totalRevenue: totalRevenue / 100,
          totalPayments,
          activePlayers,
          avgTicket: avgTicket / 100,
          revenuePerPlayer: revenuePerPlayer / 100
        };
      });
      
      return res.json(kpiData);
    }
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
}

/**
 * Analytics Series Endpoint - Returns time series data for charts
 */
export async function series(req: Request, res: Response) {
  try {
    const { lane, status, from, to, tenantId, interval } = analyticsQuerySchema.parse(req.query);
    
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();
    
    // Return empty series while database schema is being fixed
    return res.json({ 
      series: []
    });
  } catch (error) {
    console.error('Analytics series error:', error);
    res.status(500).json({ message: 'Failed to fetch series data' });
  }
}

/**
 * Analytics By Tenant Endpoint - Returns tenant breakdown data
 */
export async function byTenant(req: Request, res: Response) {
  try {
    const { lane, status, from, to } = analyticsQuerySchema.parse(req.query);
    const { page, pageSize } = paginationSchema.parse(req.query);
    
    // Return empty tenant data for now
    return res.json({
      rows: [],
      page,
      pageSize,
      totalRows: 0
    });
  } catch (error) {
    console.error('Analytics by tenant error:', error);
    res.status(500).json({ message: 'Failed to fetch tenant data' });
  }
}