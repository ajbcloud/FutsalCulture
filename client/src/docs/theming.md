# Futsal Culture Theming System

## Overview

This document describes the semantic color token system used throughout the Futsal Culture application. The system ensures consistent, accessible theming across light and dark modes while supporting Elite plan custom theme customization.

## Color Token Structure

### Core Tokens

All colors are defined as CSS custom properties (variables) with semantic names:

```css
:root {
  /* Backgrounds */
  --bg: hsl(0, 0%, 100%);              /* Main background */
  --bg-elev: hsl(0, 0%, 100%);         /* Elevated surfaces (cards, modals) */
  --surface: hsl(0, 0%, 100%);         /* Interactive surfaces */
  
  /* Text */
  --text: hsl(222, 84%, 5%);           /* Primary text - high contrast */
  --text-muted: hsl(215, 16%, 35%);    /* Secondary text - medium contrast */
  --text-subtle: hsl(210, 40%, 60%);   /* Tertiary text - low contrast */
  
  /* Interactive */
  --border: hsl(214, 32%, 91%);        /* Default borders */
  --border-hover: hsl(214, 32%, 85%);  /* Hover borders */
  --input: hsl(214, 32%, 96%);         /* Input backgrounds */
  
  /* Brand */
  --brand: hsl(217, 91%, 60%);         /* Primary brand color */
  --brand-contrast: hsl(0, 0%, 100%);  /* Text on brand backgrounds */
  --brand-hover: hsl(217, 91%, 55%);   /* Brand hover state */
  --brand-light: hsl(217, 91%, 95%);   /* Light brand backgrounds */
}
```

### Status Colors

All status colors include contrast variants for text readability:

- `--success` / `--success-contrast`
- `--warning` / `--warning-contrast`
- `--danger` / `--danger-contrast`
- `--info` / `--info-contrast`

### Chart Colors

Six distinct, WCAG-compliant chart colors are available:

- `--chart-1` through `--chart-6`
- Automatically adjusted for dark mode

## Dark Mode

Dark mode overrides are defined in the `.dark` class with improved contrast ratios:

```css
.dark {
  --bg: hsl(222, 84%, 4%);             /* Dark background */
  --text: hsl(0, 0%, 100%);            /* Pure white text */
  --brand: hsl(217, 91%, 70%);         /* Lighter brand for contrast */
  /* ... */
}
```

## Tailwind Integration

Semantic tokens are mapped to Tailwind classes:

```typescript
// tailwind.config.ts
colors: {
  bg: "var(--bg)",
  "bg-elev": "var(--bg-elev)",
  text: "var(--text)",
  "text-muted": "var(--text-muted)",
  brand: {
    DEFAULT: "var(--brand)",
    contrast: "var(--brand-contrast)",
    hover: "var(--brand-hover)",
  },
  // ...
}
```

## Usage Guidelines

### Component Colors

Use semantic classes instead of hardcoded colors:

```jsx
// ✅ Good - semantic tokens
<div className="bg-bg-elev text-text border-border">
  <h2 className="text-brand">Title</h2>
  <p className="text-text-muted">Description</p>
</div>

// ❌ Bad - hardcoded colors
<div className="bg-white text-black border-gray-300">
  <h2 className="text-blue-600">Title</h2>
  <p className="text-gray-600">Description</p>
</div>
```

### Button Variants

Buttons use semantic color tokens:

- `default`: Brand colors with proper contrast
- `secondary`: Neutral colors
- `destructive`: Danger colors
- `outline`: Border with transparent background

### Badge Variants

Badges follow the same pattern:

- `default`: Brand colors
- `success`: Success colors
- `warning`: Warning colors
- `danger`: Danger colors
- `info`: Info colors

### Focus States

All interactive elements use the `--focus` color for focus rings:

```css
.focus-visible:outline-none 
.focus-visible:ring-2 
.focus-visible:ring-focus 
.focus-visible:ring-offset-2
```

## Elite Theme Customization

Elite plan users can customize:

- Brand colors (`--brand`, `--brand-hover`)
- Background colors (`--bg`, `--bg-elev`)
- Text colors (`--text`, `--text-muted`)
- Heading colors (separate from text)

### Validation

Theme validation ensures WCAG AA compliance:

- Text contrast ratio ≥ 4.5:1
- Large text contrast ratio ≥ 3:1
- Button text readability

```typescript
import { validateThemeColors } from '@/lib/theme-validation';

const result = validateThemeColors(themeData);
if (!result.isValid) {
  // Show warnings and suggested adjustments
}
```

### Protected Elements

Some UI elements maintain original brand colors:

- Dashboard Quick Actions buttons
- System status indicators
- Critical admin functions

## Adding New Colors

When adding new semantic colors:

1. Define in both light and dark modes
2. Add to Tailwind config
3. Include contrast variants if used for backgrounds
4. Test WCAG compliance
5. Update this documentation

## Accessibility Standards

All color combinations meet or exceed:

- WCAG AA standards (4.5:1 contrast ratio)
- WCAG AA Large Text (3:1 contrast ratio for 18pt+ or 14pt+ bold)
- Focus indicators are clearly visible in all themes

## Testing

To verify theming:

1. Test all pages in light and dark modes
2. Test with Elite custom themes
3. Use browser accessibility tools
4. Verify focus states are visible
5. Check chart readability
6. Test with high contrast settings

## Legacy Compatibility

Shadcn/ui variables are mapped to semantic tokens for backward compatibility:

```css
--background: var(--bg);
--foreground: var(--text);
--primary: var(--brand);
/* ... */
```

This ensures existing components continue to work while new components can use semantic tokens directly.