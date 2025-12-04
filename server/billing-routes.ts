import { Router } from 'express';
import { db } from './db';
import { tenants, integrations, tenantSubscriptionEvents } from '../shared/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { clearCapabilitiesCache } from './middleware/featureAccess';

const router = Router();

// Middleware to set currentUser from req.user (set by Clerk sync)
router.use(async (req: any, res, next) => {
  if (req.user?.id) {
    const { storage } = await import('./storage');
    const user = await storage.getUser(req.user.id);
    (req as any).currentUser = user;
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
    
    // Return subscription status from tenant data only (Braintree-based)
    res.json({
      hasSubscription: !!tenantData.stripeSubscriptionId,
      hasCustomer: !!tenantData.stripeCustomerId,
      currentPlan: tenantData.planLevel,
      billingStatus: tenantData.billingStatus,
      subscription: null,
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

// Helper function to get active payment processor (Braintree only)
async function getActivePaymentProcessor(): Promise<{ provider: 'braintree' | null, credentials: any }> {
  try {
    // Check for environment-based Braintree configuration
    if (process.env.BRAINTREE_MERCHANT_ID && process.env.BRAINTREE_PRIVATE_KEY && process.env.BRAINTREE_PUBLIC_KEY) {
      return {
        provider: 'braintree' as const,
        credentials: {
          merchantId: process.env.BRAINTREE_MERCHANT_ID,
          privateKey: process.env.BRAINTREE_PRIVATE_KEY,
          publicKey: process.env.BRAINTREE_PUBLIC_KEY
        }
      };
    }

    // Check for enabled Braintree processor in database
    const activeProcessor = await db.select()
      .from(integrations)
      .where(and(
        eq(integrations.enabled, true),
        eq(integrations.provider, 'braintree')
      ))
      .limit(1);

    if (activeProcessor.length > 0) {
      return {
        provider: 'braintree' as const,
        credentials: activeProcessor[0].credentials
      };
    }

    return { provider: null, credentials: null };
  } catch (error) {
    console.error('Error getting active payment processor:', error);
    // Check for environment variables even on database error
    if (process.env.BRAINTREE_MERCHANT_ID && process.env.BRAINTREE_PRIVATE_KEY && process.env.BRAINTREE_PUBLIC_KEY) {
      return {
        provider: 'braintree',
        credentials: {
          merchantId: process.env.BRAINTREE_MERCHANT_ID,
          privateKey: process.env.BRAINTREE_PRIVATE_KEY,
          publicKey: process.env.BRAINTREE_PUBLIC_KEY
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
    const { provider } = await getActivePaymentProcessor();
    
    if (!provider) {
      return res.status(400).json({ message: 'No payment processor configured' });
    }

    // Braintree doesn't have a billing portal equivalent
    // Return a message indicating they need to contact support for billing changes
    res.json({ 
      message: 'For billing changes, please contact support.',
      contactSupport: true 
    });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ message: 'Failed to create billing portal session' });
  }
});

// Create checkout session - redirects to Braintree
router.post('/billing/checkout', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Checkout is now handled via Braintree
    res.status(400).json({ 
      message: 'Checkout is handled via Braintree. Use the /api/billing/braintree/subscribe endpoint.',
      redirectTo: '/api/billing/braintree/subscribe'
    });
  } catch (error) {
    console.error('Error in checkout route:', error);
    res.status(500).json({ message: 'Failed to process checkout request' });
  }
});

// Change plan for existing subscribers - redirects to Braintree
router.post('/billing/change-plan', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Plan changes are now handled via Braintree
    res.status(400).json({ 
      message: 'Plan changes are handled via Braintree. Use the /api/billing/braintree/ endpoints.',
      upgradeEndpoint: '/api/billing/braintree/upgrade',
      downgradeEndpoint: '/api/billing/braintree/downgrade'
    });
  } catch (error) {
    console.error('Error in change-plan route:', error);
    res.status(500).json({ message: 'Failed to process plan change request' });
  }
});

// Upgrade route for existing subscribers - redirects to Braintree
router.post('/billing/upgrade', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Upgrades are now handled via Braintree
    res.status(400).json({ 
      message: 'Plan changes are handled via Braintree. Use the /api/billing/braintree/ endpoints.',
      upgradeEndpoint: '/api/billing/braintree/upgrade'
    });
  } catch (error) {
    console.error('Error in upgrade route:', error);
    res.status(500).json({ message: 'Failed to process upgrade request' });
  }
});

// Downgrade route - redirects to Braintree
router.post('/billing/downgrade', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Downgrades are now handled via Braintree
    res.status(400).json({ 
      message: 'Plan changes are handled via Braintree. Use the /api/billing/braintree/ endpoints.',
      downgradeEndpoint: '/api/billing/braintree/downgrade'
    });
  } catch (error) {
    console.error('Error in downgrade route:', error);
    res.status(500).json({ message: 'Failed to process downgrade request' });
  }
});

// Get active payment processor info
router.get('/billing/active-processor', async (req: any, res) => {
  try {
    const { provider } = await getActivePaymentProcessor();
    
    // Return Braintree configuration status
    res.json({ 
      provider,
      isConfigured: !!provider
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
    if (!braintreeService.isBraintreeEnabled()) {
      return res.status(503).json({ message: 'Braintree is not configured' });
    }

    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
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
    const clientToken = await braintreeService.generateClientToken(customerId);

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

// Validate discount code and calculate discount amount
router.post('/billing/braintree/validate-discount', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const { discountCode, plan } = req.body;
    
    if (!discountCode) {
      return res.status(400).json({ message: 'Discount code is required' });
    }
    
    if (!plan || !['core', 'growth', 'elite'].includes(plan)) {
      return res.status(400).json({ message: 'Valid plan is required (core, growth, or elite)' });
    }

    const planPrice = PLAN_PRICES[plan];
    const discountResult = await calculateDiscount(discountCode, planPrice, currentUser.tenantId);
    
    if (!discountResult.valid) {
      return res.status(400).json({ 
        valid: false, 
        message: discountResult.error 
      });
    }
    
    if (discountResult.discountAmount && discountResult.discountAmount > 0) {
      const discountedPrice = Math.max(0, planPrice - discountResult.discountAmount);
      res.json({
        valid: true,
        code: discountCode.toUpperCase(),
        discountAmount: discountResult.discountAmount,
        discountDescription: discountResult.discountDescription,
        originalPrice: planPrice,
        finalPrice: discountedPrice
      });
    } else {
      res.json({
        valid: true,
        code: discountCode.toUpperCase(),
        discountAmount: 0,
        discountDescription: null,
        originalPrice: planPrice,
        finalPrice: planPrice
      });
    }
  } catch (error) {
    console.error('Error validating discount code:', error);
    res.status(500).json({ message: 'Failed to validate discount code' });
  }
});

// Plan prices in dollars for discount calculation
const PLAN_PRICES: Record<string, number> = {
  core: 99,
  growth: 199,
  elite: 399,
};

// Helper to validate and calculate discount from code
async function calculateDiscount(discountCode: string | undefined, planPrice: number, tenantId: string): Promise<{
  valid: boolean;
  discountAmount?: number;
  discountDescription?: string;
  codeId?: string;
  error?: string;
}> {
  if (!discountCode) {
    return { valid: true }; // No discount code provided is valid
  }

  const { storage } = await import('./storage');
  
  // Look up the discount code (case-insensitive)
  const code = await storage.getInviteCodeByCode(discountCode.toUpperCase(), tenantId);
  
  if (!code) {
    return { valid: false, error: 'Invalid discount code' };
  }
  
  if (!code.isActive) {
    return { valid: false, error: 'This discount code is no longer active' };
  }
  
  if (code.codeType !== 'discount') {
    return { valid: false, error: 'This is not a valid discount code' };
  }
  
  // Check expiration
  if (code.validUntil && new Date(code.validUntil) < new Date()) {
    return { valid: false, error: 'This discount code has expired' };
  }
  
  // Check max uses
  if (code.maxUses !== null && code.currentUses !== null && code.currentUses >= code.maxUses) {
    return { valid: false, error: 'This discount code has reached its maximum uses' };
  }
  
  // Calculate the discount amount
  let discountAmount = 0;
  let discountDescription = '';
  
  if (code.discountType === 'percentage' && code.discountValue) {
    // Braintree only supports fixed amounts, so convert percentage to dollars
    discountAmount = Math.round((planPrice * code.discountValue / 100) * 100) / 100; // Round to 2 decimal places
    discountDescription = `${code.discountValue}% off`;
  } else if (code.discountType === 'fixed' && code.discountValue) {
    // discountValue is stored in cents for fixed amounts
    discountAmount = code.discountValue / 100;
    discountDescription = `$${discountAmount.toFixed(2)} off`;
  } else if (code.discountType === 'full') {
    // Full discount = first month free
    discountAmount = planPrice;
    discountDescription = 'First month free';
  }
  
  return {
    valid: true,
    discountAmount,
    discountDescription,
    codeId: code.id,
  };
}

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

    // Validate and calculate discount if provided
    const planPrice = PLAN_PRICES[plan];
    const discountResult = await calculateDiscount(discountCode, planPrice, currentUser.tenantId);
    
    if (!discountResult.valid) {
      return res.status(400).json({ message: discountResult.error });
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
      tenant.displayName || tenant.name
    );

    // Create payment method from nonce
    const paymentMethod = await braintreeService.createPaymentMethod(
      customer.id,
      paymentMethodNonce,
      true
    );

    // Create subscription with optional discount
    // Note: For Braintree, discounts must be pre-created in the Control Panel
    // We pass the calculated amount which will be applied as a first-billing-cycle discount
    const subscriptionOptions: any = {};
    
    if (discountResult.discountAmount && discountResult.discountAmount > 0) {
      // Apply discount as a first billing cycle price reduction
      // Note: This requires a discount ID to be configured in Braintree Control Panel
      // For now, we'll use firstBillingAmount to apply the discount directly
      const discountedPrice = Math.max(0, planPrice - discountResult.discountAmount);
      subscriptionOptions.firstBillingAmount = discountedPrice.toFixed(2);
    }

    // Create subscription
    const subscription = await braintreeService.createSubscription(
      currentUser.tenantId,
      plan as 'core' | 'growth' | 'elite',
      paymentMethod.token,
      subscriptionOptions
    );
    
    // Update discount code usage if one was applied
    if (discountResult.codeId) {
      const { storage } = await import('./storage');
      await storage.incrementInviteCodeUsage(discountResult.codeId);
    }

    // Clear feature access cache
    clearCapabilitiesCache(currentUser.tenantId);

    res.json({ 
      success: true,
      subscriptionId: subscription.id,
      plan,
      status: subscription.status,
      nextBillingDate: subscription.nextBillingDate,
      discount: discountResult.discountAmount ? {
        applied: true,
        amount: discountResult.discountAmount,
        description: discountResult.discountDescription,
        firstBillingAmount: subscriptionOptions.firstBillingAmount
      } : undefined
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
      amountCents: tenantSubscriptionEvents.amountCents,
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
        event.eventType === 'subscription_charged' ||
        event.eventType === 'subscription_activated' ||
        event.eventType === 'subscription_created'
      )
      .map(event => ({
        id: event.id,
        date: event.createdAt?.toISOString() || new Date().toISOString(),
        amount: event.amountCents ? event.amountCents / 100 : 0,
        status: event.status === 'completed' || event.eventType === 'subscription_charged' 
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