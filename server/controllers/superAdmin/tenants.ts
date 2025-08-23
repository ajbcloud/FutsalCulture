import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';

export async function list(req: Request, res: Response) {
  const { page, pageSize } = pageParams(req.query);
  const rows = [
    { id: 't1', organization: 'Elite Footwork Academy', subdomain: 'elite-footwork', contactEmail: 'admin@elitefootworkacademy.com', status: 'active', admins: 1, players: 33, sessions: 1, revenue: 30, created: '2025-07-28' },
    { id: 't2', organization: 'Futsal Culture', subdomain: 'futsal-culture', contactEmail: 'admin@futsal-culture.com', status: 'active', admins: 1, players: 37, sessions: 2, revenue: 20, created: '2025-07-28' },
  ];
  console.log(`Super Admin: tenants list retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json(wrapRows(rows, page, pageSize, rows.length));
}

export async function create(req: Request, res: Response) {
  console.log(`Super Admin: tenant created by ${(req as any).user?.id || 'unknown'}`);
  res.status(201).json({ id: 'newTenantId' });
}

export async function update(req: Request, res: Response) {
  console.log(`Super Admin: tenant ${req.params.id} updated by ${(req as any).user?.id || 'unknown'}`);
  res.json({ ok: true });
}