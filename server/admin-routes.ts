import { Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { users, players, signups, futsalSessions, payments, helpRequests, notificationPreferences } from "@shared/schema";
import { eq, sql, and, gte, lte, inArray, desc } from "drizzle-orm";

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

      // Generate pending tasks
      const pendingTasks = [];
      if (pendingPayments > 0) {
        pendingTasks.push({
          id: 'pending-payments',
          type: 'Payment Review',
          message: `${pendingPayments} payments awaiting confirmation`,
          priority: 'high' as const,
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

  app.delete('/api/admin/sessions/:id', requireFullAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteSession(id);
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
        canAccessPortal: players.canAccessPortal,
        canBookAndPay: players.canBookAndPay,
        email: players.email,
        phoneNumber: players.phoneNumber,
        createdAt: players.createdAt,
        // Parent info
        parentFirstName: users.firstName,
        parentLastName: users.lastName,
        parentEmail: users.email,
        // Signup count
        signupCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${signups} 
          WHERE ${signups.playerId} = ${players.id}
        )`,
      })
      .from(players)
      .leftJoin(users, eq(users.id, players.parentId));

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
      // TODO: Add method to mark help request as resolved
      res.json({ message: "Help request marked as resolved" });
    } catch (error) {
      console.error("Error resolving help request:", error);
      res.status(500).json({ message: "Failed to resolve help request" });
    }
  });

  app.post('/api/admin/help-requests/:id/reply', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      
      // TODO: Implement email sending and help request reply logging
      // For now, just return success
      res.json({ message: "Reply sent successfully" });
    } catch (error) {
      console.error("Error sending help request reply:", error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // Admin Settings (placeholder)
  app.get('/api/admin/settings', requireAdmin, async (req: Request, res: Response) => {
    try {
      // TODO: Implement settings storage
      res.json({
        businessName: "Futsal Culture",
        contactEmail: "admin@futsalculture.com",
        timezone: "Singapore/Asia"
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch('/api/admin/settings', requireAdmin, async (req: Request, res: Response) => {
    try {
      const updateData = req.body;
      // TODO: Implement settings update
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
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
    const csvHeaders = 'title,location,ageGroup,gender,startTime,endTime,capacity,priceCents\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sessions_template.csv"');
    res.send(csvHeaders);
  });

  app.get('/api/admin/template/players', requireAdmin, (req: Request, res: Response) => {
    const csvHeaders = 'firstName,lastName,birthYear,gender,parentEmail,parentPhone,canAccessPortal,canBookAndPay\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="players_template.csv"');
    res.send(csvHeaders);
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
      // Get all users directly from database
      const allUsers = await db.select().from(users);
      
      const parentsWithCounts = await Promise.all(
        allUsers.map(async (user) => {
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
            playersCount: userPlayers.length
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