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
- **Authentication**: Clerk-hosted authentication (@clerk/clerk-react, @clerk/express) as sole identity provider with simplified flow. Users table includes `clerkUserId` field to link Clerk accounts to internal users. Club owners sign up at /club-signup → auto-creates tenant with subscription/plan → redirects to /dashboard (first user gets isAdmin=true). Parents/players join via /join with invite code. Super-Admin role can ONLY be set directly in database (updateUserSchema blocks isSuperAdmin). Tenant creation uses retry logic with increasing entropy for concurrent safety.
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

### Payment Migration (Phase 3 - Complete)
- Stripe made fully optional with graceful degradation
- Full Braintree integration implemented with dual-processor support:

#### Braintree Schema Changes
- Added `payment_processor` enum (`stripe`, `braintree`) to track active processor per tenant
- Added Braintree fields to tenants table:
  - `braintree_customer_id`, `braintree_subscription_id`, `braintree_status`
  - `braintree_plan_id`, `braintree_payment_method_token`
  - `braintree_oauth_merchant_id` (for OAuth-connected merchants)
  - Timestamps: `braintree_next_billing_date`, `braintree_last_charge_at`, `braintree_last_failure_at`
  - `braintree_failure_count` for payment retry tracking
- Created `tenant_subscription_events` table for comprehensive subscription audit history

#### Braintree Service (`server/services/braintreeService.ts`)
- Customer provisioning and lookup
- Client token generation for Drop-In UI
- Subscription CRUD (create, update, cancel)
- Plan mapping (Core, Growth, Elite)
- 24-hour cooldown period enforcement for plan changes
- Pending downgrade scheduling (effective at billing period end)
- Payment retry functionality
- Subscription event logging

#### Braintree API Endpoints
- `GET /api/billing/braintree/client-token` - Get Drop-In UI client token
- `GET /api/billing/braintree/cooldown-check` - Check plan change eligibility
- `POST /api/billing/braintree/subscribe` - Create new subscription
- `POST /api/billing/braintree/upgrade` - Immediate plan upgrade
- `POST /api/billing/braintree/downgrade` - Schedule end-of-period downgrade
- `POST /api/billing/braintree/cancel` - Cancel subscription
- `GET /api/billing/braintree/subscription` - Get subscription details

#### Braintree Webhooks (`/api/webhooks/braintree`)
- Subscription charged successfully/unsuccessfully
- Subscription canceled/expired
- Subscription went active/past due
- Dispute opened/won/lost

#### Scheduled Jobs
- Daily pending downgrade processing at 4 AM UTC

### Consent Form System (Recently Updated)
- **Default Behavior**: Consent forms are now required by default (`requireConsent: true` in age policy)
- **Tenant Age Policy Endpoint**: `/api/tenant/age-policy` - accessible by any authenticated user (not just admins)
- **Household Player Additions**: When adding a player to a household, consent modal appears if `requireConsent` is enabled. Player and parent IDs exist, so consent is submitted directly to `/api/consent/sign`.
- **Parent2 Invite Flow**: Uses `skipApiSubmit` mode in ConsentDocumentModal to collect signatures without API submission. Signatures are passed to account creation endpoint which persists them after creating the parent2 user.
- **ConsentDocumentModal**: Enhanced with `skipApiSubmit` prop for deferred signature collection when IDs don't exist yet.
- **Key Files**:
  - `client/src/components/consent/ConsentDocumentModal.tsx` - Modal with skipApiSubmit support
  - `client/src/pages/household-management.tsx` - Household management with consent integration
  - `client/src/pages/parent2-invite.tsx` - Parent2 invite with deferred consent

## Required Environment Variables

### Braintree
- `BRAINTREE_MERCHANT_ID` - Braintree merchant ID
- `BRAINTREE_PUBLIC_KEY` - Braintree public key
- `BRAINTREE_PRIVATE_KEY` - Braintree private key
- `BRAINTREE_PLAN_CORE` - (Optional) Plan ID for Core tier (default: playhq_core)
- `BRAINTREE_PLAN_GROWTH` - (Optional) Plan ID for Growth tier (default: playhq_growth)
- `BRAINTREE_PLAN_ELITE` - (Optional) Plan ID for Elite tier (default: playhq_elite)