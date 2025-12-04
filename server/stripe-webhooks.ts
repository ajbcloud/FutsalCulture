import express from 'express';

const router = express.Router();

router.all('*', (req, res) => {
  res.status(410).json({ 
    error: 'Stripe webhooks have been deprecated. The application now uses Braintree for payment processing.',
    status: 'deprecated'
  });
});

export { router as stripeWebhookRouter };
