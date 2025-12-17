# SkoreHQ Booking App

## Overview
SkoreHQ is a full-stack web application for booking futsal training spots, evolving into a multi-tenant Super-Admin platform. It supports day-of booking, payment integration, and real-time capacity monitoring. The business vision is to provide a scalable SaaS solution for sports academies, streamlining booking for parents and offering robust administrative tools for organizations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend**: React with TypeScript, functional components, and hooks.
- **Styling**: Tailwind CSS and Shadcn/UI.
- **Responsiveness**: Mobile-first design.
- **Theming**: Full light/dark mode support.
- **Navigation**: Intuitive tab-style, unified portal, and mobile-optimized menus.
- **Terminology**: Dynamic, age policy-aware UI labels based on tenant's audience mode and user's household composition.

### Technical Implementations
- **Backend**: Node.js with Express and TypeScript for a RESTful API.
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM and connection pooling.
- **Authentication**: Clerk-hosted authentication (@clerk/clerk-react, @clerk/express) as the sole identity provider. Users table links `clerkUserId` to internal users. Admin routes use `requireAdmin` middleware.
- **Authorization**: Capability-Based Access Control for fine-grained permissions, enforced by backend middleware.
- **State Management**: TanStack Query for server state and data fetching.
- **Form Handling**: React Hook Form with Zod for type-safe validation.
- **Background Jobs**: `setInterval` for capacity monitoring and session status updates.

### Feature Specifications
- **Core Booking**: Session management (creation, filtering, calendar), time-restricted booking (8 AM day-of rule), real-time capacity monitoring, automatic session closure.
- **Payment & Credits**: Braintree-only processing (Stripe removed). Comprehensive user credit system replaces refunds, with FIFO application and automatic checkout integration. Subscription management includes immediate upgrades, end-of-period downgrades, and abuse prevention.
- **Signup & Registration**: Role-based signup (Player/Parent/Guardian) with age-gating and portal access determination. Supports unaffiliated signup to a staging tenant with "Join a Club" CTA. Central signup hub at `/get-started`.
- **Unaffiliated User Restrictions**: Users on `platform-staging` tenant are blocked from tenant-specific actions until joining a club, with both frontend and backend enforcement.
- **Admin & User Dashboards**: Parent dashboard for player/booking history; Admin panel for session management, analytics, user management, discount codes, help requests, and system settings.
- **Multi-tenancy**: Super Admin portal for managing organizations, tenant defaults, and policy settings. Critical fix for multi-tenant data isolation: all admin endpoints now enforce `tenantId` filtering.
- **Advanced Features**: Recurring sessions, analytics dashboard, structured help requests, business branding, seed data, session waitlist with automated promotion.
- **SaaS & Feature Control**: 3-Tier SaaS pricing (Core, Growth, Elite) with plan-based feature access control via a feature flag system.
- **Communication System**: Template-based email/SMS notification system with automated triggers, bulk sending, template management UI, variable replacement, consent management, and custom contact groups.
- **Invitation System**: Unified `inviteCodes` table for invite, access, and discount codes with pre-fill metadata, custom JSON, usage tracking, and full CRUD admin UI.
- **Trial Experience**: Client-facing trial status indicator with countdown, color-coded urgency, trial extension, and upgrade CTAs. Trial management enforces Super Admin-configured settings.
- **Consent Form System**: Consent forms are required by default. Enhanced `ConsentDocumentModal` supports deferred signature collection for scenarios like Parent2 invite flow.

### System Design Choices
- **Development Environment**: Vite.
- **Code Quality**: TypeScript, organized file structure, automated cleanup.
- **Business Logic**: "8 AM Rule", extended booking windows, automatic closure, real-time session status.
- **SaaS Architecture**: Database-driven feature management, plan limits enforcement, audit logging.

## External Dependencies

- **Neon Database**: PostgreSQL hosting.
- **Braintree**: Payment processing.
- **Clerk**: User authentication.
- **Resend**: Email communication.
- **Telnyx**: SMS communication.