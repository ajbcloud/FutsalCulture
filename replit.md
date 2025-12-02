# PlayHQ Booking App

## Overview
PlayHQ is a full-stack web application designed for booking limited spots in weekly futsal training sessions. It provides day-of booking, payment integration, and real-time capacity monitoring. The project is evolving into a multi-tenant Super-Admin platform to support various futsal clubs and organizations, incorporating `tenant_id` across tables, a Super-Admin role, tenant management, and scoped data access. The app aims to streamline the booking process for parents and offer robust administrative tools for futsal organizations, with a business vision to provide a scalable SaaS solution for sports academies.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend Frameworks**: React with TypeScript for functional components and hooks.
- **Styling**: Tailwind CSS for utility-first styling and Shadcn/UI for accessible components.
- **Responsiveness**: Mobile-first approach for cross-device compatibility.
- **Theming**: Full light/dark mode support.
- **Navigation**: Intuitive tab-style navigation, unified portal navigation, and mobile-optimized menus.
- **Terminology**: Dynamic, age policy-aware terminology system adapting UI labels based on tenant's audience mode (youth_only, mixed, adult_only) and user's household composition.

### Technical Implementations
- **Backend**: Node.js with Express and TypeScript for a RESTful API.
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM for type-safe queries and schema management, utilizing connection pooling.
- **Authentication**: Clerk-hosted authentication (@clerk/clerk-react, @clerk/express) with dual-auth support for backward compatibility during migration. Users table includes `clerkUserId` field to link Clerk accounts to internal users. The system supports both Clerk (new users) and legacy session-based auth (existing users). Role-based access control (parent, admin, Super-Admin) and PostgreSQL-backed session store remain for legacy features. Includes failsafe Super Admin, email verification, and player portal system for ages 13+.
- **Authorization**: Capability-Based Access Control for fine-grained permissions, especially for Assistant roles, enforced by backend middleware.
- **State Management**: TanStack Query for server state management and data fetching.
- **Form Handling**: React Hook Form with Zod for type-safe form validation.
- **Background Jobs**: `setInterval` for capacity monitoring and session status updates.

### Feature Specifications
- **Core Booking**: Session management (creation, filtering by age/gender/location), interactive calendar, time-restricted booking (8 AM day-of rule, bookable until start time), real-time capacity monitoring, and automatic session closure.
- **Payment & Credits**: Complete Stripe integration for payment processing, including webhooks and subscription management. Upgrade/downgrade flow uses embedded Stripe checkout with `client_reference_id` for proper tenant tracking. Supports discount codes via Stripe coupons/promotion codes. A comprehensive user credit system replaces refunds, automatically issuing credits upon session cancellation, with FIFO application and automatic checkout integration. Subscription management includes immediate upgrades, end-of-period downgrades, abuse prevention (24-hour cooldown), and proration disabled.
- **Signup & Registration**: Role-based signup flow where users explicitly select whether they're registering as a Player or Parent/Guardian. The system combines role selection with age-gating logic to route users to appropriate signup flows and determine portal access. Age policy evaluation remains independent of role selection.
- **Admin & User Dashboards**: Parent dashboard for player/booking history. Admin panel for session management, analytics, user management, discount codes, help requests, and system settings.
- **Multi-tenancy**: Super Admin portal for managing multiple organizations, including tenant defaults and policy settings.
- **Advanced Features**: Recurring session functionality, comprehensive analytics dashboard, structured help request system, business branding customization, comprehensive seed data, and a session waitlist system with automated promotion and payment windows.
- **SaaS & Feature Control**: 3-Tier SaaS pricing structure (Core, Growth, Elite) with plan-based feature access control, enforced by a feature flag system (backend middleware, frontend hooks, database-driven feature management, and tenant overrides).
- **Communication System**: Template-based email/SMS notification system with automated triggers, manual bulk sending, template management UI, variable replacement, consent management, and custom contact groups (SendGrid/Twilio integration).
- **Invitation System**: Unified invitation code system (`inviteCodes` table) supporting invite, access, and discount codes with pre-fill metadata, custom JSON, usage tracking, and full CRUD admin UI.
- **Trial Experience**: Client-facing trial status indicator in bottom-left corner showing real-time countdown, color-coded urgency (green/yellow/red), trial extension capability, and upgrade CTAs with direct Stripe checkout integration. Trial management enforces Super Admin-configured settings for duration, extensions, and grace periods.

### System Design Choices
- **Development Environment**: Vite for fast development.
- **Code Quality**: TypeScript validation, organized file structure, and automated cleanup scripts.
- **Business Logic**: Implementation of the "8 AM Rule", extended booking windows, automatic closure, and real-time session status updates.
- **SaaS Architecture**: Database-driven feature management, plan limits enforcement, and audit logging for feature changes.

## External Dependencies

- **Neon Database**: PostgreSQL hosting.
- **Stripe**: Payment processing (transitioning to Braintree).
- **Clerk**: User authentication (hosted auth UI and session management).
- **Resend**: Email communication (migrated from SendGrid).
- **Telnyx**: SMS communication (migrated from Twilio/SendGrid).

## Required Environment Variables

### Telnyx (SMS)
- `TELNYX_API_KEY` - Telnyx API key from Mission Control Portal
- `TELNYX_FROM_NUMBER` - Telnyx phone number for sending SMS (E.164 format, e.g., +15551234567)
- `TELNYX_MESSAGING_PROFILE_ID` - (Optional) Messaging profile ID for sending

## Recent Migration Progress

### Email Migration (Phase 1 - Complete)
- Migrated from SendGrid to Resend for all email sending
- Created email provider abstraction layer (`server/utils/email-provider.ts`) for provider-agnostic email sending
- Created Resend client (`server/utils/resend-client.ts`) with batching support
- Implemented Resend webhook endpoint (`server/routes/resend-webhooks.ts`) for email event tracking
- Updated all email-sending code to use unified FROM_EMAIL constant
- Legacy SendGrid webhook routes retained for backward compatibility

### SMS Migration (Phase 2 - Complete)
- Migrated from Twilio/SendGrid to Telnyx for all SMS sending
- Created SMS credit system with balance tracking per tenant:
  - Database tables: `sms_credit_transactions`, `sms_credit_packages`
  - Tenant fields: `sms_credits_balance`, `sms_credits_low_threshold`, `sms_credits_auto_recharge`
- Created SMS credit service (`server/utils/sms-credits.ts`) with:
  - Balance checking and credit deduction on send
  - Purchase functionality with package selection
  - Transaction history and usage analytics
  - Low-balance warnings and auto-recharge settings
- Updated smsService.ts to use Telnyx SDK with credit integration
- Created admin API routes (`server/routes/sms-credits.ts`) for credit management
- Built admin UI page (`client/src/pages/admin/sms-credits.tsx`) with:
  - Balance display and low balance warnings
  - Package purchase cards
  - Transaction history table
  - Auto-recharge settings

### Payment Migration (Phase 3 - Pending)
- Stripe made fully optional with graceful degradation
- Braintree integration to be implemented with OAuth-based client connections