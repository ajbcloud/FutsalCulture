import { db } from './db';
import { tenants, users, players, signups, payments } from '../shared/schema';
import { eq, and, gte, lte, sql, count, desc, or } from 'drizzle-orm';
import { getCurrentTrialSettings, type TrialSettings } from './controllers/superAdmin/platformSettings';
import { addDays, isAfter, isBefore, differenceInDays } from 'date-fns';

// Comprehensive Trial Management System
export class TrialManager {
  private trialSettings: TrialSettings | null = null;

  constructor() {
    this.loadTrialSettings();
  }

  private async loadTrialSettings() {
    this.trialSettings = await getCurrentTrialSettings();
  }

  // Check if user is eligible for trial
  async checkTrialEligibility(email: string, ipAddress?: string, paymentMethodId?: string): Promise<{
    eligible: boolean;
    reason?: string;
    cooldownEnds?: Date;
    riskScore: number;
  }> {
    if (!this.trialSettings?.enabled) {
      return { eligible: false, reason: 'Trials are currently disabled', riskScore: 100 };
    }

    const settings = this.trialSettings;
    let riskScore = 0;

    // Check email-based abuse prevention
    const emailTrials = await db.select({ count: count() })
      .from(tenants)
      .where(and(
        eq(tenants.contactEmail, email),
        sql`${tenants.trialHistory} @> '[{}]'::jsonb` // Has trial history
      ));

    if (emailTrials[0].count >= settings.abusePreventionRules.maxTrialsPerEmail) {
      return { eligible: false, reason: 'Maximum trials per email exceeded', riskScore: 100 };
    }

    // Check IP-based abuse prevention
    if (ipAddress) {
      const ipTrials = await db.select({ count: count() })
        .from(tenants)
        .where(and(
          eq(tenants.signupIpAddress, ipAddress),
          sql`${tenants.trialHistory} @> '[{}]'::jsonb`
        ));

      if (ipTrials[0].count >= settings.abusePreventionRules.maxTrialsPerIP) {
        return { eligible: false, reason: 'Maximum trials per IP address exceeded', riskScore: 90 };
      }
      riskScore += Math.min(ipTrials[0].count * 10, 40);
    }

    // Check payment method-based abuse prevention
    if (paymentMethodId) {
      // This would need to be implemented with actual payment method tracking
      riskScore += 0; // Placeholder for payment method risk assessment
    }

    // Check cooldown period for previous trial attempts
    const recentTrial = await db.select()
      .from(tenants)
      .where(and(
        eq(tenants.contactEmail, email),
        sql`${tenants.trialHistory} @> '[{}]'::jsonb`
      ))
      .orderBy(desc(tenants.createdAt))
      .limit(1);

    if (recentTrial.length > 0) {
      const lastTrialEnd = new Date(recentTrial[0].trialEndsAt || recentTrial[0].createdAt);
      const cooldownEnd = addDays(lastTrialEnd, settings.abusePreventionRules.cooldownBetweenTrialsDays);
      
      if (isAfter(cooldownEnd, new Date())) {
        return { 
          eligible: false, 
          reason: 'Cooldown period active', 
          cooldownEnds: cooldownEnd,
          riskScore: 70
        };
      }
    }

    return { eligible: true, riskScore };
  }

  // Start a trial for a tenant
  async startTrial(tenantId: string, options?: {
    trialPlan?: 'core' | 'growth' | 'elite';
    paymentMethodProvided?: boolean;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{
    success: boolean;
    trialEndsAt?: Date;
    trialPlan?: string;
    error?: string;
  }> {
    if (!this.trialSettings) await this.loadTrialSettings();
    const settings = this.trialSettings!;

    const trialPlan = options?.trialPlan || settings.defaultTrialPlan;
    const trialStartsAt = new Date();
    const trialEndsAt = addDays(trialStartsAt, settings.durationDays);

    try {
      // Update tenant with trial information
      const [updatedTenant] = await db.update(tenants)
        .set({
          trialStartedAt: trialStartsAt,
          trialEndsAt: trialEndsAt,
          trialPlan,
          planLevel: trialPlan as any,
          billingStatus: 'trial',
          paymentMethodRequired: settings.requirePaymentMethod,
          paymentMethodVerified: options?.paymentMethodProvided || false,
          signupIpAddress: options?.ipAddress,
          signupUserAgent: options?.userAgent,
          trialHistory: sql`COALESCE(${tenants.trialHistory}, '[]'::jsonb) || jsonb_build_array(
            jsonb_build_object(
              'startedAt', ${trialStartsAt.toISOString()}::text,
              'plan', ${trialPlan}::text,
              'durationDays', ${settings.durationDays}::integer
            )
          )`
        })
        .where(eq(tenants.id, tenantId))
        .returning();

      // Schedule notifications
      await this.scheduleTrialNotifications(tenantId, trialStartsAt, trialEndsAt);

      return {
        success: true,
        trialEndsAt,
        trialPlan,
      };
    } catch (error) {
      console.error('Error starting trial:', error);
      return {
        success: false,
        error: 'Failed to start trial'
      };
    }
  }

  // Handle plan changes during trial
  async handleTrialPlanChange(tenantId: string, newPlan: 'core' | 'growth' | 'elite', reason: 'upgrade' | 'downgrade' | 'customer_request'): Promise<{
    success: boolean;
    dataRetentionActions?: string[];
    error?: string;
  }> {
    if (!this.trialSettings) await this.loadTrialSettings();
    const settings = this.trialSettings!;

    if (!settings.allowPlanChangeDuringTrial) {
      return { success: false, error: 'Plan changes during trial are not allowed' };
    }

    try {
      const [tenant] = await db.select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!tenant || tenant.billingStatus !== 'trial') {
        return { success: false, error: 'Tenant not found or not in trial' };
      }

      const currentPlan = tenant.trialPlan || tenant.planLevel;
      const dataRetentionActions: string[] = [];

      // Handle data retention for downgrades
      if (this.isPlanDowngrade(currentPlan, newPlan)) {
        const retentionActions = await this.handlePlanDowngradeDataRetention(tenantId, currentPlan, newPlan);
        dataRetentionActions.push(...retentionActions);
      }

      // Update tenant plan
      await db.update(tenants)
        .set({
          lastPlanLevel: currentPlan as any,
          trialPlan: newPlan,
          planLevel: newPlan,
          planChangeReason: reason,
          pendingPlanChangeAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

      return {
        success: true,
        dataRetentionActions,
      };
    } catch (error) {
      console.error('Error handling trial plan change:', error);
      return {
        success: false,
        error: 'Failed to change trial plan'
      };
    }
  }

  // Process trial expiration
  async processTrialExpiration(tenantId: string): Promise<{
    success: boolean;
    action: 'converted_to_free' | 'converted_to_paid' | 'grace_period' | 'suspended';
    gracePeriodEnds?: Date;
    dataArchived?: boolean;
  }> {
    if (!this.trialSettings) await this.loadTrialSettings();
    const settings = this.trialSettings!;

    try {
      const [tenant] = await db.select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!tenant) {
        return { success: false, action: 'suspended' };
      }

      // Check if payment method is verified
      if (settings.requirePaymentMethod && !tenant.paymentMethodVerified) {
        // Start grace period for payment method
        const gracePeriodEnds = addDays(new Date(), settings.paymentMethodGracePeriodHours / 24);
        
        await db.update(tenants)
          .set({
            billingStatus: 'pending_downgrade',
            gracePeriodEndsAt: gracePeriodEnds,
            gracePeriodReason: 'payment_method_required',
          })
          .where(eq(tenants.id, tenantId));

        return {
          success: true,
          action: 'grace_period',
          gracePeriodEnds,
        };
      }

      // Auto-convert based on settings
      if (settings.autoConvertToFree) {
        // Archive advanced feature data if downgrading
        const dataArchived = await this.archiveAdvancedFeatureData(tenantId, tenant.trialPlan, 'free');
        
        await db.update(tenants)
          .set({
            lastPlanLevel: tenant.trialPlan,
            planLevel: 'free', // Free tier
            billingStatus: 'none',
            trialPlan: null,
            planChangeReason: 'trial_end',
          })
          .where(eq(tenants.id, tenantId));

        return {
          success: true,
          action: 'converted_to_free',
          dataArchived,
        };
      }

      // Default: start grace period
      const gracePeriodEnds = addDays(new Date(), settings.gracePeriodDays);
      
      await db.update(tenants)
        .set({
          billingStatus: 'pending_downgrade',
          gracePeriodEndsAt: gracePeriodEnds,
          gracePeriodReason: 'trial_expired',
        })
        .where(eq(tenants.id, tenantId));

      return {
        success: true,
        action: 'grace_period',
        gracePeriodEnds,
      };
    } catch (error) {
      console.error('Error processing trial expiration:', error);
      return { success: false, action: 'suspended' };
    }
  }

  // Handle data retention for plan downgrades
  private async handlePlanDowngradeDataRetention(tenantId: string, fromPlan: string, toPlan: string): Promise<string[]> {
    if (!this.trialSettings) await this.loadTrialSettings();
    const settings = this.trialSettings!;

    const actions: string[] = [];

    if (!settings.planTransitionRules.preserveDataOnDowngrade) {
      return actions;
    }

    // Archive advanced analytics data
    if (this.planHasAdvancedAnalytics(fromPlan) && !this.planHasAdvancedAnalytics(toPlan)) {
      await this.archiveAnalyticsData(tenantId);
      actions.push('Advanced analytics data archived');
    }

    // Archive player development data
    if (this.planHasPlayerDevelopment(fromPlan) && !this.planHasPlayerDevelopment(toPlan)) {
      await this.archivePlayerDevelopmentData(tenantId);
      actions.push('Player development data archived');
    }

    // Handle player limit enforcement
    const newLimit = this.getPlanPlayerLimit(toPlan);
    const currentPlayerCount = await this.getCurrentPlayerCount(tenantId);
    
    if (currentPlayerCount > newLimit) {
      if (settings.planTransitionRules.playerLimitEnforcement === 'strict') {
        actions.push(`Player limit will be strictly enforced: ${currentPlayerCount}/${newLimit} players`);
      } else if (settings.planTransitionRules.playerLimitEnforcement === 'soft') {
        actions.push(`Player limit exceeded but access maintained: ${currentPlayerCount}/${newLimit} players`);
      } else {
        const gracePeriod = addDays(new Date(), settings.planTransitionRules.featureAccessGracePeriod);
        actions.push(`Grace period until ${gracePeriod.toLocaleDateString()} to reduce players: ${currentPlayerCount}/${newLimit}`);
      }
    }

    return actions;
  }

  // Archive advanced feature data
  private async archiveAdvancedFeatureData(tenantId: string, fromPlan: string, toPlan: string): Promise<boolean> {
    try {
      const archivePaths: Record<string, string> = {};
      
      // Archive analytics data if losing advanced analytics
      if (this.planHasAdvancedAnalytics(fromPlan) && !this.planHasAdvancedAnalytics(toPlan)) {
        archivePaths.analytics = await this.archiveAnalyticsData(tenantId);
      }

      // Archive player development data if losing player development
      if (this.planHasPlayerDevelopment(fromPlan) && !this.planHasPlayerDevelopment(toPlan)) {
        archivePaths.playerDevelopment = await this.archivePlayerDevelopmentData(tenantId);
      }

      // Update tenant with archived data paths
      if (Object.keys(archivePaths).length > 0) {
        await db.update(tenants)
          .set({
            archivedDataPaths: sql`COALESCE(${tenants.archivedDataPaths}, '{}'::jsonb) || ${JSON.stringify(archivePaths)}::jsonb`
          })
          .where(eq(tenants.id, tenantId));
      }

      return true;
    } catch (error) {
      console.error('Error archiving advanced feature data:', error);
      return false;
    }
  }

  // Helper methods for plan feature checks
  private planHasAdvancedAnalytics(plan: string): boolean {
    return ['growth', 'elite'].includes(plan);
  }

  private planHasPlayerDevelopment(plan: string): boolean {
    return plan === 'elite';
  }

  private getPlanPlayerLimit(plan: string): number {
    const limits = {
      free: 50,
      core: 150,
      growth: 500,
      elite: 999999 // Unlimited
    };
    return limits[plan as keyof typeof limits] || 50;
  }

  private isPlanDowngrade(fromPlan: string, toPlan: string): boolean {
    const hierarchy = { free: 0, core: 1, growth: 2, elite: 3 };
    return (hierarchy[fromPlan as keyof typeof hierarchy] || 0) > (hierarchy[toPlan as keyof typeof hierarchy] || 0);
  }

  private async getCurrentPlayerCount(tenantId: string): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(players)
      .where(eq(players.tenantId, tenantId));
    return result?.count || 0;
  }

  private async archiveAnalyticsData(tenantId: string): Promise<string> {
    // Implementation would archive analytics data to object storage
    // Return the path where data was archived
    return `/archived/${tenantId}/analytics/${Date.now()}`;
  }

  private async archivePlayerDevelopmentData(tenantId: string): Promise<string> {
    // Implementation would archive player development data to object storage
    // Return the path where data was archived
    return `/archived/${tenantId}/player-development/${Date.now()}`;
  }

  private async scheduleTrialNotifications(tenantId: string, trialStart: Date, trialEnd: Date) {
    // Implementation would schedule email/SMS notifications based on trial settings
    console.log(`Scheduled trial notifications for tenant ${tenantId}: ${trialStart} to ${trialEnd}`);
  }

  // Check current trial status for a tenant
  async checkTrialStatus(tenantId: string): Promise<{
    status: 'active' | 'expired' | 'grace' | 'none';
    gracePeriodEndsAt?: Date;
  }> {
    const tenant = await db.select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant.length || !tenant[0].trialEndsAt) {
      return { status: 'none' };
    }

    const now = new Date();
    const trialEndsAt = new Date(tenant[0].trialEndsAt);
    
    if (isAfter(now, trialEndsAt)) {
      // Check if in grace period
      if (tenant[0].trialGracePeriodEndsAt) {
        const gracePeriodEndsAt = new Date(tenant[0].trialGracePeriodEndsAt);
        if (isAfter(now, gracePeriodEndsAt)) {
          return { status: 'expired' };
        } else {
          return { status: 'grace', gracePeriodEndsAt };
        }
      }
      return { status: 'expired' };
    }

    return { status: 'active' };
  }

  // Get extension status for a tenant
  async getExtensionStatus(tenantId: string): Promise<{
    extensionsUsed: number;
    maxExtensions: number;
    canExtend: boolean;
  }> {
    if (!this.trialSettings) await this.loadTrialSettings();
    const settings = this.trialSettings!;

    const tenant = await db.select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant.length) {
      return { extensionsUsed: 0, maxExtensions: 0, canExtend: false };
    }

    const extensionsUsed = tenant[0].trialExtensionsUsed || 0;
    const maxExtensions = settings.maxExtensions;
    const canExtend = extensionsUsed < maxExtensions && 
                     (tenant[0].billingStatus === 'trialing' || tenant[0].billingStatus === 'trial');

    return { extensionsUsed, maxExtensions, canExtend };
  }

  // Extend a trial
  async extendTrial(tenantId: string, options?: {
    reason?: string;
  }): Promise<{
    success: boolean;
    newTrialEndsAt?: Date;
    extensionsRemaining?: number;
    error?: string;
  }> {
    if (!this.trialSettings) await this.loadTrialSettings();
    const settings = this.trialSettings!;

    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    const extensionsUsed = tenant.trialExtensionsUsed || 0;
    const maxExtensions = settings.maxExtensions;

    if (extensionsUsed >= maxExtensions) {
      return { success: false, error: 'Maximum extensions reached' };
    }

    if (!tenant.trialEndsAt) {
      return { success: false, error: 'No active trial to extend' };
    }

    const currentTrialEnd = new Date(tenant.trialEndsAt);
    const newTrialEnd = addDays(currentTrialEnd, settings.extensionDurationDays);

    // Update tenant with extended trial
    await db.update(tenants)
      .set({
        trialEndsAt: newTrialEnd,
        trialExtensionsUsed: extensionsUsed + 1,
        trialExtensionHistory: sql`COALESCE(${tenants.trialExtensionHistory}, '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object(
            'extendedAt', ${new Date().toISOString()}::text,
            'reason', ${options?.reason || 'user_requested'}::text,
            'daysAdded', ${settings.extensionDurationDays}::integer
          )
        )`
      })
      .where(eq(tenants.id, tenantId));

    return {
      success: true,
      newTrialEndsAt: newTrialEnd,
      extensionsRemaining: maxExtensions - (extensionsUsed + 1)
    };
  }

  // Process all expired trials (run as background job)
  async processExpiredTrials(): Promise<void> {
    const expiredTrials = await db.select()
      .from(tenants)
      .where(and(
        eq(tenants.billingStatus, 'trial'),
        lte(tenants.trialEndsAt, new Date())
      ));

    for (const tenant of expiredTrials) {
      await this.processTrialExpiration(tenant.id);
      
      // Add delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Clean up expired grace periods (run as background job)
  async processExpiredGracePeriods(): Promise<void> {
    const expiredGracePeriods = await db.select()
      .from(tenants)
      .where(and(
        eq(tenants.billingStatus, 'pending_downgrade'),
        lte(tenants.gracePeriodEndsAt, new Date())
      ));

    for (const tenant of expiredGracePeriods) {
      // Force downgrade to free plan
      await db.update(tenants)
        .set({
          lastPlanLevel: tenant.planLevel,
          planLevel: 'free', // Free tier
          billingStatus: 'none',
          trialPlan: null,
          planChangeReason: 'grace_period_expired',
          gracePeriodEndsAt: null,
          gracePeriodReason: null,
        })
        .where(eq(tenants.id, tenant.id));
    }
  }
}

// Export singleton instance
export const trialManager = new TrialManager();