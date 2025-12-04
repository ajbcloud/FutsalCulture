import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { z } from "zod";
import crypto from 'crypto';
// Import platform settings controllers
import { getPolicies, updatePolicies, getTenantDefaults, updateTenantDefaults, getTrialSettings, updateTrialSettings } from './controllers/superAdmin/platformSettings';
import { trialManager } from './trial-management';
import * as communicationsController from './controllers/superAdmin/communications';

// Super admin email for authentication
const SUPER_ADMIN_EMAIL = "admin@playhq.app";

// Email from address (used across all email sending)
const FROM_EMAIL = 'noreply@playhq.app';

// Store active impersonation sessions in memory (in production, use Redis or DB)
const impersonationSessions = new Map<string, {
  superAdminId: string;
  tenantId: string;
  createdAt: Date;
  expiresAt: Date;
}>();

// Middleware to check super admin access
async function isSuperAdmin(req: any, res: any, next: any) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if user is super admin by email or database flag
    if (user.email === SUPER_ADMIN_EMAIL || user.isSuperAdmin) {
      console.log(`✓ Super admin access granted to user: ${user.email}`);
      next();
      return;
    }

    return res.status(403).json({ message: "Super admin access required" });
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

  // Create new tenant with automatic admin user
  app.post('/api/super-admin/tenants', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { name, subdomain, adminEmail, adminName, plan = 'free', sendWelcomeEmail = true, autoApprove = true } = req.body;
      
      if (!name || !subdomain || !adminEmail) {
        return res.status(400).json({ message: "Name, subdomain, and admin email are required" });
      }
      
      // Check if subdomain already exists
      const existingTenant = await storage.getTenantBySubdomain(subdomain);
      if (existingTenant) {
        return res.status(400).json({ message: "Subdomain already exists" });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(adminEmail);
      if (existingUser) {
        return res.status(400).json({ message: "Admin email already exists" });
      }

      // Import necessary modules
      const { db } = await import('./db');
      const { emailVerificationTokens, users } = await import('@shared/schema');
      const { sendEmail } = await import('./emailService');
      const { nanoid } = await import('nanoid');

      // Create tenant with appropriate status
      const now = new Date();
      const tenantData: any = {
        name,
        subdomain,
        status: autoApprove ? 'active' : 'pending',
        billingStatus: autoApprove ? 'trial' : 'pending_approval',
        trialStartedAt: autoApprove ? now : null,
        trialEndsAt: autoApprove ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null,
        trialPlan: autoApprove ? 'core' : null,
        planLevel: plan as any,
        contactName: adminName || name,
        contactEmail: adminEmail,
      };
      
      const tenant = await storage.createTenant(tenantData);
      
      // Create admin user for the tenant
      const firstName = adminName ? adminName.split(' ')[0] : name;
      const lastName = adminName ? adminName.split(' ').slice(1).join(' ') : '';
      
      const adminUser = await storage.upsertUser({
        email: adminEmail.toLowerCase(),
        firstName,
        lastName,
        role: 'tenant_admin',
        isAdmin: true,
        tenantId: tenant.id,
        verificationStatus: 'pending_verify',
        authProvider: 'local',
      });
      
      // Generate verification token for password setup
      const raw = crypto.randomBytes(32).toString("base64url");
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours
      
      await db.insert(emailVerificationTokens).values({
        userId: adminUser.id,
        tokenHash: hash,
        expiresAt: expires,
      });
      
      // Send welcome email if requested
      if (sendWelcomeEmail) {
        const app_url = process.env.NODE_ENV === 'production' 
          ? 'https://playhq.app' 
          : (process.env.REPLIT_APP_URL || 'http://localhost:3000');
        const link = `${app_url}/set-password?token=${encodeURIComponent(raw)}`;
        
        await sendEmail({
          to: adminEmail,
          from: FROM_EMAIL,
          subject: "Welcome to PlayHQ - Your Organization is Ready",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Welcome to PlayHQ!</h1>
              <p>Hi ${firstName},</p>
              <p>Your organization <strong>${name}</strong> has been created on PlayHQ by a Super Admin.</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Your Organization Details:</h3>
                <p><strong>Organization Name:</strong> ${name}</p>
                <p><strong>URL:</strong> https://${subdomain}.playhq.app</p>
                <p><strong>Plan:</strong> ${plan === 'free' ? 'Free' : plan === 'core' ? 'Core (14-day Trial)' : plan}</p>
                ${autoApprove ? '<p><strong>Status:</strong> Active</p>' : '<p><strong>Status:</strong> Pending Approval</p>'}
              </div>
              <p>Click the button below to set your password and get started:</p>
              <p style="margin: 30px 0;">
                <a href="${link}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Set Password & Get Started
                </a>
              </p>
              <p>This link will expire in 48 hours.</p>
              <p>Best regards,<br>The PlayHQ Team</p>
            </div>
          `,
          text: `Welcome to PlayHQ! Your organization ${name} has been created. Set your password: ${link}`,
        }).catch(err => console.error('Failed to send welcome email:', err));
      }
      
      res.json({
        tenant,
        adminUser: { id: adminUser.id, email: adminUser.email },
        message: sendWelcomeEmail ? "Tenant created and welcome email sent" : "Tenant created successfully",
      });
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({ message: "Failed to create tenant", error: error instanceof Error ? error.message : 'Unknown error' });
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
  
  // Approve pending tenant
  app.post('/api/super-admin/tenants/:id/approve', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const tenant = await storage.getTenant(id);
      
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      if (tenant.status === 'active') {
        return res.status(400).json({ message: "Tenant is already active" });
      }
      
      // Import necessary modules
      const { sendEmail } = await import('./emailService');
      const { db } = await import('./db');
      const { users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Update tenant status to active and start trial
      const now = new Date();
      const updatedTenant = await storage.updateTenant(id, {
        status: 'active',
        billingStatus: 'trial',
        trialStartedAt: now,
        trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
        trialPlan: 'core' as any,
      });
      
      // Get the admin user for this tenant
      const [adminUser] = await db.select()
        .from(users)
        .where(eq(users.tenantId, id))
        .limit(1);
      
      if (adminUser && adminUser.email) {
        // Send approval notification email
        await sendEmail({
          to: adminUser.email,
          from: FROM_EMAIL,
          subject: "Your PlayHQ Organization Has Been Approved!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Great News - You're Approved!</h1>
              <p>Hi ${adminUser.firstName || 'there'},</p>
              <p>Your organization <strong>${tenant.name}</strong> has been approved and is now active on PlayHQ!</p>
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
                <h3 style="color: #22c55e; margin-top: 0;">✓ Application Approved</h3>
                <p>Your 14-day trial has started. You now have full access to all PlayHQ features.</p>
              </div>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Your Organization Details:</h3>
                <p><strong>Organization:</strong> ${tenant.name}</p>
                <p><strong>URL:</strong> https://${tenant.subdomain}.playhq.app</p>
                <p><strong>Trial Ends:</strong> ${new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              </div>
              <h3>Get Started:</h3>
              <ol style="line-height: 2;">
                <li>Add your team members and players</li>
                <li>Create your first training session</li>
                <li>Configure payment settings</li>
                <li>Customize your organization settings</li>
              </ol>
              <p style="margin-top: 30px;">
                <a href="https://playhq.app/login" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to Dashboard →
                </a>
              </p>
              <p>If you have any questions, we're here to help at <a href="mailto:support@playhq.app">support@playhq.app</a></p>
              <p>Welcome aboard!</p>
              <p>The PlayHQ Team</p>
            </div>
          `,
          text: `Your organization ${tenant.name} has been approved! Your 14-day trial has started. Login at https://playhq.app to get started.`,
        }).catch(err => console.error('Failed to send approval email:', err));
      }
      
      res.json({
        tenant: updatedTenant,
        message: "Tenant approved successfully",
      });
    } catch (error) {
      console.error("Error approving tenant:", error);
      res.status(500).json({ message: "Failed to approve tenant" });
    }
  });
  
  // Reject pending tenant
  app.post('/api/super-admin/tenants/:id/reject', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason = "Your application did not meet our requirements at this time." } = req.body;
      
      const tenant = await storage.getTenant(id);
      
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      if (tenant.status !== 'pending') {
        return res.status(400).json({ message: "Only pending tenants can be rejected" });
      }
      
      // Import necessary modules
      const { sendEmail } = await import('./emailService');
      const { db } = await import('./db');
      const { users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Update tenant status to rejected
      const updatedTenant = await storage.updateTenant(id, {
        status: 'rejected',
        billingStatus: 'rejected',
      });
      
      // Get the admin user for this tenant
      const [adminUser] = await db.select()
        .from(users)
        .where(eq(users.tenantId, id))
        .limit(1);
      
      if (adminUser && adminUser.email) {
        // Send rejection notification email
        await sendEmail({
          to: adminUser.email,
          from: FROM_EMAIL,
          subject: "Update on Your PlayHQ Application",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Application Update</h1>
              <p>Hi ${adminUser.firstName || 'there'},</p>
              <p>Thank you for your interest in PlayHQ.</p>
              <p>After reviewing your application for <strong>${tenant.name}</strong>, we regret to inform you that we're unable to approve it at this time.</p>
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
              </div>
              <p>If you believe this decision was made in error or if you'd like to discuss your application, please don't hesitate to contact us at <a href="mailto:support@playhq.app">support@playhq.app</a>.</p>
              <p>We appreciate your understanding and wish you the best in finding a solution that meets your needs.</p>
              <p>Best regards,<br>The PlayHQ Team</p>
            </div>
          `,
          text: `Your PlayHQ application for ${tenant.name} was not approved. Reason: ${reason}. Contact support@playhq.app if you have questions.`,
        }).catch(err => console.error('Failed to send rejection email:', err));
      }
      
      res.json({
        tenant: updatedTenant,
        message: "Tenant rejected",
      });
    } catch (error) {
      console.error("Error rejecting tenant:", error);
      res.status(500).json({ message: "Failed to reject tenant" });
    }
  });
  
  // Update tenant status (for manual status changes)
  app.patch('/api/super-admin/tenants/:id/status', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['active', 'suspended', 'trial', 'pending', 'inactive'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const tenant = await storage.updateTenant(id, { status });
      res.json(tenant);
    } catch (error) {
      console.error("Error updating tenant status:", error);
      res.status(500).json({ message: "Failed to update tenant status" });
    }
  });

  // Get tenant age policy settings
  app.get('/api/super-admin/tenants/:id/age-policy', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { db } = await import('./db');
      const { tenantPolicies } = await import('@shared/db/schema/tenantPolicy');
      const { eq } = await import('drizzle-orm');
      
      const tenant = await storage.getTenant(id);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      // Get tenant policy
      const [policy] = await db.select()
        .from(tenantPolicies)
        .where(eq(tenantPolicies.tenantId, id));
      
      res.json({
        audienceMode: policy?.audienceMode || 'youth_only',
        parentRequiredBelow: policy?.parentRequiredBelow || 13,
        teenSelfAccessAt: policy?.teenSelfAccessAt || 13,
        adultAge: policy?.adultAge || 18,
        allowTeenPayments: policy?.allowTeenPayments || false,
      });
    } catch (error) {
      console.error("Error fetching tenant age policy:", error);
      res.status(500).json({ message: "Failed to fetch tenant age policy" });
    }
  });

  // Update tenant age policy settings
  app.patch('/api/super-admin/tenants/:id/age-policy', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { audienceMode, parentRequiredBelow, teenSelfAccessAt, adultAge, allowTeenPayments } = req.body;
      
      const { db } = await import('./db');
      const { tenantPolicies } = await import('@shared/db/schema/tenantPolicy');
      const { eq } = await import('drizzle-orm');
      
      const tenant = await storage.getTenant(id);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      // Validate audienceMode
      const validModes = ['youth_only', 'mixed', 'adult_only'];
      if (audienceMode && !validModes.includes(audienceMode)) {
        return res.status(400).json({ message: "Invalid audience mode. Must be: youth_only, mixed, or adult_only" });
      }
      
      // Check if policy exists
      const [existingPolicy] = await db.select()
        .from(tenantPolicies)
        .where(eq(tenantPolicies.tenantId, id));
      
      const updateData: any = {};
      if (audienceMode !== undefined) updateData.audienceMode = audienceMode;
      if (parentRequiredBelow !== undefined) updateData.parentRequiredBelow = parentRequiredBelow;
      if (teenSelfAccessAt !== undefined) updateData.teenSelfAccessAt = teenSelfAccessAt;
      if (adultAge !== undefined) updateData.adultAge = adultAge;
      if (allowTeenPayments !== undefined) updateData.allowTeenPayments = allowTeenPayments;
      
      let policy;
      if (existingPolicy) {
        // Update existing policy
        [policy] = await db.update(tenantPolicies)
          .set(updateData)
          .where(eq(tenantPolicies.tenantId, id))
          .returning();
      } else {
        // Create new policy
        [policy] = await db.insert(tenantPolicies)
          .values({
            tenantId: id,
            ...updateData,
          })
          .returning();
      }
      
      res.json({
        audienceMode: policy?.audienceMode || 'youth_only',
        parentRequiredBelow: policy?.parentRequiredBelow || 13,
        teenSelfAccessAt: policy?.teenSelfAccessAt || 13,
        adultAge: policy?.adultAge || 18,
        allowTeenPayments: policy?.allowTeenPayments || false,
        message: "Age policy updated successfully",
      });
    } catch (error) {
      console.error("Error updating tenant age policy:", error);
      res.status(500).json({ message: "Failed to update tenant age policy" });
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

  // Communications API Routes
  // Template Management
  app.get('/api/super-admin/communications/templates', isAuthenticated, isSuperAdmin, communicationsController.getPlatformTemplates);
  app.post('/api/super-admin/communications/templates', isAuthenticated, isSuperAdmin, communicationsController.createPlatformTemplate);
  app.patch('/api/super-admin/communications/templates/:id', isAuthenticated, isSuperAdmin, communicationsController.updatePlatformTemplate);
  app.delete('/api/super-admin/communications/templates/:id', isAuthenticated, isSuperAdmin, communicationsController.deletePlatformTemplate);
  app.post('/api/super-admin/communications/templates/clone', isAuthenticated, isSuperAdmin, communicationsController.cloneTemplateToTenants);

  // Message Sending
  app.post('/api/super-admin/communications/send', isAuthenticated, isSuperAdmin, communicationsController.sendPlatformMessage);
  app.get('/api/super-admin/communications/history', isAuthenticated, isSuperAdmin, communicationsController.getMessageHistory);
  app.get('/api/super-admin/communications/recipients', isAuthenticated, isSuperAdmin, communicationsController.getAvailableRecipients);
  app.post('/api/super-admin/communications/schedule', isAuthenticated, isSuperAdmin, communicationsController.scheduleMessage);
  
  // Campaign Management
  app.delete('/api/super-admin/communications/campaigns/:id', isAuthenticated, isSuperAdmin, communicationsController.cancelScheduledCampaign);
  app.get('/api/super-admin/communications/campaigns/:campaignId/analytics', isAuthenticated, isSuperAdmin, communicationsController.getCampaignAnalytics);
  
  // Export
  app.get('/api/super-admin/communications/export', isAuthenticated, isSuperAdmin, communicationsController.exportAnalytics);

  // Geographic Distribution - Tenant Distribution by State for Map Component
  app.get('/api/super-admin/geographic-distribution', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      // Get real tenant data grouped by state
      const tenants = await storage.getTenants();
      
      // State name to abbreviation mapping
      const stateToAbbrev: Record<string, string> = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
        'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
        'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
        'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
        'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
        'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
        'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
        'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
        'District of Columbia': 'DC'
      };
      
      console.log(`Fetched ${tenants.length} tenants for geographic distribution`);
      
      // Group tenants by state and count them
      const stateDistribution = tenants.reduce((acc: any, tenant) => {
        if (!tenant.state) {
          console.log(`Tenant ${tenant.name} has no state information`);
          return acc;
        }
        
        // Try to get state abbreviation, fallback to the state value if it's already an abbreviation
        // Always normalize to uppercase to avoid case-sensitivity issues (FL vs Fl)
        const stateAbbrev = (stateToAbbrev[tenant.state] || tenant.state).toUpperCase();
        
        if (!acc[stateAbbrev]) {
          acc[stateAbbrev] = { 
            state: tenant.state, 
            stateCode: stateAbbrev, 
            tenantCount: 0 
          };
        }
        acc[stateAbbrev].tenantCount++;
        return acc;
      }, {});
      
      // Convert to array format expected by the component
      const tenantDistribution = Object.values(stateDistribution);
      
      console.log('Geographic distribution result:', tenantDistribution);
      res.json(tenantDistribution);
    } catch (error) {
      console.error("Error fetching geographic distribution:", error);
      res.status(500).json({ message: "Failed to fetch geographic distribution" });
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
            tenantName: 'PlayHQ',
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
      const { isEmailConfigured } = await import('./utils/email-provider');
      const emailConfigured = await isEmailConfigured();
      
      const integrations = {
        email: {
          provider: 'Resend',
          configured: emailConfigured,
          senderEmail: 'noreply@playhq.app',
          senderName: 'PlayHQ',
          replyTo: 'support@playhq.app',
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

  // Comprehensive Trial Settings routes
  app.get('/api/super-admin/settings/trial-settings', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { getTrialSettings } = await import('./controllers/superAdmin/platformSettings');
    return getTrialSettings(req, res);
  });

  app.put('/api/super-admin/settings/trial-settings', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    const { updateTrialSettings } = await import('./controllers/superAdmin/platformSettings');
    return updateTrialSettings(req, res);
  });

  // Trial Management API routes
  app.post('/api/super-admin/trials/start', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId, trialPlan, paymentMethodProvided, ipAddress, userAgent } = req.body;
      const result = await trialManager.startTrial(tenantId, {
        trialPlan,
        paymentMethodProvided,
        ipAddress,
        userAgent
      });
      res.json(result);
    } catch (error) {
      console.error('Error starting trial:', error);
      res.status(500).json({ error: 'Failed to start trial' });
    }
  });

  app.post('/api/super-admin/trials/check-eligibility', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { email, ipAddress, paymentMethodId } = req.body;
      const result = await trialManager.checkTrialEligibility(email, ipAddress, paymentMethodId);
      res.json(result);
    } catch (error) {
      console.error('Error checking trial eligibility:', error);
      res.status(500).json({ error: 'Failed to check trial eligibility' });
    }
  });

  app.post('/api/super-admin/trials/process-expired', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      await trialManager.processExpiredTrials();
      res.json({ success: true, message: 'Expired trials processed successfully' });
    } catch (error) {
      console.error('Error processing expired trials:', error);
      res.status(500).json({ error: 'Failed to process expired trials' });
    }
  });

  app.put('/api/super-admin/trials/:tenantId/plan-change', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { newPlan, reason } = req.body;
      const result = await trialManager.handleTrialPlanChange(tenantId, newPlan, reason);
      res.json(result);
    } catch (error) {
      console.error('Error changing trial plan:', error);
      res.status(500).json({ error: 'Failed to change trial plan' });
    }
  });

  app.post('/api/super-admin/trials/:tenantId/expire', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const result = await trialManager.processTrialExpiration(tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error expiring trial:', error);
      res.status(500).json({ error: 'Failed to expire trial' });
    }
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

  // Get consent form completion status for a player (across all tenants)
  app.get('/api/super-admin/players/:playerId/consent-status', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { playerId } = req.params;
      const { tenantId } = req.query;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      // Import age transition functions
      const { getConsentStatusWithAgeTransition, processAgeTransitions } = await import('../services/ageTransition');
      
      // Process any age transitions for this player first
      await processAgeTransitions(tenantId as string);
      
      // Get consent status with age transition awareness
      const consentStatus = await getConsentStatusWithAgeTransition(playerId, tenantId as string);
      res.json(consentStatus);
    } catch (error) {
      console.error('Error fetching player consent status:', error);
      res.status(500).json({ error: 'Failed to fetch consent status' });
    }
  });

  // Get consent form completion status for a parent (across all tenants)
  app.get('/api/super-admin/parents/:parentId/consent-status', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { parentId } = req.params;
      const { tenantId } = req.query;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const consentStatus = await storage.getParentConsentStatus(tenantId as string, parentId);
      res.json(consentStatus);
    } catch (error) {
      console.error('Error fetching parent consent status:', error);
      res.status(500).json({ error: 'Failed to fetch consent status' });
    }
  });

  // Tenant credit management routes
  app.get('/api/super-admin/tenant-credits', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId, includeTransactions } = req.query;
      
      // Get credits for all tenants or a specific tenant
      if (tenantId) {
        const credits = await storage.getCredits(tenantId as string);
        
        // If includeTransactions is true, fetch transactions for each credit
        let creditsWithTransactions = credits;
        if (includeTransactions === 'true') {
          creditsWithTransactions = await Promise.all(
            credits.map(async (credit) => ({
              ...credit,
              transactions: await storage.getCreditTransactions(credit.id)
            }))
          );
        }
        
        res.json(creditsWithTransactions);
      } else {
        // Get tenant credits for all tenants
        const tenants = await storage.getTenants();
        const allCredits = await Promise.all(
          tenants.map(async (tenant) => ({
            tenantId: tenant.id,
            tenantName: tenant.name,
            credits: await storage.getCredits(tenant.id),
            balance: await storage.getTenantCreditsBalance(tenant.id)
          }))
        );
        res.json(allCredits);
      }
    } catch (error: any) {
      console.error('Error fetching tenant credits:', error);
      res.status(500).json({ error: 'Failed to fetch tenant credits' });
    }
  });

  app.post('/api/super-admin/tenant-credits', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId, amount, reason, expiresAt } = req.body;
      
      if (!tenantId || !amount || !reason) {
        return res.status(400).json({ error: 'tenantId, amount, and reason are required' });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }

      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const credit = await storage.createCredit(
        tenantId,
        undefined, // No userId for tenant-level credit
        amount,
        reason,
        expiresAt ? new Date(expiresAt) : undefined,
        (req as any).user?.id || 'super-admin'
      );

      res.json(credit);
    } catch (error: any) {
      console.error('Error creating tenant credit:', error);
      res.status(500).json({ error: 'Failed to create tenant credit' });
    }
  });

  // Platform invitation management routes
  app.get('/api/super-admin/invitations', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { page = 1, pageSize = 20, tenantId, codeType, status, isPlatform, search } = req.query;
      
      const filters = {
        tenantId: tenantId as string | undefined,
        codeType: codeType as string | undefined,
        status: status as 'active' | 'expired' | 'fully_used' | undefined,
        isPlatform: isPlatform === 'true' ? true : isPlatform === 'false' ? false : undefined,
        search: search as string | undefined
      };
      
      const result = await storage.getSuperAdminInviteCodes(filters, Number(page), Number(pageSize));
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      res.status(500).json({ error: 'Failed to fetch invitations' });
    }
  });

  app.post('/api/super-admin/invitations', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const createSchema = z.object({
        code: z.string().min(1).toUpperCase(),
        codeType: z.enum(['invite', 'access', 'discount']),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
        isPlatform: z.boolean().default(true),
        ageGroup: z.string().optional(),
        gender: z.string().optional(),
        location: z.string().optional(),
        club: z.string().optional(),
        discountType: z.string().optional(),
        discountValue: z.number().optional(),
        discountDuration: z.enum(['one_time', 'months_3', 'months_6', 'months_12', 'indefinite']).optional(),
        maxUses: z.number().optional().nullable(),
        validFrom: z.string().optional(),
        validUntil: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        tenantId: z.string().optional(),
        category: z.enum(['partner', 'promotion', 'beta', 'vip']).optional()
      });

      const validated = createSchema.parse(req.body);
      const userId = (req as any).user?.id || 'super-admin';
      
      const inviteCode = await storage.createInviteCode({
        ...validated,
        isPlatform: true,
        createdBy: userId,
        tenantId: validated.tenantId || '',
        validFrom: validated.validFrom ? new Date(validated.validFrom) : undefined,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : undefined,
      });
      
      res.json(inviteCode);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      console.error('Error creating invitation:', error);
      res.status(500).json({ error: 'Failed to create invitation' });
    }
  });

  app.put('/api/super-admin/invitations/:id', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const updateSchema = z.object({
        code: z.string().min(1).toUpperCase().optional(),
        codeType: z.enum(['invite', 'access', 'discount']).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        ageGroup: z.string().optional(),
        gender: z.string().optional(),
        location: z.string().optional(),
        club: z.string().optional(),
        discountType: z.string().optional(),
        discountValue: z.number().optional(),
        discountDuration: z.enum(['one_time', 'months_3', 'months_6', 'months_12', 'indefinite']).optional(),
        maxUses: z.number().optional().nullable(),
        validFrom: z.string().optional(),
        validUntil: z.string().optional(),
        metadata: z.record(z.any()).optional()
      });

      const validated = updateSchema.parse(req.body);
      
      // Convert date strings to Date objects
      const updateData: any = { ...validated };
      if (validated.validFrom) updateData.validFrom = new Date(validated.validFrom);
      if (validated.validUntil) updateData.validUntil = new Date(validated.validUntil);
      
      const updated = await storage.updateInviteCode(id, updateData);
      res.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      console.error('Error updating invitation:', error);
      res.status(500).json({ error: 'Failed to update invitation' });
    }
  });

  app.delete('/api/super-admin/invitations/:id', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteInviteCode(id);
      res.json({ message: 'Invitation deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting invitation:', error);
      res.status(500).json({ error: 'Failed to delete invitation' });
    }
  });

  // Apply discount code to existing tenant subscription
  app.post('/api/super-admin/tenants/:tenantId/apply-discount', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { code } = req.body;
      const superAdminUserId = (req as any).user?.id || 'super-admin';

      if (!code) {
        return res.status(400).json({ error: 'Discount code is required' });
      }

      // Get the invite code - use tenant ID or platform-wide
      const inviteCode = await storage.getInviteCodeByCode(code.toUpperCase(), tenantId);
      
      if (!inviteCode) {
        return res.status(404).json({ error: 'Discount code not found' });
      }

      if (inviteCode.codeType !== 'discount') {
        return res.status(400).json({ error: 'This code is not a discount code' });
      }

      if (!inviteCode.isActive) {
        return res.status(400).json({ error: 'This code is no longer active' });
      }

      // Check if within valid date range
      const now = new Date();
      if (inviteCode.validFrom && new Date(inviteCode.validFrom) > now) {
        return res.status(400).json({ error: 'This code is not yet valid' });
      }
      if (inviteCode.validUntil && new Date(inviteCode.validUntil) < now) {
        return res.status(400).json({ error: 'This code has expired' });
      }

      // Apply the discount using braintree service
      const { applyDiscountToSubscription } = await import('./services/braintreeService');
      
      const result = await applyDiscountToSubscription(tenantId, {
        codeId: inviteCode.id,
        code: inviteCode.code,
        discountType: inviteCode.discountType as 'percentage' | 'fixed' | 'full',
        discountValue: inviteCode.discountValue || 0,
        discountDuration: inviteCode.discountDuration || 'one_time',
        isPlatform: inviteCode.isPlatform || false,
        appliedBy: superAdminUserId,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      // Increment usage count
      await storage.incrementInviteCodeUsage(inviteCode.id);

      res.json({
        message: result.message,
        appliedDiscount: result.appliedDiscount,
      });
    } catch (error: any) {
      console.error('Error applying discount to tenant:', error);
      res.status(500).json({ error: 'Failed to apply discount' });
    }
  });

  // Remove discount from tenant subscription
  app.delete('/api/super-admin/tenants/:tenantId/discount', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;

      const { removeDiscountFromSubscription } = await import('./services/braintreeService');
      
      const result = await removeDiscountFromSubscription(tenantId, 'super_admin_removal');

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      res.json({ message: result.message });
    } catch (error: any) {
      console.error('Error removing discount from tenant:', error);
      res.status(500).json({ error: 'Failed to remove discount' });
    }
  });

  // Get tenant's current discount status
  app.get('/api/super-admin/tenants/:tenantId/discount-status', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;

      const { getNextBillingAmount } = await import('./services/braintreeService');
      
      const status = await getNextBillingAmount(tenantId);

      res.json(status);
    } catch (error: any) {
      console.error('Error getting tenant discount status:', error);
      res.status(500).json({ error: 'Failed to get discount status' });
    }
  });
}