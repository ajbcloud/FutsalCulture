import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const consentEvents = pgTable("consent_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  subjectId: uuid("subject_id").notNull(),
  subjectRole: text("subject_role").notNull(), // parent or player
  policyKey: text("policy_key").notNull(), // medical, liability, photo, privacy
  policyVersion: text("policy_version").notNull(),
  acceptedBy: text("accepted_by").notNull(), // user id or email
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("consent_events_tenant_idx").on(table.tenantId),
  subjectIdx: index("consent_events_subject_idx").on(table.subjectId),
  policyIdx: index("consent_events_policy_idx").on(table.policyKey, table.policyVersion),
}));

export type ConsentEvent = typeof consentEvents.$inferSelect;
export type InsertConsentEvent = typeof consentEvents.$inferInsert;