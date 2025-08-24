import "express";

declare module "express-serve-static-core" {
interface Request {
user?: { id: string; email: string; isVerified?: boolean; isSuperAdmin?: boolean };
tenantId?: string;
requestId?: string;
}
}

export {};