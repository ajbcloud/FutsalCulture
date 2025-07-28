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
}