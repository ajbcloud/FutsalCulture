import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2025-07-30.basil' });

async function getStripeCustomerIdForTenant(tenantId: string): Promise<string | null> {
  // TODO: Implement lookup from tenant_payment_profiles or similar table
  // For now, return null to indicate missing customer setup
  return null;
}

export async function chargeInvoice(invoiceId: string, tenantId: string, amountCents: number) {
  // Look up tenant's default payment method (store a stripe customer id per tenant)
  const customerId = await getStripeCustomerIdForTenant(tenantId);
  if (!customerId) throw new Error('missing_customer');
  
  // Create a PaymentIntent and confirm
  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    description: `Invoice ${invoiceId}`,
    statement_descriptor: 'FutsalHQ',
  });
  
  return { 
    ok: pi.status === 'succeeded' || pi.status === 'requires_capture', 
    id: pi.id, 
    status: pi.status 
  };
}