import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';

export async function list(req: Request, res: Response) {
  const { page, pageSize } = pageParams(req.query);
  const rows = [
    { id: 'p1', tenant: 'Elite Footwork Academy', name: 'William Lee', email: 'parent20@elitefootworkacademy.com', phone: '+12698523273', players: 0, totalBookings: 0, totalSpent: 0, lastActivity: '2025-07-28T14:33:00Z', status: 'active' },
  ];
  console.log(`Super Admin: parents list retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json(wrapRows(rows, page, pageSize, rows.length));
}