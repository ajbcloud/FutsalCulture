import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-09-30.acacia',
});

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}

export async function createOrGetCustomer(email: string, name?: string) {
  try {
    // First try to find existing customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer if none found
    const customer = await stripe.customers.create({
      email: email,
      name: name,
    });

    return customer;
  } catch (error) {
    console.error('Error creating/getting customer:', error);
    throw error;
  }
}

export const PLAN_URLS = {
  core: 'https://buy.stripe.com/test_14AeVe4GC2cAeVI4Ns2Fa00',
  growth: 'https://buy.stripe.com/test_dRmaEY8WS9F2bJwfs62Fa01',
  elite: 'https://buy.stripe.com/test_7sY7sMb50bNacNAeo22Fa02'
};