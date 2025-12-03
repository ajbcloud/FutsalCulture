CREATE TYPE "public"."age_band" AS ENUM('child', 'teen', 'adult');--> statement-breakpoint
CREATE TYPE "public"."business_signup_token_status" AS ENUM('pending', 'attached', 'expired');--> statement-breakpoint
CREATE TYPE "public"."code_type" AS ENUM('invite', 'access', 'discount');--> statement-breakpoint
CREATE TYPE "public"."comm_template_type" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."consent_channel" AS ENUM('sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('opt_in', 'opt_out');--> statement-breakpoint
CREATE TYPE "public"."credit_type" AS ENUM('user', 'tenant');--> statement-breakpoint
CREATE TYPE "public"."dunning_status" AS ENUM('failed', 'retry_scheduled', 'retrying', 'recovered', 'uncollectible');--> statement-breakpoint
CREATE TYPE "public"."email_event" AS ENUM('processed', 'delivered', 'open', 'click', 'bounce', 'dropped', 'spamreport', 'deferred');--> statement-breakpoint
CREATE TYPE "public"."feature_request_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."feature_request_status" AS ENUM('received', 'under_review', 'approved', 'in_development', 'released');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('boys', 'girls');--> statement-breakpoint
CREATE TYPE "public"."impersonation_status" AS ENUM('issued', 'active', 'ended', 'expired');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('twilio', 'sendgrid', 'google', 'microsoft', 'stripe', 'zoom', 'calendar', 'mailchimp', 'quickbooks', 'braintree', 'resend', 'telnyx');--> statement-breakpoint
CREATE TYPE "public"."invitation_analytics_event" AS ENUM('sent', 'viewed', 'accepted', 'expired', 'bounced', 'clicked');--> statement-breakpoint
CREATE TYPE "public"."invitation_batch_status" AS ENUM('processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'sent', 'viewed', 'accepted', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."invitation_type" AS ENUM('email', 'code', 'parent2', 'player');--> statement-breakpoint
CREATE TYPE "public"."invite_token_purpose" AS ENUM('signup_welcome', 'add_membership', 'player_link');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'open', 'paid', 'uncollectible', 'void');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('outbound', 'inbound');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."payment_processor" AS ENUM('stripe', 'braintree');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."plan_level" AS ENUM('free', 'core', 'growth', 'elite');--> statement-breakpoint
CREATE TYPE "public"."quickbooks_sync_status" AS ENUM('idle', 'syncing', 'error', 'success');--> statement-breakpoint
CREATE TYPE "public"."quickbooks_transaction_type" AS ENUM('session_payment', 'subscription_payment', 'refund', 'credit_issued', 'credit_redeemed', 'chargeback', 'processing_fee', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."session_visibility" AS ENUM('public', 'private', 'access_code_required');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('upcoming', 'open', 'full', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."sms_credit_transaction_type" AS ENUM('purchase', 'usage', 'refund', 'bonus', 'adjustment', 'expiration');--> statement-breakpoint
CREATE TYPE "public"."sms_event" AS ENUM('queued', 'sent', 'delivered', 'undelivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscription_event_type" AS ENUM('subscription_created', 'subscription_activated', 'subscription_charged', 'subscription_charge_failed', 'subscription_past_due', 'subscription_canceled', 'subscription_expired', 'plan_upgraded', 'plan_downgraded', 'plan_downgrade_scheduled', 'plan_downgrade_cancelled', 'payment_method_updated', 'dispute_opened', 'dispute_won', 'dispute_lost');--> statement-breakpoint
CREATE TYPE "public"."tenant_membership_role" AS ENUM('parent', 'player', 'coach', 'admin');--> statement-breakpoint
CREATE TYPE "public"."tenant_membership_status" AS ENUM('active', 'pending');--> statement-breakpoint
CREATE TYPE "public"."unsubscribe_channel" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('parent', 'adult', 'player', 'tenant_admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'locked');--> statement-breakpoint
CREATE TYPE "public"."waitlist_offer_status" AS ENUM('none', 'offered', 'accepted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."waitlist_status" AS ENUM('active', 'offered', 'accepted', 'removed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."wearable_data_type" AS ENUM('heart_rate', 'steps', 'distance', 'calories', 'sleep', 'activity', 'workout', 'recovery');--> statement-breakpoint
CREATE TYPE "public"."wearable_provider" AS ENUM('fitbit', 'garmin', 'strava', 'apple_health', 'google_fit', 'whoop', 'polar');--> statement-breakpoint
CREATE TYPE "public"."webhook_attempt_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TABLE "ai_anomalies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"scope_type" varchar(50) NOT NULL,
	"scope_id" varchar,
	"metric" varchar(50) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"zscore" real NOT NULL,
	"expected" integer NOT NULL,
	"actual" integer NOT NULL,
	"severity" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_contributions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"metric" varchar(50) NOT NULL,
	"driver_type" varchar(50) NOT NULL,
	"driver_id" varchar NOT NULL,
	"driver_label" varchar NOT NULL,
	"impact_abs" integer NOT NULL,
	"impact_pct" real NOT NULL,
	"rank" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_forecasts_daily" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"scope_type" varchar(50) NOT NULL,
	"scope_id" varchar,
	"metric" varchar(50) NOT NULL,
	"mean" integer NOT NULL,
	"p10" integer NOT NULL,
	"p90" integer NOT NULL,
	"model" varchar DEFAULT 'prophet',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_narratives" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"scope_type" varchar(50) NOT NULL,
	"scope_id" varchar,
	"summary_md" text NOT NULL,
	"drivers_md" text NOT NULL,
	"risks_md" text NOT NULL,
	"forecast_md" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tenant_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"date" date NOT NULL,
	"churn_risk" real NOT NULL,
	"health_score" integer NOT NULL,
	"top_signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_snapshots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"session_id" varchar NOT NULL,
	"attended" boolean NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"user_id" varchar,
	"user_role" varchar,
	"action" varchar NOT NULL,
	"resource_type" varchar NOT NULL,
	"resource_id" varchar,
	"details" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"actor_user_id" varchar,
	"event_type" varchar,
	"target_id" varchar,
	"metadata_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"user_id" varchar,
	"actor_id" varchar NOT NULL,
	"actor_role" text NOT NULL,
	"section" text NOT NULL,
	"action" text NOT NULL,
	"target_id" text NOT NULL,
	"meta" jsonb,
	"diff" jsonb,
	"ip" text,
	"is_impersonated" boolean DEFAULT false,
	"impersonator_id" varchar,
	"impersonation_event_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "beta_plan_features" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_key" varchar NOT NULL,
	"feature_key" varchar NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"limits_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_signup_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"tenant_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"org_name" varchar NOT NULL,
	"status" "business_signup_token_status" DEFAULT 'pending',
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '24 hours' NOT NULL,
	"attached_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "business_signup_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "comm_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "comm_template_type" NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"version" integer DEFAULT 1,
	"active" boolean DEFAULT true,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "communication_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"recipient_type" text NOT NULL,
	"recipient_filters" jsonb,
	"schedule" text NOT NULL,
	"scheduled_for" timestamp with time zone,
	"recurring_pattern" text,
	"recurring_days" text[],
	"recurring_time" text,
	"recurring_end_date" timestamp with time zone,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"last_sent_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_by" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communication_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"recipient_email" text,
	"recipient_phone" text,
	"status" text NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "consent_document_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"accessed_by" varchar NOT NULL,
	"access_type" varchar NOT NULL,
	"accessed_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"access_details" jsonb
);
--> statement-breakpoint
CREATE TABLE "consent_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"parent_id" varchar NOT NULL,
	"template_id" varchar NOT NULL,
	"template_type" varchar NOT NULL,
	"document_title" varchar NOT NULL,
	"document_version" integer DEFAULT 1 NOT NULL,
	"pdf_file_path" varchar NOT NULL,
	"pdf_file_name" varchar NOT NULL,
	"pdf_file_size" integer,
	"signed_at" timestamp NOT NULL,
	"signer_ip_address" varchar,
	"signer_user_agent" text,
	"digital_signature" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"channel" "consent_channel" NOT NULL,
	"type" "consent_type" NOT NULL,
	"source" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"occurred_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" varchar NOT NULL,
	"parent_id" varchar NOT NULL,
	"consent_type" varchar NOT NULL,
	"consent_given" boolean NOT NULL,
	"consent_date" timestamp NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_signatures" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"parent_id" varchar NOT NULL,
	"template_type" varchar NOT NULL,
	"signature_method" varchar DEFAULT 'electronic' NOT NULL,
	"signature_data" jsonb,
	"consent_given" boolean NOT NULL,
	"signed_at" timestamp NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"browser_fingerprint" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"template_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text,
	"file_path" varchar,
	"file_name" varchar,
	"file_size" integer,
	"is_custom" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_group_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"added_by" varchar,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_id" varchar NOT NULL,
	"credit_type" "credit_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"session_id" varchar,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"expires_at" timestamp,
	"used_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dev_achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"badge_key" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"awarded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dev_skill_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dev_skill_rubrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"skill_id" varchar NOT NULL,
	"level" integer NOT NULL,
	"label" varchar NOT NULL,
	"descriptor" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dev_skills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"sport" varchar,
	"age_band" varchar,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"code" varchar NOT NULL,
	"description" text,
	"discount_type" varchar DEFAULT 'full' NOT NULL,
	"discount_value" integer,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true,
	"locked_to_player_id" varchar,
	"locked_to_parent_id" varchar,
	"stripe_coupon_id" varchar,
	"stripe_promotion_code_id" varchar,
	"braintree_discount_id" varchar,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drills_library" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"objective" text,
	"equipment" text,
	"steps" text NOT NULL,
	"video_url" varchar,
	"tags" varchar[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dunning_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar NOT NULL,
	"attempt_no" integer DEFAULT 1 NOT NULL,
	"status" "dunning_status" DEFAULT 'failed' NOT NULL,
	"gateway_txn_id" text,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_bounces" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"bounce_type" varchar NOT NULL,
	"reason" text,
	"bounced_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"message_id" text NOT NULL,
	"tenant_id" varchar,
	"template_key" text,
	"to_addr" text NOT NULL,
	"event" "email_event" NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verifications_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "feature_adoption_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"user_id" varchar,
	"feature_key" text NOT NULL,
	"occurred_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feature_audit_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"feature_key" varchar NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb NOT NULL,
	"changed_by" varchar NOT NULL,
	"change_reason" text,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_level" "plan_level" NOT NULL,
	"feature_key" varchar NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feature_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"status" "feature_request_status" DEFAULT 'received' NOT NULL,
	"priority" "feature_request_priority" DEFAULT 'medium' NOT NULL,
	"plan_level" "plan_level" NOT NULL,
	"submitted_by" varchar NOT NULL,
	"reviewed_by" varchar,
	"status_notes" text,
	"estimated_review_weeks" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "features" (
	"key" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"options_json" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"transaction_type" "quickbooks_transaction_type" NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar DEFAULT 'USD',
	"source_type" varchar NOT NULL,
	"source_id" varchar NOT NULL,
	"user_id" varchar,
	"player_id" varchar,
	"session_id" varchar,
	"processor_type" "payment_processor",
	"processor_transaction_id" varchar,
	"qb_sync_status" varchar DEFAULT 'pending',
	"qb_synced_at" timestamp,
	"qb_transaction_id" varchar,
	"qb_error" text,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"transaction_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "futsal_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"location" varchar NOT NULL,
	"location_name" text,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text DEFAULT 'US',
	"lat" text,
	"lng" text,
	"gmaps_place_id" text,
	"age_groups" text[] NOT NULL,
	"genders" text[] NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"capacity" integer DEFAULT 12 NOT NULL,
	"price_cents" integer DEFAULT 1000 NOT NULL,
	"status" "session_status" DEFAULT 'upcoming' NOT NULL,
	"booking_open_hour" integer DEFAULT 8,
	"booking_open_minute" integer DEFAULT 0,
	"no_time_constraints" boolean DEFAULT false,
	"days_before_booking" integer,
	"visibility" "session_visibility" DEFAULT 'private',
	"has_access_code" boolean DEFAULT false,
	"access_code" varchar,
	"waitlist_enabled" boolean DEFAULT true,
	"waitlist_limit" integer,
	"payment_window_minutes" integer DEFAULT 60,
	"auto_promote" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "help_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"phone" varchar,
	"email" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"category" varchar NOT NULL,
	"priority" varchar DEFAULT 'medium' NOT NULL,
	"message" text NOT NULL,
	"source" varchar DEFAULT 'main_page' NOT NULL,
	"resolved" boolean DEFAULT false,
	"resolved_by" varchar,
	"resolution_note" text,
	"resolved_at" timestamp,
	"first_response_at" timestamp,
	"reply_history" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"user_id" varchar,
	"player_id" varchar,
	"role" varchar DEFAULT 'member' NOT NULL,
	"added_at" timestamp DEFAULT now(),
	"added_by" varchar
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "impersonation_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"super_admin_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"jti" text NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"ended_at" timestamp,
	"ip" text,
	"user_agent" text,
	CONSTRAINT "impersonation_events_jti_unique" UNIQUE("jti")
);
--> statement-breakpoint
CREATE TABLE "integration_status_pings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration" text NOT NULL,
	"ok" boolean NOT NULL,
	"latency_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integration_webhook" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"enabled" boolean DEFAULT true,
	"signing_secret_enc" text,
	"last_status" integer,
	"last_latency_ms" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"provider" "integration_provider" NOT NULL,
	"credentials" jsonb NOT NULL,
	"enabled" boolean DEFAULT false,
	"configured_by" varchar,
	"last_tested_at" timestamp,
	"test_status" varchar,
	"test_error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invitation_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"event_type" "invitation_analytics_event" NOT NULL,
	"event_data" jsonb DEFAULT '{}'::jsonb,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invitation_batches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"total_invitations" integer NOT NULL,
	"successful_invitations" integer DEFAULT 0,
	"failed_invitations" integer DEFAULT 0,
	"status" "invitation_batch_status" DEFAULT 'processing',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"error_log" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invite_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"code" varchar NOT NULL,
	"code_type" "code_type" NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_platform" boolean DEFAULT false,
	"age_group" text,
	"gender" text,
	"location" text,
	"club" text,
	"discount_type" varchar,
	"discount_value" integer,
	"braintree_discount_id" varchar,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"metadata" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invite_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"tenant_id" varchar NOT NULL,
	"invited_email" text NOT NULL,
	"role" "tenant_membership_role" NOT NULL,
	"player_id" varchar,
	"purpose" "invite_token_purpose" NOT NULL,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '7 days' NOT NULL,
	"used_at" timestamp,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"batch_id" varchar,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"custom_message" text,
	"view_count" integer DEFAULT 0,
	"last_viewed_at" timestamp,
	CONSTRAINT "invite_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"role" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"invited_by_user_id" varchar NOT NULL,
	"channel" varchar DEFAULT 'email',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "message_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"provider" text DEFAULT 'twilio' NOT NULL,
	"external_id" text,
	"to" text NOT NULL,
	"from" text NOT NULL,
	"body" text NOT NULL,
	"direction" "message_direction" NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"error_code" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"parent_id" varchar NOT NULL,
	"email" boolean DEFAULT true,
	"sms" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_preferences_parent_id_unique" UNIQUE("parent_id")
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"name" varchar(100) NOT NULL,
	"type" "notification_type" NOT NULL,
	"method" varchar(50) NOT NULL,
	"subject" text,
	"template" text NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"signup_id" varchar,
	"type" "notification_type" NOT NULL,
	"recipient" varchar NOT NULL,
	"recipient_user_id" varchar,
	"subject" varchar,
	"message" text NOT NULL,
	"status" "notification_status" DEFAULT 'pending',
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "parent_player_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"relationship_type" varchar DEFAULT 'parent' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"signup_id" varchar NOT NULL,
	"payment_intent_id" varchar,
	"amount_cents" integer NOT NULL,
	"status" "payment_status" DEFAULT 'paid',
	"paid_at" timestamp,
	"refunded_at" timestamp,
	"refund_reason" text,
	"refunded_by" varchar,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plan_catalog" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"limits" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_features" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_code" text NOT NULL,
	"feature_key" varchar NOT NULL,
	"enabled" boolean,
	"variant" text,
	"limit_value" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policies" jsonb DEFAULT '{
    "autoApproveTenants": true,
    "requireTenantApproval": false,
    "mfa": {
      "requireSuperAdmins": true,
      "requireTenantAdmins": false
    },
    "subdomains": {
      "enabled": false,
      "baseDomain": "tenants.playhq.app",
      "dnsOk": false,
      "sslOk": false
    },
    "impersonation": {
      "allow": true,
      "maxMinutes": 30,
      "requireReason": true
    },
    "session": {
      "idleTimeoutMinutes": 60
    },
    "retentionDays": {
      "logs": 90,
      "analytics": 365,
      "pii": 730
    },
    "maintenance": {
      "enabled": false,
      "message": ""
    }
  }'::jsonb NOT NULL,
	"tenant_defaults" jsonb DEFAULT '{
    "defaultPlanCode": "core",
    "bookingWindowHours": 8,
    "sessionCapacity": 20,
    "seedSampleContent": false
  }'::jsonb NOT NULL,
	"trial_settings" jsonb DEFAULT '{
    "enabled": true,
    "durationDays": 14,
    "defaultTrialPlan": "growth",
    "autoConvertToFree": true,
    "requirePaymentMethod": false,
    "allowPlanChangeDuringTrial": true,
    "maxExtensions": 1,
    "extensionDurationDays": 7,
    "gracePeriodDays": 3,
    "dataRetentionAfterTrialDays": 30,
    "autoCleanupExpiredTrials": true,
    "preventMultipleTrials": true,
    "riskAssessmentEnabled": true,
    "paymentMethodGracePeriodHours": 72,
    "notificationSchedule": {
      "trialStart": [0],
      "trialReminders": [7, 3, 1],
      "trialExpiry": [0, 1, 3],
      "gracePeriod": [0, 1, 2]
    },
    "planTransitionRules": {
      "preserveDataOnDowngrade": true,
      "archiveAdvancedFeatureData": true,
      "playerLimitEnforcement": "soft",
      "featureAccessGracePeriod": 7
    },
    "abusePreventionRules": {
      "maxTrialsPerEmail": 1,
      "maxTrialsPerIP": 3,
      "maxTrialsPerPaymentMethod": 1,
      "cooldownBetweenTrialsDays": 90,
      "requirePhoneVerification": false,
      "requireCreditCardVerification": false
    }
  }'::jsonb NOT NULL,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_assessment_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"assessment_id" varchar NOT NULL,
	"skill_id" varchar NOT NULL,
	"level" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"assessed_by" varchar NOT NULL,
	"session_id" varchar,
	"assessment_date" timestamp NOT NULL,
	"overall_comment" text,
	"visibility" varchar DEFAULT 'private' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_goal_updates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"goal_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"note" text NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_goals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"target_date" timestamp,
	"status" varchar DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"date" date NOT NULL,
	"avg_heart_rate" integer,
	"max_heart_rate" integer,
	"resting_heart_rate" integer,
	"steps" integer,
	"distance" numeric(10, 2),
	"calories_burned" integer,
	"active_minutes" integer,
	"sleep_duration" integer,
	"sleep_quality" numeric(5, 2),
	"recovery_score" numeric(5, 2),
	"training_load" numeric(8, 2),
	"vo2_max" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"avatar_color" varchar DEFAULT '#10b981',
	"avatar_text_color" varchar,
	"birth_year" integer NOT NULL,
	"date_of_birth" date,
	"age_band" "age_band" DEFAULT 'child' NOT NULL,
	"is_teen" boolean DEFAULT false NOT NULL,
	"is_adult" boolean DEFAULT false NOT NULL,
	"became_adult_at" timestamp,
	"gender" "gender" NOT NULL,
	"parent_id" varchar NOT NULL,
	"parent2_id" varchar,
	"soccer_club" varchar,
	"can_access_portal" boolean DEFAULT false,
	"can_book_and_pay" boolean DEFAULT false,
	"invite_sent_via" varchar,
	"invited_at" timestamp,
	"user_account_created" boolean DEFAULT false,
	"email" varchar,
	"phone_number" varchar,
	"is_approved" boolean DEFAULT false,
	"registration_status" "registration_status" DEFAULT 'pending',
	"approved_at" timestamp,
	"approved_by" varchar,
	"user_id" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "age_portal_check" CHECK ((can_access_portal = false OR (2025 - birth_year) >= 13))
);
--> statement-breakpoint
CREATE TABLE "progression_snapshots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"snapshot_date" timestamp NOT NULL,
	"skill_id" varchar,
	"aggregate_level" numeric(3, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quickbooks_account_mappings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"transaction_type" "quickbooks_transaction_type" NOT NULL,
	"qb_account_id" varchar NOT NULL,
	"qb_account_name" text NOT NULL,
	"qb_account_type" varchar,
	"qb_class_id" varchar,
	"qb_class_name" text,
	"qb_location_id" varchar,
	"qb_location_name" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quickbooks_connections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"realm_id" varchar,
	"company_name" text,
	"company_country" varchar,
	"is_connected" boolean DEFAULT false,
	"last_sync_at" timestamp,
	"sync_status" "quickbooks_sync_status" DEFAULT 'idle',
	"last_error" text,
	"auto_sync_enabled" boolean DEFAULT false,
	"sync_frequency" varchar DEFAULT 'daily',
	"connected_at" timestamp,
	"connected_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quickbooks_sync_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"sync_type" varchar NOT NULL,
	"status" varchar NOT NULL,
	"records_processed" integer DEFAULT 0,
	"records_created" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"records_failed" integer DEFAULT 0,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"duration_ms" integer,
	"error_message" text,
	"error_details" jsonb,
	"triggered_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quickbooks_sync_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"sync_customers" boolean DEFAULT true,
	"sync_invoices" boolean DEFAULT true,
	"sync_payments" boolean DEFAULT true,
	"sync_refunds" boolean DEFAULT true,
	"fiscal_year_start" varchar DEFAULT '01',
	"report_timezone" varchar DEFAULT 'America/New_York',
	"auto_email_reports" boolean DEFAULT false,
	"report_recipients" text[],
	"report_frequency" varchar DEFAULT 'monthly',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_billing" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"organization_name" varchar NOT NULL,
	"contact_email" varchar NOT NULL,
	"billing_email" varchar NOT NULL,
	"phone_number" varchar,
	"address" text,
	"city" varchar,
	"state" varchar,
	"postal_code" varchar,
	"country" varchar DEFAULT 'United States',
	"tax_id" varchar,
	"billing_frequency" varchar DEFAULT 'monthly' NOT NULL,
	"payment_method" varchar DEFAULT 'invoice' NOT NULL,
	"credit_card_token" varchar,
	"ach_account_info" jsonb,
	"preferred_invoice_day" integer DEFAULT 1,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"configured_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"session_id" varchar NOT NULL,
	"paid" boolean DEFAULT false,
	"payment_intent_id" varchar,
	"payment_id" varchar,
	"payment_provider" varchar,
	"discount_code_id" varchar,
	"discount_code_applied" varchar,
	"discount_amount_cents" integer,
	"refunded" boolean DEFAULT false,
	"refund_reason" text,
	"refunded_at" timestamp,
	"refund_transaction_id" varchar,
	"reservation_expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_credit_packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"credits" integer NOT NULL,
	"price_in_cents" integer NOT NULL,
	"bonus_credits" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_credit_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"type" "sms_credit_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"description" text,
	"reference_id" varchar,
	"reference_type" varchar,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"message_sid" text NOT NULL,
	"tenant_id" varchar,
	"to_number" text NOT NULL,
	"event" "sms_event" NOT NULL,
	"error_code" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"plan_key" varchar DEFAULT 'free' NOT NULL,
	"status" varchar DEFAULT 'inactive' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"key" varchar NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "tenant_credits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"expires_at" timestamp,
	"used_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_feature_overrides" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"feature_key" varchar NOT NULL,
	"enabled" boolean,
	"variant" text,
	"limit_value" integer,
	"reason" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "tenant_invite_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"code" varchar(12) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"max_usage" integer,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_invite_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tenant_invoice_lines" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar NOT NULL,
	"type" text NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer DEFAULT 0 NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"due_at" timestamp NOT NULL,
	"paid_at" timestamp,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_memberships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "tenant_membership_role" NOT NULL,
	"status" "tenant_membership_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_plan_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"plan_code" text NOT NULL,
	"since" timestamp DEFAULT now() NOT NULL,
	"until" timestamp
);
--> statement-breakpoint
CREATE TABLE "tenant_plan_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"from_plan" "plan_level",
	"to_plan" "plan_level" NOT NULL,
	"change_type" varchar NOT NULL,
	"reason" text,
	"changed_by" varchar,
	"automated_trigger" varchar,
	"mrr" integer,
	"annual_value" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_subscription_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"event_type" "subscription_event_type" NOT NULL,
	"processor" "payment_processor" NOT NULL,
	"subscription_id" varchar,
	"plan_id" varchar,
	"plan_level" "plan_level",
	"previous_plan_level" "plan_level",
	"amount_cents" integer,
	"currency" varchar DEFAULT 'USD',
	"status" varchar,
	"failure_reason" varchar,
	"failure_code" varchar,
	"processor_event_id" varchar,
	"triggered_by" varchar,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_usage_daily" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"counters" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar DEFAULT 'player' NOT NULL,
	"status" "tenant_membership_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subdomain" varchar NOT NULL,
	"custom_domain" varchar,
	"plan_level" "plan_level" DEFAULT 'free',
	"payment_processor" "payment_processor",
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"braintree_customer_id" varchar,
	"braintree_subscription_id" varchar,
	"braintree_status" varchar,
	"braintree_plan_id" varchar,
	"braintree_payment_method_token" varchar,
	"braintree_oauth_merchant_id" varchar,
	"braintree_next_billing_date" timestamp,
	"braintree_last_charge_at" timestamp,
	"braintree_last_failure_at" timestamp,
	"braintree_failure_count" integer DEFAULT 0,
	"city" text,
	"state" text,
	"country" text DEFAULT 'US',
	"created_at" timestamp DEFAULT now(),
	"slug" varchar,
	"tenant_code" varchar,
	"contact_name" text,
	"contact_email" text,
	"trial_started_at" timestamp,
	"trial_ends_at" timestamp,
	"trial_plan" "plan_level",
	"billing_status" varchar DEFAULT 'none',
	"payment_method_required" boolean DEFAULT false,
	"payment_method_verified" boolean DEFAULT false,
	"trial_extensions_used" integer DEFAULT 0,
	"max_trial_extensions" integer DEFAULT 1,
	"pending_plan_change" "plan_level",
	"pending_plan_change_at" timestamp,
	"pending_plan_code" varchar,
	"pending_plan_effective_date" timestamp,
	"last_plan_change_at" timestamp,
	"last_plan_level" "plan_level",
	"plan_change_reason" varchar,
	"data_retention_policy" jsonb DEFAULT '{"analytics": 90, "sessions": 365, "players": 730, "payments": 2555}'::jsonb,
	"archived_data_paths" jsonb DEFAULT '{}'::jsonb,
	"data_cleanup_scheduled_at" timestamp,
	"trial_history" jsonb DEFAULT '[]'::jsonb,
	"signup_ip_address" varchar,
	"signup_user_agent" text,
	"risk_score" integer DEFAULT 0,
	"grace_period_ends_at" timestamp,
	"grace_period_reason" varchar,
	"grace_period_notifications_sent" integer DEFAULT 0,
	"invite_code" varchar NOT NULL,
	"invite_code_updated_at" timestamp DEFAULT now() NOT NULL,
	"invite_code_updated_by" varchar,
	"sms_credits_balance" integer DEFAULT 0 NOT NULL,
	"sms_credits_low_threshold" integer DEFAULT 50,
	"sms_credits_last_purchased_at" timestamp,
	"sms_credits_auto_recharge" boolean DEFAULT false,
	"sms_credits_auto_recharge_amount" integer,
	"clerk_organization_id" varchar,
	"clerk_organization_synced_at" timestamp,
	"default_session_visibility" varchar DEFAULT 'private',
	CONSTRAINT "tenants_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "tenants_custom_domain_unique" UNIQUE("custom_domain"),
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tenants_tenant_code_unique" UNIQUE("tenant_code"),
	CONSTRAINT "tenants_invite_code_unique" UNIQUE("invite_code"),
	CONSTRAINT "tenants_clerk_organization_id_unique" UNIQUE("clerk_organization_id")
);
--> statement-breakpoint
CREATE TABLE "training_plan_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"plan_id" varchar NOT NULL,
	"day_of_week" integer NOT NULL,
	"drill_id" varchar,
	"custom_text" text,
	"duration_minutes" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"player_id" varchar,
	"created_by" varchar NOT NULL,
	"title" varchar NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "unified_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"batch_id" varchar,
	"type" "invitation_type" NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"role" "tenant_membership_role" NOT NULL,
	"token" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending',
	"custom_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '7 days' NOT NULL,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"accepted_at" timestamp,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unified_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "unsubscribes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" "unsubscribe_channel" NOT NULL,
	"address" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"household_id" varchar,
	"tenant_id" varchar NOT NULL,
	"amount_cents" integer NOT NULL,
	"reason" text NOT NULL,
	"session_id" varchar,
	"signup_id" varchar,
	"is_used" boolean DEFAULT false,
	"used_at" timestamp,
	"used_for_signup_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_policy_acceptances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"policy_type" varchar NOT NULL,
	"policy_version" varchar NOT NULL,
	"accepted_at" timestamp NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"email" varchar,
	"password_hash" text,
	"clerk_user_id" varchar,
	"auth_provider" varchar,
	"auth_provider_id" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"avatar_color" varchar DEFAULT '#2563eb',
	"avatar_text_color" varchar,
	"phone" varchar,
	"date_of_birth" date,
	"is_admin" boolean DEFAULT false,
	"is_assistant" boolean DEFAULT false,
	"is_super_admin" boolean DEFAULT false,
	"role" "user_role" DEFAULT 'adult',
	"mfa_enabled" boolean DEFAULT false,
	"status" "user_status" DEFAULT 'active',
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" varchar,
	"customer_id" varchar,
	"email_verified_at" timestamp,
	"verification_status" varchar DEFAULT 'pending_verify',
	"is_approved" boolean DEFAULT false,
	"registration_status" "registration_status" DEFAULT 'pending',
	"approved_at" timestamp,
	"approved_by" varchar,
	"rejected_at" timestamp,
	"rejected_by" varchar,
	"rejection_reason" text,
	"parent2_invite_sent_via" varchar,
	"parent2_invited_at" timestamp,
	"parent2_invite_email" varchar,
	"parent2_invite_phone" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "waitlists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"session_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"parent_id" varchar NOT NULL,
	"position" integer NOT NULL,
	"status" "waitlist_status" DEFAULT 'active' NOT NULL,
	"offer_status" "waitlist_offer_status" DEFAULT 'none' NOT NULL,
	"notify_on_join" boolean DEFAULT true,
	"notify_on_position_change" boolean DEFAULT false,
	"offer_expires_at" timestamp,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wearable_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"data_type" "wearable_data_type" NOT NULL,
	"recorded_at" timestamp NOT NULL,
	"value" jsonb NOT NULL,
	"unit" varchar,
	"source" varchar,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wearable_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"player_id" varchar NOT NULL,
	"provider" "wearable_provider" NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"scope" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"sync_frequency" integer DEFAULT 60,
	"webhook_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_attempts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"attempt_no" integer NOT NULL,
	"status" "webhook_attempt_status" NOT NULL,
	"http_status" integer,
	"latency_ms" integer,
	"error" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" varchar NOT NULL,
	"source" text NOT NULL,
	"event_type" text NOT NULL,
	"payload_json" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"delivered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "webhook_stats_hourly" (
	"webhook_id" varchar NOT NULL,
	"hour" timestamp NOT NULL,
	"attempts" integer DEFAULT 0,
	"success" integer DEFAULT 0,
	"failed" integer DEFAULT 0,
	"p95_latency_ms" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_tenant_scores" ADD CONSTRAINT "ai_tenant_scores_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_snapshots" ADD CONSTRAINT "attendance_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_snapshots" ADD CONSTRAINT "attendance_snapshots_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_snapshots" ADD CONSTRAINT "attendance_snapshots_session_id_futsal_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."futsal_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_impersonator_id_users_id_fk" FOREIGN KEY ("impersonator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_impersonation_event_id_impersonation_events_id_fk" FOREIGN KEY ("impersonation_event_id") REFERENCES "public"."impersonation_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_signup_tokens" ADD CONSTRAINT "business_signup_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_signup_tokens" ADD CONSTRAINT "business_signup_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_campaign_id_communication_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."communication_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_document_access" ADD CONSTRAINT "consent_document_access_document_id_consent_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."consent_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_document_access" ADD CONSTRAINT "consent_document_access_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_document_access" ADD CONSTRAINT "consent_document_access_accessed_by_users_id_fk" FOREIGN KEY ("accessed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_template_id_consent_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."consent_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_events" ADD CONSTRAINT "consent_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_events" ADD CONSTRAINT "consent_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_signatures" ADD CONSTRAINT "consent_signatures_document_id_consent_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."consent_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_signatures" ADD CONSTRAINT "consent_signatures_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_signatures" ADD CONSTRAINT "consent_signatures_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_signatures" ADD CONSTRAINT "consent_signatures_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_templates" ADD CONSTRAINT "consent_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_group_members" ADD CONSTRAINT "contact_group_members_group_id_contact_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."contact_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_group_members" ADD CONSTRAINT "contact_group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_group_members" ADD CONSTRAINT "contact_group_members_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_groups" ADD CONSTRAINT "contact_groups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_groups" ADD CONSTRAINT "contact_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_session_id_futsal_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."futsal_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dev_achievements" ADD CONSTRAINT "dev_achievements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dev_achievements" ADD CONSTRAINT "dev_achievements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dev_skill_categories" ADD CONSTRAINT "dev_skill_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dev_skill_rubrics" ADD CONSTRAINT "dev_skill_rubrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dev_skill_rubrics" ADD CONSTRAINT "dev_skill_rubrics_skill_id_dev_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."dev_skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dev_skills" ADD CONSTRAINT "dev_skills_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dev_skills" ADD CONSTRAINT "dev_skills_category_id_dev_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."dev_skill_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_locked_to_player_id_players_id_fk" FOREIGN KEY ("locked_to_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_locked_to_parent_id_users_id_fk" FOREIGN KEY ("locked_to_parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drills_library" ADD CONSTRAINT "drills_library_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dunning_events" ADD CONSTRAINT "dunning_events_invoice_id_tenant_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."tenant_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_adoption_events" ADD CONSTRAINT "feature_adoption_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_adoption_events" ADD CONSTRAINT "feature_adoption_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_audit_log" ADD CONSTRAINT "feature_audit_log_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "futsal_sessions" ADD CONSTRAINT "futsal_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_events" ADD CONSTRAINT "impersonation_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_events" ADD CONSTRAINT "impersonation_events_super_admin_id_users_id_fk" FOREIGN KEY ("super_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_analytics" ADD CONSTRAINT "invitation_analytics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_batches" ADD CONSTRAINT "invitation_batches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_batches" ADD CONSTRAINT "invitation_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_batch_id_invitation_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."invitation_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_signup_id_signups_id_fk" FOREIGN KEY ("signup_id") REFERENCES "public"."signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_player_links" ADD CONSTRAINT "parent_player_links_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_player_links" ADD CONSTRAINT "parent_player_links_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_code_plan_catalog_code_fk" FOREIGN KEY ("plan_code") REFERENCES "public"."plan_catalog"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_key_features_key_fk" FOREIGN KEY ("feature_key") REFERENCES "public"."features"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_assessment_items" ADD CONSTRAINT "player_assessment_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_assessment_items" ADD CONSTRAINT "player_assessment_items_assessment_id_player_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."player_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_assessment_items" ADD CONSTRAINT "player_assessment_items_skill_id_dev_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."dev_skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_assessments" ADD CONSTRAINT "player_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_assessments" ADD CONSTRAINT "player_assessments_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_assessments" ADD CONSTRAINT "player_assessments_assessed_by_users_id_fk" FOREIGN KEY ("assessed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_assessments" ADD CONSTRAINT "player_assessments_session_id_futsal_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."futsal_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_goal_updates" ADD CONSTRAINT "player_goal_updates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_goal_updates" ADD CONSTRAINT "player_goal_updates_goal_id_player_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."player_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_goal_updates" ADD CONSTRAINT "player_goal_updates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_goals" ADD CONSTRAINT "player_goals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_goals" ADD CONSTRAINT "player_goals_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_goals" ADD CONSTRAINT "player_goals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_metrics" ADD CONSTRAINT "player_metrics_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_metrics" ADD CONSTRAINT "player_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_snapshots" ADD CONSTRAINT "progression_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_snapshots" ADD CONSTRAINT "progression_snapshots_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_snapshots" ADD CONSTRAINT "progression_snapshots_skill_id_dev_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."dev_skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quickbooks_account_mappings" ADD CONSTRAINT "quickbooks_account_mappings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quickbooks_connections" ADD CONSTRAINT "quickbooks_connections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quickbooks_connections" ADD CONSTRAINT "quickbooks_connections_connected_by_users_id_fk" FOREIGN KEY ("connected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quickbooks_sync_logs" ADD CONSTRAINT "quickbooks_sync_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quickbooks_sync_preferences" ADD CONSTRAINT "quickbooks_sync_preferences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_billing" ADD CONSTRAINT "service_billing_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signups" ADD CONSTRAINT "signups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_credit_transactions" ADD CONSTRAINT "sms_credit_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_credit_transactions" ADD CONSTRAINT "sms_credit_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_events" ADD CONSTRAINT "sms_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_credits" ADD CONSTRAINT "tenant_credits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_credits" ADD CONSTRAINT "tenant_credits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_feature_overrides" ADD CONSTRAINT "tenant_feature_overrides_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_feature_overrides" ADD CONSTRAINT "tenant_feature_overrides_feature_key_features_key_fk" FOREIGN KEY ("feature_key") REFERENCES "public"."features"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_feature_overrides" ADD CONSTRAINT "tenant_feature_overrides_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_invite_codes" ADD CONSTRAINT "tenant_invite_codes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_invite_codes" ADD CONSTRAINT "tenant_invite_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_invoice_lines" ADD CONSTRAINT "tenant_invoice_lines_invoice_id_tenant_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."tenant_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_invoices" ADD CONSTRAINT "tenant_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_plan_assignments" ADD CONSTRAINT "tenant_plan_assignments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_plan_assignments" ADD CONSTRAINT "tenant_plan_assignments_plan_code_plan_catalog_code_fk" FOREIGN KEY ("plan_code") REFERENCES "public"."plan_catalog"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_plan_history" ADD CONSTRAINT "tenant_plan_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_subscription_events" ADD CONSTRAINT "tenant_subscription_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_usage_daily" ADD CONSTRAINT "tenant_usage_daily_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_plan_items" ADD CONSTRAINT "training_plan_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_plan_items" ADD CONSTRAINT "training_plan_items_plan_id_training_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."training_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_plan_items" ADD CONSTRAINT "training_plan_items_drill_id_drills_library_id_fk" FOREIGN KEY ("drill_id") REFERENCES "public"."drills_library"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unified_invitations" ADD CONSTRAINT "unified_invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unified_invitations" ADD CONSTRAINT "unified_invitations_batch_id_invitation_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."invitation_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unified_invitations" ADD CONSTRAINT "unified_invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_session_id_futsal_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."futsal_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_signup_id_signups_id_fk" FOREIGN KEY ("signup_id") REFERENCES "public"."signups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_used_for_signup_id_signups_id_fk" FOREIGN KEY ("used_for_signup_id") REFERENCES "public"."signups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_policy_acceptances" ADD CONSTRAINT "user_policy_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_session_id_futsal_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."futsal_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_data" ADD CONSTRAINT "wearable_data_integration_id_wearable_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."wearable_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_data" ADD CONSTRAINT "wearable_data_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_data" ADD CONSTRAINT "wearable_data_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_integrations" ADD CONSTRAINT "wearable_integrations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_integrations" ADD CONSTRAINT "wearable_integrations_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_attempts" ADD CONSTRAINT "webhook_attempts_event_id_webhook_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."webhook_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_webhook_id_integration_webhook_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."integration_webhook"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_stats_hourly" ADD CONSTRAINT "webhook_stats_hourly_webhook_id_integration_webhook_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."integration_webhook"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_anomalies_scope_idx" ON "ai_anomalies" USING btree ("scope_type","scope_id","date");--> statement-breakpoint
CREATE INDEX "ai_anomalies_severity_idx" ON "ai_anomalies" USING btree ("severity","date");--> statement-breakpoint
CREATE INDEX "ai_contributions_period_idx" ON "ai_contributions" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "ai_contributions_metric_idx" ON "ai_contributions" USING btree ("metric","rank");--> statement-breakpoint
CREATE INDEX "ai_forecasts_scope_idx" ON "ai_forecasts_daily" USING btree ("scope_type","scope_id","date");--> statement-breakpoint
CREATE INDEX "ai_forecasts_metric_idx" ON "ai_forecasts_daily" USING btree ("metric","date");--> statement-breakpoint
CREATE INDEX "ai_narratives_scope_idx" ON "ai_narratives" USING btree ("scope_type","scope_id");--> statement-breakpoint
CREATE INDEX "ai_narratives_period_idx" ON "ai_narratives" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_tenant_scores_unique" ON "ai_tenant_scores" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "ai_tenant_scores_risk_idx" ON "ai_tenant_scores" USING btree ("churn_risk");--> statement-breakpoint
CREATE INDEX "attendance_snapshots_tenant_id_idx" ON "attendance_snapshots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "attendance_snapshots_player_id_idx" ON "attendance_snapshots" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "attendance_snapshots_session_id_idx" ON "attendance_snapshots" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_snapshots_player_session_idx" ON "attendance_snapshots" USING btree ("player_id","session_id");--> statement-breakpoint
CREATE INDEX "audit_events_tenant_idx" ON "audit_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_events_type_idx" ON "audit_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "audit_events_created_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_section_idx" ON "audit_logs" USING btree ("section");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_impersonation" ON "audit_logs" USING btree ("is_impersonated","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "beta_plan_features_unique" ON "beta_plan_features" USING btree ("plan_key","feature_key");--> statement-breakpoint
CREATE INDEX "beta_plan_features_plan_idx" ON "beta_plan_features" USING btree ("plan_key");--> statement-breakpoint
CREATE INDEX "business_signup_tokens_token_idx" ON "business_signup_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "business_signup_tokens_email_idx" ON "business_signup_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "business_signup_tokens_tenant_idx" ON "business_signup_tokens" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "business_signup_tokens_user_idx" ON "business_signup_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "business_signup_tokens_status_idx" ON "business_signup_tokens" USING btree ("status");--> statement-breakpoint
CREATE INDEX "comm_templates_type_idx" ON "comm_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "comm_templates_key_idx" ON "comm_templates" USING btree ("key");--> statement-breakpoint
CREATE INDEX "communication_campaigns_tenant_id_idx" ON "communication_campaigns" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "communication_campaigns_status_idx" ON "communication_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "communication_campaigns_next_run_idx" ON "communication_campaigns" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "communication_logs_campaign_id_idx" ON "communication_logs" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "communication_logs_recipient_id_idx" ON "communication_logs" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "consent_access_document_idx" ON "consent_document_access" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "consent_access_tenant_idx" ON "consent_document_access" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "consent_access_user_idx" ON "consent_document_access" USING btree ("accessed_by");--> statement-breakpoint
CREATE INDEX "consent_access_time_idx" ON "consent_document_access" USING btree ("accessed_at");--> statement-breakpoint
CREATE INDEX "consent_documents_tenant_idx" ON "consent_documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "consent_documents_player_idx" ON "consent_documents" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "consent_documents_parent_idx" ON "consent_documents" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "consent_documents_template_idx" ON "consent_documents" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "consent_documents_signed_idx" ON "consent_documents" USING btree ("signed_at");--> statement-breakpoint
CREATE INDEX "consent_events_tenant_id_idx" ON "consent_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "consent_events_user_id_idx" ON "consent_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "consent_events_channel_idx" ON "consent_events" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "consent_events_type_idx" ON "consent_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "consent_records_player_idx" ON "consent_records" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "consent_records_parent_idx" ON "consent_records" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "consent_signatures_document_idx" ON "consent_signatures" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "consent_signatures_tenant_idx" ON "consent_signatures" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "consent_signatures_player_idx" ON "consent_signatures" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "consent_signatures_parent_idx" ON "consent_signatures" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "consent_signatures_signed_idx" ON "consent_signatures" USING btree ("signed_at");--> statement-breakpoint
CREATE INDEX "consent_templates_tenant_idx" ON "consent_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "consent_templates_type_idx" ON "consent_templates" USING btree ("template_type");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_templates_unique" ON "consent_templates" USING btree ("tenant_id","template_type","is_active");--> statement-breakpoint
CREATE INDEX "contact_group_members_group_id_idx" ON "contact_group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "contact_group_members_user_id_idx" ON "contact_group_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_group_members_group_user_unique" ON "contact_group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "contact_groups_tenant_id_idx" ON "contact_groups" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_credit_idx" ON "credit_transactions" USING btree ("credit_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_session_idx" ON "credit_transactions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_created_idx" ON "credit_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credits_tenant_idx" ON "credits" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "credits_user_idx" ON "credits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credits_expires_idx" ON "credits" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "credits_active_idx" ON "credits" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "credits_created_idx" ON "credits" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "dev_achievements_tenant_id_idx" ON "dev_achievements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "dev_achievements_player_id_idx" ON "dev_achievements" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "dev_achievements_awarded_at_idx" ON "dev_achievements" USING btree ("awarded_at");--> statement-breakpoint
CREATE INDEX "dev_skill_categories_tenant_id_idx" ON "dev_skill_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "dev_skill_categories_sort_order_idx" ON "dev_skill_categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "dev_skill_rubrics_tenant_id_idx" ON "dev_skill_rubrics" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "dev_skill_rubrics_skill_id_idx" ON "dev_skill_rubrics" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dev_skill_rubrics_skill_level_idx" ON "dev_skill_rubrics" USING btree ("skill_id","level");--> statement-breakpoint
CREATE INDEX "dev_skills_tenant_id_idx" ON "dev_skills" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "dev_skills_category_id_idx" ON "dev_skills" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "dev_skills_age_band_idx" ON "dev_skills" USING btree ("age_band");--> statement-breakpoint
CREATE INDEX "dev_skills_status_idx" ON "dev_skills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "discount_codes_tenant_id_idx" ON "discount_codes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "discount_codes_locked_to_player_idx" ON "discount_codes" USING btree ("locked_to_player_id");--> statement-breakpoint
CREATE INDEX "discount_codes_locked_to_parent_idx" ON "discount_codes" USING btree ("locked_to_parent_id");--> statement-breakpoint
CREATE INDEX "drills_library_tenant_id_idx" ON "drills_library" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "drills_library_title_idx" ON "drills_library" USING btree ("title");--> statement-breakpoint
CREATE INDEX "dunning_events_invoice_id_idx" ON "dunning_events" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "dunning_events_status_idx" ON "dunning_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dunning_events_created_at_idx" ON "dunning_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_bounces_email_idx" ON "email_bounces" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_bounces_type_idx" ON "email_bounces" USING btree ("bounce_type");--> statement-breakpoint
CREATE INDEX "email_events_tenant_id_idx" ON "email_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "email_events_template_key_idx" ON "email_events" USING btree ("template_key");--> statement-breakpoint
CREATE INDEX "email_events_created_at_idx" ON "email_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_events_event_idx" ON "email_events" USING btree ("event");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_token_hash_idx" ON "email_verification_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "email_verifications_user_idx" ON "email_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verifications_token_idx" ON "email_verifications" USING btree ("token");--> statement-breakpoint
CREATE INDEX "feature_adoption_events_tenant_id_idx" ON "feature_adoption_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "feature_adoption_events_feature_key_idx" ON "feature_adoption_events" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "feature_audit_entity_idx" ON "feature_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "feature_audit_feature_key_idx" ON "feature_audit_log" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "feature_audit_changed_by_idx" ON "feature_audit_log" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "feature_audit_created_at_idx" ON "feature_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flags_plan_feature_idx" ON "feature_flags" USING btree ("plan_level","feature_key");--> statement-breakpoint
CREATE INDEX "feature_requests_tenant_id_idx" ON "feature_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "feature_requests_status_idx" ON "feature_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feature_requests_priority_idx" ON "feature_requests" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "feature_requests_plan_level_idx" ON "feature_requests" USING btree ("plan_level");--> statement-breakpoint
CREATE INDEX "features_category_idx" ON "features" USING btree ("category");--> statement-breakpoint
CREATE INDEX "features_is_active_idx" ON "features" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "financial_txns_tenant_idx" ON "financial_transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "financial_txns_type_idx" ON "financial_transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "financial_txns_date_idx" ON "financial_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "financial_txns_source_idx" ON "financial_transactions" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "financial_txns_qb_status_idx" ON "financial_transactions" USING btree ("qb_sync_status");--> statement-breakpoint
CREATE INDEX "futsal_sessions_tenant_id_idx" ON "futsal_sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "help_requests_tenant_id_idx" ON "help_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "household_members_household_id_idx" ON "household_members" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "household_members_tenant_id_idx" ON "household_members" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "household_members_user_id_idx" ON "household_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "household_members_player_id_idx" ON "household_members" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_tenant_user_unique_idx" ON "household_members" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_tenant_player_unique_idx" ON "household_members" USING btree ("tenant_id","player_id");--> statement-breakpoint
CREATE INDEX "households_tenant_id_idx" ON "households" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_imp_events_tenant_started" ON "impersonation_events" USING btree ("tenant_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_imp_events_super_started" ON "impersonation_events" USING btree ("super_admin_id","started_at");--> statement-breakpoint
CREATE INDEX "integration_status_pings_integration_idx" ON "integration_status_pings" USING btree ("integration");--> statement-breakpoint
CREATE INDEX "integration_status_pings_created_at_idx" ON "integration_status_pings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "integrations_tenant_id_idx" ON "integrations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "invitation_analytics_invitation_idx" ON "invitation_analytics" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "invitation_analytics_tenant_idx" ON "invitation_analytics" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "invitation_analytics_event_idx" ON "invitation_analytics" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "invitation_analytics_created_at_idx" ON "invitation_analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invitation_batches_tenant_idx" ON "invitation_batches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "invitation_batches_created_by_idx" ON "invitation_batches" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "invitation_batches_status_idx" ON "invitation_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invite_codes_tenant_id_idx" ON "invite_codes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "invite_codes_code_idx" ON "invite_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "invite_codes_is_default_idx" ON "invite_codes" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "invite_codes_is_active_idx" ON "invite_codes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "invite_codes_is_platform_idx" ON "invite_codes" USING btree ("is_platform");--> statement-breakpoint
CREATE UNIQUE INDEX "invite_codes_tenant_code_unique_idx" ON "invite_codes" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "invite_tokens_tenant_idx" ON "invite_tokens" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "invite_tokens_email_idx" ON "invite_tokens" USING btree ("invited_email");--> statement-breakpoint
CREATE INDEX "invite_tokens_token_idx" ON "invite_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invite_tokens_expires_idx" ON "invite_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "invite_tokens_batch_idx" ON "invite_tokens" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "invites_tenant_idx" ON "invites" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "invites_token_idx" ON "invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invites_email_idx" ON "invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "message_logs_tenant_id_idx" ON "message_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "message_logs_direction_idx" ON "message_logs" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "message_logs_status_idx" ON "message_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "message_logs_created_at_idx" ON "message_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_preferences_tenant_id_idx" ON "notification_preferences" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "notification_templates_tenant_id_idx" ON "notification_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "notification_templates_type_idx" ON "notification_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_templates_method_idx" ON "notification_templates" USING btree ("method");--> statement-breakpoint
CREATE INDEX "notifications_tenant_id_idx" ON "notifications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_recipient_user_id_idx" ON "notifications" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "parent_player_links_unique" ON "parent_player_links" USING btree ("parent_id","player_id");--> statement-breakpoint
CREATE INDEX "parent_player_links_parent_idx" ON "parent_player_links" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "parent_player_links_player_idx" ON "parent_player_links" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "payments_tenant_id_idx" ON "payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_features_unique" ON "plan_features" USING btree ("plan_code","feature_key");--> statement-breakpoint
CREATE INDEX "plan_features_plan_code_idx" ON "plan_features" USING btree ("plan_code");--> statement-breakpoint
CREATE INDEX "plan_features_feature_key_idx" ON "plan_features" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "player_assessment_items_tenant_id_idx" ON "player_assessment_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "player_assessment_items_assessment_id_idx" ON "player_assessment_items" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "player_assessment_items_skill_id_idx" ON "player_assessment_items" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_assessment_items_assessment_skill_idx" ON "player_assessment_items" USING btree ("assessment_id","skill_id");--> statement-breakpoint
CREATE INDEX "player_assessments_tenant_id_idx" ON "player_assessments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "player_assessments_player_id_idx" ON "player_assessments" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_assessments_assessed_by_idx" ON "player_assessments" USING btree ("assessed_by");--> statement-breakpoint
CREATE INDEX "player_assessments_assessment_date_idx" ON "player_assessments" USING btree ("assessment_date");--> statement-breakpoint
CREATE INDEX "player_goal_updates_tenant_id_idx" ON "player_goal_updates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "player_goal_updates_goal_id_idx" ON "player_goal_updates" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "player_goal_updates_created_at_idx" ON "player_goal_updates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "player_goals_tenant_id_idx" ON "player_goals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "player_goals_player_id_idx" ON "player_goals" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_goals_created_by_idx" ON "player_goals" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "player_goals_status_idx" ON "player_goals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "player_metrics_player_idx" ON "player_metrics" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_metrics_tenant_idx" ON "player_metrics" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "player_metrics_date_idx" ON "player_metrics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "player_metrics_unique_idx" ON "player_metrics" USING btree ("player_id","date");--> statement-breakpoint
CREATE INDEX "players_tenant_id_idx" ON "players" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "progression_snapshots_tenant_id_idx" ON "progression_snapshots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "progression_snapshots_player_id_idx" ON "progression_snapshots" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "progression_snapshots_snapshot_date_idx" ON "progression_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "quickbooks_mappings_tenant_idx" ON "quickbooks_account_mappings" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quickbooks_mappings_unique_idx" ON "quickbooks_account_mappings" USING btree ("tenant_id","transaction_type");--> statement-breakpoint
CREATE UNIQUE INDEX "quickbooks_connections_tenant_idx" ON "quickbooks_connections" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "quickbooks_connections_realm_idx" ON "quickbooks_connections" USING btree ("realm_id");--> statement-breakpoint
CREATE INDEX "quickbooks_logs_tenant_idx" ON "quickbooks_sync_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "quickbooks_logs_status_idx" ON "quickbooks_sync_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quickbooks_logs_created_idx" ON "quickbooks_sync_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "quickbooks_prefs_tenant_idx" ON "quickbooks_sync_preferences" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "service_billing_tenant_id_idx" ON "service_billing" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "signups_tenant_id_idx" ON "signups" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sms_credit_transactions_tenant_id_idx" ON "sms_credit_transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sms_credit_transactions_type_idx" ON "sms_credit_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sms_credit_transactions_created_at_idx" ON "sms_credit_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sms_credit_transactions_reference_idx" ON "sms_credit_transactions" USING btree ("reference_id","reference_type");--> statement-breakpoint
CREATE INDEX "sms_events_tenant_id_idx" ON "sms_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sms_events_created_at_idx" ON "sms_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sms_events_event_idx" ON "sms_events" USING btree ("event");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_tenant_unique" ON "subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_customer_idx" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "system_settings_tenant_id_idx" ON "system_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "system_settings_tenant_key_unique_idx" ON "system_settings" USING btree ("tenant_id","key");--> statement-breakpoint
CREATE INDEX "tenant_credits_tenant_idx" ON "tenant_credits" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_credits_expires_idx" ON "tenant_credits" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tenant_credits_active_idx" ON "tenant_credits" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "tenant_credits_created_idx" ON "tenant_credits" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_feature_overrides_unique" ON "tenant_feature_overrides" USING btree ("tenant_id","feature_key");--> statement-breakpoint
CREATE INDEX "tenant_feature_overrides_tenant_id_idx" ON "tenant_feature_overrides" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_feature_overrides_expires_at_idx" ON "tenant_feature_overrides" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tenant_invite_codes_tenant_idx" ON "tenant_invite_codes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_invite_codes_code_idx" ON "tenant_invite_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "tenant_invoice_lines_invoice_id_idx" ON "tenant_invoice_lines" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "tenant_invoices_tenant_id_idx" ON "tenant_invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_invoices_status_idx" ON "tenant_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tenant_invoices_due_at_idx" ON "tenant_invoices" USING btree ("due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_memberships_unique" ON "tenant_memberships" USING btree ("tenant_id","user_id","role");--> statement-breakpoint
CREATE INDEX "tenant_memberships_tenant_idx" ON "tenant_memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_user_idx" ON "tenant_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenant_plan_assignments_tenant_id_idx" ON "tenant_plan_assignments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_plan_assignments_plan_code_idx" ON "tenant_plan_assignments" USING btree ("plan_code");--> statement-breakpoint
CREATE INDEX "tenant_plan_history_tenant_idx" ON "tenant_plan_history" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_plan_history_change_type_idx" ON "tenant_plan_history" USING btree ("change_type");--> statement-breakpoint
CREATE INDEX "tenant_plan_history_created_at_idx" ON "tenant_plan_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tenant_subscription_events_tenant_idx" ON "tenant_subscription_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_subscription_events_type_idx" ON "tenant_subscription_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "tenant_subscription_events_created_idx" ON "tenant_subscription_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tenant_usage_daily_tenant_id_idx" ON "tenant_usage_daily" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_usage_daily_date_idx" ON "tenant_usage_daily" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_usage_daily_tenant_date_idx" ON "tenant_usage_daily" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_users_unique" ON "tenant_users" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "tenant_users_tenant_idx" ON "tenant_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_users_user_idx" ON "tenant_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "training_plan_items_tenant_id_idx" ON "training_plan_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "training_plan_items_plan_id_idx" ON "training_plan_items" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "training_plan_items_day_of_week_idx" ON "training_plan_items" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "training_plans_tenant_id_idx" ON "training_plans" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "training_plans_player_id_idx" ON "training_plans" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "training_plans_created_by_idx" ON "training_plans" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "unified_invitations_tenant_idx" ON "unified_invitations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "unified_invitations_batch_idx" ON "unified_invitations" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "unified_invitations_type_idx" ON "unified_invitations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "unified_invitations_email_idx" ON "unified_invitations" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "unified_invitations_token_idx" ON "unified_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "unified_invitations_status_idx" ON "unified_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "unified_invitations_expires_at_idx" ON "unified_invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "unsubscribes_channel_idx" ON "unsubscribes" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "unsubscribes_address_idx" ON "unsubscribes" USING btree ("address");--> statement-breakpoint
CREATE INDEX "user_credits_user_id_idx" ON "user_credits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_credits_household_id_idx" ON "user_credits" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "user_credits_tenant_id_idx" ON "user_credits" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "user_credits_is_used_idx" ON "user_credits" USING btree ("is_used");--> statement-breakpoint
CREATE UNIQUE INDEX "user_policy_acceptances_unique" ON "user_policy_acceptances" USING btree ("user_id","policy_type","policy_version");--> statement-breakpoint
CREATE INDEX "user_policy_acceptances_user_idx" ON "user_policy_acceptances" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_tenant_id_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "waitlists_tenant_id_idx" ON "waitlists" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "waitlists_session_id_idx" ON "waitlists" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "waitlists_tenant_status_idx" ON "waitlists" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "waitlists_tenant_offer_expires_idx" ON "waitlists" USING btree ("tenant_id","offer_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlists_session_player_unique_idx" ON "waitlists" USING btree ("session_id","player_id");--> statement-breakpoint
CREATE INDEX "wearable_data_integration_idx" ON "wearable_data" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "wearable_data_player_idx" ON "wearable_data" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "wearable_data_tenant_idx" ON "wearable_data" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "wearable_data_type_idx" ON "wearable_data" USING btree ("data_type");--> statement-breakpoint
CREATE INDEX "wearable_data_recorded_idx" ON "wearable_data" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "wearable_data_created_idx" ON "wearable_data" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "wearable_integrations_tenant_idx" ON "wearable_integrations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "wearable_integrations_player_idx" ON "wearable_integrations" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "wearable_integrations_provider_idx" ON "wearable_integrations" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "wearable_integrations_active_idx" ON "wearable_integrations" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "wearable_integrations_unique_idx" ON "wearable_integrations" USING btree ("tenant_id","player_id","provider");--> statement-breakpoint
CREATE INDEX "webhook_attempts_event_id_idx" ON "webhook_attempts" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "webhook_attempts_status_idx" ON "webhook_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhook_events_webhook_id_idx" ON "webhook_events" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "webhook_events_created_at_idx" ON "webhook_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webhook_stats_hourly_pkey" ON "webhook_stats_hourly" USING btree ("webhook_id","hour");--> statement-breakpoint
CREATE INDEX "webhook_stats_hourly_hour_idx" ON "webhook_stats_hourly" USING btree ("hour");