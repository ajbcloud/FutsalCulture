import express from 'express';
import Stripe from 'stripe';
import { db } from './db';
import { tenants, payments } from '../shared/schema';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn('STRIPE_WEBHOOK_SECRET not set - webhook verification disabled');
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
    console.log('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  console.log('Received Stripe webhook:', event.type);

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
                
              console.log(`✅ Updated tenant ${tenantId} to ${planLevel} plan via checkout`);
            } else {
              console.log(`⚠️  Could not determine plan level from price ID: ${subscription.items.data[0]?.price?.id}`);
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
                
              console.log(`🧪 DEV MODE: Updated tenant ${tenantId} to core plan`);
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', invoice.id);
        break;
      }

      // Handle payment intent updates for session payments
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentUpdate(paymentIntent, event.type);
        break;
      }

      // Handle charge updates
      case 'charge.succeeded':
      case 'charge.failed':
      case 'charge.dispute.created': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeUpdate(charge, event.type);
        break;
      }

      // Handle refund events
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefundUpdate(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
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
    console.log('Unknown price ID, cannot determine plan level');
    return;
  }

  // Find tenant by Stripe customer ID
  const tenant = await db.select()
    .from(tenants)
    .where(eq(tenants.stripeCustomerId, customerId))
    .limit(1);

  if (tenant.length === 0) {
    console.log('No tenant found for customer:', customerId);
    return;
  }

  // Update tenant with new subscription info
  await db.update(tenants)
    .set({
      planLevel: planLevel as any,
      stripeSubscriptionId: subscription.id,
    })
    .where(eq(tenants.id, tenant[0].id));

  console.log(`Updated tenant ${tenant[0].id} to ${planLevel} plan`);
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find tenant by Stripe customer ID
  const tenant = await db.select()
    .from(tenants)
    .where(eq(tenants.stripeCustomerId, customerId))
    .limit(1);

  if (tenant.length === 0) {
    console.log('No tenant found for customer:', customerId);
    return;
  }

  // Reset tenant to free plan
  await db.update(tenants)
    .set({
      planLevel: 'core', // Default back to core instead of free for cancellations
      stripeSubscriptionId: null,
    })
    .where(eq(tenants.id, tenant[0].id));

  console.log(`Reset tenant ${tenant[0].id} to core plan after cancellation`);
}

// Handle payment intent updates
async function handlePaymentIntentUpdate(paymentIntent: Stripe.PaymentIntent, eventType: string) {
  try {
    const payment = await db.select()
      .from(payments)
      .where(eq(payments.processorPaymentId, paymentIntent.id))
      .limit(1);

    if (!payment.length) {
      console.log(`No payment record found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    const paymentRecord = payment[0];
    let newStatus = paymentRecord.status;
    let updateData: any = {
      updatedAt: new Date(),
      meta: {
        ...paymentRecord.meta,
        webhookUpdate: {
          eventType: eventType,
          timestamp: new Date(),
          paymentIntent: paymentIntent
        }
      }
    };

    switch (eventType) {
      case 'payment_intent.succeeded':
        newStatus = 'paid';
        updateData.capturedAt = new Date();
        break;
      case 'payment_intent.payment_failed':
        newStatus = 'failed';
        break;
      case 'payment_intent.canceled':
        newStatus = 'voided';
        updateData.voided_at = new Date();
        break;
    }

    updateData.status = newStatus;

    await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, paymentRecord.id));

    console.log(`Updated payment ${paymentRecord.id} status to ${newStatus} via PaymentIntent webhook`);
  } catch (error) {
    console.error('Error handling PaymentIntent update:', error);
  }
}

// Handle charge updates
async function handleChargeUpdate(charge: Stripe.Charge, eventType: string) {
  try {
    const payment = await db.select()
      .from(payments)
      .where(eq(payments.processorPaymentId, charge.id))
      .limit(1);

    if (!payment.length) {
      console.log(`No payment record found for Charge: ${charge.id}`);
      return;
    }

    const paymentRecord = payment[0];
    let newStatus = paymentRecord.status;
    let updateData: any = {
      updatedAt: new Date(),
      meta: {
        ...paymentRecord.meta,
        webhookUpdate: {
          eventType: eventType,
          timestamp: new Date(),
          charge: charge
        }
      }
    };

    switch (eventType) {
      case 'charge.succeeded':
        newStatus = 'paid';
        updateData.capturedAt = new Date();
        break;
      case 'charge.failed':
        newStatus = 'failed';
        break;
      case 'charge.dispute.created':
        console.log(`Dispute created for charge ${charge.id}`);
        break;
    }

    updateData.status = newStatus;

    await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, paymentRecord.id));

    console.log(`Updated payment ${paymentRecord.id} status to ${newStatus} via Charge webhook`);
  } catch (error) {
    console.error('Error handling Charge update:', error);
  }
}

// Handle refund updates
async function handleRefundUpdate(charge: Stripe.Charge) {
  try {
    const payment = await db.select()
      .from(payments)
      .where(eq(payments.processorPaymentId, charge.id))
      .limit(1);

    if (!payment.length) {
      console.log(`No payment record found for Charge: ${charge.id}`);
      return;
    }

    const paymentRecord = payment[0];
    const refundAmountCents = charge.amount_refunded || 0;
    const isFullRefund = refundAmountCents >= paymentRecord.amountCents;

    const updateData: any = {
      status: isFullRefund ? 'refunded' : 'partial_refunded',
      refundAmountCents: refundAmountCents,
      refundedAt: new Date(),
      updatedAt: new Date(),
      meta: {
        ...paymentRecord.meta,
        webhookRefundUpdate: {
          timestamp: new Date(),
          refunds: charge.refunds?.data || [],
          amountRefunded: refundAmountCents
        }
      }
    };

    await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, paymentRecord.id));

    console.log(`Updated payment ${paymentRecord.id} refund amount to ${refundAmountCents} cents`);
  } catch (error) {
    console.error('Error handling refund update:', error);
  }
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