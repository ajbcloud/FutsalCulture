# Template Variables Reference

Use these variables in your email and SMS templates. Variables are wrapped in double curly braces like {{variableName}}.

## User/Parent Variables

- `{{parentName}}` - Full name of the parent/guardian
- `{{parentFirstName}}` - First name of the parent/guardian
- `{{parentEmail}}` - Email address of the parent/guardian
- `{{parentPhone}}` - Phone number of the parent/guardian

## Player Variables

- `{{playerName}}` - Full name of the player
- `{{playerFirstName}}` - First name of the player
- `{{playerAge}}` - Age of the player

## Session Variables

- `{{sessionDate}}` - Date of the session (formatted)
- `{{sessionTime}}` - Time of the session
- `{{sessionLocation}}` - Location/venue of the session
- `{{sessionAgeGroup}}` - Age group for the session
- `{{sessionGender}}` - Gender category for the session

## Organization Variables

- `{{organizationName}}` - Name of the organization/tenant
- `{{organizationPhone}}` - Organization contact phone number
- `{{organizationEmail}}` - Organization contact email

## Financial Variables

- `{{creditAmount}}` - Credit amount (formatted with currency)
- `{{paymentAmount}}` - Payment amount (formatted with currency)

## Waitlist Variables

- `{{waitlistPosition}}` - Position in the waitlist queue
- `{{paymentWindowHours}}` - Hours available to complete payment after promotion

## Invite Code Variables

- `{{tenantCode}}` - Tenant's default invite code
- `{{inviteCode}}` - Specific invite code used by recipient
- `{{codeAgeGroup}}` - Age group pre-filled from invite code
- `{{codeGender}}` - Gender pre-filled from invite code
- `{{codeLocation}}` - Location pre-filled from invite code
- `{{codeClub}}` - Club/team pre-filled from invite code
- `{{code_customField}}` - Custom metadata field from invite code (replace customField with actual field name)

## Generic Variables

- `{{recipientName}}` - Name of the message recipient
- `{{senderName}}` - Name of the message sender

## Custom Invite Code Metadata

Invite codes can have custom metadata fields. Access them using `{{code_fieldName}}` where `fieldName` is the metadata key.
For example, if an invite code has metadata `{"teamName": "Eagles"}`, use `{{code_teamName}}`.

## Notes

- All variables are optional and will be replaced with empty string if not available
- Variables are case-sensitive
- Invite code variables use the user's specific code if available, otherwise the tenant's default code

## Examples

### Email Template Example
```
Hi {{parentName}},

Your booking for {{playerName}} has been confirmed!

Session Details:
- Date: {{sessionDate}}
- Time: {{sessionTime}}
- Location: {{sessionLocation}}
- Age Group: {{sessionAgeGroup}}

{{playerName}} joined using invite code {{inviteCode}} for the {{codeAgeGroup}} group at {{codeLocation}}.

Best regards,
{{organizationName}}
{{organizationPhone}}
```

### SMS Template Example
```
{{organizationName}}: {{playerName}} confirmed for {{sessionAgeGroup}} on {{sessionDate}} at {{sessionTime}}. Code: {{inviteCode}}
```
