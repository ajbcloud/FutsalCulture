import { pgTable, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const tenant_users = pgTable("tenant_users", {
id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
tenant_id: varchar("tenant_id", { length: 36 }).notNull(),
user_id: varchar("user_id", { length: 36 }).notNull(),
role: varchar("role", { length: 40 }).notNull(),
invited_by_user_id: varchar("invited_by_user_id", { length: 36 }),
created_at: timestamp("created_at").defaultNow().notNull()
}, t => ({
uniq: uniqueIndex("tenant_users_uniq").on(t.tenant_id, t.user_id),
roleIdx: index("tenant_users_role_idx").on(t.role)
}));