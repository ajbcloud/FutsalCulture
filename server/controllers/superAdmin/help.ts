import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';

export async function list(req: Request, res: Response) {
  const { page, pageSize } = pageParams(req.query);
  const rows = [
    { id: 'h1', tenant: 'Futsal Culture', subject: 'Question from player portal', submitter: 'player', category: 'technical', priority: 'low', status: 'open', replies: 0, submitted: '2025-07-28T21:33:00Z', resolved: null },
  ];
  console.log(`Super Admin: help requests list retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json(wrapRows(rows, page, pageSize, rows.length));
}

export async function update(req: Request, res: Response) {
  console.log(`Super Admin: help request ${req.params.id} updated by ${(req as any).user?.id || 'unknown'}`);
  res.json({ ok: true });
}