import { Router } from 'express';
import { db } from './db';
import { tenants } from '../shared/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const router = Router();

// Create billing portal session
router.post('/billing/portal', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

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

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({ message: 'Stripe not configured' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const session = await stripe.billingPortal.sessions.create({
      customer: tenant[0].stripeCustomerId,
      return_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://your-domain.com'}/admin/settings?tab=plans-features`,
    });

    res.json({ url: session.url });
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

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({ message: 'Stripe not configured' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
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
      mode: 'subscription',
      client_reference_id: currentUser.tenantId,
      line_items: [{
        price: priceIds[planId as keyof typeof priceIds],
        quantity: 1,
      }],
      success_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://your-domain.com'}/admin/settings?tab=plans-features&success=true`,
      cancel_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://your-domain.com'}/admin/settings?tab=plans-features`,
      metadata: {
        tenantId: currentUser.tenantId,
        planId
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

export default router;