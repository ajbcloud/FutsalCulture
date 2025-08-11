import { Router } from 'express';
import { db } from './db';
import { futsalSessions, signups, players, tenants, integrations } from '../shared/schema';
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

// Process payment for existing reservation
router.post('/process-payment', async (req: any, res) => {
  try {
    const { signupId, sessionId, playerId, amount, paymentMethod } = req.body;
    const currentUser = req.currentUser;
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Get the signup record
    const signup = await db.select()
      .from(signups)
      .where(eq(signups.id, signupId))
      .limit(1);

    if (!signup.length) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const signupData = signup[0];

    // Check if reservation has expired
    if (signupData.reservationExpiresAt && new Date() > new Date(signupData.reservationExpiresAt)) {
      return res.status(400).json({ message: 'Reservation has expired' });
    }

    // Get active payment processor
    const { provider, credentials } = await getActivePaymentProcessor();
    
    if (!provider) {
      return res.status(400).json({ message: 'No payment processor configured' });
    }

    let paymentSuccess = false;
    let paymentId = null;

    if (provider === 'stripe') {
      // Simulate Stripe payment processing for demo
      // In production, this would create a PaymentIntent with Stripe Elements
      paymentSuccess = true;
      paymentId = `pi_demo_${Date.now()}`;
    } else if (provider === 'braintree') {
      // Simulate Braintree payment processing for demo
      // In production, this would process payment with Braintree SDK
      paymentSuccess = true;
      paymentId = `bt_demo_${Date.now()}`;
    }

    if (paymentSuccess) {
      // Update signup with payment information
      await db.update(signups)
        .set({ 
          paid: true,
          paymentIntentId: paymentId,
          paymentProvider: provider,
          updatedAt: new Date()
        })
        .where(eq(signups.id, signupId));

      res.json({ 
        success: true, 
        signupId: signupId,
        paymentId: paymentId,
        provider: provider,
        message: 'Payment processed successfully' 
      });
    } else {
      res.status(400).json({ message: 'Payment processing failed' });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Failed to process payment' });
  }
});

export default router;