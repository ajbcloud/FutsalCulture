import {
  users,
  players,
  futsalSessions,
  signups,
  payments,
  helpRequests,
  notificationPreferences,
  type User,
  type UpsertUser,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
      conditions.push(eq(futsalSessions.ageGroup, filters.ageGroup));
    }
    if (filters?.location) {
      conditions.push(eq(futsalSessions.location, filters.location));
    }
    if (filters?.status) {
      conditions.push(eq(futsalSessions.status, filters.status as any));
    }
    if (filters?.gender) {
      conditions.push(eq(futsalSessions.gender, filters.gender as any));
    }
    
    let query = db.select().from(futsalSessions);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(futsalSessions.startTime);
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
    return await db
      .select()
      .from(signups)
      .innerJoin(players, eq(signups.playerId, players.id))
      .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
      .where(eq(players.parentId, parentId))
      .orderBy(desc(futsalSessions.startTime));
  }

  async getSignupsBySession(sessionId: string): Promise<Array<Signup & { player: Player }>> {
    return await db
      .select()
      .from(signups)
      .innerJoin(players, eq(signups.playerId, players.id))
      .where(eq(signups.sessionId, sessionId));
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
    await db.update(payments).set({ paidAt }).where(eq(payments.signupId, signupId));
  }

  async createHelpRequest(helpRequest: InsertHelpRequest): Promise<HelpRequest> {
    const [newRequest] = await db.insert(helpRequests).values(helpRequest).returning();
    return newRequest;
  }

  async getHelpRequests(): Promise<HelpRequest[]> {
    return await db.select().from(helpRequests).orderBy(desc(helpRequests.createdAt));
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
}

export const storage = new DatabaseStorage();
