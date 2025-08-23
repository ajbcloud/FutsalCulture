import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.IMPERSONATION_SECRET || 'dev-secret-change-me';

export async function start(req: Request, res: Response) {
  const { tenantId } = req.body as { tenantId: string };
  if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
  
  const token = jwt.sign(
    { sub: (req as any).user.id, role: 'tenant_admin', tenantId, type: 'impersonation' },
    SECRET,
    { expiresIn: '5m' }
  );
  
  // return a url the client can open in a new tab
  const subdomain = req.body.subdomain || 'tenant-subdomain'; // replace by fetching tenant
  const url = `https://${subdomain}.your-domain.com/impersonate?token=${encodeURIComponent(token)}`;
  
  console.log(`Super Admin: impersonation started for tenant ${tenantId} by ${(req as any).user?.id || 'unknown'}`);
  res.json({ url });
}