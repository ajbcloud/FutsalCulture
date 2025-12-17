/**
 * BATCH INVITATION PROCESSING SERVICE
 * Handles large-scale invitation processing with job queuing, progress tracking,
 * failure handling, and retry logic.
 */

import { db } from '../db';
import { 
  invitationBatches, 
  unifiedInvitations, 
  invitationAnalytics,
  type InvitationBatch,
  type UnifiedInvitation,
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { generateInviteToken } from '../utils/invite-helpers';
import { emailTemplateService } from './unified-email-templates';
import type { BatchInvitationRequest } from '@shared/schema';

export interface BatchProcessingOptions {
  concurrency: number; // Number of parallel processes
  retryAttempts: number; // Number of retry attempts per failed invitation
  retryDelay: number; // Delay between retries in milliseconds
  progressCallback?: (progress: BatchProgress) => void;
}

export interface BatchProgress {
  batchId: string;
  total: number;
  completed: number;
  successful: number;
  failed: number;
  inProgress: number;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  errors: BatchError[];
}

export interface BatchError {
  email: string;
  error: string;
  attempts: number;
  timestamp: Date;
}

export interface BatchInvitationItem {
  email: string;
  name?: string;
  metadata?: Record<string, any>;
}

/**
 * Batch Invitation Processor
 * Handles batch processing with comprehensive error handling and progress tracking
 */
export class BatchInvitationProcessor {
  private activeJobs = new Map<string, BatchJob>();
  private defaultOptions: BatchProcessingOptions = {
    concurrency: 5,
    retryAttempts: 3,
    retryDelay: 2000,
  };

  /**
   * Process a batch of invitations
   */
  async processBatch(
    batchRequest: BatchInvitationRequest, 
    tenantId: string,
    createdBy: string,
    options: Partial<BatchProcessingOptions> = {}
  ): Promise<{ batchId: string; job: BatchJob }> {
    const processingOptions = { ...this.defaultOptions, ...options };
    
    // Create batch record
    const [batch] = await db.insert(invitationBatches)
      .values({
        tenantId,
        createdBy,
        totalInvitations: batchRequest.recipients.length,
        status: 'processing',
        metadata: {
          type: batchRequest.type,
          role: batchRequest.role,
          expirationDays: batchRequest.expirationDays,
          ...batchRequest.metadata,
        },
      })
      .returning();

    // Create batch job
    const job = new BatchJob(batch, batchRequest, tenantId, createdBy, processingOptions);
    this.activeJobs.set(batch.id, job);

    // Start processing (async)
    job.start().catch(error => {
      console.error(`Batch job ${batch.id} failed:`, error);
    });

    return { batchId: batch.id, job };
  }

  /**
   * Get batch progress
   */
  async getBatchProgress(batchId: string): Promise<BatchProgress | null> {
    const job = this.activeJobs.get(batchId);
    if (job) {
      return job.getProgress();
    }

    // If job not in memory, get from database
    const batch = await db.select()
      .from(invitationBatches)
      .where(eq(invitationBatches.id, batchId))
      .limit(1);

    if (!batch[0]) {
      return null;
    }

    const invitations = await db.select()
      .from(unifiedInvitations)
      .where(eq(unifiedInvitations.batchId, batchId));

    const successful = invitations.filter(inv => inv.status === 'sent' || inv.status === 'accepted').length;
    const failed = invitations.filter(inv => inv.status === 'cancelled').length;
    const completed = successful + failed;

    return {
      batchId,
      total: batch[0].totalInvitations,
      completed,
      successful,
      failed,
      inProgress: batch[0].totalInvitations - completed,
      status: batch[0].status,
      errors: [], // Would load from errorLog if needed
    };
  }

  /**
   * Cancel a batch processing job
   */
  async cancelBatch(batchId: string): Promise<boolean> {
    const job = this.activeJobs.get(batchId);
    if (job) {
      job.cancel();
      return true;
    }

    // Update database status
    await db.update(invitationBatches)
      .set({ status: 'cancelled' })
      .where(eq(invitationBatches.id, batchId));

    return true;
  }

  /**
   * Retry failed invitations in a batch
   */
  async retryFailedInvitations(batchId: string): Promise<{ retriedCount: number }> {
    // Get failed invitations
    const failedInvitations = await db.select()
      .from(unifiedInvitations)
      .where(and(
        eq(unifiedInvitations.batchId, batchId),
        eq(unifiedInvitations.status, 'cancelled')
      ));

    let retriedCount = 0;
    for (const invitation of failedInvitations) {
      try {
        if (invitation.type === 'email') {
          await emailTemplateService.sendEmail({
            to: invitation.recipientEmail,
            template: {
              type: 'invitation',
              variant: 'html',
              data: {
                tenantId: invitation.tenantId,
                tenantName: '', // Would fetch from tenant
                recipientName: invitation.recipientName || invitation.recipientEmail,
                recipientEmail: invitation.recipientEmail,
                senderName: '', // Would fetch from creator
                role: invitation.role,
                inviteUrl: `${process.env.NODE_ENV === 'production' ? 'https://skorehq.app' : process.env.REPLIT_APP_URL}/accept-invite?token=${invitation.token}`,
                expiresAt: invitation.expiresAt,
                customMessage: invitation.customMessage || undefined,
              },
            },
            trackingId: invitation.id,
          });

          // Update status
          await db.update(unifiedInvitations)
            .set({ status: 'sent', sentAt: new Date(), updatedAt: new Date() })
            .where(eq(unifiedInvitations.id, invitation.id));

          retriedCount++;
        }
      } catch (error) {
        console.error(`Failed to retry invitation ${invitation.id}:`, error);
      }
    }

    return { retriedCount };
  }

  /**
   * Clean up completed jobs from memory
   */
  cleanup(): void {
    for (const [batchId, job] of this.activeJobs.entries()) {
      if (job.isCompleted()) {
        this.activeJobs.delete(batchId);
      }
    }
  }
}

/**
 * Individual Batch Job Handler
 */
class BatchJob {
  private cancelled = false;
  private progress: BatchProgress;
  private processingQueue: BatchInvitationItem[] = [];
  private completedItems: string[] = [];
  private errors: BatchError[] = [];

  constructor(
    private batch: InvitationBatch,
    private request: BatchInvitationRequest,
    private tenantId: string,
    private createdBy: string,
    private options: BatchProcessingOptions
  ) {
    this.progress = {
      batchId: batch.id,
      total: request.recipients.length,
      completed: 0,
      successful: 0,
      failed: 0,
      inProgress: 0,
      status: 'processing',
      errors: [],
    };

    this.processingQueue = [...request.recipients];
  }

  /**
   * Start batch processing
   */
  async start(): Promise<void> {
    try {
      console.log(`🚀 Starting batch job ${this.batch.id} with ${this.request.recipients.length} invitations`);

      // Process invitations with controlled concurrency
      await this.processWithConcurrency();

      // Update final status
      const finalStatus = this.errors.length > 0 && this.progress.successful === 0 ? 'failed' : 'completed';
      
      await db.update(invitationBatches)
        .set({
          status: finalStatus,
          successfulInvitations: this.progress.successful,
          failedInvitations: this.progress.failed,
          errorLog: this.errors,
          completedAt: new Date(),
        })
        .where(eq(invitationBatches.id, this.batch.id));

      this.progress.status = finalStatus;
      
      console.log(`✅ Batch job ${this.batch.id} completed: ${this.progress.successful}/${this.progress.total} successful`);

    } catch (error) {
      console.error(`❌ Batch job ${this.batch.id} failed:`, error);
      
      await db.update(invitationBatches)
        .set({
          status: 'failed',
          errorLog: [{ error: error.message, timestamp: new Date() }],
        })
        .where(eq(invitationBatches.id, this.batch.id));

      this.progress.status = 'failed';
    }
  }

  /**
   * Process invitations with controlled concurrency
   */
  private async processWithConcurrency(): Promise<void> {
    const chunks = this.chunkArray(this.processingQueue, this.options.concurrency);
    
    for (const chunk of chunks) {
      if (this.cancelled) break;
      
      const promises = chunk.map(item => this.processInvitation(item));
      await Promise.allSettled(promises);
      
      // Update progress
      this.progress.completed += chunk.length;
      this.progress.inProgress = this.progress.total - this.progress.completed;
      
      // Call progress callback if provided
      if (this.options.progressCallback) {
        this.options.progressCallback(this.progress);
      }
    }
  }

  /**
   * Process a single invitation with retry logic
   */
  private async processInvitation(item: BatchInvitationItem): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      if (this.cancelled) return;
      
      try {
        await this.sendInvitation(item);
        this.progress.successful++;
        this.completedItems.push(item.email);
        return;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt}/${this.options.retryAttempts} failed for ${item.email}:`, error.message);
        
        if (attempt < this.options.retryAttempts) {
          await this.delay(this.options.retryDelay * attempt); // Exponential backoff
        }
      }
    }
    
    // All attempts failed
    this.progress.failed++;
    this.errors.push({
      email: item.email,
      error: lastError?.message || 'Unknown error',
      attempts: this.options.retryAttempts,
      timestamp: new Date(),
    });
  }

  /**
   * Send individual invitation
   */
  private async sendInvitation(item: BatchInvitationItem): Promise<void> {
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.request.expirationDays);

    // Create invitation record
    const [invitation] = await db.insert(unifiedInvitations)
      .values({
        tenantId: this.tenantId,
        batchId: this.batch.id,
        type: this.request.type,
        recipientEmail: item.email,
        recipientName: item.name,
        role: this.request.role as any,
        token,
        customMessage: this.request.customMessage,
        metadata: { ...this.request.metadata, ...item.metadata },
        expiresAt,
        createdBy: this.createdBy,
      })
      .returning();

    // Send email if type is email
    if (this.request.type === 'email') {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://skorehq.app' 
        : (process.env.REPLIT_APP_URL || 'https://localhost:5000');

      await emailTemplateService.sendEmail({
        to: item.email,
        template: {
          type: 'invitation',
          variant: 'html',
          data: {
            tenantId: this.tenantId,
            tenantName: '', // Would fetch from tenant table
            recipientName: item.name || item.email,
            recipientEmail: item.email,
            senderName: '', // Would fetch from user table
            role: this.request.role,
            inviteUrl: `${baseUrl}/accept-invite?token=${token}`,
            expiresAt,
            customMessage: this.request.customMessage,
          },
        },
        trackingId: invitation.id,
      });

      // Update status to sent
      await db.update(unifiedInvitations)
        .set({ status: 'sent', sentAt: new Date() })
        .where(eq(unifiedInvitations.id, invitation.id));
    }

    // Track analytics
    await db.insert(invitationAnalytics)
      .values({
        invitationId: invitation.id,
        tenantId: this.tenantId,
        eventType: 'sent',
        eventData: { 
          method: 'batch',
          batchId: this.batch.id,
          type: this.request.type 
        },
      });
  }

  /**
   * Utility methods
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getProgress(): BatchProgress {
    return { ...this.progress, errors: [...this.errors] };
  }

  cancel(): void {
    this.cancelled = true;
    this.progress.status = 'cancelled';
  }

  isCompleted(): boolean {
    return ['completed', 'failed', 'cancelled'].includes(this.progress.status);
  }
}

// Export singleton instance
export const batchProcessor = new BatchInvitationProcessor();

// Cleanup interval - run every 5 minutes
setInterval(() => {
  batchProcessor.cleanup();
}, 5 * 60 * 1000);