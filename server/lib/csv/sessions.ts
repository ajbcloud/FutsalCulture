import { z } from 'zod';

export interface CSVError {
  row: number;
  column: string;
  value: string;
  code: string;
  message: string;
  hint?: string;
}

export interface CSVWarning {
  row: number;
  column: string;
  message: string;
}

export interface CSVValidationResult {
  summary: {
    rows: number;
    errors: number;
    warnings: number;
  };
  errors: CSVError[];
  warnings: CSVWarning[];
  validRows: ParsedSessionRow[];
}

export interface ParsedSessionRow {
  title: string;
  location: string;
  startTime: Date;
  endTime: Date;
  ageGroups: string[];
  genders: 'Boys' | 'Girls' | 'Mixed';
  capacity: number;
  bookingOpenHour?: number;
  bookingOpenMinute?: number;
  hasAccessCode: boolean;
  accessCode?: string;
  waitlistEnabled?: boolean;
  waitlistLimit?: number;
  waitlistOfferMinutes?: number;
  waitlistAutoPromote?: boolean;
  priceCents?: number;
  status: 'open' | 'closed';
  recurring: boolean;
  recurringRule?: string;
}

const REQUIRED_HEADERS = [
  'title', 'location', 'start_time', 'end_time', 'age_groups', 'genders', 'capacity'
];

const ALL_HEADERS = [
  'title', 'location', 'start_time', 'end_time', 'age_groups', 'genders', 'capacity',
  'booking_open_time', 'has_access_code', 'access_code', 'waitlist_enabled',
  'waitlist_limit', 'waitlist_offer_minutes', 'waitlist_auto_promote',
  'price_cents', 'status', 'recurring', 'recurring_rule'
];

const VALID_AGE_GROUPS = ['U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18'];
const VALID_GENDERS = ['Boys', 'Girls', 'Mixed'] as const;
const VALID_STATUSES = ['open', 'closed'] as const;

export function parseSessionsCSV(csvContent: string): CSVValidationResult {
  const lines = csvContent.trim().split('\n');
  const errors: CSVError[] = [];
  const warnings: CSVWarning[] = [];
  const validRows: ParsedSessionRow[] = [];

  if (lines.length === 0) {
    return {
      summary: { rows: 0, errors: 1, warnings: 0 },
      errors: [{ row: 1, column: 'file', value: '', code: 'empty_file', message: 'CSV file is empty' }],
      warnings: [],
      validRows: []
    };
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim());
  
  // Validate headers
  const missingHeaders = REQUIRED_HEADERS.filter(h => !header.includes(h));
  if (missingHeaders.length > 0) {
    return {
      summary: { rows: 0, errors: 1, warnings: 0 },
      errors: [{
        row: 1,
        column: 'headers',
        value: header.join(','),
        code: 'missing_headers',
        message: `Missing required headers: ${missingHeaders.join(', ')}`,
        hint: "Download the template to get correct headers"
      }],
      warnings: [],
      validRows: []
    };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length !== header.length) {
      errors.push({
        row: rowNumber,
        column: 'row',
        value: lines[i],
        code: 'column_count_mismatch',
        message: `Expected ${header.length} columns, got ${values.length}`
      });
      continue;
    }

    const rowData: Record<string, string> = {};
    header.forEach((h, idx) => {
      rowData[h] = values[idx];
    });

    try {
      const parsedRow = parseAndValidateRow(rowData, rowNumber, errors, warnings);
      if (parsedRow) {
        validRows.push(parsedRow);
      }
    } catch (error) {
      errors.push({
        row: rowNumber,
        column: 'row',
        value: lines[i],
        code: 'parse_error',
        message: `Failed to parse row: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  return {
    summary: {
      rows: lines.length - 1, // Exclude header
      errors: errors.length,
      warnings: warnings.length
    },
    errors,
    warnings,
    validRows
  };
}

function parseAndValidateRow(
  row: Record<string, string>,
  rowNumber: number,
  errors: CSVError[],
  warnings: CSVWarning[]
): ParsedSessionRow | null {
  const addError = (column: string, value: string, code: string, message: string, hint?: string) => {
    errors.push({ row: rowNumber, column, value, code, message, hint });
  };

  const addWarning = (column: string, message: string) => {
    warnings.push({ row: rowNumber, column, message });
  };

  // Title validation
  const title = row.title?.trim();
  if (!title) {
    addError('title', row.title || '', 'required', 'Title is required');
    return null;
  }
  if (title.length > 120) {
    addError('title', title, 'too_long', 'Title must be 120 characters or less');
    return null;
  }

  // Location validation
  const location = row.location?.trim();
  if (!location) {
    addError('location', row.location || '', 'required', 'Location is required');
    return null;
  }

  // Date/time validation
  let startTime: Date;
  try {
    if (!row.start_time) {
      addError('start_time', '', 'required', 'Start time is required');
      return null;
    }
    startTime = new Date(row.start_time);
    if (isNaN(startTime.getTime())) {
      addError('start_time', row.start_time, 'invalid_datetime', 'Invalid date format');
      return null;
    }
    if (!row.start_time.includes('T') || (!row.start_time.includes('+') && !row.start_time.includes('-') && !row.start_time.endsWith('Z'))) {
      addError('start_time', row.start_time, 'invalid_datetime_tz', 'Use ISO 8601 with timezone, e.g. 2025-08-29T14:00:00-04:00', "See 'How to format CSV' > Columns & Accepted Values");
      return null;
    }
  } catch (error) {
    addError('start_time', row.start_time, 'invalid_datetime', 'Invalid date format');
    return null;
  }

  let endTime: Date;
  try {
    if (!row.end_time) {
      addError('end_time', '', 'required', 'End time is required');
      return null;
    }
    endTime = new Date(row.end_time);
    if (isNaN(endTime.getTime())) {
      addError('end_time', row.end_time, 'invalid_datetime', 'Invalid date format');
      return null;
    }
    if (!row.end_time.includes('T') || (!row.end_time.includes('+') && !row.end_time.includes('-') && !row.end_time.endsWith('Z'))) {
      addError('end_time', row.end_time, 'invalid_datetime_tz', 'Use ISO 8601 with timezone, e.g. 2025-08-29T15:30:00-04:00', "See 'How to format CSV' > Columns & Accepted Values");
      return null;
    }
    if (endTime <= startTime) {
      addError('end_time', row.end_time, 'invalid_time_order', 'End time must be after start time');
      return null;
    }
  } catch (error) {
    addError('end_time', row.end_time, 'invalid_datetime', 'Invalid date format');
    return null;
  }

  // Age groups validation
  const ageGroupsStr = row.age_groups?.trim();
  if (!ageGroupsStr) {
    addError('age_groups', '', 'required', 'Age groups is required');
    return null;
  }
  const ageGroups = ageGroupsStr.split(';').map(ag => ag.trim()).filter(ag => ag);
  const invalidAgeGroups = ageGroups.filter(ag => !VALID_AGE_GROUPS.includes(ag));
  if (invalidAgeGroups.length > 0) {
    addError('age_groups', ageGroupsStr, 'invalid_age_group', `Invalid age groups: ${invalidAgeGroups.join(', ')}. Allowed values: U9–U18 separated by semicolons.`);
    return null;
  }
  if (ageGroups.length === 0) {
    addError('age_groups', ageGroupsStr, 'no_valid_groups', 'At least one valid age group is required');
    return null;
  }

  // Genders validation
  const genders = row.genders?.trim();
  if (!genders || !VALID_GENDERS.includes(genders as any)) {
    addError('genders', genders || '', 'invalid_gender', 'Must be exactly: Boys, Girls, or Mixed');
    return null;
  }

  // Capacity validation
  const capacityStr = row.capacity?.trim();
  if (!capacityStr) {
    addError('capacity', '', 'required', 'Capacity is required');
    return null;
  }
  const capacity = parseInt(capacityStr);
  if (isNaN(capacity) || capacity <= 0) {
    addError('capacity', capacityStr, 'invalid_number', 'Capacity must be a positive integer');
    return null;
  }

  // Booking open time validation
  let bookingOpenHour: number | undefined;
  let bookingOpenMinute: number | undefined;
  const bookingOpenTime = row.booking_open_time?.trim();
  if (bookingOpenTime) {
    const timeMatch = bookingOpenTime.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
      addError('booking_open_time', bookingOpenTime, 'invalid_time_format', 'Use HH:mm format (e.g., 08:00)');
      return null;
    }
    const hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]);
    if (hour < 6 || hour > 19 || minute < 0 || minute >= 60) {
      addError('booking_open_time', bookingOpenTime, 'invalid_time_range', 'Time must be between 06:00 and 19:00');
      return null;
    }
    bookingOpenHour = hour;
    bookingOpenMinute = minute;
  } else {
    addWarning('booking_open_time', 'Blank value defaulted to tenant setting (08:00)');
  }

  // Access code validation
  const hasAccessCodeStr = row.has_access_code?.trim().toLowerCase();
  const hasAccessCode = hasAccessCodeStr === 'true';
  if (hasAccessCodeStr && !['true', 'false'].includes(hasAccessCodeStr)) {
    addError('has_access_code', row.has_access_code, 'invalid_boolean', 'Must be true or false');
    return null;
  }

  const accessCode = row.access_code?.trim();
  if (hasAccessCode && !accessCode) {
    addError('access_code', '', 'required_when_enabled', 'Access code required when has_access_code=true');
    return null;
  }
  if (accessCode && (accessCode.length < 3 || accessCode.length > 32)) {
    addError('access_code', accessCode, 'invalid_length', 'Access code must be 3-32 characters');
    return null;
  }

  // Waitlist validation
  const waitlistEnabledStr = row.waitlist_enabled?.trim().toLowerCase();
  let waitlistEnabled: boolean | undefined;
  if (waitlistEnabledStr) {
    if (!['true', 'false'].includes(waitlistEnabledStr)) {
      addError('waitlist_enabled', row.waitlist_enabled, 'invalid_boolean', 'Must be true or false');
      return null;
    }
    waitlistEnabled = waitlistEnabledStr === 'true';
  }

  let waitlistLimit: number | undefined;
  const waitlistLimitStr = row.waitlist_limit?.trim();
  if (waitlistLimitStr) {
    waitlistLimit = parseInt(waitlistLimitStr);
    if (isNaN(waitlistLimit) || waitlistLimit <= 0) {
      addError('waitlist_limit', waitlistLimitStr, 'invalid_number', 'Waitlist limit must be a positive integer');
      return null;
    }
  }

  let waitlistOfferMinutes: number | undefined;
  const waitlistOfferMinutesStr = row.waitlist_offer_minutes?.trim();
  if (waitlistOfferMinutesStr) {
    waitlistOfferMinutes = parseInt(waitlistOfferMinutesStr);
    if (isNaN(waitlistOfferMinutes) || waitlistOfferMinutes <= 0) {
      addError('waitlist_offer_minutes', waitlistOfferMinutesStr, 'invalid_number', 'Waitlist offer minutes must be a positive integer');
      return null;
    }
  }

  const waitlistAutoPromoteStr = row.waitlist_auto_promote?.trim().toLowerCase();
  let waitlistAutoPromote: boolean | undefined;
  if (waitlistAutoPromoteStr) {
    if (!['true', 'false'].includes(waitlistAutoPromoteStr)) {
      addError('waitlist_auto_promote', row.waitlist_auto_promote, 'invalid_boolean', 'Must be true or false');
      return null;
    }
    waitlistAutoPromote = waitlistAutoPromoteStr === 'true';
  }

  // Price validation
  let priceCents: number | undefined;
  const priceCentsStr = row.price_cents?.trim();
  if (priceCentsStr) {
    priceCents = parseInt(priceCentsStr);
    if (isNaN(priceCents) || priceCents < 0) {
      addError('price_cents', priceCentsStr, 'invalid_number', 'Price must be a non-negative integer');
      return null;
    }
  }

  // Status validation
  let status: 'open' | 'closed' = 'open';
  const statusStr = row.status?.trim();
  if (statusStr) {
    if (!VALID_STATUSES.includes(statusStr as any)) {
      addError('status', statusStr, 'invalid_status', 'Status must be: open or closed');
      return null;
    }
    status = statusStr as 'open' | 'closed';
  }

  // Recurring validation
  const recurringStr = row.recurring?.trim().toLowerCase();
  let recurring = false;
  if (recurringStr) {
    if (!['true', 'false'].includes(recurringStr)) {
      addError('recurring', row.recurring, 'invalid_boolean', 'Must be true or false');
      return null;
    }
    recurring = recurringStr === 'true';
  }

  const recurringRule = row.recurring_rule?.trim();
  if (recurring && !recurringRule) {
    addError('recurring_rule', '', 'required_when_recurring', 'Recurring rule required when recurring=true');
    return null;
  }
  if (!recurring && recurringRule) {
    addWarning('recurring_rule', 'Recurring rule ignored when recurring=false');
  }

  // Basic RRULE validation
  if (recurringRule && recurring) {
    if (!recurringRule.includes('FREQ=')) {
      addError('recurring_rule', recurringRule, 'invalid_rrule', 'RRULE must include FREQ (e.g., FREQ=WEEKLY)');
      return null;
    }
    if (!recurringRule.includes('COUNT=') && !recurringRule.includes('UNTIL=')) {
      addError('recurring_rule', recurringRule, 'invalid_rrule', 'RRULE must include COUNT or UNTIL');
      return null;
    }
  }

  return {
    title,
    location,
    startTime,
    endTime,
    ageGroups,
    genders: genders as 'Boys' | 'Girls' | 'Mixed',
    capacity,
    bookingOpenHour,
    bookingOpenMinute,
    hasAccessCode,
    accessCode,
    waitlistEnabled,
    waitlistLimit,
    waitlistOfferMinutes,
    waitlistAutoPromote,
    priceCents,
    status,
    recurring,
    recurringRule
  };
}

export function generateErrorsCSV(errors: CSVError[]): string {
  const header = 'row,column,value,code,message\n';
  const rows = errors.map(error => {
    const value = error.value.replace(/"/g, '""'); // Escape quotes
    return `${error.row},"${error.column}","${value}","${error.code}","${error.message}"`;
  }).join('\n');
  
  return header + rows;
}