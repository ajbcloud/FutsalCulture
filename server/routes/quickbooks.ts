import { Router, Request, Response } from 'express';
import { db } from '../db';
import { storage } from '../storage';
import { 
  quickbooksConnections,
  quickbooksAccountMappings,
  quickbooksSyncPreferences,
  quickbooksSyncLogs,
  financialTransactions,
  insertQuickbooksAccountMappingSchema,
  insertQuickbooksSyncPreferencesSchema
} from '@shared/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { hasFeature, FEATURE_KEYS } from '@shared/feature-flags';
import { getTenantPlanLevel } from '../feature-middleware';
import * as quickbooksService from '../services/quickbooksService';

const router = Router();

async function requireAdminAuth(req: any, res: Response): Promise<{ userId: string; tenantId: string } | null> {
  const userId = req.user?.claims?.sub || req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return null;
  }

  const user = await storage.getUser(userId);
  if (!user) {
    res.status(401).json({ message: 'User not found' });
    return null;
  }

  if (!user.isAdmin && !user.isSuperAdmin) {
    res.status(403).json({ message: 'Admin access required' });
    return null;
  }

  if (!user.tenantId) {
    res.status(400).json({ message: 'Tenant ID required' });
    return null;
  }

  return { userId, tenantId: user.tenantId };
}

async function requireQuickBooksFeature(tenantId: string, res: Response): Promise<boolean> {
  const planLevel = await getTenantPlanLevel(tenantId);
  if (!planLevel) {
    res.status(400).json({ message: 'Unable to determine plan level' });
    return false;
  }

  if (!hasFeature(planLevel, FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS)) {
    res.status(403).json({ 
      message: 'QuickBooks integration is not available on your current plan',
      feature: FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS,
      planLevel,
      upgradeRequired: true
    });
    return false;
  }

  return true;
}

router.get('/auth-url', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    if (!quickbooksService.isQuickBooksEnabled()) {
      return res.status(503).json({ message: 'QuickBooks integration is not configured' });
    }

    const redirectUri = req.query.redirectUri as string | undefined;
    const authUrl = quickbooksService.getAuthorizationUrl(auth.tenantId, redirectUri);

    res.json({ authUrl });
  } catch (error: any) {
    console.error('Error getting QuickBooks auth URL:', error);
    res.status(500).json({ message: error.message || 'Failed to generate authorization URL' });
  }
});

router.get('/callback', async (req: any, res: Response) => {
  try {
    const { code, realmId, state, error: authError, error_description } = req.query;

    if (authError) {
      console.error('QuickBooks OAuth error:', authError, error_description);
      return res.redirect(`/admin/settings?tab=integrations&qb_error=${encodeURIComponent(error_description || authError)}`);
    }

    if (!code || !realmId || !state) {
      return res.redirect('/admin/settings?tab=integrations&qb_error=missing_params');
    }

    let tenantId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString('utf8'));
      tenantId = stateData.tenantId;
    } catch {
      return res.redirect('/admin/settings?tab=integrations&qb_error=invalid_state');
    }

    if (!tenantId) {
      return res.redirect('/admin/settings?tab=integrations&qb_error=missing_tenant');
    }

    const connection = await quickbooksService.handleCallback(
      tenantId,
      code as string,
      realmId as string
    );

    res.redirect(`/admin/settings?tab=integrations&qb_success=true&company=${encodeURIComponent(connection.companyName || '')}`);
  } catch (error: any) {
    console.error('Error handling QuickBooks callback:', error);
    res.redirect(`/admin/settings?tab=integrations&qb_error=${encodeURIComponent(error.message || 'callback_failed')}`);
  }
});

router.post('/disconnect', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    await quickbooksService.disconnect(auth.tenantId);

    res.json({ success: true, message: 'QuickBooks disconnected successfully' });
  } catch (error: any) {
    console.error('Error disconnecting QuickBooks:', error);
    res.status(500).json({ message: error.message || 'Failed to disconnect QuickBooks' });
  }
});

router.get('/connection', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    const connection = await quickbooksService.getConnection(auth.tenantId);

    if (connection.isConnected) {
      try {
        const companyInfo = await quickbooksService.fetchCompanyInfo(auth.tenantId);
        connection.companyName = companyInfo?.CompanyName;
      } catch (error) {
        console.warn('Failed to fetch company info:', error);
      }
    }

    res.json(connection);
  } catch (error: any) {
    console.error('Error getting QuickBooks connection:', error);
    res.status(500).json({ message: error.message || 'Failed to get connection status' });
  }
});

router.post('/test', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    const result = await quickbooksService.testConnection(auth.tenantId);

    res.json(result);
  } catch (error: any) {
    console.error('Error testing QuickBooks connection:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Connection test failed' 
    });
  }
});

router.get('/accounts', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    const accountTypes = req.query.types 
      ? (req.query.types as string).split(',') as ('Income' | 'Expense' | 'Other Current Liability' | 'Bank' | 'Accounts Receivable')[]
      : undefined;
    const activeOnly = req.query.activeOnly !== 'false';

    const accounts = await quickbooksService.fetchAccounts(auth.tenantId, {
      accountTypes,
      activeOnly
    });

    res.json({ accounts });
  } catch (error: any) {
    console.error('Error fetching QuickBooks accounts:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch accounts' });
  }
});

router.get('/mappings', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    const mappings = await db
      .select()
      .from(quickbooksAccountMappings)
      .where(eq(quickbooksAccountMappings.tenantId, auth.tenantId))
      .orderBy(quickbooksAccountMappings.transactionType);

    res.json({ mappings });
  } catch (error: any) {
    console.error('Error fetching account mappings:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch mappings' });
  }
});

const VALID_TRANSACTION_TYPES = [
  "session_payment", "subscription_payment", "refund", "credit_issued", 
  "credit_redeemed", "chargeback", "processing_fee", "adjustment"
] as const;

type TransactionType = typeof VALID_TRANSACTION_TYPES[number];

function isValidTransactionType(type: string): type is TransactionType {
  return VALID_TRANSACTION_TYPES.includes(type as TransactionType);
}

router.post('/mappings', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    const { mappings: bulkMappings } = req.body;

    if (bulkMappings && typeof bulkMappings === 'object') {
      const savedMappings = [];
      
      for (const [transactionType, qbAccountId] of Object.entries(bulkMappings)) {
        if (!qbAccountId || qbAccountId === '') continue;
        if (!isValidTransactionType(transactionType)) continue;
        
        const [existing] = await db
          .select()
          .from(quickbooksAccountMappings)
          .where(and(
            eq(quickbooksAccountMappings.tenantId, auth.tenantId),
            eq(quickbooksAccountMappings.transactionType, transactionType)
          ))
          .limit(1);

        let mapping;
        if (existing) {
          [mapping] = await db
            .update(quickbooksAccountMappings)
            .set({
              qbAccountId: qbAccountId as string,
              updatedAt: new Date()
            })
            .where(eq(quickbooksAccountMappings.id, existing.id))
            .returning();
        } else {
          [mapping] = await db
            .insert(quickbooksAccountMappings)
            .values({
              tenantId: auth.tenantId,
              transactionType: transactionType,
              qbAccountId: qbAccountId as string,
              qbAccountName: 'Account' 
            })
            .returning();
        }
        savedMappings.push(mapping);
      }

      return res.json({ mappings: savedMappings, count: savedMappings.length });
    }

    const validatedData = insertQuickbooksAccountMappingSchema.parse({
      ...req.body,
      tenantId: auth.tenantId
    });

    const [existing] = await db
      .select()
      .from(quickbooksAccountMappings)
      .where(and(
        eq(quickbooksAccountMappings.tenantId, auth.tenantId),
        eq(quickbooksAccountMappings.transactionType, validatedData.transactionType)
      ))
      .limit(1);

    let mapping;
    if (existing) {
      [mapping] = await db
        .update(quickbooksAccountMappings)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(quickbooksAccountMappings.id, existing.id))
        .returning();
    } else {
      [mapping] = await db
        .insert(quickbooksAccountMappings)
        .values(validatedData)
        .returning();
    }

    res.status(existing ? 200 : 201).json({ mapping });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error saving account mapping:', error);
    res.status(500).json({ message: error.message || 'Failed to save mapping' });
  }
});

router.delete('/mappings/:id', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    const { id } = req.params;

    const [deleted] = await db
      .delete(quickbooksAccountMappings)
      .where(and(
        eq(quickbooksAccountMappings.id, id),
        eq(quickbooksAccountMappings.tenantId, auth.tenantId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: 'Mapping not found' });
    }

    res.json({ success: true, message: 'Mapping deleted' });
  } catch (error: any) {
    console.error('Error deleting account mapping:', error);
    res.status(500).json({ message: error.message || 'Failed to delete mapping' });
  }
});

router.get('/preferences', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    let [preferences] = await db
      .select()
      .from(quickbooksSyncPreferences)
      .where(eq(quickbooksSyncPreferences.tenantId, auth.tenantId))
      .limit(1);

    if (!preferences) {
      [preferences] = await db
        .insert(quickbooksSyncPreferences)
        .values({
          tenantId: auth.tenantId
        })
        .returning();
    }

    res.json({ preferences });
  } catch (error: any) {
    console.error('Error fetching sync preferences:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch preferences' });
  }
});

router.put('/preferences', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    const updateData = insertQuickbooksSyncPreferencesSchema.partial().parse(req.body);

    let [preferences] = await db
      .select()
      .from(quickbooksSyncPreferences)
      .where(eq(quickbooksSyncPreferences.tenantId, auth.tenantId))
      .limit(1);

    if (preferences) {
      [preferences] = await db
        .update(quickbooksSyncPreferences)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(quickbooksSyncPreferences.id, preferences.id))
        .returning();
    } else {
      [preferences] = await db
        .insert(quickbooksSyncPreferences)
        .values({
          tenantId: auth.tenantId,
          ...updateData
        })
        .returning();
    }

    res.json({ preferences });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating sync preferences:', error);
    res.status(500).json({ message: error.message || 'Failed to update preferences' });
  }
});

router.post('/sync', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    const { syncType = 'manual', startDate, endDate } = req.body;

    const [syncLog] = await db
      .insert(quickbooksSyncLogs)
      .values({
        tenantId: auth.tenantId,
        syncType,
        status: 'started',
        startedAt: new Date(),
        triggeredBy: auth.userId
      })
      .returning();

    const transactions = await db
      .select()
      .from(financialTransactions)
      .where(and(
        eq(financialTransactions.tenantId, auth.tenantId),
        eq(financialTransactions.qbSyncStatus, 'pending'),
        startDate ? gte(financialTransactions.transactionDate, new Date(startDate)) : undefined,
        endDate ? lte(financialTransactions.transactionDate, new Date(endDate)) : undefined
      ));

    let processed = 0;
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const txn of transactions) {
      try {
        processed++;
        
        await db
          .update(financialTransactions)
          .set({
            qbSyncStatus: 'synced',
            qbSyncedAt: new Date()
          })
          .where(eq(financialTransactions.id, txn.id));
        
        created++;
      } catch (error: any) {
        failed++;
        errors.push(`Transaction ${txn.id}: ${error.message}`);
        
        await db
          .update(financialTransactions)
          .set({
            qbSyncStatus: 'failed',
            qbError: error.message
          })
          .where(eq(financialTransactions.id, txn.id));
      }
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - syncLog.startedAt.getTime();

    await db
      .update(quickbooksSyncLogs)
      .set({
        status: failed === transactions.length && transactions.length > 0 ? 'failed' : 'completed',
        recordsProcessed: processed,
        recordsCreated: created,
        recordsFailed: failed,
        completedAt,
        durationMs,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        errorDetails: errors.length > 0 ? { errors } : null
      })
      .where(eq(quickbooksSyncLogs.id, syncLog.id));

    res.json({
      success: true,
      syncId: syncLog.id,
      recordsProcessed: processed,
      recordsCreated: created,
      recordsFailed: failed,
      durationMs
    });
  } catch (error: any) {
    console.error('Error running QuickBooks sync:', error);
    res.status(500).json({ message: error.message || 'Sync failed' });
  }
});

router.get('/sync-logs', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await db
      .select()
      .from(quickbooksSyncLogs)
      .where(eq(quickbooksSyncLogs.tenantId, auth.tenantId))
      .orderBy(desc(quickbooksSyncLogs.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ logs });
  } catch (error: any) {
    console.error('Error fetching sync logs:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch sync logs' });
  }
});

router.get('/reports/transactions', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    const { startDate, endDate, type, syncStatus, limit: limitParam, offset: offsetParam } = req.query;
    
    const limit = Math.min(parseInt(limitParam as string) || 100, 500);
    const offset = parseInt(offsetParam as string) || 0;

    const conditions = [eq(financialTransactions.tenantId, auth.tenantId)];
    
    if (startDate) {
      conditions.push(gte(financialTransactions.transactionDate, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(financialTransactions.transactionDate, new Date(endDate as string)));
    }
    if (type) {
      conditions.push(eq(financialTransactions.transactionType, type as any));
    }
    if (syncStatus) {
      conditions.push(eq(financialTransactions.qbSyncStatus, syncStatus as string));
    }

    const transactions = await db
      .select()
      .from(financialTransactions)
      .where(and(...conditions))
      .orderBy(desc(financialTransactions.transactionDate))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: db.$count(financialTransactions) })
      .from(financialTransactions)
      .where(and(...conditions));

    res.json({
      transactions,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + transactions.length < count
      }
    });
  } catch (error: any) {
    console.error('Error fetching transactions report:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch transactions' });
  }
});

router.get('/reports/export', async (req: any, res: Response) => {
  try {
    const auth = await requireAdminAuth(req, res);
    if (!auth) return;

    if (!(await requireQuickBooksFeature(auth.tenantId, res))) return;

    const { startDate, endDate, format: exportFormat = 'csv' } = req.query;

    const conditions = [eq(financialTransactions.tenantId, auth.tenantId)];
    
    if (startDate) {
      conditions.push(gte(financialTransactions.transactionDate, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(financialTransactions.transactionDate, new Date(endDate as string)));
    }

    const transactions = await db
      .select()
      .from(financialTransactions)
      .where(and(...conditions))
      .orderBy(desc(financialTransactions.transactionDate));

    if (exportFormat === 'csv') {
      const csvRows = [
        ['Date', 'Type', 'Description', 'Amount', 'Currency', 'Source', 'QB Status', 'QB Transaction ID'].join(',')
      ];

      for (const txn of transactions) {
        csvRows.push([
          txn.transactionDate.toISOString().split('T')[0],
          txn.transactionType,
          `"${(txn.description || '').replace(/"/g, '""')}"`,
          (txn.amountCents / 100).toFixed(2),
          txn.currency || 'USD',
          txn.sourceType,
          txn.qbSyncStatus || 'pending',
          txn.qbTransactionId || ''
        ].join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvRows.join('\n'));
    }

    if (exportFormat === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.json"`);
      return res.json({
        exportDate: new Date().toISOString(),
        dateRange: { startDate, endDate },
        transactions: transactions.map(txn => ({
          date: txn.transactionDate.toISOString().split('T')[0],
          type: txn.transactionType,
          description: txn.description,
          amount: txn.amountCents / 100,
          currency: txn.currency,
          sourceType: txn.sourceType,
          sourceId: txn.sourceId,
          qbSyncStatus: txn.qbSyncStatus,
          qbTransactionId: txn.qbTransactionId
        }))
      });
    }

    res.status(400).json({ message: 'Unsupported export format. Use csv or json.' });
  } catch (error: any) {
    console.error('Error exporting report:', error);
    res.status(500).json({ message: error.message || 'Failed to export report' });
  }
});

export default router;
