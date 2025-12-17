import { Router } from 'express';
import { db } from './db';
import { futsalSessions, signups, players, tenants, integrations, systemSettings, discountCodes } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import braintree from 'braintree';
import { format } from 'date-fns';
import { 
  getGatewayStatus, 
  generateClientToken as generateTenantClientToken, 
  createTransaction as createTenantTransaction,
  getTenantGateway
} from './services/tenantBraintreeService';

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
          // Try to find existing customer by email using stream search
          try {
            const searchStream = gateway.customer.search((search: any) => {
              search.email().is(user.email!);
            });
            
            const customers: any[] = [];
            for await (const customer of searchStream) {
              customers.push(customer);
              break; // Only need the first match
            }
            
            if (customers.length > 0) {
              customerId = customers[0].id;
              console.log('Found existing Braintree customer:', customerId);
            } else {
              // Create new customer using promise-based API
              const customerResponse = await gateway.customer.create({
                email: user.email,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
              });
              
              if (customerResponse.success && customerResponse.customer) {
                customerId = customerResponse.customer.id;
                console.log('Created new Braintree customer:', customerId);
              }
            }
          } catch (searchError) {
            console.warn('Customer search/create failed, creating new customer:', searchError);
            // Fallback: Create a new customer directly
            const customerResponse = await gateway.customer.create({
              email: user.email,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
            });
            
            if (customerResponse.success && customerResponse.customer) {
              customerId = customerResponse.customer.id;
              console.log('Created new Braintree customer (fallback):', customerId);
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
    
    const response = await gateway.clientToken.generate(tokenOptions);
    
    console.log('Braintree response received:', {
      hasResponse: !!response,
      hasClientToken: !!response?.clientToken,
      responseKeys: Object.keys(response || {}),
      clientTokenType: typeof response?.clientToken,
      clientTokenLength: response?.clientToken?.length,
      fullResponse: response
    });
    
    // Check for the actual token in the response
    const token = response?.clientToken;
    
    if (!token) {
      console.error('Braintree client token is missing from response:', response);
      throw new Error('Braintree client token not found in response');
    }
    
    console.log('Braintree client token generated successfully, token preview:', token.substring(0, 50) + '...');
    return token;
  } catch (error: any) {
    console.error('Error generating Braintree client token:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    throw new Error('Failed to generate Braintree client token: ' + (error?.message || 'Unknown error'));
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

    const { provider, credentials, useTenantGateway, tenantId: gatewayTenantId } = await getActivePaymentProcessor(currentUser.tenantId);
    
    console.log('Payment processor config:', { provider, hasCredentials: !!credentials, useTenantGateway });
    
    if (!provider) {
      return res.status(400).json({ message: 'No payment processor configured' });
    }

    // Return only the necessary client-side configuration (Braintree only)
    let config: any = { provider, useTenantGateway };
    
    try {
      let clientToken: string;
      
      if (useTenantGateway && gatewayTenantId) {
        // Use tenant's own Braintree gateway
        console.log('Generating client token using tenant gateway');
        clientToken = await generateTenantClientToken(gatewayTenantId);
      } else {
        // Use platform's Braintree gateway
        console.log('Generating client token using platform gateway');
        clientToken = await generateBraintreeClientToken(credentials, userId);
      }
      
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

    console.log('Returning payment config:', { 
      provider: config.provider, 
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

// Validate discount code endpoint
router.post('/session-billing/validate-discount-code', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, message: 'Discount code is required' });
    }

    const { storage } = await import('./storage');
    const currentUser = await storage.getUser(userId);
    
    if (!currentUser?.tenantId) {
      return res.status(400).json({ valid: false, message: 'Tenant ID required' });
    }

    const result = await storage.validateDiscountCode(code, currentUser.tenantId);

    if (result.valid && result.discountCode) {
      return res.json({
        valid: true,
        discountType: result.discountCode.discountType,
        discountValue: result.discountCode.discountValue ?? 0,
        discountCodeId: result.discountCode.id
      });
    } else {
      return res.json({
        valid: false,
        message: result.error || 'Invalid discount code'
      });
    }
  } catch (error) {
    console.error('Error validating discount code:', error);
    res.status(500).json({ valid: false, message: 'Failed to validate discount code' });
  }
});

// Helper function to check if tenant has their own connected Braintree gateway
async function hasTenantConnectedGateway(tenantId: string): Promise<{ connected: boolean; environment?: 'sandbox' | 'production' }> {
  try {
    const tenantStatus = await getGatewayStatus(tenantId);
    const activeEnv = tenantStatus.activeEnvironment;
    
    // Check if the active environment has a connected gateway
    const activeGateway = tenantStatus[activeEnv];
    if (activeGateway?.status === 'connected') {
      console.log(`Tenant ${tenantId} has connected gateway in ${activeEnv} environment`);
      return { connected: true, environment: activeEnv };
    }
    
    console.log(`Tenant ${tenantId} does not have a connected gateway`);
    return { connected: false };
  } catch (error) {
    console.log(`Error checking tenant gateway status for ${tenantId}:`, error);
    return { connected: false };
  }
}

// Helper function to get active payment processor (Braintree only)
// Now checks for tenant's own gateway first, then falls back to platform gateway
async function getActivePaymentProcessor(tenantId?: string): Promise<{ 
  provider: 'braintree' | null; 
  credentials: any;
  useTenantGateway: boolean;
  tenantId?: string;
}> {
  try {
    console.log('Checking for active Braintree payment processor...');
    
    // First, check if tenant has their own connected gateway
    if (tenantId) {
      const tenantGateway = await hasTenantConnectedGateway(tenantId);
      if (tenantGateway.connected) {
        console.log(`Using tenant's own Braintree gateway (${tenantGateway.environment})`);
        return {
          provider: 'braintree',
          credentials: null, // Credentials handled by tenantBraintreeService
          useTenantGateway: true,
          tenantId: tenantId
        };
      }
    }
    
    // Fall back to platform gateway
    console.log('Tenant does not have connected gateway, falling back to platform gateway');
    
    // Check for enabled Braintree payment processor
    // Look for tenant-specific integrations first, then global ones
    const activeProcessor = await db.select()
      .from(integrations)
      .where(and(
        eq(integrations.enabled, true),
        sql`${integrations.provider} = 'braintree'`,
        // Allow both tenant-specific and global integrations (tenant_id is null)
        tenantId ? sql`(${integrations.tenantId} IS NULL OR ${integrations.tenantId} = ${tenantId})` : sql`${integrations.tenantId} IS NULL`
      ))
      .orderBy(sql`CASE WHEN ${integrations.tenantId} IS NOT NULL THEN 0 ELSE 1 END`) // Prefer tenant-specific
      .limit(1);

    console.log('Found active Braintree processor:', activeProcessor.length);

    if (activeProcessor.length > 0) {
      console.log('Using configured Braintree processor');
      const rawCredentials = activeProcessor[0].credentials;
      console.log('Raw credentials type:', typeof rawCredentials);
      
      // Parse credentials if they're stored as JSON string
      let parsedCredentials: {
        environment?: string;
        merchantId?: string;
        publicKey?: string;
        privateKey?: string;
      } | null = null;
      
      if (typeof rawCredentials === 'string') {
        try {
          parsedCredentials = JSON.parse(rawCredentials);
          console.log('Parsed credentials from JSON string');
        } catch (e) {
          console.error('Failed to parse credentials JSON:', e);
          parsedCredentials = null;
        }
      } else if (rawCredentials && typeof rawCredentials === 'object') {
        parsedCredentials = rawCredentials as {
          environment?: string;
          merchantId?: string;
          publicKey?: string;
          privateKey?: string;
        };
      }
      
      console.log('Final credentials structure:', {
        hasEnvironment: !!parsedCredentials?.environment,
        hasMerchantId: !!parsedCredentials?.merchantId,
        hasPublicKey: !!parsedCredentials?.publicKey,
        hasPrivateKey: !!parsedCredentials?.privateKey,
        environment: parsedCredentials?.environment
      });
      
      return {
        provider: 'braintree',
        credentials: parsedCredentials,
        useTenantGateway: false
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
        credentials: envCredentials,
        useTenantGateway: false
      };
    }

    console.log('No Braintree payment processor found');
    return { provider: null, credentials: null, useTenantGateway: false };
  } catch (error) {
    console.error('Error getting active payment processor:', error);
    return { provider: null, credentials: null, useTenantGateway: false };
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

    // Get active payment processor (now checks for tenant gateway first)
    const { provider, credentials, useTenantGateway, tenantId: gatewayTenantId } = await getActivePaymentProcessor(currentUser.tenantId);
    
    if (!provider) {
      return res.status(400).json({ message: 'No payment processor configured' });
    }

    const sessionData = session[0];
    const playerData = player[0];
    const amount = sessionData.priceCents ?? 2500; // Use session price or fallback to $25

    // Braintree-only checkout - generate client token
    try {
      let clientToken: string;
      
      if (useTenantGateway && gatewayTenantId) {
        // Use tenant's own Braintree gateway
        console.log('Generating checkout client token using tenant gateway');
        clientToken = await generateTenantClientToken(gatewayTenantId);
      } else {
        // Use platform's Braintree gateway
        console.log('Generating checkout client token using platform gateway');
        clientToken = await generateBraintreeClientToken(credentials);
      }
      
      res.json({
        provider: 'braintree',
        clientToken: clientToken,
        useTenantGateway: useTenantGateway,
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

    // Verify Braintree payment only
    let paymentVerified = false;
    
    if (provider === 'braintree' && paymentId) {
      // Verify Braintree transaction
      try {
        const { credentials: braintreeCredentials, useTenantGateway, tenantId: gatewayTenantId } = await getActivePaymentProcessor(currentUser.tenantId);
        
        let gateway;
        if (useTenantGateway && gatewayTenantId) {
          gateway = await getTenantGateway(gatewayTenantId);
          console.log('Verifying transaction using tenant gateway');
        } else {
          gateway = createBraintreeGateway(braintreeCredentials);
          console.log('Verifying transaction using platform gateway');
        }
        
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
    } else if (provider !== 'braintree') {
      console.log('Unsupported payment provider for verification:', provider);
      return res.status(400).json({ message: 'Use Braintree for checkout. See /api/billing/braintree/ endpoints.' });
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

// Process payment endpoint (Braintree only)
router.post('/session-billing/process-payment', async (req: any, res) => {
  try {
    const { signupId, sessionId, playerId, amount, paymentMethodId, provider, useCredits, discountCodeId, discountAmountCents } = req.body;
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

    // Check available credits if user wants to use them
    let availableCredits = 0;
    let creditsToUse = 0;
    let remainingAmount = amount;

    if (useCredits) {
      availableCredits = await storage.getAvailableCreditBalance(userId, currentUser.tenantId);
      creditsToUse = Math.min(availableCredits, amount);
      remainingAmount = amount - creditsToUse;
    }

    // Get active payment processor config only if remaining amount > 0
    let paymentResult = null;
    
    if (remainingAmount > 0) {
      const { provider: activeProvider, credentials, useTenantGateway, tenantId: gatewayTenantId } = await getActivePaymentProcessor(currentUser.tenantId);
      
      if (!activeProvider) {
        return res.status(400).json({ message: 'No payment processor configured' });
      }

      // Validate that Braintree is being used
      if (provider && provider !== 'braintree') {
        return res.status(400).json({ message: 'Use Braintree for checkout. See /api/billing/braintree/ endpoints.' });
      }
    
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

        if (useTenantGateway && gatewayTenantId) {
          // Use tenant's own Braintree gateway via tenantBraintreeService
          console.log('Processing payment using tenant gateway');
          const tenantResult = await createTenantTransaction(gatewayTenantId, {
            amountCents: remainingAmount,
            paymentMethodNonce: paymentMethodNonce,
            bookingId: signupId,
            customerDetails: {
              firstName: playerInfo.firstName,
              lastName: playerInfo.lastName,
              email: playerInfo.email || undefined,
            },
          });

          console.log('Braintree payment successful (tenant gateway):', {
            transactionId: tenantResult.id,
            amountCents: tenantResult.amountCents,
            status: tenantResult.status,
            customer: customerName
          });

          paymentResult = {
            success: true,
            paymentId: tenantResult.id,
            provider: 'braintree'
          };
        } else {
          // Use platform's Braintree gateway
          console.log('Processing payment using platform gateway');
          const gateway = createBraintreeGateway(credentials);
          const result = await gateway.transaction.sale({
            amount: (remainingAmount / 100).toString(), // Convert remaining amount to dollars
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
            console.log('Braintree payment successful (platform gateway):', {
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
        }
      } catch (braintreeError: any) {
        console.error('Braintree payment error:', braintreeError);
        return res.status(400).json({ message: braintreeError.message || 'Payment failed' });
      }
    } else if (creditsToUse > 0) {
      // Payment fully covered by credits
      paymentResult = {
        success: true,
        paymentId: 'credit_payment',
        provider: 'credits'
      };
    }

    if (paymentResult && paymentResult.success) {
      // Increment discount code usage if a discount was applied
      if (discountCodeId) {
        try {
          // Verify discount code exists and belongs to tenant before incrementing
          const [discountCode] = await db
            .select()
            .from(discountCodes)
            .where(and(
              eq(discountCodes.id, discountCodeId),
              eq(discountCodes.tenantId, currentUser.tenantId)
            ))
            .limit(1);
          
          if (discountCode) {
            await storage.incrementDiscountCodeUsage(discountCodeId);
          } else {
            console.warn('Discount code not found or does not belong to tenant:', discountCodeId);
          }
        } catch (discountError) {
          console.error('Error processing discount code:', discountError);
        }
      }

      // Apply credits if used
      if (creditsToUse > 0) {
        const availableCredits = await storage.getAvailableCredits(userId, currentUser.tenantId);
        
        let remainingCreditsToUse = creditsToUse;
        for (const credit of availableCredits) {
          if (remainingCreditsToUse <= 0) break;
          
          const amountToUse = Math.min(credit.amountCents, remainingCreditsToUse);
          await storage.useCredit(credit.id, signupId);
          remainingCreditsToUse -= amountToUse;
        }
      }

      // Update signup as paid
      await db.update(signups)
        .set({ 
          paid: true, 
          paymentId: paymentResult.paymentId,
          paymentProvider: paymentResult.provider,
          reservationExpiresAt: null, // Clear reservation since payment is complete
          discountCodeId: discountCodeId || null,
          discountAmountCents: discountAmountCents || null
        })
        .where(eq(signups.id, signupId));

      // Send booking confirmation notification
      try {
        const [session, player, parent, tenant] = await Promise.all([
          db.select().from(futsalSessions).where(eq(futsalSessions.id, sessionId)).limit(1),
          db.select().from(players).where(eq(players.id, playerId)).limit(1),
          storage.getUser(userId),
          db.select().from(tenants).where(eq(tenants.id, currentUser.tenantId)).limit(1)
        ]);

        if (session.length && player.length && parent && tenant.length) {
          const sessionData = session[0];
          const playerData = player[0];
          const tenantData = tenant[0];

          // Get booking confirmation template
          const allTemplates = await storage.getTemplates(currentUser.tenantId);
          const emailTemplates = allTemplates.filter((t: any) => t.type === 'email');
          const template = emailTemplates.find((t: any) => t.method === 'booking_confirmation' && t.active);

          if (template && parent.email) {
            // Replace template variables
            let message = template.template;
            const variables = {
              '{{parentName}}': `${parent.firstName || ''} ${parent.lastName || ''}`.trim(),
              '{{playerName}}': `${playerData.firstName} ${playerData.lastName}`,
              '{{sessionDate}}': format(new Date(sessionData.startTime), 'EEEE, MMMM d, yyyy'),
              '{{sessionTime}}': format(new Date(sessionData.startTime), 'h:mm a'),
              '{{sessionLocation}}': sessionData.location || '',
              '{{sessionAgeGroup}}': sessionData.ageGroups?.join(', ') || '',
              '{{organizationName}}': tenantData.displayName || tenantData.name || 'SkoreHQ',
              '{{organizationPhone}}': tenantData.phone || ''
            };

            Object.entries(variables).forEach(([key, value]) => {
              message = message.replace(new RegExp(key, 'g'), value || '');
            });

            // Create notification record
            await storage.createNotification({
              tenantId: currentUser.tenantId,
              signupId: signupId,
              type: 'email',
              recipient: parent.email,
              recipientUserId: parent.id,
              subject: template.subject,
              message,
              status: 'pending'
            });
          }

          // Check for SMS template if parent has phone
          const allSmsTemplates = await storage.getTemplates(currentUser.tenantId);
          const smsTemplates = allSmsTemplates.filter((t: any) => t.type === 'sms');
          const smsTemplate = smsTemplates.find((t: any) => t.method === 'booking_confirmation' && t.active);

          if (smsTemplate && parent.phone) {
            let smsMessage = smsTemplate.template;
            const smsVariables = {
              '{{parentName}}': `${parent.firstName || ''} ${parent.lastName || ''}`.trim(),
              '{{playerName}}': `${playerData.firstName} ${playerData.lastName}`,
              '{{sessionDate}}': format(new Date(sessionData.startTime), 'EEEE, MMMM d, yyyy'),
              '{{sessionTime}}': format(new Date(sessionData.startTime), 'h:mm a'),
              '{{sessionLocation}}': sessionData.location || '',
              '{{sessionAgeGroup}}': sessionData.ageGroups?.join(', ') || '',
              '{{organizationName}}': tenantData.displayName || tenantData.name || 'SkoreHQ',
              '{{organizationPhone}}': tenantData.phone || ''
            };

            Object.entries(smsVariables).forEach(([key, value]) => {
              smsMessage = smsMessage.replace(new RegExp(key, 'g'), value || '');
            });

            await storage.createNotification({
              tenantId: currentUser.tenantId,
              signupId: signupId,
              type: 'sms',
              recipient: parent.phone,
              recipientUserId: parent.id,
              subject: smsTemplate.subject,
              message: smsMessage,
              status: 'pending'
            });
          }
        }
      } catch (error) {
        console.error('Failed to send booking confirmation notification:', error);
        // Don't fail the booking if notification fails
      }

      res.json({ 
        success: true, 
        message: 'Payment processed successfully',
        paymentId: paymentResult.paymentId,
        creditsUsed: creditsToUse,
        amountPaid: remainingAmount
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