import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { platformSettings } from '../../shared/schema';

// Cache for platform settings to avoid database hits on every request
let settingsCache: any = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getPlatformSettings() {
  const now = Date.now();
  if (settingsCache && now < cacheExpiry) {
    return settingsCache;
  }

  try {
    const [settings] = await db.select().from(platformSettings).limit(1);
    if (settings) {
      settingsCache = settings;
      cacheExpiry = now + CACHE_TTL;
    }
    return settings;
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return null;
  }
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await getPlatformSettings();
    const rateLimit = settings?.policies?.security?.apiRateLimit;
    
    if (!rateLimit?.enabled) {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || clientIP;
    const key = `rate_limit:${userId}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    
    let record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
      return next();
    }
    
    if (record.count >= rateLimit.requestsPerMinute) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Max ${rateLimit.requestsPerMinute} requests per minute.`,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
    rateLimitStore.set(key, record);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': rateLimit.requestsPerMinute.toString(),
      'X-RateLimit-Remaining': Math.max(0, rateLimit.requestsPerMinute - record.count).toString(),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
    });
    
    next();
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    next(); // Don't block requests on middleware errors
  }
}

export async function ipRestrictionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await getPlatformSettings();
    const ipRestrictions = settings?.policies?.security?.ipRestrictions;
    
    if (!ipRestrictions?.enabled || !ipRestrictions?.allowedIPs?.length) {
      return next();
    }

    // Only apply IP restrictions to admin/super-admin routes
    const isAdminRoute = req.path.includes('/admin') || req.path.includes('/super-admin');
    if (!isAdminRoute) {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const isAllowed = ipRestrictions.allowedIPs.some((allowedIP: string) => {
      // Support CIDR notation and exact matches
      if (allowedIP.includes('/')) {
        // Basic CIDR check (for production, use a proper IP library)
        const [network, mask] = allowedIP.split('/');
        return clientIP.startsWith(network.split('.').slice(0, parseInt(mask) / 8).join('.'));
      }
      return clientIP === allowedIP;
    });

    if (!isAllowed) {
      console.warn(`IP restriction blocked access from ${clientIP} to ${req.path}`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this resource.'
      });
    }

    next();
  } catch (error) {
    console.error('IP restriction middleware error:', error);
    next(); // Don't block requests on middleware errors
  }
}

// Session monitoring store (in production, use Redis)
const sessionStore = new Map<string, Set<string>>();

export async function sessionMonitoringMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await getPlatformSettings();
    const sessionMonitoring = settings?.policies?.security?.sessionMonitoring;
    
    if (!sessionMonitoring?.enabled) {
      return next();
    }

    const userId = (req as any).user?.id;
    const sessionId = (req as any).sessionID;
    
    if (!userId || !sessionId) {
      return next();
    }

    const userSessions = sessionStore.get(userId) || new Set();
    
    // Add current session
    userSessions.add(sessionId);
    
    // Check if user has too many concurrent sessions
    if (userSessions.size > sessionMonitoring.maxConcurrentSessions) {
      // Remove oldest session (in production, implement proper session cleanup)
      const oldestSession = userSessions.values().next().value;
      if (oldestSession) {
        userSessions.delete(oldestSession);
      }
      
      console.warn(`User ${userId} exceeded max concurrent sessions (${sessionMonitoring.maxConcurrentSessions})`);
    }
    
    sessionStore.set(userId, userSessions);
    
    // Add session info to response headers for monitoring
    res.set({
      'X-Session-Count': userSessions.size.toString(),
      'X-Session-Limit': sessionMonitoring.maxConcurrentSessions.toString()
    });
    
    next();
  } catch (error) {
    console.error('Session monitoring middleware error:', error);
    next(); // Don't block requests on middleware errors
  }
}

// Cleanup function to remove expired rate limit entries
setInterval(() => {
  const now = Date.now();
  const entriesToDelete: string[] = [];
  
  rateLimitStore.forEach((record, key) => {
    if (now > record.resetTime) {
      entriesToDelete.push(key);
    }
  });
  
  entriesToDelete.forEach(key => rateLimitStore.delete(key));
}, 60 * 1000); // Clean up every minute