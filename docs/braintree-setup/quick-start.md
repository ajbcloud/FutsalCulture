# Braintree Integration Quick Start

## What This Integration Does
Connect your Braintree merchant account to process payments directly from your clients. Payments settle directly to your account.

## Before You Start
- [ ] A Braintree account (sandbox for testing, production for live payments)
- [ ] Admin access to your organization

## Step 1: Access Settings
1. Log into your admin dashboard
2. Navigate to **Settings > Integrations**
3. Find **Braintree** in the Payment section

## Step 2: Connect Sandbox (Recommended First)
1. Click **Configure** on the Braintree row
2. Select **Sandbox** environment
3. Enter your sandbox credentials:
   - Merchant ID
   - Public Key
   - Private Key
4. Click **Test Connection**
5. On success, click **Save Credentials**

## Step 3: Configure Webhooks
1. Copy the webhook URL shown
2. In Braintree Control Panel: Settings > Webhooks > Create New Webhook
3. Paste your webhook URL
4. Select recommended events (see Webhook Events below)

## Step 4: Connect Production
Repeat Step 2 with your production credentials.

## Step 5: Activate
Toggle the active environment to **Production** when ready for live payments.

## Webhook Events to Enable
- Subscription: charged_successfully, charged_unsuccessfully, canceled, expired
- Dispute: opened, won, lost
- Transaction: settled, settlement_declined

---
[Detailed Guide](./existing-account.md) | [New Account Setup](./new-account.md) | [Troubleshooting](./troubleshooting.md)
