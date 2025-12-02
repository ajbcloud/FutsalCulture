import Stripe from 'stripe';

// Stripe initialization is now optional - the app is transitioning to Braintree
let stripeInstance: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-10-28.acacia',
  });
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY not configured - Stripe payments disabled (transitioning to Braintree)');
}

export const stripe = stripeInstance;

// Helper function to map price IDs to plan levels
export function getPlanLevelFromPriceId(priceId: string | null | undefined): 'free' | 'core' | 'growth' | 'elite' | null {
  if (!priceId) return null;
  
  const priceMappings: Record<string, 'free' | 'core' | 'growth' | 'elite'> = {
    [process.env.STRIPE_PRICE_FREE || '']: 'free',
    [process.env.STRIPE_PRICE_CORE || '']: 'core',
    [process.env.STRIPE_PRICE_GROWTH || '']: 'growth',
    [process.env.STRIPE_PRICE_ELITE || '']: 'elite',
  };
  
  return priceMappings[priceId] || null;
}

// Helper function to get price ID from plan level
export function getPriceIdFromPlanLevel(planLevel: 'free' | 'core' | 'growth' | 'elite'): string | null {
  const planMappings: Record<'free' | 'core' | 'growth' | 'elite', string | undefined> = {
    'free': process.env.STRIPE_PRICE_FREE,
    'core': process.env.STRIPE_PRICE_CORE,
    'growth': process.env.STRIPE_PRICE_GROWTH,
    'elite': process.env.STRIPE_PRICE_ELITE,
  };
  
  return planMappings[planLevel] || null;
}

// Helper function to determine plan level from subscription amount (fallback)
export function getPlanLevelFromAmount(amountInCents: number): 'core' | 'growth' | 'elite' | null {
  const amountMappings: Record<number, 'core' | 'growth' | 'elite'> = {
    9900: 'core',    // $99
    19900: 'growth',  // $199
    49900: 'elite',   // $499
  };
  
  return amountMappings[amountInCents] || null;
}

// Helper function to get the app base URL
export function getAppBaseUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  
  const replSlug = process.env.REPL_SLUG || 'your-app';
  const replOwner = process.env.REPL_OWNER || 'replit';
  return `https://${replSlug}.${replOwner}.replit.app`;
}