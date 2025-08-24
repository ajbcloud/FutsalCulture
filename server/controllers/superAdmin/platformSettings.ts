import { Request, Response } from 'express';
import { db } from '../../db';
import { platformSettings, auditLogs } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Zod schemas for validation
const PoliciesSchema = z.object({
  autoApproveTenants: z.boolean(),
  requireTenantApproval: z.boolean(),
  mfa: z.object({
    requireSuperAdmins: z.boolean(),
    requireTenantAdmins: z.boolean(),
  }),
  subdomains: z.object({
    enabled: z.boolean(),
    baseDomain: z.string(),
    dnsOk: z.boolean().optional(),
    sslOk: z.boolean().optional(),
  }),
  impersonation: z.object({
    allow: z.boolean(),
    maxMinutes: z.number().min(1).max(480),
    requireReason: z.boolean(),
  }),
  session: z.object({
    idleTimeoutMinutes: z.number().min(5).max(1440),
  }),
  retentionDays: z.object({
    logs: z.number().min(1).max(3650),
    analytics: z.number().min(1).max(3650),
    pii: z.number().min(1).max(3650),
  }),
  maintenance: z.object({
    enabled: z.boolean(),
    message: z.string(),
  }),
});

const TenantDefaultsSchema = z.object({
  defaultPlanCode: z.enum(['free', 'core', 'growth', 'elite']),
  bookingWindowHours: z.number().min(0).max(168),
  sessionCapacity: z.number().min(1).max(1000),
  seedSampleContent: z.boolean(),
});

// Type exports
export type Policies = z.infer<typeof PoliciesSchema>;
export type TenantDefaults = z.infer<typeof TenantDefaultsSchema>;

// Helper to get or create settings
async function getOrCreateSettings(): Promise<any> {
  const [settings] = await db.select().from(platformSettings).limit(1);
  
  if (!settings) {
    const [newSettings] = await db.insert(platformSettings).values({}).returning();
    return newSettings;
  }
  
  return settings;
}

// GET /api/super-admin/settings/policies
export async function getPolicies(req: Request & { user?: any }, res: Response) {
  try {
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const settings = await getOrCreateSettings();
    return res.json(settings.policies);
  } catch (error) {
    console.error('Error fetching policies:', error);
    return res.status(500).json({ error: 'Failed to fetch policies' });
  }
}

// PUT /api/super-admin/settings/policies
export async function updatePolicies(req: Request & { user?: any }, res: Response) {
  try {
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    // Validate request body
    const validatedPolicies = PoliciesSchema.parse(req.body);

    // Get current settings
    const currentSettings = await getOrCreateSettings();
    const previousPolicies = currentSettings.policies;

    // Update policies
    const [updatedSettings] = await db
      .update(platformSettings)
      .set({
        policies: validatedPolicies,
        updatedBy: req.user.id,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.id, currentSettings.id))
      .returning();

    // Create audit log entry
    await db.insert(auditLogs).values({
      actorId: req.user.id,
      actorRole: 'super_admin',
      section: 'platform_settings',
      action: 'platform_settings.policies.update',
      description: 'Updated platform policies',
      oldValue: previousPolicies,
      newValue: validatedPolicies,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      metadata: {
        resourceId: currentSettings.id,
        changedKeys: Object.keys(validatedPolicies).filter(
          key => JSON.stringify((previousPolicies as any)[key]) !== JSON.stringify((validatedPolicies as any)[key])
        ),
      },
    });

    // Emit event for real-time updates
    const io = (global as any).io;
    if (io) {
      io.emit('settings:changed', {
        scope: 'policies',
        changedKeys: Object.keys(validatedPolicies).filter(
          key => JSON.stringify((previousPolicies as any)[key]) !== JSON.stringify((validatedPolicies as any)[key])
        ),
      });
    }

    return res.json(updatedSettings.policies);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid policies data', details: error.errors });
    }
    console.error('Error updating policies:', error);
    return res.status(500).json({ error: 'Failed to update policies' });
  }
}

// GET /api/super-admin/settings/tenant-defaults
export async function getTenantDefaults(req: Request & { user?: any }, res: Response) {
  try {
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const settings = await getOrCreateSettings();
    return res.json(settings.tenantDefaults);
  } catch (error) {
    console.error('Error fetching tenant defaults:', error);
    return res.status(500).json({ error: 'Failed to fetch tenant defaults' });
  }
}

// PUT /api/super-admin/settings/tenant-defaults
export async function updateTenantDefaults(req: Request & { user?: any }, res: Response) {
  try {
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    // Validate request body
    const validatedDefaults = TenantDefaultsSchema.parse(req.body);

    // Get current settings
    const currentSettings = await getOrCreateSettings();
    const previousDefaults = currentSettings.tenantDefaults;

    // Update tenant defaults
    const [updatedSettings] = await db
      .update(platformSettings)
      .set({
        tenantDefaults: validatedDefaults,
        updatedBy: req.user.id,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.id, currentSettings.id))
      .returning();

    // Create audit log entry
    await db.insert(auditLogs).values({
      actorId: req.user.id,
      actorRole: 'super_admin',
      section: 'platform_settings',
      action: 'platform_settings.tenant_defaults.update',
      description: 'Updated tenant defaults',
      oldValue: previousDefaults,
      newValue: validatedDefaults,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      metadata: {
        resourceId: currentSettings.id,
        changedKeys: Object.keys(validatedDefaults).filter(
          key => JSON.stringify((previousDefaults as any)[key]) !== JSON.stringify((validatedDefaults as any)[key])
        ),
      },
    });

    // Emit event for real-time updates
    const io = (global as any).io;
    if (io) {
      io.emit('settings:changed', {
        scope: 'tenant-defaults',
        changedKeys: Object.keys(validatedDefaults).filter(
          key => JSON.stringify((previousDefaults as any)[key]) !== JSON.stringify((validatedDefaults as any)[key])
        ),
      });
    }

    return res.json(updatedSettings.tenantDefaults);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid tenant defaults data', details: error.errors });
    }
    console.error('Error updating tenant defaults:', error);
    return res.status(500).json({ error: 'Failed to update tenant defaults' });
  }
}

// Helper to get current policies for middleware enforcement
export async function getCurrentPolicies(): Promise<Policies | null> {
  try {
    const settings = await getOrCreateSettings();
    return settings.policies as Policies;
  } catch (error) {
    console.error('Error getting current policies:', error);
    return null;
  }
}