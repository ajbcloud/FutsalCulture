import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';

export async function list(req: Request, res: Response) {
  const { page, pageSize } = pageParams(req.query);
  const rows = [
    { id: '1', tenant: 'Futsal Culture', title: 'Morning Training Session', dateTime: '2025-07-28T09:00:00Z', location: 'Court A', ageGroup: 'U12', gender: 'Mixed', capacity: 16, price: 25, status: 'open' },
    { id: '2', tenant: 'Elite Footwork Academy', title: 'Elite Training', dateTime: '2025-07-28T18:00:00Z', location: 'Main Court', ageGroup: 'U16', gender: 'Boys', capacity: 12, price: 30, status: 'full' },
  ];
  console.log(`Super Admin: sessions list retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json(wrapRows(rows, page, pageSize, rows.length));
}