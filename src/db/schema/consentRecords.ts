import { pgTable, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const consent_records = pgTable("consent_records", {
id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
tenant_id: varchar("tenant_id", { length: 36 }).notNull(),
child_user_id: varchar("child_user_id", { length: 36 }).notNull(),
parent_user_id: varchar("parent_user_id", { length: 36 }).notNull(),
method: varchar("method", { length: 40 }).notNull(),
policy_version: varchar("policy_version", { length: 20 }).notNull(),
ip: varchar("ip", { length: 64 }),
meta: jsonb("meta"),
created_at: timestamp("created_at").defaultNow().notNull()
}, t => ({
tenantIdx: index("consent_tenant_idx").on(t.tenant_id)
}));