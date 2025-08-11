import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface CustomTheme {
  // Light mode colors (numbered 1-15)
  lightPrimaryButton: string;        // 1
  lightSecondaryButton: string;      // 2
  lightBackground: string;           // 3
  lightText: string;                 // 4
  lightHeadingColor: string;         // 5
  lightDescriptionColor: string;     // 6
  lightNavTitle?: string;            // 7
  lightNavText?: string;             // 8
  lightNavActiveText?: string;       // 9
  lightPageTitle?: string;           // 10
  lightCardBackground?: string;      // 11
  lightCardTitle?: string;           // 12
  lightFeatureTitle?: string;        // 13
  lightFeatureDescription?: string;  // 14
  lightIconColor?: string;           // 15
  lightAccentColor?: string;
  lightBorderColor?: string;
  lightNavActiveBg?: string;
  
  // Dark mode colors (numbered 1-15)
  darkPrimaryButton: string;         // 1
  darkSecondaryButton: string;       // 2
  darkBackground: string;            // 3
  darkText: string;                  // 4
  darkHeadingColor: string;          // 5
  darkDescriptionColor: string;      // 6
  darkNavTitle?: string;             // 7
  darkNavText?: string;              // 8
  darkNavActiveText?: string;        // 9
  darkPageTitle?: string;            // 10
  darkCardBackground?: string;       // 11
  darkCardTitle?: string;            // 12
  darkFeatureTitle?: string;         // 13
  darkFeatureDescription?: string;   // 14
  darkIconColor?: string;            // 15
  darkAccentColor?: string;
  darkBorderColor?: string;
  darkNavActiveBg?: string;
  
  // Additional properties for extended theme (missing from original interface)
  lightInputBackground?: string;
  lightSuccessColor?: string;
  lightWarningColor?: string;
  lightErrorColor?: string;
  darkInputBackground?: string;
  darkSuccessColor?: string;
  darkWarningColor?: string;
  darkErrorColor?: string;
  
  // Legacy fallbacks
  primaryButton?: string;
  secondaryButton?: string;
  background?: string;
  text?: string;
  headingColor?: string;
  descriptionColor?: string;
}

interface CustomThemeContextType {
  theme: CustomTheme | null;
  isLoading: boolean;
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined);

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  // Fetch tenant's custom theme settings
  const { data: theme, isLoading } = useQuery<CustomTheme>({
    queryKey: ['/api/theme'],
    retry: false, // Don't retry on auth errors
    retryOnMount: false,
    refetchOnWindowFocus: false
  });

  // Apply theme colors as CSS variables
  useEffect(() => {
    if (theme) {
      const root = document.documentElement;
      
      // Convert hex colors to HSL for CSS variables
      const hexToHsl = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }

        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };

      // Apply light mode custom colors as CSS variables
      root.style.setProperty('--custom-light-primary', `hsl(${hexToHsl(theme.lightPrimaryButton)})`);
      root.style.setProperty('--custom-light-secondary', `hsl(${hexToHsl(theme.lightSecondaryButton)})`);
      root.style.setProperty('--custom-light-background', `hsl(${hexToHsl(theme.lightBackground)})`);
      root.style.setProperty('--custom-light-foreground', `hsl(${hexToHsl(theme.lightText)})`);
      root.style.setProperty('--custom-light-heading', `hsl(${hexToHsl(theme.lightHeadingColor)})`);
      root.style.setProperty('--custom-light-description', `hsl(${hexToHsl(theme.lightDescriptionColor)})`);
      
      // Apply light mode navigation colors (numbered 7-9)
      root.style.setProperty('--custom-light-nav-title', `hsl(${hexToHsl(theme.lightNavTitle || '#111827')})`);
      root.style.setProperty('--custom-light-nav-text', `hsl(${hexToHsl(theme.lightNavText || '#6b7280')})`);
      root.style.setProperty('--custom-light-nav-active-text', `hsl(${hexToHsl(theme.lightNavActiveText || '#ffffff')})`);
      // Use primary button color for active navigation background
      root.style.setProperty('--custom-light-nav-active-bg', `hsl(${hexToHsl(theme.lightPrimaryButton || '#2563eb')})`);

      // Apply extended light mode colors (numbered 10-15) as HSL
      root.style.setProperty('--custom-light-page-title', `hsl(${hexToHsl(theme.lightPageTitle || '#111827')})`);
      root.style.setProperty('--custom-light-card-background', `hsl(${hexToHsl(theme.lightCardBackground || '#ffffff')})`);
      root.style.setProperty('--custom-light-card-title', `hsl(${hexToHsl(theme.lightCardTitle || '#111827')})`);
      root.style.setProperty('--custom-light-feature-title', `hsl(${hexToHsl(theme.lightFeatureTitle || '#111827')})`);
      root.style.setProperty('--custom-light-feature-description', `hsl(${hexToHsl(theme.lightFeatureDescription || '#4b5563')})`);
      root.style.setProperty('--custom-light-icon-color', `hsl(${hexToHsl(theme.lightIconColor || '#6366f1')})`);
      
      // Apply dark mode custom colors as CSS variables
      root.style.setProperty('--custom-dark-primary', `hsl(${hexToHsl(theme.darkPrimaryButton)})`);
      root.style.setProperty('--custom-dark-secondary', `hsl(${hexToHsl(theme.darkSecondaryButton)})`);
      root.style.setProperty('--custom-dark-background', `hsl(${hexToHsl(theme.darkBackground)})`);
      root.style.setProperty('--custom-dark-foreground', `hsl(${hexToHsl(theme.darkText)})`);
      root.style.setProperty('--custom-dark-heading', `hsl(${hexToHsl(theme.darkHeadingColor)})`);
      root.style.setProperty('--custom-dark-description', `hsl(${hexToHsl(theme.darkDescriptionColor)})`);

      // Apply dark mode navigation colors (numbered 7-9)
      root.style.setProperty('--custom-dark-nav-title', `hsl(${hexToHsl(theme.darkNavTitle || '#f8fafc')})`);
      root.style.setProperty('--custom-dark-nav-text', `hsl(${hexToHsl(theme.darkNavText || '#cbd5e1')})`);
      root.style.setProperty('--custom-dark-nav-active-text', `hsl(${hexToHsl(theme.darkNavActiveText || '#ffffff')})`);
      // Use primary button color for active navigation background
      root.style.setProperty('--custom-dark-nav-active-bg', `hsl(${hexToHsl(theme.darkPrimaryButton || '#2563eb')})`);

      // Apply extended dark mode colors (numbered 10-15) as HSL - matching Growth plan defaults
      root.style.setProperty('--custom-dark-page-title', `hsl(${hexToHsl(theme.darkPageTitle || '#ffffff')})`);
      root.style.setProperty('--custom-dark-card-background', `hsl(${hexToHsl(theme.darkCardBackground || '#1e293b')})`);
      root.style.setProperty('--custom-dark-card-title', `hsl(${hexToHsl(theme.darkCardTitle || '#ffffff')})`);
      root.style.setProperty('--custom-dark-feature-title', `hsl(${hexToHsl(theme.darkFeatureTitle || '#ffffff')})`);
      root.style.setProperty('--custom-dark-feature-description', `hsl(${hexToHsl(theme.darkFeatureDescription || '#cbd5e1')})`);
      root.style.setProperty('--custom-dark-icon-color', `hsl(${hexToHsl(theme.darkIconColor || '#60a5fa')})`);
      
      // Apply extended light mode colors with fallbacks for missing properties
      root.style.setProperty('--custom-light-accent-color', `hsl(${hexToHsl(theme.lightAccentColor || '#22c55e')})`);
      root.style.setProperty('--custom-light-border-color', `hsl(${hexToHsl(theme.lightBorderColor || '#e2e8f0')})`);
      root.style.setProperty('--custom-dark-accent-color', `hsl(${hexToHsl(theme.darkAccentColor || '#34d399')})`);
      root.style.setProperty('--custom-dark-border-color', `hsl(${hexToHsl(theme.darkBorderColor || '#374151')})`);
      
      // Apply additional new properties from schema
      root.style.setProperty('--custom-light-input-background', `hsl(${hexToHsl(theme.lightInputBackground || '#f8fafc')})`);
      root.style.setProperty('--custom-light-success-color', `hsl(${hexToHsl(theme.lightSuccessColor || '#22c55e')})`);
      root.style.setProperty('--custom-light-warning-color', `hsl(${hexToHsl(theme.lightWarningColor || '#f59e0b')})`);
      root.style.setProperty('--custom-light-error-color', `hsl(${hexToHsl(theme.lightErrorColor || '#dc2626')})`);
      
      root.style.setProperty('--custom-dark-input-background', `hsl(${hexToHsl(theme.darkInputBackground || '#1e293b')})`);
      root.style.setProperty('--custom-dark-success-color', `hsl(${hexToHsl(theme.darkSuccessColor || '#34d399')})`);
      root.style.setProperty('--custom-dark-warning-color', `hsl(${hexToHsl(theme.darkWarningColor || '#fbbf24')})`);
      root.style.setProperty('--custom-dark-error-color', `hsl(${hexToHsl(theme.darkErrorColor || '#f87171')})`);

      // Set theme-aware CSS variables for elements to use (elements 10-15)
      // Set light mode values first - these will be overridden in dark mode by CSS
      root.style.setProperty('--theme-page-title', theme.lightPageTitle || '#111827');
      root.style.setProperty('--theme-card-background', theme.lightCardBackground || '#ffffff');
      root.style.setProperty('--theme-card-title', theme.lightCardTitle || '#111827');
      root.style.setProperty('--theme-feature-title', theme.lightFeatureTitle || '#111827');
      root.style.setProperty('--theme-feature-description', theme.lightFeatureDescription || '#64748b');
      root.style.setProperty('--theme-icon-color', theme.lightIconColor || '#6366f1');
      
      // Also set the dark mode values that CSS will use
      root.style.setProperty('--theme-page-title-dark', theme.darkPageTitle || '#ffffff');
      root.style.setProperty('--theme-card-background-dark', theme.darkCardBackground || '#1e293b');
      root.style.setProperty('--theme-card-title-dark', theme.darkCardTitle || '#ffffff');
      root.style.setProperty('--theme-feature-title-dark', theme.darkFeatureTitle || '#ffffff');
      root.style.setProperty('--theme-feature-description-dark', theme.darkFeatureDescription || '#cbd5e1');
      root.style.setProperty('--theme-icon-color-dark', theme.darkIconColor || '#60a5fa');
      
      console.log('Applied theme colors:', {
        light: {
          primary: theme.lightPrimaryButton,
          secondary: theme.lightSecondaryButton,
          background: theme.lightBackground,
          text: theme.lightText,
          pageTitle: theme.lightPageTitle,
          cardBackground: theme.lightCardBackground,
          cardTitle: theme.lightCardTitle,
          featureTitle: theme.lightFeatureTitle,
          featureDescription: theme.lightFeatureDescription,
          iconColor: theme.lightIconColor
        },
        dark: {
          primary: theme.darkPrimaryButton,
          secondary: theme.darkSecondaryButton, 
          background: theme.darkBackground,
          text: theme.darkText,
          pageTitle: theme.darkPageTitle,
          cardBackground: theme.darkCardBackground,
          cardTitle: theme.darkCardTitle,
          featureTitle: theme.darkFeatureTitle,
          featureDescription: theme.darkFeatureDescription,
          iconColor: theme.darkIconColor
        }
      });

      // Debug: Check what CSS variables are actually being set
      console.log('CSS variables set:', {
        '--theme-page-title': root.style.getPropertyValue('--theme-page-title'),
        '--theme-page-title-dark': root.style.getPropertyValue('--theme-page-title-dark'),
        '--theme-card-title': root.style.getPropertyValue('--theme-card-title'),
        '--theme-card-title-dark': root.style.getPropertyValue('--theme-card-title-dark')
      });

      // Override system theme with custom theme in both modes
      root.style.setProperty('--primary', `hsl(${hexToHsl(theme.lightPrimaryButton)})`);
      root.style.setProperty('--secondary', `hsl(${hexToHsl(theme.lightSecondaryButton)})`);
      
      // Also set raw colors for components that need direct hex values
      root.style.setProperty('--custom-primary-button-light', theme.lightPrimaryButton);
      root.style.setProperty('--custom-primary-button-dark', theme.darkPrimaryButton);
      root.style.setProperty('--custom-secondary-button', theme.secondaryButton || '#64748b');
      
      // Set heading and description colors (legacy)
      root.style.setProperty('--custom-heading-color', theme.headingColor || '#111827');
      root.style.setProperty('--custom-description-color', theme.descriptionColor || '#6b7280');
    }
  }, [theme]);

  return (
    <CustomThemeContext.Provider value={{ theme: theme || null, isLoading }}>
      {children}
    </CustomThemeContext.Provider>
  );
}

export function useCustomTheme() {
  const context = useContext(CustomThemeContext);
  if (context === undefined) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider');
  }
  return context;
}