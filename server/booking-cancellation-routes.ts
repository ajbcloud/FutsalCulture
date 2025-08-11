import { Router } from 'express';
import { db } from './db';
import { signups, payments, futsalSessions } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const cancelBookingSchema = z.object({
  sessionId: z.string(),
  playerId: z.string(),
  reason: z.string().optional()
});

// Cancel booking endpoint for parents/players
router.post('/cancel-booking', async (req: any, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { sessionId, playerId, reason } = cancelBookingSchema.parse(req.body);

    // Find the signup
    const signup = await db
      .select()
      .from(signups)
      .where(and(
        eq(signups.sessionId, sessionId),
        eq(signups.playerId, playerId),
        eq(signups.tenantId, currentUser.tenantId)
      ))
      .limit(1);

    if (!signup.length) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const bookingRecord = signup[0];

    // Check if user has permission to cancel this booking
    // User must be admin or the player associated with the booking
    const hasPermission = currentUser.isAdmin || 
                         currentUser.id === bookingRecord.playerId;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Get session details for refund processing
    const session = await db
      .select()
      .from(futsalSessions)
      .where(eq(futsalSessions.id, sessionId))
      .limit(1);

    if (!session.length) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const sessionRecord = session[0];

    // Check if cancellation is allowed (e.g., not too close to session time)
    const sessionDateTime = new Date(sessionRecord.startTime);
    const now = new Date();
    const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Allow cancellation up to 2 hours before the session
    if (hoursUntilSession < 2 && !currentUser.isAdmin) {
      return res.status(400).json({ 
        message: 'Cancellations are not allowed within 2 hours of the session start time' 
      });
    }

    // Process refund if payment was made
    let refundResult = null;
    if (bookingRecord.paid && bookingRecord.paymentId) {
      try {
        // Find the payment record
        const payment = await db
          .select()
          .from(payments)
          .where(eq(payments.signupId, bookingRecord.id))
          .limit(1);

        if (payment.length > 0) {
          const paymentRecord = payment[0];
          
          // Process refund using the payment service
          const { PaymentService } = await import('./payment-service');
          const paymentService = new PaymentService();
          refundResult = await paymentService.refundPayment(
            paymentRecord.id,
            paymentRecord.amountCents.toString(), // Full refund amount as string
            reason || 'Booking cancelled by customer'
          );

          console.log('Refund processed:', refundResult);
        }
      } catch (refundError) {
        console.error('Error processing refund:', refundError);
        // Continue with cancellation even if refund fails
        // The refund can be processed manually later
      }
    }

    // Remove the signup record
    await db
      .delete(signups)
      .where(eq(signups.id, bookingRecord.id));

    console.log(`Booking cancelled: Session ${sessionId}, Player ${playerId}, Refund: ${refundResult ? 'Processed' : 'N/A'}`);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      refundProcessed: !!refundResult,
      refundAmount: refundResult?.amountCents || 0
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid request data', 
        errors: error.errors 
      });
    }

    res.status(500).json({ 
      message: 'Failed to cancel booking. Please try again or contact support.' 
    });
  }
});

export default router;