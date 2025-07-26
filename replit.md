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
- **8 AM Rule**: Sessions open for booking at 8 AM on the day of the session only
- **Multiple Sessions**: Up to 3+ sessions can be scheduled per day (Monday-Friday)
- **Real-time Status**: Sessions show "Pending" before 8 AM, "Open" during booking hours, "Full" when capacity reached
- Sessions automatically close when capacity is reached or start time passes
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
- Comprehensive seed data system with 10 parents, 14 players, 10 sessions, 14 signups, and 14 payments
- Sample data includes realistic portal access controls and contact information for testing
- Smart invite system testing data with varied email/phone combinations
- Run seeding with: `tsx server/seed.ts`
- Clears existing data and repopulates with fresh test data

### Calendar Features
- **Interactive Calendar View**: Monthly calendar showing sessions on each day
- **Clickable Days**: Click any calendar day to see detailed session information in a popup
- **Session Popups**: Show full session details including time, location, capacity, pricing, and booking status
- **Age-Based Filtering**: Authenticated parents see only sessions eligible for their players' age groups
- **Navigation**: Calendar view available on both home page and sessions page