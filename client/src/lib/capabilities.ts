/**
 * Capability constants for frontend capability checking
 * These must match the capability constants defined in server/middleware/capabilities.ts
 */

export const FINANCIAL_ANALYTICS = 'FINANCIAL_ANALYTICS' as const;

export type Capability = typeof FINANCIAL_ANALYTICS;
