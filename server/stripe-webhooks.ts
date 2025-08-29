import express from 'express';
import Stripe from 'stripe';
import { db } from './db';
import { tenants, subscriptions, tenantPlanAssignments } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { clearCapabilitiesCache } from './middleware/featureAccess';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  // Stripe webhook verification disabled
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

const router = express.Router();

// Test endpoint to verify route mounting
router.get('/test', (req, res) => {
  res.json({ message: 'Stripe routes are working' });
});

// Webhook endpoint for Stripe events (raw body middleware is already applied in index.ts)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err}`);
  }


  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          try {
            // Try to find tenant by client_reference_id first (most reliable)
            let tenantId = session.client_reference_id;
            console.log(`Checkout session tenant identification - client_reference_id: ${tenantId}, metadata: ${JSON.stringify(session.metadata)}`);

            // If no client_reference_id, try metadata as backup
            if (!tenantId || tenantId === 'unknown') {
              tenantId = session.metadata?.tenantId || null;
              console.log(`Using metadata tenantId: ${tenantId}`);
            }

            // If still no tenant ID, try to find by existing customer ID
            if (!tenantId) {
              const existingTenant = await db.select({ id: tenants.id })
                .from(tenants)
                .where(eq(tenants.stripeCustomerId, customerId))
                .limit(1);

              if (existingTenant.length > 0) {
                tenantId = existingTenant[0].id;
                console.log(`Found tenant by customer ID: ${tenantId}`);
              } else {
                console.log(`⚠️ Could not identify tenant for customer ${customerId} - no client_reference_id, metadata, or existing customer match`);
              }
            }

            // Determine plan from success URL or amount
            let planLevel: string | null = null;
            if (session.success_url && session.success_url.includes('plan=')) {
              const urlParams = new URL(session.success_url);
              planLevel = urlParams.searchParams.get('plan');
              console.log(`Plan level from success URL: ${planLevel}`);
            } else if (session.amount_total) {
              // Fallback: determine plan from amount
              const amountInCents = session.amount_total;
              if (amountInCents === 9900) planLevel = 'core';      // $99
              else if (amountInCents === 19900) planLevel = 'growth';   // $199
              else if (amountInCents === 49900) planLevel = 'elite';    // $499
              console.log(`Plan level from amount ${amountInCents}: ${planLevel}`);
            }

            // Try to get subscription details for additional validation (but don't fail if it doesn't exist)
            let subscriptionStatus = 'active';
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              const stripePlanLevel = getPlanLevelFromPrice(subscription.items.data[0]?.price?.id);
              if (stripePlanLevel) {
                planLevel = stripePlanLevel; // Use Stripe plan level if available
                console.log(`Plan level from Stripe subscription: ${planLevel}`);
              }
              subscriptionStatus = subscription.status === 'active' ? 'active' : 'inactive';
            } catch (subscriptionError) {
              console.log(`Note: Could not retrieve subscription ${subscriptionId} from Stripe, using URL/amount fallback`);
            }

            // Update tenant plan if we have both tenant ID and plan level
            if (tenantId && planLevel) {
              await db.transaction(async (tx) => {
                // Update tenant
                await tx.update(tenants)
                  .set({
                    planLevel: planLevel as any,
                    stripeSubscriptionId: subscriptionId,
                    stripeCustomerId: customerId,
                  })
                  .where(eq(tenants.id, tenantId));

                // Update subscriptions table
                await tx.insert(subscriptions)
                  .values({
                    tenantId,
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscriptionId,
                    planKey: planLevel,
                    status: subscriptionStatus,
                  })
                  .onConflictDoUpdate({
                    target: subscriptions.tenantId,
                    set: {
                      stripeCustomerId: customerId,
                      stripeSubscriptionId: subscriptionId,
                      planKey: planLevel,
                      status: subscriptionStatus,
                      updatedAt: new Date(),
                    },
                  });

                // Update tenant_plan_assignments
                // End current assignment
                await tx.update(tenantPlanAssignments)
                  .set({ until: new Date() })
                  .where(
                    eq(tenantPlanAssignments.tenantId, tenantId)
                  );

                // Create new assignment
                await tx.insert(tenantPlanAssignments)
                  .values({
                    tenantId,
                    planCode: planLevel,
                    since: new Date(),
                  });
              });

              // Clear capabilities cache for this tenant
              clearCapabilitiesCache(tenantId);
              
              console.log(`✅ Updated tenant ${tenantId} to ${planLevel} plan via webhook - Customer: ${customerId}, Subscription: ${subscriptionId}`);
            } else {
              console.log(`⚠️ Could not update tenant: tenantId=${tenantId}, planLevel=${planLevel}, customer=${customerId}`);
            }
          } catch (error) {
            console.error('Error processing checkout session:', error);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Log payment success for monitoring
        console.log('Payment succeeded for invoice:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        break;
      }

      default:
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).send('Webhook processing error');
  }

  res.json({ received: true });
});

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const planLevel = getPlanLevelFromPrice(subscription.items.data[0]?.price?.id);
  
  console.log(`🔄 Processing subscription update - Customer: ${customerId}, Price: ${subscription.items.data[0]?.price?.id}, Plan: ${planLevel}`);

  if (!planLevel) {
    console.log(`⚠️ No plan level found for price ID: ${subscription.items.data[0]?.price?.id}`);
    return;
  }

  // Find tenant by Stripe customer ID
  const tenant = await db.select()
    .from(tenants)
    .where(eq(tenants.stripeCustomerId, customerId))
    .limit(1);

  if (tenant.length === 0) {
    console.log(`⚠️ No tenant found for customer ID: ${customerId}`);
    return;
  }
  
  console.log(`✅ Found tenant: ${tenant[0].id} for customer: ${customerId}`);

  const status = subscription.status === 'active' ? 'active' : 'inactive';

  // Update tenant and subscription record
  await db.transaction(async (tx) => {
    await tx.update(tenants)
      .set({
        planLevel: planLevel as any,
        stripeSubscriptionId: subscription.id,
      })
      .where(eq(tenants.id, tenant[0].id));

    await tx.insert(subscriptions)
      .values({
        tenantId: tenant[0].id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        planKey: planLevel,
        status,
      })
      .onConflictDoUpdate({
        target: subscriptions.tenantId,
        set: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          planKey: planLevel,
          status,
          updatedAt: new Date(),
        },
      });

    // Update tenant_plan_assignments
    await tx.update(tenantPlanAssignments)
      .set({ until: new Date() })
      .where(
        eq(tenantPlanAssignments.tenantId, tenant[0].id)
      );

    await tx.insert(tenantPlanAssignments)
      .values({
        tenantId: tenant[0].id,
        planCode: planLevel,
        since: new Date(),
      });
  });

  // Clear capabilities cache
  clearCapabilitiesCache(tenant[0].id);

}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find tenant by Stripe customer ID
  const tenant = await db.select()
    .from(tenants)
    .where(eq(tenants.stripeCustomerId, customerId))
    .limit(1);

  if (tenant.length === 0) {
    return;
  }

  // Reset tenant to core plan and mark subscription canceled
  await db.transaction(async (tx) => {
    await tx.update(tenants)
      .set({
        planLevel: 'core', // Default back to core instead of free for cancellations
        stripeSubscriptionId: null,
      })
      .where(eq(tenants.id, tenant[0].id));

    await tx.update(subscriptions)
      .set({
        status: 'canceled',
        planKey: 'core',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.tenantId, tenant[0].id));

    // Update tenant_plan_assignments
    await tx.update(tenantPlanAssignments)
      .set({ until: new Date() })
      .where(
        eq(tenantPlanAssignments.tenantId, tenant[0].id)
      );

    await tx.insert(tenantPlanAssignments)
      .values({
        tenantId: tenant[0].id,
        planCode: 'core',
        since: new Date(),
      });
  });

  // Clear capabilities cache
  clearCapabilitiesCache(tenant[0].id);

}

function getPlanLevelFromPrice(priceId?: string): string | null {
  // Map Stripe price IDs to plan levels - Update these with your actual Stripe price IDs
  const priceMap: Record<string, string> = {
    // Test mode price IDs (keeping for development)
    'price_1QHMGtKA9oSeqOY8hkI2lPGj': 'core',    // Core $99/mo test
    'price_1QHMHoKA9oSeqOY8O8rZJz0X': 'growth',  // Growth $199/mo test
    'price_1QHMIbKA9oSeqOY8qWnMpJeQ': 'elite',   // Elite $499/mo test
    // Production price IDs - REPLACE WITH YOUR ACTUAL PRODUCTION PRICE IDs
    'price_PROD_CORE_REPLACE_ME': 'core',        // Your Core $99/mo prod price ID
    'price_PROD_GROWTH_REPLACE_ME': 'growth',    // Your Growth $199/mo prod price ID
    'price_PROD_ELITE_REPLACE_ME': 'elite',      // Your Elite $499/mo prod price ID
  };

  return priceMap[priceId || ''] || null;
}

export { router as stripeWebhookRouter };