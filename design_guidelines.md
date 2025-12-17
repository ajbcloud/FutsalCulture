# SMS Credits Management UI - Design Guidelines

## Design Approach

**System**: Material Design + Modern SaaS Dashboard Patterns (inspired by Linear, Vercel, Stripe admin interfaces)

**Rationale**: Utility-focused admin component requiring clarity, efficiency, and professional polish. Dark mode support necessitates strong contrast hierarchy and structured information architecture.

## Typography

**Font Family**: Inter (Google Fonts)
- Headings: 600-700 weight
- Body: 400-500 weight
- Metrics/Numbers: 700 weight, tabular-nums

**Hierarchy**:
- Page title: text-2xl font-semibold
- Section headers: text-lg font-semibold
- Card titles: text-base font-medium
- Body text: text-sm
- Captions/metadata: text-xs

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-6 to p-8
- Section gaps: gap-6 to gap-8
- Card spacing: space-y-4
- Container max-width: max-w-7xl

**Grid Structure**: 
- Main layout: 2-column on lg+ (credits overview + purchase cards)
- Transaction history: Full-width below
- Mobile: Stack to single column

## Component Architecture

### 1. Credits Overview Card (Top-left)
- Large numerical display (text-4xl, font-bold, tabular-nums)
- Label "Available Credits" (text-sm, opacity-60)
- Secondary info: Last purchase date, expiration warning if applicable
- Visual: Subtle border, elevated with slight shadow in dark mode

### 2. Purchase Options Grid (Top-right)
- 3 tier cards in horizontal layout (grid-cols-1 md:grid-cols-3)
- Each card includes:
  * Credit amount (text-2xl, font-bold)
  * Price per credit (text-xs, opacity-60)
  * Total price (text-lg, font-semibold)
  * "Most Popular" badge on middle tier
  * Action button (full-width, primary variant)
- Highlight middle tier with border accent

### 3. Quick Stats Bar (Below overview)
- 4-metric grid (grid-cols-2 lg:grid-cols-4, gap-4)
- Each stat shows:
  * Icon (from Heroicons)
  * Metric value (text-xl, font-bold, tabular-nums)
  * Label (text-xs, opacity-60)
- Metrics: Credits used this month, Total spent, Average per session, Success rate

### 4. Transaction History Table (Full-width bottom)
- Table structure with columns:
  * Date/Time (sortable)
  * Transaction Type (badge: Purchase/Usage/Refund)
  * Amount (+/- credits with visual indicator)
  * Cost (for purchases)
  * Status (badge with icon)
  * Session/Reference (if usage)
- Row hover states with subtle background change
- Pagination controls at bottom (10 per page default)
- Empty state with illustration and "No transactions yet" message

## Accessibility

- All interactive elements min 44px touch targets
- Focus rings visible on all controls (ring-2 ring-offset-2)
- Form inputs with proper labels and error states
- Screen reader announcements for balance updates
- Keyboard navigation throughout table (arrow keys)

## Animations

**Strategic Use Only**:
- Number counter animation when balance updates (1s duration)
- Skeleton loading for transaction table
- Smooth badge appearance on hover
- No page transitions or scroll effects

## Icons

**Library**: Heroicons (via CDN)
- Credits: CurrencyDollarIcon
- Purchases: ShoppingCartIcon
- Usage: PaperAirplaneIcon
- Success: CheckCircleIcon
- Warning: ExclamationTriangleIcon
- Sort indicators: ChevronUpDownIcon

## Component Details

**Cards**: Rounded corners (rounded-lg), consistent padding (p-6), subtle borders

**Buttons**: 
- Primary: Full corners (rounded-md), medium size (px-4 py-2)
- Secondary: Ghost variant for table actions
- Disabled states clearly indicated (opacity-50, cursor-not-allowed)

**Badges**: Small (px-2 py-1), rounded (rounded-full), uppercase (uppercase text-xs), medium font weight

**Tables**: 
- Header row with bottom border
- Alternating row backgrounds for better scanning
- Right-aligned numbers (tabular-nums)
- Compact spacing (py-3 px-4)

## Images

**Not Required**: This is a data-focused admin component; no hero or decorative images needed. Focus on data visualization clarity.