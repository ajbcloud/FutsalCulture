// Stripe Payment Links Configuration
// These are Stripe-hosted checkout pages that prevent duplicate subscriptions

export const STRIPE_PAYMENT_LINKS = {
  core: 'https://buy.stripe.com/test_28E6oI6PX94qgPi67977O02',
  growth: 'https://buy.stripe.com/test_4gMfZi2zH6Wicz2fHJ77O01',
  elite: 'https://buy.stripe.com/test_14A8wQ3DLgwS9mQanp77O00',
  free: 'https://buy.stripe.com/test_9B67sM3DL2G21UofHJ77O03',
} as const;

export type PlanKey = keyof typeof STRIPE_PAYMENT_LINKS;

/**
 * Creates a Stripe payment link with success and cancel redirect URLs
 * @param plan - The plan to upgrade/downgrade to
 * @param tenantId - The tenant ID for tracking
 * @param currentDomain - The current app domain for redirects
 * @returns Complete payment link URL with redirect parameters
 */
export function createStripePaymentLink(
  plan: PlanKey,
  tenantId: string,
  currentDomain: string
): string {
  const baseLink = STRIPE_PAYMENT_LINKS[plan];
  const params = new URLSearchParams({
    client_reference_id: tenantId,
    success_url: `${currentDomain}/admin/settings?upgrade=success&plan=${plan}`,
    cancel_url: `${currentDomain}/admin/settings?upgrade=cancelled`,
  });
  
  return `${baseLink}?${params.toString()}`;
}
