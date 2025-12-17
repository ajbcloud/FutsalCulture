# Braintree Troubleshooting

## Connection Errors

### "Invalid credentials"
**Cause:** Merchant ID, Public Key, or Private Key is incorrect
**Fix:**
1. Verify you're using the correct environment (sandbox vs production)
2. Re-copy credentials from Braintree Control Panel
3. Check for extra whitespace before/after values
4. Ensure you're using API keys, not tokenization key

### "Authentication failed"
**Cause:** Account may be locked or credentials revoked
**Fix:**
1. Log into Braintree directly to verify account access
2. Generate new API keys
3. Update credentials in app

### "Test connection successful but payments fail"
**Cause:** Payment methods not enabled on account
**Fix:**
1. In Braintree: Settings > Processing
2. Enable required payment methods (Cards, PayPal)
3. Wait for activation (may take 24 hours)

## Webhook Issues

### "Webhook signature verification failed"
**Cause:** Webhook URL mismatch or secret misconfigured
**Fix:**
1. Verify the exact webhook URL in Braintree matches your app
2. Delete and recreate the webhook in Braintree
3. Use the URL shown in your app's webhook setup step

### "Webhooks not being received"
**Cause:** Firewall, incorrect URL, or webhook not created
**Fix:**
1. Verify webhook is created in Braintree Control Panel
2. Check the webhook URL is accessible from internet
3. Try sending a test webhook from Braintree

## Payment Errors

### "Payment method nonce is required"
**Cause:** Frontend didn't submit payment correctly
**Fix:** Refresh page and try payment again

### "Processor declined"
**Cause:** Card declined by issuing bank
**Fix:** Customer should use different payment method or contact their bank

## Getting Help
- Braintree Support: support@braintreepayments.com
- Braintree Documentation: https://developer.paypal.com/braintree/docs
