import { Request, Response } from 'express';
import { storage } from '../../storage';

export async function list(req: Request, res: Response) {
  try {
    const { tenantId, search, q, ageGroup, gender, portalAccess, dateFrom, dateTo, parentId, include } = req.query;
    
    // Use 'q' parameter if provided, otherwise fall back to 'search' for legacy support
    const searchQuery = (q as string) || (search as string);
    
    const filters = {
      tenantId: tenantId as string,
      search: searchQuery,
      ageGroup: ageGroup as string,
      gender: gender as string,
      portalAccess: portalAccess as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      parentId: parentId as string,
      include: include as string,
    };
    
    const players = await storage.getSuperAdminPlayers(filters);
    
    console.log(`Super Admin: ${players.length} players retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(players);
  } catch (error) {
    console.error('Error fetching super admin players:', error);
    res.status(500).json({ message: 'Failed to fetch players' });
  }
}