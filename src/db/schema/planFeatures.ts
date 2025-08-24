import { pgTable, varchar, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const plan_features = pgTable("plan_features", {
plan_key: varchar("plan_key", { length: 40 }).notNull(),
feature_key: varchar("feature_key", { length: 80 }).notNull(),
enabled: boolean("enabled").notNull().default(true),
limits_json: jsonb("limits_json")
}, t => ({
uniq: uniqueIndex("plan_features_uniq").on(t.plan_key, t.feature_key)
}));