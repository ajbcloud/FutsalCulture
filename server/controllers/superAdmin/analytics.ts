import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { 
  payments, 
  tenants,
  players,
  users,
  futsalSessions,
  signups
} from '../../../shared/schema';
import { eq, and, gte, lte, count, sql, desc, sum, isNotNull } from 'drizzle-orm';

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
 * 
 * Database Mapping:
 * Platform lane: Uses tenant_invoices/tenant_payments (when implemented)
 * Commerce lane: Uses payments table (parent-to-tenant payments), registrations table
 * 
 * Returns cards + small tables based on lane selection
 */
export async function overview(req: Request, res: Response) {
  try {
    const { lane, status, from, to, tenantId } = analyticsQuerySchema.parse(req.query);
    
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();
    
    if (lane === 'platform') {
      // Platform Revenue (subscription payments to QIT)
      // Mock data since tenant_invoices/tenant_payments not implemented yet
      const platformData = {
        platformRevenue: 189700, // Total platform revenue in cents
        mrr: 189700 / 100, // Monthly recurring revenue
        arr: (189700 / 100) * 12, // Annual recurring revenue
        activeTenants: 8,
        planMix: [
          { plan: 'Core', count: 3, percentage: 37.5 },
          { plan: 'Growth', count: 3, percentage: 37.5 },
          { plan: 'Elite', count: 2, percentage: 25.0 }
        ],
        failedCount: 2,
        outstandingReceivables: 59700,
        topTenantsByPlatformRevenue: [
          { tenantId: 'tenant-1', tenantName: 'Elite Footwork Academy', revenue: 49900 },
          { tenantId: 'tenant-2', tenantName: 'Metro Futsal', revenue: 39900 },
          { tenantId: 'tenant-3', tenantName: 'Futsal Culture', revenue: 19900 }
        ],
        churnCandidates: [
          { tenantId: 'tenant-4', tenantName: 'Inactive Club', lastPayment: '2024-12-15', daysSince: 40 }
        ]
      };
      
      res.json(platformData);
    } else if (lane === 'kpis') {
      // KPI Dashboard - combination of both platform and commerce data
      const kpiData = {
        totalRevenue: 189700 + 45320, // Platform + Commerce
        mrr: 189700 / 100,
        activeTenants: 8,
        totalPlayers: 156,
        monthlyGrowth: 15.2,
        commerceRevenue: 45320,
        failedPayments: 12,
        refundCount: 3
      };
      
      res.json(kpiData);
    } else {
      // Commerce Revenue (parent-to-tenant payments)
      let whereConditions = [];
      
      if (status !== 'all') {
        whereConditions.push(eq(payments.status, status));
      }
      if (tenantId) {
        whereConditions.push(eq(payments.tenantId, tenantId));
      }
      whereConditions.push(gte(payments.createdAt, startDate));
      whereConditions.push(lte(payments.createdAt, endDate));
      
      // Commerce revenue from payments table
      const commerceRevenue = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`,
          count: count()
        })
        .from(payments)
        .where(and(...whereConditions));
      
      // Failed payments (using 'refunded' as closest to failed)
      const failedPayments = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`,
          count: count()
        })
        .from(payments)
        .where(and(
          eq(payments.status, 'refunded'),
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate),
          tenantId ? eq(payments.tenantId, tenantId) : sql`1=1`
        ));
      
      // Refunds (negative amounts)
      const refunds = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(ABS(${payments.amountCents})), 0)`,
          count: count()
        })
        .from(payments)
        .where(and(
          sql`${payments.amountCents} < 0`,
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate),
          tenantId ? eq(payments.tenantId, tenantId) : sql`1=1`
        ));
      
      // Total registrations
      const totalRegistrations = await db
        .select({ count: count() })
        .from(signups)
        .where(and(
          gte(signups.createdAt, startDate),
          lte(signups.createdAt, endDate),
          tenantId ? eq(signups.tenantId, tenantId) : sql`1=1`
        ));
      
      // Active players (players with payments in date range - using signupId)
      const activePlayers = await db
        .selectDistinct({ signupId: payments.signupId })
        .from(payments)
        .where(and(...whereConditions));
      
      // Top tenants by commerce revenue
      const topTenantsByCommerceRevenue = await db
        .select({
          tenantId: payments.tenantId,
          tenantName: tenants.name,
          revenue: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`
        })
        .from(payments)
        .leftJoin(tenants, eq(payments.tenantId, tenants.id))
        .where(and(...whereConditions))
        .groupBy(payments.tenantId, tenants.name)
        .orderBy(desc(sql`COALESCE(SUM(${payments.amountCents}), 0)`))
        .limit(5);
      
      const commerceData = {
        commerceRevenue: commerceRevenue[0]?.total || 0,
        netRevenue: (commerceRevenue[0]?.total || 0) - (refunds[0]?.total || 0),
        failedCount: failedPayments[0]?.count || 0,
        refundCount: refunds[0]?.count || 0,
        totalRegistrations: totalRegistrations[0]?.count || 0,
        activePlayers: activePlayers.length,
        avgTicket: commerceRevenue[0]?.count ? Math.round((commerceRevenue[0]?.total || 0) / commerceRevenue[0].count) : 0,
        revenuePerPlayer: activePlayers.length ? Math.round((commerceRevenue[0]?.total || 0) / activePlayers.length) : 0,
        topTenantsByCommerceRevenue: topTenantsByCommerceRevenue.map(t => ({
          tenantId: t.tenantId,
          tenantName: t.tenantName || 'Unknown',
          revenue: t.revenue
        }))
      };
      
      res.json(commerceData);
    }
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
}

/**
 * Analytics Series Endpoint
 * 
 * Database Mapping:
 * Platform: tenant_invoices/tenant_payments (when implemented)
 * Commerce: payments table + registrations table
 */
export async function series(req: Request, res: Response) {
  try {
    const { lane, status, from, to, tenantId, interval } = analyticsQuerySchema.parse(req.query);
    
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();
    
    if (lane === 'platform') {
      // Mock platform series data - replace with tenant_invoices when implemented
      const mockSeries = [];
      const current = new Date(startDate);
      
      while (current <= endDate) {
        mockSeries.push({
          date: current.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 2000) + 1000, // Platform revenue
          registrations: 0 // Not applicable for platform
        });
        
        if (interval === 'week') {
          current.setDate(current.getDate() + 7);
        } else if (interval === 'month') {
          current.setMonth(current.getMonth() + 1);
        } else {
          current.setDate(current.getDate() + 1);
        }
      }
      
      res.json({ series: mockSeries });
    } else if (lane === 'kpis') {
      // KPI series - mock combined data
      const kpiSeries = [];
      const current = new Date(startDate);
      
      while (current <= endDate) {
        kpiSeries.push({
          date: current.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 3000) + 2000, // Combined revenue
          registrations: Math.floor(Math.random() * 10) + 5
        });
        
        if (interval === 'week') {
          current.setDate(current.getDate() + 7);
        } else if (interval === 'month') {
          current.setMonth(current.getMonth() + 1);
        } else {
          current.setDate(current.getDate() + 1);
        }
      }
      
      res.json({ series: kpiSeries });
    } else {
      // Commerce series from real payments + registrations data
      let dateFormat = 'YYYY-MM-DD';
      let truncFunction = 'DATE';
      
      if (interval === 'week') {
        dateFormat = 'YYYY-"W"WW';
        truncFunction = 'DATE_TRUNC(\'week\', ';
      } else if (interval === 'month') {
        dateFormat = 'YYYY-MM';
        truncFunction = 'DATE_TRUNC(\'month\', ';
      } else if (interval === 'year') {
        dateFormat = 'YYYY';
        truncFunction = 'DATE_TRUNC(\'year\', ';
      }
      
      // Revenue series
      let whereConditions = [];
      if (status !== 'all') {
        whereConditions.push(eq(payments.status, status));
      }
      if (tenantId) {
        whereConditions.push(eq(payments.tenantId, tenantId));
      }
      whereConditions.push(gte(payments.createdAt, startDate));
      whereConditions.push(lte(payments.createdAt, endDate));
      
      const revenueSeries = await db
        .select({
          date: sql<string>`TO_CHAR(${truncFunction}${payments.createdAt}${interval !== 'day' ? ')' : ''}, '${dateFormat}')`,
          revenue: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`
        })
        .from(payments)
        .where(and(...whereConditions))
        .groupBy(sql`TO_CHAR(${truncFunction}${payments.createdAt}${interval !== 'day' ? ')' : ''}, '${dateFormat}')`)
        .orderBy(sql`TO_CHAR(${truncFunction}${payments.createdAt}${interval !== 'day' ? ')' : ''}, '${dateFormat}')`);
      
      // Registration series
      let regWhereConditions = [];
      if (tenantId) {
        regWhereConditions.push(eq(signups.tenantId, tenantId));
      }
      regWhereConditions.push(gte(signups.createdAt, startDate));
      regWhereConditions.push(lte(signups.createdAt, endDate));
      
      const registrationSeries = await db
        .select({
          date: sql<string>`TO_CHAR(${truncFunction}${signups.createdAt}${interval !== 'day' ? ')' : ''}, '${dateFormat}')`,
          registrations: count()
        })
        .from(signups)
        .where(and(...regWhereConditions))
        .groupBy(sql`TO_CHAR(${truncFunction}${signups.createdAt}${interval !== 'day' ? ')' : ''}, '${dateFormat}')`)
        .orderBy(sql`TO_CHAR(${truncFunction}${signups.createdAt}${interval !== 'day' ? ')' : ''}, '${dateFormat}')`);
      
      // Merge revenue and registration series
      const seriesMap = new Map();
      
      revenueSeries.forEach(item => {
        seriesMap.set(item.date, { date: item.date, revenue: item.revenue, registrations: 0 });
      });
      
      registrationSeries.forEach(item => {
        const existing = seriesMap.get(item.date);
        if (existing) {
          existing.registrations = item.registrations;
        } else {
          seriesMap.set(item.date, { date: item.date, revenue: 0, registrations: item.registrations });
        }
      });
      
      const series = Array.from(seriesMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      
      res.json({ series });
    }
  } catch (error) {
    console.error('Analytics series error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics series' });
  }
}

/**
 * Analytics By Tenant Endpoint
 * 
 * Database Mapping:
 * Platform: tenant_invoices/tenant_payments aggregated by tenant_id
 * Commerce: payments table + registrations aggregated by tenant_id
 */
export async function byTenant(req: Request, res: Response) {
  try {
    const { lane, status, from, to, tenantId } = analyticsQuerySchema.parse(req.query);
    const { page, pageSize } = paginationSchema.parse(req.query);
    
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();
    const offset = (page - 1) * pageSize;
    
    if (lane === 'platform') {
      // Mock platform data - replace with tenant_invoices when implemented
      const allRows = [
        { tenantId: 'tenant-1', tenantName: 'Elite Footwork Academy', revenue: 49900, transactions: 1, failed: 0, refunds: 0 },
        { tenantId: 'tenant-2', tenantName: 'Metro Futsal', revenue: 39900, transactions: 1, failed: 0, refunds: 0 },
        { tenantId: 'tenant-3', tenantName: 'Futsal Culture', revenue: 19900, transactions: 1, failed: 1, refunds: 0 },
        { tenantId: 'tenant-4', tenantName: 'City Soccer Club', revenue: 19900, transactions: 1, failed: 0, refunds: 0 },
        { tenantId: 'tenant-5', tenantName: 'Youth Development FC', revenue: 9900, transactions: 1, failed: 0, refunds: 0 }
      ];
      
      const filteredRows = tenantId ? allRows.filter(r => r.tenantId === tenantId) : allRows;
      const rows = filteredRows.slice(offset, offset + pageSize);
      
      res.json({
        rows,
        page,
        pageSize,
        totalRows: filteredRows.length
      });
    } else if (lane === 'kpis') {
      // KPI tenant breakdown - mock combined data
      const kpiRows = [
        { tenantId: 'tenant-1', tenantName: 'Elite Footwork Academy', revenue: 52400, transactions: 45, failed: 1, refunds: 0 },
        { tenantId: 'tenant-2', tenantName: 'Metro Futsal', revenue: 41200, transactions: 38, failed: 0, refunds: 1 },
        { tenantId: 'tenant-3', tenantName: 'Futsal Culture', revenue: 28700, transactions: 32, failed: 2, refunds: 0 },
        { tenantId: 'tenant-4', tenantName: 'City Soccer Club', revenue: 21800, transactions: 28, failed: 0, refunds: 0 },
        { tenantId: 'tenant-5', tenantName: 'Youth Development FC', revenue: 15200, transactions: 19, failed: 1, refunds: 1 }
      ];
      
      const filteredRows = tenantId ? kpiRows.filter(r => r.tenantId === tenantId) : kpiRows;
      const rows = filteredRows.slice(offset, offset + pageSize);
      
      res.json({
        rows,
        page,
        pageSize,
        totalRows: filteredRows.length
      });
    } else {
      // Commerce data from real payments table
      let whereConditions = [];
      
      if (status !== 'all') {
        whereConditions.push(eq(payments.status, status));
      }
      if (tenantId) {
        whereConditions.push(eq(payments.tenantId, tenantId));
      }
      whereConditions.push(gte(payments.createdAt, startDate));
      whereConditions.push(lte(payments.createdAt, endDate));
      
      // Get tenant revenue aggregated
      const tenantRows = await db
        .select({
          tenantId: payments.tenantId,
          tenantName: tenants.name,
          revenue: sql<number>`COALESCE(SUM(CASE WHEN ${payments.amountCents} > 0 THEN ${payments.amountCents} ELSE 0 END), 0)`,
          transactions: count(),
          failed: sql<number>`COALESCE(SUM(CASE WHEN ${payments.status} = 'refunded' THEN 1 ELSE 0 END), 0)`,
          refunds: sql<number>`COALESCE(SUM(CASE WHEN ${payments.amountCents} < 0 THEN 1 ELSE 0 END), 0)`
        })
        .from(payments)
        .leftJoin(tenants, eq(payments.tenantId, tenants.id))
        .where(and(...whereConditions))
        .groupBy(payments.tenantId, tenants.name)
        .orderBy(desc(sql`COALESCE(SUM(CASE WHEN ${payments.amountCents} > 0 THEN ${payments.amountCents} ELSE 0 END), 0)`))
        .limit(pageSize)
        .offset(offset);
      
      // Get total count for pagination
      const totalCount = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${payments.tenantId})` })
        .from(payments)
        .where(and(...whereConditions));
      
      res.json({
        rows: tenantRows.map(row => ({
          tenantId: row.tenantId,
          tenantName: row.tenantName || 'Unknown',
          revenue: row.revenue,
          transactions: row.transactions,
          failed: row.failed,
          refunds: row.refunds
        })),
        page,
        pageSize,
        totalRows: totalCount[0]?.count || 0
      });
    }
  } catch (error) {
    console.error('Analytics by tenant error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant analytics' });
  }
}