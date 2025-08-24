import { pgTable, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const subscriptions = pgTable("subscriptions", {
id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
tenant_id: varchar("tenant_id", { length: 36 }).notNull(),
stripe_customer_id: varchar("stripe_customer_id", { length: 64 }),
stripe_subscription_id: varchar("stripe_subscription_id", { length: 64 }),
plan_key: varchar("plan_key", { length: 40 }).notNull().default("free"),
status: varchar("status", { length: 40 }).notNull().default("inactive"),
trial_end: timestamp("trial_end"),
current_period_end: timestamp("current_period_end"),
created_at: timestamp("created_at").defaultNow().notNull(),
updated_at: timestamp("updated_at").defaultNow().notNull()
}, t => ({
uniq: uniqueIndex("subscriptions_tenant_idx").on(t.tenant_id),
stripeIdx: index("subscriptions_stripe_idx").on(t.stripe_customer_id)
}));