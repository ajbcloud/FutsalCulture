# Beta Onboarding QA Checklist

## Acceptance Tests

### 1. Sign Up Flow
- [ ] Navigate to `/get-started`
- [ ] Fill out organization name, contact name, and email
- [ ] Submit form successfully
- [ ] Verify tenant is created in database
- [ ] Verify email verification token is generated
- [ ] Check that Stripe customer is created

### 2. Email Verification
- [ ] Use verification link from email (or database token)
- [ ] Verify token validation works
- [ ] Verify user is marked as verified
- [ ] Verify expired tokens are rejected
- [ ] Verify used tokens are rejected

### 3. Invite System
- [ ] Login as tenant owner
- [ ] Send invite to new user with role "player"
- [ ] Check invite is created in database
- [ ] Verify invite email is sent
- [ ] Test invite expiration (7 days)
- [ ] Test invite revocation

### 4. Accept Invite
- [ ] Use invite link from email
- [ ] Fill out account details
- [ ] Accept invite successfully
- [ ] Verify user is added to tenant with correct role
- [ ] Verify invite is marked as used

### 5. Join by Code
- [ ] Get tenant code from database
- [ ] Navigate to `/join` (without token)
- [ ] Enter tenant code and user details
- [ ] Verify successful join
- [ ] Test invalid tenant codes
- [ ] Test approval flow if enabled

### 6. Billing Upgrade
- [ ] Login as tenant owner
- [ ] Navigate to billing page
- [ ] Click upgrade button
- [ ] Complete Stripe checkout flow
- [ ] Verify subscription is created
- [ ] Test webhook updates subscription status

### 7. Webhook Processing
- [ ] Send test Stripe webhook
- [ ] Verify `checkout.session.completed` updates subscription
- [ ] Verify `customer.subscription.deleted` marks as canceled
- [ ] Test webhook signature validation

### 8. Code Rotation
- [ ] Login as tenant owner
- [ ] Rotate tenant code
- [ ] Verify new code is generated
- [ ] Verify old code no longer works
- [ ] Test rate limiting on rotation

### 9. Rate Limiting
- [ ] Make 61 requests in 60 seconds to `/api/get-started`
- [ ] Verify rate limit error after 60 requests
- [ ] Test rate limit window reset
- [ ] Verify different endpoints have separate limits

### 10. Email Rendering
- [ ] Send verification email
- [ ] Send invite email  
- [ ] Send welcome email
- [ ] Verify all emails render correctly
- [ ] Test email bounces are captured
- [ ] Verify HTML formatting and links work

## Test Data Setup

```bash
# Run seed script
npm run seed

# Test endpoints
curl -X POST http://localhost:3000/api/get-started \
  -H "Content-Type: application/json" \
  -d '{"org_name":"Test Org","contact_name":"Test User","contact_email":"test@example.com"}'

# Check health
curl http://localhost:3000/health
```

## Security Tests

- [ ] Test SQL injection on all endpoints
- [ ] Verify CORS settings
- [ ] Test rate limiting bypass attempts
- [ ] Verify webhook signature validation
- [ ] Test authorization on protected routes
- [ ] Verify tenant isolation works correctly

## Performance Tests

- [ ] Load test with 100 concurrent signups
- [ ] Test database connection pooling
- [ ] Verify email sending doesn't block requests
- [ ] Test webhook processing speed
- [ ] Monitor memory usage during stress test

## Browser Tests

- [ ] Test all flows in Chrome
- [ ] Test all flows in Firefox
- [ ] Test all flows in Safari
- [ ] Verify mobile responsiveness
- [ ] Test with JavaScript disabled (graceful degradation)