import braintree, { Environment, BraintreeGateway } from 'braintree';
import { db } from '../db';
import { tenants, tenantSubscriptionEvents } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const BRAINTREE_PLAN_MAP: Record<string, string> = {
  core: process.env.BRAINTREE_PLAN_CORE || 'playhq_core',
  growth: process.env.BRAINTREE_PLAN_GROWTH || 'playhq_growth',
  elite: process.env.BRAINTREE_PLAN_ELITE || 'playhq_elite',
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
  const environment = process.env.NODE_ENV === 'production' 
    ? Environment.Production 
    : Environment.Sandbox;
  
  gateway = new braintree.BraintreeGateway({
    environment,
    merchantId: process.env.BRAINTREE_MERCHANT_ID!,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY!,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY!,
  });
  console.log('✅ Braintree gateway initialized');
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
