import { pgTable, serial, integer, text, boolean, index, uuid } from "drizzle-orm/pg-core";
import { tenants } from "../../schema";

export const tenantPolicies = pgTable("tenant_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  region: text("region").notNull().default("US"),
  audienceMode: text("audience_mode").notNull().default("mixed"), // values: adult_only, mixed, youth_only
  parentRequiredBelow: integer("parent_required_below").notNull().default(13),
  teenSelfAccessAt: integer("teen_self_access_at").notNull().default(13),
  adultAge: integer("adult_age").notNull().default(18),
  allowTeenPayments: boolean("allow_teen_payments").notNull().default(false),
  allowSplitPayments: boolean("allow_split_payments").notNull().default(false),
  requireSavedMethodForAdult: boolean("require_saved_method_for_adult").notNull().default(false),
}, (table) => {
  return {
    tenantIdx: index("tenant_policy_tenant_idx").on(table.tenantId),
  };
});

export type TenantPolicy = typeof tenantPolicies.$inferSelect;
export type InsertTenantPolicy = typeof tenantPolicies.$inferInsert;