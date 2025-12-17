import braintree, { Environment, BraintreeGateway } from 'braintree';
import { db } from '../db';
import { tenants, tenantSubscriptionEvents } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const BRAINTREE_PLAN_MAP: Record<string, string> = {
  core: process.env.BRAINTREE_PLAN_CORE || 'plan_core_123',
  growth: process.env.BRAINTREE_PLAN_GROWTH || 'plan_growth_123',
  elite: process.env.BRAINTREE_PLAN_ELITE || 'plan_elite_123',
};

const PLAN_LEVEL_MAP: Record<string, 'free' | 'core' | 'growth' | 'elite'> = {
  [BRAINTREE_PLAN_MAP.core]: 'core',
  [BRAINTREE_PLAN_MAP.growth]: 'growth',
  [BRAINTREE_PLAN_MAP.elite]: 'elite',
};

let gateway: BraintreeGateway | null = null;
const braintreeEnabled = !!(
  process.env.BRAINTREE_MERCHANT_ID &&
  process.env.BRAINTREE_PUBLIC_KEY &&
  process.env.BRAINTREE_PRIVATE_KEY
);

if (braintreeEnabled) {
  // Use BRAINTREE_ENVIRONMENT secret if set, otherwise fall back to NODE_ENV
  const envSetting = process.env.BRAINTREE_ENVIRONMENT?.toLowerCase();
  const environment = envSetting === 'production' 
    ? Environment.Production 
    : Environment.Sandbox;
  
  gateway = new braintree.BraintreeGateway({
    environment,
    merchantId: process.env.BRAINTREE_MERCHANT_ID!,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY!,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY!,
  });
  console.log(`✅ Braintree gateway initialized (${envSetting || 'sandbox'} environment)`);
} else {
  console.warn('⚠️ Braintree not configured - missing credentials');
}

export function isBraintreeEnabled(): boolean {
  return braintreeEnabled && gateway !== null;
}

export function getGateway(): BraintreeGateway {
  if (!gateway) {
    throw new Error('Braintree gateway not initialized');
  }
  return gateway;
}

export function getPlanIdForLevel(level: 'core' | 'growth' | 'elite'): string {
  return BRAINTREE_PLAN_MAP[level];
}

export function getPlanLevelFromPlanId(planId: string): 'free' | 'core' | 'growth' | 'elite' | null {
  return PLAN_LEVEL_MAP[planId] || null;
}

export async function generateClientToken(customerId?: string): Promise<string> {
  const gw = getGateway();
  
  const options: braintree.ClientTokenRequest = {};
  if (customerId) {
    options.customerId = customerId;
  }
  
  const result = await gw.clientToken.generate(options);
  return result.clientToken;
}

export async function createCustomer(
  tenantId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  company?: string
): Promise<braintree.Customer> {
  const gw = getGateway();
  
  // Note: We store tenant-customer relationship in our database rather than 
  // using Braintree custom fields (which require manual configuration in 
  // Braintree Control Panel). The tenants.braintreeCustomerId column provides
  // the association we need.
  const result = await gw.customer.create({
    email,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    company: company || undefined,
  });
  
  if (!result.success || !result.customer) {
    throw new Error(`Failed to create Braintree customer: ${result.message}`);
  }
  
  await db.update(tenants)
    .set({ 
      braintreeCustomerId: result.customer.id,
      paymentProcessor: 'braintree',
    })
    .where(eq(tenants.id, tenantId));
  
  return result.customer;
}

export async function findOrCreateCustomer(
  tenantId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  company?: string
): Promise<braintree.Customer> {
  const gw = getGateway();
  
  const [tenant] = await db.select({ braintreeCustomerId: tenants.braintreeCustomerId })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  if (tenant?.braintreeCustomerId) {
    try {
      const customer = await gw.customer.find(tenant.braintreeCustomerId);
      return customer;
    } catch (error) {
      console.warn(`Braintree customer ${tenant.braintreeCustomerId} not found, creating new one`);
    }
  }
  
  return createCustomer(tenantId, email, firstName, lastName, company);
}

export async function createPaymentMethod(
  customerId: string,
  nonce: string,
  makeDefault: boolean = true
): Promise<braintree.PaymentMethod> {
  const gw = getGateway();
  
  const result = await gw.paymentMethod.create({
    customerId,
    paymentMethodNonce: nonce,
    options: {
      makeDefault,
      verifyCard: true,
    },
  });
  
  if (!result.success || !result.paymentMethod) {
    throw new Error(`Failed to create payment method: ${result.message}`);
  }
  
  return result.paymentMethod;
}

export async function createSubscription(
  tenantId: string,
  planLevel: 'core' | 'growth' | 'elite',
  paymentMethodToken: string,
  options?: {
    startImmediately?: boolean;
    trialDuration?: number;
    trialDurationUnit?: 'day' | 'month';
    discountId?: string;
    discountAmount?: number;
    firstBillingAmount?: string; // Discounted price for first billing cycle
  }
): Promise<braintree.Subscription> {
  const gw = getGateway();
  const planId = getPlanIdForLevel(planLevel);
  
  const [currentTenant] = await db.select({ 
    planLevel: tenants.planLevel,
    braintreeSubscriptionId: tenants.braintreeSubscriptionId,
  })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  const previousPlanLevel = currentTenant?.planLevel;
  const existingSubscriptionId = currentTenant?.braintreeSubscriptionId;
  
  const subscriptionRequest: braintree.SubscriptionRequest = {
    planId,
    paymentMethodToken,
  };
  
  if (options?.trialDuration !== undefined && options.trialDuration > 0) {
    (subscriptionRequest as any).trialDuration = options.trialDuration;
    (subscriptionRequest as any).trialDurationUnit = options.trialDurationUnit || 'day';
    (subscriptionRequest as any).trialPeriod = true;
  }
  
  if (options?.discountId) {
    subscriptionRequest.discounts = {
      add: [{ inheritedFromId: options.discountId }],
    };
  }
  
  // Apply first billing amount discount if provided
  // This allows us to apply a discounted price for the first month without
  // needing to pre-configure discounts in the Braintree Control Panel
  if (options?.firstBillingAmount) {
    (subscriptionRequest as any).firstBillingAmount = options.firstBillingAmount;
  }
  
  const result = await gw.subscription.create(subscriptionRequest);
  
  if (!result.success || !result.subscription) {
    throw new Error(`Failed to create subscription: ${result.message}`);
  }
  
  const subscription = result.subscription;
  
  // Only cancel existing subscription AFTER new one is successfully created
  if (existingSubscriptionId) {
    try {
      await gw.subscription.cancel(existingSubscriptionId);
      console.log(`Cancelled previous subscription ${existingSubscriptionId} after creating new one`);
    } catch (error) {
      console.warn(`Could not cancel existing subscription ${existingSubscriptionId}: ${error}`);
      // Don't throw - new subscription is already created and active
    }
  }
  
  // Use transaction to ensure atomic update
  await db.transaction(async (tx) => {
    await tx.update(tenants)
      .set({
        braintreeSubscriptionId: subscription.id,
        braintreeStatus: subscription.status,
        braintreePlanId: planId,
        braintreePaymentMethodToken: paymentMethodToken,
        braintreeNextBillingDate: subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : null,
        planLevel,
        paymentProcessor: 'braintree',
        lastPlanChangeAt: new Date(),
        lastPlanLevel: previousPlanLevel as any,
      })
      .where(eq(tenants.id, tenantId));
    
    await logSubscriptionEventTx(tx, tenantId, 'subscription_created', {
      subscriptionId: subscription.id,
      planId,
      planLevel,
      previousPlanLevel: previousPlanLevel as any,
      status: 'success',
      amountCents: subscription.price ? Math.round(parseFloat(subscription.price) * 100) : undefined,
      triggeredBy: 'user',
    });
  });
  
  return subscription;
}

export async function updateSubscriptionPlan(
  tenantId: string,
  newPlanLevel: 'core' | 'growth' | 'elite',
  options?: {
    effectiveDate?: 'immediately' | 'end_of_billing_period';
    prorateCharges?: boolean;
  }
): Promise<braintree.Subscription | null> {
  const gw = getGateway();
  const newPlanId = getPlanIdForLevel(newPlanLevel);
  
  const [tenant] = await db.select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  if (!tenant?.braintreeSubscriptionId) {
    throw new Error('Tenant does not have an active Braintree subscription');
  }
  
  const previousPlanLevel = tenant.planLevel;
  const isUpgrade = getSubscriptionTier(newPlanLevel) > getSubscriptionTier(previousPlanLevel as any);
  const isDowngrade = getSubscriptionTier(newPlanLevel) < getSubscriptionTier(previousPlanLevel as any);
  
  if (isUpgrade || options?.effectiveDate === 'immediately') {
    const result = await gw.subscription.update(tenant.braintreeSubscriptionId, {
      planId: newPlanId,
      options: {
        prorateCharges: options?.prorateCharges ?? false,
        revertSubscriptionOnProrationFailure: true,
      },
    });
    
    if (!result.success || !result.subscription) {
      throw new Error(`Failed to update subscription: ${result.message}`);
    }
    
    await db.update(tenants)
      .set({
        braintreePlanId: newPlanId,
        braintreeStatus: result.subscription.status,
        braintreeNextBillingDate: result.subscription.nextBillingDate 
          ? new Date(result.subscription.nextBillingDate) 
          : null,
        planLevel: newPlanLevel,
        lastPlanChangeAt: new Date(),
        lastPlanLevel: previousPlanLevel as any,
        pendingPlanChange: null,
        pendingPlanChangeAt: null,
        pendingPlanCode: null,
        pendingPlanEffectiveDate: null,
      })
      .where(eq(tenants.id, tenantId));
    
    await logSubscriptionEvent(tenantId, isUpgrade ? 'plan_upgraded' : 'plan_downgraded', {
      subscriptionId: tenant.braintreeSubscriptionId,
      planId: newPlanId,
      planLevel: newPlanLevel,
      previousPlanLevel: previousPlanLevel as any,
      status: 'success',
      triggeredBy: 'user',
    });
    
    return result.subscription;
  } else if (isDowngrade) {
    const subscription = await gw.subscription.find(tenant.braintreeSubscriptionId);
    const effectiveDate = subscription.nextBillingDate 
      ? new Date(subscription.nextBillingDate) 
      : new Date();
    
    await db.update(tenants)
      .set({
        pendingPlanChange: newPlanLevel,
        pendingPlanChangeAt: new Date(),
        pendingPlanCode: newPlanId,
        pendingPlanEffectiveDate: effectiveDate,
      })
      .where(eq(tenants.id, tenantId));
    
    await logSubscriptionEvent(tenantId, 'plan_downgrade_scheduled', {
      subscriptionId: tenant.braintreeSubscriptionId,
      planId: newPlanId,
      planLevel: newPlanLevel,
      previousPlanLevel: previousPlanLevel as any,
      status: 'pending',
      triggeredBy: 'user',
      metadata: { effectiveDate: effectiveDate.toISOString() },
    });
    
    return subscription;
  }
  
  return null;
}

export async function cancelSubscription(
  tenantId: string,
  options?: {
    effectiveDate?: 'immediately' | 'end_of_billing_period';
    reason?: string;
  }
): Promise<boolean> {
  const gw = getGateway();
  
  const [tenant] = await db.select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  if (!tenant?.braintreeSubscriptionId) {
    return false;
  }
  
  const previousPlanLevel = tenant.planLevel;
  
  if (options?.effectiveDate === 'end_of_billing_period') {
    const subscription = await gw.subscription.find(tenant.braintreeSubscriptionId);
    const effectiveDate = subscription.nextBillingDate 
      ? new Date(subscription.nextBillingDate) 
      : new Date();
    
    await db.update(tenants)
      .set({
        pendingPlanChange: 'free',
        pendingPlanChangeAt: new Date(),
        pendingPlanEffectiveDate: effectiveDate,
        planChangeReason: options?.reason || 'user_cancelled',
      })
      .where(eq(tenants.id, tenantId));
    
    await logSubscriptionEvent(tenantId, 'plan_downgrade_scheduled', {
      subscriptionId: tenant.braintreeSubscriptionId,
      planLevel: 'free',
      previousPlanLevel: previousPlanLevel as any,
      status: 'pending',
      triggeredBy: 'user',
      metadata: { 
        effectiveDate: effectiveDate.toISOString(),
        reason: options?.reason,
      },
    });
    
    return true;
  }
  
  try {
    await gw.subscription.cancel(tenant.braintreeSubscriptionId);
  } catch (error) {
    throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  await db.update(tenants)
    .set({
      braintreeStatus: 'canceled',
      planLevel: 'free',
      lastPlanChangeAt: new Date(),
      lastPlanLevel: previousPlanLevel as any,
      planChangeReason: options?.reason || 'user_cancelled',
    })
    .where(eq(tenants.id, tenantId));
  
  await logSubscriptionEvent(tenantId, 'subscription_canceled', {
    subscriptionId: tenant.braintreeSubscriptionId,
    planLevel: 'free',
    previousPlanLevel: previousPlanLevel as any,
    status: 'success',
    triggeredBy: 'user',
    metadata: { reason: options?.reason },
  });
  
  return true;
}

export async function processPendingDowngrades(): Promise<number> {
  const gw = getGateway();
  const now = new Date();
  
  // Query tenants with pending downgrades that are due
  const pendingDowngrades = await db.select()
    .from(tenants)
    .where(eq(tenants.paymentProcessor, 'braintree'));
  
  const tenantsWithPendingChanges = pendingDowngrades.filter(
    t => t.pendingPlanChange && 
         t.pendingPlanEffectiveDate && 
         new Date(t.pendingPlanEffectiveDate) <= now
  );
  
  let processedCount = 0;
  
  for (const tenant of tenantsWithPendingChanges) {
    try {
      const newPlanLevel = tenant.pendingPlanChange as 'free' | 'core' | 'growth' | 'elite';
      
      // Use transaction for atomic updates with optimistic locking
      await db.transaction(async (tx) => {
        // Re-check the tenant within transaction to prevent race conditions
        const [currentTenant] = await tx.select()
          .from(tenants)
          .where(eq(tenants.id, tenant.id))
          .limit(1);
        
        // Skip if already processed by another request/webhook
        if (!currentTenant?.pendingPlanChange || !currentTenant.pendingPlanEffectiveDate) {
          console.log(`Tenant ${tenant.id} already processed, skipping`);
          return;
        }
        
        if (newPlanLevel === 'free') {
          if (currentTenant.braintreeSubscriptionId) {
            await gw.subscription.cancel(currentTenant.braintreeSubscriptionId);
          }
          
          await tx.update(tenants)
            .set({
              planLevel: 'free',
              braintreeStatus: 'canceled',
              pendingPlanChange: null,
              pendingPlanChangeAt: null,
              pendingPlanCode: null,
              pendingPlanEffectiveDate: null,
              lastPlanChangeAt: now,
              lastPlanLevel: currentTenant.planLevel as any,
            })
            .where(eq(tenants.id, tenant.id));
          
          await logSubscriptionEventTx(tx, tenant.id, 'subscription_canceled', {
            subscriptionId: currentTenant.braintreeSubscriptionId || undefined,
            planLevel: 'free',
            previousPlanLevel: currentTenant.planLevel as any,
            status: 'success',
            triggeredBy: 'system',
            metadata: { reason: 'scheduled_cancellation' },
          });
        } else {
          const newPlanId = getPlanIdForLevel(newPlanLevel);
          
          if (currentTenant.braintreeSubscriptionId) {
            const result = await gw.subscription.update(currentTenant.braintreeSubscriptionId, {
              planId: newPlanId,
              options: { prorateCharges: false },
            });
            
            if (result.success && result.subscription) {
              await tx.update(tenants)
                .set({
                  planLevel: newPlanLevel,
                  braintreePlanId: newPlanId,
                  braintreeStatus: result.subscription.status,
                  braintreeNextBillingDate: result.subscription.nextBillingDate 
                    ? new Date(result.subscription.nextBillingDate) 
                    : null,
                  pendingPlanChange: null,
                  pendingPlanChangeAt: null,
                  pendingPlanCode: null,
                  pendingPlanEffectiveDate: null,
                  lastPlanChangeAt: now,
                  lastPlanLevel: currentTenant.planLevel as any,
                })
                .where(eq(tenants.id, tenant.id));
              
              await logSubscriptionEventTx(tx, tenant.id, 'plan_downgraded', {
                subscriptionId: currentTenant.braintreeSubscriptionId,
                planId: newPlanId,
                planLevel: newPlanLevel,
                previousPlanLevel: currentTenant.planLevel as any,
                status: 'success',
                triggeredBy: 'system',
              });
            }
          }
        }
        
        processedCount++;
      });
    } catch (error) {
      console.error(`Failed to process pending downgrade for tenant ${tenant.id}:`, error);
      
      await logSubscriptionEvent(tenant.id, 'subscription_charge_failed', {
        subscriptionId: tenant.braintreeSubscriptionId || undefined,
        planLevel: tenant.pendingPlanChange as any,
        previousPlanLevel: tenant.planLevel as any,
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        triggeredBy: 'system',
        metadata: { operation: 'plan_downgrade_processing' },
      });
    }
  }
  
  return processedCount;
}

export async function retryFailedPayment(tenantId: string): Promise<braintree.Transaction | null> {
  const gw = getGateway();
  
  const [tenant] = await db.select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  if (!tenant?.braintreeSubscriptionId) {
    throw new Error('No subscription found for tenant');
  }
  
  try {
    const result = await gw.subscription.retryCharge(
      tenant.braintreeSubscriptionId,
      undefined,
      true
    );
    
    if (!result.success || !result.transaction) {
      await db.update(tenants)
        .set({
          braintreeFailureCount: (tenant.braintreeFailureCount || 0) + 1,
          braintreeLastFailureAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));
      
      await logSubscriptionEvent(tenantId, 'subscription_charge_failed', {
        subscriptionId: tenant.braintreeSubscriptionId,
        planLevel: tenant.planLevel as any,
        status: 'failed',
        failureReason: result.message,
        triggeredBy: 'system',
      });
      
      return null;
    }
    
    await db.update(tenants)
      .set({
        braintreeStatus: 'active',
        braintreeLastChargeAt: new Date(),
        braintreeFailureCount: 0,
      })
      .where(eq(tenants.id, tenantId));
    
    await logSubscriptionEvent(tenantId, 'subscription_charged', {
      subscriptionId: tenant.braintreeSubscriptionId,
      planLevel: tenant.planLevel as any,
      status: 'success',
      triggeredBy: 'system',
    });
    
    return result.transaction;
  } catch (error) {
    await db.update(tenants)
      .set({
        braintreeFailureCount: (tenant.braintreeFailureCount || 0) + 1,
        braintreeLastFailureAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));
    
    await logSubscriptionEvent(tenantId, 'subscription_charge_failed', {
      subscriptionId: tenant.braintreeSubscriptionId,
      planLevel: tenant.planLevel as any,
      status: 'failed',
      failureReason: error instanceof Error ? error.message : 'Unknown error',
      triggeredBy: 'system',
    });
    
    return null;
  }
}

export async function getSubscriptionDetails(tenantId: string): Promise<{
  subscription: braintree.Subscription | null;
  customer: braintree.Customer | null;
  paymentMethod: braintree.PaymentMethod | null;
}> {
  const gw = getGateway();
  
  const [tenant] = await db.select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  let subscription: braintree.Subscription | null = null;
  let customer: braintree.Customer | null = null;
  let paymentMethod: braintree.PaymentMethod | null = null;
  
  if (tenant?.braintreeSubscriptionId) {
    try {
      subscription = await gw.subscription.find(tenant.braintreeSubscriptionId);
    } catch (error) {
      console.warn(`Could not find subscription: ${error}`);
    }
  }
  
  if (tenant?.braintreeCustomerId) {
    try {
      customer = await gw.customer.find(tenant.braintreeCustomerId);
    } catch (error) {
      console.warn(`Could not find customer: ${error}`);
    }
  }
  
  if (tenant?.braintreePaymentMethodToken) {
    try {
      paymentMethod = await gw.paymentMethod.find(tenant.braintreePaymentMethodToken);
    } catch (error) {
      console.warn(`Could not find payment method: ${error}`);
    }
  }
  
  return { subscription, customer, paymentMethod };
}

// Plan prices in cents
const PLAN_PRICES_CENTS: Record<'core' | 'growth' | 'elite', number> = {
  core: 1999,    // $19.99
  growth: 4999,  // $49.99
  elite: 9999,   // $99.99
};

// Convert discount duration to number of cycles
function getDurationCycles(duration: string): number | null {
  switch (duration) {
    case 'one_time': return 1;
    case 'months_3': return 3;
    case 'months_6': return 6;
    case 'months_12': return 12;
    case 'indefinite': return null; // null means indefinite
    default: return 1;
  }
}

// Calculate discount amount in cents based on plan price and discount settings
export function calculateDiscountAmount(
  planLevel: 'core' | 'growth' | 'elite',
  discountType: string,
  discountValue: number
): number {
  const planPrice = PLAN_PRICES_CENTS[planLevel];
  
  switch (discountType) {
    case 'percentage':
      return Math.round(planPrice * (discountValue / 100));
    case 'fixed':
      return discountValue; // Already in cents
    case 'full':
      return planPrice; // Full discount = free
    default:
      return 0;
  }
}

// Calculate final price after discount in cents
export function calculateFinalPrice(
  planLevel: 'core' | 'growth' | 'elite',
  discountType: string | null | undefined,
  discountValue: number | null | undefined
): { originalPrice: number; discountAmount: number; finalPrice: number } {
  const originalPrice = PLAN_PRICES_CENTS[planLevel];
  
  if (!discountType || !discountValue) {
    return { originalPrice, discountAmount: 0, finalPrice: originalPrice };
  }
  
  const discountAmount = calculateDiscountAmount(planLevel, discountType, discountValue);
  const finalPrice = Math.max(0, originalPrice - discountAmount);
  
  return { originalPrice, discountAmount, finalPrice };
}

export interface ApplyDiscountOptions {
  codeId: string;
  code: string;
  discountType: 'percentage' | 'fixed' | 'full';
  discountValue: number;
  discountDuration: string;
  isPlatform: boolean;
  appliedBy: string;
}

export interface ApplyDiscountResult {
  success: boolean;
  message: string;
  appliedDiscount?: {
    originalPriceCents: number;
    discountAmountCents: number;
    finalPriceCents: number;
    remainingCycles: number | null;
  };
}

// Apply a discount code to an existing subscription
export async function applyDiscountToSubscription(
  tenantId: string,
  discountOptions: ApplyDiscountOptions
): Promise<ApplyDiscountResult> {
  const [tenant] = await db.select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    return { success: false, message: 'Tenant not found' };
  }

  if (!tenant.braintreeSubscriptionId) {
    return { success: false, message: 'Tenant does not have an active subscription' };
  }

  if (tenant.planLevel === 'free') {
    return { success: false, message: 'Cannot apply discount to free plan' };
  }

  // Check if tenant already has an active discount
  if (tenant.appliedDiscountCodeId && tenant.appliedDiscountRemainingCycles !== 0) {
    return { 
      success: false, 
      message: `Tenant already has an active discount code: ${tenant.appliedDiscountCode}` 
    };
  }

  const planLevel = tenant.planLevel as 'core' | 'growth' | 'elite';
  const { originalPrice, discountAmount, finalPrice } = calculateFinalPrice(
    planLevel,
    discountOptions.discountType,
    discountOptions.discountValue
  );

  const remainingCycles = getDurationCycles(discountOptions.discountDuration);

  // Braintree doesn't natively support percentage-based recurring discounts,
  // so we track the discount in our database and update the subscription price
  // each billing cycle through our webhook handler.
  // 
  // For immediate effect on the current cycle, we can update the subscription's
  // price (though this requires Braintree admin configuration for custom pricing).
  // 
  // For now, we store the discount info and it will apply starting next cycle.
  // A Super Admin can manually adjust the current cycle if needed.

  try {
    await db.update(tenants)
      .set({
        appliedDiscountCodeId: discountOptions.codeId,
        appliedDiscountCode: discountOptions.code,
        appliedDiscountType: discountOptions.discountType,
        appliedDiscountValue: discountOptions.discountValue,
        appliedDiscountDuration: discountOptions.discountDuration,
        appliedDiscountRemainingCycles: remainingCycles,
        appliedDiscountStartedAt: new Date(),
        appliedDiscountAppliedBy: discountOptions.appliedBy,
        appliedDiscountIsPlatform: discountOptions.isPlatform,
      })
      .where(eq(tenants.id, tenantId));

    await logSubscriptionEvent(tenantId, 'subscription_charged', {
      subscriptionId: tenant.braintreeSubscriptionId,
      planLevel,
      status: 'success',
      triggeredBy: 'user',
      metadata: {
        action: 'discount_applied',
        discountCode: discountOptions.code,
        discountType: discountOptions.discountType,
        discountValue: discountOptions.discountValue,
        discountDuration: discountOptions.discountDuration,
        remainingCycles,
        originalPriceCents: originalPrice,
        discountAmountCents: discountAmount,
        finalPriceCents: finalPrice,
      },
    });

    return {
      success: true,
      message: `Discount code ${discountOptions.code} applied successfully. Discount will apply starting next billing cycle.`,
      appliedDiscount: {
        originalPriceCents: originalPrice,
        discountAmountCents: discountAmount,
        finalPriceCents: finalPrice,
        remainingCycles,
      },
    };
  } catch (error) {
    console.error('Failed to apply discount to subscription:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to apply discount',
    };
  }
}

// Remove an active discount from a subscription
export async function removeDiscountFromSubscription(
  tenantId: string,
  reason: string = 'manual_removal'
): Promise<{ success: boolean; message: string }> {
  const [tenant] = await db.select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    return { success: false, message: 'Tenant not found' };
  }

  if (!tenant.appliedDiscountCodeId) {
    return { success: false, message: 'No active discount to remove' };
  }

  const previousCode = tenant.appliedDiscountCode;

  try {
    await db.update(tenants)
      .set({
        appliedDiscountCodeId: null,
        appliedDiscountCode: null,
        appliedDiscountType: null,
        appliedDiscountValue: null,
        appliedDiscountDuration: null,
        appliedDiscountRemainingCycles: null,
        appliedDiscountStartedAt: null,
        appliedDiscountAppliedBy: null,
        appliedDiscountIsPlatform: null,
      })
      .where(eq(tenants.id, tenantId));

    if (tenant.braintreeSubscriptionId) {
      await logSubscriptionEvent(tenantId, 'subscription_charged', {
        subscriptionId: tenant.braintreeSubscriptionId,
        planLevel: tenant.planLevel as any,
        status: 'success',
        triggeredBy: 'system',
        metadata: {
          action: 'discount_removed',
          discountCode: previousCode,
          reason,
        },
      });
    }

    return {
      success: true,
      message: `Discount code ${previousCode} removed. Full price will apply from next billing cycle.`,
    };
  } catch (error) {
    console.error('Failed to remove discount from subscription:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to remove discount',
    };
  }
}

// Decrement discount cycle count (called after each billing cycle)
export async function decrementDiscountCycle(tenantId: string): Promise<void> {
  const [tenant] = await db.select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant || !tenant.appliedDiscountCodeId) {
    return; // No discount to decrement
  }

  // If indefinite (null), don't decrement
  if (tenant.appliedDiscountRemainingCycles === null) {
    return;
  }

  const newRemainingCycles = Math.max(0, (tenant.appliedDiscountRemainingCycles || 0) - 1);

  if (newRemainingCycles === 0) {
    // Discount has expired, remove it
    await removeDiscountFromSubscription(tenantId, 'cycles_exhausted');
    console.log(`Discount ${tenant.appliedDiscountCode} expired for tenant ${tenantId}`);
  } else {
    // Just decrement the counter
    await db.update(tenants)
      .set({ appliedDiscountRemainingCycles: newRemainingCycles })
      .where(eq(tenants.id, tenantId));
    console.log(`Discount ${tenant.appliedDiscountCode} has ${newRemainingCycles} cycles remaining for tenant ${tenantId}`);
  }
}

// Get the discounted price for the next billing cycle
export async function getNextBillingAmount(tenantId: string): Promise<{
  hasDiscount: boolean;
  discountCode: string | null;
  originalPriceCents: number;
  discountAmountCents: number;
  finalPriceCents: number;
  remainingCycles: number | null;
}> {
  const [tenant] = await db.select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant || tenant.planLevel === 'free') {
    return {
      hasDiscount: false,
      discountCode: null,
      originalPriceCents: 0,
      discountAmountCents: 0,
      finalPriceCents: 0,
      remainingCycles: null,
    };
  }

  const planLevel = tenant.planLevel as 'core' | 'growth' | 'elite';
  const originalPrice = PLAN_PRICES_CENTS[planLevel];

  // Check if there's an active discount with remaining cycles
  if (
    tenant.appliedDiscountCodeId &&
    tenant.appliedDiscountType &&
    tenant.appliedDiscountValue &&
    (tenant.appliedDiscountRemainingCycles === null || tenant.appliedDiscountRemainingCycles > 0)
  ) {
    const discountAmount = calculateDiscountAmount(
      planLevel,
      tenant.appliedDiscountType,
      tenant.appliedDiscountValue
    );
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return {
      hasDiscount: true,
      discountCode: tenant.appliedDiscountCode,
      originalPriceCents: originalPrice,
      discountAmountCents: discountAmount,
      finalPriceCents: finalPrice,
      remainingCycles: tenant.appliedDiscountRemainingCycles,
    };
  }

  return {
    hasDiscount: false,
    discountCode: null,
    originalPriceCents: originalPrice,
    discountAmountCents: 0,
    finalPriceCents: originalPrice,
    remainingCycles: null,
  };
}

function getSubscriptionTier(level: 'free' | 'core' | 'growth' | 'elite'): number {
  const tiers: Record<string, number> = {
    free: 0,
    core: 1,
    growth: 2,
    elite: 3,
  };
  return tiers[level] || 0;
}

type SubscriptionEventType = 
  | 'subscription_created'
  | 'subscription_activated'
  | 'subscription_charged'
  | 'subscription_charge_failed'
  | 'subscription_past_due'
  | 'subscription_canceled'
  | 'subscription_expired'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'plan_downgrade_scheduled'
  | 'plan_downgrade_cancelled'
  | 'payment_method_updated'
  | 'dispute_opened'
  | 'dispute_won'
  | 'dispute_lost';

type EventData = {
  subscriptionId?: string;
  planId?: string;
  planLevel?: 'free' | 'core' | 'growth' | 'elite';
  previousPlanLevel?: 'free' | 'core' | 'growth' | 'elite';
  status: 'success' | 'failed' | 'pending';
  amountCents?: number;
  failureReason?: string;
  failureCode?: string;
  processorEventId?: string;
  triggeredBy: 'user' | 'system' | 'webhook';
  metadata?: Record<string, any>;
};

async function logSubscriptionEvent(
  tenantId: string,
  eventType: SubscriptionEventType,
  data: EventData
): Promise<void> {
  try {
    await db.insert(tenantSubscriptionEvents).values({
      tenantId,
      eventType,
      processor: 'braintree',
      subscriptionId: data.subscriptionId,
      planId: data.planId,
      planLevel: data.planLevel,
      previousPlanLevel: data.previousPlanLevel,
      status: data.status,
      amountCents: data.amountCents,
      failureReason: data.failureReason,
      failureCode: data.failureCode,
      processorEventId: data.processorEventId,
      triggeredBy: data.triggeredBy,
      metadata: data.metadata || {},
    });
  } catch (error) {
    console.error('Failed to log subscription event:', error);
  }
}

async function logSubscriptionEventTx(
  tx: any,
  tenantId: string,
  eventType: SubscriptionEventType,
  data: EventData
): Promise<void> {
  try {
    await tx.insert(tenantSubscriptionEvents).values({
      tenantId,
      eventType,
      processor: 'braintree',
      subscriptionId: data.subscriptionId,
      planId: data.planId,
      planLevel: data.planLevel,
      previousPlanLevel: data.previousPlanLevel,
      status: data.status,
      amountCents: data.amountCents,
      failureReason: data.failureReason,
      failureCode: data.failureCode,
      processorEventId: data.processorEventId,
      triggeredBy: data.triggeredBy,
      metadata: data.metadata || {},
    });
  } catch (error) {
    console.error('Failed to log subscription event in transaction:', error);
  }
}

export async function processSaleTransaction(
  amountCents: number,
  paymentMethodNonce: string,
  options: {
    customerId?: string;
    orderId?: string;
    description?: string;
    metadata?: Record<string, string>;
  } = {}
): Promise<{
  success: boolean;
  transactionId?: string;
  status?: string;
  message?: string;
}> {
  if (!isBraintreeEnabled()) {
    return {
      success: false,
      message: 'Braintree payment processing is not configured. Please contact support.',
    };
  }

  const gw = getGateway();
  const amountDollars = (amountCents / 100).toFixed(2);

  try {
    const transactionRequest: braintree.TransactionRequest = {
      amount: amountDollars,
      paymentMethodNonce,
      options: {
        submitForSettlement: true,
      },
    };

    if (options.customerId) {
      transactionRequest.customerId = options.customerId;
    }

    if (options.orderId) {
      transactionRequest.orderId = options.orderId;
    }

    if (options.metadata) {
      transactionRequest.customFields = options.metadata;
    }

    const result = await gw.transaction.sale(transactionRequest);

    if (!result.success || !result.transaction) {
      return {
        success: false,
        message: result.message || 'Payment failed. Please try again.',
      };
    }

    return {
      success: true,
      transactionId: result.transaction.id,
      status: result.transaction.status,
    };
  } catch (error) {
    console.error('Braintree sale transaction error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Payment processing failed',
    };
  }
}

export async function checkCooldownPeriod(tenantId: string): Promise<{
  allowed: boolean;
  remainingHours?: number;
  lastChangeAt?: Date;
}> {
  const COOLDOWN_HOURS = 24;
  
  const [tenant] = await db.select({ lastPlanChangeAt: tenants.lastPlanChangeAt })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  if (!tenant?.lastPlanChangeAt) {
    return { allowed: true };
  }
  
  const hoursSinceChange = (Date.now() - tenant.lastPlanChangeAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceChange < COOLDOWN_HOURS) {
    return {
      allowed: false,
      remainingHours: Math.ceil(COOLDOWN_HOURS - hoursSinceChange),
      lastChangeAt: tenant.lastPlanChangeAt,
    };
  }
  
  return { allowed: true };
}
