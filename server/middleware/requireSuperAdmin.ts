import { Request, Response, NextFunction } from 'express';
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req as any).user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}
export default requireSuperAdmin;