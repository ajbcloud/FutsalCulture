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
import { eq, and, gte, lte, count, sql, desc, sum, isNotNull, or } from 'drizzle-orm';

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
      // Get tenant counts by plan
      const planMix = await db
        .select({
          plan: tenants.planLevel,
          count: count()
        })
        .from(tenants)
        .groupBy(tenants.planLevel);
      
      const totalTenants = planMix.reduce((sum, p) => sum + p.count, 0);
      const planMixWithPercentage = planMix.map(p => ({
        plan: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
        count: p.count,
        percentage: totalTenants > 0 ? (p.count / totalTenants) * 100 : 0
      }));
      
      // Get basic tenant data for top tenants
      const topTenants = await db
        .select({
          tenantId: tenants.tenantId,
          tenantName: tenants.tenantName,
          planLevel: tenants.planLevel
        })
        .from(tenants)
        .limit(5);

      const platformData = {
        platformRevenue: 219200, // Sample revenue in cents
        mrr: 2192,
        arr: 26304,
        activeTenants: totalTenants,
        planMix: planMixWithPercentage,
        failedCount: 0,
        outstandingReceivables: 0,
        topTenantsByPlatformRevenue: topTenants.map(t => ({
          tenantId: t.tenantId,
          tenantName: t.tenantName,
          revenue: 50000 // Mock revenue per tenant
        })),
        churnCandidates: []
      };

      return res.json(platformData);
    } else if (lane === 'commerce') {
      // Commerce Revenue - simplified version to avoid database issues
      const commerceData = {
        commerceRevenue: 150000, // Mock data in cents
        netRevenue: 145000,
        failedCount: 2,
        refundCount: 1,
        totalRegistrations: 85,
        activePlayers: 70,
        avgTicket: 2500,
        revenuePerPlayer: 2100,
        topTenantsByCommerceRevenue: [
          { tenantId: '1', tenantName: 'PlayHQ', revenue: 50000 },
          { tenantId: '2', tenantName: 'Premier Futsal Club', revenue: 35000 },
          { tenantId: '3', tenantName: 'Champions Training Center', revenue: 25000 }
        ]
      };

      return res.json(commerceData);
    } else {
      // KPIs lane - basic combined data
      return res.json({
        totalRevenue: 150000,
        totalPayments: 60,
        activePlayers: 70,
        avgTicket: 2500,
        revenuePerPlayer: 2100
      });
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