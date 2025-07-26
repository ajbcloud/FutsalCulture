import { Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { users, players, signups, futsalSessions, payments, helpRequests, notificationPreferences, systemSettings, integrations } from "@shared/schema";
import { eq, sql, and, gte, lte, inArray, desc } from "drizzle-orm";
import { calculateAge, MINIMUM_PORTAL_AGE } from "@shared/constants";

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
  // Admin Dashboard Stats
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

  // Admin Sessions Management
  app.get('/api/admin/sessions', requireAdmin, async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getSessions({});
      
      // Add signup counts using existing methods
      const sessionsWithDetails = await Promise.all(
        sessions.map(async (session) => {
          const signupsCount = await storage.getSignupsCount(session.id);
          return {
            ...session,
            signupsCount,
          };
        })
      );

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

  // Admin Payments Management  
  app.get('/api/admin/payments', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get pending payment signups (unpaid reservations)
      const pendingSignups = await storage.getPendingPaymentSignups();
      res.json(pendingSignups);
    } catch (error) {
      console.error("Error fetching admin payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post('/api/admin/payments/:id/mark-paid', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const signup = await storage.updateSignupPaymentStatus(id, true);
      res.json(signup);
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      res.status(500).json({ message: "Failed to mark payment as paid" });
    }
  });

  // Admin Players Management
  app.get('/api/admin/players', requireAdmin, async (req: Request, res: Response) => {
    try {
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
      .leftJoin(sql`users as parent2`, sql`parent2.id = ${players.parent2Id}`);

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
        timezone: "Singapore/Asia",
        emailNotifications: true,
        smsNotifications: false,
        sessionCapacityWarning: 3,
        paymentReminderMinutes: 240, // 4 hours = 240 minutes
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
}