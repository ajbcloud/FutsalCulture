import { Request, Response } from 'express';
import { z } from 'zod';

const SettingsSchema = z.object({
  autoApproveTenants: z.boolean(),
  requireTenantApproval: z.boolean(),
  defaultBookingWindowHours: z.number().int().nonnegative(),
  maxTenantsPerAdmin: z.number().int().positive(),
  defaultSessionCapacity: z.number().int().positive(),
  maintenanceMode: z.boolean(),
});

export async function get(req: Request, res: Response) {
  console.log(`Super Admin: settings retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json({
    autoApproveTenants: true,
    requireTenantApproval: false,
    defaultBookingWindowHours: 0,
    maxTenantsPerAdmin: 10,
    defaultSessionCapacity: 16,
    maintenanceMode: false,
  });
}

export async function patch(req: Request, res: Response) {
  try {
    const data = SettingsSchema.parse(req.body);
    console.log(`Super Admin: settings updated by ${(req as any).user?.id || 'unknown'}`);
    // persist data to platform_settings
    res.json({ ok: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update settings' });
  }
}