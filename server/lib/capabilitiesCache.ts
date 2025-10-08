// Shared cache for tenant capabilities
// This module provides a single cache that's shared between the capabilities controller
// and the featureAccess middleware to ensure consistency

const capabilitiesCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get cached capabilities for a tenant
export function getCachedCapabilities(tenantId: string): any | null {
  const cached = capabilitiesCache.get(tenantId);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  return null;
}

// Set capabilities cache for a tenant
export function setCachedCapabilities(tenantId: string, data: any): void {
  capabilitiesCache.set(tenantId, {
    data,
    expires: Date.now() + CACHE_TTL
  });
}

// Clear cache for a specific tenant or all tenants
export function clearCapabilitiesCache(tenantId?: string): void {
  if (tenantId) {
    console.log(`[CACHE] Clearing capabilities cache for tenant: ${tenantId}`);
    capabilitiesCache.delete(tenantId);
  } else {
    console.log('[CACHE] Clearing all capabilities cache');
    capabilitiesCache.clear();
  }
}

// Get cache TTL constant
export function getCacheTTL(): number {
  return CACHE_TTL;
}

// Check if tenant has cached data
export function hasCachedCapabilities(tenantId: string): boolean {
  return capabilitiesCache.has(tenantId);
}

// Get cache size
export function getCacheSize(): number {
  return capabilitiesCache.size;
}