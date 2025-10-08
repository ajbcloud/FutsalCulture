import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';
import { storage } from '../../storage';

export async function list(req: Request, res: Response) {
  try {
    const { page, pageSize } = pageParams(req.query);
    const { tenantId, status, dateFrom, dateTo, amountMin, amountMax } = req.query;
    
    // Use the existing storage method to get payments with real data
    const paymentsData = await storage.getSuperAdminPayments({
      tenantId: tenantId as string,
      status: status as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      amountMin: amountMin ? Number(amountMin) : undefined,
      amountMax: amountMax ? Number(amountMax) : undefined
    });
    
    // Transform data for response
    const rows = paymentsData.map(payment => ({
      id: payment.id,
      tenant: payment.tenantName || 'Unknown Tenant',
      tenantId: payment.tenantId,
      player: payment.playerName || 'Unknown Player',
      signupId: payment.signupId,
      sessionDate: payment.sessionDate?.toISOString() || null,
      amount: payment.amount / 100, // Convert cents to dollars
      status: payment.status || 'pending',
      created: payment.paidAt?.toISOString() || new Date().toISOString(),
      adminNotes: payment.adminNotes || null
    }));
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRows = rows.slice(startIndex, endIndex);
    
    console.log(`Super Admin: payments list retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(wrapRows(paginatedRows, page, pageSize, rows.length));
  } catch (error) {
    console.error('Error fetching super admin payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
}