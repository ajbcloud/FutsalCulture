import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Registration status enum
export const registrationStatusEnum = pgEnum("registration_status", ["pending", "approved", "rejected"]);

// Integration provider enum
export const integrationProviderEnum = pgEnum("integration_provider", [
  "twilio", "sendgrid", "google", "microsoft", "stripe", "zoom", "calendar", "mailchimp", "quickbooks", "braintree"
]);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  isAdmin: boolean("is_admin").default(false),
  isAssistant: boolean("is_assistant").default(false),
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
});

// Gender enum for players and sessions
export const genderEnum = pgEnum("gender", ["boys", "girls"]);

// Players table  
export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
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
]);

// Sessions table
export const sessionsEnum = pgEnum("session_status", ["upcoming", "open", "full", "closed"]);

export const futsalSessions = pgTable("futsal_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  location: varchar("location").notNull(),
  ageGroups: text("age_groups").array().notNull(),
  genders: text("genders").array().notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  capacity: integer("capacity").notNull().default(12),
  priceCents: integer("price_cents").notNull().default(1000),
  status: sessionsEnum("status").notNull().default("upcoming"),
  bookingOpenHour: integer("booking_open_hour").default(8), // Hour when booking opens (0-23)
  bookingOpenMinute: integer("booking_open_minute").default(0), // Minute when booking opens (0-59)
  createdAt: timestamp("created_at").defaultNow(),
});

// Signups table
export const signups = pgTable("signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  paid: boolean("paid").default(false),
  paymentIntentId: varchar("payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "refunded"]);

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

// Help requests table
export const helpRequests = pgTable("help_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: varchar("status").notNull().default("open"),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(), 
  phone: varchar("phone"),
  email: varchar("email").notNull(),
  subject: varchar("subject").notNull(),
  category: varchar("category").notNull(),
  priority: varchar("priority").notNull().default("medium"),
  message: text("message").notNull(),
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
});

// Notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().unique(),
  email: boolean("email").default(true),
  sms: boolean("sms").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System settings table for global configurations
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").unique().notNull(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by"), // admin user id
});

// Integrations table for third-party service configuration
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: integrationProviderEnum("provider").notNull().unique(),
  credentials: jsonb("credentials").notNull(), // Store encrypted credentials
  enabled: boolean("enabled").default(false),
  configuredBy: varchar("configured_by"), // admin user id
  lastTestedAt: timestamp("last_tested_at"),
  testStatus: varchar("test_status"), // 'success', 'failure', 'pending'
  testErrorMessage: text("test_error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service billing table for platform service payment configuration
export const serviceBilling = pgTable("service_billing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  players: many(players),
  notificationPreferences: one(notificationPreferences),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  parent: one(users, {
    fields: [players.parentId],
    references: [users.id],
  }),
  signups: many(signups),
}));

export const futsalSessionsRelations = relations(futsalSessions, ({ many }) => ({
  signups: many(signups),
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

// Insert schemas
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
