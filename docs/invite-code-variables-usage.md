# Invite Code Variables Usage Guide

This guide explains how to use invite code variables in email and SMS templates.

## Overview

The communication system now supports invite code variables that can be used in notification templates. These variables allow you to personalize messages based on the invite code used by the recipient.

## Available Invite Code Variables

- `{{tenantCode}}` - The tenant's default invite code
- `{{inviteCode}}` - The specific invite code used by the recipient
- `{{codeAgeGroup}}` - Age group pre-filled from the invite code
- `{{codeGender}}` - Gender pre-filled from the invite code
- `{{codeLocation}}` - Location pre-filled from the invite code
- `{{codeClub}}` - Club/team pre-filled from the invite code
- `{{code_customField}}` - Custom metadata from invite code (replace `customField` with actual field name)

## How It Works

1. **Tenant Default Code**: Every tenant can have a default invite code that is used when no specific code is provided
2. **User-Specific Code**: If a user signed up using a specific invite code, their personalized variables will use that code's data
3. **Fallback**: If a user doesn't have a specific code, the system falls back to the tenant's default code
4. **Graceful Handling**: All variables are optional and will be replaced with empty string if not available

## Implementation Examples

### Example 1: Sending Booking Confirmation with Invite Code Data

```typescript
import { buildNotificationVariables } from './utils/notification-helpers';
import { replaceTemplateVariables } from './utils/template-variables';
import { sendEmail } from './emailService';

async function sendBookingConfirmation(
  storage: IStorage,
  tenantId: string,
  userId: string,
  bookingData: any
) {
  // Build variables with invite code data
  const variables = await buildNotificationVariables(
    {
      parentName: bookingData.parentName,
      playerName: bookingData.playerName,
      sessionDate: bookingData.sessionDate,
      sessionTime: bookingData.sessionTime,
      sessionLocation: bookingData.sessionLocation,
      organizationName: 'PlayHQ Academy'
    },
    storage,
    tenantId,
    userId  // User ID to fetch their specific invite code
  );
  
  // Get template from database
  const template = await storage.getTemplateByMethod(tenantId, 'booking_confirmation', 'email');
  
  // Replace variables in both subject and content
  const subject = replaceTemplateVariables(template.subject, variables);
  const content = replaceTemplateVariables(template.template, variables);
  
  // Send email
  await sendEmail({
    to: bookingData.parentEmail,
    from: 'noreply@playhq.app',
    subject,
    html: content
  });
}
```

### Example 2: Sending Campaign with Invite Code Variables

```typescript
import { sendCampaignEmail } from './emailService';
import { fetchInviteCodeVariables } from './utils/notification-helpers';

async function sendCampaignWithInviteCodes(
  storage: IStorage,
  tenantId: string,
  campaignId: string,
  recipients: Array<{ email: string; name: string; userId: string }>
) {
  // Fetch invite code variables for the tenant
  const tenantInviteVars = await fetchInviteCodeVariables(storage, tenantId);
  
  // Send campaign with invite code variables
  await sendCampaignEmail(
    campaignId,
    recipients.map(r => ({ 
      email: r.email, 
      name: r.name, 
      tenantId 
    })),
    'Join us at {{codeLocation}} for {{codeAgeGroup}} sessions!',
    `
      <h2>Hi {{name}}!</h2>
      <p>You're invited to join our {{codeAgeGroup}} program at {{codeLocation}}.</p>
      <p>Use code <strong>{{inviteCode}}</strong> when signing up!</p>
      <p>Club: {{codeClub}}</p>
    `,
    {
      ...tenantInviteVars,
      // Additional custom variables
      organizationName: 'PlayHQ Academy'
    }
  );
}
```

### Example 3: Template with Custom Metadata

If an invite code has custom metadata like:
```json
{
  "teamName": "Eagles",
  "coachName": "John Smith",
  "practiceDay": "Tuesday"
}
```

You can use these in your template:
```
Hi {{parentName}},

Welcome to the {{code_teamName}}! Your coach {{code_coachName}} is excited to meet {{playerName}}.

Practice is every {{code_practiceDay}} at {{codeLocation}}.

Use invite code {{inviteCode}} to get started.
```

### Example 4: Using the Helper Function

The `buildNotificationVariables` helper makes it easy to include invite code data:

```typescript
import { buildNotificationVariables } from './utils/notification-helpers';
import { replaceTemplateVariables } from './utils/template-variables';

// Build complete variables including invite codes
const variables = await buildNotificationVariables(
  {
    // Your base variables
    parentName: 'John Doe',
    playerName: 'Jane Doe',
    sessionDate: '2025-10-15',
    organizationName: 'PlayHQ'
  },
  storage,
  tenantId,
  userId  // Optional: user ID to get their specific code
);

// Variables now include:
// - All your base variables
// - tenantCode (if tenant has default code)
// - inviteCode (if user has specific code or tenant default)
// - codeAgeGroup, codeGender, codeLocation, codeClub
// - Any custom metadata as code_fieldName

// Use in template
const message = replaceTemplateVariables(
  'Hi {{parentName}}, join {{playerName}} at {{codeLocation}} using code {{inviteCode}}!',
  variables
);
```

## Template Examples

### Email Template with Invite Codes
```html
<!DOCTYPE html>
<html>
<body>
  <h2>Welcome to {{organizationName}}!</h2>
  
  <p>Hi {{parentName}},</p>
  
  <p>Thank you for registering {{playerName}} using invite code <strong>{{inviteCode}}</strong>!</p>
  
  <div style="background: #f0f0f0; padding: 15px; border-radius: 5px;">
    <h3>Your Program Details:</h3>
    <ul>
      <li><strong>Age Group:</strong> {{codeAgeGroup}}</li>
      <li><strong>Location:</strong> {{codeLocation}}</li>
      <li><strong>Club/Team:</strong> {{codeClub}}</li>
      <li><strong>Gender:</strong> {{codeGender}}</li>
    </ul>
  </div>
  
  <p>Your first session is on {{sessionDate}} at {{sessionTime}}.</p>
  
  <p>Share your invite code {{tenantCode}} with friends to invite them too!</p>
  
  <p>Best regards,<br>{{organizationName}}</p>
</body>
</html>
```

### SMS Template with Invite Codes
```
{{organizationName}}: Hi {{parentName}}! {{playerName}} is confirmed for {{codeAgeGroup}} at {{codeLocation}}. Code: {{inviteCode}}. Session: {{sessionDate}} {{sessionTime}}.
```

## Database Schema

### Users Table
Users can have an `inviteCodeId` field that stores which invite code they used during signup:
```typescript
{
  id: string;
  email: string;
  inviteCodeId?: string;  // References invite_codes.id
  // ... other fields
}
```

### Invite Codes Table
```typescript
{
  id: string;
  tenantId: string;
  code: string;
  ageGroup?: string;
  gender?: string;
  location?: string;
  club?: string;
  metadata?: Record<string, any>;  // Custom fields
  isDefault: boolean;  // Is this the tenant's default code?
  // ... other fields
}
```

## Backwards Compatibility

- Existing templates without invite code variables will continue to work
- All invite code variables are optional
- If a variable is not available, it will be replaced with an empty string
- No breaking changes to existing functionality

## Best Practices

1. **Always provide fallback content**: Use variables with context, e.g., "Location: {{codeLocation}}" instead of just "{{codeLocation}}"
2. **Test with and without codes**: Ensure templates look good even when invite code data is missing
3. **Use meaningful defaults**: Configure a tenant default code so variables always have values
4. **Document custom metadata**: If using custom metadata fields, document them for template creators

## Troubleshooting

### Variables not replacing
- Ensure you're using the correct variable name (case-sensitive)
- Check that the invite code has the data you're expecting
- Verify the user has an inviteCodeId or the tenant has a default code

### Custom metadata not working
- Ensure metadata is stored as valid JSON in the database
- Use the `code_` prefix for all custom fields
- Check that the metadata value is a string (non-string values are ignored)
