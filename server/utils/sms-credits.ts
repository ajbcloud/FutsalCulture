import { db } from '../db';
import { smsCreditTransactions, smsCreditPackages, tenants } from '@shared/schema';
import { eq, desc, and, sql, gt, gte } from 'drizzle-orm';

export interface SmsCreditBalance {
  balance: number;
  lowThreshold: number;
  isLow: boolean;
  autoRechargeEnabled: boolean;
  autoRechargeAmount: number | null;
  lastPurchasedAt: Date | null;
}

export interface SmsCreditTransaction {
  id: string;
  tenantId: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment' | 'expiration';
  amount: number;
  balanceAfter: number;
  description: string | null;
  referenceId: string | null;
  referenceType: string | null;
  metadata: Record<string, any>;
  createdBy: string | null;
  createdAt: Date;
}

export interface SmsCreditPackage {
  id: string;
  name: string;
  credits: number;
  priceInCents: number;
  bonusCredits: number;
  isActive: boolean;
  sortOrder: number;
  description: string | null;
}

export interface PurchaseCreditsResult {
  success: boolean;
  newBalance: number;
  creditsAdded: number;
  transactionId: string;
  error?: string;
}

export interface DeductCreditsResult {
  success: boolean;
  newBalance: number;
  creditsDeducted: number;
  transactionId?: string;
  insufficientCredits?: boolean;
  error?: string;
}

export async function getSmsCreditsBalance(tenantId: string): Promise<SmsCreditBalance> {
  const tenant = await db
    .select({
      balance: tenants.smsCreditsBalance,
      lowThreshold: tenants.smsCreditsLowThreshold,
      autoRechargeEnabled: tenants.smsCreditsAutoRecharge,
      autoRechargeAmount: tenants.smsCreditsAutoRechargeAmount,
      lastPurchasedAt: tenants.smsCreditsLastPurchasedAt,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant.length) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  const t = tenant[0];
  const balance = t.balance ?? 0;
  const lowThreshold = t.lowThreshold ?? 50;

  return {
    balance,
    lowThreshold,
    isLow: balance <= lowThreshold,
    autoRechargeEnabled: t.autoRechargeEnabled ?? false,
    autoRechargeAmount: t.autoRechargeAmount,
    lastPurchasedAt: t.lastPurchasedAt,
  };
}

export async function checkSmsCredits(tenantId: string, requiredCredits: number = 1): Promise<{
  hasCredits: boolean;
  currentBalance: number;
  requiredCredits: number;
  shortfall: number;
}> {
  const balanceInfo = await getSmsCreditsBalance(tenantId);
  const hasCredits = balanceInfo.balance >= requiredCredits;
  
  return {
    hasCredits,
    currentBalance: balanceInfo.balance,
    requiredCredits,
    shortfall: hasCredits ? 0 : requiredCredits - balanceInfo.balance,
  };
}

export async function deductSmsCredits(
  tenantId: string,
  creditsToDeduct: number,
  options: {
    description?: string;
    referenceId?: string;
    referenceType?: string;
    metadata?: Record<string, any>;
    createdBy?: string;
  } = {}
): Promise<DeductCreditsResult> {
  try {
    return await db.transaction(async (tx) => {
      const [currentTenant] = await tx
        .select({ balance: tenants.smsCreditsBalance })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .for('update')
        .limit(1);

      if (!currentTenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const currentBalance = currentTenant.balance ?? 0;

      if (currentBalance < creditsToDeduct) {
        return {
          success: false,
          newBalance: currentBalance,
          creditsDeducted: 0,
          insufficientCredits: true,
          error: `Insufficient SMS credits. Required: ${creditsToDeduct}, Available: ${currentBalance}`,
        };
      }

      const newBalance = currentBalance - creditsToDeduct;

      const updateResult = await tx
        .update(tenants)
        .set({ smsCreditsBalance: newBalance })
        .where(and(
          eq(tenants.id, tenantId),
          gte(tenants.smsCreditsBalance, creditsToDeduct)
        ))
        .returning({ balance: tenants.smsCreditsBalance });

      if (!updateResult.length) {
        return {
          success: false,
          newBalance: currentBalance,
          creditsDeducted: 0,
          insufficientCredits: true,
          error: 'Concurrent credit deduction detected - insufficient credits',
        };
      }

      const [transaction] = await tx
        .insert(smsCreditTransactions)
        .values({
          tenantId,
          type: 'usage',
          amount: -creditsToDeduct,
          balanceAfter: newBalance,
          description: options.description || 'SMS sent',
          referenceId: options.referenceId || null,
          referenceType: options.referenceType || null,
          metadata: options.metadata || {},
          createdBy: options.createdBy || null,
        })
        .returning();

      console.log(`📱 Deducted ${creditsToDeduct} SMS credit(s) from tenant ${tenantId}. New balance: ${newBalance}`);

      return {
        success: true,
        newBalance,
        creditsDeducted: creditsToDeduct,
        transactionId: transaction.id,
      };
    });
  } catch (error: any) {
    console.error('Failed to deduct SMS credits:', error);
    const currentBalance = await getSmsCreditsBalance(tenantId).catch(() => ({ balance: 0 }));
    return {
      success: false,
      newBalance: currentBalance.balance,
      creditsDeducted: 0,
      error: error.message || 'Failed to deduct credits',
    };
  }
}

export async function addSmsCredits(
  tenantId: string,
  creditsToAdd: number,
  options: {
    type?: 'purchase' | 'bonus' | 'refund' | 'adjustment';
    description?: string;
    referenceId?: string;
    referenceType?: string;
    metadata?: Record<string, any>;
    createdBy?: string;
  } = {}
): Promise<PurchaseCreditsResult> {
  try {
    return await db.transaction(async (tx) => {
      const [currentTenant] = await tx
        .select({ balance: tenants.smsCreditsBalance })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .for('update')
        .limit(1);

      if (!currentTenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const currentBalance = currentTenant.balance ?? 0;
      const newBalance = currentBalance + creditsToAdd;

      await tx
        .update(tenants)
        .set({
          smsCreditsBalance: newBalance,
          smsCreditsLastPurchasedAt: options.type === 'purchase' ? new Date() : undefined,
        })
        .where(eq(tenants.id, tenantId));

      const [transaction] = await tx
        .insert(smsCreditTransactions)
        .values({
          tenantId,
          type: options.type || 'purchase',
          amount: creditsToAdd,
          balanceAfter: newBalance,
          description: options.description || `Added ${creditsToAdd} SMS credits`,
          referenceId: options.referenceId || null,
          referenceType: options.referenceType || null,
          metadata: options.metadata || {},
          createdBy: options.createdBy || null,
        })
        .returning();

      console.log(`✅ Added ${creditsToAdd} SMS credit(s) to tenant ${tenantId}. New balance: ${newBalance}`);

      return {
        success: true,
        newBalance,
        creditsAdded: creditsToAdd,
        transactionId: transaction.id,
      };
    });
  } catch (error: any) {
    console.error('Failed to add SMS credits:', error);
    return {
      success: false,
      newBalance: 0,
      creditsAdded: 0,
      transactionId: '',
      error: error.message || 'Failed to add credits',
    };
  }
}

export async function purchaseSmsCredits(
  tenantId: string,
  packageId: string,
  options: {
    paymentReferenceId?: string;
    paymentMethod?: string;
    createdBy?: string;
  } = {}
): Promise<PurchaseCreditsResult> {
  const pkg = await getSmsPackage(packageId);
  
  if (!pkg) {
    return {
      success: false,
      newBalance: 0,
      creditsAdded: 0,
      transactionId: '',
      error: 'SMS credit package not found',
    };
  }

  if (!pkg.isActive) {
    return {
      success: false,
      newBalance: 0,
      creditsAdded: 0,
      transactionId: '',
      error: 'SMS credit package is not available',
    };
  }

  const totalCredits = pkg.credits + (pkg.bonusCredits || 0);

  return addSmsCredits(tenantId, totalCredits, {
    type: 'purchase',
    description: `Purchased ${pkg.name} (${pkg.credits} credits + ${pkg.bonusCredits || 0} bonus)`,
    referenceId: options.paymentReferenceId,
    referenceType: 'payment',
    metadata: {
      packageId: pkg.id,
      packageName: pkg.name,
      baseCredits: pkg.credits,
      bonusCredits: pkg.bonusCredits || 0,
      priceInCents: pkg.priceInCents,
      paymentMethod: options.paymentMethod,
    },
    createdBy: options.createdBy,
  });
}

export async function getSmsTransactionHistory(
  tenantId: string,
  options: {
    limit?: number;
    offset?: number;
    type?: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment' | 'expiration';
  } = {}
): Promise<{ transactions: SmsCreditTransaction[]; total: number }> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const whereConditions = [eq(smsCreditTransactions.tenantId, tenantId)];
  
  if (options.type) {
    whereConditions.push(eq(smsCreditTransactions.type, options.type));
  }

  const [transactions, countResult] = await Promise.all([
    db
      .select()
      .from(smsCreditTransactions)
      .where(and(...whereConditions))
      .orderBy(desc(smsCreditTransactions.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(smsCreditTransactions)
      .where(and(...whereConditions)),
  ]);

  return {
    transactions: transactions as SmsCreditTransaction[],
    total: countResult[0]?.count || 0,
  };
}

export async function getSmsPackages(): Promise<SmsCreditPackage[]> {
  const packages = await db
    .select()
    .from(smsCreditPackages)
    .where(eq(smsCreditPackages.isActive, true))
    .orderBy(smsCreditPackages.sortOrder);

  return packages as SmsCreditPackage[];
}

export async function getSmsPackage(packageId: string): Promise<SmsCreditPackage | null> {
  const pkg = await db
    .select()
    .from(smsCreditPackages)
    .where(eq(smsCreditPackages.id, packageId))
    .limit(1);

  return pkg[0] as SmsCreditPackage | null;
}

export async function updateAutoRechargeSettings(
  tenantId: string,
  settings: {
    enabled: boolean;
    rechargeAmount?: number;
    lowThreshold?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(tenants)
      .set({
        smsCreditsAutoRecharge: settings.enabled,
        smsCreditsAutoRechargeAmount: settings.rechargeAmount || null,
        smsCreditsLowThreshold: settings.lowThreshold,
      })
      .where(eq(tenants.id, tenantId));

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update auto-recharge settings:', error);
    return { success: false, error: error.message };
  }
}

export async function checkAndTriggerLowBalanceWarning(
  tenantId: string
): Promise<{ isLow: boolean; balance: number; threshold: number } | null> {
  const balanceInfo = await getSmsCreditsBalance(tenantId);
  
  if (balanceInfo.isLow) {
    console.warn(`⚠️ Low SMS credits warning for tenant ${tenantId}: ${balanceInfo.balance} credits remaining (threshold: ${balanceInfo.lowThreshold})`);
    
    return {
      isLow: true,
      balance: balanceInfo.balance,
      threshold: balanceInfo.lowThreshold,
    };
  }

  return null;
}

export async function getSmsUsageStats(
  tenantId: string,
  options: { days?: number } = {}
): Promise<{
  totalSent: number;
  totalPurchased: number;
  currentBalance: number;
  averageDaily: number;
  projectedDaysRemaining: number | null;
}> {
  const days = options.days || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [usageStats, purchaseStats, balanceInfo] = await Promise.all([
    db
      .select({
        total: sql<number>`COALESCE(SUM(ABS(amount)), 0)::int`,
      })
      .from(smsCreditTransactions)
      .where(
        and(
          eq(smsCreditTransactions.tenantId, tenantId),
          eq(smsCreditTransactions.type, 'usage'),
          gt(smsCreditTransactions.createdAt, startDate)
        )
      ),
    db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)::int`,
      })
      .from(smsCreditTransactions)
      .where(
        and(
          eq(smsCreditTransactions.tenantId, tenantId),
          eq(smsCreditTransactions.type, 'purchase'),
          gt(smsCreditTransactions.createdAt, startDate)
        )
      ),
    getSmsCreditsBalance(tenantId),
  ]);

  const totalSent = usageStats[0]?.total || 0;
  const totalPurchased = purchaseStats[0]?.total || 0;
  const averageDaily = totalSent / days;
  const projectedDaysRemaining = averageDaily > 0 
    ? Math.floor(balanceInfo.balance / averageDaily)
    : null;

  return {
    totalSent,
    totalPurchased,
    currentBalance: balanceInfo.balance,
    averageDaily: Math.round(averageDaily * 100) / 100,
    projectedDaysRemaining,
  };
}

export async function adjustSmsCredits(
  tenantId: string,
  adjustment: number,
  options: {
    reason: string;
    createdBy?: string;
    referenceId?: string;
  }
): Promise<PurchaseCreditsResult | DeductCreditsResult> {
  if (adjustment > 0) {
    return addSmsCredits(tenantId, adjustment, {
      type: 'adjustment',
      description: options.reason,
      referenceId: options.referenceId,
      createdBy: options.createdBy,
    });
  } else {
    try {
      return await db.transaction(async (tx) => {
        const [currentTenant] = await tx
          .select({ balance: tenants.smsCreditsBalance })
          .from(tenants)
          .where(eq(tenants.id, tenantId))
          .for('update')
          .limit(1);

        if (!currentTenant) {
          throw new Error(`Tenant ${tenantId} not found`);
        }

        const currentBalance = currentTenant.balance ?? 0;
        const absAdjustment = Math.abs(adjustment);
        const newBalance = Math.max(0, currentBalance - absAdjustment);
        const actualDeduction = currentBalance - newBalance;

        await tx
          .update(tenants)
          .set({ smsCreditsBalance: newBalance })
          .where(eq(tenants.id, tenantId));

        const [transaction] = await tx
          .insert(smsCreditTransactions)
          .values({
            tenantId,
            type: 'adjustment',
            amount: -actualDeduction,
            balanceAfter: newBalance,
            description: options.reason,
            referenceId: options.referenceId || null,
            referenceType: 'adjustment',
            createdBy: options.createdBy || null,
          })
          .returning();

        return {
          success: true,
          newBalance,
          creditsDeducted: actualDeduction,
          transactionId: transaction.id,
        };
      });
    } catch (error: any) {
      console.error('Failed to adjust SMS credits:', error);
      return {
        success: false,
        newBalance: 0,
        creditsDeducted: 0,
        error: error.message || 'Failed to adjust credits',
      };
    }
  }
}

export async function getAllSmsPackages(): Promise<SmsCreditPackage[]> {
  const packages = await db
    .select()
    .from(smsCreditPackages)
    .orderBy(smsCreditPackages.sortOrder);

  return packages as SmsCreditPackage[];
}

export async function createSmsPackage(
  packageData: Omit<SmsCreditPackage, 'id'>
): Promise<SmsCreditPackage> {
  const [pkg] = await db
    .insert(smsCreditPackages)
    .values(packageData)
    .returning();

  return pkg as SmsCreditPackage;
}

export async function updateSmsPackage(
  packageId: string,
  updates: Partial<Omit<SmsCreditPackage, 'id'>>
): Promise<SmsCreditPackage | null> {
  const [pkg] = await db
    .update(smsCreditPackages)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(smsCreditPackages.id, packageId))
    .returning();

  return pkg as SmsCreditPackage | null;
}

export async function deleteSmsPackage(packageId: string): Promise<boolean> {
  const result = await db
    .update(smsCreditPackages)
    .set({ isActive: false })
    .where(eq(smsCreditPackages.id, packageId));

  return true;
}
