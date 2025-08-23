import { Request, Response, NextFunction } from 'express';
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // replace with your real auth once wired, this is a harmless stub for local work
  if (!(req as any).user) {
    (req as any).user = { id: 'dev', role: 'super_admin' };
  }
  next();
}
export default requireAuth;