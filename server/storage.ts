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
  waitlists,
  devSkillCategories,
  devSkills,
  devSkillRubrics,
  playerAssessments,
  playerAssessmentItems,
  playerGoals,
  playerGoalUpdates,
  type TenantSelect,
  type TenantInsert,
  type User,
  type UpsertUser,
  type UpdateUser,
  type Player,
  type PlayerWithSessionCount,
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
  type Waitlist,
  type InsertWaitlist,
  type JoinWaitlist,
  type LeaveWaitlist,
  type PromoteWaitlist,
  type WaitlistSettings,
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
  getPlayersByParent(parentId: string, tenantId?: string): Promise<PlayerWithSessionCount[]>;
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

  // Waitlist operations
  getWaitlistBySession(sessionId: string, tenantId?: string): Promise<Array<Waitlist & { player: Player; parent: User }>>;
  getWaitlistByParent(parentId: string, tenantId?: string): Promise<Array<Waitlist & { session: FutsalSession; player: Player }>>;
  getWaitlistEntry(sessionId: string, playerId: string): Promise<Waitlist | undefined>;
  joinWaitlist(sessionId: string, playerId: string, parentId: string, tenantId: string, preferences: { notifyOnJoin?: boolean; notifyOnPositionChange?: boolean }): Promise<Waitlist>;
  leaveWaitlist(sessionId: string, playerId: string): Promise<void>;
  getWaitlistCount(sessionId: string): Promise<number>;
  promoteFromWaitlist(sessionId: string, playerId?: string): Promise<Waitlist | null>;
  expireWaitlistOffer(waitlistId: string): Promise<void>;
  updateWaitlistSettings(sessionId: string, settings: WaitlistSettings): Promise<FutsalSession>;
  getExpiredOffers(tenantId?: string): Promise<Waitlist[]>;
  reorderWaitlist(sessionId: string): Promise<void>;
  cleanupExpiredWaitlists(): Promise<number>;
  
  // Waitlist offer operations
  getPlayerOffers(parentId: string, tenantId?: string): Promise<Array<Waitlist & { session: FutsalSession; player: Player }>>;
  createWaitlistOffer(waitlistId: string, paymentWindowMinutes: number): Promise<Waitlist>;
  acceptWaitlistOffer(offerId: string): Promise<{ waitlist: Waitlist; paymentUrl: string }>;
  cancelWaitlistOffer(offerId: string): Promise<void>;
  processExpiredOffers(tenantId?: string): Promise<number>;
  
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
  getSuperAdminUserCount(): Promise<number>;
  getSuperAdminTotalRevenue(): Promise<number>;
  getSuperAdminSessionCount(): Promise<number>;
  getSuperAdminPlayerCount(): Promise<number>;
  getSuperAdminDashboardMetrics(fromDate: Date, toDate: Date): Promise<any>;
  getSuperAdminAlerts(): Promise<any[]>;
  getSuperAdminUsageTrends(timeRange: string): Promise<any[]>;
  getSuperAdminTenantDetails(tenantId: string): Promise<any>;
  updateTenantStatus(tenantId: string, status: string): Promise<any>;
  getSuperAdminUsers(filters?: any): Promise<any[]>;
  createSuperAdminUser(userData: { email: string; firstName: string; lastName: string; role: 'super-admin' | 'platform-admin' }): Promise<any>;
  updateUserStatus(userId: string, status: string): Promise<any>;
  sendPasswordReset(userId: string): Promise<void>;
  exportSuperAdminUsers(): Promise<string>;
  getSuperAdminAnalytics(filters?: any): Promise<any>;
  exportSuperAdminAnalytics(filters?: any): Promise<string>;
  getSuperAdminSettings(): Promise<any>;
  updateSuperAdminSettings(section: string, data: any): Promise<any>;
  testIntegration(type: string, config: any): Promise<any>;
  getSuperAdminSessions(filters?: { tenantId?: string; ageGroup?: string; gender?: string; location?: string; dateFrom?: string; dateTo?: string; status?: string }): Promise<any[]>;
  getSuperAdminPayments(filters?: { tenantId?: string; status?: string; dateFrom?: string; dateTo?: string; amountMin?: number; amountMax?: number }): Promise<any[]>;
  getSuperAdminRegistrations(filters?: { tenantId?: string; type?: string; status?: string; dateFrom?: string; dateTo?: string }): Promise<any[]>;
  getSuperAdminParents(filters?: { tenantId?: string; search?: string; status?: string }): Promise<any[]>;
  getSuperAdminPlayers(filters?: { tenantId?: string; search?: string; ageGroup?: string; gender?: string; portalAccess?: string; parentId?: string }): Promise<any[]>;
  getSuperAdminHelpRequests(filters?: { tenantId?: string; status?: string; priority?: string; dateFrom?: string; dateTo?: string }): Promise<any[]>;
  
  // Player Development operations
  getDevSkillCategories(tenantId: string): Promise<any[]>;
  createDevSkillCategory(data: any): Promise<any>;
  updateDevSkillCategory(id: string, tenantId: string, data: any): Promise<any>;
  deleteDevSkillCategory(id: string, tenantId: string): Promise<void>;
  
  getDevSkills(tenantId: string, filters?: { categoryId?: string; ageBand?: string; sport?: string; status?: string }): Promise<any[]>;
  createDevSkill(data: any): Promise<any>;
  updateDevSkill(id: string, tenantId: string, data: any): Promise<any>;
  deleteDevSkill(id: string, tenantId: string): Promise<void>;
  
  getDevSkillRubrics(skillId: string, tenantId: string): Promise<any[]>;
  upsertDevSkillRubrics(skillId: string, tenantId: string, rubrics: any[]): Promise<any[]>;
  
  getPlayerAssessments(tenantId: string, filters?: { playerId?: string; assessedBy?: string; startDate?: string; endDate?: string }): Promise<any[]>;
  getPlayerAssessmentWithSkills(id: string, tenantId: string): Promise<any | null>;
  createPlayerAssessment(assessment: any, skillAssessments: any[]): Promise<any>;
  updatePlayerAssessment(id: string, tenantId: string, assessment: any, skillAssessments: any[]): Promise<any>;
  deletePlayerAssessment(id: string, tenantId: string): Promise<void>;
  
  getPlayerGoals(tenantId: string, filters?: { playerId?: string; status?: string; createdBy?: string }): Promise<any[]>;
  getPlayerGoalWithUpdates(id: string, tenantId: string): Promise<any | null>;
  createPlayerGoal(data: any): Promise<any>;
  updatePlayerGoal(id: string, tenantId: string, data: any): Promise<any>;
  createPlayerGoalUpdate(data: any): Promise<any>;
  deletePlayerGoal(id: string, tenantId: string): Promise<void>;
  
  getPlayerDevelopmentAnalytics(tenantId: string, filters?: { playerId?: string; startDate?: string; endDate?: string; skillCategoryId?: string }): Promise<any>;
  getPlayerProgressSnapshots(playerId: string, tenantId: string, filters?: { startDate?: string; endDate?: string; skillId?: string }): Promise<any[]>;
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

  async getPlayersByParent(parentId: string, tenantId?: string): Promise<PlayerWithSessionCount[]> {
    const conditions = [eq(players.parentId, parentId)];
    if (tenantId) {
      conditions.push(eq(players.tenantId, tenantId));
    }
    
    // Get players with session counts using a simpler approach
    const playersList = await db.select()
      .from(players)
      .where(and(...conditions))
      .orderBy(desc(players.createdAt));

    // Add session counts manually
    const playersWithCounts: PlayerWithSessionCount[] = [];
    for (const player of playersList) {
      const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
        .from(signups)
        .where(and(
          eq(signups.playerId, player.id),
          eq(signups.paid, true)
        ));
      
      playersWithCounts.push({
        ...player,
        sessionCount: countResult?.count || 0
      });
    }

    return playersWithCounts;
  }

  async getParentsByTenant(tenantId: string): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.tenantId, tenantId))
      .orderBy(users.firstName, users.lastName);
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
    
    const baseQuery = db.select({
      id: futsalSessions.id,
      tenantId: futsalSessions.tenantId,
      title: futsalSessions.title,
      location: futsalSessions.location,
      // Structured location fields
      locationName: futsalSessions.locationName,
      addressLine1: futsalSessions.addressLine1,
      addressLine2: futsalSessions.addressLine2,
      city: futsalSessions.city,
      state: futsalSessions.state,
      postalCode: futsalSessions.postalCode,
      country: futsalSessions.country,
      lat: futsalSessions.lat,
      lng: futsalSessions.lng,
      gmapsPlaceId: futsalSessions.gmapsPlaceId,
      ageGroups: futsalSessions.ageGroups,
      genders: futsalSessions.genders,
      startTime: futsalSessions.startTime,
      endTime: futsalSessions.endTime,
      capacity: futsalSessions.capacity,
      priceCents: futsalSessions.priceCents,
      status: futsalSessions.status,
      bookingOpenHour: futsalSessions.bookingOpenHour,
      bookingOpenMinute: futsalSessions.bookingOpenMinute,
      noTimeConstraints: futsalSessions.noTimeConstraints,
      daysBeforeBooking: futsalSessions.daysBeforeBooking,
      hasAccessCode: futsalSessions.hasAccessCode,
      accessCode: futsalSessions.accessCode,
      waitlistEnabled: futsalSessions.waitlistEnabled,
      waitlistLimit: futsalSessions.waitlistLimit,
      paymentWindowMinutes: futsalSessions.paymentWindowMinutes,
      autoPromote: futsalSessions.autoPromote,
      createdAt: futsalSessions.createdAt,
    }).from(futsalSessions);
    
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
    const [session] = await db.select({
      id: futsalSessions.id,
      tenantId: futsalSessions.tenantId,
      title: futsalSessions.title,
      location: futsalSessions.location,
      // Structured location fields
      locationName: futsalSessions.locationName,
      addressLine1: futsalSessions.addressLine1,
      addressLine2: futsalSessions.addressLine2,
      city: futsalSessions.city,
      state: futsalSessions.state,
      postalCode: futsalSessions.postalCode,
      country: futsalSessions.country,
      lat: futsalSessions.lat,
      lng: futsalSessions.lng,
      gmapsPlaceId: futsalSessions.gmapsPlaceId,
      ageGroups: futsalSessions.ageGroups,
      genders: futsalSessions.genders,
      startTime: futsalSessions.startTime,
      endTime: futsalSessions.endTime,
      capacity: futsalSessions.capacity,
      priceCents: futsalSessions.priceCents,
      status: futsalSessions.status,
      bookingOpenHour: futsalSessions.bookingOpenHour,
      bookingOpenMinute: futsalSessions.bookingOpenMinute,
      noTimeConstraints: futsalSessions.noTimeConstraints,
      daysBeforeBooking: futsalSessions.daysBeforeBooking,
      hasAccessCode: futsalSessions.hasAccessCode,
      accessCode: futsalSessions.accessCode,
      waitlistEnabled: futsalSessions.waitlistEnabled,
      waitlistLimit: futsalSessions.waitlistLimit,
      paymentWindowMinutes: futsalSessions.paymentWindowMinutes,
      autoPromote: futsalSessions.autoPromote,
      createdAt: futsalSessions.createdAt,
    }).from(futsalSessions).where(and(...conditions));
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
        reservationExpiresAt: signups.reservationExpiresAt,
        createdAt: signups.createdAt,
        // Player fields
        player: players,
        // Session fields with structured location data
        session: {
          id: futsalSessions.id,
          tenantId: futsalSessions.tenantId,
          title: futsalSessions.title,
          location: futsalSessions.location,
          locationName: futsalSessions.locationName,
          addressLine1: futsalSessions.addressLine1,
          addressLine2: futsalSessions.addressLine2,
          city: futsalSessions.city,
          state: futsalSessions.state,
          postalCode: futsalSessions.postalCode,
          country: futsalSessions.country,
          lat: futsalSessions.lat,
          lng: futsalSessions.lng,
          gmapsPlaceId: futsalSessions.gmapsPlaceId,
          ageGroups: futsalSessions.ageGroups,
          genders: futsalSessions.genders,
          startTime: futsalSessions.startTime,
          endTime: futsalSessions.endTime,
          capacity: futsalSessions.capacity,
          priceCents: futsalSessions.priceCents,
          status: futsalSessions.status,
          bookingOpenHour: futsalSessions.bookingOpenHour,
          bookingOpenMinute: futsalSessions.bookingOpenMinute,
          hasAccessCode: futsalSessions.hasAccessCode,
          accessCode: futsalSessions.accessCode,
          createdAt: futsalSessions.createdAt,
        },
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
        reservationExpiresAt: signups.reservationExpiresAt,
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

  async getPendingPaymentSignups(tenantId?: string): Promise<Array<Signup & { player: Player; session: FutsalSession; parent: User }>> {
    const results = await db
      .select({
        // Signup fields
        id: signups.id,
        tenantId: signups.tenantId,
        playerId: signups.playerId,
        sessionId: signups.sessionId,
        paid: signups.paid,
        paymentIntentId: signups.paymentIntentId,
        paymentId: signups.paymentId,
        paymentProvider: signups.paymentProvider,
        createdAt: signups.createdAt,
        updatedAt: signups.updatedAt,
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
      .where(
        tenantId 
          ? and(eq(signups.paid, false), eq(signups.tenantId, tenantId))
          : eq(signups.paid, false)
      )
      .orderBy(desc(signups.createdAt));
    
    return results as Array<Signup & { player: Player; session: FutsalSession; parent: User }>;
  }

  async getPaidPaymentSignups(tenantId?: string): Promise<Array<Signup & { player: Player; session: FutsalSession; parent: User; transactionId?: string; paymentProvider?: string }>> {
    const results = await db
      .select({
        // Signup fields including transaction details
        id: signups.id,
        tenantId: signups.tenantId,
        playerId: signups.playerId,
        sessionId: signups.sessionId,
        paid: signups.paid,
        paymentIntentId: signups.paymentIntentId,
        paymentId: signups.paymentId,
        paymentProvider: signups.paymentProvider,
        createdAt: signups.createdAt,
        updatedAt: signups.updatedAt,
        // Player fields
        player: players,
        // Session fields
        session: futsalSessions,
        // Parent fields
        parent: users,
        // Payment record fields (for refund information)
        paymentStatus: payments.status,
        refundedAt: payments.refundedAt,
        refundReason: payments.refundReason,
      })
      .from(signups)
      .innerJoin(players, eq(signups.playerId, players.id))
      .innerJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
      .innerJoin(users, eq(players.parentId, users.id))
      .leftJoin(payments, eq(payments.signupId, signups.id))
      .where(
        tenantId 
          ? and(eq(signups.paid, true), eq(signups.tenantId, tenantId))
          : eq(signups.paid, true)
      )
      .orderBy(desc(signups.createdAt));
    
    return results.map(result => ({
      ...result,
      transactionId: result.paymentId,
      // Add refund status to help with frontend display
      status: result.refundedAt ? 'refunded' : 'paid',
    })) as Array<Signup & { player: Player; session: FutsalSession; parent: User; transactionId?: string; paymentProvider?: string }>;
  }

  async processRefund(paymentId: string, reason: string, adminUserId: string): Promise<any> {
    return await db.transaction(async (tx) => {
      // Find the payment record
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.signupId, paymentId));

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment record with refund information
      const [updatedPayment] = await tx
        .update(payments)
        .set({
          status: 'refunded',
          refundedAt: new Date(),
          refundReason: reason,
          refundedBy: adminUserId,
        })
        .where(eq(payments.signupId, paymentId))
        .returning();

      return updatedPayment;
    });
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

  async getHelpRequests(tenantId?: string): Promise<any[]> {
    let query = db.select({
      id: helpRequests.id,
      tenantId: helpRequests.tenantId,
      status: helpRequests.status,
      firstName: helpRequests.firstName,
      lastName: helpRequests.lastName,
      phone: helpRequests.phone,
      email: helpRequests.email,
      subject: helpRequests.subject,
      category: helpRequests.category,
      priority: helpRequests.priority,
      message: helpRequests.message,
      source: helpRequests.source,
      resolved: helpRequests.resolved,
      resolvedBy: helpRequests.resolvedBy,
      resolutionNote: helpRequests.resolutionNote,
      resolvedAt: helpRequests.resolvedAt,
      replyHistory: helpRequests.replyHistory,
      createdAt: helpRequests.createdAt,
    })
    .from(helpRequests);

    if (tenantId) {
      query = query.where(eq(helpRequests.tenantId, tenantId));
    }

    const requests = await query.orderBy(desc(helpRequests.createdAt));

    // For each request, check if email matches a parent or player
    const requestsWithUserLinks = await Promise.all(
      requests.map(async (request) => {
        let linkedUser = null;
        let userType = null;

        // First check if email matches a parent (user)
        const parentMatch = await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(and(
          eq(users.email, request.email),
          tenantId ? eq(users.tenantId, tenantId) : sql`true`
        ))
        .limit(1);

        if (parentMatch.length > 0) {
          linkedUser = parentMatch[0];
          userType = 'parent';
        } else {
          // Check if email matches a player
          const playerMatch = await db.select({
            id: players.id,
            firstName: players.firstName,
            lastName: players.lastName,
            email: players.email,
          })
          .from(players)
          .where(and(
            eq(players.email, request.email),
            tenantId ? eq(players.tenantId, tenantId) : sql`true`
          ))
          .limit(1);

          if (playerMatch.length > 0) {
            linkedUser = playerMatch[0];
            userType = 'player';
          }
        }

        return {
          ...request,
          linkedUser,
          userType,
        };
      })
    );

    return requestsWithUserLinks;
  }

  async replyToHelpRequest(id: string, message: string, adminId: string): Promise<HelpRequest | null> {
    // Get current help request
    const [request] = await db
      .select()
      .from(helpRequests)
      .where(eq(helpRequests.id, id));
    
    if (!request) return null;

    // Update reply history
    const replyHistory = request.replyHistory || [];
    replyHistory.push({
      message,
      repliedAt: new Date().toISOString(),
      repliedBy: adminId
    });

    // Update the help request
    const [result] = await db.update(helpRequests)
      .set({
        status: 'replied',
        replyHistory
      })
      .where(eq(helpRequests.id, id))
      .returning();
    
    return result || null;
  }

  async resolveHelpRequest(id: string, adminId: string, resolutionNote?: string): Promise<HelpRequest | null> {
    const [result] = await db.update(helpRequests)
      .set({
        resolved: true,
        status: 'resolved',
        resolvedBy: adminId,
        resolutionNote: resolutionNote || '',
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

  async validateDiscountCode(code: string, tenantId: string, playerId?: string, parentId?: string): Promise<{
    valid: boolean;
    discountCode?: DiscountCode;
    error?: string;
  }> {
    // Get the discount code
    const [discountCode] = await db
      .select()
      .from(discountCodes)
      .where(and(
        eq(discountCodes.code, code),
        eq(discountCodes.tenantId, tenantId)
      ));

    if (!discountCode) {
      return { valid: false, error: "Discount code not found" };
    }

    // Check if code is active
    if (!discountCode.isActive) {
      return { valid: false, error: "Discount code is not active" };
    }

    // Check time validity
    const now = new Date();
    if (discountCode.validFrom && new Date(discountCode.validFrom) > now) {
      return { valid: false, error: "Discount code is not yet valid" };
    }
    if (discountCode.validUntil && new Date(discountCode.validUntil) < now) {
      return { valid: false, error: "Discount code has expired" };
    }

    // Check usage limits
    if (discountCode.maxUses && discountCode.currentUses >= discountCode.maxUses) {
      return { valid: false, error: "Discount code has reached its usage limit" };
    }

    // Check player restriction
    if (discountCode.lockedToPlayerId) {
      if (!playerId || discountCode.lockedToPlayerId !== playerId) {
        return { valid: false, error: "This discount code is not available for the selected player" };
      }
    }

    // Check parent restriction
    if (discountCode.lockedToParentId) {
      if (!parentId || discountCode.lockedToParentId !== parentId) {
        return { valid: false, error: "This discount code is not available for your account" };
      }
    }

    return { valid: true, discountCode };
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

  async getSuperAdminPlayers(filters?: { tenantId?: string; search?: string; ageGroup?: string; gender?: string; portalAccess?: string; dateFrom?: string; dateTo?: string; parentId?: string }): Promise<any[]> {
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
    if (filters?.parentId) {
      conditions.push(eq(players.parentId, filters.parentId));
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

  // Basic Super Admin Stats
  async getSuperAdminUserCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result.count;
  }

  async getSuperAdminTotalRevenue(): Promise<number> {
    const [result] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)` 
    }).from(payments).where(eq(payments.status, 'paid'));
    return result.total || 0;
  }

  async getSuperAdminSessionCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(futsalSessions);
    return result.count;
  }

  async getSuperAdminPlayerCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(players);
    return result.count;
  }

  // Dashboard Metrics
  async getSuperAdminDashboardMetrics(fromDate: Date, toDate: Date): Promise<any> {
    // Recent Activity
    const recentActivity = [
      { type: 'user_signup', message: 'New user registered', timestamp: new Date(), tenantName: 'Futsal Culture' },
      { type: 'payment', message: 'Payment received $20.00', timestamp: new Date(), tenantName: 'Elite Academy' },
      { type: 'session', message: 'Session created', timestamp: new Date(), tenantName: 'Futsal Culture' }
    ];

    // Growth Metrics (mock for now)
    const growthMetrics = {
      userGrowth: 15.2,
      revenueGrowth: 8.7,
      sessionGrowth: 12.1,
      tenantGrowth: 5.0
    };

    // Platform Health
    const systemHealth = {
      uptime: '99.9%',
      avgResponseTime: '120ms',
      errorRate: '0.01%',
      activeConnections: 1247
    };

    return {
      recentActivity,
      growthMetrics,
      systemHealth,
      totalUsers: await this.getSuperAdminUserCount(),
      totalRevenue: await this.getSuperAdminTotalRevenue(),
      totalSessions: await this.getSuperAdminSessionCount(),
      totalPlayers: await this.getSuperAdminPlayerCount()
    };
  }

  async getSuperAdminAlerts(): Promise<any[]> {
    return [
      { id: '1', type: 'warning', title: 'High Memory Usage', message: 'Server memory at 85%', timestamp: new Date() },
      { id: '2', type: 'info', title: 'Backup Completed', message: 'Daily backup successful', timestamp: new Date() }
    ];
  }

  async getSuperAdminUsageTrends(timeRange: string): Promise<any[]> {
    // Mock usage trends data
    const trends = [];
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 100) + 50,
        sessions: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 1000) + 500
      });
    }
    
    return trends;
  }

  async getSuperAdminTenantDetails(tenantId: string): Promise<any> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return null;

    // Get tenant stats
    const userCount = await db.select({ count: count() })
      .from(users)
      .where(eq(users.tenantId, tenantId));
    
    const playerCount = await db.select({ count: count() })
      .from(players)
      .where(eq(players.tenantId, tenantId));

    const sessionCount = await db.select({ count: count() })
      .from(futsalSessions)
      .where(eq(futsalSessions.tenantId, tenantId));

    const revenue = await db.select({ 
      total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` 
    })
    .from(payments)
    .leftJoin(signups, eq(payments.signupId, signups.id))
    .leftJoin(futsalSessions, eq(signups.sessionId, futsalSessions.id))
    .where(eq(futsalSessions.tenantId, tenantId));

    // Get users for this tenant
    const tenantUsers = await db.select()
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .limit(10);

    return {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      status: 'active',
      plan: 'pro',
      stats: {
        totalUsers: userCount[0].count,
        activePlayers: playerCount[0].count,
        sessionsThisMonth: sessionCount[0].count,
        revenueThisMonth: revenue[0].total
      },
      users: tenantUsers.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin,
        lastLogin: user.createdAt,
        status: 'active'
      })),
      settings: {}
    };
  }

  async updateTenantStatus(tenantId: string, status: string): Promise<any> {
    // In a real implementation, we'd have a status field on tenants
    const tenant = await this.getTenant(tenantId);
    return { ...tenant, status };
  }

  async createSuperAdminUser(userData: { email: string; firstName: string; lastName: string; role: 'super-admin' | 'platform-admin' }): Promise<any> {
    const userId = nanoid();
    
    const newUser = {
      id: userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isAdmin: true,
      isSuperAdmin: userData.role === 'super-admin',
      phone: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isApproved: true,
      registrationStatus: 'completed' as const,
      tenantId: null // Super admins don't belong to specific tenants
    };
    
    await db.insert(users).values(newUser);
    
    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: userData.role,
      status: 'active',
      lastLogin: newUser.createdAt.toISOString(),
      createdAt: newUser.createdAt.toISOString(),
    };
  }

  async updateUserStatus(userId: string, status: string): Promise<any> {
    // In a real implementation, we'd have a status field
    const user = await this.getUser(userId);
    return { ...user, status };
  }

  async sendPasswordReset(userId: string): Promise<void> {
    // Mock implementation - would send actual password reset email
  }

  async exportSuperAdminUsers(): Promise<string> {
    const users = await this.getSuperAdminUsers();
    
    // Convert to CSV
    const headers = ['ID', 'Name', 'Email', 'Role', 'Organization', 'Status', 'Created'];
    const rows = users.map(user => [
      user.id,
      `${user.firstName} ${user.lastName}`,
      user.email,
      user.isSuperAdmin ? 'Super Admin' : user.isAdmin ? 'Admin' : 'User',
      user.tenantName || 'N/A',
      user.status,
      user.createdAt
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  async getSuperAdminAnalytics(filters?: any): Promise<any> {
    // Mock analytics data with realistic structure
    const platformGrowth = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      platformGrowth.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 50) + 100,
        revenue: Math.floor(Math.random() * 2000) + 1000,
        sessions: Math.floor(Math.random() * 20) + 10,
        tenants: Math.floor(Math.random() * 2) + 5
      });
    }

    const tenantActivity = [
      { name: 'Futsal Culture', users: 45, sessions: 67, revenue: 1340, growth: 12.5 },
      { name: 'Elite Academy', users: 38, sessions: 52, revenue: 1040, growth: 8.2 },
      { name: 'Pro Skills', users: 29, sessions: 41, revenue: 820, growth: 15.1 }
    ];

    const ageGroupDistribution = [
      { ageGroup: 'U8', count: 45, percentage: 18 },
      { ageGroup: 'U10', count: 67, percentage: 27 },
      { ageGroup: 'U12', count: 52, percentage: 21 },
      { ageGroup: 'U14', count: 38, percentage: 15 },
      { ageGroup: 'U16', count: 29, percentage: 12 },
      { ageGroup: 'U18', count: 19, percentage: 7 }
    ];

    const monthlyMetrics = {
      totalRevenue: await this.getSuperAdminTotalRevenue(),
      revenueGrowth: 8.5,
      totalUsers: await this.getSuperAdminUserCount(),
      userGrowth: 12.3,
      totalSessions: await this.getSuperAdminSessionCount(),
      sessionGrowth: 15.7,
      activeTenants: (await this.getTenants()).length,
      tenantGrowth: 25.0
    };

    return {
      platformGrowth,
      tenantActivity,
      ageGroupDistribution,
      monthlyMetrics
    };
  }

  async exportSuperAdminAnalytics(filters?: any): Promise<string> {
    const analytics = await this.getSuperAdminAnalytics(filters);
    
    // Convert platform growth to CSV
    const headers = ['Date', 'Users', 'Revenue', 'Sessions', 'Tenants'];
    const rows = analytics.platformGrowth.map((day: any) => [
      day.date,
      day.users,
      day.revenue,
      day.sessions,
      day.tenants
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  async getSuperAdminSettings(): Promise<any> {
    return {
      general: {
        platformName: 'PlayHQ',
        supportEmail: 'support@playhq.app',
        termsOfService: 'Terms of service content...',
        privacyPolicy: 'Privacy policy content...',
        maintenanceMode: false,
        allowNewTenants: true,
        maxTenantsPerPlan: {
          starter: 1,
          pro: 5,
          enterprise: 50
        }
      },
      plans: [
        {
          id: 'starter',
          name: 'starter',
          price: 49,
          features: ['Basic Sessions', 'Player Management', 'Email Support'],
          maxUsers: 10,
          maxPlayers: 50,
          maxSessions: 20
        },
        {
          id: 'pro',
          name: 'pro',
          price: 99,
          features: ['All Starter Features', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
          maxUsers: 25,
          maxPlayers: 200,
          maxSessions: 100
        },
        {
          id: 'enterprise',
          name: 'enterprise',
          price: 199,
          features: ['All Pro Features', 'White Label', 'API Access', 'Dedicated Support'],
          maxUsers: -1,
          maxPlayers: -1,
          maxSessions: -1
        }
      ],
      integrations: {
        email: {
          provider: 'sendgrid',
          apiKey: 'SG.***',
          verified: true
        },
        sms: {
          provider: 'twilio',
          accountSid: 'AC***',
          authToken: '***',
          verified: false
        },
        payment: {
          stripePublicKey: 'pk_***',
          stripeSecretKey: 'sk_***',
          stripeWebhookSecret: 'whsec_***',
          verified: true
        },
        oauth: {
          googleClientId: '***',
          googleClientSecret: '***',
          microsoftClientId: '***',
          microsoftClientSecret: '***'
        }
      },
      features: {
        tournaments: false,
        analytics: true,
        customBranding: true,
        apiAccess: false,
        whiteLabel: false,
        multiLocation: true
      }
    };
  }

  async updateSuperAdminSettings(section: string, data: any): Promise<any> {
    // Mock implementation - would update platform settings
    const settings = await this.getSuperAdminSettings();
    settings[section] = { ...settings[section], ...data };
    return settings;
  }

  async testIntegration(type: string, config: any): Promise<any> {
    // Mock implementation - would test actual integration
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate test delay
    
    return {
      success: Math.random() > 0.2, // 80% success rate
      message: `${type} integration test completed`,
      details: `Configuration validated for ${type}`
    };
  }

  async getSuperAdminUsers(filters?: any): Promise<any[]> {
    const FAILSAFE_SUPER_ADMIN_ID = "ajosephfinch"; // Hardcoded failsafe admin
    
    // Get super admin users from database
    let query = db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: sql<string>`CASE WHEN ${users.isSuperAdmin} = true THEN 'super-admin' ELSE 'platform-admin' END`,
      status: sql<string>`'active'`,
      lastLogin: users.createdAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(or(eq(users.isSuperAdmin, true), eq(users.isAdmin, true)));

    // Apply filters
    const conditions = [];
    if (filters?.search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${filters.search}%`),
          ilike(users.lastName, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`)
        )
      );
    }
    if (filters?.role === 'super-admin') {
      conditions.push(eq(users.isSuperAdmin, true));
    } else if (filters?.role === 'platform-admin') {
      conditions.push(and(eq(users.isAdmin, true), eq(users.isSuperAdmin, false)));
    }

    if (conditions.length > 0) {
      query = query.where(and(or(eq(users.isSuperAdmin, true), eq(users.isAdmin, true)), ...conditions));
    }

    const dbUsers = await query.orderBy(desc(users.createdAt));
    
    // Always include failsafe super admin if not already in results
    const failsafeExists = dbUsers.some(user => user.id === FAILSAFE_SUPER_ADMIN_ID);
    
    const allUsers = [...dbUsers];
    
    if (!failsafeExists && (!filters?.search || 
        'ajosephfinch'.includes(filters.search.toLowerCase()) || 
        'failsafe admin'.includes(filters.search.toLowerCase()))) {
      
      // Add virtual failsafe admin user
      allUsers.unshift({
        id: FAILSAFE_SUPER_ADMIN_ID,
        firstName: "Failsafe",
        lastName: "Admin",
        email: "ajosephfinch@replit.com",
        role: "super-admin",
        status: "active",
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    return allUsers;
  }

  // Waitlist operations
  async getWaitlistBySession(sessionId: string, tenantId?: string): Promise<Array<Waitlist & { player: Player; parent: User }>> {
    const query = db
      .select({
        waitlist: waitlists,
        player: players,
        parent: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
        }
      })
      .from(waitlists)
      .innerJoin(players, eq(waitlists.playerId, players.id))
      .innerJoin(users, eq(waitlists.parentId, users.id))
      .where(eq(waitlists.sessionId, sessionId))
      .orderBy(waitlists.position);

    if (tenantId) {
      query.where(eq(waitlists.tenantId, tenantId));
    }

    const result = await query;
    return result.map(r => ({ ...r.waitlist, player: r.player, parent: r.parent as User }));
  }

  async getWaitlistByParent(parentId: string, tenantId?: string): Promise<Array<Waitlist & { session: FutsalSession; player: Player }>> {
    const query = db
      .select({
        waitlist: waitlists,
        session: futsalSessions,
        player: players,
      })
      .from(waitlists)
      .innerJoin(futsalSessions, eq(waitlists.sessionId, futsalSessions.id))
      .innerJoin(players, eq(waitlists.playerId, players.id))
      .where(eq(waitlists.parentId, parentId))
      .orderBy(waitlists.joinedAt);

    if (tenantId) {
      query.where(eq(waitlists.tenantId, tenantId));
    }

    const result = await query;
    return result.map(r => ({ ...r.waitlist, session: r.session, player: r.player }));
  }

  async getWaitlistEntry(sessionId: string, playerId: string): Promise<Waitlist | undefined> {
    const [entry] = await db
      .select()
      .from(waitlists)
      .where(and(eq(waitlists.sessionId, sessionId), eq(waitlists.playerId, playerId)));
    return entry;
  }

  async joinWaitlist(
    sessionId: string, 
    playerId: string, 
    parentId: string, 
    tenantId: string, 
    preferences: { notifyOnJoin?: boolean; notifyOnPositionChange?: boolean }
  ): Promise<Waitlist> {
    return await db.transaction(async (tx) => {
      // Get the next position
      const [result] = await tx
        .select({ count: count() })
        .from(waitlists)
        .where(and(eq(waitlists.sessionId, sessionId), eq(waitlists.status, 'active')));

      const nextPosition = (result?.count || 0) + 1;

      // Insert the waitlist entry
      const [waitlistEntry] = await tx
        .insert(waitlists)
        .values({
          tenantId,
          sessionId,
          playerId,
          parentId,
          position: nextPosition,
          status: 'active',
          notifyOnJoin: preferences.notifyOnJoin ?? true,
          notifyOnPositionChange: preferences.notifyOnPositionChange ?? false,
        })
        .returning();

      return waitlistEntry;
    });
  }

  async leaveWaitlist(sessionId: string, playerId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Mark the entry as removed
      const [removedEntry] = await tx
        .update(waitlists)
        .set({ status: 'removed' })
        .where(and(eq(waitlists.sessionId, sessionId), eq(waitlists.playerId, playerId)))
        .returning();

      if (!removedEntry) return;

      // Reorder remaining positions
      await this.reorderWaitlist(sessionId);
    });
  }

  async getWaitlistCount(sessionId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(waitlists)
      .where(and(eq(waitlists.sessionId, sessionId), eq(waitlists.status, 'active')));
    return result?.count || 0;
  }

  async promoteFromWaitlist(sessionId: string, playerId?: string): Promise<Waitlist | null> {
    return await db.transaction(async (tx) => {
      let entryToPromote: Waitlist;

      if (playerId) {
        // Promote specific player
        const [entry] = await tx
          .select()
          .from(waitlists)
          .where(
            and(
              eq(waitlists.sessionId, sessionId),
              eq(waitlists.playerId, playerId),
              eq(waitlists.status, 'active')
            )
          );
        if (!entry) return null;
        entryToPromote = entry;
      } else {
        // Promote next in line (lowest position)
        const [entry] = await tx
          .select()
          .from(waitlists)
          .where(and(eq(waitlists.sessionId, sessionId), eq(waitlists.status, 'active')))
          .orderBy(waitlists.position)
          .limit(1);
        if (!entry) return null;
        entryToPromote = entry;
      }

      // Get session to determine payment window
      const [session] = await tx
        .select()
        .from(futsalSessions)
        .where(eq(futsalSessions.id, sessionId));

      if (!session) return null;

      const paymentWindowMinutes = session.paymentWindowMinutes || 60;
      const offerExpiresAt = new Date(Date.now() + paymentWindowMinutes * 60 * 1000);

      // Update entry to offered status
      const [promotedEntry] = await tx
        .update(waitlists)
        .set({
          status: 'offered',
          offerStatus: 'offered',
          offerExpiresAt,
        })
        .where(eq(waitlists.id, entryToPromote.id))
        .returning();

      return promotedEntry;
    });
  }

  async expireWaitlistOffer(waitlistId: string): Promise<void> {
    await db
      .update(waitlists)
      .set({
        status: 'expired',
        offerExpiresAt: null,
      })
      .where(eq(waitlists.id, waitlistId));
  }

  async updateWaitlistSettings(sessionId: string, settings: WaitlistSettings): Promise<FutsalSession> {
    const [updatedSession] = await db
      .update(futsalSessions)
      .set(settings)
      .where(eq(futsalSessions.id, sessionId))
      .returning();
    return updatedSession;
  }

  async getExpiredOffers(tenantId?: string): Promise<Waitlist[]> {
    const now = new Date();
    const query = db
      .select()
      .from(waitlists)
      .where(
        and(
          eq(waitlists.status, 'offered'),
          lte(waitlists.offerExpiresAt, now)
        )
      );

    if (tenantId) {
      query.where(eq(waitlists.tenantId, tenantId));
    }

    return await query;
  }

  async reorderWaitlist(sessionId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get all active entries in order
      const activeEntries = await tx
        .select()
        .from(waitlists)
        .where(and(eq(waitlists.sessionId, sessionId), eq(waitlists.status, 'active')))
        .orderBy(waitlists.position);

      // Update positions to be contiguous starting from 1
      for (let i = 0; i < activeEntries.length; i++) {
        await tx
          .update(waitlists)
          .set({ position: i + 1 })
          .where(eq(waitlists.id, activeEntries[i].id));
      }
    });
  }

  async cleanupExpiredWaitlists(): Promise<number> {
    // Clean up waitlist entries for sessions that ended more than 24 hours ago
    const cleanupThreshold = new Date();
    cleanupThreshold.setHours(cleanupThreshold.getHours() - 24);

    const result = await db
      .delete(waitlists)
      .where(
        sql`${waitlists.sessionId} IN (
          SELECT id FROM ${futsalSessions} 
          WHERE end_time < ${cleanupThreshold}
        )`
      );

    return result.rowCount || 0;
  }

  // Waitlist offer operations
  async getPlayerOffers(parentId: string, tenantId?: string): Promise<Array<Waitlist & { session: FutsalSession; player: Player }>> {
    const now = new Date();
    const query = db
      .select({
        waitlist: waitlists,
        session: futsalSessions,
        player: players,
      })
      .from(waitlists)
      .innerJoin(futsalSessions, eq(waitlists.sessionId, futsalSessions.id))
      .innerJoin(players, eq(waitlists.playerId, players.id))
      .where(
        and(
          eq(waitlists.parentId, parentId),
          eq(waitlists.offerStatus, 'offered'),
          gte(waitlists.offerExpiresAt, now)
        )
      )
      .orderBy(waitlists.offerExpiresAt);

    if (tenantId) {
      query.where(eq(waitlists.tenantId, tenantId));
    }

    const result = await query;
    return result.map(r => ({ ...r.waitlist, session: r.session, player: r.player }));
  }

  async createWaitlistOffer(waitlistId: string, paymentWindowMinutes: number): Promise<Waitlist> {
    const offerExpiresAt = new Date(Date.now() + paymentWindowMinutes * 60 * 1000);
    
    const [updatedWaitlist] = await db
      .update(waitlists)
      .set({
        offerStatus: 'offered',
        offerExpiresAt,
      })
      .where(eq(waitlists.id, waitlistId))
      .returning();

    return updatedWaitlist;
  }

  async acceptWaitlistOffer(offerId: string): Promise<{ waitlist: Waitlist; paymentUrl: string }> {
    // This would need to integrate with Stripe for payment URL generation
    // For now, returning a placeholder URL that would be handled by the payment route
    const [waitlist] = await db
      .select()
      .from(waitlists)
      .where(eq(waitlists.id, offerId));

    if (!waitlist) {
      throw new Error('Waitlist offer not found');
    }

    // Verify offer is still valid
    const now = new Date();
    if (waitlist.offerStatus !== 'offered' || (waitlist.offerExpiresAt && waitlist.offerExpiresAt < now)) {
      throw new Error('Offer has expired');
    }

    // Generate payment URL (placeholder - would integrate with actual payment system)
    const paymentUrl = `/session/${waitlist.sessionId}/payment?offerId=${offerId}`;

    return { waitlist, paymentUrl };
  }

  async cancelWaitlistOffer(offerId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Mark offer as expired
      const [expiredOffer] = await tx
        .update(waitlists)
        .set({
          offerStatus: 'expired',
          status: 'removed',
        })
        .where(eq(waitlists.id, offerId))
        .returning();

      if (!expiredOffer) return;

      // Check if auto-promote is enabled for the session
      const [session] = await tx
        .select()
        .from(futsalSessions)
        .where(eq(futsalSessions.id, expiredOffer.sessionId));

      if (session?.autoPromote) {
        // Promote next person in line
        await this.promoteFromWaitlist(expiredOffer.sessionId);
      }
    });
  }

  async processExpiredOffers(tenantId?: string): Promise<number> {
    const now = new Date();
    let expiredOffersQuery = db
      .select()
      .from(waitlists)
      .where(
        and(
          eq(waitlists.offerStatus, 'offered'),
          lte(waitlists.offerExpiresAt, now)
        )
      );

    if (tenantId) {
      expiredOffersQuery = expiredOffersQuery.where(eq(waitlists.tenantId, tenantId));
    }

    const expiredOffers = await expiredOffersQuery;
    let processedCount = 0;

    for (const offer of expiredOffers) {
      await this.cancelWaitlistOffer(offer.id);
      processedCount++;
    }

    return processedCount;
  }

  // ============ PLAYER DEVELOPMENT METHODS ============

  async getDevSkillCategories(tenantId: string): Promise<any[]> {
    return await db
      .select()
      .from(devSkillCategories)
      .where(eq(devSkillCategories.tenantId, tenantId))
      .orderBy(devSkillCategories.sortOrder);
  }

  async createDevSkillCategory(data: any): Promise<any> {
    const [category] = await db
      .insert(devSkillCategories)
      .values(data)
      .returning();
    return category;
  }

  async updateDevSkillCategory(id: string, tenantId: string, data: any): Promise<any> {
    const [category] = await db
      .update(devSkillCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(devSkillCategories.id, id), eq(devSkillCategories.tenantId, tenantId)))
      .returning();
    return category;
  }

  async deleteDevSkillCategory(id: string, tenantId: string): Promise<void> {
    await db
      .delete(devSkillCategories)
      .where(and(eq(devSkillCategories.id, id), eq(devSkillCategories.tenantId, tenantId)));
  }

  async getDevSkills(tenantId: string, filters?: { categoryId?: string; ageBand?: string; sport?: string; status?: string }): Promise<any[]> {
    let query = db
      .select()
      .from(devSkills)
      .where(eq(devSkills.tenantId, tenantId));

    if (filters?.categoryId) {
      query = query.where(eq(devSkills.categoryId, filters.categoryId));
    }
    if (filters?.ageBand) {
      query = query.where(eq(devSkills.ageBand, filters.ageBand));
    }
    if (filters?.sport) {
      query = query.where(eq(devSkills.sport, filters.sport));
    }
    if (filters?.status) {
      query = query.where(eq(devSkills.status, filters.status));
    }

    return await query.orderBy(devSkills.sortOrder);
  }

  async createDevSkill(data: any): Promise<any> {
    const [skill] = await db
      .insert(devSkills)
      .values(data)
      .returning();
    return skill;
  }

  async updateDevSkill(id: string, tenantId: string, data: any): Promise<any> {
    const [skill] = await db
      .update(devSkills)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(devSkills.id, id), eq(devSkills.tenantId, tenantId)))
      .returning();
    return skill;
  }

  async deleteDevSkill(id: string, tenantId: string): Promise<void> {
    await db
      .delete(devSkills)
      .where(and(eq(devSkills.id, id), eq(devSkills.tenantId, tenantId)));
  }

  async getDevSkillRubrics(skillId: string, tenantId: string): Promise<any[]> {
    return await db
      .select()
      .from(devSkillRubrics)
      .where(and(eq(devSkillRubrics.skillId, skillId), eq(devSkillRubrics.tenantId, tenantId)))
      .orderBy(devSkillRubrics.level);
  }

  async upsertDevSkillRubrics(skillId: string, tenantId: string, rubrics: any[]): Promise<any[]> {
    // Delete existing rubrics for this skill
    await db
      .delete(devSkillRubrics)
      .where(and(eq(devSkillRubrics.skillId, skillId), eq(devSkillRubrics.tenantId, tenantId)));

    // Insert new rubrics
    if (rubrics.length > 0) {
      const rubricsWithIds = rubrics.map(r => ({
        ...r,
        skillId,
        tenantId,
      }));
      
      return await db
        .insert(devSkillRubrics)
        .values(rubricsWithIds)
        .returning();
    }
    
    return [];
  }

  async getPlayerAssessments(tenantId: string, filters?: { playerId?: string; assessedBy?: string; startDate?: string; endDate?: string }): Promise<any[]> {
    let query = db
      .select()
      .from(playerAssessments)
      .where(eq(playerAssessments.tenantId, tenantId));

    if (filters?.playerId) {
      query = query.where(eq(playerAssessments.playerId, filters.playerId));
    }
    if (filters?.assessedBy) {
      query = query.where(eq(playerAssessments.assessedBy, filters.assessedBy));
    }
    if (filters?.startDate) {
      query = query.where(gte(playerAssessments.assessmentDate, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      query = query.where(lte(playerAssessments.assessmentDate, new Date(filters.endDate)));
    }

    return await query.orderBy(desc(playerAssessments.assessmentDate));
  }

  async getPlayerAssessmentWithSkills(id: string, tenantId: string): Promise<any | null> {
    const assessment = await db
      .select()
      .from(playerAssessments)
      .where(and(eq(playerAssessments.id, id), eq(playerAssessments.tenantId, tenantId)))
      .limit(1);

    if (!assessment[0]) return null;

    const skillAssessments = await db
      .select()
      .from(playerAssessmentItems)
      .where(and(eq(playerAssessmentItems.assessmentId, id), eq(playerAssessmentItems.tenantId, tenantId)));

    return {
      ...assessment[0],
      skillAssessments,
    };
  }

  async createPlayerAssessment(assessment: any, skillAssessments: any[]): Promise<any> {
    const [newAssessment] = await db
      .insert(playerAssessments)
      .values(assessment)
      .returning();

    if (skillAssessments.length > 0) {
      const skillAssessmentsWithIds = skillAssessments.map(sa => ({
        ...sa,
        assessmentId: newAssessment.id,
        tenantId: assessment.tenantId,
      }));

      await db
        .insert(playerAssessmentItems)
        .values(skillAssessmentsWithIds);
    }

    return newAssessment;
  }

  async updatePlayerAssessment(id: string, tenantId: string, assessment: any, skillAssessments: any[]): Promise<any> {
    const [updatedAssessment] = await db
      .update(playerAssessments)
      .set({ ...assessment, updatedAt: new Date() })
      .where(and(eq(playerAssessments.id, id), eq(playerAssessments.tenantId, tenantId)))
      .returning();

    // Delete existing skill assessments
    await db
      .delete(playerAssessmentItems)
      .where(and(eq(playerAssessmentItems.assessmentId, id), eq(playerAssessmentItems.tenantId, tenantId)));

    // Insert new skill assessments
    if (skillAssessments.length > 0) {
      const skillAssessmentsWithIds = skillAssessments.map(sa => ({
        ...sa,
        assessmentId: id,
        tenantId,
      }));

      await db
        .insert(playerAssessmentItems)
        .values(skillAssessmentsWithIds);
    }

    return updatedAssessment;
  }

  async deletePlayerAssessment(id: string, tenantId: string): Promise<void> {
    // Delete skill assessments first
    await db
      .delete(playerAssessmentItems)
      .where(and(eq(playerAssessmentItems.assessmentId, id), eq(playerAssessmentItems.tenantId, tenantId)));

    // Delete main assessment
    await db
      .delete(playerAssessments)
      .where(and(eq(playerAssessments.id, id), eq(playerAssessments.tenantId, tenantId)));
  }

  async getPlayerGoals(tenantId: string, filters?: { playerId?: string; status?: string; createdBy?: string }): Promise<any[]> {
    let query = db
      .select()
      .from(playerGoals)
      .where(eq(playerGoals.tenantId, tenantId));

    if (filters?.playerId) {
      query = query.where(eq(playerGoals.playerId, filters.playerId));
    }
    if (filters?.status) {
      query = query.where(eq(playerGoals.status, filters.status));
    }
    if (filters?.createdBy) {
      query = query.where(eq(playerGoals.createdBy, filters.createdBy));
    }

    return await query.orderBy(desc(playerGoals.createdAt));
  }

  async getPlayerGoalWithUpdates(id: string, tenantId: string): Promise<any | null> {
    const goal = await db
      .select()
      .from(playerGoals)
      .where(and(eq(playerGoals.id, id), eq(playerGoals.tenantId, tenantId)))
      .limit(1);

    if (!goal[0]) return null;

    const updates = await db
      .select()
      .from(playerGoalUpdates)
      .where(and(eq(playerGoalUpdates.goalId, id), eq(playerGoalUpdates.tenantId, tenantId)))
      .orderBy(desc(playerGoalUpdates.createdAt));

    return {
      ...goal[0],
      updates,
    };
  }

  async createPlayerGoal(data: any): Promise<any> {
    const [goal] = await db
      .insert(playerGoals)
      .values(data)
      .returning();
    return goal;
  }

  async updatePlayerGoal(id: string, tenantId: string, data: any): Promise<any> {
    const [goal] = await db
      .update(playerGoals)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(playerGoals.id, id), eq(playerGoals.tenantId, tenantId)))
      .returning();
    return goal;
  }

  async createPlayerGoalUpdate(data: any): Promise<any> {
    const [update] = await db
      .insert(playerGoalUpdates)
      .values(data)
      .returning();
    return update;
  }

  async deletePlayerGoal(id: string, tenantId: string): Promise<void> {
    // Delete goal updates first
    await db
      .delete(playerGoalUpdates)
      .where(and(eq(playerGoalUpdates.goalId, id), eq(playerGoalUpdates.tenantId, tenantId)));

    // Delete main goal
    await db
      .delete(playerGoals)
      .where(and(eq(playerGoals.id, id), eq(playerGoals.tenantId, tenantId)));
  }

  async getPlayerDevelopmentAnalytics(tenantId: string, filters?: { playerId?: string; startDate?: string; endDate?: string; skillCategoryId?: string }): Promise<any> {
    // This is a comprehensive analytics method that would aggregate data from multiple tables
    // For now, returning basic statistics - can be expanded based on needs
    
    const assessmentCount = await db
      .select({ count: count() })
      .from(playerAssessments)
      .where(eq(playerAssessments.tenantId, tenantId));

    const goalCount = await db
      .select({ count: count() })
      .from(playerGoals)
      .where(eq(playerGoals.tenantId, tenantId));

    return {
      totalAssessments: assessmentCount[0]?.count || 0,
      totalGoals: goalCount[0]?.count || 0,
      // Additional analytics can be added here
    };
  }

  async getPlayerProgressSnapshots(playerId: string, tenantId: string, filters?: { startDate?: string; endDate?: string; skillId?: string }): Promise<any[]> {
    // This would fetch progression snapshots for a player
    // For now, returning empty array - would need to implement progression tracking
    return [];
  }

  // Plan Management Methods for Super Admin
  async getSuperAdminPlans(): Promise<any[]> {
    // Import plans from config and transform them to the format expected by the frontend
    const { plans } = await import('./config/plans.config');
    
    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      playerLimit: plan.playerLimit,
      description: `Up to ${plan.playerLimit === 'unlimited' ? 'Unlimited' : plan.playerLimit} Players`,
      popular: plan.id === 'growth',
      features: Object.entries(plan.features).reduce((acc, [key, feature]) => {
        acc[key] = {
          enabled: feature.status === 'included',
          value: feature.description || feature.name,
          description: feature.description
        };
        return acc;
      }, {} as Record<string, any>)
    }));
  }

  async updateSuperAdminPlan(planId: string, updates: any): Promise<any> {
    // In a production environment, this would update a database table
    // For now, we'll return the updated plan (you could write to a JSON file or database)
    
    const plans = await this.getSuperAdminPlans();
    const planIndex = plans.findIndex(p => p.id === planId);
    
    if (planIndex === -1) {
      throw new Error('Plan not found');
    }
    
    const updatedPlan = {
      ...plans[planIndex],
      ...updates
    };
    
    // Here you would normally persist the changes to a database
    // For now, we'll just return the updated plan
    console.log(`Plan ${planId} updated:`, updatedPlan);
    
    return updatedPlan;
  }
}

export const storage = new DatabaseStorage();
