/**
 * Design System Tokens for Analytics v2
 * Modern, premium theme for Super Admin Analytics
 */

export const theme = {
  colors: {
    // Dark theme base colors
    background: '#0b0f14',
    surface: '#11161d', 
    mutedSurface: '#0f1319',
    border: '#1f2733',
    
    // Text colors
    textPrimary: '#e6edf3',
    textSecondary: '#a9b4c2',
    
    // Accent colors (emerald/cyan blend)
    accentPrimary: '#10b981',
    accentSecondary: '#06b6d4',
    
    // Status colors
    success: '#22c55e',
    warning: '#f59e0b', 
    danger: '#ef4444',
    info: '#3b82f6',
  },
  
  spacing: {
    cardGap: '24px',
    sectionGap: '32px',
    containerPadding: '24px',
  },
  
  radii: {
    card: '16px', // rounded-2xl
    input: '12px', // rounded-xl
    button: '12px', // rounded-xl
  },
  
  shadows: {
    card: '0 8px 30px rgba(0,0,0,0.25)',
    cardHover: '0 12px 40px rgba(0,0,0,0.35)',
    glass: '0 4px 20px rgba(0,0,0,0.15)',
  },
  
  borders: {
    width: '1.5px',
  },
  
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    sizes: {
      cardNumber: '2.25rem', // text-4xl
      cardNumberLarge: '3rem', // text-5xl
      label: '0.875rem', // text-sm
    },
    weights: {
      heading: 600, // font-semibold
      normal: 400,
      medium: 500,
    },
    tracking: {
      label: '0.05em', // tracking-wide
    },
  },
  
  zIndices: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    tooltip: 40,
  },
  
  transitions: {
    default: 'all 0.2s ease-in-out',
    slow: 'all 0.3s ease-in-out',
  },
} as const;

export type Theme = typeof theme;

// Tailwind utility classes for consistent styling
export const themeClasses = {
  // Cards
  card: 'bg-[#11161d] border-[1.5px] border-[#1f2733] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]',
  cardHover: 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-200',
  
  // Glass effect for sticky elements
  glass: 'bg-[#11161d]/80 backdrop-blur-lg border-[1.5px] border-[#1f2733]/50',
  
  // Text
  textPrimary: 'text-[#e6edf3]',
  textSecondary: 'text-[#a9b4c2]',
  textLabel: 'text-sm text-[#a9b4c2] uppercase tracking-wide font-medium',
  
  // Numbers
  numberLarge: 'text-4xl font-semibold text-[#e6edf3]',
  numberXLarge: 'text-5xl font-semibold text-[#e6edf3]',
  
  // Accents
  accentPrimary: 'text-[#10b981]',
  accentSecondary: 'text-[#06b6d4]',
  
  // Status colors
  success: 'text-[#22c55e]',
  warning: 'text-[#f59e0b]',
  danger: 'text-[#ef4444]',
  info: 'text-[#3b82f6]',
  
  // Backgrounds
  surfaceMuted: 'bg-[#0f1319]',
  
  // Spacing
  cardPadding: 'p-6',
  sectionGap: 'space-y-8',
  cardGap: 'gap-6',
} as const;

// Utility functions
export const formatters = {
  currency: (cents: number): string => {
    return `$${Math.round(cents / 100).toLocaleString()}`;
  },
  
  percent: (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
  },
  
  shortNumber: (value: number): string => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
  },
  
  delta: (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: 0, isPositive: true };
    const delta = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(delta),
      isPositive: delta >= 0,
    };
  },
};

// Chart palette for consistent colors
export const chartPalette = {
  primary: '#10b981',
  secondary: '#06b6d4', 
  tertiary: '#3b82f6',
  quaternary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
  
  // Gradient stops for area charts
  gradients: {
    primary: ['#10b981', 'rgba(16, 185, 129, 0.1)'],
    secondary: ['#06b6d4', 'rgba(6, 182, 212, 0.1)'],
    tertiary: ['#3b82f6', 'rgba(59, 130, 246, 0.1)'],
  },
} as const;