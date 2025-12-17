# SkoreHQ Sports Theme - Design Guidelines

## Design Philosophy

**System**: Bold, modern sports aesthetic inspired by premium athletic brands and sports media
**Theme**: Dark mode primary with high-contrast neon accents for energy and impact

## Color Palette

### Primary Colors
- **Background Dark**: `#1a1a1a` - Main page background
- **Background Elevated**: `#242424` - Cards, elevated surfaces
- **Background Surface**: `#2a2a2a` - Interactive surfaces, inputs

### Accent Colors
- **Neon Green**: `#BFFF00` - Primary accent, CTAs, highlights
- **Neon Green Hover**: `#d4ff33` - Hover states
- **Neon Green Muted**: `rgba(191, 255, 0, 0.1)` - Subtle backgrounds

### Text Colors
- **Primary Text**: `#ffffff` - Headlines, important text
- **Secondary Text**: `#a1a1a1` - Body text, descriptions
- **Muted Text**: `#6b6b6b` - Captions, metadata

### Utility Colors
- **Border**: `#333333` - Subtle borders
- **Border Accent**: `#BFFF00` - Highlighted borders

## Typography

**Font Family**: Inter (Google Fonts) - Clean, modern sans-serif

### Hierarchy
- **Hero Headlines**: `text-6xl` to `text-8xl`, `font-black`, uppercase optional
- **Section Headlines**: `text-4xl` to `text-5xl`, `font-bold`
- **Card Titles**: `text-xl` to `text-2xl`, `font-semibold`
- **Body Text**: `text-base` to `text-lg`, `font-normal`
- **Captions**: `text-sm`, `font-medium`

### Feature Numbers
- **Large Display Numbers**: `text-7xl` to `text-9xl`, `font-black`
- **Format**: Zero-padded (01, 02, 03)
- **Color**: Neon green or white with green accent

## Layout Principles

### Asymmetric Grid
- Break traditional centered layouts
- Overlap elements intentionally
- Use negative space dramatically
- Mix full-width and constrained sections

### Geometric Elements
- Sharp rectangular accent boxes
- Angled or offset elements
- Overlapping cards and images
- Neon green highlight bars

### Spacing
- Generous whitespace between sections: `py-20` to `py-32`
- Tight internal spacing for grouped content
- Asymmetric padding for visual interest

## Component Styles

### Navigation
- Minimal, clean design
- Dark background with white text
- Neon green active states
- Simple hover underlines or highlights

### Buttons
- **Primary**: Neon green background, dark text, bold font
- **Secondary**: Transparent with neon green border
- **With Arrow**: Include `→` arrow for "See more" actions
- **Shape**: Slightly rounded (`rounded-lg`) or sharp corners

### Cards
- Dark background (`#242424`)
- Subtle border (`#333333`)
- Neon green accents for highlights
- Large number overlays as design elements

### Feature Sections
- Large display numbers (01, 02, 03) as visual anchors
- Neon green accent boxes or bars
- Black & white imagery style
- Bold headlines with concise descriptions

### Pricing Cards
- Dark card backgrounds
- Neon green for "popular" highlights
- Clear price hierarchy
- Green checkmarks for features

## Image Treatment

### Style
- Black & white / grayscale for sports imagery
- High contrast
- Action shots preferred
- May include subtle neon green overlay accents

### Placeholders
- Dark gray backgrounds
- Geometric shapes
- Icon representations

## Animations (Minimal)

- Subtle hover transitions on buttons
- Smooth color transitions
- No excessive motion
- Keep interactions fast and responsive

## Accessibility

- Maintain WCAG contrast ratios with neon green on dark
- Clear focus indicators
- Touch targets minimum 44px
- Screen reader friendly structure

## Icons

**Library**: Lucide React
- Use outlined style
- Match text color or neon green for emphasis
- Keep sizing consistent with text
