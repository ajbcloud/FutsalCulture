# Futsal Culture Booking App

## Overview
This is a full-stack web application called "Futsal Culture" that allows parents to book limited spots in weekly futsal training sessions for their children. The app features day-of booking (starting at 8 AM), Stripe payment integration, and real-time capacity monitoring.

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
- **Comprehensive KPI System Implementation**: Built comprehensive admin dashboard KPI system with proper term definitions, time frame contexts, and growth comparisons. New `/api/admin/dashboard-metrics` endpoint provides detailed analytics including monthly revenue, YTD revenue, player registrations, session counts, and pending payments with period-over-period growth percentages. Enhanced dashboard displays primary and secondary KPIs with visual trend indicators, growth percentages, and clear metric definitions. Added recent activity feed showing real-time system events (payments, registrations, help requests) with proper timestamp formatting and activity categorization.
- **KPI Tooltip Documentation System**: Implemented self-documenting KPI cards with info icons and hover tooltips explaining each metric's definition. Added reusable KPICard component with Radix UI tooltip integration, proper accessibility support (keyboard focus, ARIA labels), and consistent styling across Admin Dashboard and Analytics pages. Tooltips provide clear explanations like "Sum of all payments received this month from session bookings" for transparent metric understanding. Removed redundant KPI Definitions section from dashboard since tooltips provide all necessary information directly on each card.
- **Three-Month Realistic Business Data Generation**: Created comprehensive seeding script generating authentic April-June 2025 business data with progressive growth patterns. Generated $2,850 total revenue across 285 payments, 26 players, 195 sessions, 316 signups (31 pending), and 18 help requests. Growth trajectory simulates soft launch (April: $960) to peak season (June: $930) with realistic parent/player relationships, age-compliant portal access, and consistent booking patterns for accurate business analytics testing.
- **Revenue Dashboard Fix**: Fixed admin dashboard revenue display issue where monthly and YTD revenue showed same values. Corrected frontend field mapping to use `monthlyRevenue` for "This Month" KPI ($20.00) and `totalRevenue` for "YTD Revenue" KPI ($2870.00).
- **Per-Session Accordion Implementation**: Built comprehensive session management accordions exactly as specified. Enhanced /api/admin/sessions endpoint with optimized queries for signup counts and player details. Added clickable session rows that expand to show mini KPI bars (X/Y players), visual progress indicators, scrollable player lists with payment status badges, and smooth transitions for enhanced admin user experience.