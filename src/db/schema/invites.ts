import { pgTable, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const invites = pgTable("invites", {
id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
tenant_id: varchar("tenant_id", { length: 36 }).notNull(),
email: varchar("email", { length: 320 }).notNull(),
role: varchar("role", { length: 40 }).notNull(),
token: varchar("token", { length: 64 }).notNull(),
expires_at: timestamp("expires_at").notNull(),
used_at: timestamp("used_at"),
invited_by_user_id: varchar("invited_by_user_id", { length: 36 }),
channel: varchar("channel", { length: 20 }).default("email"),
created_at: timestamp("created_at").defaultNow().notNull()
}, t => ({
tokenIdx: uniqueIndex("invites_token_idx").on(t.token),
tenantEmailIdx: index("invites_tenant_email_idx").on(t.tenant_id, t.email)
}));