export async function createCustomerPortalSession(customerId: string, returnUrl: string): Promise<string | null> {
  console.warn('⚠️ Stripe portal is deprecated. Use Braintree for payment management.');
  throw new Error('Stripe portal is deprecated. Use Braintree for payment management.');
}

export async function createOrGetCustomer(email: string, name?: string): Promise<null> {
  console.warn('⚠️ Stripe customer management is deprecated. Use Braintree for customer management.');
  throw new Error('Stripe customer management is deprecated. Use Braintree for customer management.');
}

export const PLAN_URLS = {
  core: null,
  growth: null,
  elite: null
};
