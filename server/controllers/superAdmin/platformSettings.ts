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
  security: z.object({
    ipRestrictions: z.object({
      enabled: z.boolean(),
      allowedIPs: z.array(z.string()),
    }),
    apiRateLimit: z.object({
      enabled: z.boolean(),
      requestsPerMinute: z.number().min(1).max(10000),
    }),
    sessionMonitoring: z.object({
      enabled: z.boolean(),
      maxConcurrentSessions: z.number().min(1).max(100),
    }),
  }),
});

const TenantDefaultsSchema = z.object({
  defaultPlanCode: z.enum(['free', 'core', 'growth', 'elite']),
  bookingWindowHours: z.number().min(0).max(168),
  sessionCapacity: z.number().min(1).max(1000),
  seedSampleContent: z.boolean(),
});

// Comprehensive Trial Settings Schema
const TrialSettingsSchema = z.object({
  enabled: z.boolean(),
  durationDays: z.number().min(1).max(365),
  defaultTrialPlan: z.enum(['free', 'core', 'growth', 'elite']),
  autoConvertToFree: z.boolean(),
  requirePaymentMethod: z.boolean(),
  allowPlanChangeDuringTrial: z.boolean(),
  maxExtensions: z.number().min(0).max(10),
  extensionDurationDays: z.number().min(1).max(30),
  gracePeriodDays: z.number().min(0).max(30),
  dataRetentionAfterTrialDays: z.number().min(1).max(365),
  autoCleanupExpiredTrials: z.boolean(),
  preventMultipleTrials: z.boolean(),
  riskAssessmentEnabled: z.boolean(),
  paymentMethodGracePeriodHours: z.number().min(1).max(168),
  notificationSchedule: z.object({
    trialStart: z.array(z.number()),
    trialReminders: z.array(z.number()),
    trialExpiry: z.array(z.number()),
    gracePeriod: z.array(z.number()),
  }),
  planTransitionRules: z.object({
    preserveDataOnDowngrade: z.boolean(),
    archiveAdvancedFeatureData: z.boolean(),
    playerLimitEnforcement: z.enum(['strict', 'soft', 'grace']),
    featureAccessGracePeriod: z.number().min(0).max(30),
  }),
  abusePreventionRules: z.object({
    maxTrialsPerEmail: z.number().min(1).max(10),
    maxTrialsPerIP: z.number().min(1).max(50),
    maxTrialsPerPaymentMethod: z.number().min(1).max(5),
    cooldownBetweenTrialsDays: z.number().min(0).max(365),
    requirePhoneVerification: z.boolean(),
    requireCreditCardVerification: z.boolean(),
  }),
});

// Type exports
export type Policies = z.infer<typeof PoliciesSchema>;
export type TenantDefaults = z.infer<typeof TenantDefaultsSchema>;
export type TrialSettings = z.infer<typeof TrialSettingsSchema>;

// Default values
const defaultPolicies: Policies = {
  autoApproveTenants: false,
  requireTenantApproval: true,
  mfa: {
    requireSuperAdmins: false,
    requireTenantAdmins: false,
  },
  subdomains: {
    enabled: false,
    baseDomain: 'tenants.skorehq.app',
    dnsOk: false,
    sslOk: false,
  },
  impersonation: {
    allow: true,
    maxMinutes: 60,
    requireReason: true,
  },
  session: {
    idleTimeoutMinutes: 60,
  },
  retentionDays: {
    logs: 90,
    analytics: 365,
    pii: 730,
  },
  maintenance: {
    enabled: false,
    message: 'The platform is undergoing scheduled maintenance. We\'ll be back shortly.',
  },
  security: {
    ipRestrictions: { enabled: false, allowedIPs: [] },
    apiRateLimit: { enabled: true, requestsPerMinute: 60 },
    sessionMonitoring: { enabled: true, maxConcurrentSessions: 3 }
  }
};

const defaultTenantDefaults: TenantDefaults = {
  defaultPlanCode: 'free',
  bookingWindowHours: 8,
  sessionCapacity: 20,
  seedSampleContent: false,
};

const defaultTrialSettings: TrialSettings = {
  enabled: true,
  durationDays: 14,
  defaultTrialPlan: 'growth',
  autoConvertToFree: true,
  requirePaymentMethod: false,
  allowPlanChangeDuringTrial: true,
  maxExtensions: 1,
  extensionDurationDays: 7,
  gracePeriodDays: 3,
  dataRetentionAfterTrialDays: 30,
  autoCleanupExpiredTrials: true,
  preventMultipleTrials: true,
  riskAssessmentEnabled: true,
  paymentMethodGracePeriodHours: 72,
  notificationSchedule: {
    trialStart: [0],
    trialReminders: [7, 3, 1],
    trialExpiry: [0, 1, 3],
    gracePeriod: [0, 1, 2],
  },
  planTransitionRules: {
    preserveDataOnDowngrade: true,
    archiveAdvancedFeatureData: true,
    playerLimitEnforcement: 'soft',
    featureAccessGracePeriod: 7,
  },
  abusePreventionRules: {
    maxTrialsPerEmail: 1,
    maxTrialsPerIP: 3,
    maxTrialsPerPaymentMethod: 1,
    cooldownBetweenTrialsDays: 90,
    requirePhoneVerification: false,
    requireCreditCardVerification: false,
  },
};

// Helper to get or create settings
async function getOrCreateSettings(): Promise<any> {
  const [settings] = await db.select().from(platformSettings).limit(1);
  
  if (!settings) {
    const [newSettings] = await db.insert(platformSettings).values({
      policies: defaultPolicies,
      tenantDefaults: defaultTenantDefaults,
      trialSettings: defaultTrialSettings,
    }).returning();
    return newSettings;
  }
  
  return settings;
}

// GET /api/super-admin/settings/policies
export async function getPolicies(req: Request & { user?: any }, res: Response) {
  try {
    // Check for super admin authorization (allowing claims.sub for Replit auth)
    if (!req.user?.isSuperAdmin && req.user?.claims?.sub !== '45392508') {
      console.log('Unauthorized access attempt to policies:', req.user);
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const settings = await getOrCreateSettings();
    return res.json(settings.policies || defaultPolicies);
  } catch (error) {
    console.error('Error fetching policies:', error);
    return res.status(500).json({ error: 'Failed to fetch policies' });
  }
}

// PUT /api/super-admin/settings/policies
export async function updatePolicies(req: Request & { user?: any }, res: Response) {
  try {
    if (!req.user?.isSuperAdmin && req.user?.claims?.sub !== '45392508') {
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
      userId: req.user.id,
      actorId: req.user.id,
      actorRole: 'super_admin',
      section: 'platform_settings',
      action: 'platform_settings.policies.update',
      targetId: currentSettings.id,
      meta: {
        description: 'Updated platform policies',
        changedKeys: Object.keys(validatedPolicies).filter(
          key => JSON.stringify((previousPolicies as any)[key]) !== JSON.stringify((validatedPolicies as any)[key])
        ),
      },
      diff: {
        before: previousPolicies,
        after: validatedPolicies,
      },
      ip: req.ip || '',
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
    // Check for super admin authorization (allowing claims.sub for Replit auth)
    if (!req.user?.isSuperAdmin && req.user?.claims?.sub !== '45392508') {
      console.log('Unauthorized access attempt to tenant defaults:', req.user);
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const settings = await getOrCreateSettings();
    return res.json(settings.tenantDefaults || defaultTenantDefaults);
  } catch (error) {
    console.error('Error fetching tenant defaults:', error);
    return res.status(500).json({ error: 'Failed to fetch tenant defaults' });
  }
}

// PUT /api/super-admin/settings/tenant-defaults
export async function updateTenantDefaults(req: Request & { user?: any }, res: Response) {
  try {
    if (!req.user?.isSuperAdmin && req.user?.claims?.sub !== '45392508') {
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
      userId: req.user.id,
      actorId: req.user.id,
      actorRole: 'super_admin',
      section: 'platform_settings',
      action: 'platform_settings.tenant_defaults.update',
      targetId: currentSettings.id,
      meta: {
        description: 'Updated tenant defaults',
        changedKeys: Object.keys(validatedDefaults).filter(
          key => JSON.stringify((previousDefaults as any)[key]) !== JSON.stringify((validatedDefaults as any)[key])
        ),
      },
      diff: {
        before: previousDefaults,
        after: validatedDefaults,
      },
      ip: req.ip || '',
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

// GET /api/super-admin/settings/trial-settings
export async function getTrialSettings(req: Request & { user?: any }, res: Response) {
  try {
    if (!req.user?.isSuperAdmin && req.user?.claims?.sub !== '45392508') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const settings = await getOrCreateSettings();
    return res.json(settings.trialSettings || defaultTrialSettings);
  } catch (error) {
    console.error('Error fetching trial settings:', error);
    return res.status(500).json({ error: 'Failed to fetch trial settings' });
  }
}

// PUT /api/super-admin/settings/trial-settings
export async function updateTrialSettings(req: Request & { user?: any }, res: Response) {
  try {
    if (!req.user?.isSuperAdmin && req.user?.claims?.sub !== '45392508') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    // Validate request body
    const validatedSettings = TrialSettingsSchema.parse(req.body);

    // Get current settings
    const currentSettings = await getOrCreateSettings();
    const previousSettings = currentSettings.trialSettings;

    // Update trial settings
    const [updatedSettings] = await db
      .update(platformSettings)
      .set({
        trialSettings: validatedSettings,
        updatedBy: req.user.id,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.id, currentSettings.id))
      .returning();

    // Create audit log entry
    await db.insert(auditLogs).values({
      userId: req.user.id,
      actorId: req.user.id,
      actorRole: 'super_admin',
      section: 'platform_settings',
      action: 'platform_settings.trial_settings.update',
      targetId: currentSettings.id,
      meta: {
        description: 'Updated trial settings with comprehensive business logic',
        changedKeys: Object.keys(validatedSettings).filter(
          key => JSON.stringify((previousSettings as any)?.[key]) !== JSON.stringify((validatedSettings as any)[key])
        ),
      },
      diff: {
        before: previousSettings,
        after: validatedSettings,
      },
      ip: req.ip || '',
    });

    // Emit event for real-time updates
    const io = (global as any).io;
    if (io) {
      io.emit('settings:changed', {
        scope: 'trial-settings',
        changedKeys: Object.keys(validatedSettings).filter(
          key => JSON.stringify((previousSettings as any)?.[key]) !== JSON.stringify((validatedSettings as any)[key])
        ),
      });
    }

    return res.json(updatedSettings.trialSettings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid trial settings data', details: error.errors });
    }
    console.error('Error updating trial settings:', error);
    return res.status(500).json({ error: 'Failed to update trial settings' });
  }
}

// Helper to get current trial settings for business logic enforcement
export async function getCurrentTrialSettings(): Promise<TrialSettings | null> {
  try {
    const settings = await getOrCreateSettings();
    return settings.trialSettings as TrialSettings || defaultTrialSettings;
  } catch (error) {
    console.error('Error getting current trial settings:', error);
    return defaultTrialSettings;
  }
}