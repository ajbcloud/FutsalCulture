import type { InviteCodeSelect } from "@shared/schema";

/**
 * Template Variable System
 * 
 * This utility provides centralized template variable replacement for email/SMS communications.
 * Variables use the format {{variableName}} and are replaced with actual values.
 */

export interface TemplateVariables {
  // User/Parent variables
  parentName?: string;
  parentFirstName?: string;
  parentEmail?: string;
  parentPhone?: string;
  
  // Player variables
  playerName?: string;
  playerFirstName?: string;
  playerAge?: string;
  
  // Session variables
  sessionDate?: string;
  sessionTime?: string;
  sessionLocation?: string;
  sessionAgeGroup?: string;
  sessionGender?: string;
  
  // Organization variables
  organizationName?: string;
  organizationPhone?: string;
  organizationEmail?: string;
  
  // Financial variables
  creditAmount?: string;
  paymentAmount?: string;
  
  // Waitlist variables
  waitlistPosition?: string;
  paymentWindowHours?: string;
  
  // Invite Code variables
  tenantCode?: string;           // Tenant's default invite code
  inviteCode?: string;           // Specific invite code used by recipient
  codeAgeGroup?: string;         // Age group pre-filled from code
  codeGender?: string;           // Gender pre-filled from code
  codeLocation?: string;         // Location pre-filled from code
  codeClub?: string;             // Club/team pre-filled from code
  
  // Generic variables
  recipientName?: string;
  senderName?: string;
  
  // Custom metadata variables (from invite code metadata JSON)
  [key: string]: string | undefined;
}

/**
 * Replace template variables in a string
 * @param template - Template string with {{variableName}} placeholders
 * @param variables - Object with variable values
 * @returns String with variables replaced
 */
export function replaceTemplateVariables(
  template: string, 
  variables: TemplateVariables
): string {
  if (!template) return '';
  
  let result = template;
  
  // Replace each variable
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    // Replace with value or empty string if undefined/null
    result = result.replace(regex, value || '');
  });
  
  return result;
}

/**
 * Extract invite code variables from an invite code object
 * @param inviteCode - Invite code object from database
 * @returns Object with invite code variables
 */
export function extractInviteCodeVariables(
  inviteCode: InviteCodeSelect | null | undefined
): Partial<TemplateVariables> {
  if (!inviteCode) {
    return {};
  }
  
  const variables: Partial<TemplateVariables> = {
    inviteCode: inviteCode.code,
    codeAgeGroup: inviteCode.ageGroup || undefined,
    codeGender: inviteCode.gender || undefined,
    codeLocation: inviteCode.location || undefined,
    codeClub: inviteCode.club || undefined,
  };
  
  // Add custom metadata variables with code_ prefix
  if (inviteCode.metadata && typeof inviteCode.metadata === 'object') {
    Object.entries(inviteCode.metadata).forEach(([key, value]) => {
      if (typeof value === 'string') {
        variables[`code_${key}`] = value;
      }
    });
  }
  
  return variables;
}

/**
 * Build complete template variables with invite code data
 * @param baseVariables - Base variables (parent, player, session, etc.)
 * @param tenantDefaultCode - Tenant's default invite code
 * @param userInviteCode - User's specific invite code (if they used one)
 * @returns Complete variables object
 */
export function buildTemplateVariables(
  baseVariables: TemplateVariables,
  tenantDefaultCode?: InviteCodeSelect | null,
  userInviteCode?: InviteCodeSelect | null
): TemplateVariables {
  const variables: TemplateVariables = { ...baseVariables };
  
  // Add tenant default code
  if (tenantDefaultCode) {
    variables.tenantCode = tenantDefaultCode.code;
  }
  
  // Add user-specific invite code variables (overrides tenant default)
  const inviteCodeVars = extractInviteCodeVariables(userInviteCode || tenantDefaultCode);
  Object.assign(variables, inviteCodeVars);
  
  return variables;
}

/**
 * List of all available template variables with descriptions
 */
export const TEMPLATE_VARIABLES_DOCUMENTATION = {
  // User/Parent Variables
  parentName: 'Full name of the parent/guardian',
  parentFirstName: 'First name of the parent/guardian',
  parentEmail: 'Email address of the parent/guardian',
  parentPhone: 'Phone number of the parent/guardian',
  
  // Player Variables
  playerName: 'Full name of the player',
  playerFirstName: 'First name of the player',
  playerAge: 'Age of the player',
  
  // Session Variables
  sessionDate: 'Date of the session (formatted)',
  sessionTime: 'Time of the session',
  sessionLocation: 'Location/venue of the session',
  sessionAgeGroup: 'Age group for the session',
  sessionGender: 'Gender category for the session',
  
  // Organization Variables
  organizationName: 'Name of the organization/tenant',
  organizationPhone: 'Organization contact phone number',
  organizationEmail: 'Organization contact email',
  
  // Financial Variables
  creditAmount: 'Credit amount (formatted with currency)',
  paymentAmount: 'Payment amount (formatted with currency)',
  
  // Waitlist Variables
  waitlistPosition: 'Position in the waitlist queue',
  paymentWindowHours: 'Hours available to complete payment after promotion',
  
  // Invite Code Variables
  tenantCode: 'Tenant\'s default invite code',
  inviteCode: 'Specific invite code used by recipient',
  codeAgeGroup: 'Age group pre-filled from invite code',
  codeGender: 'Gender pre-filled from invite code',
  codeLocation: 'Location pre-filled from invite code',
  codeClub: 'Club/team pre-filled from invite code',
  code_customField: 'Custom metadata field from invite code (replace customField with actual field name)',
  
  // Generic Variables
  recipientName: 'Name of the message recipient',
  senderName: 'Name of the message sender',
} as const;

/**
 * Get all available variable names
 */
export function getAvailableVariables(): string[] {
  return Object.keys(TEMPLATE_VARIABLES_DOCUMENTATION);
}

/**
 * Format a variable name for display in templates
 */
export function formatVariableName(variableName: string): string {
  return `{{${variableName}}}`;
}

/**
 * Get variables documentation as markdown
 */
export function getVariablesDocumentation(): string {
  const sections = [
    {
      title: 'User/Parent Variables',
      variables: ['parentName', 'parentFirstName', 'parentEmail', 'parentPhone']
    },
    {
      title: 'Player Variables',
      variables: ['playerName', 'playerFirstName', 'playerAge']
    },
    {
      title: 'Session Variables',
      variables: ['sessionDate', 'sessionTime', 'sessionLocation', 'sessionAgeGroup', 'sessionGender']
    },
    {
      title: 'Organization Variables',
      variables: ['organizationName', 'organizationPhone', 'organizationEmail']
    },
    {
      title: 'Financial Variables',
      variables: ['creditAmount', 'paymentAmount']
    },
    {
      title: 'Waitlist Variables',
      variables: ['waitlistPosition', 'paymentWindowHours']
    },
    {
      title: 'Invite Code Variables',
      variables: ['tenantCode', 'inviteCode', 'codeAgeGroup', 'codeGender', 'codeLocation', 'codeClub', 'code_customField']
    },
    {
      title: 'Generic Variables',
      variables: ['recipientName', 'senderName']
    }
  ];
  
  let markdown = '# Template Variables Reference\n\n';
  markdown += 'Use these variables in your email and SMS templates. Variables are wrapped in double curly braces like {{variableName}}.\n\n';
  
  sections.forEach(section => {
    markdown += `## ${section.title}\n\n`;
    section.variables.forEach(varName => {
      const description = TEMPLATE_VARIABLES_DOCUMENTATION[varName as keyof typeof TEMPLATE_VARIABLES_DOCUMENTATION];
      markdown += `- \`{{${varName}}}\` - ${description}\n`;
    });
    markdown += '\n';
  });
  
  markdown += '## Custom Invite Code Metadata\n\n';
  markdown += 'Invite codes can have custom metadata fields. Access them using `{{code_fieldName}}` where `fieldName` is the metadata key.\n';
  markdown += 'For example, if an invite code has metadata `{"teamName": "Eagles"}`, use `{{code_teamName}}`.\n\n';
  
  markdown += '## Notes\n\n';
  markdown += '- All variables are optional and will be replaced with empty string if not available\n';
  markdown += '- Variables are case-sensitive\n';
  markdown += '- Invite code variables use the user\'s specific code if available, otherwise the tenant\'s default code\n';
  
  return markdown;
}
