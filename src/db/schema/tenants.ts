import { pgTable, text, timestamp, varchar, boolean, integer, index, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const tenants = pgTable("tenants", {
id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
name: varchar("name", { length: 160 }).notNull(),
slug: varchar("slug", { length: 160 }).notNull(),
tenant_code: varchar("tenant_code", { length: 16 }).notNull(),
contact_name: varchar("contact_name", { length: 160 }).notNull(),
contact_email: varchar("contact_email", { length: 320 }).notNull(),
city: varchar("city", { length: 100 }),
state: varchar("state", { length: 100 }),
country: varchar("country", { length: 100 }),
status: varchar("status", { length: 24 }).notNull().default("active"),
allowed_domains: jsonb("allowed_domains"),
created_at: timestamp("created_at").defaultNow().notNull()
}, t => ({
slugIdx: uniqueIndex("tenants_slug_idx").on(t.slug),
codeIdx: uniqueIndex("tenants_code_idx").on(t.tenant_code),
emailIdx: index("tenants_contact_email_idx").on(t.contact_email)
}));