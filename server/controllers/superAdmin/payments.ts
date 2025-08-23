import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';

export async function list(req: Request, res: Response) {
  const { page, pageSize } = pageParams(req.query);
  const rows = [
    { id: 'pi_1', tenant: 'Futsal Culture', player: 'Alex Johnson', parent: 'Sarah Johnson', session: 'Morning Training', amount: 25, method: 'stripe', status: 'completed', created: '2025-07-28T06:00:00Z' },
    { id: 'pi_2', tenant: 'Elite Footwork Academy', player: 'Emma Davis', parent: 'Michael Davis', session: 'Elite Training', amount: 30, method: 'venmo', status: 'pending', created: '2025-07-28T11:45:00Z' },
  ];
  res.json(wrapRows(rows, page, pageSize, rows.length));
}