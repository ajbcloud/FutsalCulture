import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';

export async function list(req: Request, res: Response) {
  const { page, pageSize } = pageParams(req.query);
  const rows = [
    { id: 'pl1', tenant: 'Futsal Culture', player: 'Harper Brind', ageGroup: 'U12', gender: 'Girls', parent: 'Atticus Brind', registeredAt: '2025-07-28T20:33:00Z', totalBookings: 0, portalAccess: 'disabled', bookingPermission: 'restricted', lastActivity: '2025-07-28T20:33:00Z' },
  ];
  console.log(`Super Admin: players list retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json(wrapRows(rows, page, pageSize, rows.length));
}