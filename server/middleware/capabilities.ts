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

// Define capability constants - basic capabilities
export const FINANCIAL_ANALYTICS = 'FINANCIAL_ANALYTICS' as const;

// Coach-specific capability constants
export const VIEW_PII = 'VIEW_PII' as const;
export const MANAGE_SESSIONS = 'MANAGE_SESSIONS' as const;
export const VIEW_ANALYTICS = 'VIEW_ANALYTICS' as const;
export const VIEW_ATTENDANCE = 'VIEW_ATTENDANCE' as const;
export const TAKE_ATTENDANCE = 'TAKE_ATTENDANCE' as const;
export const VIEW_FINANCIALS = 'VIEW_FINANCIALS' as const;
export const ISSUE_REFUNDS = 'ISSUE_REFUNDS' as const;
export const ISSUE_CREDITS = 'ISSUE_CREDITS' as const;
export const MANAGE_DISCOUNTS = 'MANAGE_DISCOUNTS' as const;
export const ACCESS_ADMIN_PORTAL = 'ACCESS_ADMIN_PORTAL' as const;

// Create a type for all capabilities
export type Capability = 
  | typeof FINANCIAL_ANALYTICS
  | typeof VIEW_PII
  | typeof MANAGE_SESSIONS
  | typeof VIEW_ANALYTICS
  | typeof VIEW_ATTENDANCE
  | typeof TAKE_ATTENDANCE
  | typeof VIEW_FINANCIALS
  | typeof ISSUE_REFUNDS
  | typeof ISSUE_CREDITS
  | typeof MANAGE_DISCOUNTS
  | typeof ACCESS_ADMIN_PORTAL;

// Coach permissions interface (matches coachTenantAssignments table)
export interface CoachPermissions {
  canViewPii: boolean;
  canManageSessions: boolean;
  canViewAnalytics: boolean;
  canViewAttendance: boolean;
  canTakeAttendance: boolean;
  canViewFinancials: boolean;
  canIssueRefunds: boolean;
  canIssueCredits: boolean;
  canManageDiscounts: boolean;
  canAccessAdminPortal: boolean;
}

// User interface based on the schema (minimal fields needed for capability checks)
interface User {
  id: string;
  isAdmin?: boolean | null;
  isAssistant?: boolean | null;
  isSuperAdmin?: boolean | null;
  role?: string | null;
  coachPermissions?: CoachPermissions | null; // Added for coach permission checks
}

// Extend Express Request to include user
interface RequestWithUser extends Request {
  user?: User;
}

// Capability map: maps capabilities to user roles
// Returns true if the user role has the capability
export const CAPABILITY_MAP: Record<Capability, (user: User) => boolean> = {
  [FINANCIAL_ANALYTICS]: (user: User) => {
    if (user.isAdmin) return true;
    if (user.isSuperAdmin) return true;
    if (user.isAssistant && user.coachPermissions?.canViewFinancials) return true;
    return false;
  },
  
  [VIEW_PII]: (user: User) => {
    if (user.isAdmin) return true;
    if (user.isSuperAdmin) return true;
    if (user.isAssistant && user.coachPermissions?.canViewPii) return true;
    return false;
  },
  
  [MANAGE_SESSIONS]: (user: User) => {
    if (user.isAdmin) return true;
    if (user.isSuperAdmin) return true;
    if (user.isAssistant && user.coachPermissions?.canManageSessions) return true;
    return false;
  },
  
  [VIEW_ANALYTICS]: (user: User) => {
    if (user.isAdmin) return true;
    if (user.isSuperAdmin) return true;
    if (user.isAssistant && user.coachPermissions?.canViewAnalytics) return true;
    return false;
  },
  
  [VIEW_ATTENDANCE]: (user: User) => {
    if (user.isAdmin) return true;
    if (user.isSuperAdmin) return true;
    if (user.isAssistant && user.coachPermissions?.canViewAttendance) return true;
    return false;
  },
  
  [TAKE_ATTENDANCE]: (user: User) => {
    if (user.isAdmin) return true;
    if (user.isSuperAdmin) return true;
    if (user.isAssistant && user.coachPermissions?.canTakeAttendance) return true;
    return false;
  },
  
  [VIEW_FINANCIALS]: (user: User) => {
    if (user.isAdmin) return true;
    if (user.isSuperAdmin) return true;
    if (user.isAssistant && user.coachPermissions?.canViewFinancials) return true;
    return false;
  },
  
  [ISSUE_REFUNDS]: (user: User) => {
    if (user.isAdmin) return true;
    if (user.isSuperAdmin) return true;
    if (user.isAssistant && user.coachPermissions?.canIssueRefunds) return true;
    return false;
  },
  
  [ISSUE_CREDITS]: (user: User) => {
    if (user.isAdmin) return true;
    if (user.isSuperAdmin) return true;
    if (user.isAssistant && user.coachPermissions?.canIssueCredits) return true;
    return false;
  },
  
  [MANAGE_DISCOUNTS]: (user: User) => {
    if (user.isAdmin) return true;
    if (user.isSuperAdmin) return true;
    if (user.isAssistant && user.coachPermissions?.canManageDiscounts) return true;
    return false;
  },
  
  [ACCESS_ADMIN_PORTAL]: (user: User) => {
    if (user.isAdmin) return true;
    if (user.isSuperAdmin) return true;
    if (user.isAssistant && user.coachPermissions?.canAccessAdminPortal) return true;
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
export const ALL_CAPABILITIES: Capability[] = [
  FINANCIAL_ANALYTICS,
  VIEW_PII,
  MANAGE_SESSIONS,
  VIEW_ANALYTICS,
  VIEW_ATTENDANCE,
  TAKE_ATTENDANCE,
  VIEW_FINANCIALS,
  ISSUE_REFUNDS,
  ISSUE_CREDITS,
  MANAGE_DISCOUNTS,
  ACCESS_ADMIN_PORTAL,
];
