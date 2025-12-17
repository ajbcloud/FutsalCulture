import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  tenantPaymentGateways, 
  tenantBillingSettings,
  signups,
  futsalSessions
} from '../../shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { encrypt } from '../lib/kms';
import { 
  testGatewayConnection, 
  testGatewayConnectionWithCredentials,
  generateClientToken, 
  createTransaction 
} from '../services/tenantBraintreeService';
import { 
  logBillingAction, 
  createAuditMiddleware 
} from '../services/billingAuditService';
import { storage } from '../storage';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

export const adminBillingRouter = Router();
export const checkoutRouter = Router();

type GatewayEnvironment = 'sandbox' | 'production';

const requireAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!user.isAdmin && !user.isSuperAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!user.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

const auditMiddleware = createAuditMiddleware();

function maskMerchantId(merchantId: string | null): string | null {
  if (!merchantId || merchantId.length < 8) return merchantId;
  return 'xxxx' + merchantId.substring(merchantId.length - 4);
}

function maskPublicKey(publicKey: string | null): string | null {
  if (!publicKey || publicKey.length < 8) return publicKey;
  return 'xxxx' + publicKey.substring(publicKey.length - 4);
}

adminBillingRouter.get('/gateway', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user.tenantId;

    const [billingSettings] = await db.select()
      .from(tenantBillingSettings)
      .where(eq(tenantBillingSettings.tenantId, tenantId))
      .limit(1);

    const gateways = await db.select()
      .from(tenantPaymentGateways)
      .where(
        and(
          eq(tenantPaymentGateways.tenantId, tenantId),
          isNull(tenantPaymentGateways.deletedAt)
        )
      );

    const sandboxGateway = gateways.find(g => g.environment === 'sandbox');
    const productionGateway = gateways.find(g => g.environment === 'production');

    const formatGatewayStatus = (gateway: typeof sandboxGateway) => {
      if (!gateway) {
        return {
          status: 'disconnected' as const,
          lastTestAt: null,
          lastSuccessAt: null,
          merchantIdMasked: null,
          publicKeyMasked: null,
          privateKeyLast4: null,
          lastErrorMessageSafe: null,
        };
      }

      return {
        status: gateway.status || 'disconnected',
        lastTestAt: gateway.lastTestAt,
        lastSuccessAt: gateway.lastSuccessAt,
        merchantIdMasked: maskMerchantId(gateway.merchantId),
        publicKeyMasked: maskPublicKey(gateway.publicKey),
        privateKeyLast4: gateway.privateKeyLast4,
        lastErrorMessageSafe: gateway.lastErrorMessageSafe,
      };
    };

    res.json({
      provider: 'braintree',
      activeEnvironment: billingSettings?.activeEnvironment || 'sandbox',
      isPaymentsEnabled: billingSettings?.isPaymentsEnabled || false,
      sandbox: formatGatewayStatus(sandboxGateway),
      production: formatGatewayStatus(productionGateway),
    });
  } catch (error: any) {
    console.error('Error fetching gateway status:', error);
    res.status(500).json({ error: 'Failed to fetch gateway status' });
  }
});

const credentialsSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  publicKey: z.string().min(1, 'Public Key is required'),
  privateKey: z.string().min(1, 'Private Key is required'),
});

adminBillingRouter.post('/gateway/:environment', requireAdmin, auditMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user.tenantId;
    const environment = req.params.environment as GatewayEnvironment;

    if (environment !== 'sandbox' && environment !== 'production') {
      return res.status(400).json({ error: 'Invalid environment. Must be "sandbox" or "production"' });
    }

    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { merchantId, publicKey, privateKey } = parsed.data;

    const privateKeyEncrypted = encrypt(privateKey);
    const privateKeyLast4 = privateKey.slice(-4);
    const now = new Date();

    const [existingGateway] = await db.select()
      .from(tenantPaymentGateways)
      .where(
        and(
          eq(tenantPaymentGateways.tenantId, tenantId),
          eq(tenantPaymentGateways.environment, environment),
          isNull(tenantPaymentGateways.deletedAt)
        )
      )
      .limit(1);

    let gatewayId: string;
    const isUpdate = !!existingGateway;

    if (existingGateway) {
      await db.update(tenantPaymentGateways)
        .set({
          merchantId,
          publicKey,
          privateKeyEncrypted,
          privateKeyLast4,
          status: 'disconnected',
          updatedAt: now,
        })
        .where(eq(tenantPaymentGateways.id, existingGateway.id));
      gatewayId = existingGateway.id;
    } else {
      const [newGateway] = await db.insert(tenantPaymentGateways)
        .values({
          tenantId,
          provider: 'braintree',
          environment,
          merchantId,
          publicKey,
          privateKeyEncrypted,
          privateKeyLast4,
          status: 'disconnected',
        })
        .returning();
      gatewayId = newGateway.id;

      const [existingSettings] = await db.select()
        .from(tenantBillingSettings)
        .where(eq(tenantBillingSettings.tenantId, tenantId))
        .limit(1);

      if (!existingSettings) {
        await db.insert(tenantBillingSettings).values({
          tenantId,
          provider: 'braintree',
          activeEnvironment: 'sandbox',
          isPaymentsEnabled: false,
        });
      }
    }

    const testResult = await testGatewayConnection(tenantId, environment);

    const [updatedGateway] = await db.select()
      .from(tenantPaymentGateways)
      .where(eq(tenantPaymentGateways.id, gatewayId))
      .limit(1);

    await logBillingAction({
      tenantId,
      actorUserId: user.clerkUserId || user.id,
      action: isUpdate ? 'gateway.update' : 'gateway.connect',
      environment,
      metadata: {
        success: testResult.success,
        merchantIdMasked: maskMerchantId(merchantId),
      },
      ipAddress: req.auditContext?.ipAddress,
      userAgent: req.auditContext?.userAgent,
    });

    res.json({
      status: updatedGateway?.status || 'error',
      lastTestAt: updatedGateway?.lastTestAt,
      lastErrorMessageSafe: updatedGateway?.lastErrorMessageSafe,
    });
  } catch (error: any) {
    console.error('Error saving gateway credentials:', error);
    res.status(500).json({ error: 'Failed to save gateway credentials' });
  }
});

adminBillingRouter.post('/gateway/:environment/test', requireAdmin, auditMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user.tenantId;
    const environment = req.params.environment as GatewayEnvironment;

    if (environment !== 'sandbox' && environment !== 'production') {
      return res.status(400).json({ error: 'Invalid environment. Must be "sandbox" or "production"' });
    }

    const hasCredentialsInBody = req.body.merchantId && req.body.publicKey && req.body.privateKey;

    let testResult: { success: true; timestamp: Date } | { success: false; error: string };

    if (hasCredentialsInBody) {
      const parsed = credentialsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      testResult = await testGatewayConnectionWithCredentials(
        environment,
        parsed.data.merchantId,
        parsed.data.publicKey,
        parsed.data.privateKey
      );
    } else {
      testResult = await testGatewayConnection(tenantId, environment);
    }

    await logBillingAction({
      tenantId,
      actorUserId: user.clerkUserId || user.id,
      action: 'gateway.test',
      environment,
      metadata: {
        success: testResult.success,
        error: testResult.success ? undefined : (testResult as any).error,
        testedWithProvidedCredentials: hasCredentialsInBody,
      },
      ipAddress: req.auditContext?.ipAddress,
      userAgent: req.auditContext?.userAgent,
    });

    if (testResult.success) {
      res.json({
        success: true,
        lastTestAt: testResult.timestamp,
      });
    } else {
      res.json({
        success: false,
        lastTestAt: new Date(),
        error: (testResult as any).error,
        errorSafe: (testResult as any).error,
        suggestions: [
          'Verify your Merchant ID is correct',
          'Check that Public Key and Private Key match',
          'Ensure your Braintree account is active',
          'Try using Sandbox credentials first',
        ],
      });
    }
  } catch (error: any) {
    console.error('Error testing gateway connection:', error);
    res.status(500).json({ error: 'Failed to test gateway connection' });
  }
});

const environmentSchema = z.object({
  activeEnvironment: z.enum(['sandbox', 'production']),
});

adminBillingRouter.post('/settings/environment', requireAdmin, auditMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user.tenantId;

    const parsed = environmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { activeEnvironment } = parsed.data;
    const warnings: string[] = [];

    if (activeEnvironment === 'production') {
      const [productionGateway] = await db.select()
        .from(tenantPaymentGateways)
        .where(
          and(
            eq(tenantPaymentGateways.tenantId, tenantId),
            eq(tenantPaymentGateways.environment, 'production'),
            isNull(tenantPaymentGateways.deletedAt)
          )
        )
        .limit(1);

      if (!productionGateway || productionGateway.status !== 'connected') {
        return res.status(400).json({ 
          error: 'Cannot switch to production: Production gateway is not connected. Please configure and test production credentials first.' 
        });
      }
    }

    const now = new Date();

    const [existingSettings] = await db.select()
      .from(tenantBillingSettings)
      .where(eq(tenantBillingSettings.tenantId, tenantId))
      .limit(1);

    if (existingSettings) {
      await db.update(tenantBillingSettings)
        .set({
          activeEnvironment,
          updatedAt: now,
        })
        .where(eq(tenantBillingSettings.tenantId, tenantId));
    } else {
      await db.insert(tenantBillingSettings).values({
        tenantId,
        provider: 'braintree',
        activeEnvironment,
        isPaymentsEnabled: false,
      });
    }

    const [updatedSettings] = await db.select()
      .from(tenantBillingSettings)
      .where(eq(tenantBillingSettings.tenantId, tenantId))
      .limit(1);

    await logBillingAction({
      tenantId,
      actorUserId: user.clerkUserId || user.id,
      action: 'gateway.toggleEnvironment',
      environment: activeEnvironment,
      metadata: {
        previousEnvironment: existingSettings?.activeEnvironment || 'sandbox',
        newEnvironment: activeEnvironment,
      },
      ipAddress: req.auditContext?.ipAddress,
      userAgent: req.auditContext?.userAgent,
    });

    res.json({
      activeEnvironment: updatedSettings?.activeEnvironment || activeEnvironment,
      isPaymentsEnabled: updatedSettings?.isPaymentsEnabled || false,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error: any) {
    console.error('Error updating environment:', error);
    res.status(500).json({ error: 'Failed to update environment' });
  }
});

const disconnectSchema = z.object({
  environment: z.enum(['sandbox', 'production', 'all']),
});

adminBillingRouter.post('/gateway/disconnect', requireAdmin, auditMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user.tenantId;

    const parsed = disconnectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { environment } = parsed.data;
    const now = new Date();

    const [billingSettings] = await db.select()
      .from(tenantBillingSettings)
      .where(eq(tenantBillingSettings.tenantId, tenantId))
      .limit(1);

    const environmentsToDisconnect = environment === 'all' 
      ? ['sandbox', 'production'] as const
      : [environment] as const;

    for (const env of environmentsToDisconnect) {
      await db.update(tenantPaymentGateways)
        .set({
          privateKeyEncrypted: null,
          status: 'disconnected',
          updatedAt: now,
        })
        .where(
          and(
            eq(tenantPaymentGateways.tenantId, tenantId),
            eq(tenantPaymentGateways.environment, env),
            isNull(tenantPaymentGateways.deletedAt)
          )
        );
    }

    const activeEnv = billingSettings?.activeEnvironment;
    if (environment === 'all' || (activeEnv && environmentsToDisconnect.includes(activeEnv as any))) {
      await db.update(tenantBillingSettings)
        .set({
          isPaymentsEnabled: false,
          updatedAt: now,
        })
        .where(eq(tenantBillingSettings.tenantId, tenantId));
    }

    await logBillingAction({
      tenantId,
      actorUserId: user.clerkUserId || user.id,
      action: 'gateway.disconnect',
      environment,
      metadata: {
        disconnectedEnvironments: environmentsToDisconnect,
      },
      ipAddress: req.auditContext?.ipAddress,
      userAgent: req.auditContext?.userAgent,
    });

    res.json({ disconnected: true });
  } catch (error: any) {
    console.error('Error disconnecting gateway:', error);
    res.status(500).json({ error: 'Failed to disconnect gateway' });
  }
});

adminBillingRouter.delete('/gateway/:environment', requireAdmin, auditMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user.tenantId;
    const environment = req.params.environment as GatewayEnvironment;

    if (environment !== 'sandbox' && environment !== 'production') {
      return res.status(400).json({ error: 'Invalid environment. Must be "sandbox" or "production"' });
    }

    const now = new Date();

    const [billingSettings] = await db.select()
      .from(tenantBillingSettings)
      .where(eq(tenantBillingSettings.tenantId, tenantId))
      .limit(1);

    await db.update(tenantPaymentGateways)
      .set({
        privateKeyEncrypted: null,
        status: 'disconnected',
        updatedAt: now,
      })
      .where(
        and(
          eq(tenantPaymentGateways.tenantId, tenantId),
          eq(tenantPaymentGateways.environment, environment),
          isNull(tenantPaymentGateways.deletedAt)
        )
      );

    if (billingSettings?.activeEnvironment === environment) {
      await db.update(tenantBillingSettings)
        .set({
          isPaymentsEnabled: false,
          updatedAt: now,
        })
        .where(eq(tenantBillingSettings.tenantId, tenantId));
    }

    await logBillingAction({
      tenantId,
      actorUserId: user.clerkUserId || user.id,
      action: 'gateway.disconnect',
      environment,
      metadata: {
        disconnectedEnvironments: [environment],
      },
      ipAddress: req.auditContext?.ipAddress,
      userAgent: req.auditContext?.userAgent,
    });

    res.json({ disconnected: true });
  } catch (error: any) {
    console.error('Error disconnecting gateway:', error);
    res.status(500).json({ error: 'Failed to disconnect gateway' });
  }
});

const clientTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

checkoutRouter.post('/client-token', clientTokenLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let tenantId = user.tenantId;

    // If user doesn't have tenantId, try to get it from booking/session
    const { bookingId, sessionId } = req.body;
    if (!tenantId) {
      if (bookingId) {
        const [booking] = await db.select()
          .from(signups)
          .where(eq(signups.id, bookingId))
          .limit(1);
        if (booking) {
          tenantId = booking.tenantId;
        }
      } else if (sessionId) {
        const [session] = await db.select()
          .from(futsalSessions)
          .where(eq(futsalSessions.id, sessionId))
          .limit(1);
        if (session) {
          tenantId = session.tenantId;
        }
      }
    }

    if (!tenantId) {
      return res.status(400).json({ 
        error: 'Unable to determine organization. Please try again from the booking page.',
        code: 'TENANT_NOT_FOUND'
      });
    }

    const clientToken = await generateClientToken(tenantId);

    res.json({ clientToken });
  } catch (error: any) {
    console.error('Error generating client token:', error);
    res.status(500).json({ error: 'Failed to generate client token' });
  }
});

const submitPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amountCents: z.number().int().positive('Amount must be a positive integer'),
  paymentMethodNonce: z.string().min(1, 'Payment method nonce is required'),
  customerDetails: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
  }).optional(),
});

checkoutRouter.post('/submit', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const parsed = submitPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { bookingId, amountCents, paymentMethodNonce, customerDetails } = parsed.data;

    // Look up the booking to get tenantId
    const [booking] = await db.select()
      .from(signups)
      .where(eq(signups.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const tenantId = booking.tenantId;

    const result = await createTransaction(tenantId, {
      amountCents,
      paymentMethodNonce,
      bookingId,
      customerDetails,
    });

    res.json({
      transactionId: result.id,
      status: result.status,
    });
  } catch (error: any) {
    console.error('Error submitting payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

const router = Router();
router.use('/', adminBillingRouter);
router.use('/', checkoutRouter);

export default router;
