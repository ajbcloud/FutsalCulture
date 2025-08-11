import { Router } from 'express';
import { db } from './db';
import { futsalSessions, signups, players, tenants, integrations } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import Stripe from 'stripe';

const router = Router();

// Get payment processor configuration endpoint
router.get('/payment-config', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const { provider, credentials } = await getActivePaymentProcessor(currentUser.tenantId);
    
    console.log('Payment processor config:', { provider, hasCredentials: !!credentials });
    
    if (!provider) {
      return res.status(400).json({ message: 'No payment processor configured' });
    }

    // Return only the necessary client-side configuration
    const config = {
      provider,
      ...(provider === 'stripe' && {
        publishableKey: credentials?.publishableKey || process.env.VITE_STRIPE_PUBLIC_KEY
      }),
      ...(provider === 'braintree' && {
        clientToken: credentials?.clientToken // Would need to generate this from Braintree SDK
      })
    };

    console.log('Returning payment config:', { provider: config.provider, hasPublishableKey: !!config.publishableKey });
    res.json(config);
  } catch (error) {
    console.error('Error getting payment config:', error);
    res.status(500).json({ message: 'Failed to get payment configuration' });
  }
});

// Helper function to get active payment processor
async function getActivePaymentProcessor(tenantId?: string): Promise<{ provider: 'stripe' | 'braintree' | null, credentials: any }> {
  try {
    console.log('Checking for active payment processors...');
    
    // Check for enabled payment processors (Stripe or Braintree)
    // Look for tenant-specific integrations first, then global ones
    const activeProcessor = await db.select()
      .from(integrations)
      .where(and(
        eq(integrations.enabled, true),
        sql`${integrations.provider} IN ('stripe', 'braintree')`,
        // Allow both tenant-specific and global integrations (tenant_id is null)
        tenantId ? sql`(${integrations.tenantId} IS NULL OR ${integrations.tenantId} = ${tenantId})` : sql`${integrations.tenantId} IS NULL`
      ))
      .orderBy(sql`CASE WHEN ${integrations.tenantId} IS NOT NULL THEN 0 ELSE 1 END`) // Prefer tenant-specific
      .limit(1);

    console.log('Found active processors:', activeProcessor.length);

    if (activeProcessor.length > 0) {
      console.log('Using configured processor:', activeProcessor[0].provider);
      return {
        provider: activeProcessor[0].provider as 'stripe' | 'braintree',
        credentials: activeProcessor[0].credentials
      };
    }

    // Fallback to environment-based Stripe if available
    if (process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY) {
      console.log('Using environment-based Stripe configuration');
      return {
        provider: 'stripe',
        credentials: {
          secretKey: process.env.STRIPE_SECRET_KEY,
          publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY
        }
      };
    }

    console.log('No payment processor found');
    return { provider: null, credentials: null };
  } catch (error) {
    console.error('Error getting active payment processor:', error);
    return { provider: null, credentials: null };
  }
}

// Create session booking checkout
router.post('/session-checkout', async (req: any, res) => {
  try {
    const { sessionId, playerId } = req.body;
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!sessionId || !playerId) {
      return res.status(400).json({ message: 'Session ID and Player ID required' });
    }

    // Get session details
    const session = await db.select()
      .from(futsalSessions)
      .where(eq(futsalSessions.id, sessionId))
      .limit(1);

    if (!session.length) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Get player details
    const player = await db.select()
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);

    if (!player.length) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Get active payment processor
    const { provider, credentials } = await getActivePaymentProcessor();
    
    if (!provider) {
      return res.status(400).json({ message: 'No payment processor configured' });
    }

    const sessionData = session[0];
    const playerData = player[0];
    const amount = 2500; // Default $25.00 in cents - sessions don't have price field yet

    if (provider === 'stripe') {
      const stripe = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY);
      
      // Create checkout session for one-time payment
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Futsal Session - ${sessionData.location}`,
                description: `Session on ${new Date(sessionData.startTime).toLocaleDateString()} at ${new Date(sessionData.startTime).toLocaleTimeString()}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://your-domain.com'}/parent/dashboard?payment=success&session=${sessionId}&player=${playerId}`,
        cancel_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://your-domain.com'}/parent/dashboard?payment=cancelled`,
        metadata: {
          sessionId: sessionData.id,
          playerId: playerData.id,
          tenantId: currentUser.tenantId,
          type: 'session_booking'
        },
      });

      res.json({ 
        url: checkoutSession.url,
        provider: 'stripe',
        sessionId: checkoutSession.id
      });

    } else if (provider === 'braintree') {
      // For Braintree, we would generate a client token and return it
      // This is a placeholder implementation - in production you'd use Braintree SDK
      res.json({
        provider: 'braintree',
        clientToken: 'sandbox_braintree_client_token',
        amount: amount,
        sessionDetails: {
          id: sessionData.id,
          location: sessionData.location,
          startTime: sessionData.startTime,
          playerName: `${playerData.firstName} ${playerData.lastName}`
        },
        redirectUrl: `/parent/dashboard?payment=braintree&session=${sessionId}&player=${playerId}`
      });
    }
  } catch (error) {
    console.error('Error creating session checkout:', error);
    res.status(500).json({ message: 'Failed to create session checkout' });
  }
});

// Handle successful payment confirmation
router.post('/confirm-session-payment', async (req: any, res) => {
  try {
    const { sessionId, playerId, paymentId, provider } = req.body;
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Verify payment based on provider
    let paymentVerified = false;
    
    if (provider === 'stripe' && paymentId) {
      const { credentials } = await getActivePaymentProcessor();
      const stripe = new Stripe(credentials.secretKey || process.env.STRIPE_SECRET_KEY);
      
      try {
        const session = await stripe.checkout.sessions.retrieve(paymentId);
        paymentVerified = session.payment_status === 'paid';
      } catch (error) {
        console.error('Error verifying Stripe payment:', error);
      }
    } else if (provider === 'braintree' && paymentId) {
      // For Braintree, you would verify the transaction with their API
      // This is a placeholder - in production use Braintree SDK
      paymentVerified = true; // Assume verified for testing
    }

    if (!paymentVerified) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Check if signup already exists
    const existingSignup = await db.select()
      .from(signups)
      .where(and(
        eq(signups.sessionId, sessionId),
        eq(signups.playerId, playerId)
      ))
      .limit(1);

    if (existingSignup.length > 0) {
      // Update existing signup to mark as paid
      await db.update(signups)
        .set({ 
          paid: true,
          paymentIntentId: paymentId
        })
        .where(eq(signups.id, existingSignup[0].id));

      return res.json({ 
        success: true, 
        signupId: existingSignup[0].id,
        message: 'Payment confirmed and signup updated' 
      });
    } else {
      // Create new signup with payment confirmed
      const newSignup = await db.insert(signups).values({
        tenantId: currentUser.tenantId,
        sessionId: sessionId,
        playerId: playerId,
        paid: true,
        paymentIntentId: paymentId
      }).returning();

      return res.json({ 
        success: true, 
        signupId: newSignup[0].id,
        message: 'Signup created with payment confirmed' 
      });
    }
  } catch (error) {
    console.error('Error confirming session payment:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// Process payment endpoint for both Stripe and Braintree
router.post('/process-payment', async (req: any, res) => {
  try {
    const { signupId, sessionId, playerId, amount, paymentMethodId, provider } = req.body;
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!signupId || !sessionId || !playerId || !amount) {
      return res.status(400).json({ message: 'Missing required payment data' });
    }

    // Get active payment processor config
    const { provider: activeProvider, credentials } = await getActivePaymentProcessor(currentUser.tenantId);
    
    if (!activeProvider) {
      return res.status(400).json({ message: 'No payment processor configured' });
    }

    // Validate the provider matches the request
    if (provider && provider !== activeProvider) {
      return res.status(400).json({ message: `Payment processor mismatch. Expected ${activeProvider}, got ${provider}` });
    }

    let paymentResult;
    
    if (activeProvider === 'stripe') {
      // Process Stripe payment
      const stripe = new Stripe(credentials?.secretKey || process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-06-30.basil',
      });

      try {
        // Create and confirm payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount), // amount is already in cents
          currency: 'usd',
          payment_method: paymentMethodId,
          confirmation_method: 'manual',
          confirm: true,
          return_url: `${process.env.VITE_FRONTEND_URL || 'http://localhost:5000'}/parent/dashboard`,
        });

        if (paymentIntent.status === 'succeeded') {
          paymentResult = {
            success: true,
            paymentId: paymentIntent.id,
            provider: 'stripe'
          };
        } else {
          return res.status(400).json({ 
            message: 'Payment requires additional action',
            client_secret: paymentIntent.client_secret
          });
        }
      } catch (stripeError: any) {
        console.error('Stripe payment error:', stripeError);
        return res.status(400).json({ message: stripeError.message || 'Payment failed' });
      }
      
    } else if (activeProvider === 'braintree') {
      // TODO: Process Braintree payment
      // For now, simulate successful payment
      paymentResult = {
        success: true,
        paymentId: `bt_${Date.now()}`,
        provider: 'braintree'
      };
    } else {
      return res.status(400).json({ message: 'Unsupported payment processor' });
    }

    if (paymentResult.success) {
      // Update signup as paid
      await db.update(signups)
        .set({ 
          paid: true, 
          paymentId: paymentResult.paymentId,
          paymentProvider: paymentResult.provider,
          reservationExpiresAt: null // Clear reservation since payment is complete
        })
        .where(eq(signups.id, signupId));

      res.json({ 
        success: true, 
        message: 'Payment processed successfully',
        paymentId: paymentResult.paymentId
      });
    } else {
      res.status(400).json({ message: 'Payment processing failed' });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
});

export default router;