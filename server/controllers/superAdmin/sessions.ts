import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';
import { storage } from '../../storage';

export async function list(req: Request, res: Response) {
  try {
    const { page, pageSize } = pageParams(req.query);
    const { tenantId, ageGroup, gender, location, dateFrom, dateTo, status } = req.query;
    
    // Use the existing storage method to get sessions with real data
    const sessionsData = await storage.getSuperAdminSessions({
      tenantId: tenantId as string,
      ageGroup: ageGroup as string,
      gender: gender as string,
      location: location as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      status: status as string
    });
    
    // Transform data for response
    const rows = sessionsData.map(session => ({
      id: session.id,
      tenant: session.tenantName || 'Unknown Tenant',
      tenantId: session.tenantId,
      title: `Session at ${session.location}`,
      dateTime: session.dateTime?.toISOString() || new Date().toISOString(),
      location: session.location || 'TBD',
      ageGroup: Array.isArray(session.ageGroups) ? session.ageGroups.join(', ') : 'All Ages',
      gender: Array.isArray(session.genders) ? session.genders.join(', ') : 'Mixed',
      capacity: session.capacity || 0,
      signupsCount: session.signupsCount || 0,
      status: session.status || 'open'
    }));
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRows = rows.slice(startIndex, endIndex);
    
    console.log(`Super Admin: sessions list retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(wrapRows(paginatedRows, page, pageSize, rows.length));
  } catch (error) {
    console.error('Error fetching super admin sessions:', error);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
}