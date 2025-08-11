# Sessions CSV Import Guide

## Overview

Use the **blank template** for your tenant. All times must be **ISO 8601 with timezone** (e.g., `2025-08-29T14:00:00-04:00`). Age & gender options must match the admin "Create Session" screen.

## Required Fields

### `title*` (text, up to 120 characters)
Session name that appears to users.  
**Example:** `U12 Skills Clinic`

### `location*` (existing location by name)
If not found, the importer will create it automatically.  
**Example:** `Sports Hub`

### `start_time*` / `end_time*` (ISO 8601 with timezone)
Must include timezone. `end_time` must be after `start_time`.  
**Example:** `2025-08-29T14:00:00-04:00`

### `age_groups*` (U9, U10, U11, etc.)
Separate multiple values with semicolons.  
**Example:** `U10;U12`

### `genders*` (Boys, Girls, or Mixed)
Case sensitive.  
**Example:** `Mixed`

### `capacity*` (positive integer)
Maximum number of players for this session.  
**Example:** `12`

## Optional Fields

- `booking_open_time` - HH:mm format (06:00 to 19:00)
- `price_cents` - Integer amount in cents (2500 = $25.00)
- `has_access_code` - true or false
- `access_code` - 3-32 characters (required if `has_access_code=true`)
- `waitlist_enabled` - true or false
- `waitlist_limit` - Integer or empty for unlimited
- `waitlist_offer_minutes` - Minutes to accept waitlist offer (default: 60)
- `waitlist_auto_promote` - Auto-promote from waitlist (true/false)
- `status` - Session status (upcoming, open, full, closed)
- `recurring` - true or false
- `recurring_rule` - RRULE string (required if `recurring=true`)
- `notes` - Internal notes for admins
- `coach_instructions` - Instructions for coaches

## Recurrence Examples

- `FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6` → 6 weeks on Mondays & Wednesdays
- `FREQ=WEEKLY;BYDAY=SU;COUNT=8` → 8 weeks on Sundays  
- `FREQ=DAILY;COUNT=5` → 5 consecutive days

## Common Errors & Solutions

❌ **Missing Timezone:** Add timezone offset to your datetime values.  
✅ **Example:** `2025-08-29T14:00:00-04:00`

❌ **Invalid Age Group:** Use exactly U9, U10, etc. Separate with semicolons.  
✅ **Correct:** `U10;U12`

❌ **Invalid Gender:** Use exact capitalization: Boys, Girls, or Mixed.  
✅ **Correct:** `Mixed`

⚠️ **Missing Access Code:** Provide an access code or set `has_access_code=false`.  
If `has_access_code=true`, `access_code` is required.

## Import Flow

1. **Upload CSV** → Server parses and validates all rows
2. **Preview** → Review table showing all data with any errors/warnings  
3. **Confirm** → Import executes in one transaction

**Preview Display:** Shows "X rows • Y errors • Z warnings". Import is disabled until error count = 0. You can download errors as CSV if needed.

## Need Help?

- Download the **template** for column headers
- Download the **sample** for working examples  
- Contact support if you encounter persistent issues

**Remember:** The manual "Create Session" form is the authoritative source for all supported values and options.