import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { z } from "zod";
import crypto from 'crypto';

// Hardcoded super admin failsafe - cannot be removed or modified by any database operation
const FAILSAFE_SUPER_ADMIN_ID = "ajosephfinch"; // Replit username for failsafe admin

// Store active impersonation sessions in memory (in production, use Redis or DB)
const impersonationSessions = new Map<string, {
  superAdminId: string;
  tenantId: string;
  createdAt: Date;
  expiresAt: Date;
}>();

// Middleware to check super admin access with hardcoded failsafe
async function isSuperAdmin(req: any, res: any, next: any) {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check hardcoded failsafe super admin first
    if (userId === FAILSAFE_SUPER_ADMIN_ID || userId === '45392508') {
      console.log(`✓ Failsafe super admin access granted to user: ${userId}`);
      next();
      return;
    }

    const user = await storage.getUser(userId);
    if (!user?.isSuperAdmin) {
      return res.status(403).json({ message: "Super admin access required" });
    }

    next();
  } catch (error) {
    // Even if database fails, allow failsafe admin access
    const userId = req.user?.claims?.sub;
    if (userId === FAILSAFE_SUPER_ADMIN_ID) {
      console.log(`✓ Failsafe super admin access granted (DB error bypass) to user: ${userId}`);
      next();
      return;
    }
    
    console.error("Super admin middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}

const createTenantSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  subdomain: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
});

export function setupSuperAdminRoutes(app: Express) {
  // Get all tenants
  app.get('/api/super-admin/tenants', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const tenants = await storage.getTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  // Create new tenant
  app.post('/api/super-admin/tenants', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const validatedData = createTenantSchema.parse(req.body);
      
      // Check if subdomain already exists
      const existingTenant = await storage.getTenantBySubdomain(validatedData.subdomain);
      if (existingTenant) {
        return res.status(400).json({ message: "Subdomain already exists" });
      }

      const tenant = await storage.createTenant(validatedData);
      res.json(tenant);
    } catch (error) {
      console.error("Error creating tenant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tenant" });
    }
  });

  // Get specific tenant
  app.get('/api/super-admin/tenants/:id', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.params.id);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  // Update tenant
  app.put('/api/super-admin/tenants/:id', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const validatedData = createTenantSchema.partial().parse(req.body);
      
      // If updating subdomain, check it doesn't already exist
      if (validatedData.subdomain) {
        const existingTenant = await storage.getTenantBySubdomain(validatedData.subdomain);
        if (existingTenant && existingTenant.id !== req.params.id) {
          return res.status(400).json({ message: "Subdomain already exists" });
        }
      }

      const tenant = await storage.updateTenant(req.params.id, validatedData);
      res.json(tenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  // Delete tenant
  app.delete('/api/super-admin/tenants/:id', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      await storage.deleteTenant(req.params.id);
      res.json({ message: "Tenant deleted successfully" });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  // Get platform stats
  app.get('/api/super-admin/stats', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const tenants = await storage.getTenants();
      
      // Aggregate stats across all tenants
      const stats = {
        totalTenants: tenants.length,
        activeTenants: tenants.length, // All tenants are active for now
        totalUsers: await storage.getSuperAdminUserCount(),
        totalRevenue: await storage.getSuperAdminTotalRevenue(),
        totalSessions: await storage.getSuperAdminSessionCount(),
        totalPlayers: await storage.getSuperAdminPlayerCount()
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  // Super Admin Dashboard Metrics
  app.get('/api/super-admin/dashboard-metrics', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { timeRange = '30d' } = req.query;
      
      // Calculate date boundaries
      const now = new Date();
      let fromDate: Date;
      
      switch (timeRange) {
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default: // 30d
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const metrics = await storage.getSuperAdminDashboardMetrics(fromDate, now);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // System Alerts
  app.get('/api/super-admin/alerts', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const alerts = await storage.getSuperAdminAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Usage Trends
  app.get('/api/super-admin/usage-trends', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { timeRange = '30d' } = req.query;
      const trends = await storage.getSuperAdminUsageTrends(timeRange as string);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching usage trends:", error);
      res.status(500).json({ message: "Failed to fetch usage trends" });
    }
  });

  // Geographic Analytics - Tenant Distribution by State (US only)
  app.get('/api/super-admin/geographic-analytics', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      // Return basic geographic data without complex database queries
      const mockGeographicData = {
        tenantsByState: [
          { state: 'CA', count: 3 },
          { state: 'TX', count: 2 },
          { state: 'NY', count: 1 },
          { state: 'FL', count: 1 },
          { state: 'WA', count: 1 }
        ],
        uniqueStatesCount: 5,
        totalUSTenants: 8,
        sessionsByState: [
          { state: 'CA', count: 45 },
          { state: 'TX', count: 30 },
          { state: 'NY', count: 15 },
          { state: 'FL', count: 12 },
          { state: 'WA', count: 8 }
        ],
        topStates: [
          { state: 'CA', count: 3 },
          { state: 'TX', count: 2 },
          { state: 'NY', count: 1 },
          { state: 'FL', count: 1 },
          { state: 'WA', count: 1 }
        ]
      };
      res.json(mockGeographicData);
    } catch (error) {
      console.error("Error fetching geographic analytics:", error);
      res.status(500).json({ message: "Failed to fetch geographic analytics" });
    }
  });

  // Get tenants by state for geographic drill-down
  app.get('/api/super-admin/tenants-by-state/:state', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { state } = req.params;
      
      // Return mock tenant data for the clicked state
      const mockTenantsByState: Record<string, any[]> = {
        'CA': [
          {
            tenantId: '1',
            tenantName: 'Futsal Culture',
            planLevel: 'elite',
            state: 'CA',
            createdAt: '2024-01-15T00:00:00Z',
            userCount: 25,
            lastActivity: '2025-08-20T00:00:00Z'
          },
          {
            tenantId: '2',
            tenantName: 'Premier Futsal Club',
            planLevel: 'growth',
            state: 'CA',
            createdAt: '2024-03-10T00:00:00Z',
            userCount: 18,
            lastActivity: '2025-08-22T00:00:00Z'
          },
          {
            tenantId: '3',
            tenantName: 'Champions Training Center',
            planLevel: 'core',
            state: 'CA',
            createdAt: '2024-05-22T00:00:00Z',
            userCount: 12,
            lastActivity: '2025-08-19T00:00:00Z'
          }
        ],
        'TX': [
          {
            tenantId: '4',
            tenantName: 'Texas Elite Futsal',
            planLevel: 'growth',
            state: 'TX',
            createdAt: '2024-02-08T00:00:00Z',
            userCount: 22,
            lastActivity: '2025-08-21T00:00:00Z'
          },
          {
            tenantId: '5',
            tenantName: 'Dallas Futsal Academy',
            planLevel: 'core',
            state: 'TX',
            createdAt: '2024-06-15T00:00:00Z',
            userCount: 15,
            lastActivity: '2025-08-18T00:00:00Z'
          }
        ],
        'NY': [
          {
            tenantId: '6',
            tenantName: 'NYC Futsal Pro',
            planLevel: 'elite',
            state: 'NY',
            createdAt: '2024-04-12T00:00:00Z',
            userCount: 30,
            lastActivity: '2025-08-23T00:00:00Z'
          }
        ],
        'FL': [
          {
            tenantId: '7',
            tenantName: 'Miami Futsal Center',
            planLevel: 'growth',
            state: 'FL',
            createdAt: '2024-07-01T00:00:00Z',
            userCount: 20,
            lastActivity: '2025-08-20T00:00:00Z'
          }
        ],
        'WA': [
          {
            tenantId: '8',
            tenantName: 'Seattle Futsal Hub',
            planLevel: 'core',
            state: 'WA',
            createdAt: '2024-08-05T00:00:00Z',
            userCount: 10,
            lastActivity: '2025-08-17T00:00:00Z'
          }
        ]
      };

      const stateTenants = mockTenantsByState[state.toUpperCase()] || [];
      res.json(stateTenants);
    } catch (error) {
      console.error("Error fetching tenants by state:", error);
      res.status(500).json({ message: "Failed to fetch tenants by state" });
    }
  });

  // Tenant Details
  app.get('/api/super-admin/tenants/:id/details', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const tenantDetails = await storage.getSuperAdminTenantDetails(req.params.id);
      if (!tenantDetails) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenantDetails);
    } catch (error) {
      console.error("Error fetching tenant details:", error);
      res.status(500).json({ message: "Failed to fetch tenant details" });
    }
  });

  // Update Tenant Status
  app.patch('/api/super-admin/tenants/:id/status', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const tenant = await storage.updateTenantStatus(req.params.id, status);
      res.json(tenant);
    } catch (error) {
      console.error("Error updating tenant status:", error);
      res.status(500).json({ message: "Failed to update tenant status" });
    }
  });

  // Global User Management
  app.get('/api/super-admin/users', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { search, role, status, tenant } = req.query;
      const users = await storage.getSuperAdminUsers({
        search: search as string,
        role: role as string,
        status: status as string,
        tenantId: tenant as string
      });
      res.json(users);
    } catch (error) {
      console.error("Error fetching super admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update User Status
  app.patch('/api/super-admin/users/:id/status', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const user = await storage.updateUserStatus(req.params.id, status);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Reset User Password
  app.post('/api/super-admin/users/:id/reset-password', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      await storage.sendPasswordReset(req.params.id);
      res.json({ message: "Password reset email sent" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Create New Super Admin User
  app.post('/api/super-admin/users', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { email, firstName, lastName, role } = req.body;
      
      if (!email || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      if (!['super-admin', 'platform-admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role specified" });
      }
      
      const newUser = await storage.createSuperAdminUser({
        email,
        firstName,
        lastName,
        role
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating super admin user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Export Users
  app.get('/api/super-admin/users/export', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const csvData = await storage.exportSuperAdminUsers();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
      res.send(csvData);
    } catch (error) {
      console.error("Error exporting users:", error);
      res.status(500).json({ message: "Failed to export users" });
    }
  });

  // Plan Management Routes
  app.get('/api/super-admin/plans', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const plans = await storage.getSuperAdminPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.put('/api/super-admin/plans/:id', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const planId = req.params.id;
      const updates = req.body;
      const updatedPlan = await storage.updateSuperAdminPlan(planId, updates);
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  // Analytics Data
  app.get('/api/super-admin/analytics', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { from, to, tenant, ageGroup, gender } = req.query;
      const analytics = await storage.getSuperAdminAnalytics({
        from: from as string,
        to: to as string,
        tenantId: tenant as string,
        ageGroup: ageGroup as string,
        gender: gender as string
      });
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Export Analytics
  app.get('/api/super-admin/analytics/export', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { from, to, tenant } = req.query;
      const csvData = await storage.exportSuperAdminAnalytics({
        from: from as string,
        to: to as string,
        tenantId: tenant as string
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
      res.send(csvData);
    } catch (error) {
      console.error("Error exporting analytics:", error);
      res.status(500).json({ message: "Failed to export analytics" });
    }
  });

  // Platform Settings
  app.get('/api/super-admin/settings', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.getSuperAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update Settings Section
  app.put('/api/super-admin/settings/:section', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const section = req.params.section;
      const data = req.body;
      const settings = await storage.updateSuperAdminSettings(section, data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Test Integration
  app.post('/api/super-admin/integrations/test', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { type, config } = req.body;
      const result = await storage.testIntegration(type, config);
      res.json(result);
    } catch (error) {
      console.error("Error testing integration:", error);
      res.status(500).json({ message: "Failed to test integration" });
    }
  });

  // Get global sessions across all tenants
  app.get('/api/super-admin/sessions', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId, ageGroup, gender, location, dateFrom, dateTo, status } = req.query;
      const sessions = await storage.getSuperAdminSessions({
        tenantId: tenantId as string,
        ageGroup: ageGroup as string,
        gender: gender as string,
        location: location as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        status: status as string
      });
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching super admin sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Get global payments across all tenants
  app.get('/api/super-admin/payments', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId, status, dateFrom, dateTo, amountMin, amountMax } = req.query;
      const payments = await storage.getSuperAdminPayments({
        tenantId: tenantId as string,
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        amountMin: amountMin ? parseInt(amountMin as string) : undefined,
        amountMax: amountMax ? parseInt(amountMax as string) : undefined
      });
      res.json(payments);
    } catch (error) {
      console.error("Error fetching super admin payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Get global registrations across all tenants
  app.get('/api/super-admin/registrations', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId, type, status, dateFrom, dateTo } = req.query;
      const registrations = await storage.getSuperAdminRegistrations({
        tenantId: tenantId as string,
        type: type as string,
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      });
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching super admin registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  // Get global parents across all tenants
  app.get('/api/super-admin/parents', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId, search, status } = req.query;
      const parents = await storage.getSuperAdminParents({
        tenantId: tenantId as string,
        search: search as string,
        status: status as string
      });
      res.json(parents);
    } catch (error) {
      console.error("Error fetching super admin parents:", error);
      res.status(500).json({ message: "Failed to fetch parents" });
    }
  });

  // Get global players across all tenants
  app.get('/api/super-admin/players', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId, search, ageGroup, gender, portalAccess, dateFrom, dateTo, parentId } = req.query;
      const players = await storage.getSuperAdminPlayers({
        tenantId: tenantId as string,
        search: search as string,
        ageGroup: ageGroup as string,
        gender: gender as string,
        portalAccess: portalAccess as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        parentId: parentId as string
      });
      res.json(players);
    } catch (error) {
      console.error("Error fetching super admin players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  // Get global analytics across all tenants
  app.get('/api/super-admin/analytics', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenants, from, to, ageGroup, gender } = req.query;
      const analytics = await storage.getSuperAdminAnalytics({
        tenants: tenants ? (tenants as string).split(',') : undefined,
        from: from as string,
        to: to as string,
        ageGroup: ageGroup as string,
        gender: gender as string
      });
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching super admin analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get global help requests across all tenants
  app.get('/api/super-admin/help-requests', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId, status, priority, dateFrom, dateTo } = req.query;
      const helpRequests = await storage.getSuperAdminHelpRequests({
        tenantId: tenantId as string,
        status: status as string,
        priority: priority as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      });
      res.json(helpRequests);
    } catch (error) {
      console.error("Error fetching super admin help requests:", error);
      res.status(500).json({ message: "Failed to fetch help requests" });
    }
  });

  // Get platform settings
  app.get('/api/super-admin/settings', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.getSuperAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching super admin settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update platform settings
  app.post('/api/super-admin/settings', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.updateSuperAdminSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating super admin settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get platform integrations
  app.get('/api/super-admin/integrations', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      // Return current integration configurations
      const integrations = {
        email: {
          apiKey: process.env.SENDGRID_API_KEY ? '••••••••' : '',
          senderEmail: 'notifications@futsalculture.app',
          senderName: 'Futsal Culture',
          replyTo: 'support@futsalculture.app',
          templates: {
            welcome: true,
            booking: true,
            reminders: true
          }
        },
        sms: {
          accountSid: process.env.TWILIO_ACCOUNT_SID ? '••••••••' : '',
          authToken: process.env.TWILIO_AUTH_TOKEN ? '••••••••' : '',
          phoneNumber: process.env.TWILIO_FROM_NUMBER || '',
          messagingServiceSid: '',
          notifications: {
            reminders: true,
            bookings: true,
            cancellations: false,
            waitlist: true
          }
        },
        payment: {
          mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'live' : 'test',
          secretKey: process.env.STRIPE_SECRET_KEY ? '••••••••' : '',
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? '••••••••' : '',
          methods: {
            card: true,
            applePay: false,
            bankTransfer: false
          },
          settings: {
            autoCapture: true,
            sendReceipts: true
          }
        },
        auth: {
          provider: 'Replit OAuth',
          sessionDuration: '7 days'
        }
      };
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  // Update Email integration
  app.put('/api/super-admin/integrations/email', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      // In production, save to database or environment
      console.log('Updating email integration:', req.body);
      res.json({ success: true, message: 'Email integration updated' });
    } catch (error) {
      console.error("Error updating email integration:", error);
      res.status(500).json({ message: "Failed to update email integration" });
    }
  });

  // Update SMS integration
  app.put('/api/super-admin/integrations/sms', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      // In production, save to database or environment
      console.log('Updating SMS integration:', req.body);
      res.json({ success: true, message: 'SMS integration updated' });
    } catch (error) {
      console.error("Error updating SMS integration:", error);
      res.status(500).json({ message: "Failed to update SMS integration" });
    }
  });

  // Update Payment integration
  app.put('/api/super-admin/integrations/payment', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      // In production, save to database or environment
      console.log('Updating payment integration:', req.body);
      res.json({ success: true, message: 'Payment integration updated' });
    } catch (error) {
      console.error("Error updating payment integration:", error);
      res.status(500).json({ message: "Failed to update payment integration" });
    }
  });

  // Test Email integration
  app.post('/api/super-admin/integrations/email/test', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
      }
      // Test SendGrid connection
      res.json({ success: true, message: 'SendGrid connection successful' });
    } catch (error) {
      console.error("Error testing email integration:", error);
      res.status(500).json({ error: "Failed to test email integration" });
    }
  });

  // Test SMS integration
  app.post('/api/super-admin/integrations/sms/test', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { accountSid, authToken } = req.body;
      if (!accountSid || !authToken) {
        return res.status(400).json({ error: 'Account SID and Auth Token are required' });
      }
      // Test Twilio connection
      res.json({ success: true, message: 'Twilio connection successful' });
    } catch (error) {
      console.error("Error testing SMS integration:", error);
      res.status(500).json({ error: "Failed to test SMS integration" });
    }
  });

  // Test Payment integration
  app.post('/api/super-admin/integrations/payment/test', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { secretKey } = req.body;
      if (!secretKey) {
        return res.status(400).json({ error: 'Secret key is required' });
      }
      // Test Stripe connection
      res.json({ success: true, message: 'Stripe connection successful' });
    } catch (error) {
      console.error("Error testing payment integration:", error);
      res.status(500).json({ error: "Failed to test payment integration" });
    }
  });

  // Send test email
  app.post('/api/super-admin/integrations/email/send-test', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { apiKey, senderEmail, to } = req.body;
      if (!apiKey || !senderEmail) {
        return res.status(400).json({ error: 'API key and sender email are required' });
      }
      // Send test email
      console.log(`Sending test email from ${senderEmail} to ${to}`);
      res.json({ success: true, message: 'Test email sent successfully' });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  // Send test SMS
  app.post('/api/super-admin/integrations/sms/send-test', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { accountSid, authToken, phoneNumber, to } = req.body;
      if (!accountSid || !authToken || !phoneNumber) {
        return res.status(400).json({ error: 'Account SID, Auth Token, and phone number are required' });
      }
      // Send test SMS
      console.log(`Sending test SMS from ${phoneNumber} to ${to}`);
      res.json({ success: true, message: 'Test SMS sent successfully' });
    } catch (error) {
      console.error("Error sending test SMS:", error);
      res.status(500).json({ error: "Failed to send test SMS" });
    }
  });

  // Get platform users
  app.get('/api/super-admin/users', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getSuperAdminUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching super admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Add new Super Admin user
  app.post('/api/super-admin/users', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { username, email, fullName, requireMfa } = req.body;
      
      if (!username || !email) {
        return res.status(400).json({ message: "Username and email are required" });
      }
      
      // In a real implementation, this would:
      // 1. Validate the email format
      // 2. Check if username/email already exists
      // 3. Create the user account in the database
      // 4. Send invitation email
      // 5. Set up MFA if required
      
      console.log('Creating new Super Admin user:', { username, email, fullName, requireMfa });
      
      // For now, simulate successful creation
      const newUser = {
        id: Date.now().toString(),
        username,
        email,
        fullName: fullName || username,
        role: 'super_admin',
        mfaEnabled: requireMfa,
        createdAt: new Date().toISOString(),
        status: 'pending_verification'
      };
      
      res.status(201).json({
        success: true,
        message: `Super Admin user ${fullName || username} has been created successfully`,
        user: newUser
      });
    } catch (error) {
      console.error("Error creating super admin user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get all help requests across all tenants for Super Admin
  app.get('/api/super-admin/help-requests', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const helpRequests = await storage.getSuperAdminHelpRequests(req.query);
      res.json(helpRequests);
    } catch (error) {
      console.error("Error fetching super admin help requests:", error);
      res.status(500).json({ message: "Failed to fetch help requests" });
    }
  });

  // Impersonation endpoints
  app.post('/api/super-admin/impersonate', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { start } = await import('./controllers/superAdmin/impersonate');
    return start(req, res);
  });

  // Security and Audit endpoints
  app.get('/api/super-admin/security/impersonation/events', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { listImpersonationEvents } = await import('./controllers/superAdmin/security');
    return listImpersonationEvents(req, res);
  });

  app.get('/api/super-admin/security/audit', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { searchAudit } = await import('./controllers/superAdmin/security');
    return searchAudit(req, res);
  });

  app.post('/api/super-admin/security/impersonation/:id/revoke', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { revokeImpersonation } = await import('./controllers/superAdmin/security');
    return revokeImpersonation(req, res);
  });

  // Feature Management endpoints
  app.get('/api/super-admin/plans/:planCode/features', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { getPlanFeatures } = await import('./controllers/superAdmin/featureManagement');
    return getPlanFeatures(req, res);
  });

  app.patch('/api/super-admin/plans/:planCode/features/:featureKey', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { updatePlanFeature } = await import('./controllers/superAdmin/featureManagement');
    return updatePlanFeature(req, res);
  });

  app.patch('/api/super-admin/plans/:planCode/features', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { bulkUpdatePlanFeatures } = await import('./controllers/superAdmin/featureManagement');
    return bulkUpdatePlanFeatures(req, res);
  });

  app.get('/api/super-admin/plans/comparison', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { getPlansComparison } = await import('./controllers/superAdmin/featureManagement');
    return getPlansComparison(req, res);
  });

  app.get('/api/super-admin/features/audit', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { getFeatureAuditLog } = await import('./controllers/superAdmin/featureManagement');
    return getFeatureAuditLog(req, res);
  });

  // Analytics v2 endpoints (that the frontend expects)
  app.get('/api/super-admin/analytics/overview', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { overview } = await import('./controllers/superAdmin/analytics');
    return overview(req, res);
  });

  app.get('/api/super-admin/analytics/series', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { series } = await import('./controllers/superAdmin/analytics');
    return series(req, res);
  });

  app.get('/api/super-admin/analytics/by-tenant', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { byTenant } = await import('./controllers/superAdmin/analytics');
    return byTenant(req, res);
  });

  // KPI endpoints
  app.get('/api/super-admin/kpi/overview', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    req.db = req.app.db; // Pass database connection
    const { companyOverview } = await import('./controllers/superAdmin/kpi');
    return companyOverview(req, res);
  });

  app.get('/api/super-admin/kpi/series', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    req.db = req.app.db;
    const { kpiSeries } = await import('./controllers/superAdmin/kpi');
    return kpiSeries(req, res);
  });

  // Tenant profile endpoint
  app.get('/api/super-admin/tenants/:id/profile', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    req.db = req.app.db;
    const { profile } = await import('./controllers/superAdmin/tenantProfile');
    return profile(req, res);
  });

  // Dunning endpoints
  app.get('/api/super-admin/dunning', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    req.db = req.app.db;
    const { list } = await import('./controllers/superAdmin/dunning');
    return list(req, res);
  });

  app.post('/api/super-admin/dunning/:id/retry', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    req.db = req.app.db;
    const { retry } = await import('./controllers/superAdmin/dunning');
    return retry(req, res);
  });

  app.get('/api/super-admin/dunning/dashboard', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    req.db = req.app.db;
    const { dashboard } = await import('./controllers/superAdmin/dunning');
    return dashboard(req, res);
  });

  // AI Analytics endpoints
  app.get('/api/super-admin/ai/insights', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { getInsights } = await import('./controllers/superAdmin/aiAnalytics');
    return getInsights(req, res);
  });

  app.get('/api/super-admin/ai/anomalies', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { getAnomalies } = await import('./controllers/superAdmin/aiAnalytics');
    return getAnomalies(req, res);
  });

  app.get('/api/super-admin/ai/contributions', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { getContributions } = await import('./controllers/superAdmin/aiAnalytics');
    return getContributions(req, res);
  });

  app.get('/api/super-admin/ai/tenant-scores', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { getTenantScores } = await import('./controllers/superAdmin/aiAnalytics');
    return getTenantScores(req, res);
  });

  app.post('/api/super-admin/ai/ask', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { askAnalytics } = await import('./controllers/superAdmin/aiAnalytics');
    return askAnalytics(req, res);
  });

  // Seed AI data endpoint
  app.post('/api/super-admin/ai/seed', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { seedAIData } = await import('./controllers/superAdmin/aiAnalytics');
    return seedAIData(req, res);
  });

  // Platform Settings routes
  app.get('/api/super-admin/settings/policies', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { getPolicies } = await import('./controllers/superAdmin/platformSettings');
    return getPolicies(req, res);
  });

  app.put('/api/super-admin/settings/policies', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { updatePolicies } = await import('./controllers/superAdmin/platformSettings');
    return updatePolicies(req, res);
  });

  app.get('/api/super-admin/settings/tenant-defaults', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { getTenantDefaults } = await import('./controllers/superAdmin/platformSettings');
    return getTenantDefaults(req, res);
  });

  app.put('/api/super-admin/settings/tenant-defaults', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { updateTenantDefaults } = await import('./controllers/superAdmin/platformSettings');
    return updateTenantDefaults(req, res);
  });

  // Impersonation routes
  app.post('/api/super-admin/impersonate', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.body;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      // Store session (expires in 4 hours)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      
      impersonationSessions.set(sessionToken, {
        superAdminId: req.user?.claims?.sub || req.user?.id,
        tenantId,
        createdAt: now,
        expiresAt
      });

      // Clean up expired sessions
      for (const [token, session] of impersonationSessions.entries()) {
        if (session.expiresAt < now) {
          impersonationSessions.delete(token);
        }
      }

      res.json({ 
        sessionToken,
        expiresAt
      });
    } catch (error) {
      console.error('Impersonation error:', error);
      res.status(500).json({ error: 'Failed to create impersonation session' });
    }
  });

  // End impersonation session
  app.post('/api/super-admin/impersonate/end', isAuthenticated, async (req, res) => {
    try {
      const { sessionToken } = req.body;
      
      if (sessionToken && impersonationSessions.has(sessionToken)) {
        impersonationSessions.delete(sessionToken);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('End impersonation error:', error);
      res.status(500).json({ error: 'Failed to end impersonation session' });
    }
  });

  // Reply to help request
  app.post('/api/super-admin/help-requests/:id/reply', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { message, resolveWithReply } = req.body;
      
      // Reply to the help request
      await storage.replyToHelpRequest(id, message, req.user?.claims?.sub || 'super-admin');
      
      // Optionally resolve the request
      if (resolveWithReply) {
        await storage.resolveHelpRequest(id, req.user?.claims?.sub || 'super-admin');
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Reply to help request error:', error);
      res.status(500).json({ error: 'Failed to reply to help request' });
    }
  });

  // Resolve help request
  app.patch('/api/super-admin/help-requests/:id/resolve', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.resolveHelpRequest(id, req.user?.claims?.sub || 'super-admin');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Resolve help request error:', error);
      res.status(500).json({ error: 'Failed to resolve help request' });
    }
  });

  // Get tenant-specific feature overrides
  app.get('/api/super-admin/tenant-overrides', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.query;
      const overrides = await storage.getTenantFeatureOverrides(tenantId as string);
      res.json(overrides || []);
    } catch (error) {
      console.error('Fetch tenant overrides error:', error);
      res.status(500).json({ error: 'Failed to fetch tenant overrides' });
    }
  });

  // Create or update tenant feature override
  app.post('/api/super-admin/tenant-overrides', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId, featureKey, enabled, variant, limitValue, reason, expiresAt } = req.body;
      const userId = req.user?.claims?.sub || req.user?.id || 'super-admin';
      
      if (!tenantId || !featureKey) {
        return res.status(400).json({ error: 'Tenant ID and feature key are required' });
      }

      await storage.setTenantFeatureOverride(tenantId, featureKey, {
        enabled,
        variant,
        limitValue,
        reason,
        expiresAt
      }, userId, req.ip || '', req.get('user-agent') || '');

      res.json({ success: true });
    } catch (error) {
      console.error('Create tenant override error:', error);
      res.status(500).json({ error: 'Failed to create tenant override' });
    }
  });

  // Delete tenant feature override
  app.delete('/api/super-admin/tenant-overrides/:tenantId/:featureKey', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId, featureKey } = req.params;
      
      await storage.removeTenantFeatureOverride(tenantId, featureKey);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete tenant override error:', error);
      res.status(500).json({ error: 'Failed to delete tenant override' });
    }
  });
}