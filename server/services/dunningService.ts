import { db } from '../db';
import { tenants, dunningEvents, tenantInvoices, auditEvents } from '@shared/schema';
import { eq, and, lt, isNotNull } from 'drizzle-orm';
import { sendEmailNotification, sendSmsNotification } from './notificationService';

const GRACE_PERIOD_DAYS = 10; // Total grace period (5 days + 5 days for 2 retries)
const DAYS_BETWEEN_RETRIES = 5;

export interface DunningContext {
  tenantId: string;
  subscriptionId?: string;
  transactionId?: string;
  failureReason?: string;
  attemptNumber?: number;
}

export async function handlePaymentFailed(context: DunningContext): Promise<void> {
  const { tenantId, transactionId, failureReason, attemptNumber = 1 } = context;

  console.log(`🔴 Payment failed for tenant ${tenantId}, attempt ${attemptNumber}`);

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId)
  });

  if (!tenant) {
    console.error(`Tenant ${tenantId} not found`);
    return;
  }

  const failureCount = (tenant.braintreeFailureCount || 0) + 1;
  const gracePeriodEndsAt = new Date();
  gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + GRACE_PERIOD_DAYS);

  await db.update(tenants)
    .set({
      billingStatus: 'past_due',
      braintreeStatus: 'past_due',
      braintreeFailureCount: failureCount,
      braintreeLastFailureAt: new Date(),
      gracePeriodEndsAt: gracePeriodEndsAt,
      gracePeriodReason: 'payment_failed',
      gracePeriodNotificationsSent: 0,
    })
    .where(eq(tenants.id, tenantId));

  await db.insert(auditEvents).values({
    tenantId,
    action: 'payment_failed',
    resourceType: 'subscription',
    resourceId: context.subscriptionId,
    details: {
      transactionId,
      failureReason,
      attemptNumber: failureCount,
      gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
    }
  });

  await sendPaymentFailedNotification(tenant, failureCount, gracePeriodEndsAt);
}

export async function handlePaymentRetryFailed(context: DunningContext): Promise<void> {
  const { tenantId, transactionId, failureReason } = context;

  console.log(`🔴 Payment retry failed for tenant ${tenantId}`);

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId)
  });

  if (!tenant) {
    console.error(`Tenant ${tenantId} not found`);
    return;
  }

  const failureCount = (tenant.braintreeFailureCount || 0) + 1;
  const daysRemaining = tenant.gracePeriodEndsAt 
    ? Math.max(0, Math.ceil((new Date(tenant.gracePeriodEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  await db.update(tenants)
    .set({
      braintreeFailureCount: failureCount,
      braintreeLastFailureAt: new Date(),
      gracePeriodNotificationsSent: (tenant.gracePeriodNotificationsSent || 0) + 1,
    })
    .where(eq(tenants.id, tenantId));

  await db.insert(auditEvents).values({
    tenantId,
    action: 'payment_retry_failed',
    resourceType: 'subscription',
    details: {
      transactionId,
      failureReason,
      attemptNumber: failureCount,
      daysRemaining,
    }
  });

  await sendRetryFailedNotification(tenant, failureCount, daysRemaining);
}

export async function handlePaymentSucceeded(context: DunningContext): Promise<void> {
  const { tenantId, transactionId } = context;

  console.log(`✅ Payment succeeded for tenant ${tenantId}`);

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId)
  });

  if (!tenant) {
    console.error(`Tenant ${tenantId} not found`);
    return;
  }

  const wasInDunning = tenant.billingStatus === 'past_due' || tenant.braintreeStatus === 'past_due';

  await db.update(tenants)
    .set({
      billingStatus: 'active',
      braintreeStatus: 'active',
      braintreeFailureCount: 0,
      braintreeLastFailureAt: null,
      braintreeLastChargeAt: new Date(),
      gracePeriodEndsAt: null,
      gracePeriodReason: null,
      gracePeriodNotificationsSent: 0,
    })
    .where(eq(tenants.id, tenantId));

  await db.insert(auditEvents).values({
    tenantId,
    action: 'payment_succeeded',
    resourceType: 'subscription',
    details: {
      transactionId,
      wasInDunning,
    }
  });

  if (wasInDunning) {
    await sendPaymentRecoveredNotification(tenant);
  }
}

export async function handleSubscriptionCanceled(context: DunningContext): Promise<void> {
  const { tenantId, subscriptionId } = context;

  console.log(`❌ Subscription canceled for tenant ${tenantId}`);

  await db.update(tenants)
    .set({
      billingStatus: 'cancelled',
      braintreeStatus: 'canceled',
      braintreeSubscriptionId: null,
    })
    .where(eq(tenants.id, tenantId));

  await db.insert(auditEvents).values({
    tenantId,
    action: 'subscription_canceled',
    resourceType: 'subscription',
    resourceId: subscriptionId,
    details: {}
  });
}

export async function handleGracePeriodExpired(tenantId: string): Promise<void> {
  console.log(`🚫 Grace period expired for tenant ${tenantId}`);

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId)
  });

  if (!tenant) {
    console.error(`Tenant ${tenantId} not found`);
    return;
  }

  await db.update(tenants)
    .set({
      billingStatus: 'past_due',
    })
    .where(eq(tenants.id, tenantId));

  await db.insert(auditEvents).values({
    tenantId,
    action: 'access_blocked',
    resourceType: 'tenant',
    details: {
      reason: 'grace_period_expired',
      failureCount: tenant.braintreeFailureCount,
    }
  });

  await sendAccountLockedNotification(tenant);
}

export async function checkExpiredGracePeriods(): Promise<void> {
  const now = new Date();
  
  const expiredTenants = await db.query.tenants.findMany({
    where: and(
      eq(tenants.billingStatus, 'past_due'),
      isNotNull(tenants.gracePeriodEndsAt),
      lt(tenants.gracePeriodEndsAt, now)
    )
  });

  for (const tenant of expiredTenants) {
    await handleGracePeriodExpired(tenant.id);
  }

  if (expiredTenants.length > 0) {
    console.log(`Processed ${expiredTenants.length} expired grace periods`);
  }
}

export function isAccessBlocked(tenant: { 
  billingStatus: string | null; 
  gracePeriodEndsAt: Date | null;
}): boolean {
  if (tenant.billingStatus !== 'past_due') {
    return false;
  }
  
  if (!tenant.gracePeriodEndsAt) {
    return false;
  }
  
  return new Date(tenant.gracePeriodEndsAt) < new Date();
}

export function getGracePeriodInfo(tenant: {
  billingStatus: string | null;
  gracePeriodEndsAt: Date | null;
  gracePeriodReason: string | null;
}): { 
  isInGracePeriod: boolean; 
  daysRemaining: number; 
  reason: string | null;
  isBlocked: boolean;
} {
  if (tenant.billingStatus !== 'past_due' || !tenant.gracePeriodEndsAt) {
    return { 
      isInGracePeriod: false, 
      daysRemaining: 0, 
      reason: null,
      isBlocked: false 
    };
  }

  const gracePeriodEnd = new Date(tenant.gracePeriodEndsAt);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isBlocked = gracePeriodEnd < now;

  return {
    isInGracePeriod: !isBlocked,
    daysRemaining,
    reason: tenant.gracePeriodReason,
    isBlocked,
  };
}

async function sendPaymentFailedNotification(
  tenant: { id: string; name: string; contactEmail: string | null; contactName: string | null },
  attemptNumber: number,
  gracePeriodEndsAt: Date
): Promise<void> {
  const daysRemaining = Math.ceil((gracePeriodEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (!tenant.contactEmail) {
    console.warn(`No contact email for tenant ${tenant.id}`);
    return;
  }

  try {
    await sendEmailNotification({
      to: tenant.contactEmail,
      subject: `Action Required: Payment Failed for ${tenant.name}`,
      templateKey: 'payment_failed',
      context: {
        tenantName: tenant.name,
        contactName: tenant.contactName || 'Admin',
        attemptNumber,
        daysRemaining,
        updatePaymentUrl: `${process.env.APP_URL || 'https://playhq.replit.app'}/admin/billing`,
      }
    });
    console.log(`✉️ Sent payment failed email to ${tenant.contactEmail}`);
  } catch (error) {
    console.error(`Failed to send payment failed notification:`, error);
  }
}

async function sendRetryFailedNotification(
  tenant: { id: string; name: string; contactEmail: string | null; contactName: string | null },
  attemptNumber: number,
  daysRemaining: number
): Promise<void> {
  if (!tenant.contactEmail) {
    console.warn(`No contact email for tenant ${tenant.id}`);
    return;
  }

  try {
    await sendEmailNotification({
      to: tenant.contactEmail,
      subject: `Urgent: Payment Retry Failed - ${daysRemaining} Days to Update Payment`,
      templateKey: 'payment_retry_failed',
      context: {
        tenantName: tenant.name,
        contactName: tenant.contactName || 'Admin',
        attemptNumber,
        daysRemaining,
        updatePaymentUrl: `${process.env.APP_URL || 'https://playhq.replit.app'}/admin/billing`,
      }
    });
    console.log(`✉️ Sent retry failed email to ${tenant.contactEmail}`);
  } catch (error) {
    console.error(`Failed to send retry failed notification:`, error);
  }
}

async function sendAccountLockedNotification(
  tenant: { id: string; name: string; contactEmail: string | null; contactName: string | null }
): Promise<void> {
  if (!tenant.contactEmail) {
    console.warn(`No contact email for tenant ${tenant.id}`);
    return;
  }

  try {
    await sendEmailNotification({
      to: tenant.contactEmail,
      subject: `Account Locked: ${tenant.name} - Immediate Action Required`,
      templateKey: 'account_locked',
      context: {
        tenantName: tenant.name,
        contactName: tenant.contactName || 'Admin',
        updatePaymentUrl: `${process.env.APP_URL || 'https://playhq.replit.app'}/admin/billing`,
      }
    });
    console.log(`✉️ Sent account locked email to ${tenant.contactEmail}`);
  } catch (error) {
    console.error(`Failed to send account locked notification:`, error);
  }
}

async function sendPaymentRecoveredNotification(
  tenant: { id: string; name: string; contactEmail: string | null; contactName: string | null }
): Promise<void> {
  if (!tenant.contactEmail) {
    console.warn(`No contact email for tenant ${tenant.id}`);
    return;
  }

  try {
    await sendEmailNotification({
      to: tenant.contactEmail,
      subject: `Payment Successful - ${tenant.name} Access Restored`,
      templateKey: 'payment_recovered',
      context: {
        tenantName: tenant.name,
        contactName: tenant.contactName || 'Admin',
        dashboardUrl: `${process.env.APP_URL || 'https://playhq.replit.app'}/admin/dashboard`,
      }
    });
    console.log(`✉️ Sent payment recovered email to ${tenant.contactEmail}`);
  } catch (error) {
    console.error(`Failed to send payment recovered notification:`, error);
  }
}

export async function retryPaymentNow(tenantId: string): Promise<{ success: boolean; error?: string }> {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId)
  });

  if (!tenant) {
    return { success: false, error: 'Tenant not found' };
  }

  if (!tenant.braintreeSubscriptionId) {
    return { success: false, error: 'No active subscription found' };
  }

  try {
    const { getGateway } = await import('./braintreeService');
    const gateway = getGateway();

    if (!gateway) {
      return { success: false, error: 'Payment gateway not available' };
    }

    const result = await gateway.subscription.retryCharge(
      tenant.braintreeSubscriptionId,
      undefined,
      true
    ) as any;

    if (result.success) {
      await handlePaymentSucceeded({ tenantId, transactionId: result.transaction?.id as string });
      return { success: true };
    } else {
      return { success: false, error: result.message || 'Payment retry failed' };
    }
  } catch (error) {
    console.error('Error retrying payment:', error);
    return { success: false, error: 'Failed to retry payment' };
  }
}
