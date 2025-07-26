# Booking Time Control System

## Overview
The Futsal Culture app implements a flexible booking time control system that ensures sessions are only bookable at specified times on the day of the session.

## Current System (8 AM Rule)

### Global Default
- **Default Booking Time**: 8:00 AM on the day of each session
- **Automatic Status Changes**: Background job runs every 5 minutes to:
  - Change sessions from "upcoming" to "open" at booking time
  - Close sessions when they start
  - Update capacity status when full

### How It Works

1. **Session States**:
   - `upcoming` - Before booking opens
   - `open` - Booking is available
   - `full` - At capacity
   - `closed` - Session has started or ended

2. **Booking Availability Check**:
   ```typescript
   // Current logic in shared/utils.ts
   export function isSessionBookingOpen(session: any): boolean {
     const now = new Date();
     const sessionDate = new Date(session.startTime);
     const bookingOpenTime = new Date(sessionDate);
     
     // Use per-session time or default to 8 AM
     const hour = session.bookingOpenHour ?? 8;
     const minute = session.bookingOpenMinute ?? 0;
     
     bookingOpenTime.setHours(hour, minute, 0, 0);
     
     const isToday = sessionDate.toDateString() === now.toDateString();
     const isAfterBookingTime = now >= bookingOpenTime;
     
     return isToday && isAfterBookingTime && session.status === "open";
   }
   ```

3. **UI Feedback**:
   - Before booking time: "Booking opens at 8 AM today" or "Booking opens at 8 AM on [date]"
   - During booking window: "Reserve Spot" button enabled
   - After session starts: "Session Started" (disabled)

## Per-Session Custom Booking Times

### Database Schema Enhancement
Added fields to `futsal_sessions` table:
- `bookingOpenHour` (0-23): Hour when booking opens
- `bookingOpenMinute` (0-59): Minute when booking opens

### Setting Custom Times

#### Via Admin Interface
When creating/editing sessions, admins can set:
- **Booking Open Hour**: 0-23 (defaults to 8)
- **Booking Open Minute**: 0-59 (defaults to 0)

#### Examples:
- **Early Bird Sessions**: Open at 6:00 AM
- **Weekend Sessions**: Open at 9:00 AM  
- **Special Events**: Open at 7:30 AM

### Implementation in Admin Panel
```typescript
// In session creation form
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Booking Open Hour (0-23)</Label>
    <Input
      type="number"
      min="0"
      max="23"
      value={formData.bookingOpenHour ?? 8}
      onChange={(e) => setFormData({
        ...formData,
        bookingOpenHour: parseInt(e.target.value)
      })}
    />
  </div>
  <div>
    <Label>Booking Open Minute (0-59)</Label>
    <Input
      type="number"
      min="0"
      max="59"
      value={formData.bookingOpenMinute ?? 0}
      onChange={(e) => setFormData({
        ...formData,
        bookingOpenMinute: parseInt(e.target.value)
      })}
    />
  </div>
</div>
```

## Global Configuration

### Configuration File
Created `shared/booking-config.ts` for global settings:

```typescript
export const GLOBAL_BOOKING_CONFIG = {
  defaultBookingOpenHour: 8,
  defaultBookingOpenMinute: 0,
  
  specialRules: {
    weekend: { bookingOpenHour: 9, bookingOpenMinute: 0 },
    holiday: { bookingOpenHour: 7, bookingOpenMinute: 0 }
  }
};
```

### Changing Global Default
To change the global booking time:

1. **Update Configuration**:
   ```typescript
   // In shared/booking-config.ts
   export const GLOBAL_BOOKING_CONFIG = {
     defaultBookingOpenHour: 7, // Changed from 8 to 7
     defaultBookingOpenMinute: 30, // Opens at 7:30 AM
   };
   ```

2. **Database Migration** (if needed):
   ```sql
   -- Update existing sessions without custom times
   UPDATE futsal_sessions 
   SET booking_open_hour = 7, booking_open_minute = 30 
   WHERE booking_open_hour IS NULL;
   ```

## Advanced Features

### Time Zone Handling
- All times are stored in UTC
- Booking times are calculated in the local timezone
- Background jobs respect local time zones

### Special Rules
The system can be extended to support:
- **Weekend vs Weekday Rules**: Different booking times based on day of week
- **Holiday Rules**: Special booking times for holidays
- **Capacity-Based Rules**: Different booking times based on session capacity
- **Age Group Rules**: Different booking times for different age groups

### Business Logic Examples

#### Weekend Sessions Open Later
```typescript
function getBookingOpenTime(session: any): Date {
  const sessionDate = new Date(session.startTime);
  const dayOfWeek = sessionDate.getDay(); // 0 = Sunday, 6 = Saturday
  
  let hour = session.bookingOpenHour ?? 8;
  let minute = session.bookingOpenMinute ?? 0;
  
  // Weekend sessions open at 9 AM instead of 8 AM
  if ((dayOfWeek === 0 || dayOfWeek === 6) && !session.bookingOpenHour) {
    hour = 9;
  }
  
  const bookingOpenTime = new Date(sessionDate);
  bookingOpenTime.setHours(hour, minute, 0, 0);
  return bookingOpenTime;
}
```

#### High-Demand Sessions Open Earlier
```typescript
function getBookingOpenTime(session: any): Date {
  const sessionDate = new Date(session.startTime);
  let hour = session.bookingOpenHour ?? 8;
  
  // Popular age groups open 30 minutes earlier
  if (session.ageGroups.includes('U12') || session.ageGroups.includes('U14')) {
    hour = Math.max(0, hour - 0.5); // 30 minutes earlier
  }
  
  const bookingOpenTime = new Date(sessionDate);
  bookingOpenTime.setHours(hour, session.bookingOpenMinute ?? 0, 0, 0);
  return bookingOpenTime;
}
```

## Monitoring & Analytics

### Booking Time Analytics
Track metrics like:
- Booking conversion rates by opening time
- Peak booking times
- Session fill rates by booking window length

### Admin Dashboard
Display:
- Sessions with custom booking times
- Upcoming booking window openings
- Booking activity by time of day

## Testing Booking Times

### Development Testing
```typescript
// Force a session to open for testing
await storage.updateSessionStatus(sessionId, "open");

// Test different booking times
const testSession = {
  ...session,
  bookingOpenHour: 6, // Opens at 6 AM for testing
  bookingOpenMinute: 30
};
```

### Staging Environment
- Set up test sessions with various booking times
- Verify background job processing
- Test UI state changes at different times

This system provides complete control over when booking becomes available while maintaining the core business rule that sessions are only bookable on the day they occur.