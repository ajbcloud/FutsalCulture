import { pgTable, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const user_policy_acceptances = pgTable("user_policy_acceptances", {
id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
user_id: varchar("user_id", { length: 36 }).notNull(),
policy_type: varchar("policy_type", { length: 40 }).notNull(),
version: varchar("version", { length: 20 }).notNull(),
ip: varchar("ip", { length: 64 }),
created_at: timestamp("created_at").defaultNow().notNull()
}, t => ({
userIdx: index("upa_user_idx").on(t.user_id)
}));