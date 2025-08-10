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
      // Light mode defaults - WCAG AA compliant
      lightPrimaryButton: '#3b66d9',      // Brand blue - slightly darker for better contrast
      lightSecondaryButton: '#f1f5f9',    // Light gray background
      lightBackground: '#ffffff',         // Pure white
      lightText: '#0c1629',               // High contrast dark text
      lightHeadingColor: '#0c1629',       // Same as text for consistency
      lightDescriptionColor: '#475569',   // Medium gray - WCAG AA compliant
      
      // Dark mode defaults - High contrast with white text
      darkPrimaryButton: '#5b8def',       // Lighter brand blue for dark backgrounds
      darkSecondaryButton: '#334155',     // Dark gray
      darkBackground: '#0c1629',          // Very dark blue-gray
      darkText: '#ffffff',                // Pure white text as requested
      darkHeadingColor: '#5b8def',        // Blue headings as specified
      darkDescriptionColor: '#d1d9e6',    // Light gray for descriptions
      
      // Legacy fields for backward compatibility
      primaryButton: '#3b66d9',
      secondaryButton: '#f1f5f9',
      background: '#ffffff',
      text: '#0c1629',
      headingColor: '#0c1629',
      descriptionColor: '#475569'
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
          // Light mode colors
          lightPrimaryButton: validatedData.lightPrimaryButton,
          lightSecondaryButton: validatedData.lightSecondaryButton,
          lightBackground: validatedData.lightBackground,
          lightText: validatedData.lightText,
          lightHeadingColor: validatedData.lightHeadingColor,
          lightDescriptionColor: validatedData.lightDescriptionColor,
          
          // Dark mode colors
          darkPrimaryButton: validatedData.darkPrimaryButton,
          darkSecondaryButton: validatedData.darkSecondaryButton,
          darkBackground: validatedData.darkBackground,
          darkText: validatedData.darkText,
          darkHeadingColor: validatedData.darkHeadingColor,
          darkDescriptionColor: validatedData.darkDescriptionColor,
          
          // Legacy fields for backward compatibility
          primaryButton: validatedData.lightPrimaryButton, // Use light mode as legacy fallback
          secondaryButton: validatedData.lightSecondaryButton,
          background: validatedData.lightBackground,
          text: validatedData.lightText,
          headingColor: validatedData.lightHeadingColor,
          descriptionColor: validatedData.lightDescriptionColor,
          
          updatedAt: new Date()
        })
        .where(eq(themeSettings.tenantId, tenantId))
        .returning();
    } else {
      // Create new settings
      result = await db
        .insert(themeSettings)
        .values({
          tenantId,
          // Light mode colors
          lightPrimaryButton: validatedData.lightPrimaryButton,
          lightSecondaryButton: validatedData.lightSecondaryButton,
          lightBackground: validatedData.lightBackground,
          lightText: validatedData.lightText,
          lightHeadingColor: validatedData.lightHeadingColor,
          lightDescriptionColor: validatedData.lightDescriptionColor,
          
          // Dark mode colors
          darkPrimaryButton: validatedData.darkPrimaryButton,
          darkSecondaryButton: validatedData.darkSecondaryButton,
          darkBackground: validatedData.darkBackground,
          darkText: validatedData.darkText,
          darkHeadingColor: validatedData.darkHeadingColor,
          darkDescriptionColor: validatedData.darkDescriptionColor,
          
          // Legacy fields for backward compatibility
          primaryButton: validatedData.lightPrimaryButton,
          secondaryButton: validatedData.lightSecondaryButton,
          background: validatedData.lightBackground,
          text: validatedData.lightText,
          headingColor: validatedData.lightHeadingColor,
          descriptionColor: validatedData.lightDescriptionColor
        })
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