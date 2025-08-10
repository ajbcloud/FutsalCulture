import { sql } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
  check,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Plan level enum for feature flags (must be declared before tenants table)
export const planLevelEnum = pgEnum("plan_level", ["core", "growth", "elite"]);

// Registration status enum
export const registrationStatusEnum = pgEnum("registration_status", ["pending", "approved", "rejected"]);

// Integration provider enum
export const integrationProviderEnum = pgEnum("integration_provider", [
  "twilio", "sendgrid", "google", "microsoft", "stripe", "zoom", "calendar", "mailchimp", "quickbooks", "braintree"
]);

// Waitlist offer status enum
export const waitlistOfferStatusEnum = pgEnum("waitlist_offer_status", ["none", "offered", "accepted", "expired"]);

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Tenants table for multi-tenant architecture
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subdomain: varchar("subdomain").unique().notNull(),
  planLevel: planLevelEnum("plan_level").default("core"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
});



// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  avatarColor: varchar("avatar_color").default("#2563eb"), // Custom avatar background color
  avatarTextColor: varchar("avatar_text_color"), // Custom avatar text color (null = auto-contrast)
  phone: varchar("phone"),
  isAdmin: boolean("is_admin").default(false),
  isAssistant: boolean("is_assistant").default(false),
  isSuperAdmin: boolean("is_super_admin").default(false), // New Super-Admin role
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: varchar("two_factor_secret"),
  customerId: varchar("customer_id"),
  // Registration approval system
  isApproved: boolean("is_approved").default(false),
  registrationStatus: registrationStatusEnum("registration_status").default("pending"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"), // admin user id
  rejectedAt: timestamp("rejected_at"),
  rejectedBy: varchar("rejected_by"), // admin user id
  rejectionReason: text("rejection_reason"),
  // Parent 2 invite tracking
  parent2InviteSentVia: varchar("parent2_invite_sent_via"), // 'email' or 'sms'
  parent2InvitedAt: timestamp("parent2_invited_at"),
  parent2InviteEmail: varchar("parent2_invite_email"),
  parent2InvitePhone: varchar("parent2_invite_phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("users_tenant_id_idx").on(table.tenantId),
]);

// Gender enum for players and sessions
export const genderEnum = pgEnum("gender", ["boys", "girls"]);

// Players table  
export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  avatarColor: varchar("avatar_color").default("#10b981"), // Custom avatar background color for players
  avatarTextColor: varchar("avatar_text_color"), // Custom avatar text color (null = auto-contrast)
  birthYear: integer("birth_year").notNull(),
  gender: genderEnum("gender").notNull(),
  parentId: varchar("parent_id").notNull(),
  parent2Id: varchar("parent2_id"), // Second parent support
  soccerClub: varchar("soccer_club"), // Soccer club affiliation
  canAccessPortal: boolean("can_access_portal").default(false),
  canBookAndPay: boolean("can_book_and_pay").default(false),
  inviteSentVia: varchar("invite_sent_via"), // 'email' or 'sms'
  invitedAt: timestamp("invited_at"),
  userAccountCreated: boolean("user_account_created").default(false),
  email: varchar("email"),
  phoneNumber: varchar("phone_number"),
  // Registration approval for player accounts
  isApproved: boolean("is_approved").default(false),
  registrationStatus: registrationStatusEnum("registration_status").default("pending"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"), // admin user id
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Age validation constraint: Portal access only for players 13+
  check("age_portal_check", sql`(can_access_portal = false OR (2025 - birth_year) >= 13)`),
  index("players_tenant_id_idx").on(table.tenantId),
]);

// Sessions table
export const sessionsEnum = pgEnum("session_status", ["upcoming", "open", "full", "closed"]);

export const futsalSessions = pgTable("futsal_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  title: varchar("title").notNull(),
  location: varchar("location").notNull(), // Keep for compatibility
  // Structured location fields
  locationName: text("location_name"), // Human-readable name
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").default("US"),
  lat: text("lat"), // Using text to store decimal precision
  lng: text("lng"), // Using text to store decimal precision
  gmapsPlaceId: text("gmaps_place_id"),
  ageGroups: text("age_groups").array().notNull(),
  genders: text("genders").array().notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  capacity: integer("capacity").notNull().default(12),
  priceCents: integer("price_cents").notNull().default(1000),
  status: sessionsEnum("status").notNull().default("upcoming"),
  bookingOpenHour: integer("booking_open_hour").default(8), // Hour when booking opens (0-23)
  bookingOpenMinute: integer("booking_open_minute").default(0), // Minute when booking opens (0-59)
  // Access code protection
  hasAccessCode: boolean("has_access_code").default(false),
  accessCode: varchar("access_code"), // The actual code needed to book
  // Waitlist settings
  waitlistEnabled: boolean("waitlist_enabled").default(true),
  waitlistLimit: integer("waitlist_limit"), // NULL = no limit
  paymentWindowMinutes: integer("payment_window_minutes").default(60),
  autoPromote: boolean("auto_promote").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("futsal_sessions_tenant_id_idx").on(table.tenantId),
]);

// Signups table
export const signups = pgTable("signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  playerId: varchar("player_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  paid: boolean("paid").default(false),
  paymentIntentId: varchar("payment_intent_id"),
  // Discount code tracking
  discountCodeId: varchar("discount_code_id"),
  discountCodeApplied: varchar("discount_code_applied"), // The actual code used
  discountAmountCents: integer("discount_amount_cents"), // Amount discounted
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("signups_tenant_id_idx").on(table.tenantId),
]);

// Waitlist status enum
export const waitlistStatusEnum = pgEnum("waitlist_status", ["active", "offered", "accepted", "removed", "expired"]);

// Waitlists table
export const waitlists = pgTable("waitlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  sessionId: varchar("session_id").notNull().references(() => futsalSessions.id),
  playerId: varchar("player_id").notNull().references(() => players.id),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  position: integer("position").notNull(), // 1-based position
  status: waitlistStatusEnum("status").notNull().default("active"),
  offerStatus: waitlistOfferStatusEnum("offer_status").notNull().default("none"),
  notifyOnJoin: boolean("notify_on_join").default(true),
  notifyOnPositionChange: boolean("notify_on_position_change").default(false),
  offerExpiresAt: timestamp("offer_expires_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  index("waitlists_tenant_id_idx").on(table.tenantId),
  index("waitlists_session_id_idx").on(table.sessionId),
  index("waitlists_tenant_status_idx").on(table.tenantId, table.status),
  index("waitlists_tenant_offer_expires_idx").on(table.tenantId, table.offerExpiresAt),
  uniqueIndex("waitlists_session_player_unique_idx").on(table.sessionId, table.playerId),
]);

// Payments table
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "refunded"]);

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  signupId: varchar("signup_id").notNull(),
  paymentIntentId: varchar("payment_intent_id"),
  amountCents: integer("amount_cents").notNull(),
  status: paymentStatusEnum("status").default("paid"),
  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  refundReason: text("refund_reason"),
  refundedBy: varchar("refunded_by"), // admin user ID who performed the refund
  adminNotes: text("admin_notes"), // admin notes on payment actions
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("payments_tenant_id_idx").on(table.tenantId),
]);

// Help requests table
export const helpRequests = pgTable("help_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  status: varchar("status").notNull().default("open"),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(), 
  phone: varchar("phone"),
  email: varchar("email").notNull(),
  subject: varchar("subject").notNull(),
  category: varchar("category").notNull(),
  priority: varchar("priority").notNull().default("medium"),
  message: text("message").notNull(),
  source: varchar("source").notNull().default("main_page"), // 'main_page', 'parent_portal', 'player_portal'
  resolved: boolean("resolved").default(false),
  resolvedBy: varchar("resolved_by"), // admin user ID who resolved the issue
  resolutionNote: text("resolution_note"), // detailed explanation of resolution
  resolvedAt: timestamp("resolved_at"), // when the issue was resolved
  replyHistory: jsonb("reply_history").$type<Array<{
    message: string;
    repliedBy: string;
    repliedAt: string;
  }>>().default([]), // Array of reply objects
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("help_requests_tenant_id_idx").on(table.tenantId),
]);

// Notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  parentId: varchar("parent_id").notNull().unique(),
  email: boolean("email").default(true),
  sms: boolean("sms").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("notification_preferences_tenant_id_idx").on(table.tenantId),
]);

// System settings table - can be tenant-specific or global (null tenant_id)
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id), // null for global settings
  key: varchar("key").notNull(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by"), // admin user id
}, (table) => [
  index("system_settings_tenant_id_idx").on(table.tenantId),
  uniqueIndex("system_settings_tenant_key_unique_idx").on(table.tenantId, table.key),
]);

// Integrations table for third-party service configuration
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id), // null for global integrations
  provider: integrationProviderEnum("provider").notNull(),
  credentials: jsonb("credentials").notNull(), // Store encrypted credentials
  enabled: boolean("enabled").default(false),
  configuredBy: varchar("configured_by"), // admin user id
  lastTestedAt: timestamp("last_tested_at"),
  testStatus: varchar("test_status"), // 'success', 'failure', 'pending'
  testErrorMessage: text("test_error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("integrations_tenant_id_idx").on(table.tenantId),
]);

// Discount codes table
export const discountCodes = pgTable("discount_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  code: varchar("code").notNull(),
  description: text("description"),
  // Discount type - 'percentage' or 'fixed' or 'full'
  discountType: varchar("discount_type").notNull().default('full'),
  discountValue: integer("discount_value"), // percentage (0-100) or cents amount
  // Usage limits
  maxUses: integer("max_uses"), // null = unlimited
  currentUses: integer("current_uses").default(0),
  // Time limits
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  // Status
  isActive: boolean("is_active").default(true),
  // User restrictions
  lockedToPlayerId: varchar("locked_to_player_id").references(() => players.id), // null = not locked to specific player
  lockedToParentId: varchar("locked_to_parent_id").references(() => users.id), // null = not locked to specific parent
  createdBy: varchar("created_by"), // admin user id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("discount_codes_tenant_id_idx").on(table.tenantId),
  index("discount_codes_locked_to_player_idx").on(table.lockedToPlayerId),
  index("discount_codes_locked_to_parent_idx").on(table.lockedToParentId),
]);

// Service billing table for platform service payment configuration
export const serviceBilling = pgTable("service_billing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  organizationName: varchar("organization_name").notNull(),
  contactEmail: varchar("contact_email").notNull(),
  billingEmail: varchar("billing_email").notNull(),
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  postalCode: varchar("postal_code"),
  country: varchar("country").default('United States'),
  taxId: varchar("tax_id"), // EIN, VAT number, etc.
  billingFrequency: varchar("billing_frequency").notNull().default('monthly'), // 'monthly', 'quarterly', 'annually'
  paymentMethod: varchar("payment_method").notNull().default('invoice'), // 'invoice', 'credit_card', 'ach', 'wire'
  creditCardToken: varchar("credit_card_token"), // Encrypted card token from payment processor
  achAccountInfo: jsonb("ach_account_info"), // Encrypted ACH details
  preferredInvoiceDay: integer("preferred_invoice_day").default(1), // Day of month for billing
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  configuredBy: varchar("configured_by"), // admin user id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("service_billing_tenant_id_idx").on(table.tenantId),
]);

// Feature flags table for plan-based access control
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planLevel: planLevelEnum("plan_level").notNull(),
  featureKey: varchar("feature_key").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("feature_flags_plan_feature_idx").on(table.planLevel, table.featureKey),
]);

// Theme settings table for Elite plan custom colors and themes
export const themeSettings = pgTable("theme_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id).unique(),
  
  // Light mode colors
  lightPrimaryButton: varchar("light_primary_button").default("#2563eb"), // Default blue
  lightSecondaryButton: varchar("light_secondary_button").default("#64748b"), // Default gray
  lightBackground: varchar("light_background").default("#ffffff"), // Default white
  lightText: varchar("light_text").default("#111827"), // Default dark text
  lightHeadingColor: varchar("light_heading_color").default("#111827"), // Default dark for headings
  lightDescriptionColor: varchar("light_description_color").default("#4b5563"), // Default medium gray
  lightNavTitle: varchar("light_nav_title").default("#111827"), // Navigation title color (Admin Portal)
  lightNavText: varchar("light_nav_text").default("#6b7280"), // Navigation text color
  lightNavActiveText: varchar("light_nav_active_text").default("#ffffff"), // Active navigation text
  lightNavActiveBg: varchar("light_nav_active_bg").default("#2563eb"), // Active navigation background
  
  // Dark mode colors
  darkPrimaryButton: varchar("dark_primary_button").default("#2563eb"), // Default blue (same as light)
  darkSecondaryButton: varchar("dark_secondary_button").default("#64748b"), // Default gray
  darkBackground: varchar("dark_background").default("#0f172a"), // Default dark background
  darkText: varchar("dark_text").default("#f8fafc"), // Default light text
  darkHeadingColor: varchar("dark_heading_color").default("#f8fafc"), // Default light for headings
  darkDescriptionColor: varchar("dark_description_color").default("#cbd5e1"), // Default light gray
  darkNavTitle: varchar("dark_nav_title").default("#f8fafc"), // Navigation title color (Admin Portal)
  darkNavText: varchar("dark_nav_text").default("#cbd5e1"), // Navigation text color
  darkNavActiveText: varchar("dark_nav_active_text").default("#ffffff"), // Active navigation text
  darkNavActiveBg: varchar("dark_nav_active_bg").default("#2563eb"), // Active navigation background
  
  // Legacy fields for backward compatibility (deprecated)
  primaryButton: varchar("primary_button").default("#2563eb"),
  secondaryButton: varchar("secondary_button").default("#64748b"),
  background: varchar("background").default("#ffffff"),
  text: varchar("text").default("#1f2937"),
  headingColor: varchar("heading_color").default("#111827"),
  descriptionColor: varchar("description_color").default("#6b7280"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("theme_settings_tenant_id_idx").on(table.tenantId),
]);

// Feature request status enum
export const featureRequestStatusEnum = pgEnum("feature_request_status", [
  "received", "under_review", "approved", "in_development", "released"
]);

// Feature requests table for Elite plan custom feature request queue
export const featureRequests = pgTable("feature_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  status: featureRequestStatusEnum("status").notNull().default("received"),
  submittedBy: varchar("submitted_by").notNull().references(() => users.id),
  reviewedBy: varchar("reviewed_by"), // Super admin who reviewed
  statusNotes: text("status_notes"), // Notes about status changes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("feature_requests_tenant_id_idx").on(table.tenantId),
  index("feature_requests_status_idx").on(table.status),
]);

// Player Development Tables (Elite-only feature)

// Development skill categories (Technical, Tactical, Physical, Psychological)
export const devSkillCategories = pgTable("dev_skill_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name").notNull(), // e.g., "Technical", "Tactical", "Physical", "Psychological"
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("dev_skill_categories_tenant_id_idx").on(table.tenantId),
  index("dev_skill_categories_sort_order_idx").on(table.sortOrder),
]);

// Individual skills within categories
export const devSkills = pgTable("dev_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  categoryId: varchar("category_id").notNull().references(() => devSkillCategories.id),
  name: varchar("name").notNull(),
  description: text("description"),
  sport: varchar("sport"), // nullable for sport-specific skills
  ageBand: varchar("age_band"), // U8, U9, U10, etc.
  sortOrder: integer("sort_order").notNull().default(0),
  status: varchar("status").notNull().default("active"), // active, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("dev_skills_tenant_id_idx").on(table.tenantId),
  index("dev_skills_category_id_idx").on(table.categoryId),
  index("dev_skills_age_band_idx").on(table.ageBand),
  index("dev_skills_status_idx").on(table.status),
]);

// 1-5 level rubrics for each skill
export const devSkillRubrics = pgTable("dev_skill_rubrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  skillId: varchar("skill_id").notNull().references(() => devSkills.id),
  level: integer("level").notNull(), // 1-5
  label: varchar("label").notNull(), // e.g., "Foundation", "Emerging", "Developing", "Proficient", "Mastery"
  descriptor: text("descriptor").notNull(), // rubric description for this level
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("dev_skill_rubrics_tenant_id_idx").on(table.tenantId),
  index("dev_skill_rubrics_skill_id_idx").on(table.skillId),
  uniqueIndex("dev_skill_rubrics_skill_level_idx").on(table.skillId, table.level),
]);

// Player assessments (header record)
export const playerAssessments = pgTable("player_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  playerId: varchar("player_id").notNull().references(() => players.id),
  assessedBy: varchar("assessed_by").notNull().references(() => users.id), // coach/admin who did assessment
  sessionId: varchar("session_id").references(() => futsalSessions.id), // optional - if assessed during a session
  assessmentDate: timestamp("assessment_date").notNull(),
  overallComment: text("overall_comment"),
  visibility: varchar("visibility").notNull().default("private"), // "private", "share_with_parent"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("player_assessments_tenant_id_idx").on(table.tenantId),
  index("player_assessments_player_id_idx").on(table.playerId),
  index("player_assessments_assessed_by_idx").on(table.assessedBy),
  index("player_assessments_assessment_date_idx").on(table.assessmentDate),
]);

// Individual skill ratings within an assessment
export const playerAssessmentItems = pgTable("player_assessment_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  assessmentId: varchar("assessment_id").notNull().references(() => playerAssessments.id),
  skillId: varchar("skill_id").notNull().references(() => devSkills.id),
  level: integer("level").notNull(), // 1-5 rating
  comment: text("comment"), // optional comment for this skill
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("player_assessment_items_tenant_id_idx").on(table.tenantId),
  index("player_assessment_items_assessment_id_idx").on(table.assessmentId),
  index("player_assessment_items_skill_id_idx").on(table.skillId),
  uniqueIndex("player_assessment_items_assessment_skill_idx").on(table.assessmentId, table.skillId),
]);

// Player goals and objectives
export const playerGoals = pgTable("player_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  playerId: varchar("player_id").notNull().references(() => players.id),
  createdBy: varchar("created_by").notNull().references(() => users.id), // coach/admin who created goal
  title: varchar("title").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  status: varchar("status").notNull().default("active"), // "active", "achieved", "archived"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("player_goals_tenant_id_idx").on(table.tenantId),
  index("player_goals_player_id_idx").on(table.playerId),
  index("player_goals_created_by_idx").on(table.createdBy),
  index("player_goals_status_idx").on(table.status),
]);

// Progress updates on goals
export const playerGoalUpdates = pgTable("player_goal_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  goalId: varchar("goal_id").notNull().references(() => playerGoals.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  note: text("note").notNull(),
  progressPercent: integer("progress_percent").notNull().default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("player_goal_updates_tenant_id_idx").on(table.tenantId),
  index("player_goal_updates_goal_id_idx").on(table.goalId),
  index("player_goal_updates_created_at_idx").on(table.createdAt),
]);

// Training plans for players
export const trainingPlans = pgTable("training_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  playerId: varchar("player_id").references(() => players.id), // nullable if it's a team plan
  createdBy: varchar("created_by").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("training_plans_tenant_id_idx").on(table.tenantId),
  index("training_plans_player_id_idx").on(table.playerId),
  index("training_plans_created_by_idx").on(table.createdBy),
]);

// Individual items/drills within training plans
export const trainingPlanItems = pgTable("training_plan_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  planId: varchar("plan_id").notNull().references(() => trainingPlans.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  drillId: varchar("drill_id").references(() => drillsLibrary.id), // nullable for custom text
  customText: text("custom_text"), // if no drill selected
  durationMinutes: integer("duration_minutes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("training_plan_items_tenant_id_idx").on(table.tenantId),
  index("training_plan_items_plan_id_idx").on(table.planId),
  index("training_plan_items_day_of_week_idx").on(table.dayOfWeek),
]);

// Library of reusable drills
export const drillsLibrary = pgTable("drills_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  title: varchar("title").notNull(),
  objective: text("objective"),
  equipment: text("equipment"), // list of required equipment
  steps: text("steps").notNull(), // detailed instructions (could be JSON)
  videoUrl: varchar("video_url"), // optional video demonstration
  tags: varchar("tags").array(), // searchable tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("drills_library_tenant_id_idx").on(table.tenantId),
  index("drills_library_title_idx").on(table.title),
]);

// Attendance snapshots for development tracking
export const attendanceSnapshots = pgTable("attendance_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  playerId: varchar("player_id").notNull().references(() => players.id),
  sessionId: varchar("session_id").notNull().references(() => futsalSessions.id),
  attended: boolean("attended").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("attendance_snapshots_tenant_id_idx").on(table.tenantId),
  index("attendance_snapshots_player_id_idx").on(table.playerId),
  index("attendance_snapshots_session_id_idx").on(table.sessionId),
  uniqueIndex("attendance_snapshots_player_session_idx").on(table.playerId, table.sessionId),
]);

// Development achievements/badges
export const devAchievements = pgTable("dev_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  playerId: varchar("player_id").notNull().references(() => players.id),
  badgeKey: varchar("badge_key").notNull(), // unique identifier for badge type
  title: varchar("title").notNull(),
  description: text("description"),
  awardedAt: timestamp("awarded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("dev_achievements_tenant_id_idx").on(table.tenantId),
  index("dev_achievements_player_id_idx").on(table.playerId),
  index("dev_achievements_awarded_at_idx").on(table.awardedAt),
]);

// Progression snapshots for tracking development over time
export const progressionSnapshots = pgTable("progression_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  playerId: varchar("player_id").notNull().references(() => players.id),
  snapshotDate: timestamp("snapshot_date").notNull(),
  skillId: varchar("skill_id").references(() => devSkills.id), // nullable for aggregate snapshots
  aggregateLevel: numeric("aggregate_level", { precision: 3, scale: 2 }), // average across skills
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("progression_snapshots_tenant_id_idx").on(table.tenantId),
  index("progression_snapshots_player_id_idx").on(table.playerId),
  index("progression_snapshots_snapshot_date_idx").on(table.snapshotDate),
]);

// Relations
export const tenantsRelations = relations(tenants, ({ many, one }) => ({
  users: many(users),
  players: many(players),
  futsalSessions: many(futsalSessions),
  signups: many(signups),
  payments: many(payments),
  helpRequests: many(helpRequests),
  notificationPreferences: many(notificationPreferences),
  systemSettings: many(systemSettings),
  integrations: many(integrations),
  discountCodes: many(discountCodes),
  serviceBilling: many(serviceBilling),
  themeSettings: one(themeSettings),
  featureRequests: many(featureRequests),
  // Player Development relations
  devSkillCategories: many(devSkillCategories),
  devSkills: many(devSkills),
  devSkillRubrics: many(devSkillRubrics),
  playerAssessments: many(playerAssessments),
  playerAssessmentItems: many(playerAssessmentItems),
  playerGoals: many(playerGoals),
  playerGoalUpdates: many(playerGoalUpdates),
  trainingPlans: many(trainingPlans),
  trainingPlanItems: many(trainingPlanItems),
  drillsLibrary: many(drillsLibrary),
  attendanceSnapshots: many(attendanceSnapshots),
  devAchievements: many(devAchievements),
  progressionSnapshots: many(progressionSnapshots),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  players: many(players),
  notificationPreferences: one(notificationPreferences),
  featureRequests: many(featureRequests),
  // Player Development relations
  playerAssessments: many(playerAssessments),
  playerGoals: many(playerGoals),
  playerGoalUpdates: many(playerGoalUpdates),
  trainingPlans: many(trainingPlans),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  parent: one(users, {
    fields: [players.parentId],
    references: [users.id],
  }),
  signups: many(signups),
  waitlists: many(waitlists),
  // Player Development relations
  playerAssessments: many(playerAssessments),
  playerGoals: many(playerGoals),
  trainingPlans: many(trainingPlans),
  attendanceSnapshots: many(attendanceSnapshots),
  devAchievements: many(devAchievements),
  progressionSnapshots: many(progressionSnapshots),
}));

export const futsalSessionsRelations = relations(futsalSessions, ({ many }) => ({
  signups: many(signups),
  waitlists: many(waitlists),
  playerAssessments: many(playerAssessments),
  attendanceSnapshots: many(attendanceSnapshots),
}));

export const signupsRelations = relations(signups, ({ one, many }) => ({
  player: one(players, {
    fields: [signups.playerId],
    references: [players.id],
  }),
  session: one(futsalSessions, {
    fields: [signups.sessionId],
    references: [futsalSessions.id],
  }),
  payments: many(payments),
  discountCode: one(discountCodes, {
    fields: [signups.discountCodeId],
    references: [discountCodes.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  signup: one(signups, {
    fields: [payments.signupId],
    references: [signups.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  parent: one(users, {
    fields: [notificationPreferences.parentId],
    references: [users.id],
  }),
}));

export const discountCodesRelations = relations(discountCodes, ({ many }) => ({
  signups: many(signups),
}));

export const waitlistsRelations = relations(waitlists, ({ one }) => ({
  session: one(futsalSessions, {
    fields: [waitlists.sessionId],
    references: [futsalSessions.id],
  }),
  player: one(players, {
    fields: [waitlists.playerId],
    references: [players.id],
  }),
  parent: one(users, {
    fields: [waitlists.parentId],
    references: [users.id],
  }),
}));

export const themeSettingsRelations = relations(themeSettings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [themeSettings.tenantId],
    references: [tenants.id],
  }),
}));

export const featureRequestsRelations = relations(featureRequests, ({ one }) => ({
  tenant: one(tenants, {
    fields: [featureRequests.tenantId],
    references: [tenants.id],
  }),
  submittedBy: one(users, {
    fields: [featureRequests.submittedBy],
    references: [users.id],
  }),
}));

// Player Development Relations
export const devSkillCategoriesRelations = relations(devSkillCategories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [devSkillCategories.tenantId],
    references: [tenants.id],
  }),
  skills: many(devSkills),
}));

export const devSkillsRelations = relations(devSkills, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [devSkills.tenantId],
    references: [tenants.id],
  }),
  category: one(devSkillCategories, {
    fields: [devSkills.categoryId],
    references: [devSkillCategories.id],
  }),
  rubrics: many(devSkillRubrics),
  assessmentItems: many(playerAssessmentItems),
  progressionSnapshots: many(progressionSnapshots),
}));

export const devSkillRubricsRelations = relations(devSkillRubrics, ({ one }) => ({
  tenant: one(tenants, {
    fields: [devSkillRubrics.tenantId],
    references: [tenants.id],
  }),
  skill: one(devSkills, {
    fields: [devSkillRubrics.skillId],
    references: [devSkills.id],
  }),
}));

export const playerAssessmentsRelations = relations(playerAssessments, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [playerAssessments.tenantId],
    references: [tenants.id],
  }),
  player: one(players, {
    fields: [playerAssessments.playerId],
    references: [players.id],
  }),
  assessedBy: one(users, {
    fields: [playerAssessments.assessedBy],
    references: [users.id],
  }),
  session: one(futsalSessions, {
    fields: [playerAssessments.sessionId],
    references: [futsalSessions.id],
  }),
  items: many(playerAssessmentItems),
}));

export const playerAssessmentItemsRelations = relations(playerAssessmentItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [playerAssessmentItems.tenantId],
    references: [tenants.id],
  }),
  assessment: one(playerAssessments, {
    fields: [playerAssessmentItems.assessmentId],
    references: [playerAssessments.id],
  }),
  skill: one(devSkills, {
    fields: [playerAssessmentItems.skillId],
    references: [devSkills.id],
  }),
}));

export const playerGoalsRelations = relations(playerGoals, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [playerGoals.tenantId],
    references: [tenants.id],
  }),
  player: one(players, {
    fields: [playerGoals.playerId],
    references: [players.id],
  }),
  createdBy: one(users, {
    fields: [playerGoals.createdBy],
    references: [users.id],
  }),
  updates: many(playerGoalUpdates),
}));

export const playerGoalUpdatesRelations = relations(playerGoalUpdates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [playerGoalUpdates.tenantId],
    references: [tenants.id],
  }),
  goal: one(playerGoals, {
    fields: [playerGoalUpdates.goalId],
    references: [playerGoals.id],
  }),
  createdBy: one(users, {
    fields: [playerGoalUpdates.createdBy],
    references: [users.id],
  }),
}));

export const trainingPlansRelations = relations(trainingPlans, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [trainingPlans.tenantId],
    references: [tenants.id],
  }),
  player: one(players, {
    fields: [trainingPlans.playerId],
    references: [players.id],
  }),
  createdBy: one(users, {
    fields: [trainingPlans.createdBy],
    references: [users.id],
  }),
  items: many(trainingPlanItems),
}));

export const trainingPlanItemsRelations = relations(trainingPlanItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [trainingPlanItems.tenantId],
    references: [tenants.id],
  }),
  plan: one(trainingPlans, {
    fields: [trainingPlanItems.planId],
    references: [trainingPlans.id],
  }),
  drill: one(drillsLibrary, {
    fields: [trainingPlanItems.drillId],
    references: [drillsLibrary.id],
  }),
}));

export const drillsLibraryRelations = relations(drillsLibrary, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [drillsLibrary.tenantId],
    references: [tenants.id],
  }),
  trainingPlanItems: many(trainingPlanItems),
}));

export const attendanceSnapshotsRelations = relations(attendanceSnapshots, ({ one }) => ({
  tenant: one(tenants, {
    fields: [attendanceSnapshots.tenantId],
    references: [tenants.id],
  }),
  player: one(players, {
    fields: [attendanceSnapshots.playerId],
    references: [players.id],
  }),
  session: one(futsalSessions, {
    fields: [attendanceSnapshots.sessionId],
    references: [futsalSessions.id],
  }),
}));

export const devAchievementsRelations = relations(devAchievements, ({ one }) => ({
  tenant: one(tenants, {
    fields: [devAchievements.tenantId],
    references: [tenants.id],
  }),
  player: one(players, {
    fields: [devAchievements.playerId],
    references: [players.id],
  }),
}));

export const progressionSnapshotsRelations = relations(progressionSnapshots, ({ one }) => ({
  tenant: one(tenants, {
    fields: [progressionSnapshots.tenantId],
    references: [tenants.id],
  }),
  player: one(players, {
    fields: [progressionSnapshots.playerId],
    references: [players.id],
  }),
  skill: one(devSkills, {
    fields: [progressionSnapshots.skillId],
    references: [devSkills.id],
  }),
}));

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
});

export type TenantInsert = z.infer<typeof insertTenantSchema>;
export type TenantSelect = typeof tenants.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceBillingSchema = createInsertSchema(serviceBilling).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ServiceBillingInsert = z.infer<typeof insertServiceBillingSchema>;
export type ServiceBillingSelect = typeof serviceBilling.$inferSelect;

export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(futsalSessions).omit({
  id: true,
  createdAt: true,
});

export const insertSignupSchema = createInsertSchema(signups).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertHelpRequestSchema = createInsertSchema(helpRequests).omit({
  id: true,
  createdAt: true,
  resolved: true,
  status: true,
  resolvedBy: true,
  resolutionNote: true,
  resolvedAt: true,
  replyHistory: true,
}).extend({
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string()
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address"),
  phone: z.string()
    .optional()
    .refine((val) => !val || (val.length >= 10 && val.length <= 20), "Phone number must be 10-20 characters")
    .refine((val) => !val || /^[\d\s()\-+.]+$/.test(val), "Phone number can only contain digits, spaces, parentheses, hyphens, plus signs, and periods"),
  subject: z.string()
    .min(5, "Subject must be at least 5 characters")
    .max(100, "Subject must be less than 100 characters"),
  category: z.string()
    .min(1, "Category is required"),
  priority: z.string()
    .min(1, "Priority is required"),
  source: z.enum(["main_page", "parent_portal", "player_portal"]).default("main_page"),
  message: z.string()
    .min(20, "Message must be at least 20 characters")
    .max(1000, "Message must be less than 1000 characters")
    .regex(/^(?!.*(.)\1{5,}).*$/, "Message contains suspicious patterns"),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThemeSettingsSchema = createInsertSchema(themeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ThemeSettingsInsert = z.infer<typeof insertThemeSettingsSchema>;
export type ThemeSettingsSelect = typeof themeSettings.$inferSelect;

export const insertFeatureRequestSchema = createInsertSchema(featureRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: true,
  statusNotes: true,
}).extend({
  title: z.string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be less than 1000 characters"),
});

export type FeatureRequestInsert = z.infer<typeof insertFeatureRequestSchema>;
export type FeatureRequestSelect = typeof featureRequests.$inferSelect;

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({
  id: true,
  currentUses: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  code: z.string()
    .min(3, "Code must be at least 3 characters")
    .max(50, "Code must be less than 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code can only contain uppercase letters, numbers, underscores, and hyphens"),
  discountType: z.enum(['percentage', 'fixed', 'full']),
  discountValue: z.number().int().optional(),
  maxUses: z.number().int().positive().optional(),
  lockedToPlayerId: z.string().optional(),
  lockedToParentId: z.string().optional(),
});

export const insertWaitlistSchema = createInsertSchema(waitlists).omit({
  id: true,
  joinedAt: true,
});

export const joinWaitlistSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  notifyOnJoin: z.boolean().default(true),
  notifyOnPositionChange: z.boolean().default(false),
});

export const leaveWaitlistSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
});

export const promoteWaitlistSchema = z.object({
  playerId: z.string().optional(),
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FeatureFlagInsert = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlagSelect = typeof featureFlags.$inferSelect;

// Player Development Insert Schemas
export const insertDevSkillCategorySchema = createInsertSchema(devSkillCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDevSkillSchema = createInsertSchema(devSkills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDevSkillRubricSchema = createInsertSchema(devSkillRubrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlayerAssessmentSchema = createInsertSchema(playerAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlayerAssessmentItemSchema = createInsertSchema(playerAssessmentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlayerGoalSchema = createInsertSchema(playerGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlayerGoalUpdateSchema = createInsertSchema(playerGoalUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingPlanSchema = createInsertSchema(trainingPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingPlanItemSchema = createInsertSchema(trainingPlanItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDrillSchema = createInsertSchema(drillsLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceSnapshotSchema = createInsertSchema(attendanceSnapshots).omit({
  id: true,
  createdAt: true,
});

export const insertDevAchievementSchema = createInsertSchema(devAchievements).omit({
  id: true,
  createdAt: true,
});

export const insertProgressionSnapshotSchema = createInsertSchema(progressionSnapshots).omit({
  id: true,
  createdAt: true,
});

// Type exports for plan levels
export type PlanLevel = 'free' | 'core' | 'growth' | 'elite';

// Feature key constants
export const FEATURE_KEYS = {
  SESSION_MANAGEMENT: 'session_management',
  LOCATION_LINKS: 'location_links', 
  PARENT_PORTAL: 'parent_portal',
  THEME_CUSTOMIZATION: 'theme_customization',
  WAITLIST_MANUAL: 'waitlist_manual',
  WAITLIST_AUTO_PROMOTE: 'waitlist_auto_promote',
  NOTIFICATIONS_EMAIL: 'notifications_email',
  NOTIFICATIONS_SMS: 'notifications_sms',
  ANALYTICS_BASIC: 'analytics_basic',
  ANALYTICS_ADVANCED: 'analytics_advanced',
  PAYMENTS_ENABLED: 'payments_enabled',
  INTEGRATIONS_CALENDAR: 'integrations_calendar',
  INTEGRATIONS_MAILCHIMP: 'integrations_mailchimp',
  INTEGRATIONS_QUICKBOOKS: 'integrations_quickbooks',
  INTEGRATIONS_ZAPIER: 'integrations_zapier',
  API_READ_ONLY: 'api_read_only',
  API_FULL_ACCESS: 'api_full_access',
  MULTI_TENANT: 'multi_tenant',
  SSO: 'sso',
  SUPPORT_STANDARD: 'support_standard',
  SUPPORT_PRIORITY: 'support_priority',
  BULK_OPERATIONS: 'bulk_operations',
  PLAYER_DEVELOPMENT: 'player_development',
} as const;

export type FeatureKey = typeof FEATURE_KEYS[keyof typeof FEATURE_KEYS];

export const waitlistSettingsSchema = z.object({
  waitlistEnabled: z.boolean().optional(),
  waitlistLimit: z.number().nullable().optional(),
  paymentWindowMinutes: z.number().int().min(5).max(1440).optional(),
  autoPromote: z.boolean().optional(),
});

// Types for upsert operations (includes id)
export type UpsertUser = z.infer<typeof insertUserSchema> & { id?: string };
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type FutsalSession = typeof futsalSessions.$inferSelect & {
  signupsCount?: number;
};
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Signup = typeof signups.$inferSelect;
export type InsertSignup = z.infer<typeof insertSignupSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type HelpRequest = typeof helpRequests.$inferSelect;
export type InsertHelpRequest = z.infer<typeof insertHelpRequestSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type Waitlist = typeof waitlists.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type JoinWaitlist = z.infer<typeof joinWaitlistSchema>;
export type LeaveWaitlist = z.infer<typeof leaveWaitlistSchema>;
export type PromoteWaitlist = z.infer<typeof promoteWaitlistSchema>;
export type WaitlistSettings = z.infer<typeof waitlistSettingsSchema>;

// Player Development Types
export type DevSkillCategory = typeof devSkillCategories.$inferSelect;
export type InsertDevSkillCategory = z.infer<typeof insertDevSkillCategorySchema>;
export type DevSkill = typeof devSkills.$inferSelect;
export type InsertDevSkill = z.infer<typeof insertDevSkillSchema>;
export type DevSkillRubric = typeof devSkillRubrics.$inferSelect;
export type InsertDevSkillRubric = z.infer<typeof insertDevSkillRubricSchema>;
export type PlayerAssessment = typeof playerAssessments.$inferSelect;
export type InsertPlayerAssessment = z.infer<typeof insertPlayerAssessmentSchema>;
export type PlayerAssessmentItem = typeof playerAssessmentItems.$inferSelect;
export type InsertPlayerAssessmentItem = z.infer<typeof insertPlayerAssessmentItemSchema>;
export type PlayerGoal = typeof playerGoals.$inferSelect;
export type InsertPlayerGoal = z.infer<typeof insertPlayerGoalSchema>;
export type PlayerGoalUpdate = typeof playerGoalUpdates.$inferSelect;
export type InsertPlayerGoalUpdate = z.infer<typeof insertPlayerGoalUpdateSchema>;
export type TrainingPlan = typeof trainingPlans.$inferSelect;
export type InsertTrainingPlan = z.infer<typeof insertTrainingPlanSchema>;
export type TrainingPlanItem = typeof trainingPlanItems.$inferSelect;
export type InsertTrainingPlanItem = z.infer<typeof insertTrainingPlanItemSchema>;
export type Drill = typeof drillsLibrary.$inferSelect;
export type InsertDrill = z.infer<typeof insertDrillSchema>;
export type AttendanceSnapshot = typeof attendanceSnapshots.$inferSelect;
export type InsertAttendanceSnapshot = z.infer<typeof insertAttendanceSnapshotSchema>;
export type DevAchievement = typeof devAchievements.$inferSelect;
export type InsertDevAchievement = z.infer<typeof insertDevAchievementSchema>;
export type ProgressionSnapshot = typeof progressionSnapshots.$inferSelect;
export type InsertProgressionSnapshot = z.infer<typeof insertProgressionSnapshotSchema>;
