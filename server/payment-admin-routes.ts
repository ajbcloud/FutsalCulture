import { Router } from 'express';
import { db } from './db';
import { payments, refunds, players, futsalSessions, users } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { paymentService } from './payment-service';
import { z } from 'zod';

const router = Router();

// Validation schemas
const voidPaymentSchema = z.object({
  reason: z.string().optional()
});

const refundPaymentSchema = z.object({
  amountCents: z.number().int().positive().optional(),
  reason: z.string().optional()
});

// Middleware to check admin/super admin permissions
const requireAdminAccess = (req: any, res: any, next: any) => {
  const currentUser = req.currentUser;
  if (!currentUser || (!currentUser.isAdmin && !currentUser.isSuperAdmin)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Get player's session history with payments
router.get('/admin/players/:playerId/sessions-with-payments', requireAdminAccess, async (req: any, res) => {
  try {
    const { playerId } = req.params;
    const currentUser = req.currentUser;
    const { limit = 50, cursor } = req.query;

    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Verify player belongs to tenant
    const player = await db.select()
      .from(players)
      .where(and(
        eq(players.id, playerId),
        eq(players.tenantId, currentUser.tenantId)
      ))
      .limit(1);

    if (!player.length) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Get sessions with payment information
    const sessionsWithPayments = await db.select({
      sessionId: futsalSessions.id,
      sessionTitle: futsalSessions.title,
      sessionDate: futsalSessions.startTime,
      sessionEndTime: futsalSessions.endTime,
      location: futsalSessions.location,
      locationName: futsalSessions.locationName,
      capacity: futsalSessions.capacity,
      priceCents: futsalSessions.priceCents,
      // Payment details
      paymentId: payments.id,
      processor: payments.processor,
      processorPaymentId: payments.processorPaymentId,
      amountCents: payments.amountCents,
      currency: payments.currency,
      status: payments.status,
      capturedAt: payments.capturedAt,
      voided_at: payments.voided_at,
      refundedAt: payments.refundedAt,
      refundAmountCents: payments.refundAmountCents,
      createdAt: payments.createdAt,
      meta: payments.meta
    })
    .from(futsalSessions)
    .leftJoin(payments, and(
      eq(payments.sessionId, futsalSessions.id),
      eq(payments.playerId, playerId)
    ))
    .where(and(
      eq(futsalSessions.tenantId, currentUser.tenantId),
      sql`EXISTS (
        SELECT 1 FROM signups s 
        WHERE s.session_id = ${futsalSessions.id} 
        AND s.player_id = ${playerId}
      )`
    ))
    .orderBy(sql`${futsalSessions.startTime} DESC`)
    .limit(parseInt(limit));

    // Get refund history for payments
    const paymentIds = sessionsWithPayments
      .filter(s => s.paymentId)
      .map(s => s.paymentId!);

    let refundHistory: any[] = [];
    if (paymentIds.length > 0) {
      refundHistory = await db.select({
        paymentId: refunds.paymentId,
        refundId: refunds.id,
        processorRefundId: refunds.processorRefundId,
        amountCents: refunds.amountCents,
        reason: refunds.reason,
        status: refunds.status,
        createdAt: refunds.createdAt,
        initiatedByUserId: refunds.initiatedByUserId
      })
      .from(refunds)
      .where(sql`${refunds.paymentId} = ANY(${paymentIds})`);
    }

    // Group refunds by payment ID
    const refundsByPayment = refundHistory.reduce((acc, refund) => {
      if (!acc[refund.paymentId]) {
        acc[refund.paymentId] = [];
      }
      acc[refund.paymentId].push(refund);
      return acc;
    }, {} as Record<string, any[]>);

    // Combine sessions with payment and refund data
    const result = sessionsWithPayments.map(session => ({
      session: {
        id: session.sessionId,
        title: session.sessionTitle,
        date: session.sessionDate,
        endTime: session.sessionEndTime,
        location: session.location,
        locationName: session.locationName,
        capacity: session.capacity,
        priceCents: session.priceCents
      },
      payment: session.paymentId ? {
        id: session.paymentId,
        processor: session.processor,
        processorPaymentId: session.processorPaymentId,
        amountCents: session.amountCents,
        currency: session.currency,
        status: session.status,
        capturedAt: session.capturedAt,
        voidedAt: session.voided_at,
        refundedAt: session.refundedAt,
        refundAmountCents: session.refundAmountCents,
        createdAt: session.createdAt,
        meta: session.meta,
        refunds: refundsByPayment[session.paymentId] || []
      } : null
    }));

    res.json(result);
  } catch (error) {
    console.error('Error getting player sessions with payments:', error);
    res.status(500).json({ message: 'Failed to get player sessions' });
  }
});

// Void a payment
router.post('/admin/payments/:paymentId/void', requireAdminAccess, async (req: any, res) => {
  try {
    const { paymentId } = req.params;
    const currentUser = req.currentUser;
    const validatedData = voidPaymentSchema.parse(req.body);

    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Verify payment belongs to tenant
    const payment = await db.select()
      .from(payments)
      .where(and(
        eq(payments.id, paymentId),
        eq(payments.tenantId, currentUser.tenantId)
      ))
      .limit(1);

    if (!payment.length) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const result = await paymentService.voidPayment(
      paymentId,
      currentUser.tenantId,
      currentUser.id
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Payment voided successfully',
        transactionId: result.transactionId,
        gatewayResponse: result.gatewayResponse
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error?.message || 'Failed to void payment',
        error: result.error,
        transactionId: result.transactionId
      });
    }
  } catch (error: any) {
    console.error('Error voiding payment:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid request data', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: 'Failed to void payment' });
  }
});

// Refund a payment
router.post('/admin/payments/:paymentId/refund', requireAdminAccess, async (req: any, res) => {
  try {
    const { paymentId } = req.params;
    const currentUser = req.currentUser;
    const validatedData = refundPaymentSchema.parse(req.body);

    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Verify payment belongs to tenant
    const payment = await db.select()
      .from(payments)
      .where(and(
        eq(payments.id, paymentId),
        eq(payments.tenantId, currentUser.tenantId)
      ))
      .limit(1);

    if (!payment.length) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const result = await paymentService.refundPayment(
      paymentId,
      currentUser.tenantId,
      currentUser.id,
      validatedData.amountCents,
      validatedData.reason
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Payment refunded successfully',
        refundId: result.refundId,
        amountCents: result.amountCents,
        gatewayResponse: result.gatewayResponse
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error?.message || 'Failed to refund payment',
        error: result.error,
        refundId: result.refundId,
        amountCents: result.amountCents
      });
    }
  } catch (error: any) {
    console.error('Error refunding payment:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid request data', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: 'Failed to refund payment' });
  }
});

// Get payment details with refund history
router.get('/admin/payments/:paymentId', requireAdminAccess, async (req: any, res) => {
  try {
    const { paymentId } = req.params;
    const currentUser = req.currentUser;

    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const paymentWithRefunds = await paymentService.getPaymentWithRefunds(
      paymentId,
      currentUser.tenantId
    );

    if (!paymentWithRefunds) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(paymentWithRefunds);
  } catch (error) {
    console.error('Error getting payment details:', error);
    res.status(500).json({ message: 'Failed to get payment details' });
  }
});

export default router;