import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: (process.env.BRAINTREE_ENV === 'production' ? braintree.Environment.Production : braintree.Environment.Sandbox),
  merchantId: process.env.BRAINTREE_MERCHANT_ID!,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY!,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY!,
});

async function getBTDefaultPaymentMethodToken(tenantId: string): Promise<string | null> {
  // TODO: Implement lookup from tenant_payment_profiles or similar table
  // For now, return null to indicate missing payment method
  return null;
}

export async function chargeInvoice(invoiceId: string, tenantId: string, amountCents: number) {
  const paymentMethodToken = await getBTDefaultPaymentMethodToken(tenantId);
  if (!paymentMethodToken) throw new Error('missing_payment_method');
  
  const result = await gateway.transaction.sale({
    amount: (amountCents/100).toFixed(2),
    paymentMethodToken,
    options: { submitForSettlement: true },
  });
  
  return { 
    ok: result.success, 
    id: result.transaction?.id, 
    status: result.success ? 'submitted' : 'failed' 
  };
}