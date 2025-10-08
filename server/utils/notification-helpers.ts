import type { IStorage } from "../storage";
import { buildTemplateVariables, type TemplateVariables } from "./template-variables";

/**
 * Fetch invite code variables for a user
 * This helper simplifies including invite code data in notifications
 * 
 * @param storage - Storage instance
 * @param tenantId - Tenant ID
 * @param inviteCodeId - Invite code ID (optional - if known)
 * @returns Invite code variables ready for template replacement
 */
export async function fetchInviteCodeVariables(
  storage: IStorage,
  tenantId: string,
  inviteCodeId?: string | null
): Promise<Partial<TemplateVariables>> {
  try {
    // Fetch tenant's default invite code
    const tenantDefaultCode = await storage.getTenantDefaultCode(tenantId);
    
    // Fetch specific invite code if provided
    let specificInviteCode = null;
    if (inviteCodeId) {
      specificInviteCode = await storage.getInviteCode(inviteCodeId);
    }
    
    // Build and return variables
    const variables = buildTemplateVariables(
      {},
      tenantDefaultCode,
      specificInviteCode
    );
    
    return variables;
  } catch (error) {
    console.error('Error fetching invite code variables:', error);
    return {};
  }
}

/**
 * Build complete notification variables including invite codes
 * 
 * @param baseVariables - Base template variables (parent, player, session, etc.)
 * @param storage - Storage instance
 * @param tenantId - Tenant ID
 * @param inviteCodeId - Invite code ID (optional - if known from user/player record)
 * @returns Complete variables object with invite code data
 */
export async function buildNotificationVariables(
  baseVariables: TemplateVariables,
  storage: IStorage,
  tenantId: string,
  inviteCodeId?: string | null
): Promise<TemplateVariables> {
  // Fetch invite code variables
  const inviteCodeVars = await fetchInviteCodeVariables(storage, tenantId, inviteCodeId);
  
  // Merge with base variables
  return {
    ...baseVariables,
    ...inviteCodeVars
  };
}

/**
 * Example usage in notification sending:
 * 
 * ```typescript
 * // Import the helper
 * import { buildNotificationVariables } from './utils/notification-helpers';
 * import { replaceTemplateVariables } from './utils/template-variables';
 * 
 * // Build variables with invite code data
 * const variables = await buildNotificationVariables(
 *   {
 *     parentName: 'John Doe',
 *     playerName: 'Jane Doe',
 *     sessionDate: '2025-10-15',
 *     sessionTime: '3:00 PM',
 *     organizationName: 'PlayHQ Academy'
 *   },
 *   storage,
 *   tenantId,
 *   userId
 * );
 * 
 * // Replace variables in template
 * const message = replaceTemplateVariables(template, variables);
 * 
 * // Send email/SMS
 * await sendEmail({ to, subject, html: message });
 * ```
 */
