import { pgTable, uuid, boolean, uniqueIndex, index, timestamp } from "drizzle-orm/pg-core";
import { users } from "../../schema";
import { players } from "../../schema";

export const guardianLinks = pgTable("guardian_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentId: uuid("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  playerId: uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  permissionBook: boolean("permission_book").notNull().default(false),
  permissionPay: boolean("permission_pay").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniq: uniqueIndex("guardian_links_parent_player_uniq").on(table.parentId, table.playerId),
  parentIdx: index("guardian_links_parent_idx").on(table.parentId),
  playerIdx: index("guardian_links_player_idx").on(table.playerId),
}));

export type GuardianLink = typeof guardianLinks.$inferSelect;
export type InsertGuardianLink = typeof guardianLinks.$inferInsert;