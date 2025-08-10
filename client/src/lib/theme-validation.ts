/**
 * Theme validation utilities for Elite custom themes
 * Ensures WCAG AA compliance (4.5:1 contrast ratio)
 */

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 4.5; // WCAG AA standard for normal text
}

/**
 * Check if color combination meets WCAG AA standards for large text
 */
export function meetsWCAGAALarge(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 3.0; // WCAG AA standard for large text (18pt+ or 14pt+ bold)
}

/**
 * Adjust color lightness to meet contrast requirements
 */
function adjustColorForContrast(color: string, background: string, targetRatio: number = 4.5): string {
  const rgb = hexToRgb(color);
  const bgRgb = hexToRgb(background);
  
  if (!rgb || !bgRgb) return color;
  
  // Convert to HSL for easier manipulation
  const [r, g, b] = rgb.map(c => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  // Adjust lightness iteratively
  const bgLum = getLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);
  const step = bgLum > 0.5 ? -0.05 : 0.05; // Darken for light backgrounds, lighten for dark
  
  for (let attempts = 0; attempts < 20; attempts++) {
    l += step;
    l = Math.max(0, Math.min(1, l)); // Clamp between 0 and 1
    
    // Convert back to RGB
    const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
      if (s === 0) {
        const gray = Math.round(l * 255);
        return [gray, gray, gray];
      }
      
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      return [
        Math.round(hue2rgb(p, q, h + 1/3) * 255),
        Math.round(hue2rgb(p, q, h) * 255),
        Math.round(hue2rgb(p, q, h - 1/3) * 255)
      ];
    };
    
    const [newR, newG, newB] = hslToRgb(h, s, l);
    const newLum = getLuminance(newR, newG, newB);
    const ratio = (Math.max(newLum, bgLum) + 0.05) / (Math.min(newLum, bgLum) + 0.05);
    
    if (ratio >= targetRatio) {
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
  }
  
  return color; // Return original if adjustment fails
}

/**
 * Validate and potentially adjust theme colors for accessibility
 */
export interface ThemeValidationResult {
  isValid: boolean;
  adjustedColors?: {
    lightText?: string;
    lightHeading?: string;
    darkText?: string;
    darkHeading?: string;
  };
  warnings: string[];
}

export function validateThemeColors(theme: {
  lightPrimaryButton: string;
  lightBackground: string;
  lightText: string;
  lightHeadingColor: string;
  darkPrimaryButton: string;
  darkBackground: string;
  darkText: string;
  darkHeadingColor: string;
}): ThemeValidationResult {
  const warnings: string[] = [];
  const adjustedColors: NonNullable<ThemeValidationResult['adjustedColors']> = {};
  let isValid = true;
  
  // Check light mode contrasts
  if (!meetsWCAGAA(theme.lightText, theme.lightBackground)) {
    warnings.push('Light mode text does not meet WCAG AA contrast standards');
    adjustedColors.lightText = adjustColorForContrast(theme.lightText, theme.lightBackground);
    isValid = false;
  }
  
  if (!meetsWCAGAALarge(theme.lightHeadingColor, theme.lightBackground)) {
    warnings.push('Light mode headings do not meet WCAG AA contrast standards');
    adjustedColors.lightHeading = adjustColorForContrast(theme.lightHeadingColor, theme.lightBackground, 3.0);
    isValid = false;
  }
  
  if (!meetsWCAGAA('#ffffff', theme.lightPrimaryButton)) {
    warnings.push('Light mode primary button text may not be readable');
    isValid = false;
  }
  
  // Check dark mode contrasts
  if (!meetsWCAGAA(theme.darkText, theme.darkBackground)) {
    warnings.push('Dark mode text does not meet WCAG AA contrast standards');
    adjustedColors.darkText = adjustColorForContrast(theme.darkText, theme.darkBackground);
    isValid = false;
  }
  
  if (!meetsWCAGAALarge(theme.darkHeadingColor, theme.darkBackground)) {
    warnings.push('Dark mode headings do not meet WCAG AA contrast standards');
    adjustedColors.darkHeading = adjustColorForContrast(theme.darkHeadingColor, theme.darkBackground, 3.0);
    isValid = false;
  }
  
  if (!meetsWCAGAA('#ffffff', theme.darkPrimaryButton)) {
    warnings.push('Dark mode primary button text may not be readable');
    isValid = false;
  }
  
  return {
    isValid,
    adjustedColors: Object.keys(adjustedColors).length > 0 ? adjustedColors : undefined,
    warnings,
  };
}

/**
 * Get the appropriate contrast color (white or black) for a given background
 */
export function getContrastColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio('#ffffff', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);
  
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}