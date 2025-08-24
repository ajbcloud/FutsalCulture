import { pgTable, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const email_verifications = pgTable("email_verifications", {
id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
user_id: varchar("user_id", { length: 36 }).notNull(),
email: varchar("email", { length: 320 }).notNull(),
token: varchar("token", { length: 64 }).notNull(),
expires_at: timestamp("expires_at").notNull(),
used_at: timestamp("used_at"),
created_at: timestamp("created_at").defaultNow().notNull()
}, t => ({
tokenIdx: uniqueIndex("email_verifications_token_idx").on(t.token)
}));