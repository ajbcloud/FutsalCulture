import { db } from "../db/index";
import { audit_events } from "../db/schema/auditEvents";

export async function recordAudit(input: { actor_user_id?: string; tenant_id?: string; event_type: string; target_id?: string; metadata?: any }) {
await db.insert(audit_events).values({
actor_user_id: input.actor_user_id,
tenant_id: input.tenant_id,
event_type: input.event_type,
target_id: input.target_id,
metadata_json: input.metadata
});
}