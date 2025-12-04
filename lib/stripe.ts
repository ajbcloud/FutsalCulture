export const stripe = null;

export function getPlanLevelFromPriceId(priceId: string | null | undefined): 'free' | 'core' | 'growth' | 'elite' | null {
  return null;
}

export function getPriceIdFromPlanLevel(planLevel: 'free' | 'core' | 'growth' | 'elite'): string | null {
  return null;
}

export function getPlanLevelFromAmount(amountInCents: number): 'core' | 'growth' | 'elite' | null {
  return null;
}

export function getAppBaseUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  
  const replSlug = process.env.REPL_SLUG || 'your-app';
  const replOwner = process.env.REPL_OWNER || 'replit';
  return `https://${replSlug}.${replOwner}.replit.app`;
}
