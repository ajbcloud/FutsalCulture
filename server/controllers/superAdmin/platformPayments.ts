import { Request, Response } from 'express';
import { pageParams } from '../../lib/pagination';

export async function list(req: Request, res: Response) {
  const { page, pageSize, offset } = pageParams(req.query);
  // Replace with real queries. Mock for now
  const rows = [
    { id: 'inv_1001', tenant: 'Elite Footwork Academy', gateway: 'stripe', paymentId: 'ch_1ABC', admin: 'William Lee', plan: 'Pro', method: 'card', status: 'paid', date: '2025-07-28T15:10:00Z' },
    { id: 'inv_1002', tenant: 'Futsal Culture', gateway: 'braintree', paymentId: 'txn_9XYZ', admin: 'Atticus Brind', plan: 'Starter', method: 'ach', status: 'paid', date: '2025-07-28T16:15:00Z' }
  ];
  console.log(`Super Admin: platform payments list retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json({ rows, page, pageSize, totalRows: rows.length });
}