import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface CustomTheme {
  primaryButton: string;
  secondaryButton: string;
  background: string;
  text: string;
  headingColor: string;
  descriptionColor: string;
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

      // Apply custom colors as CSS variables
      root.style.setProperty('--primary', `hsl(${hexToHsl(theme.primaryButton)})`);
      root.style.setProperty('--secondary', `hsl(${hexToHsl(theme.secondaryButton)})`);
      root.style.setProperty('--background', `hsl(${hexToHsl(theme.background)})`);
      root.style.setProperty('--foreground', `hsl(${hexToHsl(theme.text)})`);
      
      // Also set button-specific colors for direct usage
      root.style.setProperty('--custom-primary-button', theme.primaryButton);
      root.style.setProperty('--custom-secondary-button', theme.secondaryButton);
      
      // Set heading and description colors
      root.style.setProperty('--custom-heading-color', theme.headingColor);
      root.style.setProperty('--custom-description-color', theme.descriptionColor);
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