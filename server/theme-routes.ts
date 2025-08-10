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

    // Return default theme if no custom settings exist - matching standard application colors
    const themeData = settings[0] || {
      // Light mode defaults - matching standard application theme
      lightPrimaryButton: '#3b82f6',      // hsl(217, 91%, 60%) - Primary brand color
      lightSecondaryButton: '#f3f4f6',    // hsl(214, 32%, 96%) - Input background
      lightBackground: '#ffffff',         // hsl(0, 0%, 100%) - Main background
      lightText: '#0f172a',              // hsl(222, 84%, 5%) - Primary text
      lightHeadingColor: '#0f172a',      // hsl(222, 84%, 5%) - Primary text for headings
      lightDescriptionColor: '#64748b',   // hsl(215, 16%, 35%) - Secondary text
      lightNavTitle: '#0f172a',          // Primary text for nav title
      lightNavText: '#64748b',           // Secondary text for nav
      lightNavActiveText: '#ffffff',      // White text on active nav items
      lightPageTitle: '#0f172a',         // Primary text for page titles
      lightCardBackground: '#ffffff',     // White card backgrounds
      lightCardTitle: '#0f172a',         // Primary text for card titles
      lightFeatureTitle: '#0f172a',      // Primary text for features
      lightFeatureDescription: '#64748b', // Secondary text for descriptions
      lightIconColor: '#3b82f6',         // Primary brand color for icons
      lightAccentColor: '#22c55e',       // Success/accent color
      lightBorderColor: '#e2e8f0',       // Default borders
      lightInputBackground: '#f8fafc',   // Input backgrounds
      lightSuccessColor: '#22c55e',      // Success states
      lightWarningColor: '#f59e0b',      // Warning states
      lightErrorColor: '#dc2626',        // Error states
      
      // Dark mode defaults - matching dark theme
      darkPrimaryButton: '#60a5fa',      // hsl(217, 91%, 70%) - Lighter brand for contrast
      darkSecondaryButton: '#475569',     // Dark secondary button
      darkBackground: '#0f1629',         // hsl(222, 84%, 4%) - Main dark background
      darkText: '#ffffff',               // Pure white text
      darkHeadingColor: '#ffffff',       // White headings in dark mode
      darkDescriptionColor: '#cbd5e1',   // hsl(210, 40%, 85%) - Light gray descriptions
      darkNavTitle: '#ffffff',           // White nav title
      darkNavText: '#cbd5e1',           // Light gray nav text
      darkNavActiveText: '#ffffff',       // White active nav text
      darkPageTitle: '#ffffff',          // White page titles
      darkCardBackground: '#1e293b',     // hsl(217, 33%, 8%) - Elevated surfaces
      darkCardTitle: '#ffffff',          // White card titles
      darkFeatureTitle: '#ffffff',       // White feature titles
      darkFeatureDescription: '#cbd5e1', // Light gray feature descriptions
      darkIconColor: '#60a5fa',          // Lighter brand color for icons
      darkAccentColor: '#34d399',        // Success/accent color for dark mode
      darkBorderColor: '#374151',        // hsl(217, 33%, 25%) - Dark borders
      darkInputBackground: '#1e293b',    // Dark input backgrounds
      darkSuccessColor: '#34d399',       // Success states for dark mode
      darkWarningColor: '#fbbf24',       // Warning states for dark mode
      darkErrorColor: '#f87171',         // Error states for dark mode
      
      // Legacy fields for backward compatibility
      primaryButton: '#3b82f6',
      secondaryButton: '#f3f4f6',
      background: '#ffffff',
      text: '#0f172a',
      headingColor: '#0f172a',
      descriptionColor: '#64748b'
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
          lightNavTitle: validatedData.lightNavTitle,
          lightNavText: validatedData.lightNavText,
          lightNavActiveText: validatedData.lightNavActiveText,
          lightPageTitle: validatedData.lightPageTitle,
          lightCardBackground: validatedData.lightCardBackground,
          lightCardTitle: validatedData.lightCardTitle,
          lightFeatureTitle: validatedData.lightFeatureTitle,
          lightFeatureDescription: validatedData.lightFeatureDescription,
          lightIconColor: validatedData.lightIconColor,
          lightAccentColor: validatedData.lightAccentColor,
          lightBorderColor: validatedData.lightBorderColor,
          lightInputBackground: validatedData.lightInputBackground,
          lightSuccessColor: validatedData.lightSuccessColor,
          lightWarningColor: validatedData.lightWarningColor,
          lightErrorColor: validatedData.lightErrorColor,
          
          // Dark mode colors
          darkPrimaryButton: validatedData.darkPrimaryButton,
          darkSecondaryButton: validatedData.darkSecondaryButton,
          darkBackground: validatedData.darkBackground,
          darkText: validatedData.darkText,
          darkHeadingColor: validatedData.darkHeadingColor,
          darkDescriptionColor: validatedData.darkDescriptionColor,
          darkNavTitle: validatedData.darkNavTitle,
          darkNavText: validatedData.darkNavText,
          darkNavActiveText: validatedData.darkNavActiveText,
          darkPageTitle: validatedData.darkPageTitle,
          darkCardBackground: validatedData.darkCardBackground,
          darkCardTitle: validatedData.darkCardTitle,
          darkFeatureTitle: validatedData.darkFeatureTitle,
          darkFeatureDescription: validatedData.darkFeatureDescription,
          darkIconColor: validatedData.darkIconColor,
          darkAccentColor: validatedData.darkAccentColor,
          darkBorderColor: validatedData.darkBorderColor,
          darkInputBackground: validatedData.darkInputBackground,
          darkSuccessColor: validatedData.darkSuccessColor,
          darkWarningColor: validatedData.darkWarningColor,
          darkErrorColor: validatedData.darkErrorColor,
          
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
          lightNavTitle: validatedData.lightNavTitle,
          lightNavText: validatedData.lightNavText,
          lightNavActiveText: validatedData.lightNavActiveText,
          lightPageTitle: validatedData.lightPageTitle,
          lightCardBackground: validatedData.lightCardBackground,
          lightCardTitle: validatedData.lightCardTitle,
          lightFeatureTitle: validatedData.lightFeatureTitle,
          lightFeatureDescription: validatedData.lightFeatureDescription,
          lightIconColor: validatedData.lightIconColor,
          lightAccentColor: validatedData.lightAccentColor,
          lightBorderColor: validatedData.lightBorderColor,
          lightInputBackground: validatedData.lightInputBackground,
          lightSuccessColor: validatedData.lightSuccessColor,
          lightWarningColor: validatedData.lightWarningColor,
          lightErrorColor: validatedData.lightErrorColor,
          
          // Dark mode colors
          darkPrimaryButton: validatedData.darkPrimaryButton,
          darkSecondaryButton: validatedData.darkSecondaryButton,
          darkBackground: validatedData.darkBackground,
          darkText: validatedData.darkText,
          darkHeadingColor: validatedData.darkHeadingColor,
          darkDescriptionColor: validatedData.darkDescriptionColor,
          darkNavTitle: validatedData.darkNavTitle,
          darkNavText: validatedData.darkNavText,
          darkNavActiveText: validatedData.darkNavActiveText,
          darkPageTitle: validatedData.darkPageTitle,
          darkCardBackground: validatedData.darkCardBackground,
          darkCardTitle: validatedData.darkCardTitle,
          darkFeatureTitle: validatedData.darkFeatureTitle,
          darkFeatureDescription: validatedData.darkFeatureDescription,
          darkIconColor: validatedData.darkIconColor,
          darkAccentColor: validatedData.darkAccentColor,
          darkBorderColor: validatedData.darkBorderColor,
          darkInputBackground: validatedData.darkInputBackground,
          darkSuccessColor: validatedData.darkSuccessColor,
          darkWarningColor: validatedData.darkWarningColor,
          darkErrorColor: validatedData.darkErrorColor,
          
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