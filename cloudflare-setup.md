# Cloudflare Configuration for SkoreHQ.com

## DNS Records Setup

### Required DNS Records
Add these records in your Cloudflare DNS dashboard:

```
Type: CNAME
Name: @
Target: [your-replit-deployment-url].replit.app
Proxy Status: Proxied (Orange Cloud)
TTL: Auto

Type: CNAME
Name: www
Target: [your-replit-deployment-url].replit.app
Proxy Status: Proxied (Orange Cloud)
TTL: Auto
```

## SSL/TLS Configuration

### SSL Settings
1. Go to SSL/TLS → Overview
2. Set encryption mode to **"Full (strict)"**
3. Enable **"Always Use HTTPS"**
4. Set minimum TLS version to **1.2**

### SSL/TLS Certificates
- Cloudflare Universal SSL will automatically provision certificates
- Edge certificates will cover both `skorehq.com` and `www.skorehq.com`
- Certificate authority: Let's Encrypt or Google Trust Services

## Security Settings

### Security Level
1. Go to Security → Settings
2. Set Security Level to **"Medium"** or **"High"**
3. Enable **"Bot Fight Mode"**
4. Configure **"Challenge Passage"** to 30 minutes

### Firewall Rules (Optional)
Create rules to protect admin areas:

```
Rule 1: Admin Portal Protection
Expression: (http.request.uri.path contains "/admin" and cf.threat_score > 10)
Action: Block

Rule 2: Super Admin Protection  
Expression: (http.request.uri.path contains "/super-admin")
Action: JS Challenge
```

## Performance Optimization

### Speed Settings
1. Go to Speed → Optimization
2. Enable **"Auto Minify"**:
   - ✅ JavaScript
   - ✅ CSS  
   - ✅ HTML
3. Enable **"Brotli"** compression
4. Enable **"Enhanced HTTP/2 Prioritization"**

### Caching Settings
1. Go to Caching → Configuration
2. Set **"Browser Cache TTL"** to 4 hours
3. Set **"Caching Level"** to Standard
4. Enable **"Always Online"**

### Page Rules
Create these page rules for optimal performance:

```
Rule 1: API Routes (No Cache)
URL: skorehq.com/api/*
Settings: Cache Level = Bypass

Rule 2: Static Assets (Long Cache)
URL: skorehq.com/assets/*
Settings: 
- Cache Level = Cache Everything
- Browser Cache TTL = 1 month
- Edge Cache TTL = 1 month

Rule 3: Admin Areas (Security Headers)
URL: skorehq.com/admin*
Settings:
- Security Level = High
- Cache Level = Bypass
```

## Network Configuration

### HTTP/3 (QUIC)
1. Go to Network
2. Enable **"HTTP/3 (with QUIC)"**
3. Enable **"0-RTT Connection Resumption"**

### IPv6 Compatibility
1. Enable **"IPv6 Compatibility"**
2. Enable **"Pseudo IPv4"**

## Analytics & Monitoring

### Web Analytics
1. Go to Analytics & Logs → Web Analytics
2. Enable **"Web Analytics"**
3. Configure **"Custom Events"** for:
   - User registrations
   - Payment completions
   - Session bookings

### Real User Monitoring (RUM)
1. Enable **"Browser Insights"**
2. Configure **"Core Web Vitals"** tracking
3. Set up **"Performance Monitoring"**

## Access Control

### Authenticated Origin Pulls (Optional)
For additional security between Cloudflare and Replit:

1. Go to SSL/TLS → Origin Server
2. Enable **"Authenticated Origin Pulls"**
3. Upload Cloudflare's origin certificate to Replit

### API Shield (Pro Plan Feature)
If upgrading to Pro plan:
1. Enable **"API Shield"**
2. Configure **"Rate Limiting"** for API endpoints
3. Set up **"Schema Validation"**

## Mobile Optimization

### Mobile Redirect (If Needed)
Currently not needed as the app is responsive, but available if mobile-specific domain required.

### AMP (Accelerated Mobile Pages)
Not applicable for this interactive application.

## Email Security

### Email Routing
If using custom email addresses:
1. Go to Email → Email Routing
2. Configure catch-all forwarding
3. Set up custom email addresses:
   - `admin@skorehq.com`
   - `support@skorehq.com`
   - `noreply@skorehq.com`

## Troubleshooting

### Common Issues

**SSL Certificate Pending**
- Wait 15-30 minutes for certificate provisioning
- Verify DNS records are proxied (orange cloud)
- Check that origin server supports HTTPS

**Redirect Loop**
- Ensure SSL/TLS mode is "Full" or "Full (strict)"
- Verify origin server HTTPS configuration
- Check Page Rules for conflicting redirects

**502/503 Errors**
- Verify Replit deployment is running
- Check origin server health
- Confirm DNS records point to correct Replit URL

### Support Resources
- Cloudflare Community: https://community.cloudflare.com/
- Cloudflare Status: https://www.cloudflarestatus.com/
- Documentation: https://developers.cloudflare.com/

## Post-Setup Verification

### Test Checklist
- [ ] `https://skorehq.com` loads correctly
- [ ] `https://www.skorehq.com` redirects properly
- [ ] SSL certificate shows as valid
- [ ] Admin portal accessible at `/admin`
- [ ] Super admin portal accessible at `/super-admin`
- [ ] API endpoints responding correctly
- [ ] Authentication flow working
- [ ] Payment processing functional (if enabled)

### Performance Testing
- [ ] Page load times under 3 seconds
- [ ] Core Web Vitals in good range
- [ ] Mobile responsiveness working
- [ ] Caching headers properly set
- [ ] Compression working correctly