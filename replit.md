# Futsal Culture Booking App

## Overview
This is a full-stack web application called "Futsal Culture" that allows parents to book limited spots in weekly futsal training sessions for their children. The app features day-of booking (starting at 8 AM), Stripe payment integration, and real-time capacity monitoring.

**MAJOR ARCHITECTURAL CHANGE IN PROGRESS**: Converting from single-tenant to multi-tenant Super-Admin platform to support multiple futsal clubs/organizations. This involves adding tenant_id to all tables, creating Super-Admin role, tenant management, and scoped data access patterns.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React application using functional components and hooks
- **Vite**: Fast build tool and development server with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Shadcn/UI**: Component library built on Radix UI primitives for accessible UI components
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and data fetching
- **React Hook Form + Zod**: Form handling with type-safe validation

### Backend Architecture
- **Node.js + Express**: RESTful API server
- **TypeScript**: Type safety throughout the backend
- **Session-based Authentication**: Using Replit's OpenID Connect integration
- **Background Jobs**: Capacity monitoring and session status updates using setInterval

### Data Storage
- **PostgreSQL**: Primary database using Neon serverless
- **Drizzle ORM**: Type-safe database queries and schema management
- **Connection Pooling**: Neon serverless pool for efficient database connections

### Authentication & Authorization
- **Replit Auth**: OpenID Connect integration for user authentication
- **Role-based Access**: Parents and admin users with different permissions
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple

### Payment Processing
- **Stripe**: Payment processing for booking confirmations
- **Client-side Integration**: Stripe Elements for secure payment forms
- **Webhook Support**: Payment confirmation handling

## Key Components

### Database Schema
- **Users**: Parent profiles with Replit auth integration
- **Players**: Child profiles linked to parent accounts with portal access controls
- **Futsal Sessions**: Training sessions with capacity limits and time slots
- **Signups**: Reservation records linking players to sessions
- **Payments**: Stripe payment tracking
- **Help Requests**: Customer support system
- **Notification Preferences**: User communication settings

### Player Portal System (Age 13+)
- **Age Verification**: Automatic age calculation from birth year
- **Portal Access Controls**: Parent-controlled toggles for portal access and booking permissions
- **Invite System**: Email/SMS invitations with secure token-based account creation
- **Player Account Creation**: Separate user accounts for eligible players

### Core Features
1. **Session Management**: Daily session creation with age groups and locations
2. **Interactive Calendar**: Monthly calendar view with clickable days that show session details in popups
3. **Advanced Filtering**: Real-time filtering by age group, gender, and location on sessions page
4. **Booking System**: Time-restricted booking (8 AM day-of rule) - currently disabled (payments removed)
5. **Capacity Monitoring**: Real-time tracking of available spots
6. **Parent Dashboard**: Player management and booking history with age-based session filtering
7. **Admin Panel**: Session management and analytics

### Business Logic
- **8 AM Rule**: Sessions open for booking at 8 AM on the day of the session
- **Extended Booking Window**: Sessions remain bookable until session start time (if spaces available)
- **Automatic Closure**: Sessions close when capacity is reached OR when session start time passes
- **Multiple Sessions**: Up to 3+ sessions can be scheduled per day (Monday-Friday)
- **Real-time Status**: Sessions show "Pending" before 8 AM, "Open" during booking hours, "Full" when capacity reached
- Background jobs monitor capacity and update session status every 5 minutes

## Data Flow

### Booking Process
1. Parent views available sessions (filtered by age group/location)
2. Parent selects session and player
3. System creates signup record
4. Parent redirected to Stripe checkout
5. Payment confirmation completes booking

### Session Lifecycle
1. Admin creates sessions with future dates
2. Sessions marked as "upcoming" until booking day
3. At 8 AM on session day, status changes to "open"
4. When capacity reached, status changes to "full"
5. After start time, status changes to "closed"

### Authentication Flow
1. User clicks login button
2. Redirected to Replit OAuth
3. User grants permissions
4. System creates/updates user record
5. Session established with user data

## External Dependencies

### Required Services
- **Neon Database**: PostgreSQL hosting
- **Stripe**: Payment processing
- **Replit Auth**: User authentication

### Environment Variables
- `DATABASE_URL`: Neon PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key (client-side)
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect issuer URL

### Third-party Integrations
- Stripe Elements for payment forms
- Replit OpenID Connect for authentication
- Neon serverless for database connections

## Deployment Strategy

### Development
- Vite dev server with HMR
- TSX for running TypeScript server code
- Hot reloading for both client and server

### Production Build
- Vite builds client-side assets to `dist/public`
- ESBuild bundles server code to `dist/index.js`
- Static file serving from Express server
- Environment-based configurations

### Database Management
- Drizzle migrations in `./migrations` directory
- Schema defined in `shared/schema.ts`
- Push schema changes with `npm run db:push`

### Background Jobs
- Capacity monitoring runs every 5 minutes
- Session status updates run every 5 minutes
- Jobs automatically start with server process

### Database Seeding
- Comprehensive seed data system with 10 parents, 14 players, 10 sessions, 19 signups (14 paid + 5 pending), and 14 payments
- Sample data includes realistic portal access controls and contact information for testing
- Smart invite system testing data with varied email/phone combinations
- **Pending Payment Test Data**: 5 signups with unpaid status for testing admin payment management and reminder features
- Run seeding with: `tsx server/seed.ts`
- Clears existing data and repopulates with fresh test data

### Calendar Features
- **Interactive Calendar View**: Monthly calendar showing sessions on each day
- **Clickable Days**: Click any calendar day to see detailed session information in a popup
- **Session Popups**: Show full session details including time, location, capacity, pricing, and booking status
- **Age-Based Filtering**: Authenticated parents see only sessions eligible for their players' age groups
- **Unified Dashboard**: Calendar integrated into parent dashboard with today's sessions and player management

### Recent Changes (July 29, 2025)
- **Complete Theme System Conversion**: Successfully converted all hardcoded zinc colors to dynamic theme-responsive CSS variables across critical admin components. Fixed admin/settings.tsx (19 hardcoded color instances), help.tsx (complete conversion), and admin-pending-payments.tsx (3 instances) to use proper theme variables (text-foreground, text-muted-foreground, bg-card, bg-input, border-border, etc.). Theme toggle now works seamlessly across all admin interfaces, providing proper light/dark mode support with consistent visual theming. Eliminated all zinc-based hardcoded colors that were preventing proper theme switching functionality.

### Recent Changes (July 28, 2025)
- **Complete Mobile Optimization for Admin Pages**: Implemented comprehensive mobile-responsive designs for discount codes, players, and parents management pages using dual layout system. Desktop displays full table views while mobile shows optimized card layouts with compact information display, responsive buttons, and touch-friendly interactions. Added mobile-specific button text ("Edit" vs "Edit Profile"), smaller button sizes, and proper spacing for mobile devices. Enhanced pagination component with mobile-specific layout featuring larger touch targets, centered alignment, reduced page number display (3 vs 5), and stacked layout for better mobile usability. Fixed admin settings tab navigation by implementing separate mobile (vertical stacked) and desktop (horizontal grid) layouts to prevent tab text overlap. Resolved database constraint error in settings save functionality by adding proper unique constraints and tenant-scoped queries. All admin pages now provide seamless experience across desktop and mobile devices.
- **Help Request User Linking**: Enhanced help requests system to automatically link submitted emails with existing parents or players in the database. When an email address in a help request matches a parent or player account, the user's name becomes clickable with visual badges indicating user type (parent/player). Clicking linked users navigates directly to the appropriate admin page (Parents or Players) with automatic filtering applied to show only the relevant user. Added ExternalLink icons and blue hover styling for linked users while maintaining standard display for non-linked submissions. Backend implementation includes email matching queries across both users and players tables with tenant-scoped filtering for accurate user identification.
- **Multi-Select Filters on Calendar**: Extended multi-select filter functionality to calendar page with checkbox-based Age Groups, Genders, and Locations filters. Updated calendar page to use MultiSelectFilter components instead of dropdown selects, added proper URL parameter handling for multi-value filters, and ensured consistent behavior with sessions page filtering.
- **Filter Clearing on Navigation**: Fixed "View Full Schedule" navigation behavior to clear filters when arriving at sessions or calendar pages. Instead of pre-applying filters based on player eligibility, pages now start with empty filters and clear any URL parameters from dashboard navigation, allowing parents to choose their own filtering criteria.
- **Comprehensive Historical Session Data Generation**: Created 350 training sessions spanning 4 months (April-August 2025) with weekday-only scheduling (Monday-Friday, no weekends). Generated realistic historical data for past 3 months and future sessions for 1 month ahead into August. Sessions distributed as: April (61), May (72), June (72), July (78), August (67) with varied time slots from 4:00-7:30 PM across multiple locations, mixed age groups (U8-U18), and proper status handling for past/future sessions.
- **Real Database-Driven Analytics Charts**: Implemented interactive chart components using Recharts library replacing placeholder text with actual data visualizations. Added revenue trend line chart, session occupancy bar chart, player growth area chart, and age group distribution pie chart. Connected charts to business insights API with proper loading states and responsive design for comprehensive analytics dashboard.
- **Dynamic Business Insights API**: Created comprehensive business insights endpoint calculating real database metrics including peak hours analysis from actual session scheduling patterns, age group popularity tracking from player enrollments, month-over-month revenue growth calculations, and session utilization rates from booking data.
- **Mobile Navigation UX Enhancement**: Repositioned hamburger menu to the left of company logo/name for improved mobile layout. Integrated theme toggle (light/dark mode) inside mobile hamburger menu for both authenticated and non-authenticated users. Hidden desktop theme toggle on mobile screens to eliminate duplication. Mobile menu now includes comprehensive navigation options with proper spacing and hover effects for optimal mobile user experience.
- **Complete Super Admin Portal Implementation**: Built comprehensive Super Admin portal with full navigation sidebar featuring Overview, Tenants, Sessions, Payments, Registrations, Parents, Players, Analytics, Help Requests, and Settings pages. Implemented proper routing, mobile-responsive design, and platform-neutral branding with shield icon. Created all required components: tenants.tsx (tenant management with CRUD operations), analytics.tsx (global KPIs with tenant filtering and growth metrics), and settings.tsx (platform configuration with integrations and user management tabs). Fixed sidebar layout to match admin portal exactly with user dropdown and theme toggle at bottom left corner.
- **Complete Backend API Implementation**: Extended super-admin-routes.ts with comprehensive API endpoints for Sessions, Payments, Registrations, Parents, Players, Analytics, Help Requests, and Settings management. Implemented all required storage methods with global data access across tenants, tenant filtering capabilities, and multi-tenant data aggregation. Fixed all LSP errors and ensured proper tenant-aware data handling throughout the application.
- **Production Deployment Configuration**: Configured application for deployment to playhq.app domain with CORS settings, production environment variables, SSL/TLS configuration, and comprehensive deployment documentation. Created deployment checklist, Cloudflare setup guide, and production configuration files. Application is fully ready for live deployment with all security and performance optimizations in place.
- **Super Admin Analytics Dashboard**: Created dedicated analytics page with tenant filtering, date range picker, age group and gender filters. Features global vs tenant-specific KPI views with revenue, players, sessions, and tenant metrics. Includes placeholder sections for revenue charts, player growth, session occupancy, and age distribution visualizations.
- **Super Admin Tenants Management**: Implemented comprehensive tenant management interface with create, edit, delete capabilities. Features tenant table showing name, subdomain, admin counts, player counts, sessions, revenue, and creation dates. Includes "Login as Admin" functionality for tenant impersonation.
- **Super Admin Settings & Integrations**: Built complete settings interface with Platform Settings tab (global configuration) and Integrations tab (email, SMS, OAuth, webhooks). Features test connection buttons, enable/disable toggles, and proper credential management for SendGrid, Twilio, Google/Microsoft OAuth, and webhook endpoints.
- **Help Request Navigation Fix**: Updated Recent Activity section to make help request items clickable, properly redirecting to /admin/help-requests page when clicked. Added navigationUrl field to help request activities in backend API.
- **Platform-Agnostic Super Admin Portal**: Removed tenant-specific business branding from Super Admin portal header, replacing with platform-neutral "Platform Super Admin" title and shield icon. Super Admin portal is now completely independent of any tenant branding, properly reflecting its role as the master platform management interface for all tenants.
- **Unified Portal Navigation System**: Implemented consistent navigation dropdown across all portals (Parent, Admin, Super Admin) allowing seamless switching between different user interfaces. All portals now feature standardized user dropdown menus with proper role-based portal access controls and logout functionality.
- **Multi-Tenant Seed Data Generation**: Created comprehensive multi-tenant-seed.ts script generating realistic business data covering last 3 months plus 1 month ahead. Successfully seeded 2 tenants (Futsal Culture & Elite Footwork Academy) with 46 users, 69 players, 110 sessions, 862 signups, 776 payments, and 12 help requests. Data includes proper age-based portal access controls, realistic session fill rates (50-95% for past, 0-30% for future), 90% paid/10% unpaid signup ratios, and comprehensive help request resolution tracking. All analytics metrics now derive from authentic multi-tenant data for accurate dashboard testing.
- **Super Admin Portal Implementation**: Implemented complete Super Admin functionality with dedicated portal for multi-tenant management. Added isSuperAdmin field to user schema, created super admin navigation dropdown between Admin Portal and Help options, built comprehensive super admin page with tenant creation/management capabilities, and implemented backend API routes with proper access control middleware. Super Admin users can now create and manage multiple futsal organizations from a single centralized interface.
- **Mobile-Responsive Design Implementation**: Implemented comprehensive mobile-first responsive design across the entire application using Tailwind CSS responsive classes (sm:, md:, lg:). Enhanced navbar with mobile hamburger menu, updated dashboard with mobile-optimized grid layouts (single column on mobile expanding to multiple columns on larger screens), made session cards mobile-responsive with stacked layouts, optimized admin layout with proper mobile sidebar behavior, and updated all typography and spacing to scale appropriately from mobile to desktop. All components now use mobile-first approach while preserving desktop functionality completely.
- **Admin Support Information Fields**: Added comprehensive support information fields to admin settings including Support Email, Phone, Support Hours, and Location. These fields are now dynamically displayed on the help page, replacing hardcoded contact information. Backend includes default values and proper integration with settings API.
- **Tab-Style Navigation Enhancement**: Converted navbar from button-style to tab-style navigation with proper Home tab positioning left of Sessions/Calendar. Navigation now uses tab design with hover effects and border highlighting for better visual hierarchy.
- **Calendar Navigation Fix**: Fixed critical bug where parent/player portal calendar tab incorrectly routed to admin calendar. Calendar page now properly differentiates between admin and user contexts, ensuring parent/player users see the correct calendar view with booking capabilities.
- **Admin Logout Functionality Fix**: Fixed admin logout issue where users weren't properly redirected to main page. Updated logout route to properly destroy session and redirect to landing page instead of relying on complex OIDC end session URLs.
- **Calendar Navigation Update**: Moved the Upcoming Sessions Calendar from the dashboard to its own dedicated page in the main navigation. Calendar now appears as a tab between Dashboard and Help for authenticated users. This provides more space for the calendar view and simplifies the dashboard layout.
- **Discount Codes System**: Implemented comprehensive discount code management system for admin portal. Features include three discount types (full 100% off, percentage-based, and fixed amount), usage tracking with limits, date validity ranges, and admin UI for creating/editing/deleting codes. Database schema includes discount_codes table and tracking fields on signups.
- **Service Billing Integration**: Added Stripe payment processing to Admin Settings under Service Billing section. Features include subscription plan display, payment method management, billing history, and secure payment processing for platform subscriptions. Created dedicated payment page with Stripe Elements integration for $49.99 monthly service fees.
- **Dynamic Business Name Implementation**: Converted all hardcoded "Futsal Culture" text throughout the application to dynamic merge fields using Business Name setting from admin portal. Created BusinessContext provider with useBusinessName hook, updated 15+ components including navbar, admin layout, landing page, dashboard, payment pages, and invitation flows. All business branding now dynamically reflects the Business Name setting configured in Admin Settings.
- **Business Logo Upload**: Added logo upload functionality to replace business name text with custom logos. Features include drag-and-drop interface, 2MB file size limit, support for PNG/JPEG/SVG formats, base64 encoding for storage, and BusinessBranding component that automatically displays logo when available or falls back to text. Updated navbar, admin layout, and landing page to use new branding system.
- **Theme Toggle Fix**: Fixed non-responsive light/dark mode toggle button by replacing shadcn Button component with native HTML button element. The issue was related to event handling in the Button component wrapper. Theme toggle now works correctly in both navbar and admin layout, with proper localStorage persistence and instant visual updates.
- **Admin Layout Logo Positioning**: Moved business logo/branding from top bar to navigation panel above "Admin Portal" text for improved visual hierarchy. Removed redundant "Admin" text from top bar header to clean up the interface while maintaining the business branding prominently in the sidebar. Scaled logo to 2.5x size with proper spacing and centered positioning between navigation borders and "Admin Portal" text.
- **Admin Settings Save Button Repositioning**: Moved save buttons from the global header to the bottom of individual tabs that require saving (General & Registration and Sessions & Schedule). Removed save buttons from Service Billing and Integrations tabs as they don't contain editable settings. This provides better UX by placing save actions closer to the form content being modified.
- **Real Stripe Billing Integration**: Implemented authentic Stripe subscription management in Service Billing section. Added backend endpoints to fetch real subscription data, direct billing portal integration using actual customer portal URL (billing.stripe.com/p/login/test_14AeVe4GC2cAeVI4Ns2Fa00), and frontend updates to display actual product information, pricing, and invoice history. Billing portal buttons now directly open the real Stripe customer portal for secure plan management.
- **Business Branding Component Fix**: Fixed text formatting inconsistency in admin navigation when logo is removed. Updated BusinessBranding component to always return consistent container structure regardless of whether logo or text is displayed, ensuring proper spacing and alignment in all branding contexts.
- **Responsive Business Name Display**: Implemented dynamic font sizing and text wrapping for business names in admin navigation. Font size automatically adjusts based on name length (8-25+ characters), with proper text wrapping for multi-word company names. Enhanced layout ensures business names fit within 256px navigation panel width while maintaining readability.
- **Streamlined Billing Portal Access**: Consolidated duplicate "Manage Subscription" and "Billing Portal" buttons into single "Manage Subscription & Billing" button that directly opens Stripe customer portal. Simplified user interface while maintaining full billing management functionality.

### Recent Changes (July 27, 2025)
- **Dashboard Growth Metrics Fix**: Fixed growth percentage calculations to show actual comparative data instead of hardcoded values. Revenue growth compares this month vs last month (-6%), player growth shows new players this month (0%), signup growth shows 100% increase, sessions growth compares this week vs last (0%), and YTD growth compares to last year (100%). Added proper handling for edge cases like NaN and Infinity values.
- **Click-to-Filter Navigation Fix**: Fixed the recent activity section click-through functionality. Clicking on parent or player names now properly navigates to the respective admin pages with search filters applied. Updated both Parents and Players pages to re-run filtering when URL parameters change. Removed problematic logic that prevented client-side filtering when URL parameters were present, removed the "Filtered by" indicator, and resolved competing filter mechanisms that were preventing results from displaying correctly.

### Recent Changes (July 26, 2025)
- **Combined Dashboard Experience**: Merged home page and dashboard into unified parent portal with welcome section, today's sessions, player management, and calendar view
- **Simplified Navigation**: Removed Sessions header from authenticated user navigation - only Dashboard and Help shown to logged-in parents
- **Authentication Architecture**: Implemented React Context for auth state management, eliminating infinite request loops from React Query auth hook
- **Improved Performance**: Reduced auth requests from 60+ per minute to single requests on load with proper error handling
- **Profile Editing**: Added complete profile editing functionality with form validation for first name, last name, email, and phone
- **Personalized Greeting**: Welcome message now shows parent's first name ("Welcome Back, Atticus!")
- **Enhanced Session Filtering**: Sessions now filtered by player eligibility (age + gender) in dashboard and sessions page, but calendar shows all sessions
- **Smart Empty States**: Dashboard shows "Add a player to see available sessions" when no players exist
- **Reserve & Pay Flow**: Updated Venmo payment system with dual-option interface (Pay Online/Pay by App) and simplified payment instructions
- **Venmo Integration**: Redesigned payment prompt with clear @DMC-Futsal_Culture handle display, formatted message field using current date, and separate buttons for web and mobile app access
- **Admin Payment Management**: Built admin panel for managing pending payments with reminder system and manual payment confirmation
- **Background Job System**: Added automated cleanup of expired reservations every 15 minutes to free up spots
- **Player Eligibility Enforcement**: Session detail page now enforces strict eligibility rules with disabled dropdown options for ineligible players and reserve button validation
- **Calendar Day-Click Modal**: Calendar displays session information modal when clicking on dates - fully implemented in existing session-calendar.tsx component
- **Comprehensive Demo Data System**: Created realistic seed data with 12 parents, 26 players, 60 sessions (4 weeks), 395 signups, and $3,950 revenue for sales presentations
- **Fixed Analytics Filtering**: Analytics dashboard now queries real database data with proper filtering by age group, gender, date range, and location instead of returning mock values
- **Admin Parents Portal Enhancement**: Fixed player details loading in parents management section - now displays actual player information, portal access status, and booking counts when expanding parent rows
- **Help Request System Overhaul**: Enhanced help request system with structured fields (subject, category, priority, status) and aligned admin portal display with proper field mapping
- **Age Group Expansion**: Extended age groups to support all ages 8-18 with complete coverage (U8, U9, U10, U11, U12, U13, U14, U15, U16, U17, U18), created shared constants file, and updated all admin components, filtering logic, CSV templates, and age calculation functions
- **12-Hour Clock Format Implementation**: Converted entire application from 24-hour to 12-hour clock format with AM/PM display for all time-related interfaces including session times, booking time controls, calendar displays, and admin panels. Restricted booking hours to 6:00 AM - 9:00 PM range with simplified hour/minute/AM-PM selection controls
- **Portal Access Age Validation**: Implemented strict business rule enforcement preventing players under 13 from accessing portal features. Added database constraints, API validation, and corrected existing data to ensure compliance with minimum age requirement (MINIMUM_PORTAL_AGE = 13)
- **Manual Registration Approval System**: Built comprehensive approval workflow with database schema for tracking registration status (pending/approved/rejected), admin interface for reviewing and approving/rejecting registrations, system settings toggle for auto-approval, and API endpoints for managing approval processes. Includes proper audit trails with admin IDs and timestamps for all approval actions.
- **Help Request Resolution Tracking**: Enhanced help request system with mandatory resolution tracking requiring admin ID, detailed resolution notes, and timestamps. Added database fields for audit trail (resolvedBy, resolutionNote, resolvedAt) and admin interface modal requiring detailed explanations of resolution actions.
- **Enhanced FAQ Section**: Added session duration question to help page FAQ section explaining that sessions are typically 60-90 minutes long.
- **Payment Reminder Conversion**: Converted payment reminder setting from hours to minutes for better granular control. Changed interface from "Payment Reminder Hours" (1-24 range) to "Payment Reminder Minutes" (5-1440 range) with 60 minutes default. Added backward compatibility to convert existing hour-based settings to minutes automatically.
- **Help Request Status Enhancement**: Implemented separate "replied" and "resolved" workflow states. Reply action now sets status to "replied" with yellow badge, keeping resolve button available for final closure with mandatory resolution notes. Fixed authentication issues in resolve endpoint that were causing 400 errors.
- **Stripe Integration Addition**: Added Stripe payment processing to Integrations section with fields for publishable key, secret key, and webhook secret. Payment category support included for future payment system integration.
- **Auto-Approval Logic Implementation**: Fixed missing automatic registration approval logic. System now properly respects auto-approve setting for both user registration and player creation, defaulting to approved status when toggle is enabled.
- **Reply History System**: Implemented comprehensive reply logging for help requests with database field (replyHistory JSONB array), backend endpoints storing actual reply messages with timestamps and admin IDs, and frontend display showing reply count and individual messages in Resolution column with scrollable interface and blue accent styling.
- **Mailchimp Integration**: Added Mailchimp email marketing integration to admin integrations section with fields for API key, audience ID, and server prefix configuration. Supports email marketing and newsletter management for parent communications alongside existing SendGrid integration.
- **QuickBooks Integration**: Added QuickBooks Online accounting integration with OAuth 2.0 configuration fields (Client ID, Client Secret, Redirect URI, Company ID, Sandbox mode). Enables financial management, revenue tracking, and automated invoicing for futsal training sessions with secure credential handling and testing capabilities.
- **Integration Management Consolidation**: Simplified admin interface by removing duplicate integration management from Settings page and consolidating all integration functionality into dedicated /admin/integrations page. Settings page now shows integration summary with direct link to full management interface, eliminating UI duplication and providing clearer navigation flow.
- **Braintree Payment Integration**: Added Braintree payment processing integration alongside Stripe with configuration fields for Merchant ID, Public/Private keys, and environment settings. Provides alternative payment processing option with advanced fraud protection and global payment support for futsal session bookings.
- **Default Timezone Set to EST**: Updated system default timezone from Singapore/Asia to America/New_York (Eastern Time) across all components including server defaults, client initialization, date utilities, and timezone context provider to ensure consistent EST timing throughout the platform.
- **Pending Payment Test Data**: Added 5 unpaid signups to seed data system to enable testing of admin payment management features, payment reminders, and manual payment confirmation workflows. Seed data now includes both paid and pending payment scenarios for comprehensive testing.
- **Historical Session Fill Rates (April-June 2025)**: Generated comprehensive historical data for 207 sessions across weekdays from April 1 - June 30th with realistic fill rates ranging from 65-95% (average 80.3%). Created 3,275 signups with 3,110 paid bookings (95%) and 165 pending payments (5%), generating $31,100 in historical revenue. All sessions now have proper capacity utilization meeting business requirements while preserving future sessions unchanged.
- **Comprehensive KPI System Implementation**: Built comprehensive admin dashboard KPI system with proper term definitions, time frame contexts, and growth comparisons. New `/api/admin/dashboard-metrics` endpoint provides detailed analytics including monthly revenue, YTD revenue, player registrations, session counts, and pending payments with period-over-period growth percentages. Enhanced dashboard displays primary and secondary KPIs with visual trend indicators, growth percentages, and clear metric definitions. Added recent activity feed showing real-time system events (payments, registrations, help requests) with proper timestamp formatting and activity categorization.
- **KPI Tooltip Documentation System**: Implemented self-documenting KPI cards with info icons and hover tooltips explaining each metric's definition. Added reusable KPICard component with Radix UI tooltip integration, proper accessibility support (keyboard focus, ARIA labels), and consistent styling across Admin Dashboard and Analytics pages. Tooltips provide clear explanations like "Sum of all payments received this month from session bookings" for transparent metric understanding. Removed redundant KPI Definitions section from dashboard since tooltips provide all necessary information directly on each card.
- **Three-Month Realistic Business Data Generation**: Created comprehensive seeding script generating authentic April-June 2025 business data with progressive growth patterns. Generated $2,850 total revenue across 285 payments, 26 players, 195 sessions, 316 signups (31 pending), and 18 help requests. Growth trajectory simulates soft launch (April: $960) to peak season (June: $930) with realistic parent/player relationships, age-compliant portal access, and consistent booking patterns for accurate business analytics testing.
- **Revenue Dashboard Fix**: Fixed admin dashboard revenue display issue where monthly and YTD revenue showed same values. Corrected frontend field mapping to use `monthlyRevenue` for "This Month" KPI ($20.00) and `totalRevenue` for "YTD Revenue" KPI ($2870.00).
- **Per-Session Accordion Implementation**: Built comprehensive session management accordions exactly as specified. Enhanced /api/admin/sessions endpoint with optimized queries for signup counts and player details. Added clickable session rows that expand to show mini KPI bars (X/Y players), visual progress indicators, scrollable player lists with payment status badges, and smooth transitions for enhanced admin user experience.