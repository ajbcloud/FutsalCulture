# PlayHQ Booking App

## Overview
PlayHQ is a full-stack web application designed for booking limited spots in weekly futsal training sessions. It provides day-of booking, payment integration, and real-time capacity monitoring. The project is evolving into a multi-tenant Super-Admin platform to support various futsal clubs and organizations, incorporating `tenant_id` across tables, a Super-Admin role, tenant management, and scoped data access. The app aims to streamline the booking process for parents and offer robust administrative tools for futsal organizations, with a business vision to provide a scalable SaaS solution for sports academies.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend Frameworks**: React with TypeScript.
- **Styling**: Tailwind CSS and Shadcn/UI.
- **Responsiveness**: Mobile-first approach.
- **Theming**: Full light/dark mode support.
- **Navigation**: Intuitive tab-style navigation, unified portal navigation, and mobile-optimized menus.
- **Terminology**: Dynamic, age policy-aware terminology system adapting UI labels based on tenant's audience mode and user's household composition.

### Technical Implementations
- **Backend**: Node.js with Express and TypeScript.
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM.
- **Authentication**: Clerk-hosted authentication using Authorization Bearer headers only (required for Replit dev environment where cookies don't work cross-site). Middleware chain: `clerkMiddleware()` → `syncClerkUser` → route handlers. Use `getAuth(req)` to access Clerk user ID. Frontend uses `get()`, `apiRequest()`, `authFetch()` from `@/lib/queryClient` for authenticated API calls. Role-based access control (parent, admin, Super-Admin).
- **Authorization**: Capability-Based Access Control for fine-grained permissions.
- **State Management**: TanStack Query for server state.
- **Form Handling**: React Hook Form with Zod for type-safe validation.
- **Background Jobs**: `setInterval` for capacity monitoring and session status updates.

### Feature Specifications
- **Core Booking**: Session management (creation, filtering), interactive calendar, time-restricted booking, real-time capacity monitoring.
- **Payment & Credits**: Stripe and Braintree integration for payment processing, including webhooks and subscription management. Comprehensive user credit system for cancellations.
- **Signup & Registration**: Role-based signup flow (Player/Parent/Guardian) with age-gating. Consumer signup uses a simple post-login JoinClubModal approach where users sign up normally, then join their club using the tenant slug as the join code. After joining, users are signed out and must log back in for a clean session with proper org membership.
- **Admin & User Dashboards**: Parent dashboard for history, Admin panel for management, analytics, and settings.
- **Multi-tenancy**: Super Admin portal for managing organizations, tenant defaults, and policies.
- **Advanced Features**: Recurring sessions, analytics dashboard, structured help requests, business branding, waitlist system, and a comprehensive consent form system.
- **SaaS & Feature Control**: 3-Tier SaaS pricing (Core, Growth, Elite) with plan-based feature access control via a feature flag system.
- **Communication System**: Template-based email/SMS notification system with automated triggers, bulk sending, and consent management.
- **Invitation System**: Unified invitation code system for invite, access, and discount codes with tracking and admin UI.
- **Trial Experience**: Client-facing trial status indicator with countdown, extension capability, and upgrade CTAs.
- **Clerk Organizations**: Integration of Clerk Organizations for multi-tenant membership management, mapping each PlayHQ tenant to one Clerk organization.

### System Design Choices
- **Development Environment**: Vite for development.
- **Code Quality**: TypeScript validation, organized file structure.
- **Business Logic**: Implementation of "8 AM Rule", extended booking windows, automatic closure.
- **SaaS Architecture**: Database-driven feature management, plan limits enforcement, and audit logging.

## External Dependencies

- **Neon Database**: PostgreSQL hosting.
- **Stripe**: Payment processing.
- **Braintree**: Payment processing.
- **Clerk**: User authentication and organization management.
- **Resend**: Email communication.
- **Telnyx**: SMS communication.