import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';

/**
 * Platform Payments Controller
 * 
 * Database Mapping:
 * - Uses tenant_invoices or tenant_payments table for QIT platform revenue
 * - Fields: tenant_id, admin_name, plan_level, gateway, payment_id, method, status, created_at, amount
 * - Represents payments FROM tenants TO QIT for platform subscriptions
 */

export async function list(req: Request, res: Response) {
  const { page, pageSize } = pageParams(req.query);
  const { from, to, tenantId, status, method } = req.query;
  
  // Mock platform billing data - payments from tenants to QIT
  const allRows = [
    { 
      id: 'qit_pay_001', 
      tenant: 'Elite Footwork Academy', 
      adminName: 'William Lee',
      planLevel: 'Growth Plan',
      gateway: 'stripe', 
      paymentId: 'ch_1ABC', 
      method: 'card', 
      status: 'completed', 
      date: '2025-08-20T10:00:00Z' 
    },
    { 
      id: 'qit_pay_002', 
      tenant: 'SkoreHQ', 
      adminName: 'Atticus Brind',
      planLevel: 'Core Plan',
      gateway: 'braintree', 
      paymentId: 'txn_9XYZ', 
      method: 'ach', 
      status: 'completed', 
      date: '2025-08-19T15:30:00Z' 
    },
    { 
      id: 'qit_pay_003', 
      tenant: 'Metro Futsal', 
      adminName: 'Bob Wilson',
      planLevel: 'Elite Plan',
      gateway: 'stripe', 
      paymentId: 'pi_5555666677', 
      method: 'card', 
      status: 'failed', 
      date: '2025-08-18T09:15:00Z' 
    },
  ];
  
  // Apply filters
  let filteredRows = allRows;
  
  if (tenantId && tenantId !== 'all') {
    filteredRows = filteredRows.filter(row => 
      row.tenant.toLowerCase().includes(tenantId.toLowerCase())
    );
  }
  
  if (status && status !== 'all') {
    filteredRows = filteredRows.filter(row => row.status === status);
  }
  
  if (method && method !== 'all') {
    filteredRows = filteredRows.filter(row => row.method === method);
  }
  
  if (from) {
    const fromDate = new Date(decodeURIComponent(from as string));
    filteredRows = filteredRows.filter(row => new Date(row.date) >= fromDate);
  }
  
  if (to) {
    const toDate = new Date(decodeURIComponent(to as string));
    filteredRows = filteredRows.filter(row => new Date(row.date) <= toDate);
  }
  
  console.log(`Super Admin: platform payments retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json(wrapRows(filteredRows, page, pageSize, filteredRows.length));
}