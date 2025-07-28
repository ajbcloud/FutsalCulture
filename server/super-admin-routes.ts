import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { z } from "zod";

// Middleware to check super admin access
async function isSuperAdmin(req: any, res: any, next: any) {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    if (!user?.isSuperAdmin) {
      return res.status(403).json({ message: "Super admin access required" });
    }

    next();
  } catch (error) {
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
      
      // For now, return basic stats
      // In the future, you could aggregate stats across all tenants
      const stats = {
        totalTenants: tenants.length,
        activeTenants: tenants.length, // All tenants are active for now
        totalUsers: 0, // Would need to aggregate across tenants
        totalRevenue: 0, // Would need to aggregate across tenants
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform stats" });
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
      const { tenantId, search, ageGroup, gender, portalAccess, dateFrom, dateTo } = req.query;
      const players = await storage.getSuperAdminPlayers({
        tenantId: tenantId as string,
        search: search as string,
        ageGroup: ageGroup as string,
        gender: gender as string,
        portalAccess: portalAccess as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
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
}