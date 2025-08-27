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
  apiVersion: '2025-06-30.basil',
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
        if (session.mode === 'subscription' && session.client_reference_id) {
          // Update tenant based on client_reference_id (tenant ID)
          const tenantId = session.client_reference_id;
          const subscriptionId = session.subscription as string;
          
          try {
            // Get subscription details to determine plan
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const planLevel = getPlanLevelFromPrice(subscription.items.data[0]?.price?.id);
            
            if (planLevel) {
              await db.update(tenants)
                .set({
                  planLevel: planLevel as any,
                  stripeSubscriptionId: subscriptionId,
                  stripeCustomerId: session.customer as string,
                })
                .where(eq(tenants.id, tenantId));
                
            } else {
            }
          } catch (error) {
            console.error('Error processing checkout session:', error);
            // For development, assume it's a core plan if we can't retrieve the subscription
            if (process.env.NODE_ENV === 'development') {
              await db.update(tenants)
                .set({
                  planLevel: 'core' as any,
                  stripeSubscriptionId: subscriptionId,
                  stripeCustomerId: session.customer as string,
                })
                .where(eq(tenants.id, tenantId));
                
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
        }
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
    .where(eq(tenants.stripeCustomerId, customerId))
    .limit(1);

  if (tenant.length === 0) {
    return;
  }

  // Update tenant with new subscription info
  await db.update(tenants)
    .set({
      planLevel: planLevel as any,
      stripeSubscriptionId: subscription.id,
    })
    .where(eq(tenants.id, tenant[0].id));

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

  // Reset tenant to free plan
  await db.update(tenants)
    .set({
      planLevel: 'core', // Default back to core instead of free for cancellations
      stripeSubscriptionId: null,
    })
    .where(eq(tenants.id, tenant[0].id));

}

function getPlanLevelFromPrice(priceId?: string): string | null {
  // Map Stripe price IDs to plan levels - Update these with your actual Stripe price IDs
  const priceMap: Record<string, string> = {
    // Test mode price IDs
    'price_1QHMGtKA9oSeqOY8hkI2lPGj': 'core',    // Core $99/mo test
    'price_1QHMHoKA9oSeqOY8O8rZJz0X': 'growth',  // Growth $199/mo test
    'price_1QHMIbKA9oSeqOY8qWnMpJeQ': 'elite',   // Elite $499/mo test
    // Production price IDs (replace with your actual IDs)
    'price_1RudiFKA9oSeqOY8BYw8Bjdk': 'elite',   // $499/mo prod
    'price_1RudiEKA9oSeqOY8Xu6NGBB7': 'growth',  // $199/mo prod
    'price_1RudiDKA9oSeqOY8R4R4R4R4': 'core',    // $99/mo prod
  };

  return priceMap[priceId || ''] || null;
}

export { router as stripeWebhookRouter };