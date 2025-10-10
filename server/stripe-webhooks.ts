import express from 'express';
import Stripe from 'stripe';
import { db } from './db';
import { tenants, subscriptions, tenantPlanAssignments } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { clearCapabilitiesCache } from './middleware/featureAccess';
import { logPlanChange, determinePlanChangeType, calculateMRR, calculateAnnualValue } from './services/planHistoryService';
import { getPlanLevelFromPriceId, getPlanLevelFromAmount } from '../lib/stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  // Stripe webhook verification disabled
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

// Helper function to map price IDs to plan levels
function getPlanLevelFromPrice(priceId: string | null | undefined): string | null {
  if (!priceId) return null;
  return getPlanLevelFromPriceId(priceId);
}

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
        console.log(`💳 Processing checkout.session.completed - Session: ${session.id}, Mode: ${session.mode}`);
        
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          try {
            // Try to find tenant by client_reference_id first (most reliable)
            let tenantId = session.client_reference_id;
            console.log(`🔍 Tenant identification - client_reference_id: ${tenantId}, metadata: ${JSON.stringify(session.metadata)}, customer: ${customerId}`);

            // If no client_reference_id, try metadata as backup
            if (!tenantId || tenantId === 'unknown') {
              tenantId = session.metadata?.tenantId || null;
              if (tenantId) {
                console.log(`📌 Using metadata.tenantId: ${tenantId}`);
              }
            }

            // If still no tenant ID, try to find by existing customer ID
            if (!tenantId) {
              const existingTenant = await db.select({ id: tenants.id })
                .from(tenants)
                .where(eq(tenants.stripeCustomerId, customerId))
                .limit(1);

              if (existingTenant.length > 0) {
                tenantId = existingTenant[0].id;
                console.log(`🔍 Found tenant by existing customer ID: ${tenantId}`);
              } else {
                console.error(`❌ CRITICAL: Could not identify tenant for customer ${customerId} - no client_reference_id, metadata, or existing customer match`);
                console.error(`❌ Session data: ${JSON.stringify({
                  id: session.id,
                  customer: customerId,
                  subscription: subscriptionId,
                  client_reference_id: session.client_reference_id,
                  metadata: session.metadata,
                })}`);
              }
            }

            // Determine plan level from subscription
            let planLevel: string | null = null;
            let subscriptionStatus = 'active';
            
            try {
              // Primary method: Get plan from subscription price ID (most reliable)
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              const priceId = subscription.items.data[0]?.price?.id;
              planLevel = getPlanLevelFromPrice(priceId);
              subscriptionStatus = subscription.status === 'active' ? 'active' : 'inactive';
              
              if (planLevel) {
                console.log(`✅ Plan level from subscription price ID: ${planLevel} (price: ${priceId})`);
              } else {
                console.log(`⚠️ Could not determine plan level from price ID: ${priceId}`);
                
                // Fallback 1: Try to get from success URL
                if (session.success_url && session.success_url.includes('plan=')) {
                  const urlParams = new URL(session.success_url);
                  const urlPlan = urlParams.searchParams.get('plan');
                  if (urlPlan && ['free', 'core', 'growth', 'elite'].includes(urlPlan)) {
                    planLevel = urlPlan;
                    console.log(`📎 Plan level from success URL: ${planLevel}`);
                  }
                }
                
                // Fallback 2: Try to get from amount
                if (!planLevel && session.amount_total) {
                  const amountPlan = getPlanLevelFromAmount(session.amount_total);
                  if (amountPlan) {
                    planLevel = amountPlan;
                    console.log(`💰 Plan level from amount (${session.amount_total} cents): ${planLevel}`);
                  }
                }
              }
            } catch (subscriptionError) {
              console.error(`⚠️ Could not retrieve subscription ${subscriptionId} from Stripe:`, subscriptionError);
              
              // Fallback: Try amount-based detection
              if (session.amount_total) {
                planLevel = getPlanLevelFromAmount(session.amount_total);
                if (planLevel) {
                  console.log(`💰 Using fallback - plan level from amount: ${planLevel}`);
                }
              }
            }

            // Update tenant plan if we have both tenant ID and plan level
            if (tenantId && planLevel) {
              // Get current plan before update
              const [currentTenant] = await db
                .select({ planLevel: tenants.planLevel })
                .from(tenants)
                .where(eq(tenants.id, tenantId))
                .limit(1);
              
              const oldPlan = currentTenant?.planLevel as any;
              const newPlan = planLevel as 'free' | 'core' | 'growth' | 'elite';
              
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

              // Log plan change to history
              const changeType = determinePlanChangeType(oldPlan, newPlan);
              await logPlanChange({
                tenantId,
                toPlan: newPlan,
                changeType: changeType === 'initial' ? 'trial_conversion' : changeType,
                automatedTrigger: 'stripe_checkout_completed',
                mrr: calculateMRR(newPlan),
                annualValue: calculateAnnualValue(newPlan),
                metadata: {
                  stripeSubscriptionId: subscriptionId,
                  stripeCustomerId: customerId,
                  checkoutSessionId: session.id,
                },
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
        const customerId = invoice.customer as string;
        
        // Check if there's a pending downgrade to apply
        const tenant = await db.select({
          id: tenants.id,
          pendingPlanCode: tenants.pendingPlanCode,
          pendingPlanEffectiveDate: tenants.pendingPlanEffectiveDate,
        })
        .from(tenants)
        .where(eq(tenants.stripeCustomerId, customerId))
        .limit(1);

        if (tenant.length > 0 && tenant[0].pendingPlanCode && tenant[0].pendingPlanEffectiveDate) {
          // Check if it's time to apply the downgrade
          const effectiveDate = new Date(tenant[0].pendingPlanEffectiveDate);
          if (effectiveDate <= new Date()) {
            console.log(`Applying pending downgrade for tenant ${tenant[0].id} to plan: ${tenant[0].pendingPlanCode}`);
            
            // Apply the downgrade
            await db.update(tenants)
              .set({
                planLevel: tenant[0].pendingPlanCode as any,
                pendingPlanCode: null,
                pendingPlanEffectiveDate: null,
                billingStatus: tenant[0].pendingPlanCode === 'free' ? 'cancelled' : 'active',
                lastPlanChangeAt: new Date(),
                planChangeReason: 'downgrade',
              })
              .where(eq(tenants.id, tenant[0].id));

            // Clear capabilities cache
            clearCapabilitiesCache(tenant[0].id);
            
            console.log(`✅ Downgrade applied successfully for tenant ${tenant[0].id}`);
          }
        }
        
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
  const priceId = subscription.items.data[0]?.price?.id;
  const planLevel = getPlanLevelFromPrice(priceId);
  
  console.log(`🔄 Processing subscription update - Customer: ${customerId}, Subscription: ${subscription.id}, Price: ${priceId}, Plan: ${planLevel}, Status: ${subscription.status}`);

  if (!planLevel) {
    console.log(`⚠️ No plan level found for price ID: ${priceId}. Ensure STRIPE_PRICE_FREE, STRIPE_PRICE_CORE, STRIPE_PRICE_GROWTH, STRIPE_PRICE_ELITE env vars are set.`);
    return;
  }

  // Find tenant by Stripe customer ID
  const tenant = await db.select()
    .from(tenants)
    .where(eq(tenants.stripeCustomerId, customerId))
    .limit(1);

  if (tenant.length === 0) {
    // Try to find by subscription ID as backup
    const tenantBySubscription = await db.select()
      .from(tenants)
      .where(eq(tenants.stripeSubscriptionId, subscription.id))
      .limit(1);
    
    if (tenantBySubscription.length > 0) {
      console.log(`✅ Found tenant by subscription ID: ${tenantBySubscription[0].id}`);
      tenant.push(tenantBySubscription[0]);
    } else {
      console.log(`⚠️ No tenant found for customer ID: ${customerId} or subscription ID: ${subscription.id}`);
      return;
    }
  }
  
  console.log(`✅ Found tenant: ${tenant[0].id} for customer: ${customerId}`);

  const status = subscription.status === 'active' ? 'active' : 'inactive';
  const oldPlan = tenant[0].planLevel as any;
  const newPlan = planLevel as 'free' | 'core' | 'growth' | 'elite';

  // Update tenant and subscription record
  await db.transaction(async (tx) => {
    await tx.update(tenants)
      .set({
        planLevel: planLevel as any,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        // Clear any pending plan change data since plan has been updated
        pendingPlanCode: null,
        pendingPlanEffectiveDate: null,
        // Update lastPlanChangeAt if plan changed
        lastPlanChangeAt: oldPlan !== newPlan ? new Date() : tenant[0].lastPlanChangeAt,
        billingStatus: status === 'active' ? 'active' : 'inactive',
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

  // Log plan change to history (if plan actually changed)
  if (oldPlan !== newPlan) {
    const changeType = determinePlanChangeType(oldPlan, newPlan);
    await logPlanChange({
      tenantId: tenant[0].id,
      toPlan: newPlan,
      changeType,
      automatedTrigger: 'stripe_subscription_updated',
      mrr: calculateMRR(newPlan),
      annualValue: calculateAnnualValue(newPlan),
      metadata: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        subscriptionStatus: status,
      },
    });
    
    console.log(`✅ Plan changed for tenant ${tenant[0].id}: ${oldPlan} → ${newPlan} (${changeType})`);
  } else {
    console.log(`✅ Subscription updated for tenant ${tenant[0].id}, plan remains ${planLevel}`);
  }

  // Clear capabilities cache
  clearCapabilitiesCache(tenant[0].id);
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  console.log(`🔴 Processing subscription cancellation - Customer: ${customerId}, Subscription: ${subscription.id}`);

  // Find tenant by Stripe customer ID
  const tenant = await db.select()
    .from(tenants)
    .where(eq(tenants.stripeCustomerId, customerId))
    .limit(1);

  if (tenant.length === 0) {
    // Try to find by subscription ID as backup
    const tenantBySubscription = await db.select()
      .from(tenants)
      .where(eq(tenants.stripeSubscriptionId, subscription.id))
      .limit(1);
    
    if (tenantBySubscription.length > 0) {
      console.log(`✅ Found tenant by subscription ID: ${tenantBySubscription[0].id}`);
      tenant.push(tenantBySubscription[0]);
    } else {
      console.log(`⚠️ No tenant found for customer ID: ${customerId} or subscription ID: ${subscription.id}`);
      return;
    }
  }
  
  console.log(`✅ Found tenant: ${tenant[0].id} for customer: ${customerId}`);

  const oldPlan = tenant[0].planLevel as any;
  const newPlan = 'free' as const; // Revert to free plan when subscription is deleted

  // Reset tenant to free plan and mark subscription canceled
  await db.transaction(async (tx) => {
    await tx.update(tenants)
      .set({
        planLevel: 'free', // Revert to free plan when subscription is cancelled
        stripeSubscriptionId: null, // Clear subscription ID
        billingStatus: 'cancelled',
        lastPlanChangeAt: new Date(),
        // Clear any pending plan change data
        pendingPlanCode: null,
        pendingPlanEffectiveDate: null,
      })
      .where(eq(tenants.id, tenant[0].id));

    await tx.update(subscriptions)
      .set({
        status: 'canceled',
        planKey: 'free',
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
        planCode: 'free',
        since: new Date(),
      });
  });

  // Log plan change to history
  if (oldPlan !== newPlan) {
    await logPlanChange({
      tenantId: tenant[0].id,
      toPlan: newPlan,
      changeType: 'downgrade',
      reason: 'Subscription cancelled',
      automatedTrigger: 'stripe_subscription_cancelled',
      mrr: calculateMRR(newPlan),
      annualValue: calculateAnnualValue(newPlan),
      metadata: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        cancelledAt: new Date().toISOString(),
      },
    });
    
    console.log(`✅ Tenant ${tenant[0].id} reverted to free plan after subscription cancellation`);
  }

  // Clear capabilities cache
  clearCapabilitiesCache(tenant[0].id);
}

export { router as stripeWebhookRouter };