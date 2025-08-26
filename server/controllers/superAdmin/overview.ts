import { Request, Response } from 'express';

/**
 * Platform Overview Stats
 * 
 * Database Mapping:
 * - Platform revenue: tenant_invoices/tenant_payments table, status='completed', sum(amount) - QIT revenue
 * - Players: players table, count(*)
 * - Active tenants: tenants table, status='active', count(*)
 * - Sessions: sessions table, created_at in range, count(*)
 * - Pending platform payments: tenant_payments, status='pending', count(*)
 */
export async function getStats(req: Request, res: Response) {
  const { tenantId, from, to } = req.query as { tenantId?: string, from?: string, to?: string };

  // Platform-focused overview stats (Company data, not client data)
  const stats = {
    totalPlatformRevenue: 45900, // Total revenue to QIT from tenant subscriptions
    totalPlayers: 1250, // All players across all tenants
    activeTenants: 8, // All active tenant organizations
    totalSessions: 340, // All sessions across all tenants in range
    pendingPlatformPayments: 2 // Pending payments from tenants to QIT
  };

  // Filter by date range if provided
  if (from || to) {
    // In real implementation, filter queries by date range
    // For mock data, adjust values slightly to show filtering effect
    stats.totalSessions = 285;
  }

  const topTenantsByPlatformRevenue = [
    { tenant: 'Elite Footwork Academy', revenue: 19900 },
    { tenant: 'PlayHQ', revenue: 9900 },
    { tenant: 'Metro Futsal', revenue: 16100 }
  ];

  const recentActivity = [
    { id: 'evt-1', when: new Date().toISOString(), text: 'New tenant Elite Footwork Academy activated' },
    { id: 'evt-2', when: new Date(Date.now() - 3600000).toISOString(), text: 'Platform payment received from PlayHQ' },
    { id: 'evt-3', when: new Date(Date.now() - 7200000).toISOString(), text: 'Tenant Metro Futsal upgraded to Elite plan' }
  ];

  console.log(`Super Admin: platform stats retrieved by ${(req as any).user?.id || 'unknown'}`);

  res.json({
    totals: stats,
    topTenantsByPlatformRevenue,
    recentActivity
  });
}