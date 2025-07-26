import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPlayerSchema, insertSessionSchema, insertHelpRequestSchema, insertNotificationPreferencesSchema, updateUserSchema } from "@shared/schema";
import { z } from "zod";
import "./jobs/capacity-monitor";
import "./jobs/session-status";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(userId, validatedData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Session routes
  app.get('/api/sessions', async (req, res) => {
    try {
      const { ageGroup, location, status, gender } = req.query;
      const sessions = await storage.getSessions({
        ageGroup: ageGroup as string,
        location: location as string,
        status: status as string,
        gender: gender as string,
      });
      
      // Add signup count to each session
      const sessionsWithCounts = await Promise.all(
        sessions.map(async (session) => {
          const signupsCount = await storage.getSignupsCount(session.id);
          return { ...session, signupsCount };
        })
      );
      
      res.json(sessionsWithCounts);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get('/api/sessions/:id', async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      const signupsCount = await storage.getSignupsCount(session.id);
      res.json({ ...session, signupsCount });
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Help requests route
  app.post('/api/help', async (req, res) => {
    try {
      const validatedData = insertHelpRequestSchema.parse(req.body);
      const helpRequest = await storage.createHelpRequest(validatedData);
      res.status(201).json(helpRequest);
    } catch (error) {
      console.error("Error creating help request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create help request" });
    }
  });

  // Player portal settings routes
  app.patch('/api/players/:id/settings', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = req.params.id;
      const { canAccessPortal, canBookAndPay } = req.body;
      const userId = req.user.claims.sub;

      // Get player and verify ownership
      const player = await storage.getPlayer(playerId);
      if (!player || player.parentId !== userId) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Verify age requirement
      const currentYear = new Date().getFullYear();
      const playerAge = currentYear - player.birthYear;
      if (playerAge < 13) {
        return res.status(403).json({ message: "Player must be 13 or older for portal access" });
      }

      const updatedPlayer = await storage.updatePlayerSettings(playerId, {
        canAccessPortal,
        canBookAndPay
      });

      res.json(updatedPlayer);
    } catch (error) {
      console.error("Error updating player settings:", error);
      res.status(500).json({ message: "Failed to update player settings" });
    }
  });

  app.post('/api/players/:id/invite', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = req.params.id;
      const { method } = req.body; // 'email' or 'sms'
      const userId = req.user.claims.sub;

      // Get player and verify ownership
      const player = await storage.getPlayer(playerId);
      if (!player || player.parentId !== userId) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Verify age requirement
      const currentYear = new Date().getFullYear();
      const playerAge = currentYear - player.birthYear;
      if (playerAge < 13) {
        return res.status(403).json({ message: "Player must be 13 or older for portal access" });
      }

      // Generate invite token (simplified - in production use JWT)
      const inviteToken = Buffer.from(`${playerId}:${Date.now()}`).toString('base64');
      const inviteUrl = `${req.protocol}://${req.get('host')}/player-invite/${inviteToken}`;

      // Update player with invite info
      await storage.updatePlayerInvite(playerId, method, new Date());

      // For now, just return the invite URL (in production, send via email/SMS)
      res.json({
        method,
        inviteUrl,
        message: `Invite would be sent via ${method}`,
        // In production: send actual email/SMS here
      });
    } catch (error) {
      console.error("Error sending player invite:", error);
      res.status(500).json({ message: "Failed to send invite" });
    }
  });

  // Player invite validation and acceptance routes
  app.get('/api/invite/validate/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      // Decode token (simplified - in production use JWT verification)
      let playerId: string;
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        playerId = decoded.split(':')[0];
      } catch {
        return res.status(400).json({ message: "Invalid token format" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Check if account already created
      if (player.userAccountCreated) {
        return res.status(400).json({ message: "Account already exists for this player" });
      }

      // Check age requirement
      const currentYear = new Date().getFullYear();
      const playerAge = currentYear - player.birthYear;
      if (playerAge < 13) {
        return res.status(403).json({ message: "Player must be 13 or older" });
      }

      res.json({ 
        valid: true, 
        player: {
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email
        }
      });
    } catch (error) {
      console.error("Error validating invite:", error);
      res.status(500).json({ message: "Failed to validate invite" });
    }
  });

  app.post('/api/invite/accept/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { firstName, lastName, email, password } = req.body;
      
      // Decode token (simplified - in production use JWT verification)
      let playerId: string;
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        playerId = decoded.split(':')[0];
      } catch {
        return res.status(400).json({ message: "Invalid token format" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      if (player.userAccountCreated) {
        return res.status(400).json({ message: "Account already exists" });
      }

      // Create user account linked to player
      const user = await storage.upsertUser({
        id: `player_${playerId}`,
        email,
        firstName,
        lastName,
      });

      // Mark player account as created and update contact info
      await storage.updatePlayer(playerId, {
        userAccountCreated: true,
        email,
        firstName,
        lastName,
      });

      res.json({ 
        success: true, 
        message: "Player account created successfully",
        userId: user.id
      });
    } catch (error) {
      console.error("Error accepting invite:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Player routes
  app.get('/api/players', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const players = await storage.getPlayersByParent(userId);
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.post('/api/players', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPlayerSchema.parse({
        ...req.body,
        parentId: userId,
      });
      
      const player = await storage.createPlayer(validatedData);
      res.json(player);
    } catch (error) {
      console.error("Error creating player:", error);
      res.status(500).json({ message: "Failed to create player" });
    }
  });

  app.put('/api/players/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPlayerSchema.partial().parse(req.body);
      const player = await storage.updatePlayer(req.params.id, validatedData);
      res.json(player);
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(500).json({ message: "Failed to update player" });
    }
  });

  app.delete('/api/players/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deletePlayer(req.params.id);
      res.json({ message: "Player deleted successfully" });
    } catch (error) {
      console.error("Error deleting player:", error);
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

  // Signup routes (Booking Access Control: Login required)
  app.get('/api/signups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const signups = await storage.getSignupsByParent(userId);
      res.json(signups);
    } catch (error) {
      console.error("Error fetching signups:", error);
      res.status(500).json({ message: "Failed to fetch signups" });
    }
  });

  app.post('/api/signups', isAuthenticated, async (req: any, res) => {
    try {
      const { playerId, sessionId } = req.body;
      
      // Check if signup already exists
      const existing = await storage.checkExistingSignup(playerId, sessionId);
      if (existing) {
        return res.status(400).json({ message: "Player already signed up for this session" });
      }
      
      // Check session capacity
      const session = await storage.getSession(sessionId);
      const signupsCount = await storage.getSignupsCount(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (signupsCount >= session.capacity) {
        return res.status(400).json({ message: "Session is full" });
      }
      
      // Check if session is open for booking (8 AM rule)
      const now = new Date();
      const sessionDate = new Date(session.startTime);
      const bookingOpenTime = new Date(sessionDate);
      bookingOpenTime.setHours(8, 0, 0, 0);
      
      if (now < bookingOpenTime) {
        return res.status(400).json({ message: "Booking opens at 8:00 AM on session day" });
      }
      
      // Create signup with paid = false (reserved but payment pending)
      const signup = await storage.createSignup({
        playerId,
        sessionId,
        paid: false,
      });

      // Get player and session details for response
      const player = await storage.getPlayer(playerId);
      
      // Calculate reservation expiry (1 hour from now)
      const reservationExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      res.json({
        ...signup,
        reservationExpiresAt,
        player,
        session
      });
    } catch (error) {
      console.error("Error creating signup:", error);
      res.status(500).json({ message: "Failed to create signup" });
    }
  });

  app.delete('/api/signups/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteSignup(req.params.id);
      res.json({ message: "Signup cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling signup:", error);
      res.status(500).json({ message: "Failed to cancel signup" });
    }
  });

  // Admin routes for pending payments
  app.get('/api/admin/pending-payments', isAuthenticated, async (req: any, res) => {
    try {
      // For now, any authenticated user can access admin functions
      // In production, add proper admin role checking
      const pendingSignups = await storage.getPendingPaymentSignups();
      res.json(pendingSignups);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      res.status(500).json({ message: "Failed to fetch pending payments" });
    }
  });

  app.post('/api/admin/send-reminder/:signupId', isAuthenticated, async (req: any, res) => {
    try {
      const { signupId } = req.params;
      const signup = await storage.getSignupWithDetails(signupId);
      
      if (!signup) {
        return res.status(404).json({ message: "Signup not found" });
      }

      // TODO: Implement SMS/email reminder service
      // For now, just return success
      console.log(`Payment reminder sent for signup ${signupId}`);
      
      res.json({ success: true, message: "Payment reminder sent" });
    } catch (error) {
      console.error("Error sending payment reminder:", error);
      res.status(500).json({ message: "Failed to send reminder" });
    }
  });

  app.patch('/api/admin/confirm-payment/:signupId', isAuthenticated, async (req: any, res) => {
    try {
      const { signupId } = req.params;
      const signup = await storage.updateSignupPaymentStatus(signupId, true);
      
      if (!signup) {
        return res.status(404).json({ message: "Signup not found" });
      }

      res.json({ success: true, signup });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Multi-session booking route (no payment processing)
  app.post('/api/multi-checkout', isAuthenticated, async (req: any, res) => {
    try {
      const { sessions } = req.body;
      const userId = req.user.claims.sub;
      
      if (!sessions || sessions.length === 0) {
        return res.status(400).json({ message: "No sessions selected" });
      }

      // Create all signups without payment processing
      const signupPromises = sessions.map(async (sessionData: any) => {
        const { sessionId, playerId } = sessionData;
        
        // Check if signup already exists
        const existing = await storage.checkExistingSignup(playerId, sessionId);
        if (existing) {
          throw new Error(`Player already signed up for session ${sessionId}`);
        }
        
        // Check session capacity
        const session = await storage.getSession(sessionId);
        const signupsCount = await storage.getSignupsCount(sessionId);
        
        if (!session) {
          throw new Error(`Session ${sessionId} not found`);
        }
        
        if (signupsCount >= session.capacity) {
          throw new Error(`Session ${sessionId} is full`);
        }
        
        // Create signup with paid set to true (no payment required)
        return await storage.createSignup({
          playerId,
          sessionId,
          paid: true,
        });
      });

      const signups = await Promise.all(signupPromises);
      res.json({ signups, message: "All sessions booked successfully" });
    } catch (error) {
      console.error("Error creating multi-booking:", error);
      res.status(500).json({ message: "Failed to book sessions" });
    }
  });



  // Help request routes
  app.post('/api/help-requests', async (req, res) => {
    try {
      const validatedData = insertHelpRequestSchema.parse(req.body);
      const helpRequest = await storage.createHelpRequest(validatedData);
      res.json(helpRequest);
    } catch (error) {
      console.error("Error creating help request:", error);
      res.status(500).json({ message: "Failed to submit help request" });
    }
  });

  // Notification preferences routes
  app.get('/api/notification-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getNotificationPreferences(userId);
      res.json(preferences || { email: true, sms: false });
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.post('/api/notification-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertNotificationPreferencesSchema.parse({
        ...req.body,
        parentId: userId,
      });
      
      const preferences = await storage.upsertNotificationPreferences(validatedData);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Admin routes
  app.get('/api/admin/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.post('/api/admin/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const validatedData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(validatedData);
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get('/api/admin/help-requests', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const helpRequests = await storage.getHelpRequests();
      res.json(helpRequests);
    } catch (error) {
      console.error("Error fetching help requests:", error);
      res.status(500).json({ message: "Failed to fetch help requests" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
