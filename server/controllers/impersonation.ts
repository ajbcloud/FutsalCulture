import { Request, Response } from 'express';
import { consumeImpersonationToken, endImpersonationSession } from '../middleware/impersonation';

export async function consume(req: Request, res: Response) {
  return consumeImpersonationToken(req, res, () => {});
}

export async function end(req: Request, res: Response) {
  return endImpersonationSession(req, res);
}

export function status(req: Request, res: Response) {
  const impersonation = (req as any).impersonation;
  
  if (impersonation?.isImpersonated) {
    res.json({
      isImpersonated: true,
      superAdminId: impersonation.superAdminId,
      tenantId: impersonation.tenantId,
      startedAt: impersonation.startedAt
    });
  } else {
    res.json({
      isImpersonated: false
    });
  }
}