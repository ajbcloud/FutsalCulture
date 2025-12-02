import { Router, Request, Response } from 'express';
import {
  getSmsCreditsBalance,
  checkSmsCredits,
  addSmsCredits,
  purchaseSmsCredits,
  getSmsTransactionHistory,
  getSmsPackages,
  getSmsPackage,
  getAllSmsPackages,
  createSmsPackage,
  updateSmsPackage,
  deleteSmsPackage,
  getSmsUsageStats,
  adjustSmsCredits,
  updateAutoRechargeSettings,
} from '../utils/sms-credits';
import { isSmsConfigured } from '../smsService';
import { storage } from '../storage';

const router = Router();

const requireAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user || (user.role !== 'tenant_admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    (req as any).currentUser = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

router.get('/sms-credits/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).currentUser;
    if (!user?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const balanceInfo = await getSmsCreditsBalance(user.tenantId);
    const isConfigured = isSmsConfigured();

    res.json({
      ...balanceInfo,
      isConfigured,
      provider: 'telnyx',
    });
  } catch (error: any) {
    console.error('Error fetching SMS credits status:', error);
    res.status(500).json({ error: 'Failed to fetch SMS credits status' });
  }
});

router.get('/sms-credits/balance', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).currentUser;
    if (!user?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const balanceInfo = await getSmsCreditsBalance(user.tenantId);

    res.json({
      balance: balanceInfo.balance,
      isLow: balanceInfo.isLow,
      lowThreshold: balanceInfo.lowThreshold,
      autoRechargeEnabled: balanceInfo.autoRechargeEnabled,
      autoRechargeAmount: balanceInfo.autoRechargeAmount,
      lastPurchasedAt: balanceInfo.lastPurchasedAt,
    });
  } catch (error: any) {
    console.error('Error fetching SMS credits balance:', error);
    res.status(500).json({ error: 'Failed to fetch SMS credits balance' });
  }
});

router.get('/sms-credits/check', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).currentUser;
    if (!user?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const requiredCredits = parseInt(req.query.count as string) || 1;
    const check = await checkSmsCredits(user.tenantId, requiredCredits);

    res.json(check);
  } catch (error: any) {
    console.error('Error checking SMS credits:', error);
    res.status(500).json({ error: 'Failed to check SMS credits' });
  }
});

router.get('/sms-credits/packages', async (req: Request, res: Response) => {
  try {
    const packages = await getSmsPackages();
    res.json(packages);
  } catch (error: any) {
    console.error('Error fetching SMS packages:', error);
    res.status(500).json({ error: 'Failed to fetch SMS packages' });
  }
});

router.post('/sms-credits/purchase', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).currentUser;
    if (!user?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { packageId, paymentReferenceId, paymentMethod } = req.body;

    if (!packageId) {
      return res.status(400).json({ error: 'Package ID required' });
    }

    const result = await purchaseSmsCredits(user.tenantId, packageId, {
      paymentReferenceId,
      paymentMethod,
      createdBy: user.id,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      newBalance: result.newBalance,
      creditsAdded: result.creditsAdded,
      transactionId: result.transactionId,
    });
  } catch (error: any) {
    console.error('Error purchasing SMS credits:', error);
    res.status(500).json({ error: 'Failed to purchase SMS credits' });
  }
});

router.get('/sms-credits/transactions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).currentUser;
    if (!user?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as any;

    const result = await getSmsTransactionHistory(user.tenantId, {
      limit,
      offset,
      type,
    });

    res.json({
      transactions: result.transactions,
      total: result.total,
      hasMore: offset + limit < result.total,
    });
  } catch (error: any) {
    console.error('Error fetching SMS transactions:', error);
    res.status(500).json({ error: 'Failed to fetch SMS transactions' });
  }
});

router.get('/sms-credits/usage-stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).currentUser;
    if (!user?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const stats = await getSmsUsageStats(user.tenantId, { days });

    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching SMS usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch SMS usage stats' });
  }
});

router.post('/sms-credits/adjust', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).currentUser;
    if (!user?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { adjustment, reason } = req.body;

    if (typeof adjustment !== 'number') {
      return res.status(400).json({ error: 'Adjustment amount required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason required for adjustment' });
    }

    const result = await adjustSmsCredits(user.tenantId, adjustment, {
      reason,
      createdBy: user.id,
    });

    res.json({
      success: result.success,
      newBalance: result.newBalance,
    });
  } catch (error: any) {
    console.error('Error adjusting SMS credits:', error);
    res.status(500).json({ error: 'Failed to adjust SMS credits' });
  }
});

router.patch('/sms-credits/auto-recharge', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).currentUser;
    if (!user?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { enabled, rechargeAmount, lowThreshold } = req.body;

    const result = await updateAutoRechargeSettings(user.tenantId, {
      enabled: !!enabled,
      rechargeAmount,
      lowThreshold,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating auto-recharge settings:', error);
    res.status(500).json({ error: 'Failed to update auto-recharge settings' });
  }
});

router.get('/sms-credits/packages/all', requireAdmin, async (req: Request, res: Response) => {
  try {
    const packages = await getAllSmsPackages();
    res.json(packages);
  } catch (error: any) {
    console.error('Error fetching all SMS packages:', error);
    res.status(500).json({ error: 'Failed to fetch SMS packages' });
  }
});

router.post('/sms-credits/packages', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, credits, priceInCents, bonusCredits, isActive, sortOrder, description } = req.body;

    if (!name || !credits || typeof priceInCents !== 'number') {
      return res.status(400).json({ error: 'Name, credits, and price are required' });
    }

    const pkg = await createSmsPackage({
      name,
      credits,
      priceInCents,
      bonusCredits: bonusCredits || 0,
      isActive: isActive !== false,
      sortOrder: sortOrder || 0,
      description,
    });

    res.json(pkg);
  } catch (error: any) {
    console.error('Error creating SMS package:', error);
    res.status(500).json({ error: 'Failed to create SMS package' });
  }
});

router.patch('/sms-credits/packages/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const pkg = await updateSmsPackage(id, updates);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json(pkg);
  } catch (error: any) {
    console.error('Error updating SMS package:', error);
    res.status(500).json({ error: 'Failed to update SMS package' });
  }
});

router.delete('/sms-credits/packages/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await deleteSmsPackage(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting SMS package:', error);
    res.status(500).json({ error: 'Failed to delete SMS package' });
  }
});

export default router;
