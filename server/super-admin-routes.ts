import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { z } from "zod";

// Hardcoded super admin failsafe - cannot be removed or modified by any database operation
const FAILSAFE_SUPER_ADMIN_ID = "ajosephfinch"; // Replit username for failsafe admin

// Middleware to check super admin access with hardcoded failsafe
async function isSuperAdmin(req: any, res: any, next: any) {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check hardcoded failsafe super admin first
    if (userId === FAILSAFE_SUPER_ADMIN_ID) {
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
      const integrations = await storage.getSuperAdminIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching super admin integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  // Update integration
  app.patch('/api/super-admin/integrations/:id', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const integration = await storage.updateSuperAdminIntegration(req.params.id, req.body);
      res.json(integration);
    } catch (error) {
      console.error("Error updating super admin integration:", error);
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  // Test integration
  app.post('/api/super-admin/integrations/:id/test', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const result = await storage.testSuperAdminIntegration(req.params.id);
      res.json(result);
    } catch (error) {
      console.error("Error testing super admin integration:", error);
      res.status(500).json({ message: "Failed to test integration" });
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
}