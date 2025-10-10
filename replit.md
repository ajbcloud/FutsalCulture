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
- **Authentication**: Replit Auth (OpenID Connect) for session-based authentication, with role-based access control (parent, admin, Super-Admin) and a PostgreSQL-backed session store. Includes a failsafe Super Admin, email verification, and a player portal system for ages 13+.
- **Authorization**: Capability-Based Access Control for fine-grained permissions, especially for Assistant roles, enforced by backend middleware.
- **State Management**: TanStack Query for server state management and data fetching.
- **Form Handling**: React Hook Form with Zod for type-safe form validation.
- **Background Jobs**: `setInterval` for capacity monitoring and session status updates.

### Feature Specifications
- **Core Booking**: Session management (creation, filtering by age/gender/location), interactive calendar, time-restricted booking (8 AM day-of rule, bookable until start time), real-time capacity monitoring, and automatic session closure.
- **Payment & Credits**: Complete Stripe integration for payment processing, including webhooks and subscription management. Upgrade/downgrade flow uses Stripe-hosted payment links (configured in `shared/stripe-payment-links.ts`) to prevent accidental duplicate subscriptions. A comprehensive user credit system replaces refunds, automatically issuing credits upon session cancellation, with FIFO application and automatic checkout integration. Subscription management includes immediate upgrades, end-of-period downgrades, abuse prevention (24-hour cooldown), and proration disabled.
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
- **Stripe**: Payment processing.
- **Replit Auth**: User authentication (OpenID Connect).
- **SendGrid**: Email communication.
- **Twilio**: SMS communication.