import { Router } from 'express';
import { db } from './db';
import { tenants, integrations, tenantSubscriptionEvents } from '../shared/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import Stripe from 'stripe';
import { stripe, getPriceIdFromPlanLevel, getAppBaseUrl } from '../lib/stripe';
import { clearCapabilitiesCache } from './middleware/featureAccess';

const router = Router();

// Middleware to set currentUser from req.user (set by Clerk sync)
router.use(async (req: any, res, next) => {
  if (req.user?.id) {
    const { storage } = await import('./storage');
    const user = await storage.getUser(req.user.id);
    (req as any).currentUser = user;
    
    // For Super Admin without tenant context, use the first available tenant
    if (user && !user.tenantId && user.isSuperAdmin) {
      const firstTenant = await db.query.tenants.findFirst();
      if (firstTenant) {
        (req as any).currentUser = { ...user, tenantId: firstTenant.id };
      }
    }
  }
  next();
});

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
          const stripeClient = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });
          const subscription = await stripeClient.subscriptions.retrieve(tenantData.stripeSubscriptionId);
          
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
    // DEBUG: Function entry
    console.log('=== getActivePaymentProcessor DEBUG ===');
    console.log('Checking environment variables...');
    console.log('process.env.STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('process.env.STRIPE_SECRET_KEY value (first 10 chars):', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...' : 'undefined');
    
    // First, check for environment-based Stripe configuration
    // This ensures that if Stripe env vars are set, they take priority
    if (process.env.STRIPE_SECRET_KEY) {
      console.log('Using Stripe configuration from environment variables');
      const result = {
        provider: 'stripe' as const,
        credentials: {
          secretKey: process.env.STRIPE_SECRET_KEY,
          publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLISHABLE_KEY
        }
      };
      console.log('Returning from getActivePaymentProcessor with provider:', result.provider);
      return result;
    }
    console.log('No STRIPE_SECRET_KEY found in environment, checking database...');

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

      const stripeClient = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });
      
      const session = await stripeClient.billingPortal.sessions.create({
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
    // DEBUG: Check if environment variables are available
    console.log('=== CHECKOUT ENDPOINT DEBUG START ===');
    console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('STRIPE_SECRET_KEY value (first 10 chars):', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...' : 'undefined');
    console.log('VITE_STRIPE_PUBLIC_KEY exists:', !!process.env.VITE_STRIPE_PUBLIC_KEY);
    console.log('STRIPE_PUBLISHABLE_KEY exists:', !!process.env.STRIPE_PUBLISHABLE_KEY);
    
    const { plan, discountCode } = req.body;
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

    // DEBUG: Before calling getActivePaymentProcessor
    console.log('About to call getActivePaymentProcessor...');
    
    // Get active payment processor
    const { provider, credentials } = await getActivePaymentProcessor();
    
    // DEBUG: After calling getActivePaymentProcessor
    console.log('getActivePaymentProcessor returned:');
    console.log('- provider:', provider);
    console.log('- credentials.secretKey exists:', !!credentials?.secretKey);
    console.log('- credentials.publishableKey exists:', !!credentials?.publishableKey);
    
    if (!provider || provider !== 'stripe') {
      console.log('ERROR: Payment processor check failed!');
      console.log('- provider value:', provider);
      console.log('- provider !== "stripe":', provider !== 'stripe');
      console.log('=== CHECKOUT ENDPOINT DEBUG END (ERROR) ===');
      return res.status(500).json({ message: 'Stripe payment processor required. Please configure Stripe in integrations.' });
    }

    const stripeClient = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });

    // If tenant already has an active subscription, use the change-plan logic instead
    if (tenant[0].stripeSubscriptionId) {
      try {
        // Retrieve existing subscription
        const subscription = await stripeClient.subscriptions.retrieve(tenant[0].stripeSubscriptionId);
        
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
          const updatedSubscription = await stripeClient.subscriptions.update(subscription.id, {
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
      const customer = await stripeClient.customers.create({
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
    console.log(`🔍 DEBUG: Creating checkout for plan: ${plan}, priceId: ${priceId}`);
    console.log(`🔍 DEBUG: All price IDs:`, priceIds);
    
    if (!priceId) {
      console.log(`❌ ERROR: Price ID not found for plan ${plan}`);
      return res.status(400).json({ message: `Price ID not configured for plan: ${plan}` });
    }

    const appUrl = getAppBaseUrl();

    console.log(`🔍 DEBUG: About to create Stripe checkout session with:`, {
      customer: customerId,
      mode: 'subscription',
      priceId,
      plan
    });

    // Build session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
    };

    // Apply discount code if provided
    if (discountCode) {
      try {
        const promotionCodes = await stripeClient.promotionCodes.list({
          code: discountCode,
          active: true,
          limit: 1,
        });

        if (promotionCodes.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: promotionCodes.data[0].id }];
          console.log(`✅ Applied promotion code: ${discountCode} (${promotionCodes.data[0].id})`);
        } else {
          console.log(`⚠️ Promotion code ${discountCode} not found or inactive`);
        }
      } catch (error) {
        console.error('Error applying promotion code:', error);
        // Continue checkout without discount if code lookup fails
      }
    }

    const session = await stripeClient.checkout.sessions.create(sessionParams);

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

    const stripeClient = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });

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
      const subscription = await stripeClient.subscriptions.retrieve(tenant[0].stripeSubscriptionId);

      if (!subscription || subscription.status !== 'active') {
        return res.status(400).json({ 
          message: 'Subscription is not active. Please contact support.' 
        });
      }

      // Update subscription with new price - no proration, keep same billing cycle
      const updatedSubscription = await stripeClient.subscriptions.update(subscription.id, {
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

    const stripeClient = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });

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
    const subscription = await stripeClient.subscriptions.retrieve(tenant[0].stripeSubscriptionId);

    // Update subscription with new price
    const updatedSubscription = await stripeClient.subscriptions.update(subscription.id, {
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

    const stripeClient = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });

    // Get the subscription
    const subscription = await stripeClient.subscriptions.retrieve(tenant[0].stripeSubscriptionId);
    
    if (plan === 'free') {
      // Cancel subscription at period end
      await stripeClient.subscriptions.update(subscription.id, {
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
      const schedule = await stripeClient.subscriptionSchedules.create({
        from_subscription: subscription.id
      });

      await stripeClient.subscriptionSchedules.update(schedule.id, {
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

// ============================================================================
// BRAINTREE BILLING ENDPOINTS
// ============================================================================

import * as braintreeService from './services/braintreeService';

// Get Braintree client token for Drop-In UI
router.get('/billing/braintree/client-token', async (req: any, res) => {
  try {
    console.log('=== Braintree Client Token Request ===');
    console.log('Braintree enabled:', braintreeService.isBraintreeEnabled());
    
    if (!braintreeService.isBraintreeEnabled()) {
      console.log('Braintree NOT enabled - returning 503');
      return res.status(503).json({ message: 'Braintree is not configured' });
    }

    const currentUser = req.currentUser;
    console.log('Current user:', currentUser?.id, 'Tenant:', currentUser?.tenantId);
    
    if (!currentUser?.tenantId) {
      console.log('No tenant ID - returning 400');
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Get tenant's Braintree customer ID if exists
    const tenant = await db.select({
      braintreeCustomerId: tenants.braintreeCustomerId
    })
    .from(tenants)
    .where(eq(tenants.id, currentUser.tenantId))
    .limit(1);

    const customerId = tenant[0]?.braintreeCustomerId || undefined;
    console.log('Generating client token, customerId:', customerId || 'none (new customer)');
    
    const clientToken = await braintreeService.generateClientToken(customerId);
    console.log('Client token generated successfully, length:', clientToken?.length);

    res.json({ clientToken });
  } catch (error) {
    console.error('Error generating Braintree client token:', error);
    res.status(500).json({ message: 'Failed to generate client token' });
  }
});

// Check cooldown period before allowing plan changes
router.get('/billing/braintree/cooldown-check', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const cooldownStatus = await braintreeService.checkCooldownPeriod(currentUser.tenantId);

    res.json(cooldownStatus);
  } catch (error) {
    console.error('Error checking cooldown:', error);
    res.status(500).json({ message: 'Failed to check cooldown status' });
  }
});

// Create or update Braintree subscription
router.post('/billing/braintree/subscribe', async (req: any, res) => {
  try {
    if (!braintreeService.isBraintreeEnabled()) {
      return res.status(503).json({ message: 'Braintree is not configured' });
    }

    const { plan, paymentMethodNonce, discountCode } = req.body;
    const currentUser = req.currentUser;

    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!plan || !['core', 'growth', 'elite'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan. Must be core, growth, or elite.' });
    }

    if (!paymentMethodNonce) {
      return res.status(400).json({ message: 'Payment method nonce is required' });
    }

    // Check cooldown period
    const cooldownStatus = await braintreeService.checkCooldownPeriod(currentUser.tenantId);
    if (!cooldownStatus.allowed) {
      return res.status(429).json({ 
        message: `You must wait ${cooldownStatus.remainingHours} hours before changing plans again.`,
        remainingHours: cooldownStatus.remainingHours,
        lastChangeAt: cooldownStatus.lastChangeAt
      });
    }

    // Get tenant info
    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.id, currentUser.tenantId))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Find or create Braintree customer
    const customer = await braintreeService.findOrCreateCustomer(
      currentUser.tenantId,
      currentUser.email,
      currentUser.firstName,
      currentUser.lastName,
      tenant.name
    );

    // Create payment method from nonce
    const paymentMethod = await braintreeService.createPaymentMethod(
      customer.id,
      paymentMethodNonce,
      true
    );

    // Look up Braintree discount ID if discount code provided
    let braintreeDiscountId: string | null = null;
    if (discountCode) {
      try {
        const { getBraintreeDiscountId } = await import('./services/braintreeDiscountService');
        braintreeDiscountId = await getBraintreeDiscountId(discountCode, currentUser.tenantId);
        if (braintreeDiscountId) {
          console.log(`✅ Found Braintree discount ID for code ${discountCode}: ${braintreeDiscountId}`);
        } else {
          console.log(`⚠️ No Braintree discount linked to code: ${discountCode}`);
        }
      } catch (error) {
        console.error('Error looking up Braintree discount:', error);
      }
    }

    // Create subscription with optional discount
    const subscriptionOptions = braintreeDiscountId 
      ? { discountId: braintreeDiscountId }
      : undefined;

    const subscription = await braintreeService.createSubscription(
      currentUser.tenantId,
      plan as 'core' | 'growth' | 'elite',
      paymentMethod.token,
      subscriptionOptions
    );

    // Clear feature access cache
    clearCapabilitiesCache(currentUser.tenantId);

    res.json({ 
      success: true,
      subscriptionId: subscription.id,
      plan,
      status: subscription.status,
      nextBillingDate: subscription.nextBillingDate,
      discountApplied: !!braintreeDiscountId
    });
  } catch (error) {
    console.error('Error creating Braintree subscription:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to create subscription' });
  }
});

// Upgrade Braintree subscription (immediate effect)
router.post('/billing/braintree/upgrade', async (req: any, res) => {
  try {
    if (!braintreeService.isBraintreeEnabled()) {
      return res.status(503).json({ message: 'Braintree is not configured' });
    }

    const { plan } = req.body;
    const currentUser = req.currentUser;

    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!plan || !['core', 'growth', 'elite'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Check cooldown period
    const cooldownStatus = await braintreeService.checkCooldownPeriod(currentUser.tenantId);
    if (!cooldownStatus.allowed) {
      return res.status(429).json({ 
        message: `You must wait ${cooldownStatus.remainingHours} hours before changing plans again.`,
        remainingHours: cooldownStatus.remainingHours
      });
    }

    const subscription = await braintreeService.updateSubscriptionPlan(
      currentUser.tenantId,
      plan as 'core' | 'growth' | 'elite',
      { effectiveDate: 'immediately', prorateCharges: false }
    );

    // Clear feature access cache
    clearCapabilitiesCache(currentUser.tenantId);

    res.json({ 
      success: true,
      message: 'Plan upgraded successfully',
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        nextBillingDate: subscription.nextBillingDate
      } : null
    });
  } catch (error) {
    console.error('Error upgrading Braintree subscription:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to upgrade subscription' });
  }
});

// Downgrade Braintree subscription (scheduled for end of billing period)
router.post('/billing/braintree/downgrade', async (req: any, res) => {
  try {
    if (!braintreeService.isBraintreeEnabled()) {
      return res.status(503).json({ message: 'Braintree is not configured' });
    }

    const { plan } = req.body;
    const currentUser = req.currentUser;

    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!plan || !['free', 'core', 'growth'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan for downgrade' });
    }

    const subscription = await braintreeService.updateSubscriptionPlan(
      currentUser.tenantId,
      plan as 'core' | 'growth' | 'elite',
      { effectiveDate: 'end_of_billing_period' }
    );

    res.json({ 
      success: true,
      message: 'Downgrade scheduled for end of billing period',
      subscription: subscription ? {
        id: subscription.id,
        nextBillingDate: subscription.nextBillingDate
      } : null
    });
  } catch (error) {
    console.error('Error downgrading Braintree subscription:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to schedule downgrade' });
  }
});

// Cancel Braintree subscription
router.post('/billing/braintree/cancel', async (req: any, res) => {
  try {
    if (!braintreeService.isBraintreeEnabled()) {
      return res.status(503).json({ message: 'Braintree is not configured' });
    }

    const { effectiveDate, reason } = req.body;
    const currentUser = req.currentUser;

    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const result = await braintreeService.cancelSubscription(
      currentUser.tenantId,
      {
        effectiveDate: effectiveDate === 'immediately' ? 'immediately' : 'end_of_billing_period',
        reason: reason || 'user_requested'
      }
    );

    if (result) {
      clearCapabilitiesCache(currentUser.tenantId);
    }

    res.json({ 
      success: result,
      message: effectiveDate === 'immediately' 
        ? 'Subscription cancelled' 
        : 'Subscription scheduled for cancellation at end of billing period'
    });
  } catch (error) {
    console.error('Error cancelling Braintree subscription:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to cancel subscription' });
  }
});

// Get Braintree subscription details
router.get('/billing/braintree/subscription', async (req: any, res) => {
  try {
    if (!braintreeService.isBraintreeEnabled()) {
      return res.status(503).json({ message: 'Braintree is not configured' });
    }

    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const details = await braintreeService.getSubscriptionDetails(currentUser.tenantId);

    // Get tenant's current plan and pending changes
    const [tenant] = await db.select({
      planLevel: tenants.planLevel,
      braintreeStatus: tenants.braintreeStatus,
      pendingPlanChange: tenants.pendingPlanChange,
      pendingPlanEffectiveDate: tenants.pendingPlanEffectiveDate
    })
    .from(tenants)
    .where(eq(tenants.id, currentUser.tenantId))
    .limit(1);

    res.json({
      hasSubscription: !!details.subscription,
      subscription: details.subscription ? {
        id: details.subscription.id,
        status: details.subscription.status,
        planId: details.subscription.planId,
        price: details.subscription.price,
        nextBillingDate: details.subscription.nextBillingDate,
        billingPeriodStartDate: details.subscription.billingPeriodStartDate,
        billingPeriodEndDate: details.subscription.billingPeriodEndDate
      } : null,
      currentPlan: tenant?.planLevel || 'free',
      braintreeStatus: tenant?.braintreeStatus,
      pendingPlanChange: tenant?.pendingPlanChange ? {
        plan: tenant.pendingPlanChange,
        effectiveDate: tenant.pendingPlanEffectiveDate
      } : null,
      paymentMethod: details.paymentMethod ? {
        token: details.paymentMethod.token,
        cardType: (details.paymentMethod as any).cardType,
        last4: (details.paymentMethod as any).last4,
        expirationMonth: (details.paymentMethod as any).expirationMonth,
        expirationYear: (details.paymentMethod as any).expirationYear
      } : null
    });
  } catch (error) {
    console.error('Error getting Braintree subscription details:', error);
    res.status(500).json({ message: 'Failed to get subscription details' });
  }
});

// Get Braintree payment history
router.get('/billing/braintree/payment-history', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Get transaction history from tenant subscription events
    const events = await db.select({
      id: tenantSubscriptionEvents.id,
      eventType: tenantSubscriptionEvents.eventType,
      planLevel: tenantSubscriptionEvents.planLevel,
      amount: tenantSubscriptionEvents.amount,
      currency: tenantSubscriptionEvents.currency,
      status: tenantSubscriptionEvents.status,
      createdAt: tenantSubscriptionEvents.createdAt,
      metadata: tenantSubscriptionEvents.metadata
    })
    .from(tenantSubscriptionEvents)
    .where(eq(tenantSubscriptionEvents.tenantId, currentUser.tenantId))
    .orderBy(desc(tenantSubscriptionEvents.createdAt))
    .limit(50);

    // Also get payment method info from tenant
    const [tenant] = await db.select({
      braintreePaymentMethodToken: tenants.braintreePaymentMethodToken
    })
    .from(tenants)
    .where(eq(tenants.id, currentUser.tenantId))
    .limit(1);

    // Get payment method details if we have Braintree configured
    let paymentMethodDetails: any = null;
    if (braintreeService.isBraintreeEnabled() && tenant?.braintreePaymentMethodToken) {
      try {
        const pmDetails = await braintreeService.getSubscriptionDetails(currentUser.tenantId);
        if (pmDetails.paymentMethod) {
          paymentMethodDetails = {
            cardType: (pmDetails.paymentMethod as any).cardType,
            last4: (pmDetails.paymentMethod as any).last4
          };
        }
      } catch (e) {
        // Payment method lookup failed, continue without it
      }
    }

    // Transform events to payment history format
    const paymentHistory = events
      .filter(event => 
        event.eventType === 'subscription_charged_successfully' ||
        event.eventType === 'payment_completed' ||
        event.eventType === 'subscription_created'
      )
      .map(event => ({
        id: event.id,
        date: event.createdAt?.toISOString() || new Date().toISOString(),
        amount: event.amount || 0,
        status: event.status === 'completed' || event.eventType === 'subscription_charged_successfully' 
          ? 'completed' 
          : event.status === 'failed' ? 'failed' : 'pending',
        plan: event.planLevel || 'unknown',
        paymentMethod: paymentMethodDetails,
        description: event.eventType === 'subscription_created' 
          ? 'Initial subscription' 
          : 'Monthly subscription payment'
      }));

    res.json(paymentHistory);
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({ message: 'Failed to get payment history' });
  }
});

export default router;