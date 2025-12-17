# SkoreHQ.com Production Configuration

## Application Overview
- **Domain**: skorehq.com
- **Platform**: Multi-tenant futsal training management
- **Architecture**: Full-stack React + Express + PostgreSQL
- **Authentication**: Replit OpenID Connect
- **Payments**: Stripe integration
- **Email**: SendGrid integration

## Production Environment Variables

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# Authentication
SESSION_SECRET=your-super-secure-session-secret-256-chars
REPL_ID=your-repl-id
ISSUER_URL=https://auth.replit.com

# Payments
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_stripe_public_key

# Email
SENDGRID_API_KEY=SG.your_sendgrid_api_key

# Application
NODE_ENV=production
VITE_APP_URL=https://skorehq.com
```

## Database Schema Migration
The application uses Drizzle ORM with automatic schema management:

```bash
# Push schema changes to production database
npm run db:push
```

## Multi-Tenant Seed Data
To populate with realistic multi-tenant data:

```bash
# Run the comprehensive seed script
tsx server/multi-tenant-seed.ts
```

This creates:
- 2 tenant organizations (Futsal Culture & Elite Footwork Academy)
- 46 users with proper roles
- 69 players with age-compliant portal access
- 110 sessions with realistic scheduling
- 862 signups with 90% paid ratio
- 776 payments totaling realistic revenue
- 12 help requests with resolution tracking

## Super Admin Setup
The platform includes super admin capabilities for managing multiple tenants:

### Creating Super Admin User
1. User must authenticate via Replit OAuth first
2. Manually set `isSuperAdmin: true` in database user record:

```sql
UPDATE users SET "isSuperAdmin" = true WHERE email = 'your-admin@email.com';
```

### Super Admin Features
- Global tenant management
- Cross-tenant analytics
- Platform-wide user management
- Integration configuration
- System settings control

## Security Configuration

### HTTPS & SSL
- Cloudflare handles SSL termination
- Force HTTPS redirects enabled
- TLS 1.2+ minimum
- HSTS headers enabled

### CORS Configuration
The application is configured for these domains:
- `https://skorehq.com`
- `https://www.skorehq.com`

### Session Security
- Secure session cookies
- PostgreSQL session store
- 24-hour session expiry
- CSRF protection via SameSite cookies

## Performance Optimizations

### Database
- Connection pooling via Neon serverless
- Indexed tenant_id fields on all tables
- Optimized queries with proper joins
- Background job cleanup

### Frontend
- Vite production build optimization
- Code splitting by routes
- Asset compression
- CDN delivery via Cloudflare

### API
- Response caching where appropriate
- Rate limiting on sensitive endpoints
- Efficient database queries
- Background job processing

## Monitoring & Logging

### Application Logs
- Express request logging
- Database query logging
- Authentication event logging
- Error stack traces

### Performance Monitoring
- API response times
- Database query performance
- Memory usage tracking
- Session management

## Backup & Recovery

### Database Backups
- Neon automatic daily backups
- Point-in-time recovery available
- 30-day backup retention

### Application Recovery
- Replit automatic deployments
- Git-based version control
- Environment variable backup
- Configuration documentation

## Deployment Process

### Pre-Deployment Checklist
- [ ] Environment variables configured
- [ ] Database schema up to date
- [ ] SSL certificates valid
- [ ] DNS records configured
- [ ] Monitoring enabled

### Deployment Steps
1. Build production assets: `npm run build`
2. Deploy via Replit platform
3. Configure custom domain
4. Update DNS records
5. Verify SSL certificates
6. Test all functionality

### Post-Deployment Verification
- [ ] Application loads at skorehq.com
- [ ] Authentication flow works
- [ ] Database connections stable
- [ ] Payment processing functional
- [ ] Email notifications working
- [ ] Admin/Super Admin access

## Maintenance Tasks

### Regular Maintenance
- Monitor error logs daily
- Check database performance weekly
- Update dependencies monthly
- Review security settings quarterly

### Scaling Considerations
- Database connection limits
- Session storage capacity
- File upload limitations
- API rate limiting

## Support & Documentation

### User Support
- Help request system built-in
- Admin response tracking
- Email notification system
- Priority-based ticket management

### Technical Documentation
- API endpoint documentation
- Database schema reference
- Integration guides
- Troubleshooting procedures