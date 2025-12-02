import { Router, Request, Response } from 'express';
import { db } from '../db';
import { tenants, tenantSubscriptionEvents } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { 
  isBraintreeEnabled, 
  getGateway, 
  getPlanLevelFromPlanId 
} from '../services/braintreeService';
import { clearCapabilitiesCache } from '../middleware/featureAccess';

const router = Router();

const WEBHOOK_KINDS = {
  SUBSCRIPTION_CHARGED_SUCCESSFULLY: 'subscription_charged_successfully',
  SUBSCRIPTION_CHARGED_UNSUCCESSFULLY: 'subscription_charged_unsuccessfully',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  SUBSCRIPTION_WENT_ACTIVE: 'subscription_went_active',
  SUBSCRIPTION_WENT_PAST_DUE: 'subscription_went_past_due',
  DISPUTE_OPENED: 'dispute_opened',
  DISPUTE_WON: 'dispute_won',
  DISPUTE_LOST: 'dispute_lost',
} as const;

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

async function findTenantByBraintreeSubscription(subscriptionId: string): Promise<string | null> {
  const [tenant] = await db.select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.braintreeSubscriptionId, subscriptionId))
    .limit(1);
  return tenant?.id || null;
}

router.post('/', async (req: Request, res: Response) => {
  if (!isBraintreeEnabled()) {
    console.warn('⚠️ Braintree webhook received but Braintree is not configured');
    return res.status(503).json({ error: 'Braintree not configured' });
  }

  try {
    const gateway = getGateway();
    const signature = req.body.bt_signature;
    const payload = req.body.bt_payload;

    if (!signature || !payload) {
      console.error('❌ Missing Braintree webhook signature or payload');
      return res.status(400).json({ error: 'Missing signature or payload' });
    }

    let notification: any;
    try {
      notification = await gateway.webhookNotification.parse(signature, payload);
    } catch (error) {
      console.error('❌ Failed to parse Braintree webhook:', error);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const kind = notification.kind as string;
    const subscription = notification.subscription;
    const timestamp = notification.timestamp;
    
    console.log(`💳 Braintree webhook received: ${kind} at ${timestamp}`);

    switch (kind) {
      case WEBHOOK_KINDS.SUBSCRIPTION_CHARGED_SUCCESSFULLY: {
        if (!subscription) break;
        
        const tenantId = await findTenantByBraintreeSubscription(subscription.id);
        if (!tenantId) {
          console.warn(`⚠️ Tenant not found for subscription ${subscription.id}`);
          break;
        }

        await db.transaction(async (tx) => {
          await tx.update(tenants)
            .set({
              braintreeStatus: 'active',
              braintreeLastChargeAt: new Date(),
              braintreeNextBillingDate: subscription.nextBillingDate 
                ? new Date(subscription.nextBillingDate) 
                : null,
              braintreeFailureCount: 0,
            })
            .where(eq(tenants.id, tenantId));

          await logSubscriptionEventTx(tx, tenantId, 'subscription_charged', {
            subscriptionId: subscription.id,
            planId: subscription.planId,
            planLevel: getPlanLevelFromPlanId(subscription.planId) || undefined,
            status: 'success',
            amountCents: subscription.price ? Math.round(parseFloat(subscription.price) * 100) : undefined,
            processorEventId: timestamp?.toString(),
            triggeredBy: 'webhook',
          });
        });

        console.log(`✅ Subscription ${subscription.id} charged successfully`);
        break;
      }

      case WEBHOOK_KINDS.SUBSCRIPTION_CHARGED_UNSUCCESSFULLY: {
        if (!subscription) break;
        
        const tenantId = await findTenantByBraintreeSubscription(subscription.id);
        if (!tenantId) break;

        await db.transaction(async (tx) => {
          const [currentTenant] = await tx.select({ failureCount: tenants.braintreeFailureCount })
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

          const newFailureCount = (currentTenant?.failureCount || 0) + 1;
          
          await tx.update(tenants)
            .set({
              braintreeStatus: newFailureCount >= 3 ? 'past_due' : 'active',
              braintreeLastFailureAt: new Date(),
              braintreeFailureCount: newFailureCount,
            })
            .where(eq(tenants.id, tenantId));

          await logSubscriptionEventTx(tx, tenantId, 'subscription_charge_failed', {
            subscriptionId: subscription.id,
            planId: subscription.planId,
            planLevel: getPlanLevelFromPlanId(subscription.planId) || undefined,
            status: 'failed',
            processorEventId: timestamp?.toString(),
            triggeredBy: 'webhook',
            metadata: { failureCount: newFailureCount },
          });

          console.log(`❌ Subscription ${subscription.id} charge failed (attempt ${newFailureCount})`);
        });
        break;
      }

      case WEBHOOK_KINDS.SUBSCRIPTION_CANCELED: {
        if (!subscription) break;
        
        const tenantId = await findTenantByBraintreeSubscription(subscription.id);
        if (!tenantId) break;

        await db.transaction(async (tx) => {
          const [currentTenant] = await tx.select({ planLevel: tenants.planLevel })
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

          await tx.update(tenants)
            .set({
              braintreeStatus: 'canceled',
              planLevel: 'free',
              lastPlanChangeAt: new Date(),
              lastPlanLevel: currentTenant?.planLevel as any,
            })
            .where(eq(tenants.id, tenantId));

          await logSubscriptionEventTx(tx, tenantId, 'subscription_canceled', {
            subscriptionId: subscription.id,
            planLevel: 'free',
            previousPlanLevel: currentTenant?.planLevel as any,
            status: 'success',
            processorEventId: timestamp?.toString(),
            triggeredBy: 'webhook',
          });
        });

        clearCapabilitiesCache(tenantId);
        console.log(`🚫 Subscription ${subscription.id} canceled`);
        break;
      }

      case WEBHOOK_KINDS.SUBSCRIPTION_EXPIRED: {
        if (!subscription) break;
        
        const tenantId = await findTenantByBraintreeSubscription(subscription.id);
        if (!tenantId) break;

        await db.transaction(async (tx) => {
          const [currentTenant] = await tx.select({ planLevel: tenants.planLevel })
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

          await tx.update(tenants)
            .set({
              braintreeStatus: 'expired',
              planLevel: 'free',
              lastPlanChangeAt: new Date(),
              lastPlanLevel: currentTenant?.planLevel as any,
            })
            .where(eq(tenants.id, tenantId));

          await logSubscriptionEventTx(tx, tenantId, 'subscription_expired', {
            subscriptionId: subscription.id,
            planLevel: 'free',
            previousPlanLevel: currentTenant?.planLevel as any,
            status: 'success',
            processorEventId: timestamp?.toString(),
            triggeredBy: 'webhook',
          });
        });

        clearCapabilitiesCache(tenantId);
        console.log(`⏰ Subscription ${subscription.id} expired`);
        break;
      }

      case WEBHOOK_KINDS.SUBSCRIPTION_WENT_ACTIVE: {
        if (!subscription) break;
        
        const tenantId = await findTenantByBraintreeSubscription(subscription.id);
        if (!tenantId) break;

        const planLevel = getPlanLevelFromPlanId(subscription.planId);

        await db.transaction(async (tx) => {
          await tx.update(tenants)
            .set({
              braintreeStatus: 'active',
              braintreeNextBillingDate: subscription.nextBillingDate 
                ? new Date(subscription.nextBillingDate) 
                : null,
              ...(planLevel && { planLevel }),
            })
            .where(eq(tenants.id, tenantId));

          await logSubscriptionEventTx(tx, tenantId, 'subscription_activated', {
            subscriptionId: subscription.id,
            planId: subscription.planId,
            planLevel: planLevel || undefined,
            status: 'success',
            processorEventId: timestamp?.toString(),
            triggeredBy: 'webhook',
          });
        });

        if (planLevel) {
          clearCapabilitiesCache(tenantId);
        }

        console.log(`✅ Subscription ${subscription.id} went active`);
        break;
      }

      case WEBHOOK_KINDS.SUBSCRIPTION_WENT_PAST_DUE: {
        if (!subscription) break;
        
        const tenantId = await findTenantByBraintreeSubscription(subscription.id);
        if (!tenantId) break;

        await db.transaction(async (tx) => {
          await tx.update(tenants)
            .set({
              braintreeStatus: 'past_due',
            })
            .where(eq(tenants.id, tenantId));

          await logSubscriptionEventTx(tx, tenantId, 'subscription_past_due', {
            subscriptionId: subscription.id,
            planId: subscription.planId,
            planLevel: getPlanLevelFromPlanId(subscription.planId) || undefined,
            status: 'failed',
            processorEventId: timestamp?.toString(),
            triggeredBy: 'webhook',
          });
        });

        console.log(`⚠️ Subscription ${subscription.id} went past due`);
        break;
      }

      case WEBHOOK_KINDS.DISPUTE_OPENED: {
        const dispute = notification.dispute;
        if (!dispute) break;

        const transaction = dispute.transaction;
        if (!transaction?.subscriptionId) break;

        const tenantId = await findTenantByBraintreeSubscription(transaction.subscriptionId);
        if (!tenantId) break;

        await logSubscriptionEvent(tenantId, 'dispute_opened', {
          subscriptionId: transaction.subscriptionId,
          status: 'pending',
          amountCents: dispute.amount ? Math.round(parseFloat(dispute.amount) * 100) : undefined,
          processorEventId: dispute.id,
          triggeredBy: 'webhook',
          metadata: {
            disputeId: dispute.id,
            reason: dispute.reason,
            caseNumber: dispute.caseNumber,
          },
        });

        console.log(`⚖️ Dispute opened: ${dispute.id}`);
        break;
      }

      case WEBHOOK_KINDS.DISPUTE_WON: {
        const dispute = notification.dispute;
        if (!dispute?.transaction?.subscriptionId) break;

        const tenantId = await findTenantByBraintreeSubscription(dispute.transaction.subscriptionId);
        if (!tenantId) break;

        await logSubscriptionEvent(tenantId, 'dispute_won', {
          subscriptionId: dispute.transaction.subscriptionId,
          status: 'success',
          processorEventId: dispute.id,
          triggeredBy: 'webhook',
        });

        console.log(`✅ Dispute won: ${dispute.id}`);
        break;
      }

      case WEBHOOK_KINDS.DISPUTE_LOST: {
        const dispute = notification.dispute;
        if (!dispute?.transaction?.subscriptionId) break;

        const tenantId = await findTenantByBraintreeSubscription(dispute.transaction.subscriptionId);
        if (!tenantId) break;

        await logSubscriptionEvent(tenantId, 'dispute_lost', {
          subscriptionId: dispute.transaction.subscriptionId,
          status: 'failed',
          processorEventId: dispute.id,
          triggeredBy: 'webhook',
        });

        console.log(`❌ Dispute lost: ${dispute.id}`);
        break;
      }

      default:
        console.log(`📬 Unhandled Braintree webhook kind: ${kind}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Braintree webhook error:', error);
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'braintree-webhooks',
    enabled: isBraintreeEnabled(),
  });
});

export const braintreeWebhookRouter = router;
