import {
  users,
  players,
  futsalSessions,
  signups,
  payments,
  helpRequests,
  notificationPreferences,
  systemSettings,
  serviceBilling,
  discountCodes,
  type User,
  type UpsertUser,
  type UpdateUser,
  type Player,
  type InsertPlayer,
  type FutsalSession,
  type InsertSession,
  type Signup,
  type InsertSignup,
  type Payment,
  type InsertPayment,
  type HelpRequest,
  type InsertHelpRequest,
  type NotificationPreferences,
  type InsertNotificationPreferences,
  type ServiceBillingInsert,
  type ServiceBillingSelect,
  type DiscountCode,
  type InsertDiscountCode,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: UpdateUser): Promise<User>;
  updateUserParent2Invite(userId: string, method: string, contact: string, invitedAt: Date): Promise<User>;
  updatePlayersParent2(parent1Id: string, parent2Id: string): Promise<void>;
  
  // Player operations
  getPlayersByParent(parentId: string): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player>;
  updatePlayerSettings(playerId: string, settings: { canAccessPortal?: boolean; canBookAndPay?: boolean }): Promise<Player>;
  updatePlayerInvite(playerId: string, method: string, invitedAt: Date): Promise<Player>;
  deletePlayer(id: string): Promise<void>;
  
  // Session operations
  getSessions(filters?: { ageGroup?: string; location?: string; status?: string }): Promise<FutsalSession[]>;
  getSession(id: string): Promise<FutsalSession | undefined>;
  createSession(session: InsertSession): Promise<FutsalSession>;
  updateSession(id: string, session: Partial<InsertSession>): Promise<FutsalSession>;
  updateSessionStatus(id: string, status: string): Promise<void>;
  
  // Signup operations
  getSignupsByParent(parentId: string): Promise<Array<Signup & { player: Player; session: FutsalSession }>>;
  getSignupsBySession(sessionId: string): Promise<Array<Signup & { player: Player }>>;
  createSignup(signup: InsertSignup): Promise<Signup>;
  deleteSignup(id: string): Promise<void>;
  checkExistingSignup(playerId: string, sessionId: string): Promise<Signup | undefined>;
  getSignupsCount(sessionId: string): Promise<number>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(signupId: string, paidAt: Date): Promise<void>;
  
  // Help request operations
  createHelpRequest(helpRequest: InsertHelpRequest): Promise<HelpRequest>;
  getHelpRequests(): Promise<HelpRequest[]>;
  
  // Notification preferences
  getNotificationPreferences(parentId: string): Promise<NotificationPreferences | undefined>;
  upsertNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences>;
  
  // Analytics
  getAnalytics(): Promise<{
    totalPlayers: number;
    monthlyRevenue: number;
    avgFillRate: number;
    activeSessions: number;
  }>;

  // Service billing operations
  getServiceBilling(): Promise<ServiceBillingSelect | undefined>;
  upsertServiceBilling(billing: ServiceBillingInsert): Promise<ServiceBillingSelect>;
  
  // Discount code operations
  getDiscountCodes(): Promise<DiscountCode[]>;
  getDiscountCode(code: string): Promise<DiscountCode | undefined>;
  createDiscountCode(discountCode: InsertDiscountCode): Promise<DiscountCode>;
  updateDiscountCode(id: string, discountCode: Partial<InsertDiscountCode>): Promise<DiscountCode>;
  deleteDiscountCode(id: string): Promise<void>;
  incrementDiscountCodeUsage(id: string): Promise<void>;
  
  // Access code validation
  validateSessionAccessCode(sessionId: string, accessCode: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserParent2Invite(userId: string, method: string, contact: string, invitedAt: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        parent2InviteSentVia: method,
        parent2InvitedAt: invitedAt,
        parent2InviteEmail: method === 'email' ? contact : null,
        parent2InvitePhone: method === 'sms' ? contact : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updatePlayersParent2(parent1Id: string, parent2Id: string): Promise<void> {
    await db
      .update(players)
      .set({ parent2Id: parent2Id })
      .where(eq(players.parentId, parent1Id));
  }

  async getPlayersByParent(parentId: string): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.parentId, parentId)).orderBy(desc(players.createdAt));
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }

  async updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player> {
    const [updatedPlayer] = await db.update(players).set(player).where(eq(players.id, id)).returning();
    return updatedPlayer;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }

  async updatePlayerSettings(playerId: string, settings: { canAccessPortal?: boolean; canBookAndPay?: boolean }): Promise<Player> {
    const [updatedPlayer] = await db
      .update(players)
      .set(settings)
      .where(eq(players.id, playerId))
      .returning();
    return updatedPlayer;
  }

  async updatePlayerInvite(playerId: string, method: string, invitedAt: Date): Promise<Player> {
    const [updatedPlayer] = await db
      .update(players)
      .set({
        inviteSentVia: method,
        invitedAt: invitedAt
      })
      .where(eq(players.id, playerId))
      .returning();
    return updatedPlayer;
  }

  async deletePlayer(id: string): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  async getSessions(filters?: { ageGroup?: string; location?: string; status?: string; gender?: string }): Promise<FutsalSession[]> {
    const conditions = [];
    
    if (filters?.ageGroup) {
      conditions.push(sql`${filters.ageGroup} = ANY(${futsalSessions.ageGroups})`);
    }
    if (filters?.location) {
      conditions.push(eq(futsalSessions.location, filters.location));
    }
    if (filters?.status) {
      conditions.push(eq(futsalSessions.status, filters.status as any));
    }
    if (filters?.gender) {
      conditions.push(sql`${filters.gender} = ANY(${futsalSessions.genders})`);
    }
    
    const baseQuery = db.select().from(futsalSessions);
    
    if (conditions.length > 0) {
      return await baseQuery.where(and(...conditions)).orderBy(futsalSessions.startTime);
    }
    
    return await baseQuery.orderBy(futsalSessions.startTime);
  }

  async getSession(id: string): Promise<FutsalSession | undefined> {
    const [session] = await db.select().from(futsalSessions).where(eq(futsalSessions.id, id));
    return session;
  }

  async createSession(session: InsertSession): Promise<FutsalSession> {
    const [newSession] = await db.insert(futsalSessions).values(session).returning();
    return newSession;
  }

  async updateSession(id: string, session: Partial<InsertSession>): Promise<FutsalSession> {
    const [updatedSession] = await db.update(futsalSessions).set(session).where(eq(futsalSessions.id, id)).returning();
    return updatedSession;
  }

  async updateSessionStatus(id: string, status: string): Promise<void> {
    await db.update(futsalSessions).set({ status: status as any }).where(eq(futsalSessions.id, id));
  }

  async getSignupsByParent(parentId: string): Promise<Array<Signup & { player: Player; session: FutsalSession }>> {
    const results = await db
      .select({
        // Signup fields
        id: signups.id,
        playerId: signups.playerId,
        sessionId: signups.sessionId,
        paid: signups.paid,
        paymentIntentId: signups.paymentIntentId,
        createdAt: signups.createdAt,
        // Player fields
        player: players,
        // Session fields
        session: futsalSessions,
      })
      .from(signups)
      .innerJoin(players, eq(signups.playerId, players.id))
      .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
      .where(eq(players.parentId, parentId))
      .orderBy(desc(futsalSessions.startTime));
    
    return results as Array<Signup & { player: Player; session: FutsalSession }>;
  }

  async getSignupsBySession(sessionId: string): Promise<Array<Signup & { player: Player }>> {
    const results = await db
      .select({
        // Signup fields
        id: signups.id,
        playerId: signups.playerId,
        sessionId: signups.sessionId,
        paid: signups.paid,
        paymentIntentId: signups.paymentIntentId,
        createdAt: signups.createdAt,
        // Player fields
        player: players,
      })
      .from(signups)
      .innerJoin(players, eq(signups.playerId, players.id))
      .where(eq(signups.sessionId, sessionId));
    
    return results as Array<Signup & { player: Player }>;
  }

  async createSignup(signup: InsertSignup): Promise<Signup> {
    const [newSignup] = await db.insert(signups).values(signup).returning();
    return newSignup;
  }

  async deleteSignup(id: string): Promise<void> {
    await db.delete(signups).where(eq(signups.id, id));
  }

  async checkExistingSignup(playerId: string, sessionId: string): Promise<Signup | undefined> {
    const [existing] = await db
      .select()
      .from(signups)
      .where(and(eq(signups.playerId, playerId), eq(signups.sessionId, sessionId)));
    return existing;
  }

  async getSignupsCount(sessionId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(signups)
      .where(eq(signups.sessionId, sessionId));
    return result.count;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(signupId: string, paidAt: Date): Promise<void> {
    await db.update(signups).set({ paid: true }).where(eq(signups.id, signupId));
  }

  async getPendingPaymentSignups(): Promise<Array<Signup & { player: Player; session: FutsalSession; parent: User }>> {
    const results = await db
      .select({
        // Signup fields
        id: signups.id,
        playerId: signups.playerId,
        sessionId: signups.sessionId,
        paid: signups.paid,
        paymentIntentId: signups.paymentIntentId,
        createdAt: signups.createdAt,
        // Player fields
        player: players,
        // Session fields
        session: futsalSessions,
        // Parent fields
        parent: users,
      })
      .from(signups)
      .innerJoin(players, eq(signups.playerId, players.id))
      .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
      .innerJoin(users, eq(players.parentId, users.id))
      .where(eq(signups.paid, false))
      .orderBy(desc(signups.createdAt));
    
    return results as Array<Signup & { player: Player; session: FutsalSession; parent: User }>;
  }

  async getSignupWithDetails(signupId: string): Promise<(Signup & { player: Player; session: FutsalSession; parent: User }) | undefined> {
    const [result] = await db
      .select({
        // Signup fields
        id: signups.id,
        playerId: signups.playerId,
        sessionId: signups.sessionId,
        paid: signups.paid,
        paymentIntentId: signups.paymentIntentId,
        createdAt: signups.createdAt,
        // Player fields
        player: players,
        // Session fields
        session: futsalSessions,
        // Parent fields
        parent: users,
      })
      .from(signups)
      .innerJoin(players, eq(signups.playerId, players.id))
      .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
      .innerJoin(users, eq(players.parentId, users.id))
      .where(eq(signups.id, signupId));
    
    return result as (Signup & { player: Player; session: FutsalSession; parent: User }) | undefined;
  }

  async updateSignupPaymentStatus(signupId: string, paid: boolean): Promise<Signup | undefined> {
    const [updatedSignup] = await db
      .update(signups)
      .set({ paid })
      .where(eq(signups.id, signupId))
      .returning();
    return updatedSignup;
  }

  async createHelpRequest(helpRequest: InsertHelpRequest): Promise<HelpRequest> {
    const [newRequest] = await db.insert(helpRequests).values(helpRequest).returning();
    return newRequest;
  }

  async getSystemSetting(key: string): Promise<string | null> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    return setting?.value || null;
  }

  async getHelpRequests(): Promise<HelpRequest[]> {
    return await db.select().from(helpRequests).orderBy(desc(helpRequests.createdAt));
  }

  async resolveHelpRequest(id: string, adminId: string, resolutionNote: string): Promise<HelpRequest | null> {
    const [result] = await db.update(helpRequests)
      .set({
        resolved: true,
        status: 'resolved',
        resolvedBy: adminId,
        resolutionNote,
        resolvedAt: new Date()
      })
      .where(eq(helpRequests.id, id))
      .returning();
    return result || null;
  }

  async getNotificationPreferences(parentId: string): Promise<NotificationPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.parentId, parentId));
    return prefs;
  }

  async upsertNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const [prefs] = await db
      .insert(notificationPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: notificationPreferences.parentId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return prefs;
  }

  async getAnalytics(): Promise<{
    totalPlayers: number;
    monthlyRevenue: number;
    avgFillRate: number;
    activeSessions: number;
  }> {
    const [playerCount] = await db.select({ count: count() }).from(players);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const [monthlyPayments] = await db
      .select({ total: count() })
      .from(payments)
      .where(gte(payments.paidAt, startOfMonth));
    
    const [activeSessionsCount] = await db
      .select({ count: count() })
      .from(futsalSessions)
      .where(eq(futsalSessions.status, "open"));
    
    return {
      totalPlayers: playerCount.count,
      monthlyRevenue: (monthlyPayments.total || 0) * 10, // $10 per session
      avgFillRate: 85, // This would need more complex calculation
      activeSessions: activeSessionsCount.count,
    };
  }

  async getServiceBilling(): Promise<ServiceBillingSelect | undefined> {
    const [billing] = await db.select().from(serviceBilling).limit(1);
    return billing;
  }

  async upsertServiceBilling(billingData: ServiceBillingInsert): Promise<ServiceBillingSelect> {
    // Check if record exists
    const existing = await this.getServiceBilling();
    
    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(serviceBilling)
        .set({
          ...billingData,
          updatedAt: new Date(),
        })
        .where(eq(serviceBilling.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(serviceBilling)
        .values(billingData)
        .returning();
      return created;
    }
  }
  
  // Discount code operations
  async getDiscountCodes(): Promise<DiscountCode[]> {
    return await db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt));
  }

  async getDiscountCode(code: string): Promise<DiscountCode | undefined> {
    const [discount] = await db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.code, code));
    return discount;
  }

  async createDiscountCode(discountCode: InsertDiscountCode): Promise<DiscountCode> {
    const [created] = await db
      .insert(discountCodes)
      .values(discountCode)
      .returning();
    return created;
  }

  async updateDiscountCode(id: string, discountCode: Partial<InsertDiscountCode>): Promise<DiscountCode> {
    const [updated] = await db
      .update(discountCodes)
      .set({
        ...discountCode,
        updatedAt: new Date(),
      })
      .where(eq(discountCodes.id, id))
      .returning();
    return updated;
  }

  async deleteDiscountCode(id: string): Promise<void> {
    await db.delete(discountCodes).where(eq(discountCodes.id, id));
  }

  async incrementDiscountCodeUsage(id: string): Promise<void> {
    await db
      .update(discountCodes)
      .set({
        currentUses: sql`${discountCodes.currentUses} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(discountCodes.id, id));
  }
  
  // Access code validation
  async validateSessionAccessCode(sessionId: string, accessCode: string): Promise<boolean> {
    const [session] = await db
      .select()
      .from(futsalSessions)
      .where(eq(futsalSessions.id, sessionId));
      
    if (!session || !session.hasAccessCode || !session.accessCode) {
      return true; // No access code required
    }
    
    return session.accessCode === accessCode;
  }
}

export const storage = new DatabaseStorage();
