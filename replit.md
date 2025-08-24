# Futsal Culture Booking App

## Overview
This is a full-stack web application, "Futsal Culture," for booking limited spots in weekly futsal training sessions. It features day-of booking, payment integration, and real-time capacity monitoring. The project is currently undergoing a major architectural change to convert from a single-tenant to a multi-tenant Super-Admin platform, supporting multiple futsal clubs and organizations. This involves adding `tenant_id` to all tables, creating a Super-Admin role, tenant management capabilities, and scoped data access patterns. The app aims to streamline the booking process for parents and provide robust administrative tools for futsal organizations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **React + TypeScript**: Functional components and hooks.
- **Vite**: Fast build tool and development server.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shadcn/UI**: Accessible UI components built on Radix UI.
- **Wouter**: Lightweight client-side routing.
- **TanStack Query**: Server state management and data fetching.
- **React Hook Form + Zod**: Type-safe form validation.

### Backend
- **Node.js + Express**: RESTful API server using TypeScript.
- **Session-based Authentication**: Utilizes Replit's OpenID Connect.
- **Background Jobs**: `setInterval` for capacity monitoring and session status updates.

### Data Storage
- **PostgreSQL**: Primary database via Neon serverless.
- **Drizzle ORM**: Type-safe database queries and schema management.
- **Connection Pooling**: Neon serverless pool.

### Authentication & Authorization
- **Replit Auth**: OpenID Connect for user authentication.
- **Role-based Access**: Differentiates between parent and admin permissions.
- **Session Storage**: PostgreSQL-backed session store using `connect-pg-simple`.
- **Failsafe Super Admin**: Hardcoded super admin user (username: ajosephfinch) that cannot be removed or modified, providing security failsafe against administrative lockout.

### Payment Processing
- **Stripe**: Payment processing for bookings.
- **Client-side Integration**: Stripe Elements for secure forms.
- **Webhook Support**: Handles payment confirmations.

### Core Features
- **Session Management**: Daily session creation with age groups and locations.
- **Interactive Calendar**: Monthly view with clickable days for session details.
- **Advanced Filtering**: Real-time filtering by age group, gender, and location.
- **Booking System**: Time-restricted booking (8 AM day-of rule), with sessions remaining bookable until start time if space is available.
- **Capacity Monitoring**: Real-time tracking of available spots.
- **Parent Dashboard**: Player management and booking history.
- **Admin Panel**: Session management, analytics, user management, discount codes, help requests, and system settings.
- **Player Portal System**: For players aged 13+ with parent-controlled access and separate accounts.
- **Multi-tenant Support**: Super Admin portal for managing multiple futsal organizations.
- **Recurring Session Functionality**: Creation of weekly, bi-weekly, and monthly recurring sessions.
- **Comprehensive Analytics Dashboard**: Real-time KPI charts for revenue, player growth, session occupancy, and age distribution.
- **Help Request System**: Structured fields, resolution tracking, and reply history.
- **Business Branding**: Dynamic display of business name and logo configurable via admin settings.
- **Comprehensive Seed Data**: Includes realistic multi-tenant data for testing across various scenarios.
- **Session Waitlist System**: Complete waitlist functionality when sessions reach capacity, including automated promotion, payment windows, and position management.
- **3-Tier SaaS Pricing Structure**: Comprehensive plan-based feature access control with Core ($99/mo), Growth ($199/mo), and Elite ($499/mo) tiers with database-driven feature management.
- **Feature Flag System**: Backend middleware and frontend hooks for plan-based feature restrictions and upgrade prompts.
- **Comprehensive Feature Management System**: Database-driven feature capabilities with 22+ features across 8 categories (core, communication, payments, analytics, integrations, developer, support, limits), real-time autosave, tenant-level enforcement, and Super Admin feature matrix UI.
- **Theme Customization Removal**: Completely removed theme customization feature from Elite plan due to persistent technical issues with CSS variable application.
- **Complete CSV Template System**: Session management CSV templates now include ALL 20 fields from the New Session form, with required fields marked by asterisks (*) in both template headers and form labels.

### Repository Maintenance
- **Code Quality Cleanup**: Successfully removed debug console.log statements across UI components while preserving server functionality.
- **File Organization**: Cleaned up orphaned backup files and temporary development artifacts.
- **Automated Cleanup Scripts**: Created safe cleanup_logs.sh script with syntax validation and backup restoration.
- **Type Safety**: Core server functionality maintained with TypeScript validation passing for all critical components.

### Business Logic
- **8 AM Rule**: Sessions open for booking at 8 AM on the day of the session.
- **Extended Booking Window**: Sessions bookable until start time if capacity allows.
- **Automatic Closure**: Sessions close when capacity is reached or start time passes.
- **Multiple Sessions**: Supports multiple sessions per day (Monday-Friday).
- **Real-time Status**: Sessions show "Pending" (before 8 AM), "Open" (during booking hours), "Full" (capacity reached).
- **Background Jobs**: Monitor capacity and update session status every 5 minutes.
- **Player Eligibility Enforcement**: Sessions filtered by player age and gender; portal access limited to players 13+.
- **12-Hour Clock Format**: All time-related interfaces use 12-hour format with AM/PM.
- **Waitlist Management**: When sessions reach capacity, parents/players can join waitlists with position tracking, automated promotion, configurable payment windows, and real-time notifications.

### UI/UX Decisions
- **Tailwind CSS & Shadcn/UI**: For a consistent, modern, and accessible design.
- **Responsive Design**: Mobile-first approach ensuring seamless experience across devices.
- **Theme System**: Full light/dark mode support throughout the application.
- **Intuitive Navigation**: Tab-style navigation, unified portal navigation system, and mobile-optimized menus.
- **Interactive Elements**: Clickable calendar days, expandable parent/player rows in admin, and interactive charts.

## External Dependencies

- **Neon Database**: PostgreSQL hosting.
- **Stripe**: Payment processing.
- **Replit Auth**: User authentication (OpenID Connect).
- **SendGrid**: Email communication.
- **Twilio**: SMS communication.
- **Mailchimp**: Email marketing.
- **QuickBooks Online**: Accounting integration.
- **Braintree**: Alternative payment processing.

## SaaS Pricing & Feature Control

### Pricing Tiers
- **Core Plan ($99/mo)**: 150 players max, basic session management, email notifications, basic analytics
- **Growth Plan ($199/mo)**: 500 players max, payment processing, SMS notifications, auto-promotion, advanced features  
- **Elite Plan ($499/mo)**: Unlimited players, advanced analytics, player development system, bulk operations, priority support

### Feature Flag System
- **Backend**: Middleware-based feature checking with tenant-scoped plan validation
- **Frontend**: React hooks for conditional rendering and upgrade prompts
- **Database**: Feature flags table with plan-level mappings and per-tenant overrides
- **Integration**: Seamless feature restrictions across SMS, payments, analytics, and advanced functionality

### Plan Limits & Enforcement
- **Player Limits**: Hard enforcement based on plan level with upgrade prompts
- **Feature Access**: Real-time checking with graceful degradation for restricted features
- **Upgrade Flows**: Contextual upgrade prompts with plan comparison and feature benefits
- **Database-Driven Features**: All features stored in `features` table with plan mappings in `plan_features`
- **Tenant Overrides**: Support for tenant-specific feature overrides via `tenant_feature_overrides` table
- **Audit Logging**: Complete audit trail of all feature changes in `feature_audit_log` table
- **Caching Strategy**: 5-minute cache TTL for tenant capabilities with automatic invalidation
- **Enforcement Middleware**: `requireFeature()` middleware for route-level feature gating