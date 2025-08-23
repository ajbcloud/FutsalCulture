import { Request, Response } from 'express';
import { db } from '../../db';
import { pageParams, wrapRows } from '../../lib/pagination';
import { 
  payments, 
  signups, 
  players, 
  users, 
  futsalSessions, 
  tenants,
  waitlists
} from '../../../shared/schema';
import { eq, and, gte, lte, count, sql, desc, asc, isNull, isNotNull, inArray } from 'drizzle-orm';

/**
 * Detailed Analytics Controller
 * 
 * Provides comprehensive KPI calculations mapped directly to database tables:
 * 
 * Database Table Mapping:
 * - Platform Revenue: Future tenant_invoices table (subscription payments to QIT)
 * - Client Commerce: payments table (parent-to-tenant payments)
 * - Registrations: signups table with createdAt timestamps
 * - Players: players table with createdAt, tenantId
 * - Sessions: futsal_sessions table with status, capacity, startTime
 * - Parents: users table where isAdmin = false
 * - Tenants: tenants table with planLevel, createdAt
 * - Waitlists: waitlists table for demand analysis
 */

// Platform Billing KPIs (Subscription revenue to QIT)
export async function platformBillingKPIs(req: Request, res: Response) {
  const { from, to, tenantId } = req.query as { from?: string; to?: string; tenantId?: string };
  
  const startDate = from ? new Date(decodeURIComponent(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = to ? new Date(decodeURIComponent(to)) : new Date();
  
  try {
    // Mock platform billing data - in real implementation, query tenant_invoices table
    const data = {
      // Monthly Recurring Revenue (MRR) by plan level
      mrr: {
        core: 99 * 3, // $99/mo * 3 tenants
        growth: 199 * 3, // $199/mo * 3 tenants  
        elite: 499 * 2, // $499/mo * 2 tenants
        total: 99 * 3 + 199 * 3 + 499 * 2
      },
      // Annual Recurring Revenue
      arr: (99 * 3 + 199 * 3 + 499 * 2) * 12,
      // Plan mix distribution
      planMix: [
        { plan: 'Core', count: 3, percentage: 37.5 },
        { plan: 'Growth', count: 3, percentage: 37.5 },
        { plan: 'Elite', count: 2, percentage: 25.0 }
      ],
      // Churn metrics (tenants that cancelled)
      churn: {
        monthlyChurnRate: 2.5, // 2.5% monthly churn
        quarterlyChurnRate: 7.3,
        churned: 1,
        retained: 7
      },
      // Average Revenue Per Tenant (ARPT)
      arpt: Math.round((99 * 3 + 199 * 3 + 499 * 2) / 8),
      // Outstanding receivables (failed payments)
      outstandingReceivables: {
        amount: 59700, // $597 in cents
        count: 2,
        aging: [
          { range: '0-30 days', amount: 39800, count: 1 },
          { range: '31-60 days', amount: 19900, count: 1 }
        ]
      }
    };
    
    console.log(`Super Admin: platform billing KPIs retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching platform billing KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch platform billing KPIs' });
  }
}

// Client Commerce KPIs (Parent-to-tenant payments)
export async function clientCommerceKPIs(req: Request, res: Response) {
  const { from, to, tenantId } = req.query as { from?: string; to?: string; tenantId?: string };
  
  const startDate = from ? new Date(decodeURIComponent(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = to ? new Date(decodeURIComponent(to)) : new Date();
  
  try {
    // Build base query conditions
    const dateConditions = [];
    if (from) dateConditions.push(gte(payments.createdAt, startDate));
    if (to) dateConditions.push(lte(payments.createdAt, endDate));
    if (tenantId && tenantId !== 'all') dateConditions.push(eq(payments.tenantId, tenantId));
    
    // Gross Transaction Volume (GTV) - all payment attempts
    const [gtvResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`,
        count: count(payments.id)
      })
      .from(payments)
      .where(dateConditions.length > 0 ? and(...dateConditions) : undefined);
    
    // Net Revenue - successful payments only
    const [netRevenueResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`,
        count: count(payments.id)
      })
      .from(payments)
      .where(and(
        eq(payments.status, 'paid'),
        ...(dateConditions.length > 0 ? dateConditions : [])
      ));
    
    // Failed payment metrics
    const [failedResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`,
        count: count(payments.id)
      })
      .from(payments)
      .where(and(
        eq(payments.status, 'pending'),
        ...(dateConditions.length > 0 ? dateConditions : [])
      ));
    
    // Refund metrics
    const [refundResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`,
        count: count(payments.id)
      })
      .from(payments)
      .where(and(
        eq(payments.status, 'refunded'),
        ...(dateConditions.length > 0 ? dateConditions : [])
      ));
    
    const gtvCents = gtvResult.total || 0;
    const netRevenueCents = netRevenueResult.total || 0;
    const failedCents = failedResult.total || 0;
    const refundCents = refundResult.total || 0;
    
    const data = {
      gtv: {
        amountCents: gtvCents,
        amount: Math.round(gtvCents / 100),
        transactionCount: gtvResult.count || 0
      },
      netRevenue: {
        amountCents: netRevenueCents,
        amount: Math.round(netRevenueCents / 100),
        transactionCount: netRevenueResult.count || 0
      },
      failedPaymentRate: {
        rate: gtvResult.count > 0 ? ((failedResult.count || 0) / gtvResult.count * 100) : 0,
        amount: Math.round(failedCents / 100),
        count: failedResult.count || 0
      },
      refundRate: {
        rate: netRevenueResult.count > 0 ? ((refundResult.count || 0) / netRevenueResult.count * 100) : 0,
        amount: Math.round(refundCents / 100),
        count: refundResult.count || 0
      },
      averageTicketSize: {
        cents: netRevenueResult.count > 0 ? Math.round(netRevenueCents / netRevenueResult.count) : 0,
        amount: netRevenueResult.count > 0 ? Math.round(netRevenueCents / netRevenueResult.count / 100) : 0
      },
      growthRate: {
        monthOverMonth: 12.5, // Mock - calculate from previous period
        quarterOverQuarter: 45.2
      }
    };
    
    console.log(`Super Admin: client commerce KPIs retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching client commerce KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch client commerce KPIs' });
  }
}

// Registration KPIs
export async function registrationKPIs(req: Request, res: Response) {
  const { from, to, tenantId } = req.query as { from?: string; to?: string; tenantId?: string };
  
  const startDate = from ? new Date(decodeURIComponent(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = to ? new Date(decodeURIComponent(to)) : new Date();
  
  try {
    // Build base query conditions
    const dateConditions = [];
    if (from) dateConditions.push(gte(signups.createdAt, startDate));
    if (to) dateConditions.push(lte(signups.createdAt, endDate));
    if (tenantId && tenantId !== 'all') dateConditions.push(eq(signups.tenantId, tenantId));
    
    // New registrations (signups created in period)
    const [newRegistrations] = await db
      .select({ count: count(signups.id) })
      .from(signups)
      .where(dateConditions.length > 0 ? and(...dateConditions) : undefined);
    
    // Conversion rate (paid vs unpaid signups)
    const [paidSignups] = await db
      .select({ count: count(signups.id) })
      .from(signups)
      .where(and(
        eq(signups.paid, true),
        ...(dateConditions.length > 0 ? dateConditions : [])
      ));
    
    const [unpaidSignups] = await db
      .select({ count: count(signups.id) })
      .from(signups)
      .where(and(
        eq(signups.paid, false),
        ...(dateConditions.length > 0 ? dateConditions : [])
      ));
    
    const totalSignups = newRegistrations.count || 0;
    const paidCount = paidSignups.count || 0;
    const unpaidCount = unpaidSignups.count || 0;
    
    const data = {
      newRegistrations: totalSignups,
      conversionRate: {
        rate: totalSignups > 0 ? (paidCount / totalSignups * 100) : 0,
        paid: paidCount,
        unpaid: unpaidCount
      },
      dropOffAnalysis: {
        // Mock drop-off data - would need session tracking
        viewedSessions: totalSignups + 45,
        startedBooking: totalSignups + 12,
        completedPayment: paidCount,
        dropOffRate: totalSignups > 0 ? (unpaidCount / totalSignups * 100) : 0
      },
      retention: {
        // Mock retention data - would need cohort analysis
        weeklyRetention: 68.5,
        monthlyRetention: 45.2,
        repeatBookings: Math.round(paidCount * 0.4)
      }
    };
    
    console.log(`Super Admin: registration KPIs retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching registration KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch registration KPIs' });
  }
}

// Player KPIs
export async function playerKPIs(req: Request, res: Response) {
  const { from, to, tenantId } = req.query as { from?: string; to?: string; tenantId?: string };
  
  const startDate = from ? new Date(decodeURIComponent(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = to ? new Date(decodeURIComponent(to)) : new Date();
  
  try {
    // Build base query conditions
    const playerConditions = [];
    if (from) playerConditions.push(gte(players.createdAt, startDate));
    if (to) playerConditions.push(lte(players.createdAt, endDate));
    if (tenantId && tenantId !== 'all') playerConditions.push(eq(players.tenantId, tenantId));
    
    // New players created in period
    const [newPlayers] = await db
      .select({ count: count(players.id) })
      .from(players)
      .where(playerConditions.length > 0 ? and(...playerConditions) : undefined);
    
    // Active players (with bookings in period)
    const activePlayersQuery = db
      .select({ 
        playerId: signups.playerId,
        bookingCount: count(signups.id)
      })
      .from(signups)
      .innerJoin(players, eq(signups.playerId, players.id))
      .where(and(
        eq(signups.paid, true),
        gte(signups.createdAt, startDate),
        lte(signups.createdAt, endDate),
        ...(tenantId && tenantId !== 'all' ? [eq(players.tenantId, tenantId)] : [])
      ))
      .groupBy(signups.playerId);
    
    const activePlayers = await activePlayersQuery;
    
    // Total players by tenant
    const [totalPlayers] = await db
      .select({ count: count(players.id) })
      .from(players)
      .where(tenantId && tenantId !== 'all' ? eq(players.tenantId, tenantId) : undefined);
    
    // Players by age group and gender
    const playerDemographics = await db
      .select({
        gender: players.gender,
        count: count(players.id),
        avgAge: sql<number>`AVG(2025 - ${players.birthYear})`
      })
      .from(players)
      .where(tenantId && tenantId !== 'all' ? eq(players.tenantId, tenantId) : undefined)
      .groupBy(players.gender);
    
    const data = {
      totalPlayers: totalPlayers.count || 0,
      newPlayers: newPlayers.count || 0,
      activePlayers: {
        count: activePlayers.length,
        withMultipleBookings: activePlayers.filter(p => p.bookingCount > 1).length,
        averageBookingsPerPlayer: activePlayers.length > 0 
          ? Math.round(activePlayers.reduce((sum, p) => sum + p.bookingCount, 0) / activePlayers.length * 10) / 10
          : 0
      },
      returningVsNew: {
        returning: activePlayers.filter(p => p.bookingCount > 1).length,
        new: activePlayers.filter(p => p.bookingCount === 1).length,
        retentionRate: activePlayers.length > 0 
          ? (activePlayers.filter(p => p.bookingCount > 1).length / activePlayers.length * 100)
          : 0
      },
      demographics: playerDemographics.map(d => ({
        gender: d.gender,
        count: d.count,
        percentage: totalPlayers.count > 0 ? (d.count / totalPlayers.count * 100) : 0,
        averageAge: Math.round(d.avgAge || 0)
      })),
      growthTrend: {
        monthOverMonth: 8.5, // Mock - would calculate from previous period
        newPlayerRate: totalPlayers.count > 0 ? (newPlayers.count / totalPlayers.count * 100) : 0
      },
      churnRisk: {
        // Players with no bookings in last 30 days
        inactivePlayers: Math.max(0, (totalPlayers.count || 0) - activePlayers.length),
        churnRate: totalPlayers.count > 0 
          ? (Math.max(0, (totalPlayers.count || 0) - activePlayers.length) / totalPlayers.count * 100)
          : 0
      }
    };
    
    console.log(`Super Admin: player KPIs retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching player KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch player KPIs' });
  }
}

// Session KPIs
export async function sessionKPIs(req: Request, res: Response) {
  const { from, to, tenantId } = req.query as { from?: string; to?: string; tenantId?: string };
  
  const startDate = from ? new Date(decodeURIComponent(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = to ? new Date(decodeURIComponent(to)) : new Date();
  
  try {
    // Build base query conditions
    const sessionConditions = [];
    if (from) sessionConditions.push(gte(futsalSessions.startTime, startDate));
    if (to) sessionConditions.push(lte(futsalSessions.startTime, endDate));
    if (tenantId && tenantId !== 'all') sessionConditions.push(eq(futsalSessions.tenantId, tenantId));
    
    // Total sessions scheduled
    const [scheduledSessions] = await db
      .select({ 
        count: count(futsalSessions.id),
        totalCapacity: sql<number>`SUM(${futsalSessions.capacity})`
      })
      .from(futsalSessions)
      .where(sessionConditions.length > 0 ? and(...sessionConditions) : undefined);
    
    // Sessions with signups (to determine completed vs empty)
    const sessionBookings = await db
      .select({
        sessionId: signups.sessionId,
        paidBookings: sql<number>`COUNT(CASE WHEN ${signups.paid} = true THEN 1 END)`,
        totalBookings: count(signups.id),
        sessionCapacity: futsalSessions.capacity,
        sessionRevenue: sql<number>`SUM(CASE WHEN ${signups.paid} = true THEN ${futsalSessions.priceCents} ELSE 0 END)`
      })
      .from(futsalSessions)
      .leftJoin(signups, eq(futsalSessions.id, signups.sessionId))
      .where(sessionConditions.length > 0 ? and(...sessionConditions) : undefined)
      .groupBy(futsalSessions.id, futsalSessions.capacity);
    
    // Calculate fill rates and attendance
    const totalScheduled = scheduledSessions.count || 0;
    const totalCapacity = scheduledSessions.totalCapacity || 0;
    const totalBookings = sessionBookings.reduce((sum, s) => sum + (s.paidBookings || 0), 0);
    const totalRevenue = sessionBookings.reduce((sum, s) => sum + (s.sessionRevenue || 0), 0);
    const sessionsWithBookings = sessionBookings.filter(s => (s.paidBookings || 0) > 0).length;
    
    // Age group and gender analysis
    const [ageGroupAnalysis] = await db
      .select({
        count: count(futsalSessions.id),
        // Mock age group data - would need to parse ageGroups array
        topAgeGroups: sql<string>`'U10,U12,U14'` // Mock
      })
      .from(futsalSessions)
      .where(sessionConditions.length > 0 ? and(...sessionConditions) : undefined);
    
    const data = {
      scheduled: totalScheduled,
      completed: sessionsWithBookings,
      fillRate: {
        percentage: totalCapacity > 0 ? (totalBookings / totalCapacity * 100) : 0,
        averageAttendance: totalScheduled > 0 ? Math.round(totalBookings / totalScheduled * 10) / 10 : 0,
        capacityUtilization: totalCapacity > 0 ? Math.round(totalBookings / totalCapacity * 1000) / 10 : 0
      },
      revenue: {
        total: Math.round(totalRevenue / 100), // Convert cents to dollars
        totalCents: totalRevenue,
        perSession: totalScheduled > 0 ? Math.round(totalRevenue / totalScheduled / 100) : 0,
        perPlayer: totalBookings > 0 ? Math.round(totalRevenue / totalBookings / 100) : 0
      },
      attendance: {
        totalBookings: totalBookings,
        averagePerSession: totalScheduled > 0 ? Math.round(totalBookings / totalScheduled * 10) / 10 : 0,
        noShows: 0, // Would need attendance tracking
        showRate: 100 // Mock - would calculate from actual attendance
      },
      demographics: {
        topAgeGroups: ['U10', 'U12', 'U14'], // Mock - would parse from actual data
        genderSplit: { boys: 55, girls: 45 }, // Mock percentages
        sessionsByAge: [
          { ageGroup: 'U10', sessions: Math.round(totalScheduled * 0.3), bookings: Math.round(totalBookings * 0.35) },
          { ageGroup: 'U12', sessions: Math.round(totalScheduled * 0.4), bookings: Math.round(totalBookings * 0.4) },
          { ageGroup: 'U14', sessions: Math.round(totalScheduled * 0.3), bookings: Math.round(totalBookings * 0.25) }
        ]
      },
      trends: {
        weeklyGrowth: 5.2, // Mock
        monthlyGrowth: 18.7,
        capacityTrend: 'increasing'
      }
    };
    
    console.log(`Super Admin: session KPIs retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching session KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch session KPIs' });
  }
}

// Parent KPIs
export async function parentKPIs(req: Request, res: Response) {
  const { from, to, tenantId } = req.query as { from?: string; to?: string; tenantId?: string };
  
  const startDate = from ? new Date(decodeURIComponent(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = to ? new Date(decodeURIComponent(to)) : new Date();
  
  try {
    // Build base query conditions
    const userConditions = [eq(users.isAdmin, false)];
    if (from) userConditions.push(gte(users.createdAt, startDate));
    if (to) userConditions.push(lte(users.createdAt, endDate));
    if (tenantId && tenantId !== 'all') userConditions.push(eq(users.tenantId, tenantId));
    
    // Parent engagement metrics
    const parentBookings = await db
      .select({
        parentId: players.parentId,
        bookingCount: count(signups.id),
        paidBookings: sql<number>`COUNT(CASE WHEN ${signups.paid} = true THEN 1 END)`,
        totalSpent: sql<number>`SUM(CASE WHEN ${signups.paid} = true THEN ${futsalSessions.priceCents} ELSE 0 END)`,
        playerCount: sql<number>`COUNT(DISTINCT ${players.id})`
      })
      .from(players)
      .leftJoin(signups, eq(players.id, signups.playerId))
      .leftJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
      .where(and(
        gte(signups.createdAt, startDate),
        lte(signups.createdAt, endDate),
        ...(tenantId && tenantId !== 'all' ? [eq(players.tenantId, tenantId)] : [])
      ))
      .groupBy(players.parentId);
    
    // Total parents
    const [totalParents] = await db
      .select({ count: count(users.id) })
      .from(users)
      .where(and(...userConditions));
    
    const activeParents = parentBookings.filter(p => (p.paidBookings || 0) > 0);
    const totalSpent = parentBookings.reduce((sum, p) => sum + (p.totalSpent || 0), 0);
    const totalBookings = parentBookings.reduce((sum, p) => sum + (p.paidBookings || 0), 0);
    
    // Calculate LTV segments
    const parentsBySpending = activeParents.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    const topPercentile = Math.max(1, Math.round(activeParents.length * 0.1)); // Top 10%
    const topParents = parentsBySpending.slice(0, topPercentile);
    
    const data = {
      totalParents: totalParents.count || 0,
      activeParents: activeParents.length,
      engagementRate: totalParents.count > 0 ? (activeParents.length / totalParents.count * 100) : 0,
      bookingsPerParent: {
        average: activeParents.length > 0 ? Math.round(totalBookings / activeParents.length * 10) / 10 : 0,
        median: activeParents.length > 0 
          ? parentBookings.sort((a, b) => (a.paidBookings || 0) - (b.paidBookings || 0))[Math.floor(activeParents.length / 2)]?.paidBookings || 0
          : 0,
        distribution: {
          low: activeParents.filter(p => (p.paidBookings || 0) <= 2).length,
          medium: activeParents.filter(p => (p.paidBookings || 0) >= 3 && (p.paidBookings || 0) <= 10).length,
          high: activeParents.filter(p => (p.paidBookings || 0) > 10).length
        }
      },
      ltv: {
        averagePerParent: activeParents.length > 0 ? Math.round(totalSpent / activeParents.length / 100) : 0,
        totalRevenue: Math.round(totalSpent / 100),
        top10Percent: {
          count: topParents.length,
          averageLtv: topParents.length > 0 
            ? Math.round(topParents.reduce((sum, p) => sum + (p.totalSpent || 0), 0) / topParents.length / 100)
            : 0,
          revenueContribution: totalSpent > 0 
            ? Math.round(topParents.reduce((sum, p) => sum + (p.totalSpent || 0), 0) / totalSpent * 100)
            : 0
        }
      },
      retention: {
        // Mock retention data - would need cohort analysis
        monthlyRetention: 72.5,
        quarterlyRetention: 58.3,
        churnedParents: Math.max(0, (totalParents.count || 0) - activeParents.length),
        churnRate: totalParents.count > 0 
          ? Math.max(0, ((totalParents.count || 0) - activeParents.length) / totalParents.count * 100)
          : 0
      },
      playerRelationships: {
        singleChild: activeParents.filter(p => p.playerCount === 1).length,
        multipleChildren: activeParents.filter(p => (p.playerCount || 0) > 1).length,
        averageChildrenPerParent: activeParents.length > 0 
          ? Math.round(activeParents.reduce((sum, p) => sum + (p.playerCount || 0), 0) / activeParents.length * 10) / 10
          : 0
      }
    };
    
    console.log(`Super Admin: parent KPIs retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching parent KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch parent KPIs' });
  }
}

// Cross-cutting KPIs (Cohorts, LTV per tenant, churn risk)
export async function crossCuttingKPIs(req: Request, res: Response) {
  const { from, to, tenantId } = req.query as { from?: string; to?: string; tenantId?: string };
  
  const startDate = from ? new Date(decodeURIComponent(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = to ? new Date(decodeURIComponent(to)) : new Date();
  
  try {
    // LTV per tenant
    const tenantLtv = await db
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        planLevel: tenants.planLevel,
        totalRevenue: sql<number>`COALESCE(SUM(${futsalSessions.priceCents}), 0)`,
        playerCount: sql<number>`COUNT(DISTINCT ${players.id})`,
        parentCount: sql<number>`COUNT(DISTINCT ${players.parentId})`,
        sessionCount: sql<number>`COUNT(DISTINCT ${futsalSessions.id})`,
        paidBookings: sql<number>`COUNT(CASE WHEN ${signups.paid} = true THEN 1 END)`
      })
      .from(tenants)
      .leftJoin(players, eq(tenants.id, players.tenantId))
      .leftJoin(futsalSessions, eq(tenants.id, futsalSessions.tenantId))
      .leftJoin(signups, and(
        eq(futsalSessions.id, signups.sessionId),
        eq(signups.paid, true)
      ))
      .where(tenantId && tenantId !== 'all' ? eq(tenants.id, tenantId) : undefined)
      .groupBy(tenants.id, tenants.name, tenants.planLevel);
    
    // Churn risk analysis
    const churnRisk = await db
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        lastActivityDate: sql<Date>`MAX(${signups.createdAt})`,
        daysSinceActivity: sql<number>`EXTRACT(day FROM NOW() - MAX(${signups.createdAt}))`
      })
      .from(tenants)
      .leftJoin(futsalSessions, eq(tenants.id, futsalSessions.tenantId))
      .leftJoin(signups, eq(futsalSessions.id, signups.sessionId))
      .groupBy(tenants.id, tenants.name);
    
    // Mock cohort data - would need more complex time-series analysis
    const cohorts = [
      {
        cohort: '2024-Q4',
        initialSize: 156,
        retentionRates: {
          month1: 85.2,
          month2: 72.4,
          month3: 68.1,
          month6: 58.7
        },
        ltvProgression: {
          month1: 45,
          month2: 78,
          month3: 105,
          month6: 187
        }
      },
      {
        cohort: '2025-Q1',
        initialSize: 203,
        retentionRates: {
          month1: 88.7,
          month2: 76.9,
          month3: 71.4
        },
        ltvProgression: {
          month1: 52,
          month2: 89,
          month3: 124
        }
      }
    ];
    
    const data = {
      tenantLtv: tenantLtv.map(t => ({
        tenantId: t.tenantId,
        tenantName: t.tenantName,
        planLevel: t.planLevel,
        totalRevenue: Math.round((t.totalRevenue || 0) / 100),
        playerCount: t.playerCount || 0,
        parentCount: t.parentCount || 0,
        sessionCount: t.sessionCount || 0,
        revenuePerPlayer: (t.playerCount || 0) > 0 ? Math.round((t.totalRevenue || 0) / t.playerCount / 100) : 0,
        revenuePerSession: (t.sessionCount || 0) > 0 ? Math.round((t.totalRevenue || 0) / t.sessionCount / 100) : 0
      })),
      churnRisk: churnRisk.map(t => ({
        tenantId: t.tenantId,
        tenantName: t.tenantName,
        daysSinceActivity: t.daysSinceActivity || 999,
        riskLevel: (t.daysSinceActivity || 0) > 60 ? 'high' : (t.daysSinceActivity || 0) > 30 ? 'medium' : 'low',
        lastActivity: t.lastActivityDate
      })).sort((a, b) => (b.daysSinceActivity || 0) - (a.daysSinceActivity || 0)),
      cohorts: cohorts,
      platformHealth: {
        tenantGrowthRate: 12.5, // Mock - new tenants vs churned
        revenueGrowthRate: 18.7,
        playerGrowthRate: 15.3,
        overallChurnRate: 4.2,
        averageTenantLtv: tenantLtv.length > 0 
          ? Math.round(tenantLtv.reduce((sum, t) => sum + (t.totalRevenue || 0), 0) / tenantLtv.length / 100)
          : 0
      }
    };
    
    console.log(`Super Admin: cross-cutting KPIs retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching cross-cutting KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch cross-cutting KPIs' });
  }
}