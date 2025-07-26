import { Request, Response } from "express";
import { storage } from "./storage";

// Middleware to require admin access
export async function requireAdmin(req: Request, res: Response, next: Function) {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Check user's admin status directly from database
    const user = await storage.getUser(req.user.claims.sub);
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
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Check user's admin status directly from database
    const user = await storage.getUser(req.user.claims.sub);
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

  // Admin Players Management - Basic version for now
  app.get('/api/admin/players', requireAdmin, async (req: Request, res: Response) => {
    try {
      // For now, just return basic player info
      // TODO: Add parent details and signup counts when storage methods are available
      res.json([]);
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

  // Admin Analytics
  app.get('/api/admin/analytics', requireAdmin, async (req: Request, res: Response) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
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

  // Admin Analytics
  app.get('/api/admin/analytics', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { timeframe = '30d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Get revenue data
      const payments = await storage.getPayments({});
      const recentPayments = payments.filter(p => 
        p.status === 'paid' && new Date(p.createdAt) >= startDate
      );

      // Group by date
      const revenueByDate: Record<string, number> = {};
      recentPayments.forEach(payment => {
        const date = new Date(payment.createdAt).toISOString().split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + payment.amountCents;
      });

      // Get session data
      const sessions = await storage.getSessions({});
      const recentSessions = sessions.filter(s => 
        new Date(s.startTime) >= startDate
      );

      // Group sessions by date and calculate occupancy
      const occupancyByDate: Record<string, { capacity: number; filled: number }> = {};
      recentSessions.forEach(session => {
        const date = new Date(session.startTime).toISOString().split('T')[0];
        if (!occupancyByDate[date]) {
          occupancyByDate[date] = { capacity: 0, filled: 0 };
        }
        occupancyByDate[date].capacity += session.capacity;
        occupancyByDate[date].filled += session.signupsCount || 0;
      });

      res.json({
        revenue: Object.entries(revenueByDate).map(([date, amount]) => ({
          date,
          amount: amount / 100, // Convert to dollars
        })),
        occupancy: Object.entries(occupancyByDate).map(([date, data]) => ({
          date,
          rate: data.capacity > 0 ? Math.round((data.filled / data.capacity) * 100) : 0,
          capacity: data.capacity,
          filled: data.filled,
        })),
        playerGrowth: [], // TODO: Implement player growth tracking
      });
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
}