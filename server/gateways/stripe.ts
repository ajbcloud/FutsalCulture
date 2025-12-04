export async function chargeInvoice(invoiceId: string, tenantId: string, amountCents: number): Promise<{ ok: false; id: null; status: 'deprecated' }> {
  console.warn('⚠️ Stripe gateway is deprecated. Use Braintree for payment processing.');
  throw new Error('Stripe gateway is deprecated. Use Braintree for payment processing.');
}
