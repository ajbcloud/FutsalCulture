/**
 * Capability-based Permission System
 * 
 * This module provides a flexible, capability-based access control system
 * that works with the existing authentication middleware.
 * 
 * @example Basic usage in routes:
 * ```typescript
 * import { requireCapability, FINANCIAL_ANALYTICS } from './middleware/capabilities';
 * 
 * // Protect a route with a capability
 * app.get('/api/analytics/financial', 
 *   requireAuth, 
 *   requireCapability(FINANCIAL_ANALYTICS),
 *   async (req, res) => {
 *     // Only users with FINANCIAL_ANALYTICS capability can access this
 *     const data = await getFinancialData();
 *     res.json(data);
 *   }
 * );
 * ```
 * 
 * @example Programmatic capability check:
 * ```typescript
 * import { userHasCapability, FINANCIAL_ANALYTICS } from './middleware/capabilities';
 * 
 * if (userHasCapability(req.user, FINANCIAL_ANALYTICS)) {
 *   // User has financial analytics access
 * }
 * ```
 * 
 * @example Adding new capabilities:
 * 1. Define the capability constant:
 *    `export const NEW_CAPABILITY = 'NEW_CAPABILITY' as const;`
 * 2. Add it to the Capability type (TypeScript will auto-infer from constants)
 * 3. Add mapping logic to CAPABILITY_MAP
 * 4. Add to ALL_CAPABILITIES array
 */

import { Request, Response, NextFunction } from 'express';

// Define capability constants
export const FINANCIAL_ANALYTICS = 'FINANCIAL_ANALYTICS' as const;

// Create a type for all capabilities
export type Capability = typeof FINANCIAL_ANALYTICS;

// User interface based on the schema (minimal fields needed for capability checks)
interface User {
  id: string;
  isAdmin?: boolean | null;
  isAssistant?: boolean | null;
  isSuperAdmin?: boolean | null;
  role?: string | null;
}

// Extend Express Request to include user
interface RequestWithUser extends Request {
  user?: User;
}

// Capability map: maps capabilities to user roles
// Returns true if the user role has the capability
export const CAPABILITY_MAP: Record<Capability, (user: User) => boolean> = {
  [FINANCIAL_ANALYTICS]: (user: User) => {
    // Admin: has FINANCIAL_ANALYTICS capability
    if (user.isAdmin) return true;
    
    // Assistant: does NOT have FINANCIAL_ANALYTICS capability
    if (user.isAssistant) return false;
    
    // SuperAdmin: has FINANCIAL_ANALYTICS capability
    if (user.isSuperAdmin) return true;
    
    // Default: no access
    return false;
  },
};

/**
 * Helper function to check if a user has a specific capability
 * @param user - The user object to check
 * @param capability - The capability to check for
 * @returns boolean indicating if the user has the capability
 */
export function userHasCapability(user: User | undefined | null, capability: Capability): boolean {
  if (!user) return false;
  
  const checkFunction = CAPABILITY_MAP[capability];
  if (!checkFunction) return false;
  
  return checkFunction(user);
}

/**
 * Express middleware that gates routes based on capabilities
 * Returns 403 Forbidden if user doesn't have the required capability
 * @param capability - The capability required to access the route
 */
export function requireCapability(capability: Capability) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }
    
    if (!userHasCapability(user, capability)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Missing required capability: ${capability}` 
      });
    }
    
    next();
  };
}

// Export all capabilities as a constant array for easy reference
export const ALL_CAPABILITIES: Capability[] = [FINANCIAL_ANALYTICS];
