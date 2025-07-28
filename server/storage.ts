import {
  tenants,
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
  type TenantSelect,
  type TenantInsert,
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
import { eq, desc, and, gte, lte, count, sql, or, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // Tenant operations
  getTenant(id: string): Promise<TenantSelect | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<TenantSelect | undefined>;
  getTenants(): Promise<TenantSelect[]>;
  createTenant(tenant: TenantInsert): Promise<TenantSelect>;
  updateTenant(id: string, tenant: Partial<TenantInsert>): Promise<TenantSelect>;
  deleteTenant(id: string): Promise<void>;
  
  // User operations (required for Replit Auth) - now tenant-aware
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: UpdateUser): Promise<User>;
  updateUserParent2Invite(userId: string, method: string, contact: string, invitedAt: Date): Promise<User>;
  updatePlayersParent2(parent1Id: string, parent2Id: string): Promise<void>;
  
  // Player operations - now tenant-aware
  getPlayersByParent(parentId: string, tenantId?: string): Promise<Player[]>;
  getPlayer(id: string, tenantId?: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player>;
  updatePlayerSettings(playerId: string, settings: { canAccessPortal?: boolean; canBookAndPay?: boolean }): Promise<Player>;
  updatePlayerInvite(playerId: string, method: string, invitedAt: Date): Promise<Player>;
  deletePlayer(id: string): Promise<void>;
  
  // Session operations - now tenant-aware
  getSessions(filters?: { ageGroup?: string; location?: string; status?: string; tenantId?: string }): Promise<FutsalSession[]>;
  getSession(id: string, tenantId?: string): Promise<FutsalSession | undefined>;
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
  
  // Super Admin operations
  getSuperAdminSessions(filters?: { tenantId?: string; ageGroup?: string; gender?: string; location?: string; dateFrom?: string; dateTo?: string; status?: string }): Promise<any[]>;
  getSuperAdminPayments(filters?: { tenantId?: string; status?: string; dateFrom?: string; dateTo?: string; amountMin?: number; amountMax?: number }): Promise<any[]>;
  getSuperAdminRegistrations(filters?: { tenantId?: string; type?: string; status?: string; dateFrom?: string; dateTo?: string }): Promise<any[]>;
  getSuperAdminParents(filters?: { tenantId?: string; search?: string; status?: string }): Promise<any[]>;
  getSuperAdminPlayers(filters?: { tenantId?: string; search?: string; ageGroup?: string; gender?: string; portalAccess?: string }): Promise<any[]>;
  getSuperAdminAnalytics(filters?: { tenants?: string[]; from?: string; to?: string; ageGroup?: string; gender?: string }): Promise<any>;
  getSuperAdminHelpRequests(filters?: { tenantId?: string; status?: string; priority?: string; dateFrom?: string; dateTo?: string }): Promise<any[]>;
  getSuperAdminSettings(): Promise<any>;
  updateSuperAdminSettings(settings: any): Promise<any>;
  getSuperAdminIntegrations(): Promise<any[]>;
  updateSuperAdminIntegration(id: string, data: any): Promise<any>;
  testSuperAdminIntegration(id: string): Promise<any>;
  getSuperAdminUsers(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Tenant operations
  async getTenant(id: string): Promise<TenantSelect | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantBySubdomain(subdomain: string): Promise<TenantSelect | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain));
    return tenant;
  }

  async getTenants(): Promise<TenantSelect[]> {
    return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async createTenant(tenant: TenantInsert): Promise<TenantSelect> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    return newTenant;
  }

  async updateTenant(id: string, tenant: Partial<TenantInsert>): Promise<TenantSelect> {
    const [updatedTenant] = await db.update(tenants).set(tenant).where(eq(tenants.id, id)).returning();
    return updatedTenant;
  }

  async deleteTenant(id: string): Promise<void> {
    await db.delete(tenants).where(eq(tenants.id, id));
  }

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

  async getPlayersByParent(parentId: string, tenantId?: string): Promise<Player[]> {
    const conditions = [eq(players.parentId, parentId)];
    if (tenantId) {
      conditions.push(eq(players.tenantId, tenantId));
    }
    return await db.select().from(players).where(and(...conditions)).orderBy(desc(players.createdAt));
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }

  async updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player> {
    const [updatedPlayer] = await db.update(players).set(player).where(eq(players.id, id)).returning();
    return updatedPlayer;
  }

  async getPlayer(id: string, tenantId?: string): Promise<Player | undefined> {
    const conditions = [eq(players.id, id)];
    if (tenantId) {
      conditions.push(eq(players.tenantId, tenantId));
    }
    const [player] = await db.select().from(players).where(and(...conditions));
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

  async getSessions(filters?: { ageGroup?: string; location?: string; status?: string; gender?: string; tenantId?: string; includePast?: boolean }): Promise<FutsalSession[]> {
    const conditions = [];
    
    if (filters?.tenantId) {
      conditions.push(eq(futsalSessions.tenantId, filters.tenantId));
    }
    
    // By default, only show future sessions unless explicitly requested to include past
    if (!filters?.includePast) {
      conditions.push(gte(futsalSessions.startTime, new Date()));
    }
    
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

  async getSession(id: string, tenantId?: string): Promise<FutsalSession | undefined> {
    const conditions = [eq(futsalSessions.id, id)];
    if (tenantId) {
      conditions.push(eq(futsalSessions.tenantId, tenantId));
    }
    const [session] = await db.select().from(futsalSessions).where(and(...conditions));
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
    const [newRequest] = await db.insert(helpRequests).values([helpRequest]).returning();
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

  // Super Admin operations
  async getSuperAdminSessions(filters?: { tenantId?: string; ageGroup?: string; gender?: string; location?: string; dateFrom?: string; dateTo?: string; status?: string }): Promise<any[]> {
    let query = db.select({
      id: futsalSessions.id,
      tenantId: futsalSessions.tenantId,
      tenantName: tenants.name,
      dateTime: futsalSessions.startTime,
      ageGroups: futsalSessions.ageGroups,
      genders: futsalSessions.genders,
      location: futsalSessions.location,
      capacity: futsalSessions.capacity,
      status: futsalSessions.status,
      signupsCount: sql<number>`COUNT(${signups.id})`,
    })
    .from(futsalSessions)
    .leftJoin(tenants, eq(futsalSessions.tenantId, tenants.id))
    .leftJoin(signups, eq(futsalSessions.id, signups.sessionId))
    .groupBy(futsalSessions.id, tenants.name);

    if (filters?.tenantId) {
      query = query.where(eq(futsalSessions.tenantId, filters.tenantId));
    }
    if (filters?.ageGroup) {
      // Note: ageGroups is an array, so we'd need array containment logic here
      // For now, skip this filter until proper array handling is implemented
    }
    if (filters?.status) {
      query = query.where(eq(futsalSessions.status, filters.status));
    }

    return await query;
  }

  async getSuperAdminPayments(filters?: { tenantId?: string; status?: string; dateFrom?: string; dateTo?: string; amountMin?: number; amountMax?: number }): Promise<any[]> {
    let query = db.select({
      id: payments.id,
      tenantId: payments.tenantId,
      tenantName: tenants.name,
      signupId: payments.signupId,
      playerName: sql<string>`${players.firstName} || ' ' || ${players.lastName}`,
      sessionDate: futsalSessions.startTime,
      amount: payments.amountCents,
      status: payments.status,
      paidAt: payments.paidAt,
      adminNotes: payments.adminNotes,
    })
    .from(payments)
    .leftJoin(tenants, eq(payments.tenantId, tenants.id))
    .leftJoin(signups, eq(payments.signupId, signups.id))
    .leftJoin(players, eq(signups.playerId, players.id))
    .leftJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id));

    if (filters?.tenantId) {
      query = query.where(eq(payments.tenantId, filters.tenantId));
    }
    if (filters?.status) {
      query = query.where(eq(payments.status, filters.status));
    }

    return await query;
  }

  async getSuperAdminRegistrations(filters?: { tenantId?: string; type?: string; status?: string; dateFrom?: string; dateTo?: string }): Promise<any[]> {
    // This would combine parent and player registrations
    // For now, return user registrations as a proxy
    let query = db.select({
      id: users.id,
      tenantId: users.tenantId,
      tenantName: tenants.name,
      type: sql<string>`'parent'`,
      name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      email: users.email,
      invitedAt: users.createdAt,
      status: sql<string>`CASE WHEN ${users.isApproved} THEN 'approved' ELSE 'pending' END`,
      approvedAt: users.createdAt,
    })
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id));

    if (filters?.tenantId) {
      query = query.where(eq(users.tenantId, filters.tenantId));
    }

    return await query;
  }

  async getSuperAdminParents(filters?: { tenantId?: string; search?: string; status?: string }): Promise<any[]> {
    let query = db.select({
      id: users.id,
      tenantId: users.tenantId,
      tenantName: tenants.name,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      registrationDate: users.createdAt,
      status: sql<string>`CASE WHEN ${users.isApproved} = true THEN 'active' ELSE 'pending' END`,
      registrationStatus: users.registrationStatus,
      playerCount: sql<number>`COUNT(${players.id})`,
      totalBookings: sql<number>`0`, // Would need to join with signups
      totalSpent: sql<number>`0`, // Would need to join with payments
      lastActivity: users.updatedAt,
    })
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .leftJoin(players, eq(users.id, players.parentId))
    .where(eq(users.isAdmin, false)) // Only get parent accounts, not admin accounts
    .groupBy(users.id, tenants.name, users.updatedAt)
    .orderBy(desc(users.createdAt));

    const conditions = [];
    if (filters?.tenantId && filters.tenantId !== 'all') {
      conditions.push(eq(users.tenantId, filters.tenantId));
    }
    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        conditions.push(eq(users.isApproved, true));
      } else if (filters.status === 'pending') {
        conditions.push(eq(users.isApproved, false));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  async getSuperAdminPlayers(filters?: { tenantId?: string; search?: string; ageGroup?: string; gender?: string; portalAccess?: string; dateFrom?: string; dateTo?: string }): Promise<any[]> {
    let query = db.select({
      id: players.id,
      tenantId: players.tenantId,
      tenantName: tenants.name,
      firstName: players.firstName,
      lastName: players.lastName,
      birthYear: players.birthYear,
      age: sql<number>`(2025 - ${players.birthYear})`,
      gender: players.gender,
      portalAccess: players.canAccessPortal,
      bookingPermission: players.canBookAndPay,
      parentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      parentEmail: users.email,
      registrationDate: players.createdAt,
      totalBookings: sql<number>`0`, // Would need to join with signups
      lastActivity: players.createdAt,
    })
    .from(players)
    .leftJoin(tenants, eq(players.tenantId, tenants.id))
    .leftJoin(users, eq(players.parentId, users.id))
    .orderBy(desc(players.createdAt));

    const conditions = [];
    if (filters?.tenantId && filters.tenantId !== 'all') {
      conditions.push(eq(players.tenantId, filters.tenantId));
    }
    if (filters?.gender && filters.gender !== 'all') {
      conditions.push(eq(players.gender, filters.gender as any));
    }
    if (filters?.portalAccess && filters.portalAccess !== 'all') {
      if (filters.portalAccess === 'yes') {
        conditions.push(eq(players.canAccessPortal, true));
      } else if (filters.portalAccess === 'no') {
        conditions.push(eq(players.canAccessPortal, false));
      }
    }
    if (filters?.ageGroup && filters.ageGroup !== 'all') {
      const ageGroupNum = parseInt(filters.ageGroup.replace('U', ''));
      conditions.push(sql`(2025 - ${players.birthYear}) <= ${ageGroupNum}`);
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(players.firstName, `%${filters.search}%`),
          ilike(players.lastName, `%${filters.search}%`),
          ilike(users.firstName, `%${filters.search}%`),
          ilike(users.lastName, `%${filters.search}%`),
          ilike(tenants.name, `%${filters.search}%`)
        )
      );
    }
    if (filters?.dateFrom) {
      conditions.push(gte(players.createdAt, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      conditions.push(lte(players.createdAt, new Date(filters.dateTo)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  async getSuperAdminAnalytics(filters?: { tenants?: string[]; from?: string; to?: string; ageGroup?: string; gender?: string }): Promise<any> {
    // Basic analytics aggregation across all tenants
    const totalRevenue = await db.select({
      value: sql<number>`SUM(${payments.amountCents})`,
    }).from(payments).where(eq(payments.status, 'paid'));

    const totalPlayers = await db.select({
      value: sql<number>`COUNT(*)`,
    }).from(players);

    const totalSessions = await db.select({
      value: sql<number>`COUNT(*)`,
    }).from(futsalSessions);

    const activeTenants = await db.select({
      value: sql<number>`COUNT(*)`,
    }).from(tenants);

    // Revenue by tenant
    const revenueByTenant = await db.select({
      tenantId: tenants.id,
      tenantName: tenants.name,
      revenue: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`,
      growth: sql<number>`0`, // Placeholder for growth calculation
    })
    .from(tenants)
    .leftJoin(payments, eq(tenants.id, payments.tenantId))
    .groupBy(tenants.id, tenants.name);

    return {
      totalRevenue: totalRevenue[0]?.value || 0,
      totalPlayers: totalPlayers[0]?.value || 0,
      totalSessions: totalSessions[0]?.value || 0,
      activeTenants: activeTenants[0]?.value || 0,
      revenueGrowth: 0,
      playersGrowth: 0,
      sessionsGrowth: 0,
      tenantGrowth: 0,
      revenueByTenant,
      playersByTenant: [],
      sessionsByTenant: [],
    };
  }

  async getSuperAdminHelpRequests(filters?: { tenantId?: string; status?: string; priority?: string; dateFrom?: string; dateTo?: string }): Promise<any[]> {
    let query = db.select({
      id: helpRequests.id,
      tenantId: helpRequests.tenantId,
      tenantName: tenants.name,
      firstName: helpRequests.firstName,
      lastName: helpRequests.lastName,
      email: helpRequests.email,
      phone: helpRequests.phone,
      subject: helpRequests.subject,
      category: helpRequests.category,
      priority: helpRequests.priority,
      status: helpRequests.status,
      message: helpRequests.message,
      resolved: helpRequests.resolved,
      resolvedBy: helpRequests.resolvedBy,
      resolvedAt: helpRequests.resolvedAt,
      replyHistory: helpRequests.replyHistory,
      createdAt: helpRequests.createdAt,
    })
    .from(helpRequests)
    .leftJoin(tenants, eq(helpRequests.tenantId, tenants.id))
    .orderBy(desc(helpRequests.createdAt));

    const conditions = [];
    if (filters?.tenantId && filters.tenantId !== 'all') {
      conditions.push(eq(helpRequests.tenantId, filters.tenantId));
    }
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(helpRequests.status, filters.status));
    }
    if (filters?.priority && filters.priority !== 'all') {
      conditions.push(eq(helpRequests.priority, filters.priority));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  async getSuperAdminSettings(): Promise<any> {
    // Mock platform settings for now
    return {
      autoApproveTenants: false,
      enableMfaByDefault: true,
      defaultBookingWindowHours: 24,
      maxTenantsPerAdmin: 5,
      enableTenantSubdomains: true,
      requireTenantApproval: true,
      defaultSessionCapacity: 15,
      platformMaintenanceMode: false,
    };
  }

  async updateSuperAdminSettings(settings: any): Promise<any> {
    // Mock implementation - would update platform settings table
    return settings;
  }

  async getSuperAdminIntegrations(): Promise<any[]> {
    // Mock integrations for now
    return [
      {
        id: '1',
        name: 'SendGrid',
        type: 'email',
        enabled: true,
        status: 'connected',
        config: {}
      },
      {
        id: '2',
        name: 'Twilio',
        type: 'sms',
        enabled: false,
        status: 'disconnected',
        config: {}
      },
      {
        id: '3',
        name: 'Google OAuth',
        type: 'oauth',
        enabled: true,
        status: 'connected',
        config: {}
      },
      {
        id: '4',
        name: 'Payment Webhook',
        type: 'webhook',
        enabled: true,
        status: 'connected',
        config: { url: 'https://api.example.com/webhook' }
      }
    ];
  }

  async updateSuperAdminIntegration(id: string, data: any): Promise<any> {
    // Mock implementation - would update integration settings
    return { id, ...data };
  }

  async testSuperAdminIntegration(id: string): Promise<any> {
    // Mock implementation - would test integration
    return { success: true, message: 'Integration test successful' };
  }

  async getSuperAdminUsers(): Promise<any[]> {
    const superAdminUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: sql<string>`CASE WHEN ${users.isSuperAdmin} = true THEN 'super-admin' ELSE 'platform-admin' END`,
      status: sql<string>`'active'`, // Default to active since no isActive field exists
      lastLogin: users.createdAt, // Placeholder
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.isSuperAdmin, true));

    return superAdminUsers;
  }
}

export const storage = new DatabaseStorage();
