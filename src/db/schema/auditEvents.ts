import { pgTable, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const audit_events = pgTable("audit_events", {
id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
actor_user_id: varchar("actor_user_id", { length: 36 }),
tenant_id: varchar("tenant_id", { length: 36 }),
event_type: varchar("event_type", { length: 80 }).notNull(),
target_id: varchar("target_id", { length: 64 }),
metadata_json: jsonb("metadata_json"),
created_at: timestamp("created_at").defaultNow().notNull()
}, t => ({
tenantIdx: index("audit_events_tenant_idx").on(t.tenant_id),
typeIdx: index("audit_events_type_idx").on(t.event_type)
}));