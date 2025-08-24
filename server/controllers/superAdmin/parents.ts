import { Request, Response } from 'express';
import { storage } from '../../storage';

export async function list(req: Request, res: Response) {
  try {
    const { tenantId, search, status, dateFrom, dateTo } = req.query;
    
    const filters = {
      tenantId: tenantId as string,
      search: search as string,
      status: status as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    };
    
    const parents = await storage.getSuperAdminParents(filters);
    
    console.log(`Super Admin: ${parents.length} parents retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(parents);
  } catch (error) {
    console.error('Error fetching super admin parents:', error);
    res.status(500).json({ message: 'Failed to fetch parents' });
  }
}