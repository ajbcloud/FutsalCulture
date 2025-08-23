import { Request, Response } from 'express';
export async function get(req: Request, res: Response) {
  res.json({
    autoApproveTenants: false,
    enableMfaByDefault: false,
    enableTenantSubdomains: false,
    requireTenantApproval: true,
    defaultBookingWindowHours: 0,
    maxTenantsPerAdmin: 10,
    defaultSessionCapacity: 16,
    maintenanceMode: false,
  });
}
export async function patch(req: Request, res: Response) {
  res.json({ ok: true });
}