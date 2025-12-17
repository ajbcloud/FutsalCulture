# SkoreHQ.com Deployment Checklist

## Pre-Deployment Setup ✅

### 1. Environment Variables Required
- [ ] `DATABASE_URL` - Neon PostgreSQL connection string
- [ ] `SESSION_SECRET` - Secure random string for session encryption
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key for payments
- [ ] `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key
- [ ] `SENDGRID_API_KEY` - SendGrid API key for emails
- [ ] `REPL_ID` - Replit environment ID
- [ ] `ISSUER_URL` - OpenID Connect issuer URL

### 2. Database Migration
- [ ] Run `npm run db:push` to apply schema changes
- [ ] Verify all tables are created correctly
- [ ] Run seed data if needed: `tsx server/multi-tenant-seed.ts`

### 3. Production Build Test
- [ ] Run `npm run build` to test production build
- [ ] Verify no build errors
- [ ] Test `npm start` locally

## Deployment Steps

### 1. Replit Deployment
- [ ] Click Deploy button in Replit
- [ ] Wait for initial deployment to complete
- [ ] Note the default `.replit.app` URL

### 2. Custom Domain Configuration
- [ ] In Replit deployment settings, add `skorehq.com` as custom domain
- [ ] Copy the DNS records provided by Replit

### 3. Cloudflare DNS Setup
- [ ] Add CNAME record: `@` pointing to Replit deployment URL
- [ ] Add CNAME record: `www` pointing to Replit deployment URL
- [ ] Set SSL/TLS encryption to "Full"
- [ ] Enable "Always Use HTTPS"
- [ ] Set minimum TLS version to 1.2

### 4. Post-Deployment Verification
- [ ] Test `https://skorehq.com` loads correctly
- [ ] Test user authentication flow
- [ ] Test admin portal access
- [ ] Test super admin portal access
- [ ] Verify database connections
- [ ] Test payment processing (if enabled)
- [ ] Test email notifications

## Security Configuration

### 1. Cloudflare Security
- [ ] Enable Bot Fight Mode
- [ ] Configure Security Level to "Medium" or "High"
- [ ] Set up Page Rules for admin routes (if needed)
- [ ] Enable DDoS protection

### 2. Application Security
- [ ] Verify CORS settings for production domain
- [ ] Check CSP headers (if configured)
- [ ] Validate session security settings
- [ ] Review admin access controls

## Performance Optimization

### 1. Cloudflare Performance
- [ ] Enable Auto Minify (CSS, HTML, JS)
- [ ] Enable Brotli compression
- [ ] Configure Browser Cache TTL
- [ ] Enable "Rocket Loader" (test thoroughly)

### 2. Application Performance
- [ ] Verify database connection pooling
- [ ] Check API response times
- [ ] Monitor memory usage
- [ ] Test under load

## Monitoring & Maintenance

### 1. Error Monitoring
- [ ] Set up error logging
- [ ] Configure alerts for critical errors
- [ ] Monitor database performance
- [ ] Track user authentication issues

### 2. Backup Strategy
- [ ] Verify database backups (Neon automatic backups)
- [ ] Document restore procedures
- [ ] Test backup restoration process

## DNS Records for Cloudflare

Add these records in your Cloudflare DNS settings for `skorehq.com`:

```
Type: CNAME
Name: @
Target: [your-replit-deployment-url]
Proxy: Enabled (Orange Cloud)

Type: CNAME  
Name: www
Target: [your-replit-deployment-url]
Proxy: Enabled (Orange Cloud)
```

## SSL Certificate

Cloudflare will automatically provide SSL certificates. Ensure:
- SSL/TLS encryption mode is set to "Full"
- "Always Use HTTPS" is enabled
- HTTP Strict Transport Security (HSTS) is enabled

## Final Notes

- The app supports multi-tenant architecture with Super Admin capabilities
- Default Super Admin access requires `isSuperAdmin: true` in user record
- All payments are processed through Stripe
- Email notifications use SendGrid
- Database migrations are handled through Drizzle ORM