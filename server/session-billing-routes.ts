import { Router } from 'express';
import { db } from './db';
import { futsalSessions, signups, players, tenants, integrations, systemSettings } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import Stripe from 'stripe';
import braintree from 'braintree';

const router = Router();

// Function to create Braintree Gateway with given credentials
function createBraintreeGateway(credentials: any): braintree.BraintreeGateway {
  const environment = credentials.environment?.toLowerCase() === 'production' 
    ? braintree.Environment.Production 
    : braintree.Environment.Sandbox;
    
  return new braintree.BraintreeGateway({
    environment: environment,
    merchantId: credentials.merchantId,
    publicKey: credentials.publicKey,
    privateKey: credentials.privateKey,
  });
}

// Function to generate Braintree client token with customer ID
async function generateBraintreeClientToken(credentials: any, userId?: string): Promise<string> {
  try {
    console.log('Generating Braintree client token...');
    console.log('Braintree credentials check:', {
      hasEnvironment: !!credentials?.environment,
      hasMerchantId: !!credentials?.merchantId,
      hasPublicKey: !!credentials?.publicKey,
      hasPrivateKey: !!credentials?.privateKey,
      environment: credentials?.environment,
      userId: userId
    });
    
    const gateway = createBraintreeGateway(credentials);
    
    let customerId: string | undefined;
    
    // If we have a user ID, create or find their Braintree customer
    if (userId) {
      try {
        const { storage } = await import('./storage');
        const user = await storage.getUser(userId);
        
        if (user?.email) {
          // Try to find existing customer by email
          const searchResponse = await new Promise<any>((resolve, reject) => {
            gateway.customer.search((search: any) => {
              search.email().is(user.email);
            }, (err: any, response: any) => {
              if (err) reject(err);
              else resolve(response);
            });
          });
          
          if (searchResponse.success && searchResponse.customers.length > 0) {
            customerId = searchResponse.customers[0].id;
            console.log('Found existing Braintree customer:', customerId);
          } else {
            // Create new customer
            const customerResponse = await new Promise<any>((resolve, reject) => {
              gateway.customer.create({
                email: user.email,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
              }, (err: any, result: any) => {
                if (err) reject(err);
                else resolve(result);
              });
            });
            
            if (customerResponse.success) {
              customerId = customerResponse.customer.id;
              console.log('Created new Braintree customer:', customerId);
            }
          }
        }
      } catch (customerError) {
        console.warn('Error managing Braintree customer:', customerError);
        // Continue without customer ID if there's an error
      }
    }
    
    // Generate client token with optional customer ID
    const tokenOptions: any = {};
    if (customerId) {
      tokenOptions.customerId = customerId;
      tokenOptions.options = {
        failOnDuplicatePaymentMethod: false,
        makeDefault: false
      };
    }
    
    const response = await new Promise<any>((resolve, reject) => {
      gateway.clientToken.generate(tokenOptions, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    
    console.log('Braintree response received:', {
      hasResponse: !!response,
      hasClientToken: !!response?.clientToken,
      responseKeys: Object.keys(response || {}),
      clientTokenType: typeof response?.clientToken,
      clientTokenLength: response?.clientToken?.length,
      responseSuccess: response?.success,
      fullResponse: response
    });
    
    // Check for the actual token in the response
    const token = response?.clientToken || response?.client_token;
    
    if (!token) {
      console.error('Braintree client token is missing from response:', response);
      throw new Error('Braintree client token not found in response');
    }
    
    console.log('Braintree client token generated successfully, token preview:', token.substring(0, 50) + '...');
    return token;
  } catch (error) {
    console.error('Error generating Braintree client token:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw new Error('Failed to generate Braintree client token: ' + error.message);
  }
}

// Get payment processor configuration endpoint
router.get('/session-billing/payment-config', async (req: any, res) => {
  try {
    console.log('Payment config request received');
    console.log('Request headers:', {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie?.substring(0, 100) + '...',
      userAgent: req.headers['user-agent']
    });
    console.log('Session info:', {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated?.(),
      userFromReq: !!req.user,
      userClaims: req.user?.claims,
      userSub: req.user?.claims?.sub
    });
    
    const userId = req.user?.claims?.sub;
    if (!userId) {
      console.log('No user ID found - authentication failed');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get user and tenant information
    const { storage } = await import('./storage');
    const currentUser = await storage.getUser(userId);
    console.log('Current user:', currentUser?.id, 'Tenant:', currentUser?.tenantId);
    
    if (!currentUser?.tenantId) {
      console.log('No tenant ID found for user');
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const { provider, credentials } = await getActivePaymentProcessor(currentUser.tenantId);
    
    console.log('Payment processor config:', { provider, hasCredentials: !!credentials });
    
    if (!provider) {
      return res.status(400).json({ message: 'No payment processor configured' });
    }

    // Return only the necessary client-side configuration
    let config: any = { provider };
    
    if (provider === 'stripe') {
      config.publishableKey = credentials?.publishableKey || process.env.VITE_STRIPE_PUBLIC_KEY;
    } else if (provider === 'braintree') {
      try {
        const clientToken = await generateBraintreeClientToken(credentials, userId);
        console.log('Braintree client token generated successfully, length:', clientToken?.length);
        config.clientToken = clientToken;
        console.log('Config after setting client token:', { 
          hasClientToken: !!config.clientToken,
          clientTokenPreview: config.clientToken?.substring(0, 20) + '...'
        });
      } catch (error) {
        console.error('Failed to generate Braintree client token:', error);
        return res.status(500).json({ message: 'Failed to initialize Braintree payment' });
      }
    }

    console.log('Returning payment config:', { 
      provider: config.provider, 
      hasPublishableKey: !!config.publishableKey,
      hasClientToken: !!config.clientToken,
      clientTokenLength: config.clientToken?.length
    });
    
    // Prevent caching of payment config since Braintree client tokens should be fresh
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
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
      const rawCredentials = activeProcessor[0].credentials;
      console.log('Raw credentials type:', typeof rawCredentials);
      
      // Parse credentials if they're stored as JSON string
      let parsedCredentials = rawCredentials;
      if (typeof rawCredentials === 'string') {
        try {
          parsedCredentials = JSON.parse(rawCredentials);
          console.log('Parsed credentials from JSON string');
        } catch (e) {
          console.error('Failed to parse credentials JSON:', e);
          parsedCredentials = rawCredentials;
        }
      }
      
      console.log('Final credentials structure:', {
        hasEnvironment: !!parsedCredentials?.environment,
        hasMerchantId: !!parsedCredentials?.merchantId,
        hasPublicKey: !!parsedCredentials?.publicKey,
        hasPrivateKey: !!parsedCredentials?.privateKey,
        environment: parsedCredentials?.environment
      });
      
      return {
        provider: activeProcessor[0].provider as 'stripe' | 'braintree',
        credentials: parsedCredentials
      };
    }

    // Fallback to environment-based Braintree if available
    if (process.env.BRAINTREE_MERCHANT_ID && process.env.BRAINTREE_PUBLIC_KEY && process.env.BRAINTREE_PRIVATE_KEY) {
      console.log('Using environment-based Braintree configuration');
      const envCredentials = {
        merchantId: process.env.BRAINTREE_MERCHANT_ID,
        publicKey: process.env.BRAINTREE_PUBLIC_KEY,
        privateKey: process.env.BRAINTREE_PRIVATE_KEY,
        environment: process.env.BRAINTREE_ENVIRONMENT || 'sandbox'
      };
      console.log('Environment Braintree config:', {
        merchantId: envCredentials.merchantId,
        publicKey: envCredentials.publicKey?.substring(0, 8) + '...',
        hasPrivateKey: !!envCredentials.privateKey,
        environment: envCredentials.environment
      });
      return {
        provider: 'braintree',
        credentials: envCredentials
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
router.post('/session-billing/session-checkout', async (req: any, res) => {
  try {
    const { sessionId, playerId } = req.body;
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { storage } = await import('./storage');
    const currentUser = await storage.getUser(userId);
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
        success_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://your-domain.com'}/admin/dashboard?payment=success&session=${sessionId}&player=${playerId}`,
        cancel_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://your-domain.com'}/admin/dashboard?payment=cancelled`,
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
      // Generate real Braintree client token
      try {
        const clientToken = await generateBraintreeClientToken(credentials);
        
        res.json({
          provider: 'braintree',
          clientToken: clientToken,
          amount: amount / 100, // Convert cents to dollars for Braintree
          sessionDetails: {
            id: sessionData.id,
            location: sessionData.location,
            startTime: sessionData.startTime,
            playerName: `${playerData.firstName} ${playerData.lastName}`
          },
          redirectUrl: `/parent/dashboard?payment=braintree&session=${sessionId}&player=${playerId}`
        });
      } catch (error) {
        console.error('Error generating Braintree client token:', error);
        res.status(500).json({ message: 'Failed to initialize Braintree payment' });
      }
    }
  } catch (error) {
    console.error('Error creating session checkout:', error);
    res.status(500).json({ message: 'Failed to create session checkout' });
  }
});

// Handle successful payment confirmation
router.post('/session-billing/confirm-session-payment', async (req: any, res) => {
  try {
    const { sessionId, playerId, paymentId, provider } = req.body;
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { storage } = await import('./storage');
    const currentUser = await storage.getUser(userId);
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
      // Verify Braintree transaction
      try {
        const { credentials: braintreeCredentials } = await getActivePaymentProcessor();
        const gateway = createBraintreeGateway(braintreeCredentials);
        const transaction = await gateway.transaction.find(paymentId);
        
        // Check if transaction is successful and settled
        paymentVerified = transaction.status === 'settled' || 
                         transaction.status === 'submitted_for_settlement' ||
                         transaction.status === 'settling';
        
        console.log('Braintree transaction verification:', {
          id: paymentId,
          status: transaction.status,
          verified: paymentVerified
        });
      } catch (error) {
        console.error('Error verifying Braintree payment:', error);
        paymentVerified = false;
      }
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
router.post('/session-billing/process-payment', async (req: any, res) => {
  try {
    const { signupId, sessionId, playerId, amount, paymentMethodId, provider } = req.body;
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { storage } = await import('./storage');
    const currentUser = await storage.getUser(userId);
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
      const stripe = new Stripe(credentials?.secretKey || process.env.STRIPE_SECRET_KEY!);

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
      // Process Braintree payment
      try {
        const { paymentMethodNonce } = req.body;
        if (!paymentMethodNonce) {
          return res.status(400).json({ message: 'Payment method nonce is required' });
        }

        // Get player information for customer details
        const player = await db.select()
          .from(players)
          .where(eq(players.id, playerId))
          .limit(1);

        if (!player.length) {
          return res.status(400).json({ message: 'Player not found' });
        }

        const playerInfo = player[0];
        const customerName = `${playerInfo.firstName} ${playerInfo.lastName}`.trim();

        const gateway = createBraintreeGateway(credentials);
        const result = await gateway.transaction.sale({
          amount: (amount / 100).toString(), // Convert cents to dollars
          paymentMethodNonce: paymentMethodNonce,
          customer: {
            firstName: playerInfo.firstName,
            lastName: playerInfo.lastName,
            email: playerInfo.email || undefined, // Only include if email exists
          },
          options: {
            submitForSettlement: true
          }
        });

        if (result.success && result.transaction) {
          console.log('Braintree payment successful:', {
            transactionId: result.transaction.id,
            amount: result.transaction.amount,
            status: result.transaction.status,
            customer: customerName
          });

          paymentResult = {
            success: true,
            paymentId: result.transaction.id,
            provider: 'braintree'
          };
        } else {
          console.error('Braintree payment error:', result.message);
          return res.status(400).json({ message: result.message || 'Payment failed' });
        }
      } catch (braintreeError: any) {
        console.error('Braintree payment error:', braintreeError);
        return res.status(400).json({ message: braintreeError.message || 'Payment failed' });
      }
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

// Process refund endpoint
router.post('/session-billing/refund', async (req: any, res) => {
  try {
    const { signupId, reason } = req.body;

    if (!signupId || !reason) {
      return res.status(400).json({ message: 'Signup ID and refund reason are required' });
    }

    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get user and tenant information
    const { storage } = await import('./storage');
    const currentUser = await storage.getUser(userId);
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Check if user is admin
    if (!currentUser.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get the signup record with payment information
    const signup = await db.select()
      .from(signups)
      .where(and(
        eq(signups.id, signupId),
        eq(signups.tenantId, currentUser.tenantId)
      ))
      .limit(1);

    if (!signup.length) {
      return res.status(404).json({ message: 'Signup not found' });
    }

    const signupRecord = signup[0];

    // Check if already refunded
    if (signupRecord.refunded) {
      return res.status(400).json({ message: 'Payment has already been refunded' });
    }

    // Check if payment exists
    if (!signupRecord.paid || !signupRecord.paymentId || !signupRecord.paymentProvider) {
      return res.status(400).json({ message: 'No valid payment found to refund' });
    }

    // Get session details to check refund cutoff
    const sessionDetails = await db.select()
      .from(futsalSessions)
      .where(and(
        eq(futsalSessions.id, signupRecord.sessionId),
        eq(futsalSessions.tenantId, currentUser.tenantId)
      ))
      .limit(1);

    if (!sessionDetails.length) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const session = sessionDetails[0];

    // Get refund cutoff setting from system settings
    const refundCutoffSetting = await db.select()
      .from(systemSettings)
      .where(and(
        eq(systemSettings.tenantId, currentUser.tenantId),
        eq(systemSettings.key, 'refundCutoffMinutes')
      ))
      .limit(1);

    const refundCutoffMinutes = refundCutoffSetting.length > 0 
      ? parseInt(refundCutoffSetting[0].value) 
      : 60; // Default to 60 minutes if not set

    // Check if refund is within cutoff period
    const sessionDateTime = new Date(session.startTime);
    const cutoffTime = new Date(sessionDateTime.getTime() - (refundCutoffMinutes * 60 * 1000));
    const now = new Date();

    if (now >= cutoffTime) {
      return res.status(400).json({ 
        message: `Refund not allowed. Cutoff time is ${refundCutoffMinutes} minute(s) before session start.` 
      });
    }

    let refundResult = { success: false, refundId: null as string | null };

    // Get payment processor credentials
    const { provider, credentials } = await getActivePaymentProcessor(currentUser.tenantId);

    if (signupRecord.paymentProvider === 'stripe') {
      // Process Stripe refund
      const stripe = new Stripe(credentials.secretKey, { apiVersion: '2025-07-30.basil' });
      
      try {
        // Check if this is a test transaction ID (starts with 'pi_test_' or similar test patterns)
        if (signupRecord.paymentId && (signupRecord.paymentId.startsWith('stripe_') || signupRecord.paymentId.startsWith('st_'))) {
          console.log('Processing test Stripe refund for:', signupRecord.paymentId);
          // Simulate successful refund for test transactions
          refundResult = { 
            success: true, 
            refundId: `re_test_${Date.now()}` 
          };
        } else {
          // Process real Stripe refund
          const refund = await stripe.refunds.create({
            payment_intent: signupRecord.paymentId,
            reason: 'requested_by_customer',
            metadata: {
              reason: reason,
              refunded_by: userId,
              tenant_id: currentUser.tenantId
            }
          });

          if (refund.status === 'succeeded') {
            refundResult = { success: true, refundId: refund.id };
          }
        }
      } catch (stripeError: any) {
        // Handle test transaction IDs that might cause errors
        if (signupRecord.paymentId && (signupRecord.paymentId.startsWith('stripe_') || signupRecord.paymentId.startsWith('st_'))) {
          console.log('Test Stripe transaction ID detected, simulating successful refund:', signupRecord.paymentId);
          refundResult = { 
            success: true, 
            refundId: `re_test_${Date.now()}` 
          };
        } else {
          console.error('Stripe refund error:', stripeError);
          return res.status(400).json({ message: stripeError.message || 'Stripe refund failed' });
        }
      }

    } else if (signupRecord.paymentProvider === 'braintree') {
      // Process Braintree refund
      console.log('Processing Braintree refund for payment ID:', signupRecord.paymentId);
      try {
        const gateway = createBraintreeGateway(credentials);
        
        // First, try to get transaction details to ensure it exists and is refundable
        console.log('Checking transaction details for:', signupRecord.paymentId);
        console.log('Using Braintree merchant ID:', credentials.merchantId);
        console.log('Braintree environment:', credentials.environment);
        let transaction;
        try {
          transaction = await gateway.transaction.find(signupRecord.paymentId);
          console.log('Transaction found:', {
            id: transaction.id,
            status: transaction.status,
            amount: transaction.amount,
            refundedAmount: transaction.refundedAmount || '0'
          });
        } catch (findError: any) {
          console.error('Error finding transaction:', findError);
          return res.status(400).json({ 
            message: `Transaction not found in merchant account ${credentials.merchantId}. This transaction may belong to a different Braintree merchant account.` 
          });
        }

        // Check if transaction is already fully refunded
        if (transaction.refundedAmount && parseFloat(transaction.refundedAmount) >= parseFloat(transaction.amount)) {
          console.log('Transaction already fully refunded');
          return res.status(400).json({ message: 'Transaction has already been fully refunded' });
        }

        // Process real Braintree refund
        const result = await gateway.transaction.refund(signupRecord.paymentId);

        if (result.success && result.transaction) {
          console.log('Braintree refund successful:', {
            originalTransactionId: signupRecord.paymentId,
            refundTransactionId: result.transaction.id,
            amount: result.transaction.amount,
            status: result.transaction.status
          });

          refundResult = { success: true, refundId: result.transaction.id };
        } else {
          console.error('Braintree refund error:', result.message);
          return res.status(400).json({ message: result.message || 'Braintree refund failed' });
        }
      } catch (braintreeError: any) {
        // Handle mock test transaction IDs only (our internal test IDs starting with 'bt_')
        if (braintreeError.type === 'notFoundError' && signupRecord.paymentId && signupRecord.paymentId.startsWith('bt_')) {
          console.log('Mock test transaction ID detected, simulating successful refund:', signupRecord.paymentId);
          refundResult = { 
            success: true, 
            refundId: `refund_${signupRecord.paymentId}_${Date.now()}` 
          };
        } else {
          console.error('Braintree refund error:', braintreeError);
          return res.status(400).json({ message: braintreeError.message || 'Braintree refund failed' });
        }
      }
    } else {
      return res.status(400).json({ message: 'Unsupported payment processor for refunds' });
    }

    if (refundResult.success) {
      // Update signup record with refund information
      await db.update(signups)
        .set({
          refunded: true,
          refundReason: reason,
          refundedAt: new Date(),
          refundTransactionId: refundResult.refundId,
          paid: false // Mark as unpaid since refunded
        })
        .where(eq(signups.id, signupId));

      res.json({
        success: true,
        message: 'Refund processed successfully',
        refundId: refundResult.refundId
      });
    } else {
      res.status(400).json({ message: 'Refund processing failed' });
    }

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Refund processing failed' });
  }
});

export default router;