import { Request, Response, NextFunction } from 'express';
import { getCurrentPolicies } from '../controllers/superAdmin/platformSettings';

// Middleware to enforce maintenance mode
export async function maintenanceMode(req: Request & { user?: any }, res: Response, next: NextFunction) {
  try {
    // Skip public auth routes
    const publicRoutes = ['/api/auth/signup', '/api/auth/verify-email', '/api/auth/set-password', '/api/auth/resend_verification'];
    if (publicRoutes.includes(req.path)) {
      return next();
    }
    
    const policies = await getCurrentPolicies();
    
    if (policies?.maintenance?.enabled) {
      // Allow Super Admins to bypass maintenance mode
      if (req.user?.isSuperAdmin) {
        return next();
      }
      
      // Block all other users with maintenance message
      return res.status(503).json({
        error: 'Service Unavailable',
        message: policies.maintenance.message || 'The platform is undergoing scheduled maintenance. Please try again later.',
        maintenance: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    next(); // Continue if we can't check maintenance mode
  }
}

// Middleware to enforce MFA requirements
export async function enforceMFA(req: Request & { user?: any }, res: Response, next: NextFunction) {
  try {
    // Skip public auth routes
    const publicRoutes = ['/api/auth/signup', '/api/auth/verify-email', '/api/auth/set-password', '/api/auth/resend_verification'];
    if (publicRoutes.includes(req.path)) {
      return next();
    }
    
    const policies = await getCurrentPolicies();
    
    if (!policies) {
      return next();
    }
    
    // Check if user needs MFA based on their role
    const requiresMFA = 
      (req.user?.isSuperAdmin && policies.mfa?.requireSuperAdmins) ||
      (req.user?.isAdmin && !req.user?.isSuperAdmin && policies.mfa?.requireTenantAdmins);
    
    if (requiresMFA && !req.user?.mfaEnabled) {
      return res.status(403).json({
        error: 'MFA Required',
        message: 'Multi-factor authentication is required for your account',
        mfaRequired: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking MFA requirements:', error);
    next(); // Continue if we can't check MFA requirements
  }
}

// Middleware to check impersonation policy
export async function checkImpersonationPolicy(req: Request & { user?: any }, res: Response, next: NextFunction) {
  try {
    const policies = await getCurrentPolicies();
    
    if (!policies?.impersonation?.allow) {
      return res.status(403).json({
        error: 'Impersonation Disabled',
        message: 'Impersonation is currently disabled by platform policy'
      });
    }
    
    // Check if reason is required
    if (policies.impersonation.requireReason && !req.body?.reason) {
      return res.status(400).json({
        error: 'Reason Required',
        message: 'A reason is required for impersonation'
      });
    }
    
    // Set max duration from policy
    if (req.body) {
      req.body.maxDurationMinutes = Math.min(
        req.body.maxDurationMinutes || policies.impersonation.maxMinutes,
        policies.impersonation.maxMinutes
      );
    }
    
    next();
  } catch (error) {
    console.error('Error checking impersonation policy:', error);
    next(); // Continue if we can't check impersonation policy
  }
}

// Middleware to enforce session timeout
export async function enforceSessionTimeout(req: Request & { user?: any, session?: any }, res: Response, next: NextFunction) {
  try {
    // Skip public auth routes
    const publicRoutes = ['/api/auth/signup', '/api/auth/verify-email', '/api/auth/set-password', '/api/auth/resend_verification'];
    if (publicRoutes.includes(req.path)) {
      return next();
    }
    
    const policies = await getCurrentPolicies();
    
    if (!policies?.session?.idleTimeoutMinutes || !req.session) {
      return next();
    }
    
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    const idleTime = (now - lastActivity) / 1000 / 60; // Convert to minutes
    
    if (idleTime > policies.session.idleTimeoutMinutes) {
      // Session has expired due to inactivity
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
      });
      
      return res.status(401).json({
        error: 'Session Expired',
        message: 'Your session has expired due to inactivity. Please log in again.',
        sessionExpired: true
      });
    }
    
    // Update last activity time
    req.session.lastActivity = now;
    
    next();
  } catch (error) {
    console.error('Error checking session timeout:', error);
    next(); // Continue if we can't check session timeout
  }
}

// Middleware to check tenant approval policy for new tenant registration
export async function checkTenantApprovalPolicy(req: Request & { user?: any }, res: Response, next: NextFunction) {
  try {
    const policies = await getCurrentPolicies();
    
    if (!policies) {
      return next();
    }
    
    // Store approval policy in request for later use
    (req as any).tenantApprovalPolicy = {
      autoApprove: policies.autoApproveTenants,
      requireApproval: policies.requireTenantApproval
    };
    
    next();
  } catch (error) {
    console.error('Error checking tenant approval policy:', error);
    next(); // Continue if we can't check tenant approval policy
  }
}