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
  date,
  real,
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

// Invoice status enum
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "open", "paid", "uncollectible", "void"]);

// Dunning event status enum
export const dunningStatusEnum = pgEnum("dunning_status", ["failed", "retry_scheduled", "retrying", "recovered", "uncollectible"]);

// Webhook attempt status enum
export const webhookAttemptStatusEnum = pgEnum("webhook_attempt_status", ["success", "failed"]);

// Communication template type enum
export const commTemplateTypeEnum = pgEnum("comm_template_type", ["email", "sms"]);

// Email event enum
export const emailEventEnum = pgEnum("email_event", ["processed", "delivered", "open", "click", "bounce", "dropped", "spamreport", "deferred"]);

// SMS event enum  
export const smsEventEnum = pgEnum("sms_event", ["queued", "sent", "delivered", "undelivered", "failed"]);

// User role enum
export const userRoleEnum = pgEnum("user_role", ["parent", "player", "tenant_admin", "super_admin"]);

// User status enum
export const userStatusEnum = pgEnum("user_status", ["active", "locked"]);

// Unsubscribe channel enum
export const unsubscribeChannelEnum = pgEnum("unsubscribe_channel", ["email", "sms"]);

// Impersonation event status enum
export const impersonationStatusEnum = pgEnum("impersonation_status", ["issued", "active", "ended", "expired"]);

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
  // Geographic location fields for US map visualization
  city: text("city"),
  state: text("state"),
  country: text("country").default("US"),
  createdAt: timestamp("created_at").defaultNow(),
  // Beta onboarding fields
  slug: varchar("slug").unique(),
  tenantCode: varchar("tenant_code").unique(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),

  // Comprehensive Trial Management Fields
  trialStartedAt: timestamp("trial_started_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  trialPlan: planLevelEnum("trial_plan"),
  billingStatus: varchar("billing_status").default("none"), // none, trial, active, past_due, cancelled, pending_downgrade
  paymentMethodRequired: boolean("payment_method_required").default(false),
  paymentMethodVerified: boolean("payment_method_verified").default(false),
  trialExtensionsUsed: integer("trial_extensions_used").default(0),
  maxTrialExtensions: integer("max_trial_extensions").default(1),

  // Plan Transition Management
  pendingPlanChange: planLevelEnum("pending_plan_change"),
  pendingPlanChangeAt: timestamp("pending_plan_change_at"),
  lastPlanLevel: planLevelEnum("last_plan_level"),
  planChangeReason: varchar("plan_change_reason"), // trial_end, upgrade, downgrade, payment_failed

  // Data Retention and Archival
  dataRetentionPolicy: jsonb("data_retention_policy").default(sql`'{"analytics": 90, "sessions": 365, "players": 730, "payments": 2555}'::jsonb`),
  archivedDataPaths: jsonb("archived_data_paths").default(sql`'{}'::jsonb`),
  dataCleanupScheduledAt: timestamp("data_cleanup_scheduled_at"),

  // Abuse Prevention
  trialHistory: jsonb("trial_history").default(sql`'[]'::jsonb`), // Track all trial attempts
  signupIpAddress: varchar("signup_ip_address"),
  signupUserAgent: text("signup_user_agent"),
  riskScore: integer("risk_score").default(0), // 0-100 risk assessment

  // Grace Period Management
  gracePeriodEndsAt: timestamp("grace_period_ends_at"),
  gracePeriodReason: varchar("grace_period_reason"), // payment_failed, trial_expired, plan_change
  gracePeriodNotificationsSent: integer("grace_period_notifications_sent").default(0),
});



// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  email: varchar("email").unique(),
  passwordHash: text("password_hash"), // Hashed password for local auth
  authProvider: varchar("auth_provider"), // 'local', 'google', 'microsoft'
  authProviderId: varchar("auth_provider_id"), // ID from the auth provider
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  avatarColor: varchar("avatar_color").default("#2563eb"), // Custom avatar background color
  avatarTextColor: varchar("avatar_text_color"), // Custom avatar text color (null = auto-contrast)
  phone: varchar("phone"),
  isAdmin: boolean("is_admin").default(false),
  isAssistant: boolean("is_assistant").default(false),
  isSuperAdmin: boolean("is_super_admin").default(false), // New Super-Admin role
  role: userRoleEnum("role").default("parent"),
  mfaEnabled: boolean("mfa_enabled").default(false),
  status: userStatusEnum("status").default("active"),
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
export const ageBandEnum = pgEnum("age_band", ["child", "teen", "adult"]);

// Players table  
export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  avatarColor: varchar("avatar_color").default("#10b981"), // Custom avatar background color for players
  avatarTextColor: varchar("avatar_text_color"), // Custom avatar text color (null = auto-contrast)
  birthYear: integer("birth_year").notNull(),
  dateOfBirth: date("date_of_birth"),
  ageBand: ageBandEnum("age_band").notNull().default("child"),
  isTeen: boolean("is_teen").notNull().default(false),
  isAdult: boolean("is_adult").notNull().default(false),
  becameAdultAt: timestamp("became_adult_at"), // Track when player turned 18
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
  // Advanced booking constraints
  noTimeConstraints: boolean("no_time_constraints").default(false), // If true, can book anytime
  daysBeforeBooking: integer("days_before_booking"), // Number of days before session date when booking opens
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
  paymentId: varchar("payment_id"), // For both Stripe and Braintree payment IDs
  paymentProvider: varchar("payment_provider"), // 'stripe' or 'braintree'
  // Discount code tracking
  discountCodeId: varchar("discount_code_id"),
  discountCodeApplied: varchar("discount_code_applied"), // The actual code used
  discountAmountCents: integer("discount_amount_cents"), // Amount discounted
  // Refund tracking
  refunded: boolean("refunded").default(false),
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at"),
  refundTransactionId: varchar("refund_transaction_id"),
  // Reservation system
  reservationExpiresAt: timestamp("reservation_expires_at"), // When temporary reservation expires
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  firstResponseAt: timestamp("first_response_at"), // when first response was sent (for SLA tracking)
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



// Feature request status enum
export const featureRequestStatusEnum = pgEnum("feature_request_status", [
  "received", "under_review", "approved", "in_development", "released"
]);

// Feature request priority enum based on subscription level
export const featureRequestPriorityEnum = pgEnum("feature_request_priority", [
  "low", "medium", "high", "critical"
]);

// Feature requests table - now available to all subscription levels with prioritization
export const featureRequests = pgTable("feature_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  status: featureRequestStatusEnum("status").notNull().default("received"),
  priority: featureRequestPriorityEnum("priority").notNull().default("medium"), // Auto-assigned based on plan
  planLevel: planLevelEnum("plan_level").notNull(), // Track plan level when submitted
  submittedBy: varchar("submitted_by").notNull().references(() => users.id),
  reviewedBy: varchar("reviewed_by"), // Super admin who reviewed
  statusNotes: text("status_notes"), // Notes about status changes
  estimatedReviewWeeks: integer("estimated_review_weeks").default(1), // Minimum 1 week review time
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"), // When super admin first reviewed
}, (table) => [
  index("feature_requests_tenant_id_idx").on(table.tenantId),
  index("feature_requests_status_idx").on(table.status),
  index("feature_requests_priority_idx").on(table.priority),
  index("feature_requests_plan_level_idx").on(table.planLevel),
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

// =============================================================================
// KPI & BILLING TABLES
// =============================================================================

// Platform billing (tenants → us)
export const tenantInvoices = pgTable("tenant_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  dueAt: timestamp("due_at").notNull(),
  paidAt: timestamp("paid_at"),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("tenant_invoices_tenant_id_idx").on(table.tenantId),
  index("tenant_invoices_status_idx").on(table.status),
  index("tenant_invoices_due_at_idx").on(table.dueAt),
]);

export const tenantInvoiceLines = pgTable("tenant_invoice_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => tenantInvoices.id),
  type: text("type").notNull(),
  qty: integer("qty").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  amountCents: integer("amount_cents").notNull().default(0),
}, (table) => [
  index("tenant_invoice_lines_invoice_id_idx").on(table.invoiceId),
]);

export const dunningEvents = pgTable("dunning_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => tenantInvoices.id),
  attemptNo: integer("attempt_no").notNull().default(1),
  status: dunningStatusEnum("status").notNull().default("failed"),
  gatewayTxnId: text("gateway_txn_id"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("dunning_events_invoice_id_idx").on(table.invoiceId),
  index("dunning_events_status_idx").on(table.status),
  index("dunning_events_created_at_idx").on(table.createdAt),
]);

// Plans & usage
export const planCatalog = pgTable("plan_catalog", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull().default(0),
  limits: jsonb("limits").notNull(), // JSON with player/session/etc limits
});

export const tenantPlanAssignments = pgTable("tenant_plan_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  planCode: text("plan_code").notNull().references(() => planCatalog.code),
  since: timestamp("since").notNull().defaultNow(),
  until: timestamp("until"),
}, (table) => [
  index("tenant_plan_assignments_tenant_id_idx").on(table.tenantId),
  index("tenant_plan_assignments_plan_code_idx").on(table.planCode),
]);

export const tenantUsageDaily = pgTable("tenant_usage_daily", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  date: timestamp("date").notNull(), // date column stored as timestamp
  counters: jsonb("counters").notNull(), // JSON with players, sessions, emails, sms, storage_mb, api_calls
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("tenant_usage_daily_tenant_id_idx").on(table.tenantId),
  index("tenant_usage_daily_date_idx").on(table.date),
  uniqueIndex("tenant_usage_daily_tenant_date_idx").on(table.tenantId, table.date),
]);

// Webhooks & Integration Health Tables

export const integrationWebhooks = pgTable("integration_webhook", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  enabled: boolean("enabled").default(true),
  signingSecretEnc: text("signing_secret_enc"),
  lastStatus: integer("last_status"),
  lastLatencyMs: integer("last_latency_ms"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookId: varchar("webhook_id").notNull().references(() => integrationWebhooks.id),
  source: text("source").notNull(),
  eventType: text("event_type").notNull(),
  payloadJson: jsonb("payload_json").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
}, (table) => [
  index("webhook_events_webhook_id_idx").on(table.webhookId),
  index("webhook_events_created_at_idx").on(table.createdAt),
]);

export const webhookAttempts = pgTable("webhook_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => webhookEvents.id),
  attemptNo: integer("attempt_no").notNull(),
  status: webhookAttemptStatusEnum("status").notNull(),
  httpStatus: integer("http_status"),
  latencyMs: integer("latency_ms"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("webhook_attempts_event_id_idx").on(table.eventId),
  index("webhook_attempts_status_idx").on(table.status),
]);

export const integrationStatusPings = pgTable("integration_status_pings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integration: text("integration").notNull(), // 'email', 'sms', 'oauth', 'payments', etc
  ok: boolean("ok").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("integration_status_pings_integration_idx").on(table.integration),
  index("integration_status_pings_created_at_idx").on(table.createdAt),
]);

// Communication Events Tables

export const commTemplates = pgTable("comm_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: commTemplateTypeEnum("type").notNull(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  version: integer("version").default(1),
  active: boolean("active").default(true),
  lastUsedAt: timestamp("last_used_at"),
}, (table) => [
  index("comm_templates_type_idx").on(table.type),
  index("comm_templates_key_idx").on(table.key),
]);

export const emailEvents = pgTable("email_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),
  messageId: text("message_id").notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  templateKey: text("template_key"),
  toAddr: text("to_addr").notNull(),
  event: emailEventEnum("event").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("email_events_tenant_id_idx").on(table.tenantId),
  index("email_events_template_key_idx").on(table.templateKey),
  index("email_events_created_at_idx").on(table.createdAt),
  index("email_events_event_idx").on(table.event),
]);

export const smsEvents = pgTable("sms_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),
  messageSid: text("message_sid").notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  toNumber: text("to_number").notNull(),
  event: smsEventEnum("event").notNull(),
  errorCode: text("error_code"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("sms_events_tenant_id_idx").on(table.tenantId),
  index("sms_events_created_at_idx").on(table.createdAt),
  index("sms_events_event_idx").on(table.event),
]);

export const unsubscribes = pgTable("unsubscribes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channel: unsubscribeChannelEnum("channel").notNull(),
  address: text("address").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("unsubscribes_channel_idx").on(table.channel),
  index("unsubscribes_address_idx").on(table.address),
]);

// Security Tables

export const featureAdoptionEvents = pgTable("feature_adoption_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  userId: varchar("user_id").references(() => users.id),
  featureKey: text("feature_key").notNull(),
  occurredAt: timestamp("occurred_at").defaultNow(),
}, (table) => [
  index("feature_adoption_events_tenant_id_idx").on(table.tenantId),
  index("feature_adoption_events_feature_key_idx").on(table.featureKey),
]);

export const webhookStatsHourly = pgTable("webhook_stats_hourly", {
  webhookId: varchar("webhook_id").notNull().references(() => integrationWebhooks.id),
  hour: timestamp("hour").notNull(),
  attempts: integer("attempts").default(0),
  success: integer("success").default(0),
  failed: integer("failed").default(0),
  p95LatencyMs: integer("p95_latency_ms"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Composite primary key
  index("webhook_stats_hourly_pkey").on(table.webhookId, table.hour),
  index("webhook_stats_hourly_hour_idx").on(table.hour),
]);

export const impersonationEvents = pgTable("impersonation_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  superAdminId: varchar("super_admin_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  jti: text("jti").notNull().unique(),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  endedAt: timestamp("ended_at"),
  ip: text("ip"),
  userAgent: text("user_agent"),
}, (table) => [
  index("idx_imp_events_tenant_started").on(table.tenantId, table.startedAt),
  index("idx_imp_events_super_started").on(table.superAdminId, table.startedAt),
]);

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  userId: varchar("user_id").references(() => users.id),
  actorId: varchar("actor_id").notNull(),
  actorRole: text("actor_role").notNull(),
  section: text("section").notNull(),
  action: text("action").notNull(),
  targetId: text("target_id").notNull(),
  meta: jsonb("meta"),
  diff: jsonb("diff"),
  ip: text("ip"),
  // Impersonation fields
  isImpersonated: boolean("is_impersonated").default(false),
  impersonatorId: varchar("impersonator_id").references(() => users.id),
  impersonationEventId: varchar("impersonation_event_id").references(() => impersonationEvents.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("audit_logs_actor_id_idx").on(table.actorId),
  index("audit_logs_section_idx").on(table.section),
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_created_at_idx").on(table.createdAt),
  index("idx_audit_impersonation").on(table.isImpersonated, table.createdAt),
  index("audit_logs_tenant_id_idx").on(table.tenantId),
]);

// Platform settings table for impersonation policy
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  policies: jsonb("policies").notNull().default(sql`'{
    "autoApproveTenants": false,
    "requireTenantApproval": true,
    "mfa": {
      "requireSuperAdmins": true,
      "requireTenantAdmins": false
    },
    "subdomains": {
      "enabled": false,
      "baseDomain": "tenants.playhq.app",
      "dnsOk": false,
      "sslOk": false
    },
    "impersonation": {
      "allow": true,
      "maxMinutes": 30,
      "requireReason": true
    },
    "session": {
      "idleTimeoutMinutes": 60
    },
    "retentionDays": {
      "logs": 90,
      "analytics": 365,
      "pii": 730
    },
    "maintenance": {
      "enabled": false,
      "message": ""
    }
  }'::jsonb`),
  tenantDefaults: jsonb("tenant_defaults").notNull().default(sql`'{
    "defaultPlanCode": "core",
    "bookingWindowHours": 8,
    "sessionCapacity": 20,
    "seedSampleContent": false
  }'::jsonb`),

  // Comprehensive Trial Settings
  trialSettings: jsonb("trial_settings").notNull().default(sql`'{
    "enabled": true,
    "durationDays": 14,
    "defaultTrialPlan": "growth",
    "autoConvertToFree": true,
    "requirePaymentMethod": false,
    "allowPlanChangeDuringTrial": true,
    "maxExtensions": 1,
    "extensionDurationDays": 7,
    "gracePeriodDays": 3,
    "dataRetentionAfterTrialDays": 30,
    "autoCleanupExpiredTrials": true,
    "preventMultipleTrials": true,
    "riskAssessmentEnabled": true,
    "paymentMethodGracePeriodHours": 72,
    "notificationSchedule": {
      "trialStart": [0],
      "trialReminders": [7, 3, 1],
      "trialExpiry": [0, 1, 3],
      "gracePeriod": [0, 1, 2]
    },
    "planTransitionRules": {
      "preserveDataOnDowngrade": true,
      "archiveAdvancedFeatureData": true,
      "playerLimitEnforcement": "soft",
      "featureAccessGracePeriod": 7
    },
    "abusePreventionRules": {
      "maxTrialsPerEmail": 1,
      "maxTrialsPerIP": 3,
      "maxTrialsPerPaymentMethod": 1,
      "cooldownBetweenTrialsDays": 90,
      "requirePhoneVerification": false,
      "requireCreditCardVerification": false
    }
  }'::jsonb`),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  // KPI & Billing relations
  tenantInvoices: many(tenantInvoices),
  tenantPlanAssignments: many(tenantPlanAssignments),
  tenantUsageDaily: many(tenantUsageDaily),
  // Communication Events relations
  emailEvents: many(emailEvents),
  smsEvents: many(smsEvents),
  // Impersonation Events relations
  impersonationEvents: many(impersonationEvents),
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
  // Impersonation Events relations
  impersonationEventsAsAdmin: many(impersonationEvents, {
    relationName: "impersonationSuperAdmin"
  }),
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

// Webhooks & Integration Relations

export const integrationWebhooksRelations = relations(integrationWebhooks, ({ many }) => ({
  webhookEvents: many(webhookEvents),
}));

export const webhookEventsRelations = relations(webhookEvents, ({ one, many }) => ({
  webhook: one(integrationWebhooks, {
    fields: [webhookEvents.webhookId],
    references: [integrationWebhooks.id],
  }),
  attempts: many(webhookAttempts),
}));

export const webhookAttemptsRelations = relations(webhookAttempts, ({ one }) => ({
  event: one(webhookEvents, {
    fields: [webhookAttempts.eventId],
    references: [webhookEvents.id],
  }),
}));

// Communication Relations

export const emailEventsRelations = relations(emailEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [emailEvents.tenantId],
    references: [tenants.id],
  }),
}));

export const smsEventsRelations = relations(smsEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [smsEvents.tenantId],
    references: [tenants.id],
  }),
}));

// Security Relations

export const impersonationEventsRelations = relations(impersonationEvents, ({ one }) => ({
  superAdmin: one(users, {
    fields: [impersonationEvents.superAdminId],
    references: [users.id],
    relationName: "impersonationSuperAdmin"
  }),
  tenant: one(tenants, {
    fields: [impersonationEvents.tenantId],
    references: [tenants.id],
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

// Insert schemas for new tables

export const insertIntegrationWebhookSchema = createInsertSchema(integrationWebhooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
});

export const insertWebhookAttemptSchema = createInsertSchema(webhookAttempts).omit({
  id: true,
  createdAt: true,
});

export const insertIntegrationStatusPingSchema = createInsertSchema(integrationStatusPings).omit({
  id: true,
  createdAt: true,
});

export const insertCommTemplateSchema = createInsertSchema(commTemplates).omit({
  id: true,
});

export const insertEmailEventSchema = createInsertSchema(emailEvents).omit({
  id: true,
  createdAt: true,
});

export const insertSmsEventSchema = createInsertSchema(smsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertUnsubscribeSchema = createInsertSchema(unsubscribes).omit({
  id: true,
  createdAt: true,
});

export const insertImpersonationEventSchema = createInsertSchema(impersonationEvents).omit({
  id: true,
  startedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Communication Campaigns
export const communicationCampaigns = pgTable('communication_campaigns', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'email' or 'sms'
  subject: text('subject'), // For emails
  content: text('content').notNull(),
  recipientType: text('recipient_type').notNull(), // 'all_parents', 'all_players', 'specific_age_groups', 'specific_locations', 'custom'
  recipientFilters: jsonb('recipient_filters').$type<{
    ageGroups?: string[];
    locations?: string[];
    genders?: string[];
    playerIds?: string[];
    parentIds?: string[];
  }>(),
  schedule: text('schedule').notNull(), // 'immediate', 'scheduled', 'recurring'
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  recurringPattern: text('recurring_pattern'), // 'daily', 'weekly', 'monthly'
  recurringDays: text('recurring_days').array(), // For weekly: ['monday', 'tuesday'], For monthly: ['1', '15']
  recurringTime: text('recurring_time'), // '09:00'
  recurringEndDate: timestamp('recurring_end_date', { withTimezone: true }),
  status: text('status').notNull().default('draft'), // 'draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'
  sentCount: integer('sent_count').default(0),
  failedCount: integer('failed_count').default(0),
  lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  createdBy: varchar('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => [
  index("communication_campaigns_tenant_id_idx").on(table.tenantId),
  index("communication_campaigns_status_idx").on(table.status),
  index("communication_campaigns_next_run_idx").on(table.nextRunAt),
]);

export const insertCommunicationCampaignSchema = createInsertSchema(communicationCampaigns).omit({
  id: true,
  sentCount: true,
  failedCount: true,
  lastSentAt: true,
  createdAt: true,
  updatedAt: true
});
export type InsertCommunicationCampaign = z.infer<typeof insertCommunicationCampaignSchema>;
export type SelectCommunicationCampaign = typeof communicationCampaigns.$inferSelect;

// Communication Logs
export const communicationLogs = pgTable('communication_logs', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar('campaign_id').notNull().references(() => communicationCampaigns.id, { onDelete: 'cascade' }),
  recipientId: varchar('recipient_id').notNull(),
  recipientEmail: text('recipient_email'),
  recipientPhone: text('recipient_phone'),
  status: text('status').notNull(), // 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked'
  error: text('error'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  clickedAt: timestamp('clicked_at', { withTimezone: true })
}, (table) => [
  index("communication_logs_campaign_id_idx").on(table.campaignId),
  index("communication_logs_recipient_id_idx").on(table.recipientId),
]);

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({
  id: true,
  sentAt: true
});
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;
export type SelectCommunicationLog = typeof communicationLogs.$inferSelect;

// Features Engine Tables
export const features = pgTable('features', {
  key: varchar('key').primaryKey(), // e.g., 'core.session_management'
  name: text('name').notNull(),
  category: text('category').notNull(), // 'core', 'communication', 'payments_billing', 'analytics', 'integrations', 'support', 'limits'
  type: text('type').notNull(), // 'boolean', 'enum', 'limit'
  description: text('description'),
  optionsJson: jsonb('options_json').$type<{
    values?: string[]; // For enum types
    min?: number; // For limit types
    max?: number;
    unit?: string;
    step?: number;
  }>(),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => [
  index("features_category_idx").on(table.category),
  index("features_is_active_idx").on(table.isActive),
]);

export const planFeatures = pgTable('plan_features', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  planCode: text('plan_code').notNull().references(() => planCatalog.code, { onDelete: 'cascade' }),
  featureKey: varchar('feature_key').notNull().references(() => features.key, { onDelete: 'cascade' }),
  enabled: boolean('enabled'), // For boolean features
  variant: text('variant'), // For enum features (must be in features.options_json.values)
  limitValue: integer('limit_value'), // For limit features
  metadata: jsonb('metadata').$type<Record<string, any>>(), // Additional configuration
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  updatedBy: varchar('updated_by').references(() => users.id, { onDelete: 'set null' })
}, (table) => [
  uniqueIndex("plan_features_unique").on(table.planCode, table.featureKey),
  index("plan_features_plan_code_idx").on(table.planCode),
  index("plan_features_feature_key_idx").on(table.featureKey),
]);

// Tenant-specific feature overrides (optional)
export const tenantFeatureOverrides = pgTable('tenant_feature_overrides', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  featureKey: varchar('feature_key').notNull().references(() => features.key, { onDelete: 'cascade' }),
  enabled: boolean('enabled'), // For boolean features
  variant: text('variant'), // For enum features
  limitValue: integer('limit_value'), // For limit features
  reason: text('reason'), // Why this override was applied
  expiresAt: timestamp('expires_at', { withTimezone: true }), // Optional expiration
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: varchar('created_by').references(() => users.id, { onDelete: 'set null' })
}, (table) => [
  uniqueIndex("tenant_feature_overrides_unique").on(table.tenantId, table.featureKey),
  index("tenant_feature_overrides_tenant_id_idx").on(table.tenantId),
  index("tenant_feature_overrides_expires_at_idx").on(table.expiresAt),
]);

// Feature change history for audit
export const featureAuditLog = pgTable('feature_audit_log', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  entityType: text('entity_type').notNull(), // 'plan' or 'tenant'
  entityId: varchar('entity_id').notNull(), // planId or tenantId
  featureKey: varchar('feature_key').notNull(),
  oldValue: jsonb('old_value').$type<{
    enabled?: boolean;
    variant?: string;
    limitValue?: number;
  }>(),
  newValue: jsonb('new_value').$type<{
    enabled?: boolean;
    variant?: string;
    limitValue?: number;
  }>().notNull(),
  changedBy: varchar('changed_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  changeReason: text('change_reason'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index("feature_audit_entity_idx").on(table.entityType, table.entityId),
  index("feature_audit_feature_key_idx").on(table.featureKey),
  index("feature_audit_changed_by_idx").on(table.changedBy),
  index("feature_audit_created_at_idx").on(table.createdAt),
]);

// AI Analytics Tables
export const aiForecastsDaily = pgTable("ai_forecasts_daily", {
  id: varchar("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  scopeType: varchar("scope_type", { length: 50 }).notNull(),
  scopeId: varchar("scope_id"),
  metric: varchar("metric", { length: 50 }).notNull(),
  mean: integer("mean").notNull(), // in cents
  p10: integer("p10").notNull(), // 10th percentile
  p90: integer("p90").notNull(), // 90th percentile
  model: varchar("model").default("prophet"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ai_forecasts_scope_idx").on(table.scopeType, table.scopeId, table.date),
  index("ai_forecasts_metric_idx").on(table.metric, table.date),
]);

export const aiAnomalies = pgTable("ai_anomalies", {
  id: varchar("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  scopeType: varchar("scope_type", { length: 50 }).notNull(),
  scopeId: varchar("scope_id"),
  metric: varchar("metric", { length: 50 }).notNull(),
  direction: varchar("direction", { length: 10 }).notNull(),
  zscore: real("zscore").notNull(),
  expected: integer("expected").notNull(), // in cents
  actual: integer("actual").notNull(), // in cents
  severity: varchar("severity", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ai_anomalies_scope_idx").on(table.scopeType, table.scopeId, table.date),
  index("ai_anomalies_severity_idx").on(table.severity, table.date),
]);

export const aiContributions = pgTable("ai_contributions", {
  id: varchar("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  metric: varchar("metric", { length: 50 }).notNull(),
  driverType: varchar("driver_type", { length: 50 }).notNull(),
  driverId: varchar("driver_id").notNull(),
  driverLabel: varchar("driver_label").notNull(),
  impactAbs: integer("impact_abs").notNull(), // absolute impact in cents
  impactPct: real("impact_pct").notNull(), // percentage impact
  rank: integer("rank").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ai_contributions_period_idx").on(table.periodStart, table.periodEnd),
  index("ai_contributions_metric_idx").on(table.metric, table.rank),
]);

export const aiTenantScores = pgTable("ai_tenant_scores", {
  id: varchar("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  date: date("date").notNull(),
  churnRisk: real("churn_risk").notNull(), // 0-1 probability
  healthScore: integer("health_score").notNull(), // 0-100
  topSignals: jsonb("top_signals").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("ai_tenant_scores_unique").on(table.tenantId, table.date),
  index("ai_tenant_scores_risk_idx").on(table.churnRisk),
]);

export const aiNarratives = pgTable("ai_narratives", {
  id: varchar("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  scopeType: varchar("scope_type", { length: 50 }).notNull(),
  scopeId: varchar("scope_id"),
  summaryMd: text("summary_md").notNull(),
  driversMd: text("drivers_md").notNull(),
  risksMd: text("risks_md").notNull(),
  forecastMd: text("forecast_md").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ai_narratives_scope_idx").on(table.scopeType, table.scopeId),
  index("ai_narratives_period_idx").on(table.periodStart, table.periodEnd),
]);

export const insertFeatureSchema = createInsertSchema(features).omit({
  createdAt: true,
  updatedAt: true
});

export const insertPlanFeatureSchema = createInsertSchema(planFeatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTenantFeatureOverrideSchema = createInsertSchema(tenantFeatureOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFeatureAuditLogSchema = createInsertSchema(featureAuditLog).omit({
  id: true,
  createdAt: true
});

export type Feature = typeof features.$inferSelect;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type PlanFeature = typeof planFeatures.$inferSelect;
export type InsertPlanFeature = z.infer<typeof insertPlanFeatureSchema>;
export type TenantFeatureOverride = typeof tenantFeatureOverrides.$inferSelect;
export type InsertTenantFeatureOverride = z.infer<typeof insertTenantFeatureOverrideSchema>;
export type FeatureAuditLog = typeof featureAuditLog.$inferSelect;
export type InsertFeatureAuditLog = z.infer<typeof insertFeatureAuditLogSchema>;

// Beta onboarding System Tables

// Tenant users for role-based access control
export const tenantUsers = pgTable("tenant_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").notNull().default("player"), // tenant_owner, coach, player, parent
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("tenant_users_unique").on(table.tenantId, table.userId),
  index("tenant_users_tenant_idx").on(table.tenantId),
  index("tenant_users_user_idx").on(table.userId),
]);

// Email invitations system
export const invites = pgTable("invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  email: varchar("email").notNull(),
  role: varchar("role").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  invitedByUserId: varchar("invited_by_user_id").references(() => users.id).notNull(),
  channel: varchar("channel").default("email"), // email, sms
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("invites_tenant_idx").on(table.tenantId),
  index("invites_token_idx").on(table.token),
  index("invites_email_idx").on(table.email),
]);

// Email verification system
export const emailVerifications = pgTable("email_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("email_verifications_user_idx").on(table.userId),
  index("email_verifications_token_idx").on(table.token),
]);

// Subscription management (extending existing billing)
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  planKey: varchar("plan_key").notNull().default("free"), // free, paid, enterprise
  status: varchar("status").notNull().default("inactive"), // active, inactive, canceled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("subscriptions_tenant_unique").on(table.tenantId),
  index("subscriptions_stripe_customer_idx").on(table.stripeCustomerId),
]);

// Plan feature definitions (extending existing feature system)
export const betaPlanFeatures = pgTable("beta_plan_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planKey: varchar("plan_key").notNull(),
  featureKey: varchar("feature_key").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  limitsJson: jsonb("limits_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("beta_plan_features_unique").on(table.planKey, table.featureKey),
  index("beta_plan_features_plan_idx").on(table.planKey),
]);

// Audit events for compliance
export const auditEvents = pgTable("audit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorUserId: varchar("actor_user_id").references(() => users.id),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  eventType: varchar("event_type").notNull(),
  targetId: varchar("target_id"),
  metadataJson: jsonb("metadata_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("audit_events_tenant_idx").on(table.tenantId),
  index("audit_events_actor_idx").on(table.actorUserId),
  index("audit_events_type_idx").on(table.eventType),
  index("audit_events_created_idx").on(table.createdAt),
]);

// Parental consent records
export const consentRecords = pgTable("consent_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").references(() => players.id).notNull(),
  parentId: varchar("parent_id").references(() => users.id).notNull(),
  consentType: varchar("consent_type").notNull(), // registration, medical, photo
  consentGiven: boolean("consent_given").notNull(),
  consentDate: timestamp("consent_date").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("consent_records_player_idx").on(table.playerId),
  index("consent_records_parent_idx").on(table.parentId),
]);

// Policy acceptance tracking
export const userPolicyAcceptances = pgTable("user_policy_acceptances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  policyType: varchar("policy_type").notNull(), // terms, privacy, cookie
  policyVersion: varchar("policy_version").notNull(),
  acceptedAt: timestamp("accepted_at").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_policy_acceptances_unique").on(table.userId, table.policyType, table.policyVersion),
  index("user_policy_acceptances_user_idx").on(table.userId),
]);

// Email bounce tracking
export const emailBounces = pgTable("email_bounces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  bounceType: varchar("bounce_type").notNull(), // hard, soft, complaint
  reason: text("reason"),
  bouncedAt: timestamp("bounced_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("email_bounces_email_idx").on(table.email),
  index("email_bounces_type_idx").on(table.bounceType),
]);

// Parent-player relationship linking
export const parentPlayerLinks = pgTable("parent_player_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").references(() => users.id).notNull(),
  playerId: varchar("player_id").references(() => players.id).notNull(),
  relationshipType: varchar("relationship_type").notNull().default("parent"), // parent, guardian, emergency_contact
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("parent_player_links_unique").on(table.parentId, table.playerId),
  index("parent_player_links_parent_idx").on(table.parentId),
  index("parent_player_links_player_idx").on(table.playerId),
]);

// Consent form templates
export const consentTemplates = pgTable("consent_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  templateType: varchar("template_type").notNull(), // medical, liability, photo, privacy
  title: varchar("title").notNull(),
  content: text("content"), // HTML/markdown content
  filePath: varchar("file_path"), // Object storage path for uploaded document
  fileName: varchar("file_name"),
  fileSize: integer("file_size"),
  isCustom: boolean("is_custom").notNull().default(false), // true for uploaded, false for default
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("consent_templates_tenant_idx").on(table.tenantId),
  index("consent_templates_type_idx").on(table.templateType),
  uniqueIndex("consent_templates_unique").on(table.tenantId, table.templateType, table.isActive),
]);

// Signed consent documents
export const consentDocuments = pgTable("consent_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  playerId: varchar("player_id").references(() => players.id).notNull(),
  parentId: varchar("parent_id").references(() => users.id).notNull(),
  templateId: varchar("template_id").references(() => consentTemplates.id).notNull(),
  templateType: varchar("template_type").notNull(), // medical, liability, photo, privacy
  documentTitle: varchar("document_title").notNull(),
  documentVersion: integer("document_version").notNull().default(1),
  pdfFilePath: varchar("pdf_file_path").notNull(), // Object storage path for generated PDF
  pdfFileName: varchar("pdf_file_name").notNull(),
  pdfFileSize: integer("pdf_file_size"),
  signedAt: timestamp("signed_at").notNull(),
  signerIpAddress: varchar("signer_ip_address"),
  signerUserAgent: text("signer_user_agent"),
  digitalSignature: text("digital_signature"), // Hash of document + signer info
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("consent_documents_tenant_idx").on(table.tenantId),
  index("consent_documents_player_idx").on(table.playerId),
  index("consent_documents_parent_idx").on(table.parentId),
  index("consent_documents_template_idx").on(table.templateId),
  index("consent_documents_signed_idx").on(table.signedAt),
]);

// Consent document signatures tracking
export const consentSignatures = pgTable("consent_signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => consentDocuments.id).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  playerId: varchar("player_id").references(() => players.id).notNull(),
  parentId: varchar("parent_id").references(() => users.id).notNull(),
  templateType: varchar("template_type").notNull(),
  signatureMethod: varchar("signature_method").notNull().default("electronic"), // electronic, digital
  signatureData: jsonb("signature_data"), // Store signature metadata
  consentGiven: boolean("consent_given").notNull(),
  signedAt: timestamp("signed_at").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  browserFingerprint: text("browser_fingerprint"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("consent_signatures_document_idx").on(table.documentId),
  index("consent_signatures_tenant_idx").on(table.tenantId),
  index("consent_signatures_player_idx").on(table.playerId),
  index("consent_signatures_parent_idx").on(table.parentId),
  index("consent_signatures_signed_idx").on(table.signedAt),
]);

// Document access audit trail
export const consentDocumentAccess = pgTable("consent_document_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => consentDocuments.id).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  accessedBy: varchar("accessed_by").references(() => users.id).notNull(),
  accessType: varchar("access_type").notNull(), // view, download, share
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  accessDetails: jsonb("access_details"), // Additional metadata
}, (table) => [
  index("consent_access_document_idx").on(table.documentId),
  index("consent_access_tenant_idx").on(table.tenantId),
  index("consent_access_user_idx").on(table.accessedBy),
  index("consent_access_time_idx").on(table.accessedAt),
]);

// Beta onboarding schema exports
export const insertTenantUserSchema = createInsertSchema(tenantUsers).omit({
  id: true,
  createdAt: true,
});

export const insertInviteSchema = createInsertSchema(invites).omit({
  id: true,
  createdAt: true,
});

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditEventSchema = createInsertSchema(auditEvents).omit({
  id: true,
  createdAt: true,
});

export const insertConsentTemplateSchema = createInsertSchema(consentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConsentDocumentSchema = createInsertSchema(consentDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertConsentSignatureSchema = createInsertSchema(consentSignatures).omit({
  id: true,
  createdAt: true,
});

export const insertConsentDocumentAccessSchema = createInsertSchema(consentDocumentAccess).omit({
  id: true,
});

// Beta onboarding types
export type TenantUser = typeof tenantUsers.$inferSelect;
export type InsertTenantUser = z.infer<typeof insertTenantUserSchema>;
export type Invite = typeof invites.$inferSelect;
export type ConsentTemplate = typeof consentTemplates.$inferSelect;
export type InsertConsentTemplate = z.infer<typeof insertConsentTemplateSchema>;
export type ConsentDocument = typeof consentDocuments.$inferSelect;
export type InsertConsentDocument = z.infer<typeof insertConsentDocumentSchema>;
export type ConsentSignature = typeof consentSignatures.$inferSelect;
export type InsertConsentSignature = z.infer<typeof insertConsentSignatureSchema>;
export type ConsentDocumentAccess = typeof consentDocumentAccess.$inferSelect;
export type InsertConsentDocumentAccess = z.infer<typeof insertConsentDocumentAccessSchema>;
export type InsertInvite = z.infer<typeof insertInviteSchema>;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = z.infer<typeof insertEmailVerificationSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;