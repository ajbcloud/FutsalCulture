import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';

export async function list(req: Request, res: Response) {
  const { page, pageSize } = pageParams(req.query);
  const rows = [
    { id: 'r1', tenant: 'Futsal Culture', player: 'Alex Johnson', parent: 'Sarah Johnson', contact: 'sarah.johnson@email.com', session: 'Morning Training Session', sessionDate: '2025-07-29T09:00:00Z', registeredAt: '2025-07-27T06:30:00Z', status: 'confirmed', paymentStatus: 'paid', amount: 25 },
    { id: 'r2', tenant: 'Elite Footwork Academy', player: 'Emma Davis', parent: 'Michael Davis', contact: 'michael.davis@email.com', session: 'Elite Training', sessionDate: '2025-07-28T14:00:00Z', registeredAt: '2025-07-28T11:45:00Z', status: 'pending', paymentStatus: 'pending', amount: 30 },
  ];
  res.json(wrapRows(rows, page, pageSize, rows.length));
}