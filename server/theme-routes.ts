import { Request, Response, Router } from 'express';
import { db } from './db';
import { themeSettings, insertThemeSettingsSchema } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { isAuthenticated } from './replitAuth';
import { storage } from './storage';
import { hasFeature } from '@shared/feature-flags';
import { FEATURE_KEYS } from '@shared/schema';

const router = Router();

// GET /api/theme - Get current theme settings for tenant (Elite only)
router.get('/', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const tenantId = user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    // Check if tenant has theme customization feature
    const tenant = await storage.getTenant(tenantId);
    if (!tenant || !tenant.planLevel || !hasFeature(tenant.planLevel, FEATURE_KEYS.THEME_CUSTOMIZATION)) {
      return res.status(403).json({ error: 'Theme customization requires Elite plan' });
    }

    const settings = await db
      .select()
      .from(themeSettings)
      .where(eq(themeSettings.tenantId, tenantId))
      .limit(1);

    // Return default theme if no custom settings exist
    const themeData = settings[0] || {
      primaryButton: '#2563eb',
      secondaryButton: '#64748b', 
      background: '#ffffff',
      text: '#1f2937'
    };

    res.json(themeData);
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    res.status(500).json({ error: 'Failed to fetch theme settings' });
  }
});

// POST /api/theme - Update theme settings for tenant (Elite only)  
router.post('/', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const tenantId = user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    // Check if tenant has theme customization feature
    const tenant = await storage.getTenant(tenantId);
    if (!tenant || !tenant.planLevel || !hasFeature(tenant.planLevel, FEATURE_KEYS.THEME_CUSTOMIZATION)) {
      return res.status(403).json({ error: 'Theme customization requires Elite plan' });
    }

    // Validate the request body
    const validatedData = insertThemeSettingsSchema.parse({
      ...req.body,
      tenantId
    });

    // Check if theme settings already exist for this tenant
    const existing = await db
      .select()
      .from(themeSettings)
      .where(eq(themeSettings.tenantId, tenantId))
      .limit(1);

    let result;
    if (existing.length > 0) {
      // Update existing settings
      result = await db
        .update(themeSettings)
        .set({
          primaryButton: validatedData.primaryButton,
          secondaryButton: validatedData.secondaryButton,
          background: validatedData.background,
          text: validatedData.text,
          updatedAt: new Date()
        })
        .where(eq(themeSettings.tenantId, tenantId))
        .returning();
    } else {
      // Insert new settings
      result = await db
        .insert(themeSettings)
        .values(validatedData)
        .returning();
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating theme settings:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid theme data provided' });
    }
    res.status(500).json({ error: 'Failed to update theme settings' });
  }
});

// DELETE /api/theme - Reset theme to defaults (Elite only)
router.delete('/', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const tenantId = user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    // Check if tenant has theme customization feature
    const tenant = await storage.getTenant(tenantId);
    if (!tenant || !tenant.planLevel || !hasFeature(tenant.planLevel, FEATURE_KEYS.THEME_CUSTOMIZATION)) {
      return res.status(403).json({ error: 'Theme customization requires Elite plan' });
    }

    await db
      .delete(themeSettings)
      .where(eq(themeSettings.tenantId, tenantId));

    res.json({ message: 'Theme reset to defaults' });
  } catch (error) {
    console.error('Error resetting theme settings:', error);
    res.status(500).json({ error: 'Failed to reset theme settings' });
  }
});

export default router;