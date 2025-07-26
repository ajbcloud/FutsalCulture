import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPlayerSchema, insertSessionSchema, insertHelpRequestSchema, insertNotificationPreferencesSchema } from "@shared/schema";
import { z } from "zod";
import "./jobs/capacity-monitor";
import "./jobs/session-status";

// Initialize Stripe only if keys are available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

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

  // Session routes
  app.get('/api/sessions', async (req, res) => {
    try {
      const { ageGroup, location, status } = req.query;
      const sessions = await storage.getSessions({
        ageGroup: ageGroup as string,
        location: location as string,
        status: status as string,
      });
      res.json(sessions);
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
      
      const signup = await storage.createSignup({
        playerId,
        sessionId,
        paid: false,
      });
      
      // Update session status if capacity reached
      const newCount = signupsCount + 1;
      if (newCount >= session.capacity) {
        await storage.updateSessionStatus(sessionId, "full");
      }
      
      res.json(signup);
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

  // Multi-session checkout route
  app.post('/api/multi-checkout', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing unavailable. Please contact support." });
      }

      const { sessions } = req.body;
      const userId = req.user.claims.sub;
      
      if (!sessions || sessions.length === 0) {
        return res.status(400).json({ message: "No sessions selected" });
      }

      // Calculate total amount
      const totalAmount = sessions.length * 1000; // $10 per session in cents

      // Create Stripe checkout session
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Futsal Training Sessions (${sessions.length})`,
              description: 'Multiple session booking',
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/dashboard?payment=success`,
        cancel_url: `${req.protocol}://${req.get('host')}/multi-checkout?payment=cancelled`,
        metadata: {
          userId,
          sessionIds: sessions.map((s: any) => s.sessionId).join(','),
          isMultiSession: 'true',
        },
      });

      res.json({ checkoutUrl: checkoutSession.url });
    } catch (error) {
      console.error("Error creating multi-checkout:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment processing not configured. Please contact support." });
      }
      
      const { signupId } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // $10.00 in cents
        currency: "usd",
        metadata: {
          signupId,
        },
      });
      
      // Store payment record
      await storage.createPayment({
        signupId,
        stripePaymentIntentId: paymentIntent.id,
        amountCents: 1000,
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const { data } = req.body;
      const paymentIntent = data.object;
      
      if (paymentIntent.status === "succeeded") {
        const signupId = paymentIntent.metadata.signupId;
        await storage.updatePaymentStatus(signupId, new Date());
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Error processing webhook" });
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
