# Setting Up Braintree (Existing Account)

## Finding Your API Credentials

### Step 1: Log into Braintree Control Panel
- Sandbox: https://sandbox.braintreegateway.com/login
- Production: https://www.braintreegateway.com/login

### Step 2: Navigate to API Keys
1. Click the **gear icon** (Settings) in the top right
2. Select **API** from the dropdown
3. Or navigate to: Settings > API Keys

### Step 3: View/Generate Keys
**Merchant ID:**
- Displayed at the top of the API page
- Format: alphanumeric string (e.g., "abc123xyz")

**Public Key:**
- Listed under "API Keys" section
- Click the key to reveal full value
- Format: alphanumeric string

**Private Key:**
- Click **View** next to the API key row
- May require re-authentication
- Copy immediately - shown only once
- If lost, generate new key pair

### Common Mistakes
- ❌ Mixing sandbox and production keys
- ❌ Including extra whitespace when copying
- ❌ Using tokenization key instead of API keys
- ✅ Always test in sandbox before production

### Screenshot Checklist
1. [ ] API Keys page location
2. [ ] Merchant ID location
3. [ ] Where to click for Public Key
4. [ ] Where to click to reveal Private Key
5. [ ] Webhook configuration page

---
*Screenshots to be added: See /docs/braintree-setup/screenshots/*
