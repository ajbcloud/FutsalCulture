import { Router } from 'express';
import { db } from './db';
import { tenants, integrations } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import Stripe from 'stripe';

const router = Router();

// Helper function to get active payment processor
async function getActivePaymentProcessor(): Promise<{ provider: 'stripe' | 'braintree' | null, credentials: any }> {
  try {
    // Check for enabled payment processors (Stripe or Braintree)
    const activeProcessor = await db.select()
      .from(integrations)
      .where(and(
        eq(integrations.enabled, true),
        // Check for both stripe and braintree
        sql`${integrations.provider} IN ('stripe', 'braintree')`
      ))
      .limit(1);

    if (activeProcessor.length > 0) {
      return {
        provider: activeProcessor[0].provider as 'stripe' | 'braintree',
        credentials: activeProcessor[0].credentials
      };
    }

    // Fallback to environment-based Stripe if available
    if (process.env.STRIPE_SECRET_KEY) {
      return {
        provider: 'stripe',
        credentials: {
          secretKey: process.env.STRIPE_SECRET_KEY,
          publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY
        }
      };
    }

    return { provider: null, credentials: null };
  } catch (error) {
    console.error('Error getting active payment processor:', error);
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

      const stripe = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY);
      
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

// Create checkout session
router.post('/billing/checkout', async (req: any, res) => {
  try {
    const { planId } = req.query;
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!planId || !['core', 'growth', 'elite'].includes(planId)) {
      return res.status(400).json({ message: 'Invalid plan ID' });
    }

    // Get active payment processor
    const { provider, credentials } = await getActivePaymentProcessor();
    
    if (!provider) {
      return res.status(400).json({ message: 'No payment processor configured' });
    }

    if (provider === 'stripe') {
      const stripe = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY);
      
      // Get or create Stripe customer
      const tenant = await db.select({
        stripeCustomerId: tenants.stripeCustomerId
      })
      .from(tenants)
      .where(eq(tenants.id, currentUser.tenantId))
      .limit(1);

      let customerId = tenant[0]?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: currentUser.email,
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          metadata: {
            tenantId: currentUser.tenantId,
            planId
          }
        });
        customerId = customer.id;
        
        // Update tenant with customer ID
        await db.update(tenants)
          .set({ stripeCustomerId: customerId })
          .where(eq(tenants.id, currentUser.tenantId));
      }

      // Create checkout session
      const priceIds = {
        'core': process.env.STRIPE_CORE_PRICE_ID || 'price_core',
        'growth': process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth', 
        'elite': process.env.STRIPE_ELITE_PRICE_ID || 'price_elite'
      };

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceIds[planId as keyof typeof priceIds],
            quantity: 1,
          },
        ],
        mode: 'subscription',
        client_reference_id: currentUser.tenantId, // Primary tenant identifier
        success_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : `https://${process.env.REPL_SLUG || 'your-app'}.${process.env.REPL_OWNER || 'replit'}.replit.app`}/admin/dashboard?payment=success&plan=${planId}`,
        cancel_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : `https://${process.env.REPL_SLUG || 'your-app'}.${process.env.REPL_OWNER || 'replit'}.replit.app`}/admin/settings?tab=plans-features&checkout=cancelled`,
        metadata: {
          tenantId: currentUser.tenantId, // Backup identifier
          planId: planId,
          userEmail: currentUser.email,
        },
      });

      res.json({ 
        url: session.url,
        provider: 'stripe',
        sessionId: session.id
      });
    } else if (provider === 'braintree') {
      // For Braintree, we would implement their Drop-in UI or Hosted Fields
      // This is a simplified response that indicates Braintree is configured
      res.json({
        provider: 'braintree',
        clientToken: 'braintree_client_token_placeholder',
        message: 'Braintree checkout not fully implemented yet'
      });
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
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