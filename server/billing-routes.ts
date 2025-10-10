import { Router } from 'express';
import { db } from './db';
import { tenants, integrations } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { stripe, getPriceIdFromPlanLevel, getAppBaseUrl } from '../lib/stripe';
import { clearCapabilitiesCache } from './middleware/featureAccess';

const router = Router();

// Check subscription status endpoint
router.get('/billing/check-subscription', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Get tenant's subscription information
    const tenant = await db.select({
      stripeCustomerId: tenants.stripeCustomerId,
      stripeSubscriptionId: tenants.stripeSubscriptionId,
      planLevel: tenants.planLevel,
      billingStatus: tenants.billingStatus,
      lastPlanChangeAt: tenants.lastPlanChangeAt,
      pendingPlanCode: tenants.pendingPlanCode,
      pendingPlanEffectiveDate: tenants.pendingPlanEffectiveDate
    })
    .from(tenants)
    .where(eq(tenants.id, currentUser.tenantId))
    .limit(1);

    if (!tenant.length) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const tenantData = tenant[0];
    
    // Check if there's an active subscription
    let subscriptionDetails = null;
    if (tenantData.stripeSubscriptionId) {
      const { provider, credentials } = await getActivePaymentProcessor();
      
      if (provider === 'stripe') {
        try {
          const Stripe = require('stripe');
          const stripe = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });
          const subscription = await stripe.subscriptions.retrieve(tenantData.stripeSubscriptionId);
          
          subscriptionDetails = {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            priceId: subscription.items.data[0]?.price?.id,
            amount: subscription.items.data[0]?.price?.unit_amount
          };
        } catch (error) {
          console.error('Error fetching Stripe subscription:', error);
        }
      }
    }

    res.json({
      hasSubscription: !!tenantData.stripeSubscriptionId,
      hasCustomer: !!tenantData.stripeCustomerId,
      currentPlan: tenantData.planLevel,
      billingStatus: tenantData.billingStatus,
      subscription: subscriptionDetails,
      pendingPlanChange: tenantData.pendingPlanCode ? {
        plan: tenantData.pendingPlanCode,
        effectiveDate: tenantData.pendingPlanEffectiveDate
      } : null,
      canChangePlan: tenantData.lastPlanChangeAt ? 
        (Date.now() - new Date(tenantData.lastPlanChangeAt).getTime()) > (30 * 24 * 60 * 60 * 1000) : 
        true
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ message: 'Failed to check subscription status' });
  }
});

// Helper function to get active payment processor
async function getActivePaymentProcessor(): Promise<{ provider: 'stripe' | 'braintree' | null, credentials: any }> {
  try {
    // First, check for environment-based Stripe configuration
    // This ensures that if Stripe env vars are set, they take priority
    if (process.env.STRIPE_SECRET_KEY) {
      console.log('Using Stripe configuration from environment variables');
      return {
        provider: 'stripe',
        credentials: {
          secretKey: process.env.STRIPE_SECRET_KEY,
          publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLISHABLE_KEY
        }
      };
    }

    // If no environment variables, check for enabled payment processors in database (Stripe or Braintree)
    const activeProcessor = await db.select()
      .from(integrations)
      .where(and(
        eq(integrations.enabled, true),
        // Check for both stripe and braintree
        sql`${integrations.provider} IN ('stripe', 'braintree')`
      ))
      .limit(1);

    if (activeProcessor.length > 0) {
      console.log(`Using ${activeProcessor[0].provider} configuration from database integrations`);
      return {
        provider: activeProcessor[0].provider as 'stripe' | 'braintree',
        credentials: activeProcessor[0].credentials
      };
    }

    console.warn('No payment processor configured - neither environment variables nor database integrations found');
    return { provider: null, credentials: null };
  } catch (error) {
    console.error('Error getting active payment processor:', error);
    // Even if there's a database error, still check for environment variables
    if (process.env.STRIPE_SECRET_KEY) {
      console.log('Database error occurred, falling back to Stripe environment variables');
      return {
        provider: 'stripe',
        credentials: {
          secretKey: process.env.STRIPE_SECRET_KEY,
          publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLISHABLE_KEY
        }
      };
    }
    return { provider: null, credentials: null };
  }
}

// Create billing portal session
router.post('/billing/portal', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Get active payment processor
    const { provider, credentials } = await getActivePaymentProcessor();
    
    if (!provider) {
      return res.status(400).json({ message: 'No payment processor configured' });
    }

    if (provider === 'stripe') {
      // Get tenant's Stripe customer ID
      const tenant = await db.select({
        stripeCustomerId: tenants.stripeCustomerId,
        planLevel: tenants.planLevel
      })
      .from(tenants)
      .where(eq(tenants.id, currentUser.tenantId))
      .limit(1);

      if (!tenant.length || !tenant[0].stripeCustomerId) {
        return res.status(400).json({ message: 'No billing information found' });
      }

      const Stripe = require('stripe');
      const stripe = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });
      
      const session = await stripe.billingPortal.sessions.create({
        customer: tenant[0].stripeCustomerId,
        return_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : `https://${process.env.REPL_SLUG || 'your-app'}.${process.env.REPL_OWNER || 'replit'}.replit.app`}/admin/settings?tab=plans-features`,
      });

      res.json({ url: session.url });
    } else if (provider === 'braintree') {
      // Braintree doesn't have a billing portal equivalent
      // Return a message indicating they need to contact support for billing changes
      res.json({ 
        message: 'For billing changes with Braintree, please contact support.',
        contactSupport: true 
      });
    }
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ message: 'Failed to create billing portal session' });
  }
});

// Create checkout session - handles both new and existing customers
router.post('/billing/checkout', async (req: any, res) => {
  try {
    const { plan } = req.body;
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!plan || !['core', 'growth', 'elite'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Get tenant information
    const tenant = await db.select({
      stripeCustomerId: tenants.stripeCustomerId,
      stripeSubscriptionId: tenants.stripeSubscriptionId,
      lastPlanChangeAt: tenants.lastPlanChangeAt,
      planLevel: tenants.planLevel
    })
    .from(tenants)
    .where(eq(tenants.id, currentUser.tenantId))
    .limit(1);

    if (!tenant.length) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Get active payment processor
    const { provider, credentials } = await getActivePaymentProcessor();
    
    if (!provider || provider !== 'stripe') {
      return res.status(500).json({ message: 'Stripe payment processor required. Please configure Stripe in integrations.' });
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });

    // If tenant already has an active subscription, use the change-plan logic instead
    if (tenant[0].stripeSubscriptionId) {
      try {
        // Retrieve existing subscription
        const subscription = await stripe.subscriptions.retrieve(tenant[0].stripeSubscriptionId);
        
        if (subscription && subscription.status === 'active') {
          // Redirect to change-plan endpoint logic
          const priceIds: Record<string, string | undefined> = {
            'core': process.env.STRIPE_PRICE_CORE,
            'growth': process.env.STRIPE_PRICE_GROWTH,
            'elite': process.env.STRIPE_PRICE_ELITE
          };

          const newPriceId = priceIds[plan];
          if (!newPriceId) {
            return res.status(400).json({ message: `Price ID not configured for plan: ${plan}` });
          }

          // Update subscription directly
          const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
            items: [{
              id: subscription.items.data[0].id,
              price: newPriceId,
            }],
            proration_behavior: 'none',
            billing_cycle_anchor: 'unchanged',
            metadata: {
              tenantId: currentUser.tenantId,
              plan
            }
          });

          // Update tenant plan immediately
          await db.update(tenants)
            .set({ 
              planLevel: plan as any,
              lastPlanChangeAt: new Date(),
              planChangeReason: 'upgrade'
            })
            .where(eq(tenants.id, currentUser.tenantId));

          // Clear feature flag cache
          await clearCapabilitiesCache(currentUser.tenantId);

          return res.json({ 
            success: true,
            message: 'Plan updated successfully',
            subscription: {
              id: updatedSubscription.id,
              status: updatedSubscription.status,
              plan
            }
          });
        }
      } catch (error) {
        console.error('Error checking existing subscription:', error);
        // Fall through to create new checkout session
      }
    }
    
    // For new subscriptions or if existing subscription check failed, create checkout session
    
    // Check if plan change is too recent (within 30 days) for new subscriptions
    if (tenant[0].lastPlanChangeAt) {
      const daysSinceLastChange = Math.floor((Date.now() - new Date(tenant[0].lastPlanChangeAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastChange < 30) {
        return res.status(400).json({ 
          message: `Plan changes are limited to once per billing cycle. You can change your plan again in ${30 - daysSinceLastChange} days.` 
        });
      }
    }
    
    let customerId = tenant[0].stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: currentUser.email,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        metadata: {
          tenantId: currentUser.tenantId,
          plan
        }
      });
      customerId = customer.id;
      
      // Update tenant with customer ID
      await db.update(tenants)
        .set({ stripeCustomerId: customerId })
        .where(eq(tenants.id, currentUser.tenantId));
    }

    // Map plan to price ID using environment variables
    const priceIds: Record<string, string | undefined> = {
      'core': process.env.STRIPE_PRICE_CORE,
      'growth': process.env.STRIPE_PRICE_GROWTH,
      'elite': process.env.STRIPE_PRICE_ELITE
    };

    const priceId = priceIds[plan];
    if (!priceId) {
      return res.status(400).json({ message: `Price ID not configured for plan: ${plan}` });
    }

    const appUrl = getAppBaseUrl();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      client_reference_id: currentUser.tenantId,
      subscription_data: {
        proration_behavior: 'none',
        metadata: {
          tenantId: currentUser.tenantId,
          plan
        }
      },
      success_url: `${appUrl}/admin/settings?success=true&plan=${plan}`,
      cancel_url: `${appUrl}/admin/settings?canceled=true`,
      metadata: {
        tenantId: currentUser.tenantId,
        plan,
        userEmail: currentUser.email,
      },
    });

    res.json({ 
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// Change plan for existing subscribers (upgrade or change)
router.post('/billing/change-plan', async (req: any, res) => {
  try {
    const { plan } = req.body;
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!plan || !['core', 'growth', 'elite'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Get tenant information
    const tenant = await db.select({
      stripeSubscriptionId: tenants.stripeSubscriptionId,
      planLevel: tenants.planLevel,
      lastPlanChangeAt: tenants.lastPlanChangeAt
    })
    .from(tenants)
    .where(eq(tenants.id, currentUser.tenantId))
    .limit(1);

    if (!tenant.length) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (!tenant[0].stripeSubscriptionId) {
      return res.status(400).json({ 
        message: 'No active subscription found. Please use the checkout flow to create a new subscription.' 
      });
    }

    // Check if plan change is too recent (within 30 days)
    if (tenant[0].lastPlanChangeAt) {
      const daysSinceLastChange = Math.floor((Date.now() - new Date(tenant[0].lastPlanChangeAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastChange < 30) {
        return res.status(400).json({ 
          message: `Plan changes are limited to once per billing cycle. You can change your plan again in ${30 - daysSinceLastChange} days.` 
        });
      }
    }

    const { provider, credentials } = await getActivePaymentProcessor();
    if (!provider || provider !== 'stripe') {
      return res.status(500).json({ message: 'Stripe payment processor required. Please configure Stripe in integrations.' });
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });

    // Get the new price ID
    const priceIds: Record<string, string | undefined> = {
      'core': process.env.STRIPE_PRICE_CORE,
      'growth': process.env.STRIPE_PRICE_GROWTH,
      'elite': process.env.STRIPE_PRICE_ELITE
    };

    const newPriceId = priceIds[plan];
    if (!newPriceId) {
      return res.status(400).json({ message: `Price ID not configured for plan: ${plan}` });
    }

    try {
      // Get the subscription
      const subscription = await stripe.subscriptions.retrieve(tenant[0].stripeSubscriptionId);

      if (!subscription || subscription.status !== 'active') {
        return res.status(400).json({ 
          message: 'Subscription is not active. Please contact support.' 
        });
      }

      // Update subscription with new price - no proration, keep same billing cycle
      const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'none',
        billing_cycle_anchor: 'unchanged',
        metadata: {
          tenantId: currentUser.tenantId,
          plan
        }
      });

      // Update tenant plan immediately
      await db.update(tenants)
        .set({ 
          planLevel: plan as any,
          lastPlanChangeAt: new Date(),
          planChangeReason: tenant[0].planLevel < plan ? 'upgrade' : 'change'
        })
        .where(eq(tenants.id, currentUser.tenantId));

      // Clear feature flag cache
      await clearCapabilitiesCache(currentUser.tenantId);

      res.json({ 
        success: true,
        message: `Plan ${tenant[0].planLevel < plan ? 'upgraded' : 'changed'} successfully`,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          plan,
          currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString()
        }
      });
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      
      if (error.code === 'resource_missing') {
        // Subscription doesn't exist in Stripe
        await db.update(tenants)
          .set({ 
            stripeSubscriptionId: null,
            billingStatus: 'none'
          })
          .where(eq(tenants.id, currentUser.tenantId));
        
        return res.status(400).json({ 
          message: 'Subscription not found. Please create a new subscription.' 
        });
      }
      
      res.status(500).json({ message: 'Failed to update subscription plan' });
    }
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    res.status(500).json({ message: 'Failed to change subscription plan' });
  }
});

// Upgrade route for existing subscribers
router.post('/billing/upgrade', async (req: any, res) => {
  try {
    const { plan } = req.body;
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!plan || !['core', 'growth', 'elite'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Get tenant information
    const tenant = await db.select({
      stripeSubscriptionId: tenants.stripeSubscriptionId,
      planLevel: tenants.planLevel,
      lastPlanChangeAt: tenants.lastPlanChangeAt
    })
    .from(tenants)
    .where(eq(tenants.id, currentUser.tenantId))
    .limit(1);

    if (!tenant.length || !tenant[0].stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    // Check if this is actually an upgrade
    const currentPlanLevel = tenant[0].planLevel;
    const planOrder = { 'free': 0, 'core': 1, 'growth': 2, 'elite': 3 };
    if (planOrder[plan as keyof typeof planOrder] <= planOrder[currentPlanLevel as keyof typeof planOrder]) {
      return res.status(400).json({ message: 'Can only upgrade to a higher plan' });
    }

    // Check for abuse prevention
    if (tenant[0].lastPlanChangeAt) {
      const daysSinceLastChange = Math.floor((Date.now() - new Date(tenant[0].lastPlanChangeAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastChange < 30) {
        return res.status(400).json({ 
          message: `Plan changes are limited. You can change your plan again in ${30 - daysSinceLastChange} days.` 
        });
      }
    }

    const { provider, credentials } = await getActivePaymentProcessor();
    if (!provider || provider !== 'stripe') {
      return res.status(400).json({ message: 'Stripe payment processor required' });
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });

    // Get the new price ID
    const priceIds: Record<string, string | undefined> = {
      'core': process.env.STRIPE_PRICE_CORE,
      'growth': process.env.STRIPE_PRICE_GROWTH,
      'elite': process.env.STRIPE_PRICE_ELITE
    };

    const newPriceId = priceIds[plan];
    if (!newPriceId) {
      return res.status(400).json({ message: `Price ID not configured for plan: ${plan}` });
    }

    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(tenant[0].stripeSubscriptionId);

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'none',
      billing_cycle_anchor: 'unchanged',
      metadata: {
        tenantId: currentUser.tenantId,
        plan
      }
    });

    // Update tenant plan immediately
    await db.update(tenants)
      .set({ 
        planLevel: plan as any,
        lastPlanChangeAt: new Date(),
        planChangeReason: 'upgrade'
      })
      .where(eq(tenants.id, currentUser.tenantId));

    // Clear feature flag cache
    await clearCapabilitiesCache(currentUser.tenantId);

    res.json({ 
      success: true,
      message: 'Plan upgraded successfully',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        plan
      }
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ message: 'Failed to upgrade subscription' });
  }
});

// Downgrade route - schedule for next renewal
router.post('/billing/downgrade', async (req: any, res) => {
  try {
    const { plan } = req.body;
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!plan || !['free', 'core', 'growth'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Get tenant information
    const tenant = await db.select({
      stripeSubscriptionId: tenants.stripeSubscriptionId,
      planLevel: tenants.planLevel,
      lastPlanChangeAt: tenants.lastPlanChangeAt
    })
    .from(tenants)
    .where(eq(tenants.id, currentUser.tenantId))
    .limit(1);

    if (!tenant.length || !tenant[0].stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    // Check if this is actually a downgrade
    const currentPlanLevel = tenant[0].planLevel;
    const planOrder = { 'free': 0, 'core': 1, 'growth': 2, 'elite': 3 };
    if (planOrder[plan as keyof typeof planOrder] >= planOrder[currentPlanLevel as keyof typeof planOrder]) {
      return res.status(400).json({ message: 'Can only downgrade to a lower plan' });
    }

    const { provider, credentials } = await getActivePaymentProcessor();
    if (!provider || provider !== 'stripe') {
      return res.status(400).json({ message: 'Stripe payment processor required' });
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });

    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(tenant[0].stripeSubscriptionId);
    
    if (plan === 'free') {
      // Cancel subscription at period end
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
        metadata: {
          tenantId: currentUser.tenantId,
          pendingPlan: 'free'
        }
      });

      // Save pending downgrade info
      await db.update(tenants)
        .set({ 
          pendingPlanCode: 'free',
          pendingPlanEffectiveDate: new Date(subscription.current_period_end * 1000),
          billingStatus: 'pending_downgrade'
        })
        .where(eq(tenants.id, currentUser.tenantId));
    } else {
      // Schedule downgrade to lower paid plan
      const priceIds: Record<string, string | undefined> = {
        'core': process.env.STRIPE_PRICE_CORE,
        'growth': process.env.STRIPE_PRICE_GROWTH,
      };

      const newPriceId = priceIds[plan];
      if (!newPriceId) {
        return res.status(400).json({ message: `Price ID not configured for plan: ${plan}` });
      }

      // Create subscription schedule to change at period end
      const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscription.id
      });

      await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: 'release',
        phases: [
          {
            start_date: subscription.current_period_start,
            end_date: subscription.current_period_end,
            items: subscription.items.data.map(item => ({
              price: item.price.id,
              quantity: item.quantity
            }))
          },
          {
            start_date: subscription.current_period_end,
            items: [{
              price: newPriceId,
              quantity: 1
            }],
            proration_behavior: 'none'
          }
        ]
      });

      // Save pending downgrade info
      await db.update(tenants)
        .set({ 
          pendingPlanCode: plan,
          pendingPlanEffectiveDate: new Date(subscription.current_period_end * 1000),
          billingStatus: 'pending_downgrade'
        })
        .where(eq(tenants.id, currentUser.tenantId));
    }

    res.json({ 
      success: true,
      message: 'Downgrade scheduled for the end of the current billing period',
      effectiveDate: new Date(subscription.current_period_end * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error downgrading subscription:', error);
    res.status(500).json({ message: 'Failed to downgrade subscription' });
  }
});

// Get active payment processor info
router.get('/billing/active-processor', async (req: any, res) => {
  try {
    const { provider, credentials } = await getActivePaymentProcessor();
    
    // Don't expose sensitive credentials in the response
    res.json({ 
      provider,
      isConfigured: !!provider,
      hasFallback: !!process.env.STRIPE_SECRET_KEY
    });
  } catch (error) {
    console.error('Error getting active payment processor:', error);
    res.status(500).json({ message: 'Failed to get payment processor info' });
  }
});

export default router;