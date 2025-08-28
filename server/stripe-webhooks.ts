import express from 'express';
import Stripe from 'stripe';
import { db } from './db';
import { tenants } from '../shared/schema';
import { eq } from 'drizzle-orm';

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

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
            // Get subscription details to determine plan
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const planLevel = getPlanLevelFromPrice(subscription.items.data[0]?.price?.id);
            
            if (planLevel) {
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
                  .where(eq(tenants.stripe_customer_id, customerId))
                  .limit(1);
                
                if (existingTenant.length > 0) {
                  tenantId = existingTenant[0].id;
                  console.log(`Found tenant by customer ID: ${tenantId}`);
                } else {
                  console.log(`⚠️ Could not identify tenant for customer ${customerId} - no client_reference_id, metadata, or existing customer match`);
                }
              }
              
              // Update tenant plan
              if (tenantId) {
                await db.update(tenants)
                  .set({
                    plan_level: planLevel as any,
                    stripe_subscription_id: subscriptionId,
                    stripe_customer_id: customerId,
                  })
                  .where(eq(tenants.id, tenantId));
                  
                console.log(`✅ Updated tenant ${tenantId} to ${planLevel} plan via webhook - Customer: ${customerId}`);
              } else {
                console.log(`⚠️ Could not identify tenant for customer ${customerId}`);
              }
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

  if (!planLevel) {
    return;
  }

  // Find tenant by Stripe customer ID
  const tenant = await db.select()
    .from(tenants)
    .where(eq(tenants.stripe_customer_id, customerId))
    .limit(1);

  if (tenant.length === 0) {
    return;
  }

  // Update tenant with new subscription info
  await db.update(tenants)
    .set({
      plan_level: planLevel as any,
      stripe_subscription_id: subscription.id,
    })
    .where(eq(tenants.id, tenant[0].id));

}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find tenant by Stripe customer ID
  const tenant = await db.select()
    .from(tenants)
    .where(eq(tenants.stripe_customer_id, customerId))
    .limit(1);

  if (tenant.length === 0) {
    return;
  }

  // Reset tenant to free plan
  await db.update(tenants)
    .set({
      plan_level: 'core', // Default back to core instead of free for cancellations
      stripe_subscription_id: null,
    })
    .where(eq(tenants.id, tenant[0].id));

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