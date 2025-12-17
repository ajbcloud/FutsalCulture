import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { billingAuditLogs } from '../../shared/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export type BillingAuditAction = 
  | 'gateway.connect'
  | 'gateway.update'
  | 'gateway.disconnect'
  | 'gateway.test'
  | 'gateway.toggleEnvironment'
  | 'webhook.secret.rotate';

const SENSITIVE_KEY_PATTERNS = [
  /key/i,
  /secret/i,
  /password/i,
  /token/i,
  /credential/i,
  /private/i,
  /auth/i,
  /bearer/i,
  /apikey/i,
  /api_key/i,
];

const SENSITIVE_VALUE_PATTERNS = [
  /^sk_/i,
  /^pk_/i,
  /^[a-f0-9]{32,}$/i,
  /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
  /^[A-Za-z0-9+/]{40,}={0,2}$/,
];

export function sanitizeMetadata(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSensitiveKey) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'string') {
      const isSensitiveValue = SENSITIVE_VALUE_PATTERNS.some(pattern => pattern.test(value));
      if (isSensitiveValue) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      sanitized[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'object' && item !== null ? sanitizeMetadata(item) : item
        );
      } else {
        sanitized[key] = sanitizeMetadata(value);
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export interface LogBillingActionParams {
  tenantId: string;
  actorUserId: string;
  action: BillingAuditAction;
  environment?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logBillingAction(params: LogBillingActionParams) {
  const {
    tenantId,
    actorUserId,
    action,
    environment,
    metadata,
    ipAddress,
    userAgent,
  } = params;

  const sanitizedMetadata = metadata ? sanitizeMetadata(metadata) : {};

  const [entry] = await db.insert(billingAuditLogs)
    .values({
      tenantId,
      actorUserId,
      action,
      environment,
      metadataJsonSafe: sanitizedMetadata,
      ipAddress,
      userAgent,
    })
    .returning();

  return entry;
}

export interface GetAuditLogsOptions {
  limit?: number;
  offset?: number;
  action?: BillingAuditAction;
  startDate?: Date;
  endDate?: Date;
}

export async function getAuditLogs(tenantId: string, options: GetAuditLogsOptions = {}) {
  const { limit = 50, offset = 0, action, startDate, endDate } = options;

  const conditions = [eq(billingAuditLogs.tenantId, tenantId)];

  if (action) {
    conditions.push(eq(billingAuditLogs.action, action));
  }

  if (startDate) {
    conditions.push(gte(billingAuditLogs.createdAt, startDate));
  }

  if (endDate) {
    conditions.push(lte(billingAuditLogs.createdAt, endDate));
  }

  const logs = await db.select()
    .from(billingAuditLogs)
    .where(and(...conditions))
    .orderBy(desc(billingAuditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return logs;
}

declare global {
  namespace Express {
    interface Request {
      auditContext?: {
        ipAddress: string;
        userAgent: string;
      };
    }
  }
}

export function createAuditMiddleware() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    let ipAddress = req.ip || 'unknown';
    
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) 
        ? forwardedFor[0] 
        : forwardedFor.split(',')[0];
      ipAddress = ips.trim();
    }

    const userAgent = req.headers['user-agent'] || 'unknown';

    req.auditContext = {
      ipAddress,
      userAgent,
    };

    next();
  };
}
