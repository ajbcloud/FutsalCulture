import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupAuth as setupLocalAuth } from "./auth";
import { 
  insertPlayerSchema, 
  insertSessionSchema, 
  insertHelpRequestSchema, 
  insertNotificationPreferencesSchema, 
  updateUserSchema, 
  systemSettings,
  joinWaitlistSchema,
  leaveWaitlistSchema,
  promoteWaitlistSchema
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import "./jobs/capacity-monitor";
import "./jobs/session-status";
import { setupAdminRoutes } from './admin-routes';
import { setupSuperAdminRoutes } from './super-admin-routes';
import { stripeWebhookRouter } from './stripe-webhooks';
import publicIngestionRoutes from './routes/publicIngestion';
import { impersonationContext } from './middleware/impersonation';
import * as impersonationController from './controllers/impersonation';
import { maintenanceMode, enforceMFA, enforceSessionTimeout } from './middleware/platformPolicies';
import { setupBetaOnboardingRoutes } from './beta-onboarding-routes';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';


export async function registerRoutes(app: Express): Promise<Server> {
  // Public ingestion endpoints (BEFORE auth middleware since they're public)
  app.use('/api/public', publicIngestionRoutes);

  // Stripe webhook routes (must be BEFORE auth middleware since webhooks use their own verification)
  app.use('/api/stripe', stripeWebhookRouter);

  // Auth middleware
  await setupAuth(app);
  
  // Local email/password authentication
  await setupLocalAuth(app);

  // Platform policy middleware (must be after auth)
  app.use(maintenanceMode); // Check maintenance mode for all routes
  app.use(enforceSessionTimeout); // Check session timeout for all authenticated routes
  app.use(enforceMFA); // Enforce MFA requirements

  // Impersonation context middleware (must be after auth and policies)
  app.use(impersonationContext);

  // Hardcoded super admin failsafe - must match the one in super-admin-routes.ts
  const FAILSAFE_SUPER_ADMIN_ID = "ajosephfinch";

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let userId;
      
      // Check for local session first (password-based users)
      if (req.session?.userId) {
        userId = req.session.userId;
      }
      // Fall back to Replit Auth user
      else if (req.user?.id) {
        userId = req.user.id;
      }
      // In development, allow the hardcoded super admin user to bypass auth
      else if (process.env.NODE_ENV === 'development') {
        userId = FAILSAFE_SUPER_ADMIN_ID;
        // IMPORTANT: Set the session so subsequent requests work
        req.session.userId = userId;
        await new Promise((resolve) => req.session.save(resolve));
        console.log("🔧 Development mode: Using failsafe admin ID and creating session");
      }
      // No authentication found
      else {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      let user = await storage.getUser(userId);

      // Apply failsafe super admin permissions if this is the hardcoded admin
      if (userId === FAILSAFE_SUPER_ADMIN_ID) {
        if (user) {
          // Ensure failsafe admin always has super admin permissions, regardless of database state
          user = {
            ...user,
            isSuperAdmin: true,
            isAdmin: true,
          };
        } else {
          // If failsafe admin doesn't exist in database, create a minimal user object
          console.log("⚠️ Failsafe super admin not found in database, creating virtual user");
          user = {
            id: userId,
            username: "failsafe-admin",
            email: "admin@system.local",
            isAdmin: true,
            isSuperAdmin: true,
            isAssistant: false,
            tenantId: null, // Super admin can access all tenants
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            planId: 'elite' as const,
            billingStatus: 'active' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        console.log("✓ Failsafe super admin permissions applied:", { id: user.id, isSuperAdmin: user.isSuperAdmin });
      }

      // Log user for debugging
      console.log("User fetched:", { id: user?.id, isAdmin: user?.isAdmin, isAssistant: user?.isAssistant, isSuperAdmin: user?.isSuperAdmin });

      res.json(user);
    } catch (error) {
      // Even if database fails, provide failsafe admin access
      let userId = req.user?.id;
      // In development mode, also check for hardcoded admin
      if (!userId && process.env.NODE_ENV === 'development') {
        userId = FAILSAFE_SUPER_ADMIN_ID;
      }
      if (userId === FAILSAFE_SUPER_ADMIN_ID) {
        console.log("✓ Database error - providing failsafe super admin access");
        const failsafeUser = {
          id: userId,
          username: "failsafe-admin",
          email: "admin@system.local",
          isAdmin: true,
          isSuperAdmin: true,
          isAssistant: false,
          tenantId: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          planId: 'elite' as const,
          billingStatus: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return res.json(failsafeUser);
      }

      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Check missing consent forms for a player (public endpoint for users)
  app.get('/api/consent/missing/:playerId', isAuthenticated, async (req: any, res) => {
    try {
      const { playerId } = req.params;
      const parentId = req.user.id;
      const tenantId = req.user?.tenantId;

      const missingForms = await storage.checkMissingConsentForms(playerId, parentId, tenantId);
      res.json(missingForms);
    } catch (error) {
      console.error('Error checking missing consent forms:', error);
      res.status(500).json({ error: 'Failed to check missing consent forms' });
    }
  });

  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // User registration endpoint with mandatory consent validation
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { 
        firstName, 
        lastName, 
        email, 
        username, 
        dateOfBirth, 
        role, 
        parentContact, 
        consentDocuments,
        tenantId
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !role) {
        return res.status(400).json({ 
          error: "Missing required fields: firstName, lastName, email, role" 
        });
      }

      // MANDATORY: Validate consent documents are provided
      if (!consentDocuments || !Array.isArray(consentDocuments) || consentDocuments.length === 0) {
        return res.status(400).json({ 
          error: "Consent documents are required to complete registration. You must sign all required consent forms before proceeding.",
          consentRequired: true
        });
      }

      // Validate that consent documents exist and are signed
      for (const docId of consentDocuments) {
        try {
          const signatures = await storage.getConsentSignaturesByDocument(docId);
          if (signatures.length === 0) {
            return res.status(400).json({ 
              error: "All consent documents must be signed before registration can be completed.",
              consentRequired: true
            });
          }
        } catch (error) {
          console.error("Error validating consent document:", docId, error);
          return res.status(400).json({ 
            error: "Invalid consent document provided. Please ensure all consent forms are properly signed.",
            consentRequired: true
          });
        }
      }

      // Get tenant ID from various sources
      const targetTenantId = tenantId || req.user?.tenantId || req.session?.user?.tenantId;
      if (!targetTenantId) {
        return res.status(400).json({ error: "Tenant ID required" });
      }

      // Check auto-approve setting
      const autoApproveSetting = await db.select()
        .from(systemSettings)
        .where(eq(systemSettings.key, 'autoApproveRegistrations'))
        .limit(1);

      const autoApprove = autoApproveSetting[0]?.value === 'true' || autoApproveSetting.length === 0;

      // Create user with validated consent
      const userData = {
        id: req.user?.id || email.split('@')[0] + '-' + Date.now(),
        firstName,
        lastName,
        email,
        tenantId: targetTenantId,
        isApproved: autoApprove,
        registrationStatus: autoApprove ? 'approved' as const : 'pending' as const,
      };

      const user = await storage.upsertUser(userData);

      // If this is a player registration, create the player record
      if (role === 'player' && dateOfBirth) {
        const playerData = {
          id: user.id,
          firstName,
          lastName,
          birthYear: new Date(dateOfBirth).getFullYear(),
          gender: (req.body.gender || 'boys') as 'boys' | 'girls',
          tenantId: targetTenantId,
          parentId: req.body.parentId || '',
          isApproved: autoApprove,
          registrationStatus: autoApprove ? 'approved' as const : 'pending' as const,
        };

        await storage.createPlayer(playerData);
      }

      // Log successful registration with consent validation
      console.log(`✅ User registered with consent validation:`, { 
        id: user.id, 
        role, 
        consentDocuments: consentDocuments.length,
        autoApprove 
      });

      res.status(201).json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isApproved: user.isApproved,
        registrationStatus: user.registrationStatus,
        consentValidated: true
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ 
        error: "Registration failed. Please ensure all consent documents are properly signed and try again." 
      });
    }
  });

  // Impersonation routes
  app.get('/impersonate', impersonationController.consume);
  app.get('/api/impersonation/status', isAuthenticated, impersonationController.status);
  app.post('/api/impersonation/end', isAuthenticated, impersonationController.end);

  // Tenant capabilities routes
  app.get('/api/tenant/capabilities', isAuthenticated, async (req: any, res) => {
    const { getTenantCapabilities } = await import('./controllers/tenant/capabilities');
    return getTenantCapabilities(req, res);
  });

  app.get('/api/tenant/capabilities/:featureKey', isAuthenticated, async (req: any, res) => {
    const { checkCapability } = await import('./controllers/tenant/capabilities');
    return checkCapability(req, res);
  });

  // Session routes
  app.get('/api/sessions', async (req: any, res) => {
    try {
      const { ageGroup, location, status, gender, includePast } = req.query;

      // Get tenant ID from authenticated user, or allow all sessions for non-authenticated users
      let tenantId;
      if (req.user?.id) {
        const user = await storage.getUser(req.user.id);
        tenantId = user?.tenantId;
      }

      const sessions = await storage.getSessions({
        ageGroup: ageGroup as string,
        location: location as string,
        status: status as string,
        gender: gender as string,
        tenantId: tenantId || undefined,
        includePast: includePast === 'true',
      });

      console.log('Sessions API called:', { 
        tenantId, 
        sessionsCount: sessions.length, 
        filters: { ageGroup, location, status, gender, includePast },
        futureSessions: sessions.filter(s => new Date(s.startTime) > new Date()).length,
        todaySessions: sessions.filter(s => new Date(s.startTime).toDateString() === new Date().toDateString()).length
      });

      // Check if our specific session is included
      const testSession = sessions.find(s => s.id === 'a9e03e7b-5622-4e6a-a06f-243b7ac7acc1');
      if (testSession) {
        console.log('Found test session:', { 
          id: testSession.id, 
          title: testSession.title, 
          startTime: testSession.startTime,
          noTimeConstraints: testSession.noTimeConstraints,
          status: testSession.status 
        });
      } else {
        console.log('Test session NOT found in results');
      }

      if (sessions.length > 0) {
        const sampleSession = sessions[0];
        console.log('Sample session data:', { 
          id: sampleSession.id, 
          ageGroups: sampleSession.ageGroups, 
          genders: sampleSession.genders, 
          location: sampleSession.location,
          startTime: sampleSession.startTime,
          isPast: new Date(sampleSession.startTime) < new Date()
        });
      }

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

  // Session filters endpoint
  app.get("/api/session-filters", async (req: Request, res: Response) => {
    try {
      let tenantId = null;

      if (req.user) {
        const user = await storage.getUser(req.user.id);
        tenantId = user?.tenantId;
      }

      // Get all sessions for the tenant (including past) to build comprehensive filter options
      const sessions = await storage.getSessions({ tenantId: tenantId || undefined, includePast: true });

      // Extract unique values for age groups and genders from sessions
      const uniqueAgeGroups = Array.from(new Set(sessions.flatMap(session => session.ageGroups || [])));
      const uniqueGenders = Array.from(new Set(sessions.flatMap(session => session.genders || [])));

      // Get configured locations from admin settings
      let availableLocations = ['Turf City', 'Sports Hub', 'Jurong East']; // Default fallback

      if (tenantId) {
        try {
          const settings = await db.select()
            .from(systemSettings)
            .where(eq(systemSettings.tenantId, tenantId));

          const locationsSetting = settings.find(s => s.key === 'availableLocations');
          if (locationsSetting?.value) {
            try {
              const parsedLocations = JSON.parse(locationsSetting.value);
              // Extract just the names from location objects
              availableLocations = parsedLocations.map((loc: any) => 
                typeof loc === 'object' ? loc.name : loc
              ).filter((name: string) => name);
            } catch (e) {
              // If parsing fails, treat as comma-separated string
              availableLocations = locationsSetting.value.split(',').map(s => s.trim()).filter(s => s);
            }
          }
        } catch (settingsError) {
          console.error('Error fetching settings for locations:', settingsError);
          // Keep default locations on error
        }
      }

      const filters = {
        ageGroups: uniqueAgeGroups.sort(),
        locations: availableLocations.sort(),
        genders: uniqueGenders.sort(),
      };

      console.log('Session filters generated:', { tenantId, totalSessions: sessions.length, filters });

      res.json(filters);
    } catch (error) {
      console.error("Error fetching session filters:", error);
      res.status(500).json({ error: "Failed to fetch session filters" });
    }
  });

  // Help requests route
  app.post('/api/help', async (req, res) => {
    try {
      const validatedData = insertHelpRequestSchema.parse(req.body);
      const helpRequest = await storage.createHelpRequest(validatedData);

      // Send email notification to support team
      try {
        const { sendHelpRequestNotification } = await import('./emailService');
        const supportEmail = await storage.getSystemSetting('supportEmail') || 'support@playhq.app';
        await sendHelpRequestNotification(supportEmail, {
          name: `${helpRequest.firstName} ${helpRequest.lastName}`,
          email: helpRequest.email,
          phone: helpRequest.phone || undefined,
          note: helpRequest.message
        });
      } catch (emailError) {
        console.error("Failed to send help request notification email:", emailError);
        // Don't fail the request if email fails
      }

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
      const userId = req.user.id;

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
      const userId = req.user.id;

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

  // Parent 2 invite routes
  app.post('/api/parent2/invite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { method, email, phoneNumber } = req.body;

      if (!method || (method !== 'email' && method !== 'sms')) {
        return res.status(400).json({ message: "Valid invite method required (email or sms)" });
      }

      if (method === 'email' && !email) {
        return res.status(400).json({ message: "Email address required" });
      }

      if (method === 'sms' && !phoneNumber) {
        return res.status(400).json({ message: "Phone number required" });
      }

      // Generate invite token (simplified - in production use JWT)
      const inviteToken = Buffer.from(`parent2:${userId}:${Date.now()}`).toString('base64');
      const inviteUrl = `${req.protocol}://${req.get('host')}/parent2-invite/${inviteToken}`;

      // Update user with invite info
      await storage.updateUserParent2Invite(userId, method, method === 'email' ? email : phoneNumber, new Date());

      // For now, just return the invite URL (in production, send via email/SMS)
      res.json({
        method,
        inviteUrl,
        message: `Parent 2 invite would be sent via ${method}`,
        // In production: send actual email/SMS here
      });
    } catch (error) {
      console.error("Error sending parent 2 invite:", error);
      res.status(500).json({ message: "Failed to send invite" });
    }
  });

  // Parent 2 invite validation and acceptance routes
  app.get('/api/parent2-invite/validate/:token', async (req, res) => {
    try {
      const { token } = req.params;

      // Decode token (simplified - in production use JWT verification)
      let parentId: string;
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const parts = decoded.split(':');
        if (parts[0] !== 'parent2') throw new Error('Invalid token type');
        parentId = parts[1];
      } catch {
        return res.status(400).json({ message: "Invalid token format" });
      }

      const parent1 = await storage.getUser(parentId);
      if (!parent1) {
        return res.status(404).json({ message: "Parent not found" });
      }

      res.json({ 
        valid: true, 
        parent1: {
          id: parent1.id,
          firstName: parent1.firstName,
          lastName: parent1.lastName,
          email: parent1.parent2InviteEmail || parent1.parent2InvitePhone
        }
      });
    } catch (error) {
      console.error("Error validating parent 2 invite:", error);
      res.status(500).json({ message: "Failed to validate invite" });
    }
  });

  app.post('/api/parent2-invite/accept/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { firstName, lastName, email, phone } = req.body;

      // Decode token (simplified - in production use JWT verification)
      let parent1Id: string;
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const parts = decoded.split(':');
        if (parts[0] !== 'parent2') throw new Error('Invalid token type');
        parent1Id = parts[1];
      } catch {
        return res.status(400).json({ message: "Invalid token format" });
      }

      const parent1 = await storage.getUser(parent1Id);
      if (!parent1) {
        return res.status(404).json({ message: "Parent not found" });
      }

      // Create parent 2 user account
      const parent2 = await storage.upsertUser({
        id: `parent2_${parent1Id}_${Date.now()}`,
        email,
        firstName,
        lastName,
        phone,
      });

      // Update all players belonging to parent 1 to include parent 2
      await storage.updatePlayersParent2(parent1Id, parent2.id);

      res.json({ 
        success: true, 
        message: "Parent 2 account created successfully",
        userId: parent2.id
      });
    } catch (error) {
      console.error("Error accepting parent 2 invite:", error);
      res.status(500).json({ message: "Failed to create parent 2 account" });
    }
  });

  // Player routes
  app.get('/api/players', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const players = await storage.getPlayersByParent(userId);
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  // Consent documents for parent - get all signed consent forms
  app.get('/api/parent/consent-documents', isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user.id;

      // Get user's tenant information
      const user = await storage.getUser(parentId);
      if (!user || !user.tenantId) {
        return res.status(400).json({ message: "User tenant not found" });
      }

      const signedConsents = await storage.getSignedConsentsByParent(parentId, user.tenantId);
      res.json(signedConsents);
    } catch (error) {
      console.error("Error fetching parent consent documents:", error);
      res.status(500).json({ message: "Failed to fetch consent documents" });
    }
  });

  // Admin session history endpoint for players
  app.get('/api/admin/players/:id/session-history', isAuthenticated, async (req: any, res) => {
    try {
      const { id: playerId } = req.params;
      const { page = '1', limit = '20' } = req.query;
      const userId = req.user.id;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 20);
      const offset = (pageNum - 1) * limitNum;

      // Get user information and verify admin access
      const user = await storage.getUser(userId);
      if (!user || (!user.isAdmin && !user.isAssistant)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!user?.tenantId) {
        return res.status(403).json({ message: "Access denied: no tenant context" });
      }

      const { db } = await import('./db');
      const { players, signups, futsalSessions } = await import('../shared/schema');
      const { eq, and, desc, sql } = await import('drizzle-orm');

      // Verify player belongs to admin's tenant
      const [player] = await db.select()
        .from(players)
        .where(and(
          eq(players.id, playerId),
          eq(players.tenantId, user.tenantId)
        ))
        .limit(1);

      if (!player) {
        return res.status(404).json({ message: "Player not found in your tenant" });
      }

      // Get total count of PAID sessions only for this player
      const [totalResult] = await db.select({ 
        count: sql<number>`count(*)::int` 
      })
      .from(signups)
      .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
      .where(and(
        eq(signups.playerId, playerId),
        eq(futsalSessions.tenantId, user.tenantId),
        eq(signups.paid, true) // Only paid sessions
      ));

      const total = totalResult?.count || 0;

      // Get paginated session history with payment details (only paid sessions)
      const sessionHistory = await db.select({
        id: signups.id,
        sessionId: signups.sessionId,
        sessionName: futsalSessions.title,
        date: futsalSessions.startTime,
        time: futsalSessions.startTime,
        location: futsalSessions.location,
        paid: signups.paid,
        paymentId: signups.paymentId,
        paymentProvider: signups.paymentProvider,
        createdAt: signups.createdAt,
      })
      .from(signups)
      .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
      .where(and(
        eq(signups.playerId, playerId),
        eq(futsalSessions.tenantId, user.tenantId),
        eq(signups.paid, true) // Only paid sessions
      ))
      .orderBy(desc(futsalSessions.startTime))
      .limit(limitNum)
      .offset(offset);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        sessions: sessionHistory.map(session => ({
          ...session,
          date: session.date.toISOString().split('T')[0], // Format date
          time: session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          refunded: session.refunded || false,
          refundReason: session.refundReason,
          refundedAt: session.refundedAt
        })),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      console.error("Error fetching admin player session history:", error);
      res.status(500).json({ message: "Failed to fetch session history" });
    }
  });

  // Get session history for a specific player (parent/player portal view)
  app.get('/api/players/:id/session-history', isAuthenticated, async (req: any, res) => {
    try {
      const { id: playerId } = req.params;
      const { page = '1', limit = '20' } = req.query;
      const userId = req.user.id;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 20);
      const offset = (pageNum - 1) * limitNum;

      // Get user's tenant ID
      const user = await storage.getUser(userId);
      if (!user?.tenantId) {
        return res.status(403).json({ message: "Access denied: no tenant context" });
      }

      // Verify player belongs to this parent or is the player themselves
      const { db } = await import('./db');
      const { players, signups, futsalSessions } = await import('../shared/schema');
      const { eq, and, desc, sql, or } = await import('drizzle-orm');

      const [player] = await db.select()
        .from(players)
        .where(and(
          eq(players.id, playerId),
          eq(players.tenantId, user.tenantId),
          // Allow access if user is the parent (parent1 or parent2) or if they're the player with portal access
          or(
            eq(players.parentId, userId),
            eq(players.parent2Id, userId),
            and(
              eq(players.email, user.email), // Player accessing their own history
              eq(players.canAccessPortal, true)
            )
          )
        ))
        .limit(1);

      if (!player) {
        return res.status(404).json({ message: "Player not found or access denied" });
      }

      // Get total count of PAID sessions only for this player
      const [totalResult] = await db.select({ 
        count: sql<number>`count(*)::int` 
      })
      .from(signups)
      .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
      .where(and(
        eq(signups.playerId, playerId),
        eq(futsalSessions.tenantId, user.tenantId),
        eq(signups.paid, true) // Only paid sessions
      ));

      const total = totalResult?.count || 0;

      // Get paginated session history with payment details (only paid sessions)
      const sessionHistory = await db.select({
        id: signups.id,
        sessionId: signups.sessionId,
        sessionName: futsalSessions.title,
        date: futsalSessions.startTime,
        startTime: futsalSessions.startTime,
        endTime: futsalSessions.endTime,
        location: futsalSessions.location,
        paid: signups.paid,
        paymentId: signups.paymentId,
        paymentProvider: signups.paymentProvider,
        refunded: signups.refunded,
        refundReason: signups.refundReason,
        refundedAt: signups.refundedAt,
        createdAt: signups.createdAt,
        updatedAt: signups.updatedAt,
      })
      .from(signups)
      .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
      .where(and(
        eq(signups.playerId, playerId),
        eq(futsalSessions.tenantId, user.tenantId),
        eq(signups.paid, true) // Only paid sessions
      ))
      .orderBy(desc(futsalSessions.startTime))
      .limit(limitNum)
      .offset(offset);

      // Format the response data (without transaction IDs)
      const sessions = sessionHistory.map(session => ({
        id: session.id,
        sessionId: session.sessionId,
        sessionName: session.sessionName || 'Training Session',
        date: session.date,
        time: `${new Date(session.startTime).toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })} - ${new Date(session.endTime).toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}`,
        sessionDate: new Date(session.startTime).toISOString().split('T')[0], // YYYY-MM-DD format
        sessionStartTime: new Date(session.startTime).toISOString().split('T')[1].split('.')[0], // HH:MM:SS format in UTC
        location: session.location,
        paid: session.paid,
        paymentId: session.paymentId,
        paymentProvider: session.paymentProvider,
        refunded: session.refunded || false,
        refundReason: session.refundReason,
        refundedAt: session.refundedAt,
        createdAt: session.createdAt,
      }));

      res.json({
        sessions,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      console.error("Error fetching player session history:", error);
      res.status(500).json({ message: "Failed to fetch session history" });
    }
  });

  app.post('/api/players', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get user's tenant information
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Assign default tenant if user doesn't have one (for existing users)
      let tenantId = user.tenantId;
      if (!tenantId) {
        // Get the first available tenant or create a default one
        const { db } = await import("./db");
        const { tenants } = await import("@shared/schema");

        const existingTenants = await db.select().from(tenants).limit(1);
        if (existingTenants.length > 0) {
          tenantId = existingTenants[0].id;
          // Update user with tenant assignment
          await storage.updateUser(userId, { tenantId });
        } else {
          return res.status(400).json({ message: "No tenant available for player creation" });
        }
      }

      // Check if auto-approve is enabled
      const { db } = await import("./db");
      const { systemSettings } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const autoApproveSetting = await db.select()
        .from(systemSettings)
        .where(eq(systemSettings.key, 'autoApproveRegistrations'))
        .limit(1);

      const autoApprove = autoApproveSetting[0]?.value === 'true' || autoApproveSetting.length === 0; // Default to true if not set

      const validatedData = insertPlayerSchema.parse({
        ...req.body,
        tenantId,
        parentId: userId,
        isApproved: autoApprove,
        registrationStatus: autoApprove ? 'approved' : 'pending',
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
      const userId = req.user.id;
      const signups = await storage.getSignupsByParent(userId);
      res.json(signups);
    } catch (error) {
      console.error("Error fetching signups:", error);
      res.status(500).json({ message: "Failed to fetch signups" });
    }
  });

  app.post('/api/signups', isAuthenticated, async (req: any, res) => {
    try {
      const { playerId, sessionId, accessCode, fromWaitlistOffer, offerId, reserveOnly } = req.body;

      // Special handling for waitlist offers
      if (fromWaitlistOffer && offerId) {
        // Verify the waitlist offer exists and is still valid
        const offer = await storage.getWaitlistEntry(sessionId, playerId);
        if (!offer || offer.id !== offerId || offer.offerStatus !== 'offered') {
          return res.status(400).json({ message: "Invalid or expired waitlist offer" });
        }

        // Check if offer has expired
        const now = new Date();
        if (offer.offerExpiresAt && offer.offerExpiresAt < now) {
          return res.status(400).json({ message: "Waitlist offer has expired" });
        }

        // Mark the waitlist offer as accepted and create signup
        const updatedOffer = await storage.acceptWaitlistOffer(offerId);

        // Create signup with paid = true since this is from a waitlist promotion
        const session = await storage.getSession(sessionId);
        const userId = req.user.id;
        const currentUser = await storage.getUser(userId);

        const signup = await storage.createSignup({
          tenantId: currentUser?.tenantId || session.tenantId,
          playerId,
          sessionId,
          paid: true, // Waitlist offers are marked as paid immediately
        });

        // Remove the waitlist entry since player is now signed up
        await storage.leaveWaitlist(sessionId, playerId);

        const player = await storage.getPlayer(playerId);

        return res.json({
          ...signup,
          player,
          session,
          message: "Successfully confirmed spot from waitlist offer"
        });
      }

      // Regular signup flow
      // Check if signup already exists
      const existing = await storage.checkExistingSignup(playerId, sessionId);
      if (existing) {
        return res.status(400).json({ message: "Player already signed up for this session" });
      }

      // Check for missing consent forms
      const parentId = req.user.id;
      const tenantId = req.user?.tenantId;

      try {
        const missingForms = await storage.checkMissingConsentForms(playerId, parentId, tenantId);
        if (missingForms.length > 0) {
          const formTitles = missingForms.map(f => f.title).join(', ');
          return res.status(400).json({ 
            message: `Please complete the following consent forms before booking: ${formTitles}`,
            missingConsentForms: missingForms
          });
        }
      } catch (error) {
        console.error('Error checking consent forms during signup:', error);
        // Don't block signup if consent check fails
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

      // Check access code if session requires it
      if (session.hasAccessCode) {
        if (!accessCode || accessCode.trim().length === 0) {
          return res.status(400).json({ message: "Access code is required for this session" });
        }

        if (accessCode.trim().toUpperCase() !== session.accessCode) {
          return res.status(400).json({ message: "Invalid access code" });
        }
      }

      // Check if session is open for booking based on constraints
      const now = new Date();
      const sessionDate = new Date(session.startTime);

      // Check if session has no time constraints
      if (!session.noTimeConstraints) {
        // Check for days before booking constraint
        if (session.daysBeforeBooking && session.daysBeforeBooking > 0) {
          const daysBeforeMs = session.daysBeforeBooking * 24 * 60 * 60 * 1000;
          const bookingOpenTime = new Date(sessionDate.getTime() - daysBeforeMs);

          if (now < bookingOpenTime) {
            const openDate = bookingOpenTime.toLocaleDateString();
            const openTime = bookingOpenTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
            return res.status(400).json({ message: `Booking opens on ${openDate} at ${openTime}` });
          }
        } else {
          // Default 8 AM rule
          const isToday = sessionDate.toDateString() === now.toDateString();
          if (!isToday) {
            const sessionDay = sessionDate.toLocaleDateString();
            return res.status(400).json({ message: `Booking opens at 8:00 AM on ${sessionDay}` });
          }

          const bookingOpenTime = new Date(sessionDate);
          const hour = session.bookingOpenHour ?? 8;
          const minute = session.bookingOpenMinute ?? 0;
          bookingOpenTime.setHours(hour, minute, 0, 0);

          if (now < bookingOpenTime) {
            const openTime = bookingOpenTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
            return res.status(400).json({ message: `Booking opens at ${openTime} on session day` });
          }
        }
      }
      // If noTimeConstraints is true, skip all time validation

      // Get current user to access tenantId
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);

      // Calculate reservation expiry (1 hour from now) if this is a reservation
      const reservationExpiresAt = reserveOnly ? new Date(Date.now() + 60 * 60 * 1000) : null;

      // Create signup with appropriate payment status
      const signup = await storage.createSignup({
        tenantId: currentUser?.tenantId || session.tenantId,
        playerId,
        sessionId,
        paid: !reserveOnly, // If reserveOnly, mark as unpaid; otherwise paid
        reservationExpiresAt,
      });

      // Get player and session details for response
      const player = await storage.getPlayer(playerId);

      res.json({
        ...signup,
        player,
        session,
        message: reserveOnly ? "Spot reserved temporarily - payment required within 1 hour" : "Successfully signed up!"
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

  // Admin route for all payments with status filtering
  app.get('/api/admin/payments', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.query;
      const user = req.user;

      if (!user || !user.tenantId) {
        return res.status(400).json({ message: "User tenant not found" });
      }

      let payments = [];

      if (status === 'pending') {
        payments = await storage.getPendingPaymentSignups(user.tenantId);
      } else if (status === 'paid') {
        payments = await storage.getPaidPaymentSignups(user.tenantId);
      } else {
        // Get both pending and paid
        const [pending, paid] = await Promise.all([
          storage.getPendingPaymentSignups(user.tenantId),
          storage.getPaidPaymentSignups(user.tenantId)
        ]);
        payments = [...pending, ...paid];
      }

      res.json(payments);
    } catch (error) {
      console.error("Error fetching admin payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
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

  // Admin payment confirmation route (compatible with frontend API)
  app.post('/api/admin/payments/:signupId/mark-paid', isAuthenticated, async (req: any, res) => {
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

  // Admin payment refund route
  app.post('/api/admin/payments/:paymentId/refund', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;
      const user = req.user;

      // Process refund (placeholder - would integrate with actual payment system)
      const refund = await storage.processRefund(paymentId, reason, user.id);

      res.json({ success: true, refund });
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: "Failed to process refund" });
    }
  });

  // Multi-session booking route (no payment processing)
  app.post('/api/multi-checkout', isAuthenticated, async (req: any, res) => {
    try {
      const { sessions } = req.body;
      const userId = req.user.id;

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
          tenantId: session.tenantId,
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

  // Waitlist routes
  app.post('/api/sessions/:sessionId/waitlist/join', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get user's tenant information
      const user = await storage.getUser(userId);
      if (!user || !user.tenantId) {
        return res.status(400).json({ message: "User tenant not found" });
      }

      const validatedData = joinWaitlistSchema.parse(req.body);
      const { playerId, notifyOnJoin, notifyOnPositionChange } = validatedData;

      // Check if session exists and is full
      const session = await storage.getSession(sessionId, user.tenantId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const signupsCount = await storage.getSignupsCount(sessionId);
      if (signupsCount < session.capacity) {
        return res.status(409).json({ message: "Session is not full - you can book directly" });
      }

      // Check if waitlist is enabled
      if (!session.waitlistEnabled) {
        return res.status(400).json({ message: "Waitlist is not enabled for this session" });
      }

      // Check waitlist limit
      const waitlistCount = await storage.getWaitlistCount(sessionId);
      if (session.waitlistLimit && waitlistCount >= session.waitlistLimit) {
        return res.status(409).json({ message: "Waitlist is full" });
      }

      // Check if player is already on waitlist
      const existingEntry = await storage.getWaitlistEntry(sessionId, playerId);
      if (existingEntry && existingEntry.status === 'active') {
        return res.status(400).json({ message: "Player is already on the waitlist" });
      }

      // Join waitlist
      const waitlistEntry = await storage.joinWaitlist(
        sessionId,
        playerId,
        userId,
        user.tenantId,
        { notifyOnJoin, notifyOnPositionChange }
      );

      res.json({ 
        waitlistEntry,
        position: waitlistEntry.position,
        message: `Added to waitlist at position ${waitlistEntry.position}` 
      });
    } catch (error) {
      console.error("Error joining waitlist:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to join waitlist" });
    }
  });

  app.delete('/api/sessions/:sessionId/waitlist/leave', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get user's tenant information
      const user = await storage.getUser(userId);
      if (!user || !user.tenantId) {
        return res.status(400).json({ message: "User tenant not found" });
      }

      const validatedData = leaveWaitlistSchema.parse(req.body);
      const { playerId } = validatedData;

      // Check if player is on waitlist
      const existingEntry = await storage.getWaitlistEntry(sessionId, playerId);
      if (!existingEntry || existingEntry.status !== 'active') {
        return res.status(404).json({ message: "Player is not on the waitlist" });
      }

      // Leave waitlist
      await storage.leaveWaitlist(sessionId, playerId);

      res.json({ message: "Successfully left the waitlist" });
    } catch (error) {
      console.error("Error leaving waitlist:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to leave waitlist" });
    }
  });

  app.get('/api/sessions/:sessionId/waitlist', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get user information
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is admin or accessing their own waitlist data
      if (!user.isAdmin && !user.isAssistant) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const waitlistEntries = await storage.getWaitlistBySession(sessionId, user.tenantId);

      res.json(waitlistEntries);
    } catch (error) {
      console.error("Error fetching waitlist:", error);
      res.status(500).json({ message: "Failed to fetch waitlist" });
    }
  });

  // Admin-specific waitlist routes
  app.get('/api/admin/sessions/:sessionId/waitlist-count', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get user information and check admin access
      const user = await storage.getUser(userId);
      if (!user || (!user.isAdmin && !user.isAssistant)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const waitlistCount = await storage.getWaitlistCount(sessionId);

      res.json(waitlistCount);
    } catch (error) {
      console.error("Error fetching waitlist count:", error);
      res.status(500).json({ message: "Failed to fetch waitlist count" });
    }
  });

  app.get('/api/admin/sessions/:sessionId/waitlist', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get user information and check admin access
      const user = await storage.getUser(userId);
      if (!user || (!user.isAdmin && !user.isAssistant)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const waitlistEntries = await storage.getWaitlistBySession(sessionId, user.tenantId);

      res.json(waitlistEntries);
    } catch (error) {
      console.error("Error fetching waitlist for admin:", error);
      res.status(500).json({ message: "Failed to fetch waitlist" });
    }
  });

  app.get('/api/waitlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get user's tenant information
      const user = await storage.getUser(userId);
      if (!user || !user.tenantId) {
        return res.status(400).json({ message: "User tenant not found" });
      }

      const waitlistEntries = await storage.getWaitlistByParent(userId, user.tenantId);

      res.json(waitlistEntries);
    } catch (error) {
      console.error("Error fetching waitlists:", error);
      res.status(500).json({ message: "Failed to fetch waitlists" });
    }
  });

  // Admin waitlist routes
  app.patch('/api/admin/sessions/:sessionId/waitlist/settings', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get user information and check admin access
      const user = await storage.getUser(userId);
      if (!user || (!user.isAdmin && !user.isAssistant)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = waitlistSettingsSchema.parse(req.body);

      const updatedSession = await storage.updateWaitlistSettings(sessionId, validatedData);

      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating waitlist settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update waitlist settings" });
    }
  });

  app.post('/api/admin/sessions/:sessionId/waitlist/promote', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get user information and check admin access
      const user = await storage.getUser(userId);
      if (!user || (!user.isAdmin && !user.isAssistant)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = promoteWaitlistSchema.parse(req.body);
      const { playerId } = validatedData;

      const promotedEntry = await storage.promoteFromWaitlist(sessionId, playerId);

      if (!promotedEntry) {
        return res.status(404).json({ message: "No waitlist entry found to promote" });
      }

      res.json({ 
        promotedEntry,
        message: `Player promoted and offer expires at ${promotedEntry.offerExpiresAt}` 
      });
    } catch (error) {
      console.error("Error promoting from waitlist:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to promote from waitlist" });
    }
  });

  app.post('/api/admin/sessions/:sessionId/waitlist/expire-offer', isAuthenticated, async (req: any, res) => {
    try {
      const { waitlistId } = req.body;
      const userId = req.user.id;

      // Get user information and check admin access
      const user = await storage.getUser(userId);
      if (!user || (!user.isAdmin && !user.isAssistant)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.expireWaitlistOffer(waitlistId);

      res.json({ message: "Offer expired successfully" });
    } catch (error) {
      console.error("Error expiring waitlist offer:", error);
      res.status(500).json({ message: "Failed to expire offer" });
    }
  });

  // Player Offer routes (for waitlist promotion)
  app.get('/api/player/offers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const offers = await storage.getPlayerOffers(userId, user.tenantId);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching player offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.post('/api/player/offers/:offerId/accept', isAuthenticated, async (req: any, res) => {
    try {
      const { offerId } = req.params;
      const userId = req.user.id;

      // Verify the offer belongs to the current user
      const user = await storage.getUser(userId);
      const offers = await storage.getPlayerOffers(userId, user?.tenantId);
      const offer = offers.find(o => o.id === offerId);

      if (!offer) {
        return res.status(404).json({ message: "Offer not found or expired" });
      }

      const result = await storage.acceptWaitlistOffer(offerId);
      res.json(result);
    } catch (error) {
      console.error("Error accepting offer:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to accept offer" });
    }
  });

  app.post('/api/player/offers/:offerId/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const { offerId } = req.params;
      const userId = req.user.id;

      // Verify the offer belongs to the current user
      const user = await storage.getUser(userId);
      const offers = await storage.getPlayerOffers(userId, user?.tenantId);
      const offer = offers.find(o => o.id === offerId);

      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }

      await storage.cancelWaitlistOffer(offerId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error canceling offer:", error);
      res.status(500).json({ message: "Failed to cancel offer" });
    }
  });



  // Help request routes
  app.post('/api/help', async (req, res) => {
    try {
      const { message, ...otherFields } = req.body;
      const validatedData = insertHelpRequestSchema.parse({
        ...otherFields,
        note: message, // Map message to note field
      });
      const helpRequest = await storage.createHelpRequest(validatedData);
      res.json(helpRequest);
    } catch (error) {
      console.error("Error creating help request:", error);
      res.status(500).json({ message: "Failed to submit help request" });
    }
  });

  // Discount code checkout validation
  app.post('/api/checkout/apply-discount', isAuthenticated, async (req: any, res) => {
    try {
      const { code, playerId } = req.body;
      const userId = req.user.id;

      // Get user to find tenant and parent info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validation = await storage.validateDiscountCode(code, user.tenantId, playerId, userId);

      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      res.json({
        valid: true,
        discountCode: {
          id: validation.discountCode!.id,
          code: validation.discountCode!.code,
          discountType: validation.discountCode!.discountType,
          discountValue: validation.discountCode!.discountValue,
        }
      });
    } catch (error) {
      console.error("Error applying discount code:", error);
      res.status(500).json({ message: "Failed to apply discount code" });
    }
  });

  // Notification preferences routes
  app.get('/api/notification-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const preferences = await storage.getNotificationPreferences(userId);
      res.json(preferences || { email: true, sms: false });
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.post('/api/notification-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const user = await storage.getUser(req.user.id);
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
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      console.log('Full user object:', JSON.stringify(user, null, 2));
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      // Ensure we have a valid tenantId
      const tenantId = user.tenantId || user.tenant_id || user.id;
      if (!tenantId) {
        console.error('No tenantId found for user:', user);
        return res.status(400).json({ message: "User tenant information missing" });
      }

      // Add tenantId to the request body and handle date conversion
      const sessionData = {
        ...req.body,
        tenantId: tenantId,
        // Convert string dates to Date objects - handle both formats
        startTime: req.body.startTime ? (typeof req.body.startTime === 'string' ? new Date(req.body.startTime) : req.body.startTime) : undefined,
        endTime: req.body.endTime ? (typeof req.body.endTime === 'string' ? new Date(req.body.endTime) : req.body.endTime) : undefined,
        // Ensure required fields have defaults
        priceCents: req.body.priceCents || 1000,
        status: req.body.status || 'upcoming',
        bookingOpenHour: req.body.bookingOpenHour ?? 8,
        bookingOpenMinute: req.body.bookingOpenMinute ?? 0,
        noTimeConstraints: req.body.noTimeConstraints ?? false,
        daysBeforeBooking: req.body.daysBeforeBooking ?? 0,
        hasAccessCode: req.body.hasAccessCode ?? false,
        waitlistEnabled: req.body.waitlistEnabled ?? true,
        paymentWindowMinutes: req.body.paymentWindowMinutes ?? 60,
        autoPromote: req.body.autoPromote ?? true
      };

      console.log('Session data before validation:', JSON.stringify(sessionData, null, 2));

      const validatedData = insertSessionSchema.parse(sessionData);
      const session = await storage.createSession(validatedData);
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get('/api/admin/help-requests', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
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

  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const tenantId = user.tenantId;
      const role = req.query.role;

      let users;
      if (role === 'parent') {
        users = await storage.getParentsByTenant(tenantId);
      } else {
        users = await storage.getUsersByTenant(tenantId);
      }

      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Setup admin routes
  await setupAdminRoutes(app);

  // Setup super admin routes
  setupSuperAdminRoutes(app);

  // Setup beta onboarding routes
  setupBetaOnboardingRoutes(app);

  // Setup feature flag routes
  const featureRoutes = await import('./feature-routes');
  app.use('/api', isAuthenticated, featureRoutes.default);

  // Setup billing routes
  const billingRoutes = await import('./billing-routes');
  app.use('/api', isAuthenticated, billingRoutes.default);

  // Setup session billing routes for payment processing
  const sessionBillingRoutes = await import('./session-billing-routes');
  app.use('/api', isAuthenticated, sessionBillingRoutes.default);

  // Setup player development routes (Elite feature)
  const playerDevRoutes = await import('./player-development-routes');
  playerDevRoutes.default(app);

  // Setup tenant routes
  const tenantRoutes = await import('./tenant-routes');
  app.use('/api', isAuthenticated, tenantRoutes.default);



  const featureRequestRoutes = await import('./feature-request-routes');
  app.use('/api/feature-requests', isAuthenticated, featureRequestRoutes.default);

  // User help request routes
  const myHelpRequestRoutes = await import('./my-help-request-routes');
  app.use('/api/help', isAuthenticated, myHelpRequestRoutes.default);

  // Debug endpoint to test subscription update
  app.post('/api/debug/update-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.currentUser;

      if (!currentUser || !currentUser.tenantId) {
        return res.status(400).json({ message: "User or tenant not found" });
      }

      // Update tenant to growth plan for testing
      const { tenants } = await import('@shared/schema');
      await db.update(tenants)
        .set({
          planLevel: 'growth',
          stripeSubscriptionId: 'sub_test_growth_123',
          stripeCustomerId: 'cus_test_growth_123',
        })
        .where(eq(tenants.id, currentUser.tenantId));

      console.log(`🧪 DEBUG: Updated tenant ${currentUser.tenantId} to growth plan`);

      res.json({ 
        success: true, 
        message: "Subscription updated to Growth plan",
        tenantId: currentUser.tenantId,
        newPlan: 'growth'
      });
    } catch (error) {
      console.error('Debug subscription update error:', error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Stripe webhook routes moved to top of function

  const httpServer = createServer(app);
  return httpServer;
}