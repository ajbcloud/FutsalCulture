import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSession } from "./auth";
import { clerkMiddleware, syncClerkUser, requireClerkAuth } from "./clerk-auth";
import { 
  insertPlayerSchema, 
  insertSessionSchema, 
  insertHelpRequestSchema, 
  insertNotificationPreferencesSchema, 
  updateUserSchema, 
  systemSettings,
  joinWaitlistSchema,
  leaveWaitlistSchema,
  promoteWaitlistSchema,
  waitlistSettingsSchema,
  insertHouseholdSchema,
  insertHouseholdMemberSchema,
  householdMembers,
  users,
  tenants,
  players
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";
import { z } from "zod";
// Lazy load background jobs - they're initialized after server starts
// import "./jobs/capacity-monitor";
// import "./jobs/session-status";
import { setupAdminRoutes } from './admin-routes';
import { setupSuperAdminRoutes } from './super-admin-routes';
import { nanoid } from 'nanoid';
import publicIngestionRoutes from './routes/publicIngestion';
import { impersonationContext } from './middleware/impersonation';
import * as impersonationController from './controllers/impersonation';
import { maintenanceMode, enforceMFA, enforceSessionTimeout } from './middleware/platformPolicies';
import { setupBetaOnboardingRoutes } from './beta-onboarding-routes';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';
import unifiedInvitationRoutes from './routes/unified-invitations';
import { superAdminEmailRouter } from './routes/super-admin-email';
import { sendgridWebhookRouter } from './routes/sendgrid-webhooks';
import { resendWebhookRouter } from './routes/resend-webhooks';
import { telnyxWebhookRouter } from './routes/telnyx-webhooks';
import { braintreeWebhookRouter } from './routes/braintree-webhooks';
import { communicationTestRouter } from './routes/communication-test';
import tenantRouter from './tenant-routes';
import { ALL_CAPABILITIES, userHasCapability } from './middleware/capabilities';
import billingRouter from './billing-routes';
import quickbooksRoutes from './routes/quickbooks';
import { terminologyRouter } from './routes/terminology';
import unaffiliatedSignupRouter from './routes/unaffiliated-signup';
import { getStagingTenantId } from './utils/staging-tenant';
import { emailTemplateService } from './services/unified-email-templates';
import adminCoachesRouter from './routes/admin-coaches-routes';

const isAuthenticated = requireClerkAuth;


export async function registerRoutes(app: Express): Promise<Server> {
  // Public ingestion endpoints (BEFORE auth middleware since they're public)
  app.use('/api/public', publicIngestionRoutes);

  // Telnyx webhook routes (must be BEFORE auth middleware since webhooks use their own verification)
  app.use('/api/webhooks/telnyx', telnyxWebhookRouter);

  // Braintree webhook routes (must be BEFORE auth middleware since webhooks use their own verification)
  app.use('/api/webhooks/braintree', braintreeWebhookRouter);

  // Session middleware (still needed for legacy features and fallback)
  app.set("trust proxy", 1);
  app.use(getSession());

  // Clerk authentication middleware - only for API routes
  app.use('/api', clerkMiddleware());
  
  // Sync Clerk users to our database - only for API routes
  app.use('/api', syncClerkUser);

  // Terminology routes - mounted after session/Clerk middleware so authenticated users get tenant-aware data
  // These routes handle both authenticated and unauthenticated users internally
  app.use('/api', terminologyRouter);

  // Branding endpoint - works for both authenticated and unauthenticated users
  // Goes through Clerk middleware and syncClerkUser so we can access req.user if available
  app.get('/api/branding', async (req, res) => {
    try {
      let tenantId: string | null = null;
      
      // Priority 1: Check X-Tenant-Id header (used by admin dashboards for tenant switching)
      const headerTenantId = req.get('X-Tenant-Id');
      if (headerTenantId) {
        tenantId = headerTenantId;
      }
      
      // Priority 2: Check impersonation context (super admin viewing a tenant)
      if (!tenantId) {
        const impersonation = (req as any).session?.impersonation;
        if (impersonation?.tenantId) {
          tenantId = impersonation.tenantId;
        }
      }
      
      // Priority 3: Use synced user's tenant (set by syncClerkUser middleware)
      if (!tenantId && (req as any).user?.tenantId) {
        tenantId = (req as any).user.tenantId;
      }
      
      // Priority 4: Try subdomain-based detection for unauthenticated users
      if (!tenantId) {
        const host = req.get('host') || '';
        const subdomain = host.split('.')[0];
        
        if (subdomain && !['www', 'localhost', 'playhq', 'app'].includes(subdomain)) {
          const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.subdomain, subdomain),
            columns: { id: true }
          });
          tenantId = tenant?.id || null;
        }
      }
      
      // If no tenant, return platform defaults
      if (!tenantId) {
        return res.json({
          businessName: 'PlayHQ',
          businessLogo: undefined
        });
      }
      
      // Fetch branding settings for the tenant
      const settings = await db.query.systemSettings.findMany({
        where: eq(systemSettings.tenantId, tenantId),
        columns: { key: true, value: true }
      });
      
      const settingsMap = new Map(settings.map(s => [s.key, s.value]));
      
      res.json({
        businessName: settingsMap.get('businessName') || 'PlayHQ',
        businessLogo: settingsMap.get('businessLogo') || undefined
      });
    } catch (error) {
      // Log the error for monitoring but return defaults to keep UI functional
      console.error('❌ Branding endpoint error:', error);
      res.status(500).json({
        businessName: 'PlayHQ',
        businessLogo: undefined,
        error: 'Failed to load branding'
      });
    }
  });

  // Unaffiliated signup routes - for parents/players who sign up without joining a club
  app.use(unaffiliatedSignupRouter);

  // Self-signup endpoint for personal accounts (public endpoint - before auth middleware)
  app.post('/api/users/self-signup', async (req, res) => {
    try {
      const { firstName, lastName, email, password, role, dob, guardian_email } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: "First name, last name, and email are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      // For players under 13, we don't require a password initially
      const isUnder13Player = role === 'player' && dob && 
        new Date().getFullYear() - new Date(dob).getFullYear() < 13;

      if (!password && !isUnder13Player) {
        return res.status(400).json({ error: "Password is required" });
      }

      // Create user data
      const userData: any = {
        id: nanoid(),
        firstName,
        lastName,
        email,
        isApproved: false,
        registrationStatus: 'pending' as const,
      };

      // Add password hash if provided
      if (password) {
        const bcrypt = await import('bcryptjs');
        userData.passwordHash = await bcrypt.hash(password, 12);
      }

      // Create the user
      const newUser = await storage.upsertUser(userData);

      // If this is a player registration, create player record
      if (role === 'player' && dob) {
        const playerData = {
          id: newUser.id,
          firstName,
          lastName,
          birthYear: new Date(dob).getFullYear(),
          gender: 'boys' as 'boys' | 'girls', // Default, can be updated later
          parentId: '', // Will be linked when they join a club
          isApproved: false,
          registrationStatus: 'pending' as const,
        };

        await storage.createPlayer(playerData);
      }

      // Log successful registration
      console.log(`✅ Self-signup completed:`, { 
        id: newUser.id,
        role,
        email: newUser.email,
        name: `${firstName} ${lastName}`
      });

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role
      });
    } catch (error) {
      console.error("Error during self-signup:", error);
      res.status(500).json({ 
        error: "Registration failed. Please try again." 
      });
    }
  });

  // Update birth year for adult player self-signup (18+ verification)
  app.post('/api/users/update-birth-year', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { birthYear } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      if (!birthYear || typeof birthYear !== 'number') {
        return res.status(400).json({ error: 'Birth year is required' });
      }
      
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      
      if (age < 18) {
        return res.status(400).json({ error: 'You must be 18 or older to register as a player' });
      }
      
      if (birthYear < 1920 || birthYear > currentYear - 18) {
        return res.status(400).json({ error: 'Please enter a valid birth year' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await db.update(users)
        .set({ dateOfBirth: new Date(birthYear, 0, 1).toISOString().split('T')[0] })
        .where(eq(users.id, userId));
      
      if (user.role === 'player' && user.tenantId) {
        const existingPlayer = await db.select()
          .from(players)
          .where(eq(players.parentId, userId))
          .limit(1);
        
        if (existingPlayer.length === 0) {
          await db.insert(players).values({
            tenantId: user.tenantId,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            birthYear: birthYear,
            gender: 'boys',
            parentId: userId,
            isApproved: true,
            registrationStatus: 'approved',
          });
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating birth year:', error);
      res.status(500).json({ error: 'Failed to update birth year' });
    }
  });

  // Platform policy middleware (must be after auth) - DISABLED IN DEVELOPMENT
  if (process.env.NODE_ENV !== 'development') {
    app.use(maintenanceMode); // Check maintenance mode for all routes
    app.use(enforceSessionTimeout); // Check session timeout for all authenticated routes
    app.use(enforceMFA); // Enforce MFA requirements
  }

  // Impersonation context middleware (must be after auth and policies) - DISABLED IN DEVELOPMENT
  if (process.env.NODE_ENV !== 'development') {
    app.use(impersonationContext);
  }

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let userId;

      // Priority 1: Check if user was already set by syncClerkUser middleware (Clerk auth)
      if (req.user?.id) {
        userId = req.user.id;
        console.log("✓ Using Clerk-synced user:", userId);
      }
      // Priority 2: Check for local session (password-based users)
      else if (req.session?.userId) {
        userId = req.session.userId;
        console.log("✓ Using session user:", userId);
      }
      // No authentication found
      else {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log user for debugging
      console.log("User fetched:", { id: user?.id, isAdmin: user?.isAdmin, isAssistant: user?.isAssistant, isSuperAdmin: user?.isSuperAdmin });

      // Calculate capabilities for the user based on their role
      const capabilities = ALL_CAPABILITIES.filter(capability => 
        userHasCapability(user, capability)
      );

      // Compute isUnaffiliated based on actual tenantId (not stale DB flag)
      // User is unaffiliated if they have no tenant or are on the staging tenant
      const stagingTenantId = getStagingTenantId();
      const computedIsUnaffiliated = !user.tenantId || user.tenantId === stagingTenantId;

      res.json({ ...user, capabilities, isUnaffiliated: computedIsUnaffiliated });
    } catch (error) {
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
        tenantId,
        inviteCodeId // New parameter for invite code
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
      // For new registrations, check if user exists
      const isNewRegistration = !(req as any).user?.id;
      
      // Get tenant ID from the request body first, fallback to invite code lookup
      const targetTenantId = tenantId;
      if (!targetTenantId) {
        return res.status(400).json({ error: "Tenant ID required" });
      }

      // Process invite code if provided
      if (inviteCodeId) {
        try {
          // Increment the invite code usage count
          await storage.incrementInviteCodeUsage(inviteCodeId);
          console.log(`✅ Invite code usage incremented:`, { inviteCodeId });
        } catch (error) {
          console.error("Error incrementing invite code usage:", error);
          // Continue with registration even if this fails - don't block user
        }
      }

      // Check auto-approve setting
      const autoApproveSetting = await db.select()
        .from(systemSettings)
        .where(eq(systemSettings.key, 'autoApproveRegistrations'))
        .limit(1);

      const autoApprove = autoApproveSetting[0]?.value === 'true' || autoApproveSetting.length === 0;

      // Create user with validated consent - always use new ID for new registrations
      const userData = {
        id: nanoid(), // Always generate a new unique ID for new users
        firstName,
        lastName,
        email,
        tenantId: targetTenantId,
        isApproved: autoApprove,
        registrationStatus: autoApprove ? 'approved' as const : 'pending' as const,
      };

      const newUser = await storage.upsertUser(userData);

      // If this is a player registration, create the player record
      if (role === 'player' && dateOfBirth) {
        const playerData = {
          id: newUser.id,
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
        id: newUser.id, 
        role, 
        consentDocuments: consentDocuments.length,
        inviteCodeId: inviteCodeId || 'none',
        autoApprove 
      });

      res.status(201).json({
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        isApproved: newUser.isApproved,
        registrationStatus: newUser.registrationStatus,
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

  // Tenant info route - single source of truth for tenant data
  app.get('/api/tenant/info', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user to find tenant ID
      const user = await storage.getUser(userId);
      if (!user || !user.tenantId) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Get tenant data
      const tenant = await storage.getTenant(user.tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Map plan level to plan code
      const planLevelMap: Record<string, string> = {
        'free': 'free',
        'core': 'core', 
        'growth': 'growth',
        'elite': 'elite'
      };

      const planCode = planLevelMap[tenant.planLevel || 'free'] || 'free';
      const planLevelNum = { free: 0, core: 1, growth: 2, elite: 3 }[planCode] || 0;

      // Return tenant info in expected format
      // Use displayName for UI (falls back to name if not set)
      res.json({
        id: tenant.id,
        name: tenant.displayName || tenant.name || 'Your Organization',
        contactName: tenant.contactName || '',
        contactEmail: tenant.contactEmail || '',
        location: {
          city: tenant.city || null,
          state: tenant.state || null,
          country: tenant.country || null
        },
        planCode: planCode,
        planLevel: planLevelNum,
        planId: planCode, // Alias for backward compatibility
        billingStatus: tenant.billingStatus || 'none',
        renewalDate: tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toISOString() : null,
        stripeCustomerId: tenant.stripeCustomerId || null,
        stripeSubscriptionId: tenant.stripeSubscriptionId || null,
        trialStartedAt: tenant.trialStartedAt ? new Date(tenant.trialStartedAt).toISOString() : null,
        trialEndsAt: tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toISOString() : null,
        featureOverrides: {}
      });
    } catch (error) {
      console.error('Error fetching tenant info:', error);
      res.status(500).json({ error: 'Failed to fetch tenant information' });
    }
  });

  // Tenant settings - accessible by any authenticated user (read-only version of admin settings)
  app.get('/api/tenant/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user to find tenant ID
      const user = await storage.getUser(userId);
      if (!user || !user.tenantId) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const tenantId = user.tenantId;
      
      // Get tenant information for default business name and contact email
      let tenantInfo = null;
      const [tenant] = await db.select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);
      tenantInfo = tenant;
      
      // Get system settings from database for this tenant
      const settings = await db.select()
        .from(systemSettings)
        .where(eq(systemSettings.tenantId, tenantId));
      
      const settingsMap = settings.reduce((acc, setting) => {
        let value: any = setting.value;
        // Parse boolean values
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        // Parse numeric values
        if (!isNaN(Number(value))) value = Number(value);
        // Parse JSON arrays (for availableLocations)
        if (setting.key === 'availableLocations' && typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // If parsing fails, treat as string and split by comma
            value = value.split(',').map((s: string) => s.trim()).filter((s: string) => s);
          }
        }
        
        acc[setting.key] = value;
        return acc;
      }, {} as any);

      // Use tenant's displayName (user-facing) preferring over name (internal with suffix)
      const defaultBusinessName = tenantInfo?.displayName || tenantInfo?.name || "Your Organization";
      const defaultContactEmail = user?.email || "admin@example.com";

      // Default settings if none exist
      const defaultSettings = {
        autoApproveRegistrations: true,
        businessName: defaultBusinessName,
        businessLogo: "",
        contactEmail: defaultContactEmail,
        supportEmail: defaultContactEmail,
        supportPhone: "",
        supportHours: "Monday - Friday",
        supportLocation: "",
        timezone: "America/New_York",
        emailNotifications: true,
        smsNotifications: false,
        sessionCapacityWarning: 3,
        paymentReminderMinutes: 60,
        paymentSubmissionTimeMinutes: 30,
        refundCutoffMinutes: 60,
        weekdayStart: "monday",
        weekdayEnd: "sunday",
        fiscalYearType: "calendar",
        fiscalYearStartMonth: 1,
        availableLocations: [],
        enableHelpRequests: true,
        ...settingsMap
      };
      
      // Convert legacy paymentReminderHours to paymentReminderMinutes if it exists
      if (settingsMap.paymentReminderHours && !settingsMap.paymentReminderMinutes) {
        defaultSettings.paymentReminderMinutes = settingsMap.paymentReminderHours * 60;
        delete defaultSettings.paymentReminderHours;
      }
      
      // Always prefer tenant displayName over stored businessName (which might have suffix)
      if (tenantInfo?.displayName) {
        defaultSettings.businessName = tenantInfo.displayName;
      }

      res.json(defaultSettings);
    } catch (error) {
      console.error("Error fetching tenant settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Tenant age policy endpoint - accessible by any authenticated user
  app.get('/api/tenant/age-policy', isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID required" });
      }

      const { systemSettings } = await import('@shared/schema');
      const { tenantPolicies } = await import('@shared/db/schema/tenantPolicy');
      const { and, eq } = await import('drizzle-orm');

      // Get age policy settings from system settings
      const settings = await db.select()
        .from(systemSettings)
        .where(and(
          eq(systemSettings.tenantId, tenantId),
          sql`${systemSettings.key} IN ('audience', 'minAge', 'maxAge', 'requireParent', 'teenSelfMin', 'teenPayMin', 'enforceAgeGating', 'requireConsent')`
        ));

      // Get tenant policy for audienceMode
      const [tenantPolicy] = await db.select()
        .from(tenantPolicies)
        .where(eq(tenantPolicies.tenantId, tenantId));

      const policyData = settings.reduce((acc, setting) => {
        let value: any = setting.value;
        // Parse boolean values explicitly for requireConsent and enforceAgeGating
        if (setting.key === 'requireConsent' || setting.key === 'enforceAgeGating') {
          value = value === 'true' || value === true || value === '1' || value === 1;
        } else if (value === 'true' || value === '1') {
          value = true;
        } else if (value === 'false' || value === '0') {
          value = false;
        } else if (!isNaN(Number(value)) && setting.key !== 'audience') {
          value = Number(value);
        }
        
        acc[setting.key] = value;
        return acc;
      }, {} as any);

      // Get audienceMode from tenant_policies table (primary source)
      const audienceMode = tenantPolicy?.audienceMode || 'youth_only';
      
      // Determine household requirements based on audienceMode:
      // - youth_only: household always required before creating any player
      // - mixed: household required for players under 18
      // - adult_only: household optional
      const householdRules = {
        youth_only: {
          householdRequired: true,
          requiresHouseholdForMinors: true,
          adultCanSkipHousehold: false,
          description: 'Household required for all players'
        },
        mixed: {
          householdRequired: false, // Not always required
          requiresHouseholdForMinors: true, // But required for under 18
          adultCanSkipHousehold: true, // 18+ can skip
          description: 'Household required for players under 18'
        },
        adult_only: {
          householdRequired: false,
          requiresHouseholdForMinors: false,
          adultCanSkipHousehold: true,
          description: 'Household optional'
        }
      };

      const householdPolicy = householdRules[audienceMode as keyof typeof householdRules] || householdRules.youth_only;

      // Set defaults if no settings exist - consent forms enabled by default
      const defaultPolicy = {
        audience: "youth",
        minAge: 5,
        maxAge: 18,
        requireParent: 13,
        teenSelfMin: 13,
        teenPayMin: 16,
        enforceAgeGating: true,
        requireConsent: true,
        ...policyData,
        // Add audienceMode and household policy
        audienceMode,
        adultAge: tenantPolicy?.adultAge || 18,
        householdPolicy
      };

      res.json(defaultPolicy);
    } catch (error) {
      console.error('Error fetching age policy:', error);
      res.status(500).json({ error: 'Failed to fetch age policy' });
    }
  });

  // Session routes
  app.get('/api/sessions', async (req: any, res) => {
    try {
      const { ageGroup, location, status, gender, includePast } = req.query;

      // Get tenant ID from authenticated user, or allow all sessions for non-authenticated users
      let tenantId;
      if ((req as any).user?.id) {
        const user = await storage.getUser((req as any).user.id);
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

      if ((req as any).user?.id) {
        const user = await storage.getUser((req as any).user.id);
        tenantId = user?.tenantId;
      }
      
      // Check if user is unaffiliated (on platform-staging or no tenant)
      const stagingTenantId = getStagingTenantId();
      const isUnaffiliated = !tenantId || tenantId === stagingTenantId;
      
      // For unaffiliated users, return empty filters - they haven't joined a club yet
      if (isUnaffiliated) {
        return res.json({
          ageGroups: [],
          locations: [],
          genders: [],
        });
      }

      // Get all sessions for the tenant (including past) to build comprehensive filter options
      const sessions = await storage.getSessions({ tenantId: tenantId || undefined, includePast: true });

      // Extract unique values for age groups and genders from sessions
      const uniqueAgeGroups = Array.from(new Set(sessions.flatMap(session => session.ageGroups || [])));
      const uniqueGenders = Array.from(new Set(sessions.flatMap(session => session.genders || [])));

      // Get configured locations from admin settings (empty default)
      let availableLocations: string[] = [];

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
      const tenantId = req.user.tenantId;

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

      // Generate invite token with proper format: player:playerId:parentId:tenantId:timestamp
      const inviteToken = Buffer.from(`player:${playerId}:${userId}:${tenantId}:${Date.now()}`).toString('base64');
      const inviteUrl = `${req.protocol}://${req.get('host')}/player-invite?token=${inviteToken}`;

      // Update player with invite info
      await storage.updatePlayerInvite(playerId, method, new Date());

      // Get parent info for email
      const parent = await storage.getUser(userId);
      const parentName = parent ? `${parent.firstName || ''} ${parent.lastName || ''}`.trim() : 'Your parent';

      // Get tenant info for branding
      const tenant = tenantId ? await storage.getTenant(tenantId) : null;
      const tenantName = tenant?.displayName || tenant?.name || 'PlayHQ';

      // Send invite email if method is email and player has email
      if (method === 'email' && player.email) {
        try {
          const emailResult = await emailTemplateService.sendEmail({
            to: player.email,
            template: {
              type: 'invitation',
              variant: 'html',
              data: {
                tenantId: tenantId || '',
                tenantName,
                recipientName: `${player.firstName} ${player.lastName}`,
                recipientEmail: player.email,
                senderName: parentName,
                role: 'player',
                inviteUrl,
                tenantBranding: {
                  businessName: tenantName,
                },
                metadata: {
                  playerId,
                  parentId: userId,
                  inviteType: 'player_invite',
                },
              },
            },
          });
          console.log(`Player invite email sent to ${player.email}: ${emailResult.success ? 'success' : 'failed'}`);
        } catch (emailError) {
          console.error('Error sending player invite email:', emailError);
        }
      }

      res.json({
        method,
        inviteUrl,
        message: method === 'email' && player.email 
          ? `Invite sent via email to ${player.email}` 
          : `Invite link generated`,
        emailSent: method === 'email' && player.email,
      });
    } catch (error) {
      console.error("Error sending player invite:", error);
      res.status(500).json({ message: "Failed to send invite" });
    }
  });

  // Player invite validation endpoint (Clerk-based flow)
  app.get('/api/player-invite/validate/:token', async (req, res) => {
    try {
      const { token } = req.params;

      // Decode token: player:playerId:parentId:tenantId:timestamp
      let playerId: string;
      let parentId: string;
      let tenantId: string;
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const parts = decoded.split(':');
        if (parts[0] !== 'player') throw new Error('Invalid token type');
        playerId = parts[1];
        parentId = parts[2];
        tenantId = parts[3];
      } catch {
        return res.status(400).json({ valid: false, message: "Invalid token format" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ valid: false, message: "Player not found" });
      }

      // Check if account already created
      if (player.userAccountCreated) {
        return res.json({ valid: false, message: "Account already exists for this player" });
      }

      // Check age requirement
      const currentYear = new Date().getFullYear();
      const playerAge = currentYear - player.birthYear;
      if (playerAge < 13) {
        return res.status(403).json({ valid: false, message: "Player must be 13 or older" });
      }

      // Get parent info
      const parent = await storage.getUser(parentId);
      const parentName = parent ? `${parent.firstName || ''} ${parent.lastName || ''}`.trim() : 'Your parent';

      // Get tenant info
      const tenant = tenantId ? await storage.getTenant(tenantId) : null;

      res.json({ 
        valid: true, 
        player: {
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email,
          parentName,
        },
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.displayName || tenant.name,
        } : null,
      });
    } catch (error) {
      console.error("Error validating player invite:", error);
      res.status(500).json({ valid: false, message: "Failed to validate invite" });
    }
  });

  // Player invite join endpoint (after Clerk authentication)
  app.post('/api/player-invite/join/:token', isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.params;
      const clerkUserId = req.user.id;

      // Decode token: player:playerId:parentId:tenantId:timestamp
      let playerId: string;
      let parentId: string;
      let tenantId: string;
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const parts = decoded.split(':');
        if (parts[0] !== 'player') throw new Error('Invalid token type');
        playerId = parts[1];
        parentId = parts[2];
        tenantId = parts[3];
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

      // Get the current user from req.user which was set by Clerk auth
      const playerUser = await storage.getUser(clerkUserId);
      if (!playerUser) {
        return res.status(404).json({ message: "Your account was not found" });
      }

      // Update user's tenantId to match the player's tenant and set role to player
      await storage.updateUser(playerUser.id, { 
        tenantId,
        role: 'player',
        isAdmin: false,
        isSuperAdmin: false,
        isAssistant: false,
        isUnaffiliated: false,
      });

      // Link the user to the player record
      await storage.updatePlayer(playerId, {
        userId: playerUser.id,
        userAccountCreated: true,
      });

      // Get parent name for response
      const parent = await storage.getUser(parentId);
      const parentName = parent ? `${parent.firstName || ''} ${parent.lastName || ''}`.trim() : 'the parent';

      res.json({ 
        success: true, 
        message: "Successfully linked to player account",
        parentName,
        playerName: `${player.firstName} ${player.lastName}`,
      });
    } catch (error) {
      console.error("Error joining as player:", error);
      res.status(500).json({ message: "Failed to link player account" });
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
          email: parent1.email
        },
        invitedEmail: parent1.parent2InviteEmail || '',
        tenantId: parent1.tenantId
      });
    } catch (error) {
      console.error("Error validating parent 2 invite:", error);
      res.status(500).json({ message: "Failed to validate invite" });
    }
  });

  // Public endpoint for consent templates via parent2 invite token (no auth required)
  app.get('/api/parent2-invite/consent-templates/:token', async (req, res) => {
    try {
      const { token } = req.params;

      // Decode token to get parent1 ID and their tenant
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
      if (!parent1 || !parent1.tenantId) {
        return res.status(404).json({ message: "Parent or tenant not found" });
      }

      // Get consent templates for parent1's tenant
      const { db } = await import('./db');
      const { consentTemplates } = await import('@shared/schema');
      const { eq, and } = await import('drizzle-orm');

      const templates = await db
        .select()
        .from(consentTemplates)
        .where(and(
          eq(consentTemplates.tenantId, parent1.tenantId),
          eq(consentTemplates.isActive, true)
        ));

      res.json(templates);
    } catch (error) {
      console.error("Error fetching consent templates for parent2 invite:", error);
      res.status(500).json({ message: "Failed to fetch consent templates" });
    }
  });

  // Public validation endpoint for tenant invite codes (no authentication required)
  app.get('/api/tenant-invite-codes/validate', async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required', valid: false });
      }
      
      const { db } = await import('./db');
      const { tenantInviteCodes, tenants } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const inviteCode = await db
        .select()
        .from(tenantInviteCodes)
        .where(eq(tenantInviteCodes.code, code as string))
        .limit(1);

      if (inviteCode.length === 0) {
        return res.status(404).json({ message: 'Invalid invite code', valid: false });
      }

      const code_data = inviteCode[0];
      
      if (!code_data.isActive) {
        return res.status(400).json({ message: 'Invite code is inactive', valid: false });
      }

      // Get tenant info for the code
      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, code_data.tenantId))
        .limit(1);

      if (tenant.length === 0) {
        return res.status(400).json({ message: 'Associated organization not found', valid: false });
      }

      res.json({
        valid: true,
        message: 'Valid invite code',
        code: code_data.code,
        tenant: {
          id: tenant[0].id,
          name: tenant[0].name
        }
      });
      
    } catch (error) {
      console.error('Error validating invite code:', error);
      res.status(500).json({ message: 'Internal server error', valid: false });
    }
  });

  // Public validation endpoint for invite codes (no authentication required)
  app.get('/api/invite-codes/validate/:code', async (req, res) => {
    try {
      const { code } = req.params;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required', valid: false });
      }

      // Get tenantId from session or subdomain
      let tenantId = (req as any).session?.tenantId;
      
      // If no tenantId in session, try to get from subdomain
      if (!tenantId) {
        const subdomain = req.hostname.split('.')[0];
        if (subdomain && subdomain !== 'localhost') {
          const tenant = await storage.getTenantBySubdomain(subdomain);
          if (tenant) {
            tenantId = tenant.id;
          }
        }
      }

      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant context required', valid: false });
      }

      // Get the invite code
      const inviteCode = await storage.getInviteCodeByCode(code, tenantId);

      if (!inviteCode) {
        return res.status(404).json({ message: 'Invalid invite code', valid: false });
      }

      // Check if code is active
      if (!inviteCode.isActive) {
        return res.status(400).json({ message: 'Invite code is inactive', valid: false });
      }

      // Check valid date range
      const now = new Date();
      if (inviteCode.validFrom && new Date(inviteCode.validFrom) > now) {
        return res.status(400).json({ 
          message: 'Invite code is not yet valid', 
          valid: false 
        });
      }

      if (inviteCode.validUntil && new Date(inviteCode.validUntil) < now) {
        return res.status(400).json({ 
          message: 'Invite code has expired', 
          valid: false 
        });
      }

      // Check max uses
      if (inviteCode.maxUses !== null && (inviteCode.currentUses ?? 0) >= inviteCode.maxUses) {
        return res.status(400).json({ 
          message: 'Invite code usage limit exceeded', 
          valid: false 
        });
      }

      // Return validation response with pre-fill data
      res.json({
        valid: true,
        message: 'Valid invite code',
        preFillData: {
          ageGroup: inviteCode.ageGroup || null,
          gender: inviteCode.gender || null,
          location: inviteCode.location || null,
          club: inviteCode.club || null,
          discountType: inviteCode.discountType || null,
          discountValue: inviteCode.discountValue || null,
        },
        code: {
          id: inviteCode.id,
          code: inviteCode.code,
          description: inviteCode.description,
        }
      });
      
    } catch (error) {
      console.error('Error validating invite code:', error);
      res.status(500).json({ message: 'Internal server error', valid: false });
    }
  });

  app.post('/api/parent2-invite/accept/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { firstName, lastName, email, phone, consentSignatures } = req.body;

      // Decode token (simplified - in production use JWT verification)
      // Token format: parent2:userId:householdId:timestamp or parent2:userId:timestamp (legacy)
      let parent1Id: string;
      let householdId: string | null = null;
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const parts = decoded.split(':');
        if (parts[0] !== 'parent2') throw new Error('Invalid token type');
        parent1Id = parts[1];
        // New format includes householdId
        if (parts.length >= 4) {
          householdId = parts[2];
        }
      } catch {
        return res.status(400).json({ message: "Invalid token format" });
      }

      const parent1 = await storage.getUser(parent1Id);
      if (!parent1) {
        return res.status(404).json({ message: "Parent not found" });
      }

      const tenantId = parent1.tenantId;

      // Create parent 2 user account
      const parent2 = await storage.upsertUser({
        id: `parent2_${parent1Id}_${Date.now()}`,
        email,
        firstName,
        lastName,
        phone,
        tenantId, // Inherit tenant from parent1
      });

      // Update all players belonging to parent 1 to include parent 2
      await storage.updatePlayersParent2(parent1Id, parent2.id);

      // Add parent2 to the household if householdId was provided
      if (householdId && tenantId) {
        try {
          await storage.addHouseholdMember(householdId, tenantId, {
            userId: parent2.id,
            role: 'secondary',
          });
          console.log(`Added parent2 ${parent2.id} to household ${householdId}`);
        } catch (householdError) {
          console.error('Error adding parent2 to household:', householdError);
          // Don't fail the request - they can be added manually
        }
      } else {
        // Legacy flow - try to find parent1's household and add parent2
        try {
          if (tenantId) {
            const parent1Household = await storage.getUserHousehold(parent1Id, tenantId);
            if (parent1Household) {
              await storage.addHouseholdMember(parent1Household.id, tenantId, {
                userId: parent2.id,
                role: 'secondary',
              });
              console.log(`Added parent2 ${parent2.id} to parent1's household ${parent1Household.id}`);
            }
          }
        } catch (householdError) {
          console.error('Error adding parent2 to parent1 household:', householdError);
        }
      }

      // Process consent signatures if provided
      if (consentSignatures && Array.isArray(consentSignatures) && consentSignatures.length > 0) {
        try {
          const { consentRecords } = await import('@shared/schema');
          const { db } = await import('./db');
          
          // Get players for this household to associate consent
          const players = await storage.getPlayersByParent(parent1Id);
          
          for (const sig of consentSignatures) {
            // For each consent signature, record it for the parent
            if (players[0]?.id) {
              await db.insert(consentRecords).values({
                playerId: players[0].id,
                parentId: parent2.id,
                consentType: sig.templateType || 'registration',
                consentGiven: true,
                consentDate: new Date(sig.signedAt || Date.now()),
              }).onConflictDoNothing();
            }
          }
        } catch (consentError) {
          console.error('Error recording consent signatures:', consentError);
          // Don't fail the entire request if consent recording fails
        }
      }

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

  // Join household as Parent2 after Clerk authentication
  app.post('/api/parent2-invite/join/:token', isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.params;
      const clerkUserId = req.user.id;

      // Decode token
      let parent1Id: string;
      let householdId: string | null = null;
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const parts = decoded.split(':');
        if (parts[0] !== 'parent2') throw new Error('Invalid token type');
        parent1Id = parts[1];
        if (parts.length >= 4) {
          householdId = parts[2];
        }
      } catch {
        return res.status(400).json({ message: "Invalid token format" });
      }

      const parent1 = await storage.getUser(parent1Id);
      if (!parent1) {
        return res.status(404).json({ message: "Parent not found" });
      }

      const tenantId = parent1.tenantId;

      // Get the current user (parent2) from req.user which was set by Clerk auth
      const parent2 = await storage.getUser(clerkUserId);
      if (!parent2) {
        return res.status(404).json({ message: "Your account was not found" });
      }

      // Update parent2's tenantId to match parent1 and ensure non-admin role
      // SECURITY: Defensive check to prevent privilege escalation - always clear admin flags
      await storage.updateUser(parent2.id, { 
        tenantId,
        isAdmin: false,
        isSuperAdmin: false,
        isAssistant: false,
        isUnaffiliated: false,
      });

      // Update all players belonging to parent 1 to include parent 2
      await storage.updatePlayersParent2(parent1Id, parent2.id);

      // Add parent2 to the household
      if (householdId && tenantId) {
        try {
          await storage.addHouseholdMember(householdId, tenantId, {
            userId: parent2.id,
            role: 'secondary',
          });
          console.log(`Added parent2 ${parent2.id} to household ${householdId}`);
        } catch (householdError) {
          console.error('Error adding parent2 to household:', householdError);
        }
      } else if (tenantId) {
        // Try to find parent1's household
        try {
          const parent1Household = await storage.getUserHousehold(parent1Id, tenantId);
          if (parent1Household) {
            await storage.addHouseholdMember(parent1Household.id, tenantId, {
              userId: parent2.id,
              role: 'secondary',
            });
            console.log(`Added parent2 ${parent2.id} to parent1's household ${parent1Household.id}`);
          }
        } catch (householdError) {
          console.error('Error adding parent2 to parent1 household:', householdError);
        }
      }

      res.json({ 
        success: true, 
        message: "Successfully joined household",
        parent1Name: `${parent1.firstName} ${parent1.lastName}`.trim()
      });
    } catch (error) {
      console.error("Error joining household:", error);
      res.status(500).json({ message: "Failed to join household" });
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

  // Get consent documents for household players (for household tab display)
  app.get('/api/household/consent-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.tenantId) {
        return res.status(400).json({ message: "User tenant not found" });
      }

      // Get all players the user has access to (as parent)
      const players = await storage.getPlayersByParent(userId);
      
      // Get required consent templates for comparison
      const requiredTemplates = await storage.getRequiredConsentTemplates(user.tenantId);
      const requiredTypes = new Set(requiredTemplates.map(t => t.templateType));
      
      // Get consent documents for each player with player info
      const playerConsentData = await Promise.all(
        players.map(async (player: any) => {
          const documents = await storage.getConsentDocumentsByPlayer(player.id, user.tenantId);
          
          // Calculate if player is adult (18+)
          const currentYear = new Date().getFullYear();
          const isAdult = player.dateOfBirth 
            ? (currentYear - new Date(player.dateOfBirth).getFullYear()) >= 18
            : player.birthYear 
              ? (currentYear - player.birthYear) >= 18
              : false;

          // Check which required templates are signed
          const signedTypes = new Set(documents.map((doc: any) => doc.templateType));
          const missingTemplates = requiredTemplates.filter(t => !signedTypes.has(t.templateType));
          
          // Completion is based on all required templates being signed
          const hasCompletedConsent = missingTemplates.length === 0 && requiredTemplates.length > 0;

          return {
            player: {
              id: player.id,
              firstName: player.firstName,
              lastName: player.lastName,
              isAdult,
              birthYear: player.birthYear || null,
            },
            documents: documents.map((doc: any) => ({
              id: doc.id,
              templateType: doc.templateType,
              documentTitle: doc.documentTitle,
              signedAt: doc.signedAt,
              signedByParentId: doc.parentId,
            })),
            missingForms: missingTemplates.map(t => ({
              templateId: t.id,
              templateType: t.templateType,
              title: t.title,
            })),
            hasCompletedConsent,
          };
        })
      );

      res.json(playerConsentData);
    } catch (error) {
      console.error("Error fetching household consent documents:", error);
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
          time: session.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

      // Check age policy requirements for household
      const { db } = await import("./db");
      const { systemSettings, households, householdMembers } = await import("@shared/schema");
      const { tenantPolicies } = await import("@shared/db/schema/tenantPolicy");
      const { eq, and } = await import("drizzle-orm");

      // Get tenant policy for audienceMode
      const [tenantPolicy] = await db.select()
        .from(tenantPolicies)
        .where(eq(tenantPolicies.tenantId, tenantId));

      const audienceMode = tenantPolicy?.audienceMode || 'youth_only';
      const adultAge = tenantPolicy?.adultAge || 18;

      // Calculate player age from birth year
      const birthYear = req.body.birthYear;
      if (!birthYear) {
        return res.status(400).json({ message: "Birth year is required" });
      }
      const currentYear = new Date().getFullYear();
      const playerAge = currentYear - birthYear;
      const isMinor = playerAge < adultAge;

      // Check if user has a household
      const userHouseholds = await db.select()
        .from(householdMembers)
        .where(eq(householdMembers.userId, userId));
      const hasHousehold = userHouseholds.length > 0;

      // Enforce household requirements based on age policy
      if (audienceMode === 'youth_only' && !hasHousehold) {
        return res.status(400).json({ 
          message: "Household required. This organization requires you to create a household before adding players.",
          code: "HOUSEHOLD_REQUIRED"
        });
      }

      if (audienceMode === 'mixed' && isMinor && !hasHousehold) {
        return res.status(400).json({ 
          message: `Household required for minors. Players under ${adultAge} require a household. Please create a household first.`,
          code: "HOUSEHOLD_REQUIRED_FOR_MINOR"
        });
      }

      // Check if auto-approve is enabled
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
      
      // Auto-link player to household if user has one
      if (hasHousehold && userHouseholds[0]?.householdId) {
        try {
          // Check if player is already a member of this household to avoid duplicate constraint errors
          const existingMember = await db.select()
            .from(householdMembers)
            .where(and(
              eq(householdMembers.householdId, userHouseholds[0].householdId),
              eq(householdMembers.playerId, player.id)
            ))
            .limit(1);
          
          if (existingMember.length === 0) {
            await db.insert(householdMembers).values({
              tenantId,
              householdId: userHouseholds[0].householdId,
              playerId: player.id,
              role: 'player',
            });
          }
        } catch (linkError) {
          console.log("Note: Could not auto-link player to household:", linkError);
          // Don't fail the request - player was created successfully
        }
      }
      
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

  app.delete('/api/players/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;
      
      if (!userId || !tenantId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const playerId = req.params.id;
      
      // First get the user's household (just the ID)
      const userHouseholdBasic = await storage.getUserHousehold(userId, tenantId);
      if (!userHouseholdBasic) {
        return res.status(403).json({ message: "You must be in a household to delete players" });
      }

      // Get the full household with members
      const userHousehold = await storage.getHousehold(userHouseholdBasic.id, tenantId);
      if (!userHousehold) {
        return res.status(403).json({ message: "You must be in a household to delete players" });
      }

      // Check if the player is in the same household
      const playerMember = userHousehold.members?.find((m: any) => m.playerId === playerId);
      if (!playerMember) {
        return res.status(403).json({ message: "You can only delete players in your household" });
      }

      // Remove player from household first
      if (playerMember.id) {
        await storage.removeHouseholdMember(playerMember.id, tenantId);
      }

      // Then delete the player entity
      await storage.deletePlayer(playerId);
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

      // Check for access code if session requires it
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

  // Process payment with credits integration
  app.post('/api/process-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { signupId, paymentMethodId, useCredits = true } = req.body;
      const userId = req.user.id;
      
      // Get signup details
      const signup = await storage.getSignupWithDetails(signupId);
      if (!signup) {
        return res.status(404).json({ message: "Signup not found" });
      }

      if (signup.paid) {
        return res.status(400).json({ message: "Payment already processed" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.tenantId) {
        return res.status(400).json({ message: "User or tenant not found" });
      }

      // Calculate amount needed (convert cents to dollars for our credit system)
      const amountDollars = signup.session.priceCents / 100;
      let remainingAmount = amountDollars;
      let creditsUsed = 0;

      // Check and apply credits if requested
      if (useCredits) {
        const availableCredits = await storage.getUserCreditsBalance(user.tenantId, userId);
        
        if (availableCredits > 0) {
          // Calculate how much credit to use
          creditsUsed = Math.min(availableCredits, remainingAmount);
          
          // Apply credits
          try {
            await storage.applyCredits(
              user.tenantId,
              userId,
              creditsUsed,
              signup.sessionId
            );
            
            remainingAmount -= creditsUsed;
          } catch (error) {
            console.error("Error applying credits:", error);
            // Continue with full payment if credit application fails
            remainingAmount = amountDollars;
            creditsUsed = 0;
          }
        }
      }

      // If credits covered everything, mark as paid
      if (remainingAmount <= 0) {
        await storage.updateSignupPaymentStatus(signupId, true);
        
        // Create payment record
        await storage.createPayment({
          signupId,
          amount: signup.session.priceCents,
          creditsUsed: Math.round(creditsUsed * 100), // Convert to cents for consistency
          paymentMethod: 'credits',
          status: 'succeeded',
          tenantId: user.tenantId,
        });

        return res.json({
          success: true,
          message: "Payment successful using credits",
          creditsUsed,
          amountCharged: 0,
          signup
        });
      }

      // Process remaining amount with Braintree
      if (!paymentMethodId) {
        return res.json({
          success: false,
          requiresPayment: true,
          creditsAvailable: creditsUsed > 0 ? creditsUsed : 0,
          remainingAmount,
          message: `Payment required: $${remainingAmount.toFixed(2)}${creditsUsed > 0 ? ` (after $${creditsUsed.toFixed(2)} credits)` : ''}`
        });
      }

      // Import Braintree service
      const { processSaleTransaction, isBraintreeEnabled } = await import('./services/braintreeService');

      if (!isBraintreeEnabled()) {
        return res.status(500).json({ message: "Payment processing not configured. Please contact support." });
      }

      // Process payment with Braintree sale transaction
      const amountCents = Math.round(remainingAmount * 100);
      const paymentResult = await processSaleTransaction(amountCents, paymentMethodId, {
        orderId: signupId,
        description: `Session booking for ${signup.player.firstName} ${signup.player.lastName}`,
        metadata: {
          signup_id: signupId,
          session_id: signup.sessionId,
          player_id: signup.playerId,
          credits_used: creditsUsed.toString(),
        }
      });

      if (paymentResult.success && paymentResult.transactionId) {
        // Mark signup as paid
        await storage.updateSignupPaymentStatus(signupId, true);
        
        // Create payment record
        await storage.createPayment({
          signupId,
          amount: amountCents,
          creditsUsed: Math.round(creditsUsed * 100),
          paymentMethod: 'braintree',
          paymentIntentId: paymentResult.transactionId,
          status: 'succeeded',
          tenantId: user.tenantId,
        });

        return res.json({
          success: true,
          message: "Payment successful",
          creditsUsed,
          amountCharged: remainingAmount,
          transactionId: paymentResult.transactionId,
          signup
        });
      } else {
        return res.status(400).json({
          success: false,
          message: paymentResult.message || "Payment failed",
          status: paymentResult.status
        });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin payment refund route - Issues credits to user/household instead of actual payment refunds
  // Credits are automatically used first during checkout (FIFO)
  app.post('/api/admin/payments/:paymentId/refund', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      const { reason, applyToHousehold } = req.body;
      const adminUser = req.user;

      // Verify admin permissions
      if (!adminUser.isAdmin && !adminUser.isSuperAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ message: "Refund reason is required" });
      }

      // Get the payment details
      const { payments: paymentsTable, signups: signupsTable, players, userCredits, householdMembers: householdMembersTable } = await import("@shared/schema");
      const { db } = await import("./db");
      const { eq, and } = await import("drizzle-orm");

      const [payment] = await db.select()
        .from(paymentsTable)
        .where(eq(paymentsTable.id, paymentId))
        .limit(1);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment.refundedAt) {
        return res.status(400).json({ message: "This payment has already been refunded" });
      }

      // Get the signup to find the player and parent
      const [signup] = await db.select()
        .from(signupsTable)
        .where(eq(signupsTable.id, payment.signupId))
        .limit(1);

      if (!signup) {
        return res.status(404).json({ message: "Associated signup not found" });
      }

      // Get the player to find the parent
      const [player] = await db.select()
        .from(players)
        .where(eq(players.id, signup.playerId))
        .limit(1);

      if (!player || !player.parentId) {
        return res.status(404).json({ message: "Parent user not found for this signup" });
      }

      const parentUserId = player.parentId;
      const tenantId = payment.tenantId;
      const amountCents = payment.amountCents;

      // Determine if credit should go to household or user
      let householdId: string | null = null;
      let creditUserId: string | null = parentUserId;
      let appliedToHousehold = false;
      let householdNotFound = false;

      if (applyToHousehold) {
        // Check if user belongs to a household
        const [householdMember] = await db.select({ householdId: householdMembersTable.householdId })
          .from(householdMembersTable)
          .where(and(
            eq(householdMembersTable.userId, parentUserId),
            eq(householdMembersTable.tenantId, tenantId)
          ))
          .limit(1);

        if (householdMember) {
          householdId = householdMember.householdId;
          creditUserId = null; // Credit goes to household, not user
          appliedToHousehold = true;
        } else {
          householdNotFound = true; // User requested household but none found
        }
      }

      // Use a transaction to ensure atomicity of all operations
      const result = await db.transaction(async (tx) => {
        // Create the credit
        const [credit] = await tx.insert(userCredits).values({
          userId: creditUserId,
          householdId,
          tenantId,
          amountCents,
          reason: `Refund: ${reason}`,
          signupId: signup.id,
          sessionId: signup.sessionId,
        }).returning();

        // Mark the payment as refunded
        await tx.update(paymentsTable)
          .set({
            refundedAt: new Date(),
            refundReason: reason,
            refundedBy: adminUser.id,
          })
          .where(eq(paymentsTable.id, paymentId));

        // Mark the signup as refunded
        await tx.update(signupsTable)
          .set({
            refunded: true,
            refundReason: reason,
            refundedAt: new Date(),
          })
          .where(eq(signupsTable.id, signup.id));

        return credit;
      });

      const amountDollars = (amountCents / 100).toFixed(2);

      res.json({ 
        success: true, 
        message: householdNotFound 
          ? "Refund processed as credit (household not found, applied to user)" 
          : "Refund processed as credit",
        credit: {
          id: result.id,
          amountCents: amountCents,
          amountDollars: amountDollars,
          appliedTo: appliedToHousehold ? 'household' : 'user',
          reason: `Refund: ${reason}`,
          householdNotFound: householdNotFound,
        },
      });

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

  app.get('/api/admin/sessions/:sessionId/participants', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const user = await storage.getUser(userId);
      if (!user || (!user.isAdmin && !user.isAssistant)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { signups, players, users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const participants = await db
        .select({
          userId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          playerFirstName: players.firstName,
          playerLastName: players.lastName,
        })
        .from(signups)
        .innerJoin(players, eq(signups.playerId, players.id))
        .innerJoin(users, eq(players.parentId, users.id))
        .where(eq(signups.sessionId, sessionId));

      const uniqueParents = new Map();
      participants.forEach(p => {
        if (!uniqueParents.has(p.userId)) {
          uniqueParents.set(p.userId, {
            id: p.userId,
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
            phone: p.phone,
          });
        }
      });

      res.json({ participants: Array.from(uniqueParents.values()) });
    } catch (error) {
      console.error("Error fetching session participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
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

      // Pass tenantId for proper multi-tenant isolation
      const analytics = await storage.getAnalytics(user.tenantId || undefined);
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

      const tenantId = user.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }

      const helpRequests = await storage.getHelpRequests(tenantId);
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
  
  // Setup admin coach management routes
  app.use('/api', isAuthenticated, adminCoachesRouter);
  
  // Setup unified invitation system routes (new system)
  app.use('/api/invitations', unifiedInvitationRoutes);

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

  // QuickBooks integration routes
  app.use('/api/admin/integrations/quickbooks', isAuthenticated, quickbooksRoutes);

  // Household CRUD routes
  // Helper to resolve tenantId for super admins (can use first available tenant)
  async function resolveHouseholdTenantId(req: any): Promise<string | null> {
    // If user has a tenantId, use it
    if (req.user?.tenantId) {
      return req.user.tenantId;
    }
    
    // For super admins, check if tenantId is provided in query/body
    if (req.user?.isSuperAdmin) {
      if (req.body?.tenantId) return req.body.tenantId;
      if (req.query?.tenantId) return req.query.tenantId;
      
      // Fall back to first available tenant for super admins
      const { db } = await import("./db");
      const { tenants } = await import("@shared/schema");
      const [firstTenant] = await db.select().from(tenants).limit(1);
      return firstTenant?.id || null;
    }
    
    return null;
  }

  // GET /api/households - List all households for tenant
  app.get('/api/households', isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = await resolveHouseholdTenantId(req);
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }

      const households = await storage.getHouseholds(tenantId);
      res.json(households);
    } catch (error) {
      console.error("Error fetching households:", error);
      res.status(500).json({ message: "Failed to fetch households" });
    }
  });

  // POST /api/households - Create new household
  app.post('/api/households', isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = await resolveHouseholdTenantId(req);
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }

      const validatedData = insertHouseholdSchema.parse({
        ...req.body,
        tenantId,
        createdBy: req.user.id,
      });

      const household = await storage.createHousehold(validatedData);
      
      // Automatically add the creating user as a primary member
      await storage.addHouseholdMember(household.id, tenantId, {
        userId: req.user.id,
        playerId: null,
        role: 'primary',
        addedBy: req.user.id,
      });
      
      // Return the household with members included
      const householdWithMembers = await storage.getHousehold(household.id, tenantId);
      res.status(201).json(householdWithMembers);
    } catch (error) {
      console.error("Error creating household:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create household" });
    }
  });

  // GET /api/households/:id - Get single household
  app.get('/api/households/:id', isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }

      const { id } = req.params;
      const household = await storage.getHousehold(id, tenantId);
      
      if (!household) {
        return res.status(404).json({ message: "Household not found" });
      }

      res.json(household);
    } catch (error) {
      console.error("Error fetching household:", error);
      res.status(500).json({ message: "Failed to fetch household" });
    }
  });

  // PATCH /api/households/:id - Update household
  app.patch('/api/households/:id', isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }

      const { id } = req.params;
      const validatedData = insertHouseholdSchema.partial().parse(req.body);

      const household = await storage.updateHousehold(id, tenantId, validatedData);
      res.json(household);
    } catch (error) {
      console.error("Error updating household:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update household" });
    }
  });

  // DELETE /api/households/:id - Delete household
  app.delete('/api/households/:id', isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }

      const { id } = req.params;
      await storage.deleteHousehold(id, tenantId);
      res.json({ success: true, message: "Household deleted successfully" });
    } catch (error) {
      console.error("Error deleting household:", error);
      res.status(500).json({ message: "Failed to delete household" });
    }
  });

  // POST /api/households/:id/members - Add member to household
  app.post('/api/households/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }

      const { id: householdId } = req.params;
      const { userId, playerId, role } = req.body;

      // Validate: exactly one of userId or playerId is required
      if ((!userId && !playerId) || (userId && playerId)) {
        return res.status(400).json({ 
          message: "Exactly one of userId or playerId is required" 
        });
      }

      const validatedData = insertHouseholdMemberSchema.partial().parse({
        userId: userId || null,
        playerId: playerId || null,
        role: role || "member",
        addedBy: req.user.id,
      });

      const household = await storage.addHouseholdMember(householdId, tenantId, validatedData);
      res.status(201).json(household);
    } catch (error) {
      console.error("Error adding household member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      // Check for unique constraint violation
      if ((error as any)?.message?.includes('unique') || (error as any)?.code === '23505') {
        return res.status(400).json({ 
          message: "This user or player is already in a household for this tenant" 
        });
      }
      res.status(500).json({ message: "Failed to add household member" });
    }
  });

  // DELETE /api/households/:householdId/members/:memberId - Remove member
  app.delete('/api/households/:householdId/members/:memberId', isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }

      const { householdId, memberId } = req.params;
      await storage.removeHouseholdMember(memberId, tenantId);

      // Return the updated household
      const household = await storage.getHousehold(householdId, tenantId);
      res.json(household);
    } catch (error) {
      console.error("Error removing household member:", error);
      res.status(500).json({ message: "Failed to remove household member" });
    }
  });

  // PATCH /api/households/:householdId/members/:memberId/role - Transfer primary role
  app.patch('/api/households/:householdId/members/:memberId/role', isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { householdId, memberId } = req.params;
      const { role } = req.body;

      if (role !== 'primary') {
        return res.status(400).json({ message: "Only 'primary' role transfer is supported" });
      }

      // Get the household with members
      const household = await storage.getHousehold(householdId, tenantId);
      if (!household) {
        return res.status(404).json({ message: "Household not found" });
      }

      // Find the current user's member record
      const callerMember = household.members?.find((m: any) => m.userId === userId);
      if (!callerMember) {
        return res.status(403).json({ message: "You are not a member of this household" });
      }

      // Only the current primary can transfer the role
      if (callerMember.role !== 'primary') {
        return res.status(403).json({ message: "Only the primary parent can transfer this role" });
      }

      // Find the target member
      const targetMember = household.members?.find((m: any) => m.id === memberId);
      if (!targetMember) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Target must be a user (parent), not a player
      if (!targetMember.userId) {
        return res.status(400).json({ message: "Primary role can only be transferred to a parent" });
      }

      // Cannot transfer to self
      if (targetMember.id === callerMember.id) {
        return res.status(400).json({ message: "Cannot transfer primary role to yourself" });
      }

      // Update the roles in database
      await db.update(householdMembers)
        .set({ role: 'member' })
        .where(and(
          eq(householdMembers.id, callerMember.id),
          eq(householdMembers.tenantId, tenantId)
        ));

      await db.update(householdMembers)
        .set({ role: 'primary' })
        .where(and(
          eq(householdMembers.id, memberId),
          eq(householdMembers.tenantId, tenantId)
        ));

      // Return updated household
      const updatedHousehold = await storage.getHousehold(householdId, tenantId);
      res.json(updatedHousehold);
    } catch (error) {
      console.error("Error transferring primary role:", error);
      res.status(500).json({ message: "Failed to transfer primary role" });
    }
  });

  // POST /api/households/:id/invite - Invite another parent to household
  app.post('/api/households/:id/invite', isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      // Block unaffiliated users
      if (tenantId === 'platform-staging') {
        return res.status(400).json({ 
          message: "Please join a club before inviting other parents" 
        });
      }

      const { id: householdId } = req.params;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }

      // Verify household exists and user has access
      const household = await storage.getHousehold(householdId, tenantId);
      if (!household) {
        return res.status(404).json({ message: "Household not found" });
      }

      // Verify user is a member of this household (authorization check)
      const isMember = household.members?.some((m: any) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ message: "You are not authorized to invite to this household" });
      }

      // Generate invite token using parent2 format for compatibility with existing validate/accept routes
      const inviteToken = Buffer.from(`parent2:${userId}:${householdId}:${Date.now()}`).toString('base64');
      const inviteUrl = `${req.protocol}://${req.get('host')}/parent2-invite/${inviteToken}`;

      // Update user with invite info
      await storage.updateUserParent2Invite(userId, 'email', email, new Date());

      // Get tenant info for branding
      const tenant = await storage.getTenant(tenantId);
      const invitingUser = req.user;
      const senderName = `${invitingUser.firstName || ''} ${invitingUser.lastName || ''}`.trim() || 'A parent';

      // Send the actual invitation email
      try {
        await emailTemplateService.sendEmail({
          to: email,
          template: {
            type: 'parent2',
            variant: 'html',
            data: {
              tenantId,
              tenantName: tenant?.name || 'PlayHQ',
              recipientName: email.split('@')[0], // Use email prefix as placeholder name
              recipientEmail: email,
              senderName,
              role: 'parent',
              inviteUrl,
              customMessage: `${senderName} has invited you to join their household on ${tenant?.name || 'PlayHQ'}. As a co-parent, you'll be able to manage players and book sessions together.`,
              tenantBranding: {
                businessName: tenant?.businessName || tenant?.name,
                primaryColor: tenant?.primaryColor || undefined,
              },
            },
          },
        });
        console.log(`Household invite email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send household invite email:', emailError);
        // Don't fail the request if email fails - invite is still created
      }

      res.json({
        success: true,
        inviteUrl,
        message: `Invitation sent to ${email}`,
      });
    } catch (error) {
      console.error("Error sending household invite:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  // GET /api/my/payments - Get current user's payment history
  app.get('/api/my/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;
      
      if (!userId || !tenantId) {
        return res.status(400).json({ message: "User ID and Tenant ID are required" });
      }

      const { signups, players, futsalSessions, payments, users, discountCodes } = await import('@shared/schema');
      const { desc, and } = await import('drizzle-orm');

      // Get all payments for this user's players
      const userPayments = await db
        .select({
          id: signups.id,
          playerId: signups.playerId,
          sessionId: signups.sessionId,
          paid: signups.paid,
          createdAt: signups.createdAt,
          // Discount info
          discountCodeApplied: signups.discountCodeApplied,
          discountAmountCents: signups.discountAmountCents,
          // Player info
          player: {
            id: players.id,
            firstName: players.firstName,
            lastName: players.lastName,
            birthYear: players.birthYear,
            gender: players.gender,
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
            priceCents: futsalSessions.priceCents,
          },
          // Parent info
          parent: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
          // Payment info
          paymentId: payments.id,
          paidAt: payments.paidAt,
          paymentAmount: payments.amountCents,
          paymentStatus: payments.status,
          paymentIntentId: payments.paymentIntentId,
          // Refund info
          refundedAt: signups.refundedAt,
          refundReason: signups.refundReason,
          paymentProvider: signups.paymentProvider,
        })
        .from(signups)
        .innerJoin(players, eq(signups.playerId, players.id))
        .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
        .innerJoin(users, eq(players.parentId, users.id))
        .leftJoin(payments, eq(signups.id, payments.signupId))
        .where(
          and(
            eq(users.id, userId),
            eq(signups.tenantId, tenantId),
            eq(signups.paid, true)
          )
        )
        .orderBy(desc(payments.paidAt));

      res.json(userPayments);
    } catch (error) {
      console.error("Error fetching user payments:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Trial status endpoint for authenticated tenants
  app.get('/api/trial/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ message: "Tenant context required" });
      }

      // Import the TrialManager
      const { TrialManager } = await import('./trial-management');
      const trialManager = new TrialManager();

      // Get tenant information
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      // Check trial status
      const trialStatus = await trialManager.checkTrialStatus(tenantId);
      
      // Calculate remaining time
      const now = new Date();
      const trialEndsAt = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
      const remainingMs = trialEndsAt ? Math.max(0, trialEndsAt.getTime() - now.getTime()) : 0;
      
      // Get extension information
      const extensionInfo = await trialManager.getExtensionStatus(tenantId);

      // Generate upgrade URL - redirect to settings page with plans tab
      const currentDomain = req.protocol + '://' + req.get('host');
      const upgradeUrl = `${currentDomain}/admin/settings?tab=plans-features`;

      res.json({
        status: trialStatus.status,
        trialEndsAt,
        remainingMs,
        trialPlan: tenant.trialPlan || 'core',
        gracePeriodEndsAt: trialStatus.gracePeriodEndsAt,
        extensionsUsed: extensionInfo.extensionsUsed,
        maxExtensions: extensionInfo.maxExtensions,
        canExtend: extensionInfo.canExtend,
        upgradeUrl,
        billingStatus: tenant.billingStatus || 'none'
      });
    } catch (error) {
      console.error("Error fetching trial status:", error);
      res.status(500).json({ message: "Failed to fetch trial status" });
    }
  });

  // Trial extension endpoint
  app.post('/api/trial/extend', isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ message: "Tenant context required" });
      }

      // Import the TrialManager
      const { TrialManager } = await import('./trial-management');
      const trialManager = new TrialManager();

      // Attempt to extend the trial
      const extensionResult = await trialManager.extendTrial(tenantId, {
        reason: req.body.reason || 'user_requested'
      });

      if (!extensionResult.success) {
        return res.status(400).json({ 
          message: extensionResult.error || "Failed to extend trial" 
        });
      }

      res.json({
        success: true,
        newTrialEndsAt: extensionResult.newTrialEndsAt,
        extensionsRemaining: extensionResult.extensionsRemaining,
        message: "Trial extended successfully"
      });
    } catch (error) {
      console.error("Error extending trial:", error);
      res.status(500).json({ message: "Failed to extend trial" });
    }
  });

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

  // Webhook routes (SendGrid for SMS only, Resend for email)
  app.use('/api/webhooks', sendgridWebhookRouter);
  app.use('/api/webhooks', resendWebhookRouter);
  app.use('/api/communications', communicationTestRouter);

  const httpServer = createServer(app);
  return httpServer;
}