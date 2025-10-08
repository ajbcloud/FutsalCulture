import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';
import { storage } from '../../storage';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { Parser } from 'json2csv';

// List all invitation codes with filtering (includes platform and tenant codes)
export async function list(req: Request, res: Response) {
  try {
    const { page, pageSize } = pageParams(req.query);
    const { 
      tenantId, 
      codeType, 
      status, 
      isPlatform,
      search 
    } = req.query;
    
    const filters = {
      tenantId: tenantId as string | undefined,
      codeType: codeType as string | undefined,
      status: status as 'active' | 'expired' | 'fully_used' | undefined,
      isPlatform: isPlatform === 'true' ? true : isPlatform === 'false' ? false : undefined,
      search: search as string | undefined
    };
    
    const result = await storage.getSuperAdminInviteCodes(filters, page, pageSize);
    
    console.log(`Super Admin: invitations list retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
}

// Create a platform-wide invitation code
export async function create(req: Request, res: Response) {
  try {
    const createSchema = z.object({
      code: z.string().min(1).toUpperCase(),
      codeType: z.enum(['invite', 'access', 'discount']),
      description: z.string().optional(),
      isActive: z.boolean().default(true),
      ageGroup: z.string().optional(),
      gender: z.string().optional(),
      location: z.string().optional(),
      club: z.string().optional(),
      discountType: z.string().optional(),
      discountValue: z.number().optional(),
      maxUses: z.number().optional().nullable(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
      metadata: z.record(z.any()).optional(),
      tenantId: z.string().optional(), // Optional - for platform codes
      category: z.enum(['partner', 'promotion', 'beta', 'vip']).optional()
    });

    const validated = createSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    // Create platform code (tenantId can be specified or null for truly platform-wide)
    const inviteCode = await storage.createInviteCode({
      ...validated,
      isPlatform: true,
      tenantId: validated.tenantId || 'platform', // Use 'platform' as special tenant ID for platform codes
      createdBy: userId,
      validFrom: validated.validFrom ? new Date(validated.validFrom) : undefined,
      validUntil: validated.validUntil ? new Date(validated.validUntil) : undefined,
      currentUses: 0
    } as any);
    
    console.log(`Super Admin: platform invitation code created by ${userId}`);
    res.status(201).json(inviteCode);
  } catch (error: any) {
    console.error('Error creating invitation code:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create invitation code' });
    }
  }
}

// Get a specific invitation code with detailed information
export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const inviteCode = await storage.getInviteCode(id);
    
    if (!inviteCode) {
      return res.status(404).json({ error: 'Invitation code not found' });
    }
    
    // Get usage history for this code
    const usageHistory = await storage.getInviteCodeUsageHistory(id);
    
    res.json({
      ...inviteCode,
      usageHistory
    });
  } catch (error: any) {
    console.error('Error fetching invitation code:', error);
    res.status(500).json({ error: 'Failed to fetch invitation code' });
  }
}

// Update an invitation code
export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateSchema = z.object({
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      ageGroup: z.string().optional(),
      gender: z.string().optional(),
      location: z.string().optional(),
      club: z.string().optional(),
      discountType: z.string().optional(),
      discountValue: z.number().optional(),
      maxUses: z.number().optional().nullable(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
      metadata: z.record(z.any()).optional()
    });

    const validated = updateSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const updated = await storage.updateInviteCode(id, {
      ...validated,
      validFrom: validated.validFrom ? new Date(validated.validFrom) : undefined,
      validUntil: validated.validUntil ? new Date(validated.validUntil) : undefined
    } as any);
    
    console.log(`Super Admin: invitation code ${id} updated by ${userId}`);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating invitation code:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update invitation code' });
    }
  }
}

// Delete an invitation code
export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    await storage.deleteInviteCode(id);
    
    console.log(`Super Admin: invitation code ${id} deleted by ${userId}`);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting invitation code:', error);
    res.status(500).json({ error: 'Failed to delete invitation code' });
  }
}

// Get usage analytics for invitation codes
export async function analytics(req: Request, res: Response) {
  try {
    const { 
      startDate,
      endDate,
      tenantId,
      groupBy = 'tenant' // tenant, code_type, date
    } = req.query;
    
    const analytics = await storage.getInviteCodeAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      tenantId: tenantId as string | undefined,
      groupBy: groupBy as 'tenant' | 'code_type' | 'date'
    });
    
    console.log(`Super Admin: invitation analytics retrieved by ${(req as any).user?.id}`);
    res.json(analytics);
  } catch (error: any) {
    console.error('Error fetching invitation analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

// Generate multiple invitation codes in bulk
export async function bulkCreate(req: Request, res: Response) {
  try {
    const bulkCreateSchema = z.object({
      pattern: z.string().min(1), // e.g., "SUMMER2024-XXX"
      count: z.number().min(1).max(100),
      codeType: z.enum(['invite', 'access', 'discount']),
      description: z.string().optional(),
      isActive: z.boolean().default(true),
      tenantId: z.string().optional(),
      metadata: z.record(z.any()).optional(),
      discountType: z.string().optional(),
      discountValue: z.number().optional(),
      maxUses: z.number().optional().nullable(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional()
    });

    const validated = bulkCreateSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const codes = [];
    for (let i = 0; i < validated.count; i++) {
      // Replace XXX with random string
      const code = validated.pattern.replace(/XXX/g, nanoid(3).toUpperCase());
      
      codes.push({
        code,
        codeType: validated.codeType,
        description: validated.description,
        isActive: validated.isActive,
        isPlatform: true,
        tenantId: validated.tenantId || 'platform',
        metadata: validated.metadata,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        maxUses: validated.maxUses,
        validFrom: validated.validFrom ? new Date(validated.validFrom) : undefined,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : undefined,
        createdBy: userId,
        currentUses: 0
      });
    }
    
    const created = await storage.bulkCreateInviteCodes(codes as any);
    
    console.log(`Super Admin: ${created.length} invitation codes bulk created by ${userId}`);
    res.status(201).json({ created: created.length, codes: created });
  } catch (error: any) {
    console.error('Error bulk creating invitation codes:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to bulk create invitation codes' });
    }
  }
}

// Export invitation codes to CSV
export async function exportToCsv(req: Request, res: Response) {
  try {
    const { 
      tenantId, 
      codeType, 
      status,
      isPlatform
    } = req.query;
    
    const filters = {
      tenantId: tenantId as string | undefined,
      codeType: codeType as string | undefined,
      status: status as 'active' | 'expired' | 'fully_used' | undefined,
      isPlatform: isPlatform === 'true' ? true : isPlatform === 'false' ? false : undefined
    };
    
    const codes = await storage.getAllSuperAdminInviteCodes(filters);
    
    // Prepare CSV data
    const csvData = codes.map(code => ({
      Code: code.code,
      Type: code.codeType,
      Description: code.description || '',
      Tenant: code.tenantName || 'Platform',
      IsPlatform: code.isPlatform ? 'Yes' : 'No',
      Status: code.isActive ? 'Active' : 'Inactive',
      MaxUses: code.maxUses || 'Unlimited',
      CurrentUses: code.currentUses,
      ValidFrom: code.validFrom ? new Date(code.validFrom).toISOString().split('T')[0] : '',
      ValidUntil: code.validUntil ? new Date(code.validUntil).toISOString().split('T')[0] : '',
      DiscountType: code.discountType || '',
      DiscountValue: code.discountValue || '',
      CreatedAt: new Date(code.createdAt).toISOString().split('T')[0]
    }));
    
    const parser = new Parser();
    const csv = parser.parse(csvData);
    
    console.log(`Super Admin: invitation codes exported to CSV by ${(req as any).user?.id}`);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=invitation_codes.csv');
    res.send(csv);
  } catch (error: any) {
    console.error('Error exporting invitation codes:', error);
    res.status(500).json({ error: 'Failed to export invitation codes' });
  }
}

// Clone an existing code as a template
export async function cloneCode(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { code: newCode } = req.body;
    
    if (!newCode) {
      return res.status(400).json({ error: 'New code is required' });
    }
    
    const original = await storage.getInviteCode(id);
    if (!original) {
      return res.status(404).json({ error: 'Original code not found' });
    }
    
    const userId = (req as any).user?.id;
    
    // Create new code based on original
    const cloned = await storage.createInviteCode({
      ...original,
      id: undefined,
      code: newCode.toUpperCase(),
      currentUses: 0,
      createdBy: userId,
      createdAt: undefined,
      updatedAt: undefined
    } as any);
    
    console.log(`Super Admin: invitation code ${id} cloned by ${userId}`);
    res.status(201).json(cloned);
  } catch (error: any) {
    console.error('Error cloning invitation code:', error);
    res.status(500).json({ error: 'Failed to clone invitation code' });
  }
}

// Transfer a code to another tenant
export async function transferCode(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { targetTenantId } = req.body;
    
    if (!targetTenantId) {
      return res.status(400).json({ error: 'Target tenant ID is required' });
    }
    
    const userId = (req as any).user?.id;
    
    const updated = await storage.updateInviteCode(id, {
      tenantId: targetTenantId
    } as any);
    
    console.log(`Super Admin: invitation code ${id} transferred to tenant ${targetTenantId} by ${userId}`);
    res.json(updated);
  } catch (error: any) {
    console.error('Error transferring invitation code:', error);
    res.status(500).json({ error: 'Failed to transfer invitation code' });
  }
}