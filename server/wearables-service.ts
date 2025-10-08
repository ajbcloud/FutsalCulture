import crypto from 'crypto';
import { storage } from './storage';
import { nanoid } from 'nanoid';
import type { 
  WearableIntegration, 
  InsertWearableIntegration,
  WearableData,
  InsertWearableData,
  PlayerMetrics,
  InsertPlayerMetrics
} from '@shared/schema';

// Encryption configuration
const ENCRYPTION_KEY = process.env.WEARABLES_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';

// Provider configurations
const PROVIDER_CONFIGS = {
  fitbit: {
    name: 'Fitbit',
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    apiBaseUrl: 'https://api.fitbit.com',
    scopes: ['activity', 'heartrate', 'sleep', 'profile'],
    oauthVersion: '2.0',
  },
  garmin: {
    name: 'Garmin Connect',
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    tokenUrl: 'https://connect.garmin.com/oauth/token',
    apiBaseUrl: 'https://apis.garmin.com/wellness-api/rest',
    scopes: ['activities', 'metrics', 'sleep'],
    oauthVersion: '1.0a',
  },
  strava: {
    name: 'Strava',
    authUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    apiBaseUrl: 'https://www.strava.com/api/v3',
    scopes: ['activity:read', 'activity:read_all'],
    oauthVersion: '2.0',
  },
  apple_health: {
    name: 'Apple Health',
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    apiBaseUrl: 'https://api.apple-health.com',
    scopes: ['healthkit.read'],
    oauthVersion: '2.0',
  },
  google_fit: {
    name: 'Google Fit',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiBaseUrl: 'https://www.googleapis.com/fitness/v1',
    scopes: [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.body.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/fitness.sleep.read'
    ],
    oauthVersion: '2.0',
  },
  whoop: {
    name: 'WHOOP',
    authUrl: 'https://api.whoop.com/oauth/authorize',
    tokenUrl: 'https://api.whoop.com/oauth/token',
    apiBaseUrl: 'https://api.whoop.com/v1',
    scopes: ['read:recovery', 'read:cycles', 'read:workout'],
    oauthVersion: 'api_key',
  },
  polar: {
    name: 'Polar',
    authUrl: 'https://flow.polar.com/oauth2/authorization',
    tokenUrl: 'https://polarremote.com/v2/oauth2/token',
    apiBaseUrl: 'https://www.polaraccesslink.com/v3',
    scopes: ['accesslink.read_all'],
    oauthVersion: '2.0',
  },
};

export class WearablesService {
  // Encryption methods
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(64);
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 2145, 32, 'sha512');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  }

  private decrypt(encryptedData: string): string {
    const bData = Buffer.from(encryptedData, 'base64');
    
    const salt = bData.slice(0, 64);
    const iv = bData.slice(64, 80);
    const tag = bData.slice(80, 96);
    const text = bData.slice(96);
    
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 2145, 32, 'sha512');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    return decipher.update(text) + decipher.final('utf8');
  }

  // OAuth flow methods
  async initiateOAuth(
    provider: keyof typeof PROVIDER_CONFIGS,
    tenantId: string,
    playerId: string,
    redirectUri: string
  ): Promise<{ authUrl: string; state: string }> {
    const config = PROVIDER_CONFIGS[provider];
    const state = nanoid();
    
    // Store state in session or cache for verification
    // In production, use Redis or similar
    
    const params = new URLSearchParams({
      client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`] || 'mock_client_id',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: Array.isArray(config.scopes) ? config.scopes.join(' ') : config.scopes,
      state: state,
    });
    
    return {
      authUrl: `${config.authUrl}?${params.toString()}`,
      state: state,
    };
  }

  async handleOAuthCallback(
    provider: keyof typeof PROVIDER_CONFIGS,
    code: string,
    state: string,
    tenantId: string,
    playerId: string
  ): Promise<WearableIntegration> {
    // Verify state matches stored state
    // Exchange code for tokens
    
    // Mock token exchange for development
    const mockTokens = {
      access_token: `mock_access_token_${nanoid()}`,
      refresh_token: `mock_refresh_token_${nanoid()}`,
      expires_in: 3600,
      scope: PROVIDER_CONFIGS[provider].scopes.join(' '),
    };
    
    // Encrypt tokens before storing
    const encryptedAccessToken = this.encrypt(mockTokens.access_token);
    const encryptedRefreshToken = this.encrypt(mockTokens.refresh_token);
    
    // Check if integration already exists
    const existingIntegrations = await storage.getWearableIntegrations(tenantId, playerId);
    const existing = existingIntegrations.find(i => i.provider === provider);
    
    if (existing) {
      // Update existing integration
      return await storage.updateWearableIntegration(existing.id, {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: new Date(Date.now() + mockTokens.expires_in * 1000),
        scope: mockTokens.scope,
        isActive: true,
        lastSyncAt: new Date(),
      });
    } else {
      // Create new integration
      const integration: InsertWearableIntegration = {
        tenantId,
        playerId,
        provider: provider as any,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: new Date(Date.now() + mockTokens.expires_in * 1000),
        scope: mockTokens.scope,
        isActive: true,
        lastSyncAt: new Date(),
        syncFrequency: 60, // Default 60 minutes
        webhookUrl: null,
        metadata: {},
      };
      
      return await storage.createWearableIntegration(integration);
    }
  }

  // Token refresh
  async refreshTokens(integration: WearableIntegration): Promise<void> {
    const config = PROVIDER_CONFIGS[integration.provider as keyof typeof PROVIDER_CONFIGS];
    
    if (!integration.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const decryptedRefreshToken = this.decrypt(integration.refreshToken);
    
    // Mock token refresh for development
    const newTokens = {
      access_token: `mock_new_access_token_${nanoid()}`,
      refresh_token: `mock_new_refresh_token_${nanoid()}`,
      expires_in: 3600,
    };
    
    await storage.updateWearableIntegration(integration.id, {
      accessToken: this.encrypt(newTokens.access_token),
      refreshToken: this.encrypt(newTokens.refresh_token),
      expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
    });
  }

  // Data synchronization
  async syncWearableData(integration: WearableIntegration): Promise<void> {
    try {
      // Check if token needs refresh
      if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
        await this.refreshTokens(integration);
      }
      
      // Fetch data based on provider
      const data = await this.fetchProviderData(integration);
      
      // Normalize and store data
      await this.normalizeAndStoreData(integration, data);
      
      // Update last sync time
      await storage.updateWearableIntegration(integration.id, {
        lastSyncAt: new Date(),
      });
      
      // Aggregate daily metrics
      await this.aggregateDailyMetrics(integration.tenantId, integration.playerId);
    } catch (error) {
      console.error(`Failed to sync wearable data for integration ${integration.id}:`, error);
      throw error;
    }
  }

  private async fetchProviderData(integration: WearableIntegration): Promise<any> {
    // Mock data fetching for development
    const mockData = {
      heartRate: {
        resting: 60 + Math.floor(Math.random() * 20),
        average: 70 + Math.floor(Math.random() * 30),
        max: 150 + Math.floor(Math.random() * 40),
      },
      activity: {
        steps: 5000 + Math.floor(Math.random() * 10000),
        distance: 3000 + Math.floor(Math.random() * 7000),
        calories: 1500 + Math.floor(Math.random() * 1500),
        activeMinutes: 30 + Math.floor(Math.random() * 90),
      },
      sleep: {
        duration: 360 + Math.floor(Math.random() * 180), // 6-9 hours in minutes
        quality: 60 + Math.floor(Math.random() * 40),
      },
      recovery: {
        score: 50 + Math.floor(Math.random() * 50),
        hrv: 20 + Math.floor(Math.random() * 80),
      },
    };
    
    return mockData;
  }

  private async normalizeAndStoreData(integration: WearableIntegration, rawData: any): Promise<void> {
    const now = new Date();
    
    // Store heart rate data
    if (rawData.heartRate) {
      const heartRateData: InsertWearableData = {
        integrationId: integration.id,
        playerId: integration.playerId,
        tenantId: integration.tenantId,
        dataType: 'heart_rate' as any,
        recordedAt: now,
        value: rawData.heartRate,
        unit: 'bpm',
        source: integration.provider,
        metadata: {},
      };
      await storage.createWearableData(heartRateData);
    }
    
    // Store activity data
    if (rawData.activity) {
      const activityData: InsertWearableData = {
        integrationId: integration.id,
        playerId: integration.playerId,
        tenantId: integration.tenantId,
        dataType: 'activity' as any,
        recordedAt: now,
        value: rawData.activity,
        unit: 'mixed',
        source: integration.provider,
        metadata: {},
      };
      await storage.createWearableData(activityData);
    }
    
    // Store sleep data
    if (rawData.sleep) {
      const sleepData: InsertWearableData = {
        integrationId: integration.id,
        playerId: integration.playerId,
        tenantId: integration.tenantId,
        dataType: 'sleep' as any,
        recordedAt: now,
        value: rawData.sleep,
        unit: 'minutes',
        source: integration.provider,
        metadata: {},
      };
      await storage.createWearableData(sleepData);
    }
    
    // Store recovery data
    if (rawData.recovery) {
      const recoveryData: InsertWearableData = {
        integrationId: integration.id,
        playerId: integration.playerId,
        tenantId: integration.tenantId,
        dataType: 'recovery' as any,
        recordedAt: now,
        value: rawData.recovery,
        unit: 'score',
        source: integration.provider,
        metadata: {},
      };
      await storage.createWearableData(recoveryData);
    }
  }

  async aggregateDailyMetrics(tenantId: string, playerId: string): Promise<PlayerMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Fetch today's data
    const todaysData = await storage.getWearableData(tenantId, playerId, {
      startDate: today,
      endDate: tomorrow,
    });
    
    // Aggregate metrics
    const metrics: InsertPlayerMetrics = {
      tenantId,
      playerId,
      date: today.toISOString().split('T')[0],
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
    
    // Process each data point
    todaysData.forEach((data) => {
      if (data.dataType === 'heart_rate' && typeof data.value === 'object') {
        const hr = data.value as any;
        metrics.avgHeartRate = hr.average || null;
        metrics.maxHeartRate = hr.max || null;
        metrics.restingHeartRate = hr.resting || null;
      } else if (data.dataType === 'activity' && typeof data.value === 'object') {
        const activity = data.value as any;
        metrics.steps = activity.steps || null;
        metrics.distance = activity.distance ? String(activity.distance) : null;
        metrics.caloriesBurned = activity.calories || null;
        metrics.activeMinutes = activity.activeMinutes || null;
      } else if (data.dataType === 'sleep' && typeof data.value === 'object') {
        const sleep = data.value as any;
        metrics.sleepDuration = sleep.duration || null;
        metrics.sleepQuality = sleep.quality ? String(sleep.quality) : null;
      } else if (data.dataType === 'recovery' && typeof data.value === 'object') {
        const recovery = data.value as any;
        metrics.recoveryScore = recovery.score ? String(recovery.score) : null;
      }
    });
    
    // Calculate training load (simplified formula)
    if (metrics.activeMinutes && metrics.avgHeartRate) {
      const intensity = (metrics.avgHeartRate - 60) / 120; // Normalized intensity
      metrics.trainingLoad = String(metrics.activeMinutes * intensity);
    }
    
    return await storage.upsertPlayerMetrics(metrics);
  }

  // Webhook handlers
  async handleWebhook(provider: string, data: any): Promise<void> {
    // Verify webhook signature based on provider
    // Process incoming real-time data
    console.log(`Received webhook from ${provider}:`, data);
    
    // Find integration and process data
    // This would be implemented based on actual webhook format
  }

  // Data export
  async exportPlayerMetrics(
    tenantId: string,
    playerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const metrics = await storage.getPlayerMetrics(tenantId, playerId, { startDate, endDate });
    
    // Convert to CSV format
    const headers = [
      'Date',
      'Avg Heart Rate',
      'Max Heart Rate',
      'Resting Heart Rate',
      'Steps',
      'Distance (m)',
      'Calories',
      'Active Minutes',
      'Sleep Duration (min)',
      'Sleep Quality',
      'Recovery Score',
      'Training Load',
      'VO2 Max',
    ];
    
    const rows = metrics.map((m) => [
      m.date,
      m.avgHeartRate || '',
      m.maxHeartRate || '',
      m.restingHeartRate || '',
      m.steps || '',
      m.distance || '',
      m.caloriesBurned || '',
      m.activeMinutes || '',
      m.sleepDuration || '',
      m.sleepQuality || '',
      m.recoveryScore || '',
      m.trainingLoad || '',
      m.vo2Max || '',
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
  }

  // Recovery recommendations
  generateRecoveryRecommendations(metrics: PlayerMetrics): string[] {
    const recommendations: string[] = [];
    
    // Check recovery score
    if (metrics.recoveryScore && parseFloat(metrics.recoveryScore) < 50) {
      recommendations.push('Consider a lighter training load today for better recovery');
    }
    
    // Check sleep quality
    if (metrics.sleepQuality && parseFloat(metrics.sleepQuality) < 60) {
      recommendations.push('Focus on improving sleep quality - aim for 7-9 hours');
    }
    
    // Check training load
    if (metrics.trainingLoad && parseFloat(metrics.trainingLoad) > 100) {
      recommendations.push('High training load detected - ensure adequate recovery time');
    }
    
    // Check resting heart rate
    if (metrics.restingHeartRate && metrics.restingHeartRate > 70) {
      recommendations.push('Elevated resting heart rate - may indicate stress or fatigue');
    }
    
    return recommendations;
  }

  // Anomaly detection
  detectAnomalies(metrics: PlayerMetrics[], current: PlayerMetrics): string[] {
    const anomalies: string[] = [];
    
    if (metrics.length < 7) {
      return anomalies; // Need at least a week of data
    }
    
    // Calculate averages from historical data
    const avgSteps = metrics.reduce((sum, m) => sum + (m.steps || 0), 0) / metrics.length;
    const avgHeartRate = metrics.reduce((sum, m) => sum + (m.avgHeartRate || 0), 0) / metrics.length;
    
    // Check for significant deviations
    if (current.steps && Math.abs(current.steps - avgSteps) > avgSteps * 0.5) {
      anomalies.push(`Unusual step count: ${current.steps} (average: ${Math.round(avgSteps)})`);
    }
    
    if (current.avgHeartRate && Math.abs(current.avgHeartRate - avgHeartRate) > 20) {
      anomalies.push(`Unusual heart rate: ${current.avgHeartRate} bpm (average: ${Math.round(avgHeartRate)} bpm)`);
    }
    
    return anomalies;
  }
}

export const wearablesService = new WearablesService();