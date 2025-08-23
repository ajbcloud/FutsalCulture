import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';

/**
 * Analytics Series Endpoint
 * 
 * Database Mapping:
 * - Platform revenue: tenant_invoices/tenant_payments table, status='completed', amount, created_at
 * - Client commerce revenue: payments table (parent-to-tenant), status='completed', amount, created_at  
 * - Registrations: registrations table, created_at
 */
export async function series(req: Request, res: Response) {
  const { from, to, interval = 'day' } = req.query as any;
  
  // Mock time series data with proper date range
  const startDate = from ? new Date(decodeURIComponent(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = to ? new Date(decodeURIComponent(to)) : new Date();
  
  const mockSeries = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    mockSeries.push({
      date: current.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 500) + 100,
      registrations: Math.floor(Math.random() * 20) + 5
    });
    
    if (interval === 'week') {
      current.setDate(current.getDate() + 7);
    } else if (interval === 'month') {
      current.setMonth(current.getMonth() + 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
  }

  console.log(`Super Admin: analytics series retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json({ series: mockSeries });
}

/**
 * Analytics By Tenant Endpoint
 * 
 * Database Mapping:
 * - Type 'platform': tenant_invoices/tenant_payments aggregated by tenant_id
 * - Type 'commerce': payments table aggregated by tenant_id (parent-to-tenant commerce)
 */
export async function byTenant(req: Request, res: Response) {
  const { from, to, type = 'platform' } = req.query as any;
  
  const rows = type === 'platform' ? [
    { tenant: 'Elite Footwork Academy', revenue: 19900, signups: 0, players: 33 },
    { tenant: 'Futsal Culture', revenue: 9900, signups: 0, players: 37 },
    { tenant: 'Metro Futsal', revenue: 16100, signups: 0, players: 28 }
  ] : [
    { tenant: 'Elite Footwork Academy', revenue: 45200, signups: 156, players: 33 },
    { tenant: 'Futsal Culture', revenue: 38900, signups: 142, players: 37 },
    { tenant: 'Metro Futsal', revenue: 44300, signups: 138, players: 28 }
  ];
  
  console.log(`Super Admin: analytics by tenant (${type}) retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json({ rows });
}

/**
 * Analytics Overview Endpoint
 * 
 * Database Mapping:
 * - Total platform revenue: tenant_invoices/tenant_payments, status='completed', sum(amount)
 * - Total tenant commerce: payments table (parent-to-tenant), status='completed', sum(amount)
 * - Active tenants: tenants table, status='active', count(*)
 * - Total players: players table, count(*)
 * - Failed platform payments: tenant_payments, status='failed', count(*), amount
 * - Failed commerce payments: payments, status='failed', count(*), amount
 * - Churn candidates: tenants with zero platform payments in last 30 days
 */
export async function overview(req: Request, res: Response) {
  const { from, to } = req.query as any;
  
  const data = {
    totalPlatformRevenue: 45900, // Total revenue to QIT from tenant subscriptions
    totalCommerceRevenue: 128400, // Total parent-to-tenant payments
    activeTenants: 8,
    totalPlayers: 1250,
    newTenantsInRange: 2,
    failedPlatformPayments: {
      count: 1,
      totalAmount: 99
    },
    failedCommercePayments: {
      count: 5,
      totalAmount: 245
    },
    topTenantsByPlatformRevenue: [
      { tenant: 'Elite Footwork Academy', revenue: 19900 },
      { tenant: 'Futsal Culture', revenue: 9900 },
      { tenant: 'Metro Futsal', revenue: 16100 }
    ],
    topTenantsByCommerceRevenue: [
      { tenant: 'Elite Footwork Academy', revenue: 45200 },
      { tenant: 'Futsal Culture', revenue: 38900 },
      { tenant: 'Metro Futsal', revenue: 44300 }
    ],
    churnCandidates: [
      { tenant: 'Metro Futsal', lastPayment: '2025-06-01', daysSince: 57 }
    ]
  };
  
  console.log(`Super Admin: analytics overview retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json(data);
}