import { Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { users, players, signups, futsalSessions, payments, helpRequests, notificationPreferences, systemSettings, integrations, serviceBilling, insertServiceBillingSchema } from "@shared/schema";
import { eq, sql, and, gte, lte, inArray, desc } from "drizzle-orm";
import { calculateAge, MINIMUM_PORTAL_AGE } from "@shared/constants";
import Stripe from "stripe";

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Integration helper functions
function maskCredentials(provider: string, credentials: any): any {
  switch (provider) {
    case 'twilio':
      return {
        accountSid: credentials.accountSid ? `***${credentials.accountSid.slice(-4)}` : '',
        authToken: credentials.authToken ? '***' : '',
        fromNumber: credentials.fromNumber,
      };
    case 'sendgrid':
      return {
        apiKey: credentials.apiKey ? `***${credentials.apiKey.slice(-4)}` : '',
        verifiedSender: credentials.verifiedSender,
      };
    case 'google':
      return {
        clientId: credentials.clientId ? `***${credentials.clientId.slice(-4)}` : '',
        clientSecret: credentials.clientSecret ? '***' : '',
        redirectUri: credentials.redirectUri,
      };
    case 'microsoft':
      return {
        tenantId: credentials.tenantId,
        clientId: credentials.clientId ? `***${credentials.clientId.slice(-4)}` : '',
        clientSecret: credentials.clientSecret ? '***' : '',
      };
    case 'stripe':
      return {
        publishableKey: credentials.publishableKey ? `***${credentials.publishableKey.slice(-4)}` : '',
        secretKey: credentials.secretKey ? '***' : '',
        webhookSecret: credentials.webhookSecret ? '***' : '',
      };
    case 'mailchimp':
      return {
        apiKey: credentials.apiKey ? '***' : '',
        audienceId: credentials.audienceId,
        serverPrefix: credentials.serverPrefix,
      };
    case 'quickbooks':
      return {
        clientId: credentials.clientId ? `***${credentials.clientId.slice(-4)}` : '',
        clientSecret: credentials.clientSecret ? '***' : '',
        redirectUri: credentials.redirectUri,
        companyId: credentials.companyId,
        sandbox: credentials.sandbox,
      };
    case 'braintree':
      return {
        merchantId: credentials.merchantId,
        publicKey: credentials.publicKey ? `***${credentials.publicKey.slice(-4)}` : '',
        privateKey: credentials.privateKey ? '***' : '',
        environment: credentials.environment,
      };
    default:
      return {};
  }
}

function validateCredentials(provider: string, credentials: any): string | null {
  switch (provider) {
    case 'twilio':
      if (!credentials.accountSid || !credentials.authToken || !credentials.fromNumber) {
        return 'Twilio requires Account SID, Auth Token, and From Number';
      }
      break;
    case 'sendgrid':
      if (!credentials.apiKey || !credentials.verifiedSender) {
        return 'SendGrid requires API Key and Verified Sender Address';
      }
      break;
    case 'google':
      if (!credentials.clientId || !credentials.clientSecret || !credentials.redirectUri) {
        return 'Google requires Client ID, Client Secret, and Redirect URI';
      }
      break;
    case 'microsoft':
      if (!credentials.tenantId || !credentials.clientId || !credentials.clientSecret) {
        return 'Microsoft requires Tenant ID, Client ID, and Client Secret';
      }
      break;
    default:
      return 'Unsupported provider';
  }
  return null;
}

async function testIntegration(integration: any): Promise<{ success: boolean; error?: string }> {
  try {
    switch (integration.provider) {
      case 'twilio':
        // Test Twilio connection - placeholder for now
        return { success: true };
      case 'sendgrid':
        // Test SendGrid connection - placeholder for now
        return { success: true };
      case 'google':
        // Test Google connection - placeholder for now
        return { success: true };
      case 'microsoft':
        // Test Microsoft connection - placeholder for now
        return { success: true };
      default:
        return { success: false, error: 'Unsupported provider' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Middleware to require admin access
export async function requireAdmin(req: Request, res: Response, next: Function) {
  try {
    if (!(req as any).user?.claims?.sub) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Check user's admin status directly from database
    const user = await storage.getUser((req as any).user.claims.sub);
    if (!user?.isAdmin && !user?.isAssistant) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    // Attach user to request for convenience
    (req as any).currentUser = user;
    next();
  } catch (error) {
    console.error("Error checking admin access:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Middleware to require full admin (not assistant)
export async function requireFullAdmin(req: Request, res: Response, next: Function) {
  try {
    if (!(req as any).user?.claims?.sub) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Check user's admin status directly from database
    const user = await storage.getUser((req as any).user.claims.sub);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Full admin access required" });
    }
    
    // Attach user to request for convenience
    (req as any).currentUser = user;
    next();
  } catch (error) {
    console.error("Error checking admin access:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export function setupAdminRoutes(app: any) {
  // New comprehensive dashboard metrics endpoint  
  app.get('/api/admin/dashboard-metrics', requireAdmin, async (req: Request, res: Response) => {
    try {
      const now = new Date();
      
      // Date boundaries for calculations
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      
      // Current week boundaries
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // 1. Monthly Revenue (current month only)
      const monthlyRevenueResult = await db
        .select({ sum: sql<number>`COALESCE(SUM(${payments.amountCents}),0)` })
        .from(payments)
        .where(
          and(
            sql`${payments.paidAt} IS NOT NULL`,
            gte(payments.paidAt, firstOfMonth),
            lte(payments.paidAt, now)
          )
        );
      const monthlyCents = Number(monthlyRevenueResult[0]?.sum || 0);

      // 2. YTD Revenue (year to date)
      const ytdRevenueResult = await db
        .select({ sum: sql<number>`COALESCE(SUM(${payments.amountCents}),0)` })
        .from(payments)
        .where(
          and(
            sql`${payments.paidAt} IS NOT NULL`,
            gte(payments.paidAt, startOfYear),
            lte(payments.paidAt, now)
          )
        );
      const ytdCents = Number(ytdRevenueResult[0]?.sum || 0);

      // Debug log to verify calculations and growth data
      console.log('→ revenue calculations:', { 
        monthlyCents, 
        ytdCents, 
        monthlyType: typeof monthlyCents,
        ytdType: typeof ytdCents,
        firstOfMonth, 
        startOfYear,
        debugTimestamp: new Date().toISOString()
      });

      // 3. Total Revenue (All Time)
      const totalRevenueResult = await db
        .select({ sumCents: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)` })
        .from(payments)
        .where(sql`${payments.paidAt} IS NOT NULL`);
      const totalRevenue = Number(totalRevenueResult[0]?.sumCents || 0);

      // 4. Total Players (All Time)
      const totalPlayersResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(players);
      const totalPlayers = totalPlayersResult[0]?.count || 0;

      // 5. New Players This Month (July 2025)
      const monthlyPlayersResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(players)
        .where(sql`EXTRACT(MONTH FROM ${players.createdAt}) = 7 AND EXTRACT(YEAR FROM ${players.createdAt}) = 2025`);
      const monthlyPlayers = monthlyPlayersResult[0]?.count || 0;

      // 6. Total Signups/Registrations (All Time)
      const totalSignupsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(signups);
      const totalSignups = totalSignupsResult[0]?.count || 0;

      // 7. Sessions This Week (simplified - current week in July 2025)
      const weeklySessionsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(futsalSessions)
        .where(sql`EXTRACT(WEEK FROM ${futsalSessions.startTime}) = EXTRACT(WEEK FROM CURRENT_DATE) AND EXTRACT(YEAR FROM ${futsalSessions.startTime}) = 2025`);
      const weeklySessions = weeklySessionsResult[0]?.count || 0;

      // 8. Pending Payments (Needs attention)
      const pendingPaymentsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(signups)
        .where(eq(signups.paid, false));
      const pendingPayments = pendingPaymentsResult[0]?.count || 0;

      // 9. Active Parents (count all users for now)
      const activeParentsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users);
      const activeParents = activeParentsResult[0]?.count || 0;

      // 10. Session Fill Rate (correct calculation - average fill rate per session)
      const fillRateResult = await db.execute(sql`
        SELECT 
          COALESCE(AVG(session_fill_rate), 0) as average_fill_rate
        FROM (
          SELECT 
            fs.id,
            fs.capacity,
            COUNT(s.id) as signups_count,
            (COUNT(s.id)::numeric / fs.capacity) * 100 as session_fill_rate
          FROM futsal_sessions fs
          LEFT JOIN signups s ON fs.id = s.session_id
          GROUP BY fs.id, fs.capacity
        ) session_stats
      `);
      
      const fillRateRow = fillRateResult.rows[0] as { average_fill_rate: number };
      const fillRate = Math.round(Number(fillRateRow.average_fill_rate) || 0);

      // Calculate growth rates by comparing with previous periods
      
      // Previous month boundaries for growth calculations
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      
      // Previous week boundaries
      const prevWeekStart = new Date(startOfWeek.getTime() - (7 * 24 * 60 * 60 * 1000));
      const prevWeekEnd = new Date(endOfWeek.getTime() - (7 * 24 * 60 * 60 * 1000));

      // 1. Revenue Growth (current month vs last month)
      const lastMonthRevenueResult = await db
        .select({ sum: sql<number>`COALESCE(SUM(${payments.amountCents}),0)` })
        .from(payments)
        .where(
          and(
            sql`${payments.paidAt} IS NOT NULL`,
            gte(payments.paidAt, firstOfLastMonth),
            lte(payments.paidAt, endOfLastMonth)
          )
        );
      const lastMonthCents = Number(lastMonthRevenueResult[0]?.sum || 0);
      // If no previous data but current data exists, show 100% growth. If both zero, show 0%.
      const revenueGrowth = lastMonthCents === 0 ? (monthlyCents > 0 ? 100 : 0) : Math.round(((monthlyCents - lastMonthCents) / lastMonthCents) * 100);

      // 2. Player Growth (current month vs last month new registrations)
      const lastMonthPlayersResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(players)
        .where(
          and(
            gte(players.createdAt, firstOfLastMonth),
            lte(players.createdAt, endOfLastMonth)
          )
        );
      const lastMonthPlayers = lastMonthPlayersResult[0]?.count || 0;
      // If no previous data but current data exists, show 100% growth. If both zero, show 0%.
      let playersGrowth = lastMonthPlayers === 0 ? (monthlyPlayers > 0 ? 100 : 0) : Math.round(((monthlyPlayers - lastMonthPlayers) / lastMonthPlayers) * 100);
      if (!isFinite(playersGrowth)) playersGrowth = monthlyPlayers > 0 ? 100 : 0;

      // 3. Signups Growth (current month vs last month)
      const thisMonthSignupsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(signups)
        .where(
          and(
            gte(signups.createdAt, firstOfMonth),
            lte(signups.createdAt, now)
          )
        );
      const thisMonthSignups = thisMonthSignupsResult[0]?.count || 0;
      
      const lastMonthSignupsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(signups)
        .where(
          and(
            gte(signups.createdAt, firstOfLastMonth),
            lte(signups.createdAt, endOfLastMonth)
          )
        );
      const lastMonthSignups = lastMonthSignupsResult[0]?.count || 0;
      // If no previous data but current data exists, show 100% growth. If both zero, show 0%.
      let registrationsGrowth = lastMonthSignups === 0 ? (thisMonthSignups > 0 ? 100 : 0) : Math.round(((thisMonthSignups - lastMonthSignups) / lastMonthSignups) * 100);
      if (!isFinite(registrationsGrowth)) registrationsGrowth = thisMonthSignups > 0 ? 100 : 0;

      // 4. Sessions Growth (current week vs last week)
      const lastWeekSessionsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(futsalSessions)
        .where(
          and(
            gte(futsalSessions.startTime, prevWeekStart),
            lte(futsalSessions.startTime, prevWeekEnd)
          )
        );
      const lastWeekSessions = lastWeekSessionsResult[0]?.count || 0;
      // If no previous data but current data exists, show 100% growth. If both zero, show 0%.
      const sessionsGrowth = lastWeekSessions === 0 ? (weeklySessions > 0 ? 100 : 0) : Math.round(((weeklySessions - lastWeekSessions) / lastWeekSessions) * 100);

      // 5. YTD Growth (compare YTD revenue with last year's total revenue)
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      const lastYearRevenueResult = await db
        .select({ sum: sql<number>`COALESCE(SUM(${payments.amountCents}),0)` })
        .from(payments)
        .where(
          and(
            sql`${payments.paidAt} IS NOT NULL`,
            gte(payments.paidAt, lastYearStart),
            lte(payments.paidAt, lastYearEnd)
          )
        );
      const lastYearCents = Number(lastYearRevenueResult[0]?.sum || 0);
      const ytdGrowth = lastYearCents === 0 ? (ytdCents > 0 ? 100 : 0) : Math.round(((ytdCents - lastYearCents) / lastYearCents) * 100);

      // Debug growth calculations
      console.log('→ growth calculations:', {
        monthlyCents, lastMonthCents, revenueGrowth,
        monthlyPlayers, lastMonthPlayers, playersGrowth,
        thisMonthSignups, lastMonthSignups, registrationsGrowth,
        weeklySessions, lastWeekSessions, sessionsGrowth,
        ytdCents, lastYearCents, ytdGrowth
      });

      res.json({
        // Primary KPIs
        totalRevenue,
        monthlyRevenue: monthlyCents, // Current month revenue in cents
        ytdRevenue: ytdCents, // Year-to-date revenue in cents
        totalPlayers,
        monthlyPlayers,
        totalSignups,
        sessionsThisWeek: weeklySessions,
        pendingPayments,
        activeParents,
        fillRate,
        
        // Growth indicators with actual calculations
        revenueGrowth,
        playersGrowth,
        registrationsGrowth,
        sessionsGrowth,
        ytdGrowth,
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Recent activity endpoint
  app.get('/api/admin/recent-activity', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { date = 'today', before } = req.query;
      const now = new Date();
      
      let startTime: Date, endTime: Date;
      
      if (date === 'today') {
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else {
        // For loading more - get yesterday's events
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startTime = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        endTime = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      }

      console.log('Recent activity query:', { startTime, endTime, now });

      const activities = [];

      // Get recent payments with player and parent details for search functionality
      const recentPaymentsWithParents = await db
        .select({
          id: payments.id,
          amountCents: payments.amountCents,
          paidAt: payments.paidAt,
          playerId: signups.playerId,
          playerFirstName: players.firstName,
          playerLastName: players.lastName,
          sessionId: signups.sessionId,
          parentFirstName: users.firstName,
          parentLastName: users.lastName
        })
        .from(payments)
        .innerJoin(signups, eq(payments.signupId, signups.id))
        .innerJoin(players, eq(signups.playerId, players.id))
        .innerJoin(users, eq(players.parentId, users.id))
        .where(sql`${payments.paidAt} IS NOT NULL AND ${payments.paidAt} >= ${startTime} AND ${payments.paidAt} <= ${endTime}`)
        .orderBy(desc(payments.paidAt))
        .limit(10);



      recentPaymentsWithParents.forEach(payment => {
        activities.push({
          id: payment.id,
          type: 'payment',
          icon: '🎉',
          message: `Payment received: $${(payment.amountCents / 100).toFixed(2)} from ${payment.parentFirstName} ${payment.parentLastName} for ${payment.playerFirstName} ${payment.playerLastName}`,
          timestamp: payment.paidAt,
          timeAgo: getTimeAgo(payment.paidAt),
          // Navigation metadata - use parent name for search since payments are filtered by parent
          navigationUrl: '/admin/payments',
          searchTerm: `${payment.parentFirstName} ${payment.parentLastName}`,
          playerId: payment.playerId
        });
      });

      // Get recent refunds with player and parent details  
      const recentRefundsWithParents = await db
        .select({
          id: payments.id,
          amountCents: payments.amountCents,
          refundedAt: payments.refundedAt,
          refundReason: payments.refundReason,
          playerId: signups.playerId,
          playerFirstName: players.firstName,
          playerLastName: players.lastName,
          sessionId: signups.sessionId,
          parentFirstName: users.firstName,
          parentLastName: users.lastName
        })
        .from(payments)
        .innerJoin(signups, eq(payments.signupId, signups.id))
        .innerJoin(players, eq(signups.playerId, players.id))
        .innerJoin(users, eq(players.parentId, users.id))
        .where(sql`${payments.refundedAt} IS NOT NULL AND ${payments.refundedAt} >= ${startTime} AND ${payments.refundedAt} <= ${endTime}`)
        .orderBy(desc(payments.refundedAt))
        .limit(10);

      recentRefundsWithParents.forEach(refund => {
        const reasonSnippet = refund.refundReason && refund.refundReason.length > 30 
          ? `${refund.refundReason.substring(0, 30)}...` 
          : refund.refundReason || 'No reason provided';

        activities.push({
          id: `refund-${refund.id}`,
          type: 'refund',
          icon: '💸',
          message: `Refund issued: $${(refund.amountCents / 100).toFixed(2)} to ${refund.parentFirstName} ${refund.parentLastName} for ${refund.playerFirstName} ${refund.playerLastName}`,
          timestamp: refund.refundedAt,
          timeAgo: getTimeAgo(refund.refundedAt),
          reasonSnippet,
          fullReason: refund.refundReason,
          // Navigation metadata
          navigationUrl: '/admin/payments',
          searchTerm: `${refund.parentFirstName} ${refund.parentLastName}`,
          playerId: refund.playerId
        });
      });

      // Get recent player registrations (including approvals today)
      const recentPlayers = await db
        .select()
        .from(players)
        .where(sql`${players.createdAt} >= ${startTime} AND ${players.createdAt} <= ${endTime}`)
        .orderBy(desc(players.createdAt))
        .limit(10);

      recentPlayers.forEach(player => {
        activities.push({
          id: player.id,
          type: 'registration',
          icon: '👤',
          message: `New player registered: ${player.firstName} ${player.lastName}`,
          timestamp: player.createdAt,
          timeAgo: getTimeAgo(player.createdAt),
          // Navigation metadata
          navigationUrl: '/admin/players',
          searchTerm: `${player.firstName} ${player.lastName}`,
          playerId: player.id
        });
      });

      // Get recent registration approvals (players)
      const recentPlayerApprovals = await db
        .select()
        .from(players)
        .where(sql`${players.approvedAt} >= ${startTime} AND ${players.approvedAt} <= ${endTime}`)
        .orderBy(desc(players.approvedAt))
        .limit(5);

      recentPlayerApprovals.forEach(player => {
        activities.push({
          id: `player-approval-${player.id}`,
          type: 'approval',
          icon: '✅',
          message: `Player registration approved: ${player.firstName} ${player.lastName}`,
          timestamp: player.approvedAt,
          timeAgo: getTimeAgo(player.approvedAt),
          // Navigation metadata
          navigationUrl: '/admin/players',
          searchTerm: `${player.firstName} ${player.lastName}`,
          playerId: player.id
        });
      });

      // Get recent parent registrations (new signups)
      const recentParents = await db
        .select()
        .from(users)
        .where(sql`${users.createdAt} >= ${startTime} AND ${users.createdAt} <= ${endTime}`)
        .orderBy(desc(users.createdAt))
        .limit(10);

      recentParents.forEach(user => {
        activities.push({
          id: `parent-reg-${user.id}`,
          type: 'registration',
          icon: '👨‍👩‍👧‍👦',
          message: `New parent registered: ${user.firstName} ${user.lastName}`,
          timestamp: user.createdAt,
          timeAgo: getTimeAgo(user.createdAt),
          // Navigation metadata  
          navigationUrl: '/admin/parents',
          searchTerm: `${user.firstName} ${user.lastName}`,
          parentId: user.id
        });
      });

      // Get recent registration approvals (parents)
      const recentParentApprovals = await db
        .select()
        .from(users)
        .where(sql`${users.approvedAt} >= ${startTime} AND ${users.approvedAt} <= ${endTime}`)
        .orderBy(desc(users.approvedAt))
        .limit(5);

      console.log('Found parent approvals:', recentParentApprovals.length);
      
      recentParentApprovals.forEach(user => {
        activities.push({
          id: `parent-approval-${user.id}`,
          type: 'approval',
          icon: '✅',
          message: `Parent registration approved: ${user.firstName} ${user.lastName}`,
          timestamp: user.approvedAt,
          timeAgo: getTimeAgo(user.approvedAt),
          // Navigation metadata  
          navigationUrl: '/admin/parents',
          searchTerm: `${user.firstName} ${user.lastName}`,
          parentId: user.id
        });
      });

      // Get recent help requests
      const recentHelpRequests = await db
        .select()
        .from(helpRequests)
        .where(sql`${helpRequests.createdAt} >= ${startTime} AND ${helpRequests.createdAt} <= ${endTime}`)
        .orderBy(desc(helpRequests.createdAt))
        .limit(5);

      recentHelpRequests.forEach(request => {
        activities.push({
          id: request.id,
          type: 'help',
          icon: '💬',
          message: `Help request: ${request.subject}`,
          timestamp: request.createdAt,
          timeAgo: getTimeAgo(request.createdAt)
        });
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json(activities.slice(0, 20)); // Return max 20 activities
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Legacy stats endpoint for backwards compatibility
  app.get('/api/admin/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      // For now, return basic stats using existing methods
      const sessions = await storage.getSessions({});
      const analytics = await storage.getAnalytics();
      
      // Get sessions this week
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      const sessionsThisWeek = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      }).length;

      // Get pending payments
      const pendingSignups = await storage.getPendingPaymentSignups();
      const pendingPayments = pendingSignups.length;

      // Get pending registrations
      const pendingUsers = await db.select().from(users).where(eq(users.registrationStatus, 'pending'));
      const pendingPlayers = await db.select().from(players).where(eq(players.registrationStatus, 'pending'));
      const totalPendingRegistrations = pendingUsers.length + pendingPlayers.length;

      // Generate pending tasks
      const pendingTasks = [];
      if (pendingPayments > 0) {
        pendingTasks.push({
          id: 'pending-payments',
          type: 'Payment Review',
          message: `${pendingPayments} payments awaiting confirmation`,
          priority: 'high' as const,
          action: '/admin/payments',
        });
      }
      
      if (totalPendingRegistrations > 0) {
        pendingTasks.push({
          id: 'pending-registrations',
          type: 'Registration Review',
          message: `${totalPendingRegistrations} registrations awaiting approval`,
          priority: 'high' as const,
          action: '/admin/pending-registrations',
        });
      }

      res.json({
        totalRevenue: analytics.monthlyRevenue,
        totalPlayers: analytics.totalPlayers,
        sessionsThisWeek,
        pendingPayments,
        fillRate: analytics.avgFillRate,
        pendingTasks,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Admin Sessions Management with Accordion Data
  app.get('/api/admin/sessions', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get sessions with signup counts in a single optimized query
      const sessions = await db
        .select({
          id: futsalSessions.id,
          title: futsalSessions.title,
          location: futsalSessions.location,
          ageGroups: futsalSessions.ageGroups,
          genders: futsalSessions.genders,
          startTime: futsalSessions.startTime,
          endTime: futsalSessions.endTime,
          capacity: futsalSessions.capacity,
          priceCents: futsalSessions.priceCents,
          status: futsalSessions.status,
          bookingOpenHour: futsalSessions.bookingOpenHour,
          bookingOpenMinute: futsalSessions.bookingOpenMinute,
          createdAt: futsalSessions.createdAt,
          signupCount: sql<number>`(
            SELECT COUNT(*)::integer FROM signups
             WHERE signups.session_id = futsal_sessions.id
          )`,
        })
        .from(futsalSessions)
        .orderBy(desc(futsalSessions.startTime));

      // Fetch all player details for those sessions in one go
      const allSignups = await db
        .select({
          sessionId: signups.sessionId,
          playerId: signups.playerId,
          firstName: players.firstName,
          lastName: players.lastName,
          birthYear: players.birthYear,
          gender: players.gender,
          soccerClub: players.soccerClub,
          paid: sql<boolean>`${signups.paymentIntentId} IS NOT NULL`,
        })
        .from(signups)
        .innerJoin(players, eq(signups.playerId, players.id))
        .where(inArray(signups.sessionId, sessions.map(s => s.id)));

      // Group signups by session
      const signupsBySession = allSignups.reduce((acc, row) => {
        acc[row.sessionId] = acc[row.sessionId] || [];
        acc[row.sessionId].push(row);
        return acc;
      }, {} as Record<string, typeof allSignups>);

      // Convert signupCount to actual numbers and combine with player details
      const sessionsWithNumbers = sessions.map(s => ({
        ...s,
        signupCount: Number(s.signupCount),
      }));

      // Combine sessions with their player details
      const sessionsWithDetails = sessionsWithNumbers.map(s => ({
        ...s,
        signupsCount: s.signupCount, // Keep both for compatibility
        playersSigned: signupsBySession[s.id] || [],
      }));

      console.log('Sessions with signup counts:', sessionsWithDetails.slice(0, 2).map(s => ({ 
        id: s.id, 
        signupCount: s.signupCount, 
        signupsCount: s.signupsCount,
        capacity: s.capacity 
      })));
      res.json(sessionsWithDetails);
    } catch (error) {
      console.error("Error fetching admin sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post('/api/admin/sessions', requireAdmin, async (req: Request, res: Response) => {
    try {
      const sessionData = {
        ...req.body,
        // Ensure booking time defaults are applied
        bookingOpenHour: req.body.bookingOpenHour ?? 8,
        bookingOpenMinute: req.body.bookingOpenMinute ?? 0,
      };
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.patch('/api/admin/sessions/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const session = await storage.updateSession(id, updateData);
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.delete('/api/admin/sessions/:id', requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // TODO: Implement deleteSession method in storage
      // await storage.deleteSession(id);
      await db.delete(futsalSessions).where(eq(futsalSessions.id, id));
      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Admin Payments Management - Unified endpoint
  app.get('/api/admin/payments', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      
      if (status === 'pending') {
        // Get pending payment signups (unpaid reservations)
        const pendingSignups = await storage.getPendingPaymentSignups();
        res.json(pendingSignups);
      } else if (status === 'paid') {
        // Get paid signups with full details including parent info and payment status
        const paidSignups = await db
          .select({
            id: signups.id,
            playerId: signups.playerId,
            sessionId: signups.sessionId,
            paid: signups.paid,
            createdAt: signups.createdAt,
            // Player info
            player: {
              id: players.id,
              firstName: players.firstName,
              lastName: players.lastName,
              birthYear: players.birthYear,
              gender: players.gender,
              parentId: players.parentId,
              soccerClub: players.soccerClub,
            },
            // Session info
            session: {
              id: futsalSessions.id,
              title: futsalSessions.title,
              location: futsalSessions.location,
              ageGroups: futsalSessions.ageGroups,
              genders: futsalSessions.genders,
              startTime: futsalSessions.startTime,
              endTime: futsalSessions.endTime,
              capacity: futsalSessions.capacity,
              priceCents: futsalSessions.priceCents,
            },
            // Parent info
            parent: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
            },
            // Payment info including refund status
            paidAt: payments.paidAt,
            paymentAmount: payments.amountCents,
            refundedAt: payments.refundedAt,
            refundReason: payments.refundReason,
            refundedBy: payments.refundedBy,
            adminNotes: payments.adminNotes,
            paymentStatus: payments.status,
          })
          .from(signups)
          .innerJoin(players, eq(signups.playerId, players.id))
          .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
          .innerJoin(users, eq(players.parentId, users.id))
          .leftJoin(payments, eq(signups.id, payments.signupId))
          .where(eq(signups.paid, true))
          .orderBy(desc(payments.paidAt));
        
        res.json(paidSignups);
      } else {
        // Return all payments (pending, paid, and refunded)
        const [pendingSignups, paidSignups] = await Promise.all([
          storage.getPendingPaymentSignups(),
          db
            .select({
              id: signups.id,
              playerId: signups.playerId,
              sessionId: signups.sessionId,
              paid: signups.paid,
              createdAt: signups.createdAt,
              // Player info
              player: {
                id: players.id,
                firstName: players.firstName,
                lastName: players.lastName,
                birthYear: players.birthYear,
                gender: players.gender,
                parentId: players.parentId,
                soccerClub: players.soccerClub,
              },
              // Session info
              session: {
                id: futsalSessions.id,
                title: futsalSessions.title,
                location: futsalSessions.location,
                ageGroups: futsalSessions.ageGroups,
                genders: futsalSessions.genders,
                startTime: futsalSessions.startTime,
                endTime: futsalSessions.endTime,
                capacity: futsalSessions.capacity,
                priceCents: futsalSessions.priceCents,
              },
              // Parent info
              parent: {
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
              },
              // Payment info including refund status
              paidAt: payments.paidAt,
              paymentAmount: payments.amountCents,
              refundedAt: payments.refundedAt,
              refundReason: payments.refundReason,
              refundedBy: payments.refundedBy,
              adminNotes: payments.adminNotes,
              paymentStatus: payments.status,
            })
            .from(signups)
            .innerJoin(players, eq(signups.playerId, players.id))
            .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
            .innerJoin(users, eq(players.parentId, users.id))
            .leftJoin(payments, eq(signups.id, payments.signupId))
            .where(eq(signups.paid, true))
            .orderBy(desc(payments.paidAt))
        ]);
        
        // Combine and return all payments
        res.json([...pendingSignups, ...paidSignups]);
      }
    } catch (error) {
      console.error("Error fetching admin payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post('/api/admin/payments/:id/mark-paid', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get the signup details
      const signup = await storage.getSignupWithDetails(id);
      if (!signup) {
        return res.status(404).json({ message: "Signup not found" });
      }
      
      // Create a payment record with current timestamp 
      await storage.createPayment({
        signupId: id,
        amountCents: signup.session?.priceCents || 1000, // Default $10
        paidAt: new Date()
      });
      
      // Update the signup status
      const updatedSignup = await storage.updateSignupPaymentStatus(id, true);
      res.json(updatedSignup);
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      res.status(500).json({ message: "Failed to mark payment as paid" });
    }
  });

  // Admin Players Management
  app.get('/api/admin/players', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { search, playerId } = req.query;
      
      // Get all players with parent information and signup counts
      const allPlayers = await db.select({
        id: players.id,
        firstName: players.firstName,
        lastName: players.lastName,
        birthYear: players.birthYear,
        gender: players.gender,
        parentId: players.parentId,
        parent2Id: players.parent2Id,
        canAccessPortal: players.canAccessPortal,
        canBookAndPay: players.canBookAndPay,
        email: players.email,
        phoneNumber: players.phoneNumber,
        createdAt: players.createdAt,
        // Parent 1 info
        parentFirstName: sql<string>`parent1.first_name`,
        parentLastName: sql<string>`parent1.last_name`,
        parentEmail: sql<string>`parent1.email`,
        // Parent 2 info
        parent2FirstName: sql<string>`parent2.first_name`,
        parent2LastName: sql<string>`parent2.last_name`,
        parent2Email: sql<string>`parent2.email`,
        // Signup count
        signupCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${signups} 
          WHERE ${signups.playerId} = ${players.id}
        )`,
      })
      .from(players)
      .leftJoin(sql`users as parent1`, sql`parent1.id = ${players.parentId}`)
      .leftJoin(sql`users as parent2`, sql`parent2.id = ${players.parent2Id}`)
      .where(
        playerId ? eq(players.id, playerId as string) : 
        search ? or(
          sql`${players.firstName} ILIKE ${`%${search}%`}`,
          sql`${players.lastName} ILIKE ${`%${search}%`}`,
          sql`CONCAT(${players.firstName}, ' ', ${players.lastName}) ILIKE ${`%${search}%`}`
        ) : undefined
      );

      const playersWithData = allPlayers.map(player => ({
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        birthYear: player.birthYear,
        gender: player.gender,
        age: new Date().getFullYear() - player.birthYear,
        ageGroup: `U${new Date().getFullYear() - player.birthYear}`,
        parentId: player.parentId,
        parentName: `${player.parentFirstName || ''} ${player.parentLastName || ''}`.trim(),
        parentEmail: player.parentEmail,
        parent2Id: player.parent2Id,
        parent2Name: player.parent2FirstName && player.parent2LastName ? 
          `${player.parent2FirstName} ${player.parent2LastName}`.trim() : null,
        parent2Email: player.parent2Email,
        canAccessPortal: player.canAccessPortal,
        canBookAndPay: player.canBookAndPay,
        email: player.email,
        phoneNumber: player.phoneNumber,
        signupCount: player.signupCount || 0,
        createdAt: player.createdAt,
        lastActivity: player.createdAt // Using creation date as proxy for now
      }));

      res.json(playersWithData);
    } catch (error) {
      console.error("Error fetching admin players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.patch('/api/admin/players/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // If attempting to enable portal access, validate age requirement
      if (updateData.canAccessPortal === true) {
        const existingPlayer = await db.select().from(players).where(eq(players.id, id)).limit(1);
        if (existingPlayer.length > 0) {
          const age = calculateAge(existingPlayer[0].birthYear);
          if (age < MINIMUM_PORTAL_AGE) {
            return res.status(400).json({ 
              message: `Portal access can only be enabled for players ${MINIMUM_PORTAL_AGE} years or older. This player is currently ${age} years old.` 
            });
          }
        }
      }
      
      const player = await storage.updatePlayer(id, updateData);
      res.json(player);
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(500).json({ message: "Failed to update player" });
    }
  });

  // Admin Analytics with detailed data
  app.get('/api/admin/analytics', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, ageGroup, gender, location } = req.query;
      
      // Default date range if not provided
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      // Revenue over time (from payments)
      const revenueData = await db.select({
        day: sql<string>`date_trunc('day', ${signups.createdAt})::date`,
        amount: sql<number>`sum(10.0)` // All sessions are $10
      })
      .from(signups)
      .where(sql`${signups.createdAt} BETWEEN ${start} AND ${end}`)
      .groupBy(sql`date_trunc('day', ${signups.createdAt})`)
      .orderBy(sql`date_trunc('day', ${signups.createdAt})`);
      
      // Session occupancy trends
      const occupancyData = await db.select({
        day: sql<string>`date_trunc('day', sessions.startTime)::date`,
        fillRate: sql<number>`ROUND(AVG(signups_count::float / sessions.capacity * 100))`
      })
      .from(sql`
        (SELECT 
          sessions.*,
          COALESCE(signup_counts.signups_count, 0) as signups_count
        FROM futsal_sessions sessions
        LEFT JOIN (
          SELECT session_id, COUNT(*) as signups_count
          FROM signups
          GROUP BY session_id
        ) signup_counts ON sessions.id = signup_counts.session_id
        WHERE sessions.start_time BETWEEN ${start} AND ${end}
        ) as sessions
      `)
      .groupBy(sql`date_trunc('day', sessions.start_time)`)
      .orderBy(sql`date_trunc('day', sessions.start_time)`);
      
      // Player growth over time
      const playerGrowthData = await db.select({
        day: sql<string>`date_trunc('day', ${players.createdAt})::date`,
        count: sql<number>`count(*)`
      })
      .from(players)
      .where(sql`${players.createdAt} BETWEEN ${start} AND ${end}`)
      .groupBy(sql`date_trunc('day', ${players.createdAt})`)
      .orderBy(sql`date_trunc('day', ${players.createdAt})`);
      
      res.json({
        revenue: revenueData,
        occupancy: occupancyData,
        playerGrowth: playerGrowthData,
        expenses: [], // Placeholder for expenses data
        refundRate: [] // Placeholder for refund data
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin Help Requests
  app.get('/api/admin/help-requests', requireAdmin, async (req: Request, res: Response) => {
    try {
      const helpRequests = await storage.getHelpRequests();
      res.json(helpRequests);
    } catch (error) {
      console.error("Error fetching help requests:", error);
      res.status(500).json({ message: "Failed to fetch help requests" });
    }
  });

  app.post('/api/admin/help-requests/:id/resolve', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { resolutionNote } = req.body;
      const adminUserId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!resolutionNote || resolutionNote.trim().length < 10) {
        return res.status(400).json({ 
          message: "Resolution note is required and must be at least 10 characters" 
        });
      }

      if (!adminUserId) {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      // Update help request with resolution details
      const [updatedRequest] = await db.update(helpRequests)
        .set({
          resolved: true,
          status: 'resolved',
          resolvedBy: adminUserId,
          resolutionNote: resolutionNote.trim(),
          resolvedAt: new Date()
        })
        .where(eq(helpRequests.id, id))
        .returning();

      if (!updatedRequest) {
        return res.status(404).json({ message: "Help request not found" });
      }

      res.json({
        ...updatedRequest,
        message: "Help request resolved successfully"
      });
    } catch (error) {
      console.error("Error resolving help request:", error);
      res.status(500).json({ message: "Failed to resolve help request" });
    }
  });

  app.post('/api/admin/help-requests/:id/reply', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const adminUserId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!adminUserId) {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      if (!message || message.trim().length < 1) {
        return res.status(400).json({ message: "Reply message is required" });
      }

      // Get current help request to append to reply history
      const [currentRequest] = await db.select().from(helpRequests).where(eq(helpRequests.id, id));
      
      if (!currentRequest) {
        return res.status(404).json({ message: "Help request not found" });
      }

      // Create new reply object
      const newReply = {
        message: message.trim(),
        repliedBy: adminUserId,
        repliedAt: new Date().toISOString()
      };

      // Update reply history and status
      const updatedReplyHistory = [...(currentRequest.replyHistory || []), newReply];
      
      const [updatedRequest] = await db.update(helpRequests)
        .set({
          status: 'replied',
          replyHistory: updatedReplyHistory
        })
        .where(eq(helpRequests.id, id))
        .returning();

      if (!updatedRequest) {
        return res.status(404).json({ message: "Help request not found" });
      }
      
      // TODO: Implement email sending
      
      res.json({ 
        ...updatedRequest,
        message: "Reply sent successfully" 
      });
    } catch (error) {
      console.error("Error sending help request reply:", error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  app.post('/api/admin/help-requests/:id/reply-and-resolve', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { message, resolutionNote } = req.body;
      const adminUserId = (req as any).user?.claims?.sub || (req as any).user?.id;

      if (!adminUserId) {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      if (!message || message.trim().length < 1) {
        return res.status(400).json({ message: "Reply message is required" });
      }

      // Get current help request to append to reply history
      const [currentRequest] = await db.select().from(helpRequests).where(eq(helpRequests.id, id));
      
      if (!currentRequest) {
        return res.status(404).json({ message: "Help request not found" });
      }

      // Create new reply object
      const newReply = {
        message: message.trim(),
        repliedBy: adminUserId,
        repliedAt: new Date().toISOString()
      };

      // Update reply history and resolve
      const updatedReplyHistory = [...(currentRequest.replyHistory || []), newReply];
      
      const [updatedRequest] = await db.update(helpRequests)
        .set({
          resolved: true,
          status: 'resolved',
          resolvedBy: adminUserId,
          resolutionNote: resolutionNote || message,
          resolvedAt: new Date(),
          replyHistory: updatedReplyHistory
        })
        .where(eq(helpRequests.id, id))
        .returning();

      if (!updatedRequest) {
        return res.status(404).json({ message: "Help request not found" });
      }
      
      // TODO: Implement email sending
      
      res.json({ 
        ...updatedRequest,
        message: "Reply sent and request resolved successfully" 
      });
    } catch (error) {
      console.error("Error sending help request reply and resolve:", error);
      res.status(500).json({ message: "Failed to send reply and resolve" });
    }
  });

  // Pending Registrations Management
  app.get('/api/admin/pending-registrations', requireAdmin, async (req: Request, res: Response) => {
    try {
      const pendingUsers = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        registrationStatus: users.registrationStatus,
        createdAt: users.createdAt,
      }).from(users)
      .where(eq(users.registrationStatus, 'pending'));

      const pendingPlayers = await db.select({
        id: players.id,
        firstName: players.firstName,
        lastName: players.lastName,
        email: players.email,
        phoneNumber: players.phoneNumber,
        registrationStatus: players.registrationStatus,
        createdAt: players.createdAt,
        parentId: players.parentId,
      }).from(players)
      .where(eq(players.registrationStatus, 'pending'));

      // Combine and format results
      const pendingRegistrations = [
        ...pendingUsers.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          type: 'parent',
          registrationStatus: user.registrationStatus,
          createdAt: user.createdAt,
        })),
        ...pendingPlayers.map(player => ({
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email,
          phone: player.phoneNumber,
          type: 'player',
          registrationStatus: player.registrationStatus,
          createdAt: player.createdAt,
          parentId: player.parentId,
        }))
      ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      res.json(pendingRegistrations);
    } catch (error) {
      console.error("Error fetching pending registrations:", error);
      res.status(500).json({ message: "Failed to fetch pending registrations" });
    }
  });

  // Approve Registration
  app.post('/api/admin/registrations/:id/approve', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { type } = req.body; // 'parent' or 'player'
      const adminUserId = (req as any).currentUser?.id;

      if (type === 'parent') {
        const [updatedUser] = await db.update(users)
          .set({
            isApproved: true,
            registrationStatus: 'approved',
            approvedAt: new Date(),
            approvedBy: adminUserId,
          })
          .where(eq(users.id, id))
          .returning();

        // TODO: Send approval email notification
        res.json({ message: "Parent registration approved", user: updatedUser });
      } else if (type === 'player') {
        const [updatedPlayer] = await db.update(players)
          .set({
            isApproved: true,
            registrationStatus: 'approved',
            approvedAt: new Date(),
            approvedBy: adminUserId,
          })
          .where(eq(players.id, id))
          .returning();

        // TODO: Send approval email notification
        res.json({ message: "Player registration approved", player: updatedPlayer });
      } else {
        res.status(400).json({ message: "Invalid registration type" });
      }
    } catch (error) {
      console.error("Error approving registration:", error);
      res.status(500).json({ message: "Failed to approve registration" });
    }
  });

  // Reject Registration
  app.post('/api/admin/registrations/:id/reject', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { type, reason } = req.body; // 'parent' or 'player', and rejection reason
      const adminUserId = (req as any).currentUser?.id;

      if (type === 'parent') {
        const [updatedUser] = await db.update(users)
          .set({
            registrationStatus: 'rejected',
            rejectedAt: new Date(),
            rejectedBy: adminUserId,
            rejectionReason: reason,
          })
          .where(eq(users.id, id))
          .returning();

        // TODO: Send rejection email notification
        res.json({ message: "Parent registration rejected", user: updatedUser });
      } else if (type === 'player') {
        const [updatedPlayer] = await db.update(players)
          .set({
            registrationStatus: 'rejected',
            // rejectedAt: new Date(), // Field doesn't exist in schema
            // rejectedBy: adminUserId, // Field doesn't exist in schema
            // rejectionReason: reason, // Field doesn't exist in schema
          })
          .where(eq(players.id, id))
          .returning();

        // TODO: Send rejection email notification
        res.json({ message: "Player registration rejected", player: updatedPlayer });
      } else {
        res.status(400).json({ message: "Invalid registration type" });
      }
    } catch (error) {
      console.error("Error rejecting registration:", error);
      res.status(500).json({ message: "Failed to reject registration" });
    }
  });

  // Admin Settings
  app.get('/api/admin/settings', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get system settings from database
      const settings = await db.select().from(systemSettings);
      
      const settingsMap = settings.reduce((acc, setting) => {
        let value: any = setting.value;
        // Parse boolean values
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        // Parse numeric values
        if (!isNaN(Number(value))) value = Number(value);
        
        acc[setting.key] = value;
        return acc;
      }, {} as any);

      // Default settings if none exist
      const defaultSettings = {
        autoApproveRegistrations: true,
        businessName: "Futsal Culture",
        contactEmail: "admin@futsalculture.com",
        supportEmail: "support@futsalculture.com",
        timezone: "America/New_York",
        emailNotifications: true,
        smsNotifications: false,
        sessionCapacityWarning: 3,
        paymentReminderMinutes: 60, // Default to 60 minutes
        // Business schedule settings
        weekdayStart: "monday", // Business week starts on Monday by default
        weekdayEnd: "sunday", // Business week ends on Sunday by default
        // Fiscal year settings
        fiscalYearType: "calendar", // Default to calendar year
        fiscalYearStartMonth: 1, // January (only used when fiscalYearType is 'fiscal')
        ...settingsMap
      };
      
      // Convert legacy paymentReminderHours to paymentReminderMinutes if it exists
      if (settingsMap.paymentReminderHours && !settingsMap.paymentReminderMinutes) {
        defaultSettings.paymentReminderMinutes = settingsMap.paymentReminderHours * 60;
        delete defaultSettings.paymentReminderHours;
      }

      res.json(defaultSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch('/api/admin/settings', requireAdmin, async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      const adminUserId = (req as any).currentUser?.id;

      // Update each setting in the database
      for (const [key, value] of Object.entries(updates)) {
        await db.insert(systemSettings)
          .values({
            key,
            value: String(value),
            updatedBy: adminUserId,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: systemSettings.key,
            set: {
              value: String(value),
              updatedBy: adminUserId,
              updatedAt: new Date(),
            },
          });
      }

      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Integrations Management Endpoints
  app.get('/api/admin/integrations', requireAdmin, async (req: Request, res: Response) => {
    try {
      const allIntegrations = await db.select({
        id: integrations.id,
        provider: integrations.provider,
        enabled: integrations.enabled,
        lastTestedAt: integrations.lastTestedAt,
        testStatus: integrations.testStatus,
        createdAt: integrations.createdAt,
        updatedAt: integrations.updatedAt,
      }).from(integrations);

      res.json(allIntegrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.get('/api/admin/integrations/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const integration = await db.select().from(integrations).where(eq(integrations.id, id)).limit(1);
      
      if (!integration.length) {
        return res.status(404).json({ message: "Integration not found" });
      }

      // Mask sensitive credentials for security
      const integrationData = integration[0];
      const maskedCredentials = maskCredentials(integrationData.provider, integrationData.credentials as any);
      
      res.json({
        ...integrationData,
        credentials: maskedCredentials,
      });
    } catch (error) {
      console.error("Error fetching integration:", error);
      res.status(500).json({ message: "Failed to fetch integration" });
    }
  });

  app.post('/api/admin/integrations', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { provider, credentials, enabled = true } = req.body;
      const adminUserId = (req as any).currentUser?.id;

      // Validate credentials based on provider
      const validationError = validateCredentials(provider, credentials);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      // Check if integration already exists
      const existing = await db.select().from(integrations).where(eq(integrations.provider, provider)).limit(1);
      
      if (existing.length > 0) {
        // Update existing integration
        const updated = await db.update(integrations)
          .set({
            credentials,
            enabled,
            configuredBy: adminUserId,
            updatedAt: new Date(),
          })
          .where(eq(integrations.provider, provider))
          .returning();

        res.json(updated[0]);
      } else {
        // Create new integration
        const created = await db.insert(integrations)
          .values({
            provider,
            credentials,
            enabled,
            configuredBy: adminUserId,
          })
          .returning();

        res.json(created[0]);
      }
    } catch (error) {
      console.error("Error creating/updating integration:", error);
      res.status(500).json({ message: "Failed to save integration" });
    }
  });

  app.patch('/api/admin/integrations/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { enabled } = req.body;
      const adminUserId = (req as any).currentUser?.id;

      const updated = await db.update(integrations)
        .set({
          enabled,
          configuredBy: adminUserId,
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, id))
        .returning();

      if (!updated.length) {
        return res.status(404).json({ message: "Integration not found" });
      }

      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  app.delete('/api/admin/integrations/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await db.delete(integrations)
        .where(eq(integrations.id, id))
        .returning();

      if (!deleted.length) {
        return res.status(404).json({ message: "Integration not found" });
      }

      res.json({ message: "Integration deleted successfully" });
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  app.post('/api/admin/integrations/:id/test', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const integration = await db.select().from(integrations).where(eq(integrations.id, id)).limit(1);
      if (!integration.length) {
        return res.status(404).json({ message: "Integration not found" });
      }

      const testResult = await testIntegration(integration[0]);
      
      // Update test status
      await db.update(integrations)
        .set({
          lastTestedAt: new Date(),
          testStatus: testResult.success ? 'success' : 'failure',
          testErrorMessage: testResult.error || null,
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, id));

      res.json(testResult);
    } catch (error) {
      console.error("Error testing integration:", error);
      res.status(500).json({ message: "Failed to test integration" });
    }
  });

  // Discount Code Management
  app.get('/api/admin/discount-codes', requireAdmin, async (req: Request, res: Response) => {
    try {
      const codes = await storage.getDiscountCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      res.status(500).json({ message: "Failed to fetch discount codes" });
    }
  });

  app.post('/api/admin/discount-codes', requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUserId = (req as any).currentUser?.id;
      const discountData = {
        ...req.body,
        createdBy: adminUserId,
      };
      const code = await storage.createDiscountCode(discountData);
      res.json(code);
    } catch (error) {
      console.error("Error creating discount code:", error);
      res.status(500).json({ message: "Failed to create discount code" });
    }
  });

  app.put('/api/admin/discount-codes/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const code = await storage.updateDiscountCode(id, req.body);
      res.json(code);
    } catch (error) {
      console.error("Error updating discount code:", error);
      res.status(500).json({ message: "Failed to update discount code" });
    }
  });

  app.delete('/api/admin/discount-codes/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteDiscountCode(id);
      res.json({ message: "Discount code deleted successfully" });
    } catch (error) {
      console.error("Error deleting discount code:", error);
      res.status(500).json({ message: "Failed to delete discount code" });
    }
  });

  // Session management endpoints
  app.get('/api/admin/sessions/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.post('/api/admin/sessions', requireAdmin, async (req: Request, res: Response) => {
    try {
      const sessionData = req.body;
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.patch('/api/admin/sessions/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const session = await storage.updateSession(id, updateData);
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Admin Analytics with real database filtering
  app.get('/api/admin/analytics', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, ageGroup, gender, location, viewBy } = req.query;
      console.log('Analytics request filters:', { startDate, endDate, ageGroup, gender, location, viewBy });
      
      // Build date filters
      const dateStart = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateEnd = endDate ? new Date(endDate as string) : new Date();
      
      // Get filtered sessions
      let sessionQuery = db
        .select({
          id: futsalSessions.id,
          ageGroups: futsalSessions.ageGroups,
          genders: futsalSessions.genders,
          location: futsalSessions.location,
          capacity: futsalSessions.capacity,
          startTime: futsalSessions.startTime,
          signupCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${signups} 
            WHERE ${signups.sessionId} = ${futsalSessions.id}
          )`,
        })
        .from(futsalSessions)
        .where(
          and(
            gte(futsalSessions.startTime, dateStart),
            lte(futsalSessions.startTime, dateEnd)
          )
        );

      const filteredSessions = await sessionQuery;
      
      // Apply additional filters
      let applicableSessions = filteredSessions;
      
      if (ageGroup && ageGroup !== 'all') {
        applicableSessions = filteredSessions.filter(session => 
          session.ageGroups.includes(ageGroup as string)
        );
      }
      
      if (gender && gender !== 'all') {
        applicableSessions = filteredSessions.filter(session =>
          session.genders.includes(gender as string)
        );
      }
      
      if (location) {
        applicableSessions = filteredSessions.filter(session =>
          session.location.toLowerCase().includes((location as string).toLowerCase())
        );
      }
      
      // Get filtered signups and payments
      const sessionIds = applicableSessions.map(s => s.id);
      
      let filteredSignups: any[] = [];
      let filteredPayments: any[] = [];
      
      if (sessionIds.length > 0) {
        filteredSignups = await db
          .select()
          .from(signups)
          .where(
            and(
              inArray(signups.sessionId, sessionIds),
              gte(signups.createdAt, dateStart),
              lte(signups.createdAt, dateEnd)
            )
          );
          
        const signupIds = filteredSignups.map(s => s.id);
        
        if (signupIds.length > 0) {
          filteredPayments = await db
            .select()
            .from(payments)
            .where(
              and(
                inArray(payments.signupId, signupIds),
                gte(payments.createdAt, dateStart),
                lte(payments.createdAt, dateEnd)
              )
            );
        }
      }
      
      // Get filtered players
      let filteredPlayers: any[] = [];
      if (filteredSignups.length > 0) {
        const playerIds = Array.from(new Set(filteredSignups.map(s => s.playerId)));
        filteredPlayers = await db
          .select()
          .from(players)
          .where(inArray(players.id, playerIds));
          
        // Apply player-level filters
        if (ageGroup && ageGroup !== 'all') {
          const targetAge = parseInt((ageGroup as string).substring(1));
          filteredPlayers = filteredPlayers.filter(player => {
            const age = new Date().getFullYear() - player.birthYear;
            return Math.abs(age - targetAge) <= 2; // Within 2 years
          });
        }
        
        if (gender && gender !== 'all') {
          filteredPlayers = filteredPlayers.filter(player => player.gender === gender);
        }
      }
      
      // Calculate filtered analytics
      const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amountCents, 0) / 100;
      const totalSessions = applicableSessions.length;
      const totalSignups = filteredSignups.length;
      const totalCapacity = applicableSessions.reduce((sum, session) => sum + session.capacity, 0);
      const fillRate = totalCapacity > 0 ? Math.round((totalSignups / totalCapacity) * 100) : 0;
      
      console.log('Analytics calculation:', {
        filteredPayments: filteredPayments.length,
        totalRevenue,
        totalSessions,
        totalSignups,
        totalCapacity,
        fillRate,
        filteredPlayers: filteredPlayers.length
      });
      
      const filteredAnalytics = {
        totalPlayers: filteredPlayers.length,
        monthlyRevenue: Math.round(totalRevenue),
        activeSessions: totalSessions,
        avgFillRate: fillRate,
        totalSignups: totalSignups,
        pendingPayments: 0, // All payments are complete in demo data
      };
      
      res.json(filteredAnalytics);
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // CSV Template Downloads
  app.get('/api/admin/template/sessions', requireAdmin, (req: Request, res: Response) => {
    const csvContent = `title,location,ageGroup,gender,startTime,endTime,capacity,priceCents
U10 Boys Morning Training,Sugar Sand Park Boca Raton,U10,boys,2025-07-27 09:00:00,2025-07-27 10:30:00,12,1000
U12 Girls Afternoon Session,Central Park Field,U12,girls,2025-07-27 15:00:00,2025-07-27 16:30:00,10,1000
U14 Boys Evening Training,Westside Regional Park,U14,boys,2025-07-27 18:00:00,2025-07-27 19:30:00,15,1000
U11 Mixed Skills Development,Sugar Sand Park Boca Raton,U11,boys,2025-07-28 10:00:00,2025-07-28 11:30:00,12,1000
U13 Girls Advanced Training,Central Park Field,U13,girls,2025-07-28 16:00:00,2025-07-28 17:30:00,8,1000`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sessions_template.csv"');
    res.send(csvContent);
  });

  app.get('/api/admin/template/players', requireAdmin, (req: Request, res: Response) => {
    const csvContent = `firstName,lastName,birthYear,gender,parentEmail,parentPhone,soccerClub,canAccessPortal,canBookAndPay
Emma,Rodriguez,2013,girls,maria.rodriguez@email.com,555-123-4567,FC Barcelona Youth,true,true
Liam,Thompson,2012,boys,david.thompson@email.com,555-234-5678,Real Madrid Academy,true,true
Sofia,Chen,2014,girls,lisa.chen@email.com,555-345-6789,Manchester United Youth,false,false
Noah,Johnson,2011,boys,sarah.johnson@email.com,555-456-7890,Chelsea FC Academy,true,true
Isabella,Williams,2015,girls,mike.williams@email.com,555-567-8901,,false,false`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="players_template.csv"');
    res.send(csvContent);
  });

  // CSV Import Endpoints
  app.post('/api/admin/imports/sessions', requireAdmin, async (req: Request, res: Response) => {
    try {
      // TODO: Implement CSV parsing and session bulk import
      // For now, return success placeholder
      res.json({ 
        imported: 0, 
        errors: [], 
        message: "Session import functionality will be implemented with CSV parser" 
      });
    } catch (error) {
      console.error("Error importing sessions:", error);
      res.status(500).json({ message: "Failed to import sessions" });
    }
  });

  // Update Player
  app.patch('/api/admin/players/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Validate required fields if they're being updated
      if (updateData.firstName && typeof updateData.firstName !== 'string') {
        return res.status(400).json({ message: "First name must be a string" });
      }
      if (updateData.lastName && typeof updateData.lastName !== 'string') {
        return res.status(400).json({ message: "Last name must be a string" });
      }
      if (updateData.birthYear && (!Number.isInteger(updateData.birthYear) || updateData.birthYear < 2005 || updateData.birthYear > 2018)) {
        return res.status(400).json({ message: "Birth year must be between 2005 and 2018" });
      }
      if (updateData.gender && !['boys', 'girls'].includes(updateData.gender)) {
        return res.status(400).json({ message: "Gender must be 'boys' or 'girls'" });
      }

      // Check age validation for portal access
      if (updateData.canAccessPortal === true && updateData.birthYear) {
        const age = new Date().getFullYear() - updateData.birthYear;
        if (age < MINIMUM_PORTAL_AGE) {
          return res.status(400).json({ 
            message: `Portal access requires player to be at least ${MINIMUM_PORTAL_AGE} years old` 
          });
        }
      }

      // Get current player to check existing portal access restrictions
      const currentPlayer = await db.select().from(players).where(eq(players.id, id)).limit(1);
      if (currentPlayer.length === 0) {
        return res.status(404).json({ message: "Player not found" });
      }

      // If only updating portal access, check age with current birth year
      if (updateData.canAccessPortal === true && !updateData.birthYear) {
        const age = new Date().getFullYear() - currentPlayer[0].birthYear;
        if (age < MINIMUM_PORTAL_AGE) {
          return res.status(400).json({ 
            message: `Portal access requires player to be at least ${MINIMUM_PORTAL_AGE} years old` 
          });
        }
      }

      // Update the player
      const [updatedPlayer] = await db.update(players)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(players.id, id))
        .returning();

      // Return the updated player with parent information
      const playerWithParents = await db.select({
        id: players.id,
        firstName: players.firstName,
        lastName: players.lastName,
        birthYear: players.birthYear,
        gender: players.gender,
        parentId: players.parentId,
        parent2Id: players.parent2Id,
        soccerClub: players.soccerClub,
        canAccessPortal: players.canAccessPortal,
        canBookAndPay: players.canBookAndPay,
        email: players.email,
        phoneNumber: players.phoneNumber,
        createdAt: players.createdAt,
        // Parent 1 info
        parentFirstName: sql<string>`parent1.first_name`,
        parentLastName: sql<string>`parent1.last_name`,
        parentEmail: sql<string>`parent1.email`,
        // Parent 2 info
        parent2FirstName: sql<string>`parent2.first_name`,
        parent2LastName: sql<string>`parent2.last_name`,
        parent2Email: sql<string>`parent2.email`,
        // Signup count
        signupCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${signups} 
          WHERE ${signups.playerId} = ${players.id}
        )`,
      })
      .from(players)
      .leftJoin(sql`users as parent1`, sql`parent1.id = ${players.parentId}`)
      .leftJoin(sql`users as parent2`, sql`parent2.id = ${players.parent2Id}`)
      .where(eq(players.id, id))
      .limit(1);

      if (playerWithParents.length === 0) {
        return res.status(404).json({ message: "Player not found after update" });
      }

      const player = playerWithParents[0];
      const responseData = {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        birthYear: player.birthYear,
        gender: player.gender,
        age: new Date().getFullYear() - player.birthYear,
        ageGroup: `U${new Date().getFullYear() - player.birthYear}`,
        parentId: player.parentId,
        parentName: `${player.parentFirstName || ''} ${player.parentLastName || ''}`.trim(),
        parentEmail: player.parentEmail,
        parent2Id: player.parent2Id,
        parent2Name: player.parent2FirstName && player.parent2LastName ? 
          `${player.parent2FirstName} ${player.parent2LastName}`.trim() : null,
        parent2Email: player.parent2Email,
        soccerClub: player.soccerClub,
        canAccessPortal: player.canAccessPortal,
        canBookAndPay: player.canBookAndPay,
        email: player.email,
        phoneNumber: player.phoneNumber,
        signupsCount: player.signupCount || 0,
        createdAt: player.createdAt,
        lastActivity: player.createdAt
      };

      res.json(responseData);
    } catch (error) {
      console.error('Error updating player:', error);
      res.status(500).json({ message: 'Failed to update player' });
    }
  });

  app.post('/api/admin/imports/players', requireAdmin, async (req: Request, res: Response) => {
    try {
      // TODO: Implement CSV parsing and player bulk import
      // For now, return success placeholder
      res.json({ 
        imported: 0, 
        errors: [], 
        message: "Player import functionality will be implemented with CSV parser" 
      });
    } catch (error) {
      console.error("Error importing players:", error);
      res.status(500).json({ message: "Failed to import players" });
    }
  });

  // Parents management
  app.get('/api/admin/parents', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { filter, parentId } = req.query;
      
      // If parentId is provided, filter by specific parent
      const allUsers = parentId 
        ? await db.select().from(users).where(eq(users.id, parentId as string))
        : await db.select().from(users);
      
      // If filtering by name and no parentId specified
      let filteredUsers = allUsers;
      if (filter && !parentId) {
        const searchTerm = (filter as string).toLowerCase();
        filteredUsers = allUsers.filter(user => 
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm)
        );
      }
      
      const parentsWithCounts = await Promise.all(
        filteredUsers.map(async (user) => {
          const userPlayers = await storage.getPlayersByParent(user.id);
          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin || false,
            isAssistant: user.isAssistant || false,
            lastLogin: user.updatedAt, // Use updatedAt as lastLogin proxy
            playersCount: userPlayers.length,
            players: userPlayers // Include player data when filtering by parentId
          };
        })
      );
      
      res.json(parentsWithCounts);
    } catch (error) {
      console.error('Error fetching parents:', error);
      res.status(500).json({ error: 'Failed to fetch parents' });
    }
  });

  app.put('/api/admin/parents/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, phone, isAdmin, isAssistant } = req.body;
      
      await db.update(users).set({
        firstName,
        lastName,
        email,
        phone,
        isAdmin,
        isAssistant,
        updatedAt: new Date()
      }).where(eq(users.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating parent:', error);
      res.status(500).json({ error: 'Failed to update parent' });
    }
  });

  app.delete('/api/admin/parents/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Delete associated signups first
      await db.delete(signups).where(
        sql`${signups.playerId} IN (SELECT id FROM ${players} WHERE ${players.parentId} = ${id})`
      );
      
      // Delete associated players 
      await db.delete(players).where(eq(players.parentId, id));
      
      // Delete the parent
      await db.delete(users).where(eq(users.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting parent:', error);
      res.status(500).json({ error: 'Failed to delete parent' });
    }
  });

  // Refund payment endpoint
  app.post('/api/admin/payments/:id/refund', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // This is the signup ID
      const { reason } = req.body;
      const adminUserId = (req as any).user?.claims?.sub || (req as any).user?.id;
      
      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ message: "Refund reason is required and must be at least 5 characters" });
      }

      // Find the payment record by signup ID
      const payment = await db.select().from(payments).where(eq(payments.signupId, id)).limit(1);
      
      if (!payment.length) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment[0].refundedAt) {
        return res.status(400).json({ message: "Payment has already been refunded" });
      }

      // Get signup and player details for activity log
      const signupDetails = await db
        .select({
          signup: signups,
          player: {
            firstName: players.firstName,
            lastName: players.lastName,
          },
          session: {
            title: futsalSessions.title,
            startTime: futsalSessions.startTime,
          }
        })
        .from(signups)
        .innerJoin(players, eq(signups.playerId, players.id))
        .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
        .where(eq(signups.id, id))
        .limit(1);

      if (!signupDetails.length) {
        return res.status(404).json({ message: "Signup details not found" });
      }

      const details = signupDetails[0];

      // Update the payment record to mark as refunded
      await db.update(payments)
        .set({
          status: 'refunded',
          refundedAt: new Date(),
          refundReason: reason.trim(),
          refundedBy: adminUserId
        })
        .where(eq(payments.signupId, id));

      // Update the signup to mark as unpaid
      await db.update(signups)
        .set({
          paid: false
        })
        .where(eq(signups.id, id));

      res.json({ 
        message: "Refund processed successfully",
        refundedAt: new Date(),
        reason: reason.trim(),
        refundedBy: adminUserId
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: "Failed to process refund" });
    }
  });

  // Service Billing Configuration - For platform service payments
  app.get('/api/admin/service-billing', requireAdmin, async (req: Request, res: Response) => {
    try {
      const billing = await storage.getServiceBilling();
      res.json(billing || {});
    } catch (error) {
      console.error("Error fetching service billing:", error);
      res.status(500).json({ message: "Failed to fetch service billing configuration" });
    }
  });

  app.post('/api/admin/service-billing', requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUserId = (req as any).currentUser?.id;
      const billingData = insertServiceBillingSchema.parse({
        ...req.body,
        configuredBy: adminUserId,
      });

      const billing = await storage.upsertServiceBilling(billingData);
      res.json({ message: "Service billing configuration saved successfully", billing });
    } catch (error: any) {
      console.error("Error saving service billing:", error);
      res.status(500).json({ message: error.message || "Failed to save service billing configuration" });
    }
  });

  // Create service payment endpoint for Stripe integration
  app.post('/api/admin/create-service-payment', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { amount, description } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(400).json({ 
          message: "Stripe not configured. Please add STRIPE_SECRET_KEY environment variable." 
        });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount should already be in cents
        currency: "usd",
        description: description || "Futsal Culture Platform Service Payment",
        metadata: {
          service: "platform_subscription",
          adminId: (req as any).currentUser?.id || "unknown"
        }
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        message: 'Service payment intent created successfully' 
      });
    } catch (error: any) {
      console.error("Error creating service payment:", error);
      res.status(500).json({ message: error.message || "Failed to create service payment" });
    }
  });
}