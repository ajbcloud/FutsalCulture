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
  inviteCodes,
  waitlists,
  devSkillCategories,
  devSkills,
  devSkillRubrics,
  playerAssessments,
  playerAssessmentItems,
  playerGoals,
  playerGoalUpdates,
  features,
  planFeatures,
  tenantFeatureOverrides,
  featureAuditLog,
  consentTemplates,
  consentDocuments,
  consentSignatures,
  consentDocumentAccess,
  userCredits,
  notificationTemplates,
  notifications,
  messageLogs,
  consentEvents,
  contactGroups,
  contactGroupMembers,
  households,
  householdMembers,
  wearableIntegrations,
  wearableData,
  playerMetrics,
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
  type InviteCodeSelect as InviteCode,
  type InviteCodeInsert,
  type Waitlist,
  type InsertWaitlist,
  type JoinWaitlist,
  type LeaveWaitlist,
  type PromoteWaitlist,
  type WaitlistSettings,
  type ConsentTemplate,
  type InsertConsentTemplate,
  type ConsentDocument,
  type InsertConsentDocument,
  type ConsentSignature,
  type InsertConsentSignature,
  type ConsentDocumentAccess,
  type InsertConsentDocumentAccess,
  type UserCreditInsert,
  type UserCreditSelect,
  type Credit,
  type InsertCredit,
  type TenantCredit,
  type InsertTenantCredit,
  type CreditTransaction,
  type InsertCreditTransaction,
  credits,
  tenantCredits,
  creditTransactions,
  type NotificationTemplate,
  type InsertNotificationTemplate,
  type Notification,
  type InsertNotification,
  type MessageLog,
  type InsertMessageLog,
  type ConsentEvent,
  type InsertConsentEvent,
  type ContactGroup,
  type InsertContactGroup,
  type ContactGroupWithCount,
  type ContactGroupMember,
  type InsertContactGroupMember,
  type HouseholdSelect,
  type HouseholdInsert,
  type HouseholdMemberSelect,
  type HouseholdMemberInsert,
  type WearableIntegration,
  type InsertWearableIntegration,
  type WearableData,
  type InsertWearableData,
  type PlayerMetrics,
  type InsertPlayerMetrics,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, count, sql, or, ilike, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // Tenant operations
  getTenant(id: string): Promise<TenantSelect | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<TenantSelect | undefined>;
  getTenants(): Promise<TenantSelect[]>;
  createTenant(tenant: TenantInsert): Promise<TenantSelect>;
  updateTenant(id: string, tenant: Partial<TenantInsert>): Promise<TenantSelect>;
  deleteTenant(id: string): Promise<void>;

  // User operations - now tenant-aware
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByClerkId(clerkUserId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: UpdateUser): Promise<User>;
  updateUserParent2Invite(userId: string, method: string, contact: string, invitedAt: Date): Promise<User>;
  updatePlayersParent2(parent1Id: string, parent2Id: string): Promise<void>;
  getUsersByTenant(tenantId: string): Promise<User[]>;

  // Player operations - now tenant-aware
  getPlayersByParent(parentId: string, tenantId?: string): Promise<PlayerWithSessionCount[]>;
  getPlayer(id: string, tenantId?: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player>;
  updatePlayerSettings(playerId: string, settings: { canAccessPortal?: boolean; canBookAndPay?: boolean }): Promise<Player>;
  updatePlayerInvite(playerId: string, method: string, invitedAt: Date): Promise<Player>;
  deletePlayer(id: string): Promise<void>;

  // Session operations - now tenant-aware
  getSessions(filters?: { ageGroup?: string; location?: string; status?: string; gender?: string; tenantId?: string; includePast?: boolean }): Promise<FutsalSession[]>;
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

  // Credit operations
  createCredit(tenantId: string, userId: string | undefined, amount: number, reason: string, expiresAt: Date | undefined, createdBy: string): Promise<Credit | TenantCredit>;
  getCredits(tenantId: string, userId?: string): Promise<Array<Credit | TenantCredit>>;
  getUserCreditsBalance(tenantId: string, userId: string): Promise<number>;
  getTenantCreditsBalance(tenantId: string): Promise<number>;
  applyCredits(tenantId: string, userId: string, amount: number, sessionId?: string): Promise<CreditTransaction[]>;
  getCreditTransactions(creditId: string): Promise<CreditTransaction[]>;
  
  // Legacy credit operations (to be removed after migration)
  createUserCredit(credit: UserCreditInsert): Promise<UserCreditSelect>;
  getUserCredits(userId: string, tenantId: string): Promise<UserCreditSelect[]>;
  getAvailableCredits(userId: string, tenantId: string): Promise<UserCreditSelect[]>;
  getAvailableCreditBalance(userId: string, tenantId: string): Promise<number>;
  useCredit(creditId: string, signupId: string): Promise<UserCreditSelect>;

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

  // Invite code operations
  getInviteCodes(tenantId: string): Promise<InviteCode[]>;
  getInviteCode(id: string): Promise<InviteCode | undefined>;
  getInviteCodeByCode(code: string, tenantId: string): Promise<InviteCode | undefined>;
  getTenantDefaultCode(tenantId: string): Promise<InviteCode | undefined>;
  createInviteCode(inviteCode: InviteCodeInsert): Promise<InviteCode>;
  updateInviteCode(id: string, inviteCode: Partial<InviteCodeInsert>): Promise<InviteCode>;
  setDefaultInviteCode(id: string, tenantId: string): Promise<InviteCode>;
  deleteInviteCode(id: string): Promise<void>;
  incrementInviteCodeUsage(id: string): Promise<void>;
  
  // Super Admin invite code operations
  getSuperAdminInviteCodes(filters: { 
    tenantId?: string; 
    codeType?: string; 
    status?: 'active' | 'expired' | 'fully_used';
    isPlatform?: boolean;
    search?: string;
  }, page: number, pageSize: number): Promise<{ rows: any[]; total: number }>;
  getAllSuperAdminInviteCodes(filters: {
    tenantId?: string;
    codeType?: string;
    status?: 'active' | 'expired' | 'fully_used';
    isPlatform?: boolean;
  }): Promise<any[]>;
  bulkCreateInviteCodes(codes: InviteCodeInsert[]): Promise<InviteCode[]>;
  getInviteCodeUsageHistory(codeId: string): Promise<any[]>;
  getInviteCodeAnalytics(params: {
    startDate?: Date;
    endDate?: Date;
    tenantId?: string;
    groupBy: 'tenant' | 'code_type' | 'date';
  }): Promise<any>;

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
  getTenantGeographicAnalytics(): Promise<any>;
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
  getHelpRequestsForTenant(tenantId: string): Promise<HelpRequest[]>;
  replyToHelpRequest(id: string, message: string, adminId: string): Promise<HelpRequest | null>;
  resolveHelpRequest(id: string, adminId: string, resolutionNote?: string): Promise<HelpRequest | null>;

  // Tenant feature override operations
  getTenantFeatureOverrides(tenantId?: string): Promise<any[]>;
  setTenantFeatureOverride(tenantId: string, featureKey: string, override: any, userId?: string, ip?: string, userAgent?: string): Promise<void>;
  removeTenantFeatureOverride(tenantId: string, featureKey: string): Promise<void>;

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

  // Consent document management
  getConsentTemplates(tenantId: string): Promise<ConsentTemplate[]>;
  getAllConsentTemplates(tenantId: string): Promise<ConsentTemplate[]>;
  getConsentTemplate(id: string, tenantId: string): Promise<ConsentTemplate | undefined>;
  createConsentTemplate(template: InsertConsentTemplate): Promise<ConsentTemplate>;
  updateConsentTemplate(id: string, template: Partial<InsertConsentTemplate>): Promise<ConsentTemplate>;
  deactivateConsentTemplate(id: string, tenantId: string): Promise<void>;
  toggleConsentTemplate(id: string, tenantId: string, isActive: boolean): Promise<ConsentTemplate>;

  createConsentDocument(document: InsertConsentDocument): Promise<ConsentDocument>;
  getConsentDocument(id: string, tenantId: string): Promise<ConsentDocument | undefined>;
  getConsentDocumentsByPlayer(playerId: string, tenantId: string): Promise<ConsentDocument[]>;
  getConsentDocumentsByParent(parentId: string, tenantId: string): Promise<ConsentDocument[]>;
  getAllConsentDocuments(tenantId: string): Promise<ConsentDocument[]>;
  getRequiredConsentTemplates(tenantId: string): Promise<ConsentTemplate[]>;
  checkMissingConsentForms(playerId: string, parentId: string, tenantId: string): Promise<ConsentTemplate[]>;

  createConsentSignature(signature: InsertConsentSignature): Promise<ConsentSignature>;
  getConsentSignaturesByDocument(documentId: string): Promise<ConsentSignature[]>;
  getConsentSignaturesByPlayer(playerId: string, tenantId: string): Promise<ConsentSignature[]>;

  logConsentDocumentAccess(access: InsertConsentDocumentAccess): Promise<ConsentDocumentAccess>;
  getConsentDocumentAccessLog(documentId: string): Promise<ConsentDocumentAccess[]>;

  // Communication system operations
  createTemplate(data: any): Promise<any>;
  getTemplates(tenantId: string, type?: 'email' | 'sms'): Promise<any[]>;
  getTemplateById(id: string, tenantId: string): Promise<any | undefined>;
  updateTemplate(id: string, tenantId: string, data: any): Promise<any>;
  deleteTemplate(id: string, tenantId: string): Promise<void>;

  createNotification(data: any): Promise<any>;
  getNotifications(tenantId: string, filters?: { status?: string; type?: string; limit?: number }): Promise<any[]>;
  updateNotificationStatus(id: string, status: string, sentAt?: Date, errorMessage?: string): Promise<any>;

  createMessageLog(data: any): Promise<any>;
  getMessageLogs(tenantId: string, filters?: { direction?: string; limit?: number }): Promise<any[]>;

  createConsentEvent(data: any): Promise<any>;
  getUserConsent(userId: string, channel: 'sms' | 'email'): Promise<any | undefined>;

  // Contact Groups operations
  createContactGroup(data: InsertContactGroup): Promise<ContactGroupWithCount>;
  getContactGroups(tenantId: string): Promise<ContactGroupWithCount[]>;
  getContactGroupById(id: string, tenantId: string): Promise<ContactGroup | undefined>;
  updateContactGroup(id: string, tenantId: string, data: Partial<InsertContactGroup>): Promise<ContactGroupWithCount>;
  deleteContactGroup(id: string, tenantId: string): Promise<void>;

  addGroupMember(groupId: string, userId: string, addedBy: string): Promise<ContactGroupMember>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  getGroupMembers(groupId: string): Promise<Array<ContactGroupMember & { user: User }>>;
  getUserGroups(userId: string, tenantId: string): Promise<ContactGroup[]>;

  // Household operations
  getHouseholds(tenantId: string): Promise<Array<HouseholdSelect & { memberCount: number; members: Array<HouseholdMemberSelect & { user?: User; player?: Player }> }>>;
  getHousehold(id: string, tenantId: string): Promise<(HouseholdSelect & { members: Array<HouseholdMemberSelect & { user?: User; player?: Player }> }) | undefined>;
  getUserHousehold(userId: string, tenantId: string): Promise<HouseholdSelect | null>;
  createHousehold(household: HouseholdInsert): Promise<HouseholdSelect>;
  updateHousehold(id: string, tenantId: string, data: Partial<HouseholdInsert>): Promise<HouseholdSelect>;
  deleteHousehold(id: string, tenantId: string): Promise<void>;
  addHouseholdMember(householdId: string, tenantId: string, member: Omit<HouseholdMemberInsert, 'id' | 'householdId' | 'tenantId' | 'addedAt'>): Promise<HouseholdSelect & { members: Array<HouseholdMemberSelect & { user?: User; player?: Player }> }>;
  removeHouseholdMember(memberId: string, tenantId: string): Promise<void>;

  // Wearables operations
  getWearableIntegrations(tenantId: string, playerId?: string): Promise<WearableIntegration[]>;
  getWearableIntegration(id: string, tenantId: string): Promise<WearableIntegration | undefined>;
  createWearableIntegration(integration: InsertWearableIntegration): Promise<WearableIntegration>;
  updateWearableIntegration(id: string, data: Partial<InsertWearableIntegration>): Promise<WearableIntegration>;
  deleteWearableIntegration(id: string, tenantId: string): Promise<void>;

  // Wearable data operations
  createWearableData(data: InsertWearableData): Promise<WearableData>;
  getWearableData(
    tenantId: string, 
    playerId: string, 
    filters?: { 
      dataType?: string; 
      startDate?: Date; 
      endDate?: Date; 
      limit?: number 
    }
  ): Promise<WearableData[]>;
  
  // Player metrics operations
  getPlayerMetrics(
    tenantId: string,
    playerId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<PlayerMetrics[]>;
  getLatestPlayerMetrics(tenantId: string, playerId: string): Promise<PlayerMetrics | undefined>;
  upsertPlayerMetrics(metrics: InsertPlayerMetrics): Promise<PlayerMetrics>;
  aggregatePlayerMetrics(tenantId: string, playerId: string, date: Date): Promise<PlayerMetrics>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  async getUserByClerkId(clerkUserId: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const userId = userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [user] = await db.insert(users)
      .values({
        id: userId,
        email: userData.email,
        passwordHash: userData.passwordHash,
        clerkUserId: userData.clerkUserId,
        authProvider: userData.authProvider || 'local',
        authProviderId: userData.authProviderId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        phone: userData.phone,
        tenantId: userData.tenantId,
        isApproved: userData.isApproved ?? false,
        registrationStatus: userData.registrationStatus ?? "pending",
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          clerkUserId: userData.clerkUserId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          phone: userData.phone,
          updatedAt: sql`now()`,
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

  async getUsersByTenant(tenantId: string): Promise<User[]> {
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

  // Credit operations
  async createCredit(credit: UserCreditInsert): Promise<UserCreditSelect> {
    // Validate that exactly one of userId or householdId is set
    const hasUserId = !!credit.userId;
    const hasHouseholdId = !!credit.householdId;

    if (hasUserId && hasHouseholdId) {
      throw new Error('Cannot create credit with both userId and householdId. Only one must be set.');
    }

    if (!hasUserId && !hasHouseholdId) {
      throw new Error('Cannot create credit without userId or householdId. Exactly one must be set.');
    }

    const [newCredit] = await db.insert(userCredits).values(credit).returning();
    return newCredit;
  }

  async getUserCredits(userId: string, tenantId: string): Promise<UserCreditSelect[]> {
    // Get user's household IDs
    const userHouseholds = await db
      .select({ householdId: householdMembers.householdId })
      .from(householdMembers)
      .where(and(
        eq(householdMembers.userId, userId),
        eq(householdMembers.tenantId, tenantId)
      ));
    
    const householdIds = userHouseholds.map(h => h.householdId);
    
    // Fetch user-level credits
    const userCreditsQuery = db
      .select()
      .from(userCredits)
      .where(and(
        eq(userCredits.userId, userId),
        eq(userCredits.tenantId, tenantId)
      ));
    
    // Fetch household-level credits if user belongs to any households
    let householdCreditsQuery = null;
    if (householdIds.length > 0) {
      householdCreditsQuery = db
        .select()
        .from(userCredits)
        .where(and(
          inArray(userCredits.householdId, householdIds),
          eq(userCredits.tenantId, tenantId)
        ));
    }
    
    // Execute queries and combine results
    const [userCreds, householdCreds] = await Promise.all([
      userCreditsQuery,
      householdCreditsQuery || Promise.resolve([])
    ]);
    
    // Combine and sort by createdAt ASC (FIFO - oldest first)
    const allCredits = [...userCreds, ...householdCreds];
    allCredits.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
    
    return allCredits;
  }

  async getAvailableCredits(userId: string, tenantId: string): Promise<UserCreditSelect[]> {
    const now = new Date();
    
    // Get user's household IDs
    const userHouseholds = await db
      .select({ householdId: householdMembers.householdId })
      .from(householdMembers)
      .where(and(
        eq(householdMembers.userId, userId),
        eq(householdMembers.tenantId, tenantId)
      ));
    
    const householdIds = userHouseholds.map(h => h.householdId);
    
    // Fetch available user-level credits
    const userCreditsQuery = db
      .select()
      .from(userCredits)
      .where(and(
        eq(userCredits.userId, userId),
        eq(userCredits.tenantId, tenantId),
        eq(userCredits.isUsed, false),
        or(
          sql`${userCredits.expiresAt} IS NULL`,
          gte(userCredits.expiresAt, now)
        )
      ));
    
    // Fetch available household-level credits if user belongs to any households
    let householdCreditsQuery = null;
    if (householdIds.length > 0) {
      householdCreditsQuery = db
        .select()
        .from(userCredits)
        .where(and(
          inArray(userCredits.householdId, householdIds),
          eq(userCredits.tenantId, tenantId),
          eq(userCredits.isUsed, false),
          or(
            sql`${userCredits.expiresAt} IS NULL`,
            gte(userCredits.expiresAt, now)
          )
        ));
    }
    
    // Execute queries and combine results
    const [userCreds, householdCreds] = await Promise.all([
      userCreditsQuery,
      householdCreditsQuery || Promise.resolve([])
    ]);
    
    // Combine and sort by createdAt ASC (FIFO - oldest first)
    const allCredits = [...userCreds, ...householdCreds];
    allCredits.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
    
    return allCredits;
  }

  async getAvailableCreditBalance(userId: string, tenantId: string): Promise<number> {
    const credits = await this.getAvailableCredits(userId, tenantId);
    return credits.reduce((sum, credit) => sum + credit.amountCents, 0);
  }

  async useCredit(creditId: string, signupId: string): Promise<UserCreditSelect> {
    const [updatedCredit] = await db
      .update(userCredits)
      .set({
        isUsed: true,
        usedAt: new Date(),
        usedForSignupId: signupId,
      })
      .where(eq(userCredits.id, creditId))
      .returning();
    return updatedCredit;
  }

  // New credit operations implementation
  async createCredit(
    tenantId: string, 
    userId: string | undefined, 
    amount: number, 
    reason: string, 
    expiresAt: Date | undefined, 
    createdBy: string
  ): Promise<Credit | TenantCredit> {
    if (userId) {
      // Create user-level credit
      const [newCredit] = await db.insert(credits).values({
        tenantId,
        userId,
        amount: amount.toString(),
        reason,
        expiresAt,
        createdBy,
      }).returning();
      return newCredit;
    } else {
      // Create tenant-level credit
      const [newCredit] = await db.insert(tenantCredits).values({
        tenantId,
        amount: amount.toString(),
        reason,
        expiresAt,
        createdBy,
      }).returning();
      return newCredit;
    }
  }

  async getCredits(tenantId: string, userId?: string): Promise<Array<Credit | TenantCredit>> {
    const now = new Date();
    
    if (userId) {
      // Get both user-specific and tenant-level credits
      const [userCredits, tenantLevelCredits] = await Promise.all([
        db.select()
          .from(credits)
          .where(and(
            eq(credits.tenantId, tenantId),
            eq(credits.userId, userId),
            eq(credits.isActive, true),
            or(
              sql`${credits.expiresAt} IS NULL`,
              gte(credits.expiresAt, now)
            )
          ))
          .orderBy(asc(credits.createdAt)),
        db.select()
          .from(tenantCredits)
          .where(and(
            eq(tenantCredits.tenantId, tenantId),
            eq(tenantCredits.isActive, true),
            or(
              sql`${tenantCredits.expiresAt} IS NULL`,
              gte(tenantCredits.expiresAt, now)
            )
          ))
          .orderBy(asc(tenantCredits.createdAt))
      ]);
      
      return [...userCredits, ...tenantLevelCredits];
    } else {
      // Get only tenant-level credits
      const tenantLevelCredits = await db.select()
        .from(tenantCredits)
        .where(and(
          eq(tenantCredits.tenantId, tenantId),
          eq(tenantCredits.isActive, true),
          or(
            sql`${tenantCredits.expiresAt} IS NULL`,
            gte(tenantCredits.expiresAt, now)
          )
        ))
        .orderBy(asc(tenantCredits.createdAt));
      
      return tenantLevelCredits;
    }
  }

  async getUserCreditsBalance(tenantId: string, userId: string): Promise<number> {
    const allCredits = await this.getCredits(tenantId, userId);
    return allCredits.reduce((sum, credit) => {
      const available = parseFloat(credit.amount) - parseFloat(credit.usedAmount);
      return sum + available;
    }, 0);
  }

  async getTenantCreditsBalance(tenantId: string): Promise<number> {
    const tenantLevelCredits = await this.getCredits(tenantId);
    return tenantLevelCredits.reduce((sum, credit) => {
      const available = parseFloat(credit.amount) - parseFloat(credit.usedAmount);
      return sum + available;
    }, 0);
  }

  async applyCredits(
    tenantId: string, 
    userId: string, 
    amount: number, 
    sessionId?: string
  ): Promise<CreditTransaction[]> {
    const allCredits = await this.getCredits(tenantId, userId);
    const transactions: CreditTransaction[] = [];
    let remainingAmount = amount;

    // Apply credits using FIFO (oldest first)
    for (const credit of allCredits) {
      if (remainingAmount <= 0) break;

      const available = parseFloat(credit.amount) - parseFloat(credit.usedAmount);
      if (available <= 0) continue;

      const amountToUse = Math.min(available, remainingAmount);
      
      // Update the credit's used amount
      if ('userId' in credit) {
        // User-level credit
        await db.update(credits)
          .set({
            usedAmount: (parseFloat(credit.usedAmount) + amountToUse).toString(),
            isActive: parseFloat(credit.amount) <= parseFloat(credit.usedAmount) + amountToUse ? false : credit.isActive,
            updatedAt: new Date(),
          })
          .where(eq(credits.id, credit.id));
      } else {
        // Tenant-level credit
        await db.update(tenantCredits)
          .set({
            usedAmount: (parseFloat(credit.usedAmount) + amountToUse).toString(),
            isActive: parseFloat(credit.amount) <= parseFloat(credit.usedAmount) + amountToUse ? false : credit.isActive,
            updatedAt: new Date(),
          })
          .where(eq(tenantCredits.id, credit.id));
      }

      // Create transaction record
      const [transaction] = await db.insert(creditTransactions).values({
        creditId: credit.id,
        creditType: 'userId' in credit ? 'user' : 'tenant',
        amount: amountToUse.toString(),
        sessionId,
        description: sessionId ? `Applied to session booking ${sessionId}` : 'Applied to booking',
      }).returning();
      
      transactions.push(transaction);
      remainingAmount -= amountToUse;
    }

    if (remainingAmount > 0) {
      throw new Error(`Insufficient credits. Need ${amount}, but only ${amount - remainingAmount} available.`);
    }

    return transactions;
  }

  async getCreditTransactions(creditId: string): Promise<CreditTransaction[]> {
    return await db.select()
      .from(creditTransactions)
      .where(eq(creditTransactions.creditId, creditId))
      .orderBy(desc(creditTransactions.createdAt));
  }

  // Rename old credit methods to indicate they're legacy
  async createUserCredit(credit: UserCreditInsert): Promise<UserCreditSelect> {
    return this.createCredit(credit) as any; // Legacy compatibility
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
        // Payment record fields
        paymentStatus: payments.status,
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
      status: 'paid',
    })) as Array<Signup & { player: Player; session: FutsalSession; parent: User; transactionId?: string; paymentProvider?: string }>;
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

  // Invite code operations
  async getInviteCodes(tenantId: string): Promise<InviteCode[]> {
    return await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.tenantId, tenantId))
      .orderBy(desc(inviteCodes.createdAt));
  }

  async getInviteCode(id: string): Promise<InviteCode | undefined> {
    const [code] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.id, id));
    return code;
  }

  async getInviteCodeByCode(code: string, tenantId: string): Promise<InviteCode | undefined> {
    const [inviteCode] = await db
      .select()
      .from(inviteCodes)
      .where(
        and(
          eq(inviteCodes.code, code),
          eq(inviteCodes.tenantId, tenantId)
        )
      );
    return inviteCode;
  }

  async getTenantDefaultCode(tenantId: string): Promise<InviteCode | undefined> {
    const [defaultCode] = await db
      .select()
      .from(inviteCodes)
      .where(
        and(
          eq(inviteCodes.tenantId, tenantId),
          eq(inviteCodes.isDefault, true)
        )
      );
    return defaultCode;
  }

  async createInviteCode(inviteCode: InviteCodeInsert): Promise<InviteCode> {
    const [created] = await db
      .insert(inviteCodes)
      .values(inviteCode)
      .returning();
    return created;
  }

  async updateInviteCode(id: string, inviteCode: Partial<InviteCodeInsert>): Promise<InviteCode> {
    const [updated] = await db
      .update(inviteCodes)
      .set({
        ...inviteCode,
        updatedAt: new Date(),
      })
      .where(eq(inviteCodes.id, id))
      .returning();
    return updated;
  }

  async setDefaultInviteCode(id: string, tenantId: string): Promise<InviteCode> {
    // First, set all other codes for this tenant to isDefault=false
    await db
      .update(inviteCodes)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(inviteCodes.tenantId, tenantId),
          eq(inviteCodes.isDefault, true)
        )
      );

    // Then set the target code to isDefault=true
    const [updated] = await db
      .update(inviteCodes)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(
        and(
          eq(inviteCodes.id, id),
          eq(inviteCodes.tenantId, tenantId)
        )
      )
      .returning();
    
    return updated;
  }

  async deleteInviteCode(id: string): Promise<void> {
    await db.delete(inviteCodes).where(eq(inviteCodes.id, id));
  }

  async incrementInviteCodeUsage(id: string): Promise<void> {
    await db
      .update(inviteCodes)
      .set({
        currentUses: sql`${inviteCodes.currentUses} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(inviteCodes.id, id));
  }

  // Super Admin invite code operations
  async getSuperAdminInviteCodes(filters: { 
    tenantId?: string; 
    codeType?: string; 
    status?: 'active' | 'expired' | 'fully_used';
    isPlatform?: boolean;
    search?: string;
  }, page: number, pageSize: number): Promise<{ rows: any[]; total: number }> {
    let conditions = [];
    
    if (filters.tenantId) {
      conditions.push(eq(inviteCodes.tenantId, filters.tenantId));
    }
    
    if (filters.codeType) {
      conditions.push(eq(inviteCodes.codeType, filters.codeType as any));
    }
    
    if (filters.isPlatform !== undefined) {
      conditions.push(eq(inviteCodes.isPlatform, filters.isPlatform));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          ilike(inviteCodes.code, `%${filters.search}%`),
          ilike(inviteCodes.description, `%${filters.search}%`)
        )
      );
    }
    
    if (filters.status === 'active') {
      conditions.push(
        and(
          eq(inviteCodes.isActive, true),
          or(
            sql`${inviteCodes.validUntil} IS NULL`,
            gte(inviteCodes.validUntil, new Date())
          ),
          or(
            sql`${inviteCodes.maxUses} IS NULL`,
            sql`${inviteCodes.currentUses} < ${inviteCodes.maxUses}`
          )
        )
      );
    } else if (filters.status === 'expired') {
      conditions.push(
        and(
          lte(inviteCodes.validUntil, new Date()),
          sql`${inviteCodes.validUntil} IS NOT NULL`
        )
      );
    } else if (filters.status === 'fully_used') {
      conditions.push(
        and(
          sql`${inviteCodes.maxUses} IS NOT NULL`,
          sql`${inviteCodes.currentUses} >= ${inviteCodes.maxUses}`
        )
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(inviteCodes)
      .leftJoin(tenants, eq(inviteCodes.tenantId, tenants.id))
      .where(whereClause);
    
    // Get paginated rows with tenant info
    const rows = await db
      .select({
        id: inviteCodes.id,
        code: inviteCodes.code,
        codeType: inviteCodes.codeType,
        description: inviteCodes.description,
        isActive: inviteCodes.isActive,
        isPlatform: inviteCodes.isPlatform,
        tenantId: inviteCodes.tenantId,
        tenantName: tenants.name,
        ageGroup: inviteCodes.ageGroup,
        gender: inviteCodes.gender,
        location: inviteCodes.location,
        club: inviteCodes.club,
        discountType: inviteCodes.discountType,
        discountValue: inviteCodes.discountValue,
        maxUses: inviteCodes.maxUses,
        currentUses: inviteCodes.currentUses,
        validFrom: inviteCodes.validFrom,
        validUntil: inviteCodes.validUntil,
        metadata: inviteCodes.metadata,
        createdAt: inviteCodes.createdAt,
        updatedAt: inviteCodes.updatedAt,
      })
      .from(inviteCodes)
      .leftJoin(tenants, eq(inviteCodes.tenantId, tenants.id))
      .where(whereClause)
      .orderBy(desc(inviteCodes.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    
    return {
      rows,
      total: totalCount
    };
  }
  
  async getAllSuperAdminInviteCodes(filters: {
    tenantId?: string;
    codeType?: string;
    status?: 'active' | 'expired' | 'fully_used';
    isPlatform?: boolean;
  }): Promise<any[]> {
    let conditions = [];
    
    if (filters.tenantId) {
      conditions.push(eq(inviteCodes.tenantId, filters.tenantId));
    }
    
    if (filters.codeType) {
      conditions.push(eq(inviteCodes.codeType, filters.codeType as any));
    }
    
    if (filters.isPlatform !== undefined) {
      conditions.push(eq(inviteCodes.isPlatform, filters.isPlatform));
    }
    
    if (filters.status === 'active') {
      conditions.push(
        and(
          eq(inviteCodes.isActive, true),
          or(
            sql`${inviteCodes.validUntil} IS NULL`,
            gte(inviteCodes.validUntil, new Date())
          ),
          or(
            sql`${inviteCodes.maxUses} IS NULL`,
            sql`${inviteCodes.currentUses} < ${inviteCodes.maxUses}`
          )
        )
      );
    } else if (filters.status === 'expired') {
      conditions.push(
        and(
          lte(inviteCodes.validUntil, new Date()),
          sql`${inviteCodes.validUntil} IS NOT NULL`
        )
      );
    } else if (filters.status === 'fully_used') {
      conditions.push(
        and(
          sql`${inviteCodes.maxUses} IS NOT NULL`,
          sql`${inviteCodes.currentUses} >= ${inviteCodes.maxUses}`
        )
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    return await db
      .select({
        id: inviteCodes.id,
        code: inviteCodes.code,
        codeType: inviteCodes.codeType,
        description: inviteCodes.description,
        isActive: inviteCodes.isActive,
        isPlatform: inviteCodes.isPlatform,
        tenantId: inviteCodes.tenantId,
        tenantName: tenants.name,
        ageGroup: inviteCodes.ageGroup,
        gender: inviteCodes.gender,
        location: inviteCodes.location,
        club: inviteCodes.club,
        discountType: inviteCodes.discountType,
        discountValue: inviteCodes.discountValue,
        maxUses: inviteCodes.maxUses,
        currentUses: inviteCodes.currentUses,
        validFrom: inviteCodes.validFrom,
        validUntil: inviteCodes.validUntil,
        metadata: inviteCodes.metadata,
        createdAt: inviteCodes.createdAt,
      })
      .from(inviteCodes)
      .leftJoin(tenants, eq(inviteCodes.tenantId, tenants.id))
      .where(whereClause)
      .orderBy(desc(inviteCodes.createdAt));
  }
  
  async bulkCreateInviteCodes(codes: InviteCodeInsert[]): Promise<InviteCode[]> {
    return await db
      .insert(inviteCodes)
      .values(codes)
      .returning();
  }
  
  async getInviteCodeUsageHistory(codeId: string): Promise<any[]> {
    // For now, return empty array as we don't have usage tracking table yet
    // In the future, this would query a usage history table
    return [];
  }
  
  async getInviteCodeAnalytics(params: {
    startDate?: Date;
    endDate?: Date;
    tenantId?: string;
    groupBy: 'tenant' | 'code_type' | 'date';
  }): Promise<any> {
    let conditions = [];
    
    if (params.startDate) {
      conditions.push(gte(inviteCodes.createdAt, params.startDate));
    }
    
    if (params.endDate) {
      conditions.push(lte(inviteCodes.createdAt, params.endDate));
    }
    
    if (params.tenantId) {
      conditions.push(eq(inviteCodes.tenantId, params.tenantId));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    if (params.groupBy === 'tenant') {
      const results = await db
        .select({
          tenantId: inviteCodes.tenantId,
          tenantName: tenants.name,
          totalCodes: count(),
          totalUsage: sql<number>`COALESCE(SUM(${inviteCodes.currentUses}), 0)`,
          activeCodes: sql<number>`COUNT(CASE WHEN ${inviteCodes.isActive} = true THEN 1 END)`,
          platformCodes: sql<number>`COUNT(CASE WHEN ${inviteCodes.isPlatform} = true THEN 1 END)`,
        })
        .from(inviteCodes)
        .leftJoin(tenants, eq(inviteCodes.tenantId, tenants.id))
        .where(whereClause)
        .groupBy(inviteCodes.tenantId, tenants.name);
      
      return results;
    } else if (params.groupBy === 'code_type') {
      const results = await db
        .select({
          codeType: inviteCodes.codeType,
          totalCodes: count(),
          totalUsage: sql<number>`COALESCE(SUM(${inviteCodes.currentUses}), 0)`,
          activeCodes: sql<number>`COUNT(CASE WHEN ${inviteCodes.isActive} = true THEN 1 END)`,
        })
        .from(inviteCodes)
        .where(whereClause)
        .groupBy(inviteCodes.codeType);
      
      return results;
    } else {
      // Group by date
      const results = await db
        .select({
          date: sql<string>`DATE(${inviteCodes.createdAt})`,
          totalCodes: count(),
          totalUsage: sql<number>`COALESCE(SUM(${inviteCodes.currentUses}), 0)`,
        })
        .from(inviteCodes)
        .where(whereClause)
        .groupBy(sql`DATE(${inviteCodes.createdAt})`)
        .orderBy(sql`DATE(${inviteCodes.createdAt})`);
      
      return results;
    }
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

  async getSuperAdminParents(filters?: { tenantId?: string; search?: string; status?: string; dateFrom?: string; dateTo?: string }): Promise<any[]> {
    const conditions = [eq(users.isAdmin, false)]; // Start with base condition

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
    if (filters?.search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${filters.search}%`),
          ilike(users.lastName, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`),
          ilike(tenants.name, `%${filters.search}%`),
          sql`${users.firstName} || ' ' || ${users.lastName} ILIKE ${'%' + filters.search + '%'}`
        )
      );
    }
    if (filters?.dateFrom) {
      conditions.push(gte(users.createdAt, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      conditions.push(lte(users.createdAt, new Date(filters.dateTo)));
    }

    const query = db.select({
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
    .where(and(...conditions))
    .groupBy(users.id, tenants.name, users.updatedAt)
    .orderBy(desc(users.createdAt));

    return await query;
  }

  async getSuperAdminPlayers(filters?: { tenantId?: string; search?: string; ageGroup?: string; gender?: string; portalAccess?: string; dateFrom?: string; dateTo?: string; parentId?: string; include?: string }): Promise<any[]> {
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
    // Get Recent Activity from real data
    const recentUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
        tenantName: tenants.name
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(gte(users.createdAt, fromDate))
      .orderBy(desc(users.createdAt))
      .limit(5);
    
    const recentPayments = await db
      .select({
        id: payments.id,
        amount: payments.amountCents,
        paidAt: payments.paidAt,
        tenantName: tenants.name
      })
      .from(payments)
      .leftJoin(tenants, eq(payments.tenantId, tenants.id))
      .where(and(eq(payments.status, 'paid'), gte(payments.paidAt, fromDate)))
      .orderBy(desc(payments.paidAt))
      .limit(5);
    
    const recentSessions = await db
      .select({
        id: futsalSessions.id,
        location: futsalSessions.location,
        createdAt: futsalSessions.createdAt,
        tenantName: tenants.name
      })
      .from(futsalSessions)
      .leftJoin(tenants, eq(futsalSessions.tenantId, tenants.id))
      .where(gte(futsalSessions.createdAt, fromDate))
      .orderBy(desc(futsalSessions.createdAt))
      .limit(5);
    
    // Combine and sort recent activity
    const recentActivity = [
      ...recentUsers.map(u => ({
        type: 'user_signup',
        message: `New user ${u.firstName} ${u.lastName} registered`,
        timestamp: u.createdAt || new Date(),
        tenantName: u.tenantName || 'Unknown'
      })),
      ...recentPayments.map(p => ({
        type: 'payment',
        message: `Payment received $${(p.amount / 100).toFixed(2)}`,
        timestamp: p.paidAt || new Date(),
        tenantName: p.tenantName || 'Unknown'
      })),
      ...recentSessions.map(s => ({
        type: 'session',
        message: `Session created at ${s.location}`,
        timestamp: s.createdAt || new Date(),
        tenantName: s.tenantName || 'Unknown'
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

    // Calculate Growth Metrics with real data
    // Get previous period dates for comparison
    const periodLength = toDate.getTime() - fromDate.getTime();
    const previousFromDate = new Date(fromDate.getTime() - periodLength);
    const previousToDate = new Date(fromDate.getTime());

    // User growth
    const currentUserCount = await db
      .select({ count: count() })
      .from(users)
      .where(and(gte(users.createdAt, fromDate), lte(users.createdAt, toDate)));
    
    const previousUserCount = await db
      .select({ count: count() })
      .from(users)
      .where(and(gte(users.createdAt, previousFromDate), lte(users.createdAt, previousToDate)));
    
    const userGrowth = previousUserCount[0].count > 0
      ? ((currentUserCount[0].count - previousUserCount[0].count) / previousUserCount[0].count) * 100
      : 0;

    // Revenue growth
    const currentRevenue = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)` })
      .from(payments)
      .where(and(eq(payments.status, 'paid'), gte(payments.paidAt, fromDate), lte(payments.paidAt, toDate)));
    
    const previousRevenue = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)` })
      .from(payments)
      .where(and(eq(payments.status, 'paid'), gte(payments.paidAt, previousFromDate), lte(payments.paidAt, previousToDate)));
    
    const revenueGrowth = Number(previousRevenue[0].total) > 0
      ? ((Number(currentRevenue[0].total) - Number(previousRevenue[0].total)) / Number(previousRevenue[0].total)) * 100
      : 0;

    // Session growth
    const currentSessionCount = await db
      .select({ count: count() })
      .from(futsalSessions)
      .where(and(gte(futsalSessions.createdAt, fromDate), lte(futsalSessions.createdAt, toDate)));
    
    const previousSessionCount = await db
      .select({ count: count() })
      .from(futsalSessions)
      .where(and(gte(futsalSessions.createdAt, previousFromDate), lte(futsalSessions.createdAt, previousToDate)));
    
    const sessionGrowth = previousSessionCount[0].count > 0
      ? ((currentSessionCount[0].count - previousSessionCount[0].count) / previousSessionCount[0].count) * 100
      : 0;

    // Tenant growth
    const currentTenantCount = await db
      .select({ count: count() })
      .from(tenants)
      .where(and(gte(tenants.createdAt, fromDate), lte(tenants.createdAt, toDate)));
    
    const previousTenantCount = await db
      .select({ count: count() })
      .from(tenants)
      .where(and(gte(tenants.createdAt, previousFromDate), lte(tenants.createdAt, previousToDate)));
    
    const tenantGrowth = previousTenantCount[0].count > 0
      ? ((currentTenantCount[0].count - previousTenantCount[0].count) / previousTenantCount[0].count) * 100
      : 0;

    const growthMetrics = {
      userGrowth: Number(userGrowth.toFixed(1)),
      revenueGrowth: Number(revenueGrowth.toFixed(1)),
      sessionGrowth: Number(sessionGrowth.toFixed(1)),
      tenantGrowth: Number(tenantGrowth.toFixed(1))
    };

    // Platform Health (some metrics would need actual monitoring, using reasonable defaults)
    const systemHealth = {
      uptime: '99.9%', // Would need actual monitoring
      avgResponseTime: '120ms', // Would need actual monitoring
      errorRate: '0.01%', // Would need actual monitoring
      activeConnections: await db.select({ count: count() }).from(sessions).then(r => r[0]?.count || 0) // Active session connections
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
    // Calculate real usage trends from database
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const trends = [];
    
    // Generate each day in the range
    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);
      
      // Get user signups for this day
      const userCount = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          gte(users.createdAt, currentDate),
          lte(users.createdAt, nextDate)
        ));
      
      // Get sessions created for this day
      const sessionCount = await db
        .select({ count: count() })
        .from(futsalSessions)
        .where(and(
          gte(futsalSessions.createdAt, currentDate),
          lte(futsalSessions.createdAt, nextDate)
        ));
      
      // Get revenue for this day
      const revenueData = await db
        .select({ total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)` })
        .from(payments)
        .where(and(
          eq(payments.status, 'paid'),
          gte(payments.paidAt, currentDate),
          lte(payments.paidAt, nextDate)
        ));
      
      trends.push({
        date: currentDate.toISOString().split('T')[0],
        users: userCount[0]?.count || 0,
        sessions: sessionCount[0]?.count || 0,
        revenue: Number(revenueData[0]?.total || 0) / 100 // Convert cents to dollars
      });
    }
    
    return trends;
  }

  async getTenantGeographicAnalytics(): Promise<any> {
    try {
      // Get tenant counts by state (using the state field in tenants table)
      const tenantsByState = await db
        .select({
          state: tenants.state,
          count: count()
        })
        .from(tenants)
        .where(isNotNull(tenants.state))
        .groupBy(tenants.state)
        .orderBy(desc(count()));
      
      // Count unique states
      const uniqueStatesCount = tenantsByState.length;
      
      // Get total US tenants (where country is US or not specified)
      const totalUSTenantResult = await db
        .select({ count: count() })
        .from(tenants)
        .where(or(eq(tenants.country, 'US'), isNull(tenants.country)));
      const totalUSTenants = totalUSTenantResult[0]?.count || 0;
      
      // Get sessions by state (joining with tenants to get state info)
      const sessionsByState = await db
        .select({
          state: tenants.state,
          count: count(futsalSessions.id)
        })
        .from(futsalSessions)
        .leftJoin(tenants, eq(futsalSessions.tenantId, tenants.id))
        .where(isNotNull(tenants.state))
        .groupBy(tenants.state)
        .orderBy(desc(count(futsalSessions.id)));
      
      // Get top 5 states by tenant count
      const topStates = tenantsByState.slice(0, 5);
      
      // If we don't have state data yet, provide a structure with zeros
      if (tenantsByState.length === 0) {
        // Use default states but with real total counts
        const defaultStates = ['CA', 'TX', 'FL', 'NY', 'IL', 'WA', 'AZ', 'CO'];
        const totalTenantCount = await db.select({ count: count() }).from(tenants);
        const tenantCount = totalTenantCount[0]?.count || 0;
        
        // Distribute tenants proportionally if we have any
        const distribution = tenantCount > 0 ? [
          Math.floor(tenantCount * 0.28), // CA
          Math.floor(tenantCount * 0.19), // TX
          Math.floor(tenantCount * 0.14), // FL
          Math.floor(tenantCount * 0.12), // NY
          Math.floor(tenantCount * 0.09), // IL
          Math.floor(tenantCount * 0.08), // WA
          Math.floor(tenantCount * 0.05), // AZ
          Math.floor(tenantCount * 0.05)  // CO
        ] : [0, 0, 0, 0, 0, 0, 0, 0];
        
        return {
          tenantsByState: defaultStates.map((state, i) => ({ state, count: distribution[i] })),
          uniqueStatesCount: tenantCount > 0 ? defaultStates.length : 0,
          totalUSTenants: tenantCount,
          sessionsByState: defaultStates.map((state, i) => ({ state, count: distribution[i] * 5 })), // Estimate sessions
          topStates: defaultStates.slice(0, 5).map((state, i) => ({ state, count: distribution[i] }))
        };
      }
      
      return {
        tenantsByState: tenantsByState.map(t => ({
          state: t.state || 'Unknown',
          count: t.count
        })),
        uniqueStatesCount,
        totalUSTenants,
        sessionsByState: sessionsByState.map(s => ({
          state: s.state || 'Unknown',
          count: s.count
        })),
        topStates: topStates.map(t => ({
          state: t.state || 'Unknown',
          count: t.count
        }))
      };
    } catch (error) {
      console.error("Error fetching geographic analytics:", error);
      // Return structure with zeros if there's an error
      return {
        tenantsByState: [],
        uniqueStatesCount: 0,
        totalUSTenants: 0,
        sessionsByState: [],
        topStates: []
      };
    }
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
      passwordHash: null, // Password will be set separately upon first login or via reset
      authProvider: 'local', // Default to local for password auth
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
      user.role,
      user.tenantName || 'N/A',
      user.status,
      user.createdAt
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }

  async getSuperAdminAnalytics(filters?: any): Promise<any> {
    // Calculate real analytics data from database
    const platformGrowth = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
    
    // Generate daily stats for last 30 days
    for (let i = 0; i <= 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);
      
      // Get counts for this day
      const [userCount, revenueData, sessionCount, tenantCount] = await Promise.all([
        db.select({ count: count() })
          .from(users)
          .where(and(gte(users.createdAt, currentDate), lte(users.createdAt, nextDate))),
        db.select({ total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)` })
          .from(payments)
          .where(and(eq(payments.status, 'paid'), gte(payments.paidAt, currentDate), lte(payments.paidAt, nextDate))),
        db.select({ count: count() })
          .from(futsalSessions)
          .where(and(gte(futsalSessions.createdAt, currentDate), lte(futsalSessions.createdAt, nextDate))),
        db.select({ count: count() })
          .from(tenants)
          .where(and(gte(tenants.createdAt, currentDate), lte(tenants.createdAt, nextDate)))
      ]);
      
      platformGrowth.push({
        date: currentDate.toISOString().split('T')[0],
        users: userCount[0]?.count || 0,
        revenue: Number(revenueData[0]?.total || 0) / 100, // Convert cents to dollars
        sessions: sessionCount[0]?.count || 0,
        tenants: tenantCount[0]?.count || 0
      });
    }

    // Get tenant activity data
    const tenantActivity = await db
      .select({
        name: tenants.name,
        tenantId: tenants.id,
        users: sql<number>`(SELECT COUNT(*) FROM ${users} WHERE ${users.tenantId} = ${tenants.id})`,
        sessions: sql<number>`(SELECT COUNT(*) FROM ${futsalSessions} WHERE ${futsalSessions.tenantId} = ${tenants.id})`,
        revenue: sql<number>`(SELECT COALESCE(SUM(${payments.amountCents}), 0) FROM ${payments} WHERE ${payments.tenantId} = ${tenants.id} AND ${payments.status} = 'paid')`
      })
      .from(tenants)
      .orderBy(desc(sql`(SELECT COALESCE(SUM(${payments.amountCents}), 0) FROM ${payments} WHERE ${payments.tenantId} = ${tenants.id} AND ${payments.status} = 'paid')`))
      .limit(10);
    
    // Calculate growth for each tenant
    const tenantActivityWithGrowth = await Promise.all(
      tenantActivity.map(async (tenant) => {
        // Get revenue from last month
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        const lastMonthRevenue = await db
          .select({ total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)` })
          .from(payments)
          .where(and(
            eq(payments.tenantId, tenant.tenantId),
            eq(payments.status, 'paid'),
            gte(payments.paidAt, lastMonthStart)
          ));
        
        const currentRevenue = Number(tenant.revenue) || 0;
        const previousRevenue = Number(lastMonthRevenue[0]?.total) || 0;
        const growth = previousRevenue > 0 
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
          : 0;
        
        return {
          name: tenant.name,
          users: Number(tenant.users) || 0,
          sessions: Number(tenant.sessions) || 0,
          revenue: currentRevenue / 100, // Convert cents to dollars
          growth: Number(growth.toFixed(1))
        };
      })
    );

    // Get age group distribution from players
    const currentYear = new Date().getFullYear();
    const ageGroups = await db
      .select({
        ageGroup: sql<string>`
          CASE 
            WHEN ${currentYear} - ${players.birthYear} <= 8 THEN 'U8'
            WHEN ${currentYear} - ${players.birthYear} <= 10 THEN 'U10'
            WHEN ${currentYear} - ${players.birthYear} <= 12 THEN 'U12'
            WHEN ${currentYear} - ${players.birthYear} <= 14 THEN 'U14'
            WHEN ${currentYear} - ${players.birthYear} <= 16 THEN 'U16'
            WHEN ${currentYear} - ${players.birthYear} <= 18 THEN 'U18'
            ELSE 'Adult'
          END`,
        count: count()
      })
      .from(players)
      .where(isNotNull(players.birthYear))
      .groupBy(sql`
        CASE 
          WHEN ${currentYear} - ${players.birthYear} <= 8 THEN 'U8'
          WHEN ${currentYear} - ${players.birthYear} <= 10 THEN 'U10'
          WHEN ${currentYear} - ${players.birthYear} <= 12 THEN 'U12'
          WHEN ${currentYear} - ${players.birthYear} <= 14 THEN 'U14'
          WHEN ${currentYear} - ${players.birthYear} <= 16 THEN 'U16'
          WHEN ${currentYear} - ${players.birthYear} <= 18 THEN 'U18'
          ELSE 'Adult'
        END`);
    
    const totalPlayers = ageGroups.reduce((sum, g) => sum + g.count, 0);
    const ageGroupDistribution = ageGroups.map(g => ({
      ageGroup: g.ageGroup,
      count: g.count,
      percentage: totalPlayers > 0 ? Number(((g.count / totalPlayers) * 100).toFixed(1)) : 0
    }));

    // Calculate monthly growth metrics
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const [currentMetrics, previousMetrics] = await Promise.all([
      Promise.all([
        db.select({ total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)` })
          .from(payments)
          .where(and(eq(payments.status, 'paid'), gte(payments.paidAt, lastMonth))),
        db.select({ count: count() })
          .from(users)
          .where(gte(users.createdAt, lastMonth)),
        db.select({ count: count() })
          .from(futsalSessions)
          .where(gte(futsalSessions.createdAt, lastMonth)),
        db.select({ count: count() })
          .from(tenants)
          .where(gte(tenants.createdAt, lastMonth))
      ]),
      Promise.all([
        db.select({ total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)` })
          .from(payments)
          .where(and(eq(payments.status, 'paid'), gte(payments.paidAt, new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000)), lte(payments.paidAt, lastMonth))),
        db.select({ count: count() })
          .from(users)
          .where(and(gte(users.createdAt, new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000)), lte(users.createdAt, lastMonth))),
        db.select({ count: count() })
          .from(futsalSessions)
          .where(and(gte(futsalSessions.createdAt, new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000)), lte(futsalSessions.createdAt, lastMonth))),
        db.select({ count: count() })
          .from(tenants)
          .where(and(gte(tenants.createdAt, new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000)), lte(tenants.createdAt, lastMonth)))
      ])
    ]);

    const calculateGrowth = (current: number, previous: number) => 
      previous > 0 ? Number(((current - previous) / previous * 100).toFixed(1)) : 0;

    const monthlyMetrics = {
      totalRevenue: Number(currentMetrics[0][0]?.total || 0) / 100,
      revenueGrowth: calculateGrowth(Number(currentMetrics[0][0]?.total || 0), Number(previousMetrics[0][0]?.total || 0)),
      totalUsers: await this.getSuperAdminUserCount(),
      userGrowth: calculateGrowth(currentMetrics[1][0]?.count || 0, previousMetrics[1][0]?.count || 0),
      totalSessions: await this.getSuperAdminSessionCount(),
      sessionGrowth: calculateGrowth(currentMetrics[2][0]?.count || 0, previousMetrics[2][0]?.count || 0),
      activeTenants: (await this.getTenants()).length,
      tenantGrowth: calculateGrowth(currentMetrics[3][0]?.count || 0, previousMetrics[3][0]?.count || 0)
    };

    return {
      platformGrowth,
      tenantActivity: tenantActivityWithGrowth.slice(0, 5), // Top 5 tenants
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
      .map(row => row.map(field => `"${String(field ?? '').replace(/"/g, '""')}"`).join(','))
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

  // Consent template operations
  async getConsentTemplates(tenantId: string): Promise<any[]> {
    const templates = await db
      .select()
      .from(consentTemplates)
      .where(and(
        eq(consentTemplates.tenantId, tenantId),
        eq(consentTemplates.isActive, true)
      ))
      .orderBy(consentTemplates.templateType, consentTemplates.createdAt);
    return templates;
  }

  async getConsentTemplate(id: string): Promise<any | null> {
    const [template] = await db
      .select()
      .from(consentTemplates)
      .where(eq(consentTemplates.id, id));
    return template || null;
  }

  async createConsentTemplate(data: any): Promise<any> {
    const [template] = await db
      .insert(consentTemplates)
      .values(data)
      .returning();
    return template;
  }

  async deactivateConsentTemplate(tenantId: string, templateType: string): Promise<void> {
    await db
      .update(consentTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(consentTemplates.tenantId, tenantId),
        eq(consentTemplates.templateType, templateType),
        eq(consentTemplates.isActive, true)
      ));
  }

  async deleteConsentTemplate(id: string): Promise<void> {
    await db
      .delete(consentTemplates)
      .where(eq(consentTemplates.id, id));
  }

  // Tenant feature override operations
  async getTenantFeatureOverrides(tenantId?: string): Promise<any[]> {
    try {
      const query = db
        .select({
          id: tenantFeatureOverrides.id,
          tenantId: tenantFeatureOverrides.tenantId,
          tenantName: tenants.name,
          featureKey: tenantFeatureOverrides.featureKey,
          enabled: tenantFeatureOverrides.enabled,
          variant: tenantFeatureOverrides.variant,
          limitValue: tenantFeatureOverrides.limitValue,
          reason: tenantFeatureOverrides.reason,
          expiresAt: tenantFeatureOverrides.expiresAt,
          createdAt: tenantFeatureOverrides.createdAt,
          updatedAt: tenantFeatureOverrides.updatedAt
        })
        .from(tenantFeatureOverrides)
        .leftJoin(tenants, eq(tenantFeatureOverrides.tenantId, tenants.id));

      if (tenantId) {
        return await query.where(eq(tenantFeatureOverrides.tenantId, tenantId));
      }

      return await query;
    } catch (error) {
      console.error('Error fetching tenant feature overrides:', error);
      return [];
    }
  }

  async setTenantFeatureOverride(tenantId: string, featureKey: string, override: any, userId?: string, ip?: string, userAgent?: string): Promise<void> {
    try {
      // Check if override exists
      const [existing] = await db
        .select()
        .from(tenantFeatureOverrides)
        .where(
          and(
            eq(tenantFeatureOverrides.tenantId, tenantId),
            eq(tenantFeatureOverrides.featureKey, featureKey)
          )
        );

      const oldValue = existing ? {
        enabled: existing.enabled,
        variant: existing.variant,
        limitValue: existing.limitValue
      } : null;

      const newValue = {
        enabled: override.enabled,
        variant: override.variant,
        limitValue: override.limitValue
      };

      if (existing) {
        // Update existing override
        await db
          .update(tenantFeatureOverrides)
          .set({
            enabled: override.enabled,
            variant: override.variant,
            limitValue: override.limitValue,
            reason: override.reason,
            expiresAt: override.expiresAt ? new Date(override.expiresAt) : null,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(tenantFeatureOverrides.tenantId, tenantId),
              eq(tenantFeatureOverrides.featureKey, featureKey)
            )
          );
      } else {
        // Create new override
        await db.insert(tenantFeatureOverrides).values({
          tenantId,
          featureKey,
          enabled: override.enabled,
          variant: override.variant,
          limitValue: override.limitValue,
          reason: override.reason,
          expiresAt: override.expiresAt ? new Date(override.expiresAt) : null
        });
      }

      // Log the change for audit purposes - only if we have a valid user ID
      if (userId && userId !== 'undefined' && userId !== 'null') {
        try {
          // Ensure user exists in database for foreign key constraint
          await db.insert(users)
            .values({
              id: userId,
              email: 'super-admin@system',
              firstName: 'Super',
              lastName: 'Admin',
              role: 'super-admin',
              isAdmin: true,
              isSuperAdmin: true,
              tenantId: 'system'
            })
            .onConflictDoNothing();

          await db.insert(featureAuditLog).values({
            entityType: 'tenant',
            entityId: tenantId,
            featureKey,
            oldValue,
            newValue,
            changedBy: userId,
            changeReason: override.reason || 'Tenant feature override',
            ip: ip || '',
            userAgent: userAgent || ''
          });
        } catch (auditError) {
          // Don't fail the main operation if audit logging fails
          console.warn('Audit logging failed, but tenant override succeeded:', auditError);
        }
      }
    } catch (error) {
      console.error('Error setting tenant feature override:', error);
      throw error;
    }
  }

  async removeTenantFeatureOverride(tenantId: string, featureKey: string): Promise<void> {
    try {
      await db
        .delete(tenantFeatureOverrides)
        .where(
          and(
            eq(tenantFeatureOverrides.tenantId, tenantId),
            eq(tenantFeatureOverrides.featureKey, featureKey)
          )
        );
    } catch (error) {
      console.error('Error removing tenant feature override:', error);
      throw error;
    }
  }

  // Consent document management implementation
  async getConsentTemplates(tenantId: string): Promise<ConsentTemplate[]> {
    return await db
      .select()
      .from(consentTemplates)
      .where(
        and(
          eq(consentTemplates.tenantId, tenantId),
          eq(consentTemplates.isActive, true)
        )
      )
      .orderBy(consentTemplates.templateType, desc(consentTemplates.version));
  }

  async getAllConsentTemplates(tenantId: string): Promise<ConsentTemplate[]> {
    return await db
      .select()
      .from(consentTemplates)
      .where(eq(consentTemplates.tenantId, tenantId))
      .orderBy(consentTemplates.templateType, desc(consentTemplates.version));
  }

  async toggleConsentTemplate(id: string, tenantId: string, isActive: boolean): Promise<ConsentTemplate> {
    const [updatedTemplate] = await db
      .update(consentTemplates)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(consentTemplates.id, id),
          eq(consentTemplates.tenantId, tenantId)
        )
      )
      .returning();
    return updatedTemplate;
  }

  async getConsentTemplate(id: string, tenantId: string): Promise<ConsentTemplate | undefined> {
    const [template] = await db
      .select()
      .from(consentTemplates)
      .where(
        and(
          eq(consentTemplates.id, id),
          eq(consentTemplates.tenantId, tenantId)
        )
      );
    return template;
  }

  async createConsentTemplate(template: InsertConsentTemplate): Promise<ConsentTemplate> {
    const [newTemplate] = await db
      .insert(consentTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateConsentTemplate(id: string, template: Partial<InsertConsentTemplate>): Promise<ConsentTemplate> {
    const [updatedTemplate] = await db
      .update(consentTemplates)
      .set({
        ...template,
        updatedAt: new Date()
      })
      .where(eq(consentTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deactivateConsentTemplate(id: string, tenantId: string): Promise<void> {
    await db
      .update(consentTemplates)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(consentTemplates.id, id),
          eq(consentTemplates.tenantId, tenantId)
        )
      );
  }

  async createConsentDocument(document: InsertConsentDocument): Promise<ConsentDocument> {
    const [newDocument] = await db
      .insert(consentDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async getSignedConsentsByParent(parentId: string, tenantId: string): Promise<Array<{
    id: string;
    templateId: string;
    templateType: string;
    templateTitle: string;
    subjectName: string;
    subjectRole: string;
    signedAt: Date;
    signatureData: any;
  }>> {
    const results = await db
      .select({
        id: consentSignatures.id,
        templateId: consentSignatures.templateId,
        templateType: consentTemplates.templateType,
        templateTitle: consentTemplates.title,
        subjectId: consentSignatures.subjectId,
        subjectRole: consentSignatures.subjectRole,
        signedAt: consentSignatures.signedAt,
        signatureData: consentSignatures.signatureData,
        // Get player or parent name based on subject role
        playerFirstName: sql<string>`CASE WHEN ${consentSignatures.subjectRole} = 'player' THEN players.first_name ELSE NULL END`,
        playerLastName: sql<string>`CASE WHEN ${consentSignatures.subjectRole} = 'player' THEN players.last_name ELSE NULL END`,
        parentFirstName: sql<string>`CASE WHEN ${consentSignatures.subjectRole} = 'parent' THEN users.first_name ELSE NULL END`,
        parentLastName: sql<string>`CASE WHEN ${consentSignatures.subjectRole} = 'parent' THEN users.last_name ELSE NULL END`,
      })
      .from(consentSignatures)
      .innerJoin(consentTemplates, eq(consentSignatures.templateId, consentTemplates.id))
      .leftJoin(players, and(
        eq(consentSignatures.subjectId, players.id),
        eq(consentSignatures.subjectRole, 'player')
      ))
      .leftJoin(users, and(
        eq(consentSignatures.subjectId, users.id),
        eq(consentSignatures.subjectRole, 'parent')
      ))
      .where(
        and(
          eq(consentSignatures.tenantId, tenantId),
          or(
            // Parent signed for themselves
            and(
              eq(consentSignatures.signedById, parentId),
              eq(consentSignatures.subjectRole, 'parent')
            ),
            // Parent signed for their player
            and(
              eq(consentSignatures.signedById, parentId),
              eq(consentSignatures.subjectRole, 'player'),
              // Verify the player belongs to this parent
              or(
                eq(players.parentId, parentId),
                eq(players.parent2Id, parentId)
              )
            )
          )
        )
      )
      .orderBy(desc(consentSignatures.signedAt));

    return results.map(result => ({
      id: result.id,
      templateId: result.templateId,
      templateType: result.templateType,
      templateTitle: result.templateTitle,
      subjectName: result.subjectRole === 'player'
        ? `${result.playerFirstName} ${result.playerLastName}`.trim()
        : `${result.parentFirstName} ${result.parentLastName}`.trim(),
      subjectRole: result.subjectRole,
      signedAt: result.signedAt,
      signatureData: result.signatureData,
    }));
  }

  // Get consent form completion status for a player (for admin views)
  async getPlayerConsentStatus(tenantId: string, playerId: string): Promise<{
    totalTemplates: number;
    completedCount: number;
    missingCount: number;
    completedForms: Array<{
      templateId: string;
      templateTitle: string;
      templateType: string;
      signedAt: Date;
      signedBy: string;
    }>;
    missingForms: Array<{
      templateId: string;
      templateTitle: string;
      templateType: string;
    }>;
  }> {
    // Get all active consent templates for the tenant
    const allTemplates = await db
      .select({
        id: consentTemplates.id,
        title: consentTemplates.title,
        templateType: consentTemplates.templateType,
      })
      .from(consentTemplates)
      .where(
        and(
          eq(consentTemplates.tenantId, tenantId),
          eq(consentTemplates.isActive, true)
        )
      );

    // Get completed forms for this player
    const completedForms = await db
      .select({
        templateId: consentSignatures.templateId,
        templateTitle: consentTemplates.title,
        templateType: consentTemplates.templateType,
        signedAt: consentSignatures.signedAt,
        signedByFirstName: sql<string>`signer.first_name`,
        signedByLastName: sql<string>`signer.last_name`,
      })
      .from(consentSignatures)
      .innerJoin(consentTemplates, eq(consentSignatures.templateId, consentTemplates.id))
      .leftJoin(sql`users as signer`, sql`signer.id = ${consentSignatures.signedById}`)
      .where(
        and(
          eq(consentSignatures.tenantId, tenantId),
          eq(consentSignatures.subjectId, playerId),
          eq(consentSignatures.subjectRole, 'player')
        )
      );

    const completedTemplateIds = new Set(completedForms.map(form => form.templateId));
    const missingForms = allTemplates.filter(template => !completedTemplateIds.has(template.id));

    return {
      totalTemplates: allTemplates.length,
      completedCount: completedForms.length,
      missingCount: missingForms.length,
      completedForms: completedForms.map(form => ({
        templateId: form.templateId,
        templateTitle: form.templateTitle,
        templateType: form.templateType,
        signedAt: form.signedAt,
        signedBy: `${form.signedByFirstName || ''} ${form.signedByLastName || ''}`.trim()
      })),
      missingForms: missingForms.map(template => ({
        templateId: template.id,
        templateTitle: template.title,
        templateType: template.templateType,
      }))
    };
  }

  // Get consent form completion status for a parent (for admin views)
  async getParentConsentStatus(tenantId: string, parentId: string): Promise<{
    totalTemplates: number;
    completedCount: number;
    missingCount: number;
    completedForms: Array<{
      templateId: string;
      templateTitle: string;
      templateType: string;
      signedAt: Date;
      subjectRole: string;
      subjectName: string;
    }>;
    missingForms: Array<{
      templateId: string;
      templateTitle: string;
      templateType: string;
    }>;
  }> {
    // Get all active consent templates for the tenant
    const allTemplates = await db
      .select({
        id: consentTemplates.id,
        title: consentTemplates.title,
        templateType: consentTemplates.templateType,
      })
      .from(consentTemplates)
      .where(
        and(
          eq(consentTemplates.tenantId, tenantId),
          eq(consentTemplates.isActive, true)
        )
      );

    // Get completed forms signed by this parent (for themselves and their players)
    const completedForms = await db
      .select({
        templateId: consentSignatures.templateId,
        templateTitle: consentTemplates.title,
        templateType: consentTemplates.templateType,
        signedAt: consentSignatures.signedAt,
        subjectRole: consentSignatures.subjectRole,
        subjectId: consentSignatures.subjectId,
        // Get subject name based on role
        playerFirstName: sql<string>`CASE WHEN ${consentSignatures.subjectRole} = 'player' THEN players.first_name ELSE NULL END`,
        playerLastName: sql<string>`CASE WHEN ${consentSignatures.subjectRole} = 'player' THEN players.last_name ELSE NULL END`,
        parentFirstName: sql<string>`CASE WHEN ${consentSignatures.subjectRole} = 'parent' THEN users.first_name ELSE NULL END`,
        parentLastName: sql<string>`CASE WHEN ${consentSignatures.subjectRole} = 'parent' THEN users.last_name ELSE NULL END`,
      })
      .from(consentSignatures)
      .innerJoin(consentTemplates, eq(consentSignatures.templateId, consentTemplates.id))
      .leftJoin(players, and(
        eq(consentSignatures.subjectId, players.id),
        eq(consentSignatures.subjectRole, 'player')
      ))
      .leftJoin(users, and(
        eq(consentSignatures.subjectId, users.id),
        eq(consentSignatures.subjectRole, 'parent')
      ))
      .where(
        and(
          eq(consentSignatures.tenantId, tenantId),
          eq(consentSignatures.signedById, parentId)
        )
      );

    // For missing forms, we need to check what this parent should have signed
    // They should sign forms for themselves and their players
    const parentPlayers = await this.getPlayersByParent(parentId);

    const completedTemplateIds = new Set(completedForms.map(form => form.templateId));
    const missingForms = allTemplates.filter(template => !completedTemplateIds.has(template.id));

    return {
      totalTemplates: allTemplates.length,
      completedCount: completedForms.length,
      missingCount: missingForms.length,
      completedForms: (completedForms || []).map(form => ({
        templateId: String(form?.templateId || ''),
        templateTitle: String(form?.templateTitle || ''),
        templateType: String(form?.templateType || ''),
        signedAt: form?.signedAt || new Date(),
        subjectRole: String(form?.subjectRole || ''),
        subjectName: form?.subjectRole === 'player'
          ? `${form?.playerFirstName || ''} ${form?.playerLastName || ''}`.trim()
          : `${form?.parentFirstName || ''} ${form?.parentLastName || ''}`.trim()
      })),
      missingForms: (missingForms || []).map(template => ({
        templateId: String(template?.id || ''),
        templateTitle: String(template?.title || ''),
        templateType: String(template?.templateType || ''),
      }))
    };
  }

  async getConsentDocument(id: string, tenantId: string): Promise<ConsentDocument | undefined> {
    const [document] = await db
      .select()
      .from(consentDocuments)
      .where(
        and(
          eq(consentDocuments.id, id),
          eq(consentDocuments.tenantId, tenantId)
        )
      );
    return document;
  }

  async getConsentDocumentsByPlayer(playerId: string, tenantId: string): Promise<ConsentDocument[]> {
    return await db
      .select()
      .from(consentDocuments)
      .where(
        and(
          eq(consentDocuments.playerId, playerId),
          eq(consentDocuments.tenantId, tenantId),
          eq(consentDocuments.isActive, true)
        )
      )
      .orderBy(desc(consentDocuments.signedAt));
  }

  async getConsentDocumentsByParent(parentId: string, tenantId: string): Promise<ConsentDocument[]> {
    return await db
      .select()
      .from(consentDocuments)
      .where(
        and(
          eq(consentDocuments.parentId, parentId),
          eq(consentDocuments.tenantId, tenantId),
          eq(consentDocuments.isActive, true)
        )
      )
      .orderBy(desc(consentDocuments.signedAt));
  }

  async getRequiredConsentTemplates(tenantId: string): Promise<ConsentTemplate[]> {
    return await db
      .select()
      .from(consentTemplates)
      .where(
        and(
          eq(consentTemplates.tenantId, tenantId),
          eq(consentTemplates.isActive, true)
        )
      )
      .orderBy(consentTemplates.templateType);
  }

  async checkMissingConsentForms(playerId: string, parentId: string, tenantId: string): Promise<ConsentTemplate[]> {
    // Get all required consent templates for this tenant
    const requiredTemplates = await this.getRequiredConsentTemplates(tenantId);

    // Get all consent documents for this player
    const existingDocuments = await db
      .select({
        templateType: consentDocuments.templateType
      })
      .from(consentDocuments)
      .where(
        and(
          eq(consentDocuments.playerId, playerId),
          eq(consentDocuments.parentId, parentId),
          eq(consentDocuments.tenantId, tenantId),
          eq(consentDocuments.isActive, true)
        )
      );

    const completedTypes = new Set(existingDocuments.map(doc => doc.templateType));

    // Return templates that are required but not completed
    return requiredTemplates.filter(template => !completedTypes.has(template.templateType));
  }

  async getAllConsentDocuments(tenantId: string): Promise<ConsentDocument[]> {
    return await db
      .select()
      .from(consentDocuments)
      .where(
        and(
          eq(consentDocuments.tenantId, tenantId),
          eq(consentDocuments.isActive, true)
        )
      )
      .orderBy(desc(consentDocuments.signedAt));
  }

  async createConsentSignature(signature: InsertConsentSignature): Promise<ConsentSignature> {
    const [newSignature] = await db
      .insert(consentSignatures)
      .values(signature)
      .returning();
    return newSignature;
  }

  async getConsentSignaturesByDocument(documentId: string): Promise<ConsentSignature[]> {
    return await db
      .select()
      .from(consentSignatures)
      .where(eq(consentSignatures.documentId, documentId))
      .orderBy(desc(consentSignatures.signedAt));
  }

  async getConsentSignaturesByPlayer(playerId: string, tenantId: string): Promise<ConsentSignature[]> {
    return await db
      .select()
      .from(consentSignatures)
      .where(
        and(
          eq(consentSignatures.playerId, playerId),
          eq(consentSignatures.tenantId, tenantId)
        )
      )
      .orderBy(desc(consentSignatures.signedAt));
  }

  async logConsentDocumentAccess(access: InsertConsentDocumentAccess): Promise<ConsentDocumentAccess> {
    const [newAccess] = await db
      .insert(consentDocumentAccess)
      .values(access)
      .returning();
    return newAccess;
  }

  async getConsentDocumentAccessLog(documentId: string): Promise<ConsentDocumentAccess[]> {
    return await db
      .select()
      .from(consentDocumentAccess)
      .where(eq(consentDocumentAccess.documentId, documentId))
      .orderBy(desc(consentDocumentAccess.accessedAt));
  }

  async createTemplate(data: InsertNotificationTemplate): Promise<NotificationTemplate> {
    const [template] = await db
      .insert(notificationTemplates)
      .values(data)
      .returning();
    return template;
  }

  async getTemplates(tenantId: string, type?: 'email' | 'sms'): Promise<NotificationTemplate[]> {
    const conditions = [eq(notificationTemplates.tenantId, tenantId)];
    if (type) {
      conditions.push(eq(notificationTemplates.type, type));
    }
    return await db
      .select()
      .from(notificationTemplates)
      .where(and(...conditions))
      .orderBy(notificationTemplates.name);
  }

  async getTemplateById(id: string, tenantId: string): Promise<NotificationTemplate | undefined> {
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.id, id),
          eq(notificationTemplates.tenantId, tenantId)
        )
      );
    return template;
  }

  async updateTemplate(id: string, tenantId: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const [updated] = await db
      .update(notificationTemplates)
      .set(data)
      .where(
        and(
          eq(notificationTemplates.id, id),
          eq(notificationTemplates.tenantId, tenantId)
        )
      )
      .returning();
    return updated;
  }

  async deleteTemplate(id: string, tenantId: string): Promise<void> {
    await db
      .delete(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.id, id),
          eq(notificationTemplates.tenantId, tenantId)
        )
      );
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    return notification;
  }

  async getNotifications(tenantId: string, filters?: { status?: string; type?: string; limit?: number }): Promise<Notification[]> {
    const conditions = [eq(notifications.tenantId, tenantId)];
    
    if (filters?.status) {
      conditions.push(eq(notifications.status, filters.status as any));
    }
    if (filters?.type) {
      conditions.push(eq(notifications.type, filters.type as any));
    }

    let query = db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async updateNotificationStatus(id: string, status: string, sentAt?: Date, errorMessage?: string): Promise<Notification> {
    const updateData: any = { status };
    if (sentAt) updateData.sentAt = sentAt;
    if (errorMessage) updateData.errorMessage = errorMessage;

    const [updated] = await db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async createMessageLog(data: InsertMessageLog): Promise<MessageLog> {
    const [log] = await db
      .insert(messageLogs)
      .values(data)
      .returning();
    return log;
  }

  async getMessageLogs(tenantId: string, filters?: { direction?: string; limit?: number }): Promise<MessageLog[]> {
    const conditions = [eq(messageLogs.tenantId, tenantId)];
    
    if (filters?.direction) {
      conditions.push(eq(messageLogs.direction, filters.direction as any));
    }

    let query = db
      .select()
      .from(messageLogs)
      .where(and(...conditions))
      .orderBy(desc(messageLogs.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async createConsentEvent(data: InsertConsentEvent): Promise<ConsentEvent> {
    const [event] = await db
      .insert(consentEvents)
      .values(data)
      .returning();
    return event;
  }

  async getUserConsent(userId: string, channel: 'sms' | 'email'): Promise<ConsentEvent | undefined> {
    const [consent] = await db
      .select()
      .from(consentEvents)
      .where(
        and(
          eq(consentEvents.userId, userId),
          eq(consentEvents.channel, channel)
        )
      )
      .orderBy(desc(consentEvents.occurredAt))
      .limit(1);
    return consent;
  }

  // Contact Groups operations
  async createContactGroup(data: InsertContactGroup): Promise<ContactGroupWithCount> {
    const [group] = await db
      .insert(contactGroups)
      .values(data)
      .returning();
    
    const [groupWithCount] = await db
      .select({
        id: contactGroups.id,
        tenantId: contactGroups.tenantId,
        name: contactGroups.name,
        description: contactGroups.description,
        createdBy: contactGroups.createdBy,
        createdAt: contactGroups.createdAt,
        updatedAt: contactGroups.updatedAt,
        memberCount: sql<number>`COUNT(DISTINCT ${contactGroupMembers.id})::int`
      })
      .from(contactGroups)
      .leftJoin(contactGroupMembers, eq(contactGroups.id, contactGroupMembers.groupId))
      .where(eq(contactGroups.id, group.id))
      .groupBy(contactGroups.id);
    
    return groupWithCount as ContactGroupWithCount;
  }

  async getContactGroups(tenantId: string): Promise<ContactGroupWithCount[]> {
    const groups = await db
      .select({
        id: contactGroups.id,
        tenantId: contactGroups.tenantId,
        name: contactGroups.name,
        description: contactGroups.description,
        createdBy: contactGroups.createdBy,
        createdAt: contactGroups.createdAt,
        updatedAt: contactGroups.updatedAt,
        memberCount: sql<number>`COUNT(DISTINCT ${contactGroupMembers.id})::int`
      })
      .from(contactGroups)
      .leftJoin(contactGroupMembers, eq(contactGroups.id, contactGroupMembers.groupId))
      .where(eq(contactGroups.tenantId, tenantId))
      .groupBy(contactGroups.id)
      .orderBy(desc(contactGroups.createdAt));
    
    return groups as ContactGroupWithCount[];
  }

  async getContactGroupById(id: string, tenantId: string): Promise<ContactGroup | undefined> {
    const [group] = await db
      .select()
      .from(contactGroups)
      .where(and(eq(contactGroups.id, id), eq(contactGroups.tenantId, tenantId)));
    return group;
  }

  async updateContactGroup(id: string, tenantId: string, data: Partial<InsertContactGroup>): Promise<ContactGroupWithCount> {
    const [updated] = await db
      .update(contactGroups)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contactGroups.id, id), eq(contactGroups.tenantId, tenantId)))
      .returning();
    
    const [groupWithCount] = await db
      .select({
        id: contactGroups.id,
        tenantId: contactGroups.tenantId,
        name: contactGroups.name,
        description: contactGroups.description,
        createdBy: contactGroups.createdBy,
        createdAt: contactGroups.createdAt,
        updatedAt: contactGroups.updatedAt,
        memberCount: sql<number>`COUNT(DISTINCT ${contactGroupMembers.id})::int`
      })
      .from(contactGroups)
      .leftJoin(contactGroupMembers, eq(contactGroups.id, contactGroupMembers.groupId))
      .where(eq(contactGroups.id, id))
      .groupBy(contactGroups.id);
    
    return groupWithCount as ContactGroupWithCount;
  }

  async deleteContactGroup(id: string, tenantId: string): Promise<void> {
    await db
      .delete(contactGroups)
      .where(and(eq(contactGroups.id, id), eq(contactGroups.tenantId, tenantId)));
  }

  async addGroupMember(groupId: string, userId: string, addedBy: string): Promise<ContactGroupMember> {
    const [member] = await db
      .insert(contactGroupMembers)
      .values({ groupId, userId, addedBy })
      .returning();
    return member;
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await db
      .delete(contactGroupMembers)
      .where(
        and(
          eq(contactGroupMembers.groupId, groupId),
          eq(contactGroupMembers.userId, userId)
        )
      );
  }

  async getGroupMembers(groupId: string): Promise<Array<ContactGroupMember & { user: User }>> {
    const members = await db
      .select()
      .from(contactGroupMembers)
      .leftJoin(users, eq(contactGroupMembers.userId, users.id))
      .where(eq(contactGroupMembers.groupId, groupId));
    
    return members.map(m => ({
      ...m.contact_group_members,
      user: m.users!
    }));
  }

  async getUserGroups(userId: string, tenantId: string): Promise<ContactGroup[]> {
    const groups = await db
      .select({
        id: contactGroups.id,
        tenantId: contactGroups.tenantId,
        name: contactGroups.name,
        description: contactGroups.description,
        createdBy: contactGroups.createdBy,
        createdAt: contactGroups.createdAt,
        updatedAt: contactGroups.updatedAt,
      })
      .from(contactGroupMembers)
      .innerJoin(contactGroups, eq(contactGroupMembers.groupId, contactGroups.id))
      .where(
        and(
          eq(contactGroupMembers.userId, userId),
          eq(contactGroups.tenantId, tenantId)
        )
      );
    
    return groups;
  }

  // Household operations
  async getHouseholds(tenantId: string): Promise<Array<HouseholdSelect & { memberCount: number; members: Array<HouseholdMemberSelect & { user?: User; player?: Player }> }>> {
    const householdsList = await db
      .select()
      .from(households)
      .where(eq(households.tenantId, tenantId))
      .orderBy(desc(households.createdAt));

    const result = await Promise.all(
      householdsList.map(async (household) => {
        const members = await db
          .select()
          .from(householdMembers)
          .leftJoin(users, eq(householdMembers.userId, users.id))
          .leftJoin(players, eq(householdMembers.playerId, players.id))
          .where(eq(householdMembers.householdId, household.id));

        const enrichedMembers = members.map(m => ({
          ...m.household_members,
          user: m.users || undefined,
          player: m.players || undefined,
        }));

        return {
          ...household,
          memberCount: enrichedMembers.length,
          members: enrichedMembers,
        };
      })
    );

    return result;
  }

  async getHousehold(id: string, tenantId: string): Promise<(HouseholdSelect & { members: Array<HouseholdMemberSelect & { user?: User; player?: Player }> }) | undefined> {
    const [household] = await db
      .select()
      .from(households)
      .where(and(eq(households.id, id), eq(households.tenantId, tenantId)));

    if (!household) return undefined;

    const members = await db
      .select()
      .from(householdMembers)
      .leftJoin(users, eq(householdMembers.userId, users.id))
      .leftJoin(players, eq(householdMembers.playerId, players.id))
      .where(eq(householdMembers.householdId, id));

    const enrichedMembers = members.map(m => ({
      ...m.household_members,
      user: m.users || undefined,
      player: m.players || undefined,
    }));

    return {
      ...household,
      members: enrichedMembers,
    };
  }

  async getUserHousehold(userId: string, tenantId: string): Promise<HouseholdSelect | null> {
    const [membership] = await db
      .select({
        household: households,
      })
      .from(householdMembers)
      .innerJoin(households, eq(householdMembers.householdId, households.id))
      .where(and(
        eq(householdMembers.userId, userId),
        eq(householdMembers.tenantId, tenantId)
      ))
      .limit(1);

    return membership?.household || null;
  }

  async createHousehold(household: HouseholdInsert): Promise<HouseholdSelect> {
    const [newHousehold] = await db
      .insert(households)
      .values(household)
      .returning();
    return newHousehold;
  }

  async updateHousehold(id: string, tenantId: string, data: Partial<HouseholdInsert>): Promise<HouseholdSelect> {
    const [updated] = await db
      .update(households)
      .set(data)
      .where(and(eq(households.id, id), eq(households.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteHousehold(id: string, tenantId: string): Promise<void> {
    await db
      .delete(households)
      .where(and(eq(households.id, id), eq(households.tenantId, tenantId)));
  }

  async addHouseholdMember(householdId: string, tenantId: string, member: Omit<HouseholdMemberInsert, 'id' | 'householdId' | 'tenantId' | 'addedAt'>): Promise<HouseholdSelect & { members: Array<HouseholdMemberSelect & { user?: User; player?: Player }> }> {
    await db
      .insert(householdMembers)
      .values({
        ...member,
        householdId,
        tenantId,
      });

    const household = await this.getHousehold(householdId, tenantId);
    if (!household) {
      throw new Error('Household not found');
    }
    return household;
  }

  async removeHouseholdMember(memberId: string, tenantId: string): Promise<void> {
    await db
      .delete(householdMembers)
      .where(and(eq(householdMembers.id, memberId), eq(householdMembers.tenantId, tenantId)));
  }

  // Wearables operations implementation
  async getWearableIntegrations(tenantId: string, playerId?: string): Promise<WearableIntegration[]> {
    let query = db.select().from(wearableIntegrations).where(eq(wearableIntegrations.tenantId, tenantId));
    
    if (playerId) {
      query = query.where(and(
        eq(wearableIntegrations.tenantId, tenantId),
        eq(wearableIntegrations.playerId, playerId)
      ));
    }
    
    return await query.orderBy(desc(wearableIntegrations.createdAt));
  }

  async getWearableIntegration(id: string, tenantId: string): Promise<WearableIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(wearableIntegrations)
      .where(and(
        eq(wearableIntegrations.id, id),
        eq(wearableIntegrations.tenantId, tenantId)
      ));
    return integration;
  }

  async createWearableIntegration(integration: InsertWearableIntegration): Promise<WearableIntegration> {
    const [newIntegration] = await db
      .insert(wearableIntegrations)
      .values(integration)
      .returning();
    return newIntegration;
  }

  async updateWearableIntegration(id: string, data: Partial<InsertWearableIntegration>): Promise<WearableIntegration> {
    const [updated] = await db
      .update(wearableIntegrations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(wearableIntegrations.id, id))
      .returning();
    return updated;
  }

  async deleteWearableIntegration(id: string, tenantId: string): Promise<void> {
    await db
      .delete(wearableIntegrations)
      .where(and(
        eq(wearableIntegrations.id, id),
        eq(wearableIntegrations.tenantId, tenantId)
      ));
  }

  // Wearable data operations
  async createWearableData(data: InsertWearableData): Promise<WearableData> {
    const [newData] = await db
      .insert(wearableData)
      .values(data)
      .returning();
    return newData;
  }

  async getWearableData(
    tenantId: string,
    playerId: string,
    filters?: {
      dataType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<WearableData[]> {
    let query = db
      .select()
      .from(wearableData)
      .where(and(
        eq(wearableData.tenantId, tenantId),
        eq(wearableData.playerId, playerId)
      ));

    if (filters?.dataType) {
      query = query.where(eq(wearableData.dataType, filters.dataType as any));
    }

    if (filters?.startDate) {
      query = query.where(gte(wearableData.recordedAt, filters.startDate));
    }

    if (filters?.endDate) {
      query = query.where(lte(wearableData.recordedAt, filters.endDate));
    }

    query = query.orderBy(desc(wearableData.recordedAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  // Player metrics operations
  async getPlayerMetrics(
    tenantId: string,
    playerId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<PlayerMetrics[]> {
    let query = db
      .select()
      .from(playerMetrics)
      .where(and(
        eq(playerMetrics.tenantId, tenantId),
        eq(playerMetrics.playerId, playerId)
      ));

    if (filters?.startDate) {
      query = query.where(gte(playerMetrics.date, filters.startDate.toISOString().split('T')[0]));
    }

    if (filters?.endDate) {
      query = query.where(lte(playerMetrics.date, filters.endDate.toISOString().split('T')[0]));
    }

    return await query.orderBy(desc(playerMetrics.date));
  }

  async getLatestPlayerMetrics(tenantId: string, playerId: string): Promise<PlayerMetrics | undefined> {
    const [latest] = await db
      .select()
      .from(playerMetrics)
      .where(and(
        eq(playerMetrics.tenantId, tenantId),
        eq(playerMetrics.playerId, playerId)
      ))
      .orderBy(desc(playerMetrics.date))
      .limit(1);
    return latest;
  }

  async upsertPlayerMetrics(metrics: InsertPlayerMetrics): Promise<PlayerMetrics> {
    const existing = await db
      .select()
      .from(playerMetrics)
      .where(and(
        eq(playerMetrics.playerId, metrics.playerId),
        eq(playerMetrics.date, metrics.date)
      ))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(playerMetrics)
        .set({ ...metrics, updatedAt: new Date() })
        .where(eq(playerMetrics.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(playerMetrics)
        .values(metrics)
        .returning();
      return created;
    }
  }

  async aggregatePlayerMetrics(tenantId: string, playerId: string, date: Date): Promise<PlayerMetrics> {
    // This method would aggregate raw wearable data for a specific date
    // For now, returning a placeholder implementation
    const dateStr = date.toISOString().split('T')[0];
    
    // In a real implementation, we would aggregate data from wearableData table
    const metrics: InsertPlayerMetrics = {
      tenantId,
      playerId,
      date: dateStr,
      avgHeartRate: null,
      maxHeartRate: null,
      restingHeartRate: null,
      steps: null,
      distance: null,
      caloriesBurned: null,
      activeMinutes: null,
      sleepDuration: null,
      sleepQuality: null,
      recoveryScore: null,
      trainingLoad: null,
      vo2Max: null,
    };
    
    return await this.upsertPlayerMetrics(metrics);
  }
}

export const storage = new DatabaseStorage();