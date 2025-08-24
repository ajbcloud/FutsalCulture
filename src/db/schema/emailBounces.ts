import { pgTable, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const email_bounces = pgTable("email_bounces", {
id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
email: varchar("email", { length: 320 }).notNull(),
provider: varchar("provider", { length: 40 }).notNull(),
reason: varchar("reason", { length: 200 }),
event: varchar("event", { length: 40 }).notNull(),
created_at: timestamp("created_at").defaultNow().notNull()
}, t => ({
emailIdx: index("email_bounces_email_idx").on(t.email)
}));