import { db } from './db';
import { payments, refunds, integrations } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import Stripe from 'stripe';
import braintree from 'braintree';

interface PaymentServiceError {
  code: string;
  message: string;
  details?: any;
}

interface VoidResult {
  success: boolean;
  transactionId: string;
  error?: PaymentServiceError;
  gatewayResponse?: any;
}

interface RefundResult {
  success: boolean;
  refundId: string;
  amountCents: number;
  error?: PaymentServiceError;
  gatewayResponse?: any;
}

interface PaymentProcessor {
  provider: 'stripe' | 'braintree';
  credentials: any;
}

// Service for handling payment refunds and voids across Stripe and Braintree
export class PaymentService {
  
  // Get active payment processor for tenant
  private async getActiveProcessor(tenantId: string): Promise<PaymentProcessor | null> {
    try {
      const activeProcessor = await db.select()
        .from(integrations)
        .where(and(
          eq(integrations.enabled, true),
          sql`${integrations.provider} IN ('stripe', 'braintree')`,
          sql`(${integrations.tenantId} IS NULL OR ${integrations.tenantId} = ${tenantId})`
        ))
        .orderBy(sql`CASE WHEN ${integrations.tenantId} IS NOT NULL THEN 0 ELSE 1 END`)
        .limit(1);

      if (activeProcessor.length > 0) {
        return {
          provider: activeProcessor[0].provider as 'stripe' | 'braintree',
          credentials: activeProcessor[0].credentials
        };
      }

      // Fallback to environment-based Stripe
      if (process.env.STRIPE_SECRET_KEY) {
        return {
          provider: 'stripe',
          credentials: {
            secretKey: process.env.STRIPE_SECRET_KEY,
            publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting active payment processor:', error);
      return null;
    }
  }

  // Create Braintree gateway
  private createBraintreeGateway(credentials: any): braintree.BraintreeGateway {
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

  // Void a payment (cancel before settlement)
  async voidPayment(paymentId: string, tenantId: string, initiatedByUserId: string): Promise<VoidResult> {
    try {
      // Get payment record
      const payment = await db.select()
        .from(payments)
        .where(and(
          eq(payments.id, paymentId),
          eq(payments.tenantId, tenantId)
        ))
        .limit(1);

      if (!payment.length) {
        return {
          success: false,
          transactionId: '',
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' }
        };
      }

      const paymentRecord = payment[0];

      // Check if payment is voidable
      const voidableStatuses = ['authorized', 'submitted_for_settlement'];
      if (!voidableStatuses.includes(paymentRecord.status)) {
        return {
          success: false,
          transactionId: paymentRecord.processorPaymentId,
          error: { 
            code: 'NOT_VOIDABLE', 
            message: `Payment with status '${paymentRecord.status}' cannot be voided`
          }
        };
      }

      // Get processor configuration
      const processor = await this.getActiveProcessor(tenantId);
      if (!processor) {
        return {
          success: false,
          transactionId: paymentRecord.processorPaymentId,
          error: { code: 'NO_PROCESSOR', message: 'No payment processor configured' }
        };
      }

      let voidResult: any;
      let gatewayResponse: any;

      if (paymentRecord.processor === 'braintree' && processor.provider === 'braintree') {
        // Braintree void
        const gateway = this.createBraintreeGateway(processor.credentials);
        
        try {
          voidResult = await gateway.transaction.void(paymentRecord.processorPaymentId);
          gatewayResponse = voidResult;

          if (voidResult.success) {
            // Update payment record
            await db.update(payments)
              .set({
                status: 'voided',
                voided_at: new Date(),
                meta: { ...paymentRecord.meta, voidResponse: voidResult },
                updatedAt: new Date()
              })
              .where(eq(payments.id, paymentId));

            return {
              success: true,
              transactionId: paymentRecord.processorPaymentId,
              gatewayResponse: voidResult
            };
          } else {
            return {
              success: false,
              transactionId: paymentRecord.processorPaymentId,
              error: {
                code: 'BRAINTREE_VOID_FAILED',
                message: voidResult.message || 'Failed to void payment',
                details: voidResult
              },
              gatewayResponse: voidResult
            };
          }
        } catch (error: any) {
          return {
            success: false,
            transactionId: paymentRecord.processorPaymentId,
            error: {
              code: 'BRAINTREE_ERROR',
              message: error.message || 'Braintree void error',
              details: error
            }
          };
        }
      } else if (paymentRecord.processor === 'stripe' && processor.provider === 'stripe') {
        // Stripe void (cancel payment intent or refund uncaptured charge)
        const stripe = new Stripe(processor.credentials.secretKey || process.env.STRIPE_SECRET_KEY);

        try {
          // For Stripe, we need to check if it's a PaymentIntent or Charge
          if (paymentRecord.processorPaymentId.startsWith('pi_')) {
            // Cancel payment intent
            const paymentIntent = await stripe.paymentIntents.cancel(paymentRecord.processorPaymentId);
            gatewayResponse = paymentIntent;

            if (paymentIntent.status === 'canceled') {
              await db.update(payments)
                .set({
                  status: 'voided',
                  voided_at: new Date(),
                  meta: { ...paymentRecord.meta, voidResponse: paymentIntent },
                  updatedAt: new Date()
                })
                .where(eq(payments.id, paymentId));

              return {
                success: true,
                transactionId: paymentRecord.processorPaymentId,
                gatewayResponse: paymentIntent
              };
            }
          } else if (paymentRecord.processorPaymentId.startsWith('ch_')) {
            // For charges, we refund with amount 0 (void equivalent)
            const refund = await stripe.refunds.create({
              charge: paymentRecord.processorPaymentId,
              amount: 0
            });
            gatewayResponse = refund;

            await db.update(payments)
              .set({
                status: 'voided',
                voided_at: new Date(),
                meta: { ...paymentRecord.meta, voidResponse: refund },
                updatedAt: new Date()
              })
              .where(eq(payments.id, paymentId));

            return {
              success: true,
              transactionId: paymentRecord.processorPaymentId,
              gatewayResponse: refund
            };
          }

          return {
            success: false,
            transactionId: paymentRecord.processorPaymentId,
            error: {
              code: 'STRIPE_VOID_FAILED',
              message: 'Unable to void this Stripe payment',
              details: gatewayResponse
            }
          };
        } catch (error: any) {
          return {
            success: false,
            transactionId: paymentRecord.processorPaymentId,
            error: {
              code: 'STRIPE_ERROR',
              message: error.message || 'Stripe void error',
              details: error
            }
          };
        }
      } else {
        return {
          success: false,
          transactionId: paymentRecord.processorPaymentId,
          error: {
            code: 'PROCESSOR_MISMATCH',
            message: 'Payment processor mismatch'
          }
        };
      }
    } catch (error: any) {
      console.error('Error voiding payment:', error);
      return {
        success: false,
        transactionId: '',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal error processing void',
          details: error
        }
      };
    }
  }

  // Refund a payment (full or partial)
  async refundPayment(
    paymentId: string, 
    tenantId: string, 
    initiatedByUserId: string,
    amountCents?: number,
    reason?: string
  ): Promise<RefundResult> {
    try {
      // Get payment record
      const payment = await db.select()
        .from(payments)
        .where(and(
          eq(payments.id, paymentId),
          eq(payments.tenantId, tenantId)
        ))
        .limit(1);

      if (!payment.length) {
        return {
          success: false,
          refundId: '',
          amountCents: 0,
          error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' }
        };
      }

      const paymentRecord = payment[0];

      // Check if payment is refundable
      const refundableStatuses = ['settled', 'settling', 'paid'];
      if (!refundableStatuses.includes(paymentRecord.status)) {
        return {
          success: false,
          refundId: '',
          amountCents: 0,
          error: { 
            code: 'NOT_REFUNDABLE', 
            message: `Payment with status '${paymentRecord.status}' cannot be refunded`
          }
        };
      }

      // Calculate refund amount
      const refundAmount = amountCents || paymentRecord.amountCents;
      const maxRefundable = paymentRecord.amountCents - paymentRecord.refundAmountCents;

      if (refundAmount > maxRefundable) {
        return {
          success: false,
          refundId: '',
          amountCents: refundAmount,
          error: {
            code: 'INSUFFICIENT_REFUNDABLE',
            message: `Cannot refund $${refundAmount/100}. Maximum refundable: $${maxRefundable/100}`
          }
        };
      }

      // Get processor configuration
      const processor = await this.getActiveProcessor(tenantId);
      if (!processor) {
        return {
          success: false,
          refundId: '',
          amountCents: refundAmount,
          error: { code: 'NO_PROCESSOR', message: 'No payment processor configured' }
        };
      }

      let refundResult: any;
      let gatewayResponse: any;
      let refundId: string = '';

      if (paymentRecord.processor === 'braintree' && processor.provider === 'braintree') {
        // Braintree refund
        const gateway = this.createBraintreeGateway(processor.credentials);
        
        try {
          if (refundAmount === paymentRecord.amountCents) {
            // Full refund
            refundResult = await gateway.transaction.refund(paymentRecord.processorPaymentId);
          } else {
            // Partial refund
            refundResult = await gateway.transaction.refund(
              paymentRecord.processorPaymentId,
              (refundAmount / 100).toFixed(2)
            );
          }
          
          gatewayResponse = refundResult;

          if (refundResult.success) {
            refundId = refundResult.transaction.id;

            // Create refund record
            const [newRefund] = await db.insert(refunds).values({
              paymentId: paymentId,
              processorRefundId: refundId,
              amountCents: refundAmount,
              reason: reason || '',
              initiatedByUserId: initiatedByUserId,
              status: 'succeeded',
              processorResponse: refundResult
            }).returning();

            // Update payment record
            const isFullRefund = (paymentRecord.refundAmountCents + refundAmount) >= paymentRecord.amountCents;
            await db.update(payments)
              .set({
                status: isFullRefund ? 'refunded' : 'partial_refunded',
                refundAmountCents: paymentRecord.refundAmountCents + refundAmount,
                refundedAt: new Date(),
                meta: { ...paymentRecord.meta, refundResponse: refundResult },
                updatedAt: new Date()
              })
              .where(eq(payments.id, paymentId));

            return {
              success: true,
              refundId: refundId,
              amountCents: refundAmount,
              gatewayResponse: refundResult
            };
          } else {
            return {
              success: false,
              refundId: '',
              amountCents: refundAmount,
              error: {
                code: 'BRAINTREE_REFUND_FAILED',
                message: refundResult.message || 'Failed to refund payment',
                details: refundResult
              },
              gatewayResponse: refundResult
            };
          }
        } catch (error: any) {
          return {
            success: false,
            refundId: '',
            amountCents: refundAmount,
            error: {
              code: 'BRAINTREE_ERROR',
              message: error.message || 'Braintree refund error',
              details: error
            }
          };
        }
      } else if (paymentRecord.processor === 'stripe' && processor.provider === 'stripe') {
        // Stripe refund
        const stripe = new Stripe(processor.credentials.secretKey || process.env.STRIPE_SECRET_KEY);

        try {
          const refund = await stripe.refunds.create({
            charge: paymentRecord.processorPaymentId,
            amount: refundAmount,
            reason: 'requested_by_customer',
            metadata: {
              reason: reason || '',
              initiated_by: initiatedByUserId
            }
          });

          gatewayResponse = refund;
          refundId = refund.id;

          // Create refund record
          const [newRefund] = await db.insert(refunds).values({
            paymentId: paymentId,
            processorRefundId: refundId,
            amountCents: refundAmount,
            reason: reason || '',
            initiatedByUserId: initiatedByUserId,
            status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
            processorResponse: refund
          }).returning();

          // Update payment record
          const isFullRefund = (paymentRecord.refundAmountCents + refundAmount) >= paymentRecord.amountCents;
          await db.update(payments)
            .set({
              status: isFullRefund ? 'refunded' : 'partial_refunded',
              refundAmountCents: paymentRecord.refundAmountCents + refundAmount,
              refundedAt: new Date(),
              meta: { ...paymentRecord.meta, refundResponse: refund },
              updatedAt: new Date()
            })
            .where(eq(payments.id, paymentId));

          return {
            success: true,
            refundId: refundId,
            amountCents: refundAmount,
            gatewayResponse: refund
          };
        } catch (error: any) {
          return {
            success: false,
            refundId: '',
            amountCents: refundAmount,
            error: {
              code: 'STRIPE_ERROR',
              message: error.message || 'Stripe refund error',
              details: error
            }
          };
        }
      } else {
        return {
          success: false,
          refundId: '',
          amountCents: refundAmount,
          error: {
            code: 'PROCESSOR_MISMATCH',
            message: 'Payment processor mismatch'
          }
        };
      }
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      return {
        success: false,
        refundId: '',
        amountCents: 0,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal error processing refund',
          details: error
        }
      };
    }
  }

  // Get payment with refund history
  async getPaymentWithRefunds(paymentId: string, tenantId: string) {
    try {
      const payment = await db.select()
        .from(payments)
        .where(and(
          eq(payments.id, paymentId),
          eq(payments.tenantId, tenantId)
        ))
        .limit(1);

      if (!payment.length) {
        return null;
      }

      const refundHistory = await db.select()
        .from(refunds)
        .where(eq(refunds.paymentId, paymentId))
        .orderBy(sql`${refunds.createdAt} DESC`);

      return {
        ...payment[0],
        refunds: refundHistory
      };
    } catch (error) {
      console.error('Error getting payment with refunds:', error);
      return null;
    }
  }
}

export const paymentService = new PaymentService();