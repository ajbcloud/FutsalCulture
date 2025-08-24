import { pgTable, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const parent_player_links = pgTable("parent_player_links", {
id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
tenant_id: varchar("tenant_id", { length: 36 }).notNull(),
parent_user_id: varchar("parent_user_id", { length: 36 }).notNull(),
player_user_id: varchar("player_user_id", { length: 36 }).notNull(),
created_at: timestamp("created_at").defaultNow().notNull()
}, t => ({
uniq: uniqueIndex("parent_player_uniq").on(t.tenant_id, t.parent_user_id, t.player_user_id)
}));