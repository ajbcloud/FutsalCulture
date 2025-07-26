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
  canAccessPortal: boolean("can_access_portal").default(false),
  canBookAndPay: boolean("can_book_and_pay").default(false),
  inviteSentVia: varchar("invite_sent_via"), // 'email' or 'sms'
  invitedAt: timestamp("invited_at"),
  userAccountCreated: boolean("user_account_created").default(false),
  email: varchar("email"),
  phoneNumber: varchar("phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  signupId: varchar("signup_id").notNull(),
  paymentIntentId: varchar("payment_intent_id"),
  amountCents: integer("amount_cents").notNull(),
  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Help requests table
export const helpRequests = pgTable("help_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: varchar("status").notNull().default("open"),
  name: varchar("name").notNull(),
  phone: varchar("phone"),
  email: varchar("email").notNull(),
  note: text("note").notNull(),
  resolved: boolean("resolved").default(false),
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
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
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
