--
-- PostgreSQL database dump
--

\restrict qs8Y2Im3ng6OvQ4fcocua2YOhZm6Nr1AcYspZTMHK8E1vO5zXzaVq88WbxaWUOs

-- Dumped from database version 16.11 (b740647)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: age_band; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.age_band AS ENUM (
    'child',
    'teen',
    'adult'
);


--
-- Name: code_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.code_type AS ENUM (
    'invite',
    'access',
    'discount'
);


--
-- Name: comm_template_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.comm_template_type AS ENUM (
    'email',
    'sms'
);


--
-- Name: discount_duration_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.discount_duration_type AS ENUM (
    'one_time',
    'months_3',
    'months_6',
    'months_12',
    'indefinite'
);


--
-- Name: dunning_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.dunning_status AS ENUM (
    'failed',
    'retry_scheduled',
    'retrying',
    'recovered',
    'uncollectible'
);


--
-- Name: email_event; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.email_event AS ENUM (
    'processed',
    'delivered',
    'open',
    'click',
    'bounce',
    'dropped',
    'spamreport',
    'deferred'
);


--
-- Name: feature_request_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feature_request_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


--
-- Name: feature_request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feature_request_status AS ENUM (
    'received',
    'under_review',
    'approved',
    'in_development',
    'released'
);


--
-- Name: gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.gender AS ENUM (
    'boys',
    'girls'
);


--
-- Name: integration_provider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.integration_provider AS ENUM (
    'twilio',
    'sendgrid',
    'google',
    'microsoft',
    'stripe',
    'zoom',
    'calendar',
    'mailchimp',
    'quickbooks',
    'braintree'
);


--
-- Name: invite_token_purpose; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invite_token_purpose AS ENUM (
    'signup_welcome',
    'add_membership',
    'player_link'
);


--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'open',
    'paid',
    'uncollectible',
    'void'
);


--
-- Name: payment_processor; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_processor AS ENUM (
    'stripe',
    'braintree'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'refunded'
);


--
-- Name: plan_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plan_level AS ENUM (
    'core',
    'growth',
    'elite',
    'free'
);


--
-- Name: quickbooks_sync_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quickbooks_sync_status AS ENUM (
    'idle',
    'syncing',
    'error',
    'success'
);


--
-- Name: quickbooks_transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quickbooks_transaction_type AS ENUM (
    'session_payment',
    'subscription_payment',
    'refund',
    'credit_issued',
    'credit_redeemed',
    'chargeback',
    'processing_fee',
    'adjustment'
);


--
-- Name: registration_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.registration_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: session_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.session_status AS ENUM (
    'upcoming',
    'open',
    'full',
    'closed',
    'cancelled'
);


--
-- Name: sms_credit_transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sms_credit_transaction_type AS ENUM (
    'purchase',
    'usage',
    'refund',
    'bonus',
    'adjustment',
    'expiration'
);


--
-- Name: sms_event; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sms_event AS ENUM (
    'queued',
    'sent',
    'delivered',
    'undelivered',
    'failed'
);


--
-- Name: subscription_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_event_type AS ENUM (
    'subscription_created',
    'subscription_activated',
    'subscription_charged',
    'subscription_charge_failed',
    'subscription_past_due',
    'subscription_canceled',
    'subscription_expired',
    'plan_upgraded',
    'plan_downgraded',
    'plan_downgrade_scheduled',
    'plan_downgrade_cancelled',
    'payment_method_updated',
    'dispute_opened',
    'dispute_won',
    'dispute_lost'
);


--
-- Name: tenant_membership_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tenant_membership_role AS ENUM (
    'parent',
    'player',
    'coach',
    'admin'
);


--
-- Name: tenant_membership_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tenant_membership_status AS ENUM (
    'active',
    'pending'
);


--
-- Name: unsubscribe_channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.unsubscribe_channel AS ENUM (
    'email',
    'sms'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'parent',
    'player',
    'tenant_admin',
    'super_admin',
    'adult'
);


--
-- Name: user_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'locked'
);


--
-- Name: waitlist_offer_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.waitlist_offer_status AS ENUM (
    'none',
    'offered',
    'accepted',
    'expired'
);


--
-- Name: waitlist_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.waitlist_status AS ENUM (
    'active',
    'offered',
    'accepted',
    'removed',
    'expired'
);


--
-- Name: webhook_attempt_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.webhook_attempt_status AS ENUM (
    'success',
    'failed'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_anomalies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_anomalies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    scope_type character varying(50) NOT NULL,
    scope_id character varying,
    metric character varying(50) NOT NULL,
    direction character varying(10) NOT NULL,
    zscore real NOT NULL,
    expected integer NOT NULL,
    actual integer NOT NULL,
    severity character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ai_contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_contributions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    metric character varying(50) NOT NULL,
    driver_type character varying(50) NOT NULL,
    driver_id character varying NOT NULL,
    driver_label character varying NOT NULL,
    impact_abs integer NOT NULL,
    impact_pct real NOT NULL,
    rank integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ai_forecasts_daily; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_forecasts_daily (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    scope_type character varying(50) NOT NULL,
    scope_id character varying,
    metric character varying(50) NOT NULL,
    mean integer NOT NULL,
    p10 integer NOT NULL,
    p90 integer NOT NULL,
    model character varying DEFAULT 'prophet'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ai_narratives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_narratives (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    scope_type character varying(50) NOT NULL,
    scope_id character varying,
    summary_md text NOT NULL,
    drivers_md text NOT NULL,
    risks_md text NOT NULL,
    forecast_md text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ai_tenant_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_tenant_scores (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    date date NOT NULL,
    churn_risk real NOT NULL,
    health_score integer NOT NULL,
    top_signals jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: attendance_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_snapshots (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    player_id character varying NOT NULL,
    session_id character varying NOT NULL,
    attended boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: audit_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying,
    user_role character varying,
    action character varying NOT NULL,
    resource_type character varying NOT NULL,
    resource_id character varying,
    details jsonb,
    ip_address character varying,
    user_agent text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    actor_id character varying NOT NULL,
    actor_role text NOT NULL,
    section text NOT NULL,
    action text NOT NULL,
    target_id text NOT NULL,
    diff jsonb,
    ip text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: comm_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comm_templates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    type public.comm_template_type NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    version integer DEFAULT 1,
    active boolean DEFAULT true,
    last_used_at timestamp without time zone
);


--
-- Name: consent_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consent_documents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    player_id character varying NOT NULL,
    parent_id character varying NOT NULL,
    template_id character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    signed_at timestamp without time zone,
    signer_ip character varying,
    signer_user_agent text,
    digital_signature text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: consent_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consent_events (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying NOT NULL,
    channel character varying(10) NOT NULL,
    type character varying(20) NOT NULL,
    source text NOT NULL,
    ip text,
    user_agent text,
    occurred_at timestamp without time zone DEFAULT now(),
    CONSTRAINT consent_events_channel_check CHECK (((channel)::text = ANY ((ARRAY['sms'::character varying, 'email'::character varying])::text[]))),
    CONSTRAINT consent_events_type_check CHECK (((type)::text = ANY ((ARRAY['opt_in'::character varying, 'opt_out'::character varying])::text[])))
);


--
-- Name: consent_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consent_templates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    template_type character varying NOT NULL,
    title character varying NOT NULL,
    content text,
    file_path character varying,
    file_name character varying,
    file_size integer,
    is_custom boolean DEFAULT false NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: contact_group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_group_members (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    group_id character varying NOT NULL,
    user_id character varying NOT NULL,
    added_by character varying,
    added_at timestamp without time zone DEFAULT now()
);


--
-- Name: contact_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_groups (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: dev_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dev_achievements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    player_id character varying NOT NULL,
    badge_key character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    awarded_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: dev_skill_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dev_skill_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    name character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: dev_skill_rubrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dev_skill_rubrics (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    skill_id character varying NOT NULL,
    level integer NOT NULL,
    label character varying NOT NULL,
    descriptor text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: dev_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dev_skills (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    category_id character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    sport character varying,
    age_band character varying,
    sort_order integer DEFAULT 0 NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: discount_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_codes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    code character varying NOT NULL,
    description text,
    discount_type character varying DEFAULT 'full'::character varying NOT NULL,
    discount_value integer,
    max_uses integer,
    current_uses integer DEFAULT 0,
    valid_from timestamp without time zone,
    valid_until timestamp without time zone,
    is_active boolean DEFAULT true,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    locked_to_player_id character varying,
    locked_to_parent_id character varying,
    stripe_coupon_id character varying,
    stripe_promotion_code_id character varying
);


--
-- Name: drills_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drills_library (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    title character varying NOT NULL,
    objective text,
    equipment text,
    steps text NOT NULL,
    video_url character varying,
    tags character varying[],
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: dunning_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dunning_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invoice_id character varying NOT NULL,
    attempt_no integer DEFAULT 1 NOT NULL,
    status public.dunning_status DEFAULT 'failed'::public.dunning_status NOT NULL,
    gateway_txn_id text,
    reason text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    message_id text NOT NULL,
    tenant_id character varying,
    template_key text,
    to_addr text NOT NULL,
    event public.email_event NOT NULL,
    reason text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verification_tokens (
    id character varying(191) DEFAULT gen_random_uuid() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id character varying,
    token_hash character varying NOT NULL,
    used_at timestamp without time zone
);


--
-- Name: feature_adoption_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_adoption_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying,
    user_id character varying,
    feature_key text NOT NULL,
    occurred_at timestamp with time zone DEFAULT now()
);


--
-- Name: feature_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_audit_log (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    entity_type text NOT NULL,
    entity_id character varying NOT NULL,
    feature_key character varying NOT NULL,
    old_value jsonb,
    new_value jsonb NOT NULL,
    changed_by character varying NOT NULL,
    change_reason text,
    ip text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    plan_level public.plan_level NOT NULL,
    feature_key character varying NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: feature_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    title character varying NOT NULL,
    description text NOT NULL,
    status public.feature_request_status DEFAULT 'received'::public.feature_request_status NOT NULL,
    submitted_by character varying NOT NULL,
    reviewed_by character varying,
    status_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    priority public.feature_request_priority DEFAULT 'medium'::public.feature_request_priority NOT NULL,
    plan_level public.plan_level NOT NULL,
    estimated_review_weeks integer DEFAULT 1,
    reviewed_at timestamp without time zone
);


--
-- Name: features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.features (
    key character varying NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    type text NOT NULL,
    description text,
    options_json jsonb,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_transactions (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    transaction_type public.quickbooks_transaction_type NOT NULL,
    amount_cents integer NOT NULL,
    currency character varying DEFAULT 'USD'::character varying,
    source_type character varying NOT NULL,
    source_id character varying NOT NULL,
    user_id character varying,
    player_id character varying,
    session_id character varying,
    processor_type public.payment_processor,
    processor_transaction_id character varying,
    qb_sync_status character varying DEFAULT 'pending'::character varying,
    qb_synced_at timestamp without time zone,
    qb_transaction_id character varying,
    qb_error text,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    transaction_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: futsal_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.futsal_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    title character varying NOT NULL,
    location character varying NOT NULL,
    age_groups text[] NOT NULL,
    genders text[] NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    capacity integer DEFAULT 12 NOT NULL,
    price_cents integer DEFAULT 1000 NOT NULL,
    status public.session_status DEFAULT 'upcoming'::public.session_status NOT NULL,
    booking_open_hour integer DEFAULT 8,
    booking_open_minute integer DEFAULT 0,
    has_access_code boolean DEFAULT false,
    access_code character varying,
    created_at timestamp without time zone DEFAULT now(),
    location_name text,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    postal_code text,
    country text DEFAULT 'US'::text,
    lat text,
    lng text,
    gmaps_place_id text,
    waitlist_enabled boolean DEFAULT true,
    waitlist_limit integer,
    payment_window_minutes integer DEFAULT 60,
    auto_promote boolean DEFAULT true,
    no_time_constraints boolean DEFAULT false,
    days_before_booking integer
);


--
-- Name: guardian_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardian_links (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    parent_id character varying NOT NULL,
    player_id character varying NOT NULL,
    relationship character varying DEFAULT 'parent'::character varying,
    permission_book boolean DEFAULT true,
    permission_pay boolean DEFAULT true,
    permission_consent boolean DEFAULT true,
    relationship_status character varying DEFAULT 'active'::character varying,
    aged_out_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: help_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.help_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    status character varying DEFAULT 'open'::character varying NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    phone character varying,
    email character varying NOT NULL,
    subject character varying NOT NULL,
    category character varying NOT NULL,
    priority character varying DEFAULT 'medium'::character varying NOT NULL,
    message text NOT NULL,
    resolved boolean DEFAULT false,
    resolved_by character varying,
    resolution_note text,
    resolved_at timestamp without time zone,
    reply_history jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    source character varying DEFAULT 'main_page'::character varying NOT NULL,
    first_response_at timestamp with time zone
);


--
-- Name: household_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.household_members (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    household_id character varying NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying,
    player_id character varying,
    role character varying DEFAULT 'member'::character varying NOT NULL,
    added_at timestamp without time zone DEFAULT now(),
    added_by character varying
);


--
-- Name: households; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.households (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    created_by character varying
);


--
-- Name: impersonation_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.impersonation_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    super_admin_id character varying NOT NULL,
    tenant_id character varying NOT NULL,
    reason text NOT NULL,
    token_jti text NOT NULL,
    started_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone NOT NULL,
    revoked_at timestamp without time zone,
    ip text
);


--
-- Name: integration_status_pings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_status_pings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    integration text NOT NULL,
    ok boolean NOT NULL,
    latency_ms integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: integration_webhook; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_webhook (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    enabled boolean DEFAULT true,
    signing_secret_enc text,
    last_status integer,
    last_latency_ms integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integrations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying,
    provider public.integration_provider NOT NULL,
    credentials jsonb NOT NULL,
    enabled boolean DEFAULT false,
    configured_by character varying,
    last_tested_at timestamp without time zone,
    test_status character varying,
    test_error_message text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: invitation_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitation_analytics (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invitation_id character varying NOT NULL,
    tenant_id character varying NOT NULL,
    event_type character varying NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    user_agent text,
    ip_address text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT invitation_analytics_event_type_check CHECK (((event_type)::text = ANY ((ARRAY['sent'::character varying, 'viewed'::character varying, 'accepted'::character varying, 'expired'::character varying, 'bounced'::character varying, 'clicked'::character varying])::text[])))
);


--
-- Name: invitation_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitation_batches (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    created_by character varying,
    total_invitations integer DEFAULT 0 NOT NULL,
    successful_invitations integer DEFAULT 0,
    failed_invitations integer DEFAULT 0,
    status character varying DEFAULT 'processing'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    error_log jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    CONSTRAINT invitation_batches_status_check CHECK (((status)::text = ANY ((ARRAY['processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: invite_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invite_codes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    code character varying NOT NULL,
    code_type public.code_type NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    age_group text,
    gender text,
    location text,
    club text,
    discount_type character varying,
    discount_value integer,
    max_uses integer,
    current_uses integer DEFAULT 0,
    valid_from timestamp without time zone,
    valid_until timestamp without time zone,
    metadata jsonb,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_platform boolean DEFAULT false,
    discount_duration public.discount_duration_type DEFAULT 'one_time'::public.discount_duration_type
);


--
-- Name: invite_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invite_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    token text NOT NULL,
    tenant_id character varying NOT NULL,
    invited_email text NOT NULL,
    role public.tenant_membership_role NOT NULL,
    player_id character varying,
    purpose public.invite_token_purpose NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    used_at timestamp with time zone,
    created_by character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: message_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_logs (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    provider text DEFAULT 'twilio'::text NOT NULL,
    external_id text,
    "to" text NOT NULL,
    "from" text NOT NULL,
    body text NOT NULL,
    direction character varying(20) NOT NULL,
    status text DEFAULT 'queued'::text NOT NULL,
    error_code text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT message_logs_direction_check CHECK (((direction)::text = ANY ((ARRAY['outbound'::character varying, 'inbound'::character varying])::text[])))
);


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    parent_id character varying NOT NULL,
    email boolean DEFAULT true,
    sms boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_templates (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(10) NOT NULL,
    method character varying(50) NOT NULL,
    subject text,
    template text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT notification_templates_type_check CHECK (((type)::text = ANY ((ARRAY['email'::character varying, 'sms'::character varying])::text[])))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    signup_id character varying,
    type character varying(10) NOT NULL,
    recipient character varying NOT NULL,
    recipient_user_id character varying,
    subject character varying,
    message text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    scheduled_for timestamp without time zone,
    sent_at timestamp without time zone,
    error_message text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT notifications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'sent'::character varying, 'failed'::character varying])::text[]))),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['email'::character varying, 'sms'::character varying])::text[])))
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    signup_id character varying NOT NULL,
    payment_intent_id character varying,
    amount_cents integer NOT NULL,
    status public.payment_status DEFAULT 'paid'::public.payment_status,
    paid_at timestamp without time zone,
    refunded_at timestamp without time zone,
    refund_reason text,
    refunded_by character varying,
    admin_notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: plan_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_catalog (
    code text NOT NULL,
    name text NOT NULL,
    price_cents integer DEFAULT 0 NOT NULL,
    limits jsonb NOT NULL
);


--
-- Name: plan_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_features (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    plan_code text NOT NULL,
    feature_key character varying NOT NULL,
    enabled boolean,
    variant text,
    limit_value integer,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by character varying
);


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    policies jsonb DEFAULT '{"mfa": {"requireSuperAdmins": true, "requireTenantAdmins": false}, "session": {"idleTimeoutMinutes": 60}, "subdomains": {"dnsOk": false, "sslOk": false, "enabled": false, "baseDomain": "tenants.playhq.app"}, "maintenance": {"enabled": false, "message": ""}, "impersonation": {"allow": true, "maxMinutes": 30, "requireReason": true}, "retentionDays": {"pii": 730, "logs": 90, "analytics": 365}, "autoApproveTenants": false, "requireTenantApproval": true}'::jsonb NOT NULL,
    tenant_defaults jsonb DEFAULT '{"defaultPlanCode": "core", "sessionCapacity": 20, "seedSampleContent": false, "bookingWindowHours": 8}'::jsonb NOT NULL,
    updated_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    trial_settings jsonb
);


--
-- Name: player_assessment_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_assessment_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    assessment_id character varying NOT NULL,
    skill_id character varying NOT NULL,
    level integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: player_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_assessments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    player_id character varying NOT NULL,
    assessed_by character varying NOT NULL,
    session_id character varying,
    assessment_date timestamp without time zone NOT NULL,
    overall_comment text,
    visibility character varying DEFAULT 'private'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: player_goal_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_goal_updates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    goal_id character varying NOT NULL,
    created_by character varying NOT NULL,
    note text NOT NULL,
    progress_percent integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: player_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_goals (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    player_id character varying NOT NULL,
    created_by character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    target_date timestamp without time zone,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.players (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    birth_year integer NOT NULL,
    gender public.gender NOT NULL,
    parent_id character varying NOT NULL,
    parent2_id character varying,
    soccer_club character varying,
    can_access_portal boolean DEFAULT false,
    can_book_and_pay boolean DEFAULT false,
    invite_sent_via character varying,
    invited_at timestamp without time zone,
    user_account_created boolean DEFAULT false,
    email character varying,
    phone_number character varying,
    is_approved boolean DEFAULT false,
    registration_status public.registration_status DEFAULT 'pending'::public.registration_status,
    approved_at timestamp without time zone,
    approved_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    avatar_color character varying DEFAULT '#10b981'::character varying,
    avatar_text_color character varying,
    date_of_birth date,
    is_adult boolean DEFAULT false,
    portal_activated_at timestamp without time zone,
    payment_activated_at timestamp without time zone,
    adult_transition_at timestamp without time zone,
    age_band public.age_band DEFAULT 'child'::public.age_band,
    is_teen boolean DEFAULT false NOT NULL,
    became_adult_at timestamp without time zone,
    user_id character varying,
    CONSTRAINT age_portal_check CHECK (((can_access_portal = false) OR ((2025 - birth_year) >= 13)))
);


--
-- Name: progression_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progression_snapshots (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    player_id character varying NOT NULL,
    snapshot_date timestamp without time zone NOT NULL,
    skill_id character varying,
    aggregate_level numeric(3,2),
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: quickbooks_account_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quickbooks_account_mappings (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    transaction_type public.quickbooks_transaction_type NOT NULL,
    qb_account_id character varying NOT NULL,
    qb_account_name text NOT NULL,
    qb_account_type character varying,
    qb_class_id character varying,
    qb_class_name text,
    qb_location_id character varying,
    qb_location_name text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: quickbooks_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quickbooks_connections (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    access_token text,
    refresh_token text,
    token_expires_at timestamp without time zone,
    realm_id character varying,
    company_name text,
    company_country character varying,
    is_connected boolean DEFAULT false,
    last_sync_at timestamp without time zone,
    sync_status public.quickbooks_sync_status DEFAULT 'idle'::public.quickbooks_sync_status,
    last_error text,
    auto_sync_enabled boolean DEFAULT false,
    sync_frequency character varying DEFAULT 'daily'::character varying,
    connected_at timestamp without time zone,
    connected_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: quickbooks_sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quickbooks_sync_logs (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    sync_type character varying NOT NULL,
    status character varying NOT NULL,
    records_processed integer DEFAULT 0,
    records_created integer DEFAULT 0,
    records_updated integer DEFAULT 0,
    records_failed integer DEFAULT 0,
    started_at timestamp without time zone NOT NULL,
    completed_at timestamp without time zone,
    duration_ms integer,
    error_message text,
    error_details jsonb,
    triggered_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: quickbooks_sync_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quickbooks_sync_preferences (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    sync_customers boolean DEFAULT true,
    sync_invoices boolean DEFAULT true,
    sync_payments boolean DEFAULT true,
    sync_refunds boolean DEFAULT true,
    fiscal_year_start character varying DEFAULT '01'::character varying,
    report_timezone character varying DEFAULT 'America/New_York'::character varying,
    auto_email_reports boolean DEFAULT false,
    report_recipients text[],
    report_frequency character varying DEFAULT 'monthly'::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: service_billing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_billing (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    organization_name character varying NOT NULL,
    contact_email character varying NOT NULL,
    billing_email character varying NOT NULL,
    phone_number character varying,
    address text,
    city character varying,
    state character varying,
    postal_code character varying,
    country character varying DEFAULT 'United States'::character varying,
    tax_id character varying,
    billing_frequency character varying DEFAULT 'monthly'::character varying NOT NULL,
    payment_method character varying DEFAULT 'invoice'::character varying NOT NULL,
    credit_card_token character varying,
    ach_account_info jsonb,
    preferred_invoice_day integer DEFAULT 1,
    notes text,
    is_active boolean DEFAULT true,
    configured_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: signed_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signed_consents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    template_id character varying NOT NULL,
    signed_by_id character varying NOT NULL,
    signed_by_role character varying NOT NULL,
    subject_id character varying NOT NULL,
    subject_role character varying NOT NULL,
    signature_data jsonb NOT NULL,
    signature_method character varying NOT NULL,
    signed_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: signups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signups (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    player_id character varying NOT NULL,
    session_id character varying NOT NULL,
    paid boolean DEFAULT false,
    payment_intent_id character varying,
    discount_code_id character varying,
    discount_code_applied character varying,
    discount_amount_cents integer,
    created_at timestamp without time zone DEFAULT now(),
    payment_id character varying,
    payment_provider character varying,
    updated_at timestamp without time zone DEFAULT now(),
    reservation_expires_at timestamp without time zone,
    refunded boolean DEFAULT false,
    refund_reason text,
    refunded_at timestamp without time zone,
    refund_transaction_id character varying
);


--
-- Name: sms_credit_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_credit_packages (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    name character varying(100) NOT NULL,
    credits integer NOT NULL,
    price_in_cents integer NOT NULL,
    bonus_credits integer DEFAULT 0,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sms_credit_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_credit_transactions (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    type public.sms_credit_transaction_type NOT NULL,
    amount integer NOT NULL,
    balance_after integer NOT NULL,
    description text,
    reference_id character varying,
    reference_type character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sms_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    message_sid text NOT NULL,
    tenant_id character varying,
    to_number text NOT NULL,
    event public.sms_event NOT NULL,
    error_code text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    tenant_id character varying NOT NULL,
    stripe_customer_id character varying,
    stripe_subscription_id character varying,
    plan_key character varying DEFAULT 'free'::character varying NOT NULL,
    status character varying DEFAULT 'inactive'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying,
    key character varying NOT NULL,
    value text NOT NULL,
    description text,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by character varying
);


--
-- Name: tenant_feature_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_feature_overrides (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    feature_key character varying NOT NULL,
    enabled boolean,
    variant text,
    limit_value integer,
    reason text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    created_by character varying
);


--
-- Name: tenant_invite_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_invite_codes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    code character varying(12) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,
    max_usage integer,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_invoice_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_invoice_lines (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invoice_id character varying NOT NULL,
    type text NOT NULL,
    qty integer DEFAULT 1 NOT NULL,
    unit_price_cents integer DEFAULT 0 NOT NULL,
    amount_cents integer DEFAULT 0 NOT NULL
);


--
-- Name: tenant_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_invoices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    period_start timestamp without time zone NOT NULL,
    period_end timestamp without time zone NOT NULL,
    subtotal_cents integer DEFAULT 0 NOT NULL,
    tax_cents integer DEFAULT 0 NOT NULL,
    total_cents integer DEFAULT 0 NOT NULL,
    status public.invoice_status DEFAULT 'draft'::public.invoice_status NOT NULL,
    due_at timestamp without time zone NOT NULL,
    paid_at timestamp without time zone,
    currency text DEFAULT 'USD'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: tenant_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_memberships (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying NOT NULL,
    role public.tenant_membership_role NOT NULL,
    status public.tenant_membership_status DEFAULT 'active'::public.tenant_membership_status NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_plan_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_plan_assignments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    plan_code text NOT NULL,
    since timestamp without time zone DEFAULT now() NOT NULL,
    until timestamp without time zone
);


--
-- Name: tenant_plan_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_plan_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    from_plan character varying,
    to_plan character varying NOT NULL,
    change_type character varying NOT NULL,
    reason text,
    changed_by character varying,
    automated_trigger character varying,
    mrr integer,
    annual_value integer,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_policies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    region character varying DEFAULT 'US'::character varying,
    audience_mode character varying DEFAULT 'mixed'::character varying,
    parent_required_below integer DEFAULT 13,
    teen_self_access_at integer DEFAULT 13,
    adult_age integer DEFAULT 18,
    allow_teen_payments boolean DEFAULT false,
    allow_split_payments boolean DEFAULT false,
    require_saved_method_for_adult boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tenant_subscription_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_subscription_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    event_type public.subscription_event_type NOT NULL,
    processor public.payment_processor NOT NULL,
    subscription_id character varying,
    plan_id character varying,
    plan_level public.plan_level,
    previous_plan_level public.plan_level,
    amount_cents integer,
    currency character varying DEFAULT 'USD'::character varying,
    status character varying,
    failure_reason character varying,
    failure_code character varying,
    processor_event_id character varying,
    triggered_by character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_usage_daily; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_usage_daily (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    date timestamp without time zone NOT NULL,
    counters jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    subdomain character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    plan_level public.plan_level DEFAULT 'core'::public.plan_level,
    stripe_customer_id character varying,
    stripe_subscription_id character varying,
    trial_status character varying,
    trial_started_at timestamp without time zone,
    trial_ends_at timestamp without time zone,
    trial_plan character varying,
    trial_extensions_used integer DEFAULT 0,
    trial_payment_method_provided boolean DEFAULT false,
    trial_conversion_data jsonb,
    abuse_prevention_fingerprint character varying,
    city text,
    state text,
    country text DEFAULT 'US'::text,
    slug character varying,
    tenant_code character varying,
    contact_name text,
    contact_email text,
    billing_status character varying DEFAULT 'none'::character varying,
    payment_method_required boolean DEFAULT false,
    payment_method_verified boolean DEFAULT false,
    max_trial_extensions integer DEFAULT 1,
    pending_plan_change character varying,
    pending_plan_change_at timestamp without time zone,
    last_plan_level character varying,
    plan_change_reason character varying,
    data_retention_policy jsonb DEFAULT '{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}'::jsonb,
    archived_data_paths jsonb DEFAULT '{}'::jsonb,
    data_cleanup_scheduled_at timestamp without time zone,
    trial_history jsonb DEFAULT '[]'::jsonb,
    signup_ip_address character varying,
    signup_user_agent text,
    risk_score integer DEFAULT 0,
    grace_period_ends_at timestamp without time zone,
    grace_period_reason character varying,
    grace_period_notifications_sent integer DEFAULT 0,
    invite_code character varying(12),
    invite_code_updated_at timestamp with time zone DEFAULT now(),
    invite_code_updated_by character varying,
    custom_domain character varying,
    pending_plan_code character varying,
    last_plan_change_at timestamp without time zone,
    pending_plan_effective_date timestamp without time zone,
    sms_credits_balance integer DEFAULT 0 NOT NULL,
    sms_credits_low_threshold integer DEFAULT 50,
    sms_credits_last_purchased_at timestamp without time zone,
    sms_credits_auto_recharge boolean DEFAULT false,
    sms_credits_auto_recharge_amount integer,
    payment_processor public.payment_processor,
    braintree_customer_id character varying,
    braintree_subscription_id character varying,
    braintree_status character varying,
    braintree_plan_id character varying,
    braintree_payment_method_token character varying,
    braintree_oauth_merchant_id character varying,
    braintree_next_billing_date timestamp without time zone,
    braintree_last_charge_at timestamp without time zone,
    braintree_last_failure_at timestamp without time zone,
    braintree_failure_count integer DEFAULT 0,
    display_name text,
    applied_discount_code_id character varying,
    applied_discount_code character varying,
    applied_discount_type character varying,
    applied_discount_value integer,
    applied_discount_duration character varying,
    applied_discount_remaining_cycles integer,
    applied_discount_started_at timestamp without time zone,
    applied_discount_applied_by character varying,
    applied_discount_is_platform boolean DEFAULT false,
    is_staging boolean DEFAULT false
);


--
-- Name: training_plan_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_plan_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    plan_id character varying NOT NULL,
    day_of_week integer NOT NULL,
    drill_id character varying,
    custom_text text,
    duration_minutes integer,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: training_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    player_id character varying,
    created_by character varying NOT NULL,
    title character varying NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: unified_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unified_invitations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    batch_id character varying,
    type character varying NOT NULL,
    recipient_email text NOT NULL,
    recipient_name text,
    role character varying NOT NULL,
    token text NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    custom_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    expires_at timestamp without time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    sent_at timestamp without time zone,
    viewed_at timestamp without time zone,
    accepted_at timestamp without time zone,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT unified_invitations_role_check CHECK (((role)::text = ANY ((ARRAY['parent'::character varying, 'player'::character varying, 'admin'::character varying, 'assistant'::character varying])::text[]))),
    CONSTRAINT unified_invitations_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'sent'::character varying, 'viewed'::character varying, 'accepted'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT unified_invitations_type_check CHECK (((type)::text = ANY ((ARRAY['email'::character varying, 'code'::character varying, 'parent2'::character varying, 'player'::character varying])::text[])))
);


--
-- Name: unsubscribes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unsubscribes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    channel public.unsubscribe_channel NOT NULL,
    address text NOT NULL,
    reason text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_credits (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(255),
    tenant_id character varying(255) NOT NULL,
    amount_cents integer NOT NULL,
    reason text NOT NULL,
    session_id character varying(255),
    signup_id character varying(255),
    is_used boolean DEFAULT false NOT NULL,
    used_at timestamp without time zone,
    used_for_signup_id character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    household_id character varying
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    phone character varying,
    is_admin boolean DEFAULT false,
    is_assistant boolean DEFAULT false,
    is_super_admin boolean DEFAULT false,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret character varying,
    customer_id character varying,
    is_approved boolean DEFAULT false,
    registration_status public.registration_status DEFAULT 'pending'::public.registration_status,
    approved_at timestamp without time zone,
    approved_by character varying,
    rejected_at timestamp without time zone,
    rejected_by character varying,
    rejection_reason text,
    parent2_invite_sent_via character varying,
    parent2_invited_at timestamp without time zone,
    parent2_invite_email character varying,
    parent2_invite_phone character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    avatar_color character varying DEFAULT '#2563eb'::character varying,
    avatar_text_color character varying,
    role public.user_role DEFAULT 'parent'::public.user_role,
    mfa_enabled boolean DEFAULT false,
    status public.user_status DEFAULT 'active'::public.user_status,
    password_hash text,
    auth_provider character varying,
    auth_provider_id character varying,
    email_verified_at timestamp without time zone,
    verification_status character varying(50) DEFAULT 'verified'::character varying,
    date_of_birth date,
    clerk_user_id character varying,
    is_unaffiliated boolean DEFAULT false
);


--
-- Name: waitlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.waitlists (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    session_id character varying NOT NULL,
    player_id character varying NOT NULL,
    parent_id character varying NOT NULL,
    "position" integer NOT NULL,
    status public.waitlist_status DEFAULT 'active'::public.waitlist_status NOT NULL,
    notify_on_join boolean DEFAULT true,
    notify_on_position_change boolean DEFAULT false,
    offer_expires_at timestamp without time zone,
    joined_at timestamp without time zone DEFAULT now(),
    offer_status public.waitlist_offer_status DEFAULT 'none'::public.waitlist_offer_status NOT NULL
);


--
-- Name: webhook_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_attempts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying NOT NULL,
    attempt_no integer NOT NULL,
    status public.webhook_attempt_status NOT NULL,
    http_status integer,
    latency_ms integer,
    error text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    webhook_id character varying NOT NULL,
    source text NOT NULL,
    event_type text NOT NULL,
    payload_json jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    delivered_at timestamp without time zone
);


--
-- Name: webhook_stats_hourly; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_stats_hourly (
    webhook_id character varying NOT NULL,
    hour timestamp with time zone NOT NULL,
    attempts integer DEFAULT 0,
    success integer DEFAULT 0,
    failed integer DEFAULT 0,
    p95_latency_ms integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Data for Name: ai_anomalies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_anomalies (id, date, scope_type, scope_id, metric, direction, zscore, expected, actual, severity, created_at) FROM stdin;
b2bd1f8b-9d1e-436e-bf4b-52022e77f161	2025-08-21	platform	\N	revenue	up	3.2	2500	4500	high	2025-08-24 03:39:52.511461
59524358-8541-4ae5-bb78-36bcc9be8cb2	2025-08-17	platform	\N	users	down	-2.8	45	25	medium	2025-08-24 03:39:52.511461
9aab1016-dddf-46b0-ac56-b660cd7223ec	2025-08-23	tenant	d98c4191-c7e0-474d-9dd7-672219d85e4d	sessions	up	2.5	5	12	low	2025-08-24 03:39:52.511461
894c809a-3889-4780-a9db-bc099ae6825e	2025-08-23	platform	\N	registrations	low	-2.5	50	25	warn	2025-08-24 04:09:00.449835
402f6166-6b77-4e3b-af6d-60ffa48787d0	2025-08-22	tenant	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_failures	high	2.8	2	8	crit	2025-08-24 04:09:00.449835
35264d76-3f70-465c-89a3-1e7bd513063b	2025-08-21	platform	\N	session_utilization	low	-2.2	80	55	warn	2025-08-24 04:09:00.449835
\.


--
-- Data for Name: ai_contributions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_contributions (id, period_start, period_end, metric, driver_type, driver_id, driver_label, impact_abs, impact_pct, rank, created_at) FROM stdin;
8a5a918b-50fe-47e3-9a5c-fe9cb2fdc74a	2025-07-25	2025-08-24	revenue	tenant	d98c4191-c7e0-474d-9dd7-672219d85e4d	Futsal Culture	15000	45.5	1	2025-08-24 03:40:00.652582
105ae8fe-c1e0-4c30-a4a2-2a67581063d4	2025-07-25	2025-08-24	revenue	location	north	North Region	8000	24.2	2	2025-08-24 03:40:00.652582
e2d4cbf3-94ea-4f20-9b1a-b96c2d7acd77	2025-07-25	2025-08-24	revenue	age_group	U12	U12 Players	5000	15.1	3	2025-08-24 03:40:00.652582
fd6431f6-fe88-4ca9-9138-ffe0b290bb37	2025-07-25	2025-08-24	users	source	referral	Word of Mouth	25	55.6	1	2025-08-24 03:40:00.652582
22b9d8ad-cef6-4a74-85d0-5bcb462ee2b0	2025-07-25	2025-08-24	users	source	social	Social Media	12	26.7	2	2025-08-24 03:40:00.652582
787de1e6-cf0c-443f-8c15-3ff194acc9f2	2025-08-17	2025-08-24	platform_mrr	tenant	c2d95cef-9cd3-4411-9e12-c478747e8c06	Elite Footwork Academy	180000	15.2	1	2025-08-24 04:08:57.221644
77de3a24-4245-4dc9-835b-a34311c00431	2025-08-17	2025-08-24	platform_mrr	tenant	d98c4191-c7e0-474d-9dd7-672219d85e4d	Futsal Culture	120000	8.7	2	2025-08-24 04:08:57.221644
0f07a3bb-84df-462b-9f77-eee77f101d90	2025-08-17	2025-08-24	platform_mrr	feature	payment_processing	Payment Processing Updates	85000	6.2	3	2025-08-24 04:08:57.221644
f82b10cf-3c9a-467f-8ac2-c123060382a8	2025-08-17	2025-08-24	commerce_net	tenant	c2d95cef-9cd3-4411-9e12-c478747e8c06	Elite Footwork Academy	250000	18.5	1	2025-08-24 04:08:57.221644
4d0a2050-677e-4e99-8617-0a6beaee8737	2025-08-17	2025-08-24	commerce_net	tenant	d98c4191-c7e0-474d-9dd7-672219d85e4d	Futsal Culture	190000	14.2	2	2025-08-24 04:08:57.221644
6bb02dde-583e-44b1-84a9-a883f2bae1d9	2025-08-17	2025-08-24	commerce_net	feature	session_bookings	Session Booking Growth	95000	7.1	3	2025-08-24 04:08:57.221644
\.


--
-- Data for Name: ai_forecasts_daily; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_forecasts_daily (id, date, scope_type, scope_id, metric, mean, p10, p90, model, created_at) FROM stdin;
753e03ba-85cd-4873-8da0-63f715525ff6	2025-08-25	platform	\N	revenue	3083	2050	3059	prophet	2025-08-24 03:39:48.84365
7ccbfe42-3421-4169-8376-fea99739e817	2025-08-26	platform	\N	revenue	3241	2313	3306	prophet	2025-08-24 03:39:48.84365
9cde98ee-6bd9-4164-b8f5-f0adf19ae561	2025-08-27	platform	\N	revenue	2788	2311	3207	prophet	2025-08-24 03:39:48.84365
1f174f8d-1056-475f-b77d-30098ef16399	2025-08-28	platform	\N	revenue	3129	2297	3080	prophet	2025-08-24 03:39:48.84365
d197d279-360d-432e-a1dd-dc7c33b0228c	2025-08-29	platform	\N	revenue	3222	2108	3293	prophet	2025-08-24 03:39:48.84365
1407d2b2-e9f1-4751-8aa8-e316e5109297	2025-08-30	platform	\N	revenue	2795	2243	3384	prophet	2025-08-24 03:39:48.84365
5401e96f-2e65-43d3-8c94-a93631a315d1	2025-08-31	platform	\N	revenue	3202	2181	3277	prophet	2025-08-24 03:39:48.84365
524f34bb-e9a8-4981-941b-b9411de0e4fc	2025-09-01	platform	\N	revenue	3232	2436	3128	prophet	2025-08-24 03:39:48.84365
8ee755f6-3d46-4fd9-9f4a-3778f66dbbbb	2025-09-02	platform	\N	revenue	3081	2050	3414	prophet	2025-08-24 03:39:48.84365
5597c02c-df4b-4f5a-a1a4-876b5bdc7262	2025-09-03	platform	\N	revenue	2606	2392	3061	prophet	2025-08-24 03:39:48.84365
deb2aacf-fd7a-41e1-996f-fee1cbc12bf9	2025-09-04	platform	\N	revenue	3275	2118	3150	prophet	2025-08-24 03:39:48.84365
6224af42-57a8-44b1-b9a0-99887c1ffa1c	2025-09-05	platform	\N	revenue	2689	2456	3434	prophet	2025-08-24 03:39:48.84365
9fc9ea7b-1e3d-485d-8fcd-4d2fdda610fd	2025-09-06	platform	\N	revenue	3016	2181	3401	prophet	2025-08-24 03:39:48.84365
9bd60e05-cbf6-455b-a034-5688b83e18d5	2025-09-07	platform	\N	revenue	2932	2454	3048	prophet	2025-08-24 03:39:48.84365
bf1881bd-aa25-4139-9010-b0326431a3c7	2025-09-08	platform	\N	revenue	3455	2243	3104	prophet	2025-08-24 03:39:48.84365
2f9e0099-a89a-4492-bddb-ce6b875c4c16	2025-09-09	platform	\N	revenue	3174	2268	3474	prophet	2025-08-24 03:39:48.84365
d1f3c907-eeb6-4a5e-8b0e-85f9bc92d1d7	2025-09-10	platform	\N	revenue	3119	2439	3435	prophet	2025-08-24 03:39:48.84365
1b345393-9774-4c4d-8549-f2c2fc5d75e8	2025-09-11	platform	\N	revenue	3400	2268	3242	prophet	2025-08-24 03:39:48.84365
7dd43fb5-1690-4e25-afd7-afc684fa633a	2025-09-12	platform	\N	revenue	2525	2044	3013	prophet	2025-08-24 03:39:48.84365
c3665033-da46-489c-b236-919ee7ecad54	2025-09-13	platform	\N	revenue	2996	2324	3102	prophet	2025-08-24 03:39:48.84365
872d21cf-bf20-4eb0-9a2d-4ac2ffcebd18	2025-09-14	platform	\N	revenue	2720	2055	3312	prophet	2025-08-24 03:39:48.84365
e9cb3aa4-2696-4051-a9c1-fee6156f03aa	2025-09-15	platform	\N	revenue	3443	2312	3227	prophet	2025-08-24 03:39:48.84365
f425361f-ad76-499d-a681-563068bd94c6	2025-09-16	platform	\N	revenue	2788	2152	3256	prophet	2025-08-24 03:39:48.84365
70af73a2-2589-46bd-b7af-6a9416c48237	2025-09-17	platform	\N	revenue	3293	2130	3094	prophet	2025-08-24 03:39:48.84365
ef8de18c-bd1d-4156-bf02-0bd698374cca	2025-09-18	platform	\N	revenue	2992	2145	3208	prophet	2025-08-24 03:39:48.84365
3feb6b75-dbf0-4218-ba20-738eac2c7b96	2025-09-19	platform	\N	revenue	2607	2294	3014	prophet	2025-08-24 03:39:48.84365
c3c53ab8-1f7d-4d2d-b9a4-a5cafd021344	2025-09-20	platform	\N	revenue	3256	2174	3201	prophet	2025-08-24 03:39:48.84365
621dd115-d602-4402-8825-633501a43217	2025-09-21	platform	\N	revenue	2646	2165	3285	prophet	2025-08-24 03:39:48.84365
9b31a3f7-0cb6-445c-b092-fe5d93d544b8	2025-09-22	platform	\N	revenue	3363	2050	3113	prophet	2025-08-24 03:39:48.84365
9c35f6b0-b6d1-4731-8036-a1df577a3b2e	2025-09-23	platform	\N	revenue	2753	2371	3471	prophet	2025-08-24 03:39:48.84365
5aab44d8-c624-4512-a574-77faab55a15c	2025-08-25	platform	\N	users	51	49	60	prophet	2025-08-24 03:39:48.84365
e313f0da-1d70-4c64-a33a-b3a1d05a5b55	2025-08-26	platform	\N	users	51	49	68	prophet	2025-08-24 03:39:48.84365
c838f339-a8a1-4fef-8d2c-19cc3ab3bd85	2025-08-27	platform	\N	users	60	46	69	prophet	2025-08-24 03:39:48.84365
40d2e025-bc68-444c-b73f-f6011b61e9b5	2025-08-28	platform	\N	users	58	46	67	prophet	2025-08-24 03:39:48.84365
c19b2007-acbc-4dbb-a773-a351b323d9f4	2025-08-29	platform	\N	users	68	50	62	prophet	2025-08-24 03:39:48.84365
18a15021-8f9d-440f-930e-63ffc8cbbbeb	2025-08-30	platform	\N	users	68	54	65	prophet	2025-08-24 03:39:48.84365
e2a9683b-560e-4a20-96b5-b5fe7ef7b587	2025-08-31	platform	\N	users	69	45	67	prophet	2025-08-24 03:39:48.84365
d2c6611c-d9dc-4c4b-959e-534514d4f123	2025-09-01	platform	\N	users	69	54	69	prophet	2025-08-24 03:39:48.84365
7335e229-263d-4334-a14a-f8f98bcb83c2	2025-09-02	platform	\N	users	69	51	61	prophet	2025-08-24 03:39:48.84365
575f39db-7c7f-4fd8-bcf0-235ebc9786d1	2025-09-03	platform	\N	users	53	49	69	prophet	2025-08-24 03:39:48.84365
3d90e26a-71bf-47bb-a692-2b904bcf2074	2025-09-04	platform	\N	users	52	47	63	prophet	2025-08-24 03:39:48.84365
5bdd14c5-1ba9-4d1c-b17e-5fc34c862246	2025-09-05	platform	\N	users	62	54	63	prophet	2025-08-24 03:39:48.84365
35ab1fc6-bae3-46f0-aecb-7edbc64fe0d8	2025-09-06	platform	\N	users	54	46	62	prophet	2025-08-24 03:39:48.84365
67e3d5d1-45d8-4316-919b-709dfa1fadb5	2025-09-07	platform	\N	users	59	49	66	prophet	2025-08-24 03:39:48.84365
fd3ef1d5-1a52-46f4-92bc-141793d23ea0	2025-09-08	platform	\N	users	67	47	67	prophet	2025-08-24 03:39:48.84365
70034c03-3ecf-4809-85c4-31e52c13db93	2025-09-09	platform	\N	users	60	48	60	prophet	2025-08-24 03:39:48.84365
cc2c9f31-90c8-4d60-9b1a-fa83af57e586	2025-09-10	platform	\N	users	65	54	68	prophet	2025-08-24 03:39:48.84365
614f0e2b-45af-494f-bc97-76d3d376676d	2025-09-11	platform	\N	users	69	46	66	prophet	2025-08-24 03:39:48.84365
931b1a9d-31d0-4ba6-bcc1-b62431a1daf6	2025-09-12	platform	\N	users	55	49	63	prophet	2025-08-24 03:39:48.84365
5302f94d-579a-4ff7-84f3-24fa41d612b7	2025-09-13	platform	\N	users	59	50	63	prophet	2025-08-24 03:39:48.84365
be27c1c5-0a2c-40e6-bb2b-1f02cbabd935	2025-09-14	platform	\N	users	50	48	63	prophet	2025-08-24 03:39:48.84365
6067ad1d-b600-492d-8f39-9a81ab96fab8	2025-09-15	platform	\N	users	52	49	61	prophet	2025-08-24 03:39:48.84365
64a7f116-6dc9-465a-bc71-d64da672080f	2025-09-16	platform	\N	users	56	51	61	prophet	2025-08-24 03:39:48.84365
2b05d6c0-1590-4d6d-b907-30ebf7ee98d4	2025-09-17	platform	\N	users	59	47	67	prophet	2025-08-24 03:39:48.84365
8f865e18-8607-491b-b417-564548c2587d	2025-09-18	platform	\N	users	67	53	69	prophet	2025-08-24 03:39:48.84365
a0b52212-b720-4e68-b7b6-d9711bdfbfd7	2025-09-19	platform	\N	users	63	53	61	prophet	2025-08-24 03:39:48.84365
e336e74d-3644-4946-9428-6ab96d876687	2025-09-20	platform	\N	users	58	47	68	prophet	2025-08-24 03:39:48.84365
b5942bcc-7217-42d2-9139-0ce48eb35ebd	2025-09-21	platform	\N	users	55	54	62	prophet	2025-08-24 03:39:48.84365
d3cbecc4-e01e-4ba1-a142-49ea5ee94ccb	2025-09-22	platform	\N	users	57	53	70	prophet	2025-08-24 03:39:48.84365
145d55e3-d22f-4a59-b34f-d477507a717f	2025-09-23	platform	\N	users	59	52	61	prophet	2025-08-24 03:39:48.84365
7e19d9f9-fabc-44ac-9b56-771dcb44fdf0	2025-08-25	platform	\N	platform_mrr	4500000	4200000	5000000	prophet	2025-08-24 04:08:51.035201
af9fed9b-efbf-480e-9273-4fddf315c59f	2025-08-26	platform	\N	platform_mrr	4520000	4220000	5020000	prophet	2025-08-24 04:08:51.035201
4ea14608-921e-405a-8a98-f519a6b93c20	2025-08-27	platform	\N	platform_mrr	4540000	4240000	5040000	prophet	2025-08-24 04:08:51.035201
1f3ce560-add4-4834-906b-584af75d7867	2025-08-25	platform	\N	commerce_net	2800000	2500000	3200000	prophet	2025-08-24 04:08:51.035201
4c22fa3b-304c-4892-b122-8d4baac30168	2025-08-26	platform	\N	commerce_net	2850000	2550000	3250000	prophet	2025-08-24 04:08:51.035201
9c879992-900c-46cd-a8dd-a1f4df2bc490	2025-08-27	platform	\N	commerce_net	2900000	2600000	3300000	prophet	2025-08-24 04:08:51.035201
\.


--
-- Data for Name: ai_narratives; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_narratives (id, period_start, period_end, scope_type, scope_id, summary_md, drivers_md, risks_md, forecast_md, created_at) FROM stdin;
56e7caa2-066b-4339-addc-25198d0c73cf	2025-07-25	2025-08-24	platform	\N	## Platform Performance\\n* **Revenue:** $33,000 (+45% MoM)\\n* **Active Users:** 45 (+25% MoM)\\n* **Sessions:** 261 scheduled\\n* **Conversion:** 68% booking rate	## Key Growth Drivers\\n1. **Futsal Culture** driving 45.5% of revenue\\n2. **North Region** contributing 24.2% of growth\\n3. **Word of Mouth** bringing in 55.6% of new users	## Risk Factors\\n* **High Concentration:** Single tenant (Futsal Culture) represents 45% of revenue\\n* **Seasonality:** Summer months showing 30% drop in bookings\\n* **Payment Failures:** 3% failure rate needs attention	## 30-Day Forecast\\n* **Revenue:** Expected to reach $42,000-48,000\\n* **User Growth:** +15-20 new users projected\\n* **Session Utilization:** Trending towards 75% capacity	2025-08-24 03:40:21.629151
\.


--
-- Data for Name: ai_tenant_scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_tenant_scores (id, tenant_id, date, churn_risk, health_score, top_signals, created_at) FROM stdin;
a074db6b-928d-4c6b-b387-f89d66fe36b1	d98c4191-c7e0-474d-9dd7-672219d85e4d	2025-08-24	0.12	85	[{"impact": "positive", "signal": "High session utilization"}, {"impact": "positive", "signal": "Growing user base"}]	2025-08-24 03:40:31.515352
6b65a87f-0101-4e91-9d3c-c47296408bc1	c2d95cef-9cd3-4411-9e12-c478747e8c06	2025-08-24	0.35	65	[{"impact": "negative", "signal": "Declining bookings"}, {"impact": "negative", "signal": "Payment failures"}]	2025-08-24 03:40:31.515352
82c7c931-8d6d-4bbe-8382-338e056fddfc	c2d95cef-9cd3-4411-9e12-c478747e8c06	2025-08-24	0.25	85	{"signals": [{"signal": "payment_success", "severity": "low"}, {"signal": "engagement_high", "severity": "low"}]}	2025-08-24 04:09:03.253385
c067944d-2805-451c-ab06-6579e8cc9af5	d98c4191-c7e0-474d-9dd7-672219d85e4d	2025-08-24	0.15	92	{"signals": [{"signal": "growth_strong", "severity": "low"}, {"signal": "retention_excellent", "severity": "low"}]}	2025-08-24 04:09:03.253385
\.


--
-- Data for Name: attendance_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_snapshots (id, tenant_id, player_id, session_id, attended, created_at) FROM stdin;
\.


--
-- Data for Name: audit_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_events (id, tenant_id, user_id, user_role, action, resource_type, resource_id, details, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, actor_id, actor_role, section, action, target_id, diff, ip, created_at) FROM stdin;
343f014f-3904-4b96-b3b0-674e84db53db	user_14	super_admin	tenants	create	tenants_nsxi1t	{"status": "active", "created_at": "2025-08-04T08:21:09.373Z"}	10.0.115.102	2025-08-04 08:21:09.373
d8b74035-b105-4863-af7d-b27203b944b7	user_1	parent	users	import	users_1wi8dm	{"rows": 99, "success": true}	10.0.193.201	2025-08-03 05:21:40.494
ba91a70f-6a37-40c5-99de-412e46fb3e96	user_19	admin	tenants	logout	tenants_thb65l	\N	10.0.186.4	2025-08-18 09:04:15.834
68099253-9cb2-4c28-b9ac-7743b526c572	user_15	super_admin	settings	logout	settings_nu6t6m	\N	10.0.110.14	2025-08-21 21:38:44.996
2d078ab5-03d2-4975-99c4-7f901fab5efe	user_18	admin	sessions	delete	sessions_zxdnhq	{"deleted_at": "2025-08-21T19:55:43.714Z"}	10.0.181.96	2025-08-21 19:55:43.714
ab9385b7-3800-46a1-bf37-7081a6abc9f0	user_10	parent	tenants	login	tenants_u28z7	\N	10.0.228.180	2025-08-02 03:09:34.418
d1be70dc-90d8-4f05-a8d6-1e3302fc6968	user_14	admin	sessions	create	sessions_zu83fx	{"status": "active", "created_at": "2025-08-12T19:01:23.182Z"}	10.0.182.114	2025-08-12 19:01:23.182
a38b5b4c-16ec-4a1a-a3bd-f8cae595d6f2	user_9	super_admin	integrations	create	integrations_abpmjm	{"status": "active", "created_at": "2025-07-29T23:02:19.218Z"}	10.0.108.194	2025-07-29 23:02:19.218
bf9820a8-f20f-41d4-b383-03fbbdb2b0b2	user_2	parent	integrations	create	integrations_4l36n	{"status": "active", "created_at": "2025-07-24T23:49:57.097Z"}	10.0.147.57	2025-07-24 23:49:57.097
0a7aa9d6-2df8-4f49-b4ee-1d0c06223d45	user_14	parent	settings	export	settings_1me28	{"format": "csv", "records": 620}	10.0.110.225	2025-07-28 09:13:00.024
ca30a664-9cee-472f-9289-9045b206e6f3	user_1	admin	payments	export	payments_0zhwq	{"format": "csv", "records": 714}	10.0.81.222	2025-08-23 02:20:51.765
73a81bf1-c601-498b-9baa-5b22431da463	user_12	super_admin	integrations	import	integrations_8fymr	{"rows": 87, "success": true}	10.0.90.100	2025-07-27 15:16:50.713
b5d168fe-819f-4f5d-9ab7-704f0b0c5bf0	user_9	admin	tenants	import	tenants_vv54y8	{"rows": 5, "success": true}	10.0.51.146	2025-08-15 13:18:18.17
1b861323-9902-4775-ad28-d16d73b65a8a	user_10	super_admin	users	create	users_db2d9q	{"status": "active", "created_at": "2025-08-12T22:40:57.015Z"}	10.0.175.200	2025-08-12 22:40:57.015
06222988-83dd-46b9-9eeb-e4dc47164286	user_8	parent	sessions	logout	sessions_o29uom	\N	10.0.142.32	2025-08-18 09:08:03.825
a77b15c2-f11c-45e6-abad-d66eeb0a52e8	user_2	super_admin	payments	import	payments_5l582j	{"rows": 82, "success": true}	10.0.80.176	2025-08-17 20:25:47.882
d5086a0a-a24f-4672-a150-1c06d2454c2c	user_1	parent	integrations	create	integrations_n035s	{"status": "active", "created_at": "2025-08-03T09:35:51.131Z"}	10.0.177.250	2025-08-03 09:35:51.131
302cf686-04e4-442c-bb27-21e55557502e	user_17	admin	integrations	delete	integrations_6m2a7i	{"deleted_at": "2025-07-30T13:05:18.322Z"}	10.0.181.254	2025-07-30 13:05:18.322
49078151-b962-4238-8e01-b10f51ae1c16	user_16	parent	sessions	update	sessions_cq8fd	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-22T08:33:22.450Z"}	10.0.104.129	2025-08-22 08:33:22.45
8f5bfc19-996f-42f2-8c36-124ba3f77ec6	user_16	parent	integrations	export	integrations_fo89qh	{"format": "csv", "records": 746}	10.0.17.231	2025-07-30 05:20:53.985
16100851-482f-463d-9846-12a53b3aaae2	user_11	admin	integrations	update	integrations_gjmxab	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-17T13:33:33.131Z"}	10.0.77.11	2025-08-17 13:33:33.131
a010726c-bb05-4fe4-8cc8-aeb1fd936a48	user_2	super_admin	payments	export	payments_g33l8i	{"format": "csv", "records": 888}	10.0.56.122	2025-07-26 06:33:16.412
33546d14-5942-4339-a925-8ff9e9156aa8	user_9	super_admin	settings	export	settings_5eggvo	{"format": "csv", "records": 354}	10.0.78.229	2025-08-13 01:46:24.337
0ceaf18e-7a17-4f94-a2db-4ad04772d78f	user_11	admin	sessions	create	sessions_rd4n2a	{"status": "active", "created_at": "2025-08-11T04:25:16.346Z"}	10.0.20.248	2025-08-11 04:25:16.346
e86093f9-fefe-4b82-9bac-0498d55f85e4	user_12	parent	sessions	logout	sessions_dcmw1m	\N	10.0.21.162	2025-07-29 18:15:50.644
ea2a6930-bff7-4e26-a497-e9c1a302968c	user_15	admin	tenants	export	tenants_az0qma	{"format": "csv", "records": 838}	10.0.173.141	2025-07-26 22:57:46.231
45c2ba34-addc-4982-b330-15471c303243	user_6	super_admin	payments	logout	payments_9x10q6	\N	10.0.214.161	2025-08-04 05:10:25.296
693bfb33-9478-4cde-a616-af05b53f6901	user_5	admin	tenants	login	tenants_e6yr1f	\N	10.0.23.144	2025-08-23 03:13:38.019
2c5d1757-a358-44c0-a390-e860d5b3b6c4	user_2	admin	integrations	create	integrations_tk3nep	{"status": "active", "created_at": "2025-08-05T18:04:31.869Z"}	10.0.83.25	2025-08-05 18:04:31.869
0ee5f7ce-03b0-4c1a-ac27-ad9a3fef255b	user_10	admin	tenants	delete	tenants_16sxd	{"deleted_at": "2025-08-19T05:29:51.785Z"}	10.0.12.103	2025-08-19 05:29:51.785
cf6a4450-61ff-48a1-8866-5c3e130db2e4	user_20	super_admin	tenants	logout	tenants_g4dhv	\N	10.0.146.126	2025-08-14 18:17:48.616
43c8024f-9130-4cd6-89cf-0e06c2bd1869	user_15	admin	payments	import	payments_7t3uyza	{"rows": 56, "success": true}	10.0.188.15	2025-08-15 23:40:25.392
41bad82d-06e9-4d49-bf4c-900f19f9d4c1	user_5	super_admin	payments	login	payments_nnvum	\N	10.0.98.175	2025-08-11 08:31:55.424
cd277df7-0b66-4d2d-8d6e-717ca360a5ab	user_11	parent	sessions	login	sessions_zcxqji	\N	10.0.129.209	2025-08-12 20:18:53.647
635215c1-b392-4fed-a825-a8c8570bffc3	user_20	admin	tenants	export	tenants_o5lqll	{"format": "csv", "records": 787}	10.0.103.252	2025-07-26 12:49:19.225
5d94489c-5ea4-4188-93f6-2f16797c2dfc	user_19	super_admin	sessions	logout	sessions_peenk	\N	10.0.26.51	2025-08-12 05:36:04.507
49da047c-3bb5-4195-91ed-9063360238e9	user_15	admin	payments	import	payments_k8qk7p	{"rows": 4, "success": true}	10.0.204.175	2025-08-22 16:14:09.413
f37e61df-e72c-4028-a0b6-a72d39640953	user_20	parent	integrations	logout	integrations_y7tg7r	\N	10.0.143.96	2025-08-19 23:06:16.279
5d61ab74-5d5a-4feb-988f-d9aee07efb4d	user_3	super_admin	payments	update	payments_5l0d8	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-07-30T08:19:14.664Z"}	10.0.191.161	2025-07-30 08:19:14.664
abbd68e8-5a03-422b-9b02-26682ad2295c	user_13	super_admin	payments	logout	payments_09fet	\N	10.0.216.202	2025-08-11 06:16:13.461
dad55153-db95-4a9b-b5a0-a1fcc63813a1	user_12	super_admin	tenants	logout	tenants_4ien5	\N	10.0.81.145	2025-08-12 15:26:37.259
6b044a1a-32d7-4929-bd3c-882aae2fdd29	user_14	parent	sessions	import	sessions_6bkwhf	{"rows": 52, "success": true}	10.0.199.220	2025-07-29 17:24:46.429
43b8fb37-16e2-422d-a408-2e7b9466f5ae	user_5	super_admin	tenants	delete	tenants_gpn97l	{"deleted_at": "2025-07-25T20:27:46.168Z"}	10.0.67.159	2025-07-25 20:27:46.168
b7206048-9f3d-4f7d-81fc-aa3c7d3a1b46	user_2	super_admin	payments	delete	payments_ihahp	{"deleted_at": "2025-08-07T20:54:20.878Z"}	10.0.145.54	2025-08-07 20:54:20.878
b6023283-7e08-45b5-a1e3-9c38397d7a37	user_12	super_admin	integrations	logout	integrations_5uq9vf	\N	10.0.200.7	2025-07-28 05:32:02.797
c297b30a-04ab-4632-83a6-b1f98a284f9c	user_3	parent	sessions	export	sessions_eez7hgq	{"format": "csv", "records": 9}	10.0.122.236	2025-07-30 13:56:24.617
3e4badd5-e7d7-4c2d-bb86-77a7dfc632d4	user_4	super_admin	integrations	create	integrations_txbgc9	{"status": "active", "created_at": "2025-08-02T12:16:38.259Z"}	10.0.208.171	2025-08-02 12:16:38.259
c9f7539b-ab3d-4fa4-b814-0ec7025aa6ee	user_2	admin	integrations	login	integrations_o2v35g	\N	10.0.185.173	2025-08-15 07:12:00.07
cc519434-f890-41e7-83bb-9e203ce588d7	user_1	admin	settings	import	settings_l1r6v	{"rows": 50, "success": false}	10.0.156.177	2025-08-03 00:26:58.51
67207c10-f21c-4c80-be5b-71659f0d2d80	user_7	super_admin	sessions	import	sessions_kov8sug	{"rows": 30, "success": true}	10.0.45.28	2025-08-15 10:23:16.227
6f01199c-a777-4b19-809f-4b4b22c94ccd	user_11	parent	tenants	update	tenants_cgej0k	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-14T08:29:58.524Z"}	10.0.100.130	2025-08-14 08:29:58.524
7d35f1b3-490a-43b3-ac37-8737cb2dff98	user_19	parent	sessions	login	sessions_dgn4dv	\N	10.0.120.240	2025-08-01 23:36:17.906
a4e36f96-e1fd-4bd4-bdbf-b86184dfb07e	user_20	admin	settings	create	settings_1bhw9q	{"status": "active", "created_at": "2025-08-08T08:20:56.531Z"}	10.0.195.58	2025-08-08 08:20:56.531
f8201ccc-14a1-420f-8ed9-e6f864578d74	user_20	super_admin	tenants	login	tenants_hsile9	\N	10.0.222.144	2025-08-07 16:14:26.928
d93a16b2-74ea-4f6e-8e16-225ca092a3cb	user_2	super_admin	integrations	login	integrations_tqof2	\N	10.0.99.227	2025-08-08 09:35:44.079
e6d09f6a-0f57-4ff0-be68-d31106a9aeb1	user_14	parent	sessions	login	sessions_prgrw	\N	10.0.125.93	2025-08-14 15:57:50.991
6f9de1bd-b8f2-443f-a565-8100b03a8ff1	user_5	parent	payments	import	payments_57uyt	{"rows": 70, "success": true}	10.0.105.58	2025-07-25 15:14:32.463
06db0619-2d52-4da0-aba3-e87d820c1c4b	user_5	parent	payments	export	payments_nhpus	{"format": "csv", "records": 631}	10.0.208.208	2025-08-06 13:37:31.97
b28a0d28-e259-4fbf-b5b5-83edef257a89	user_20	admin	users	delete	users_4ghcw	{"deleted_at": "2025-08-04T12:44:25.247Z"}	10.0.235.66	2025-08-04 12:44:25.247
d1325252-191b-4763-a88b-63f511194762	user_6	admin	tenants	create	tenants_6f093l	{"status": "active", "created_at": "2025-08-03T23:53:40.382Z"}	10.0.160.235	2025-08-03 23:53:40.382
bcf8b3f3-028a-4b88-b09f-54e2bf35c35f	user_18	super_admin	tenants	export	tenants_8bpjp3	{"format": "csv", "records": 337}	10.0.176.182	2025-07-24 23:16:23.905
0829670a-23e5-4012-be6a-aae2f0e806f5	user_4	parent	settings	logout	settings_bukf2	\N	10.0.23.5	2025-08-11 21:22:03.242
90a92d92-1992-44f9-afca-365e5e81fae2	user_2	parent	payments	delete	payments_a2n1a9	{"deleted_at": "2025-07-31T06:18:57.578Z"}	10.0.1.121	2025-07-31 06:18:57.578
0f42964e-cb8d-45c8-992b-d49d5828afc6	user_17	admin	settings	delete	settings_h2fvjm	{"deleted_at": "2025-08-16T07:59:06.624Z"}	10.0.226.234	2025-08-16 07:59:06.624
9d78cf7d-4b6c-42d5-ae0f-c6e487a0a29d	user_1	admin	users	update	users_e4qhz	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-18T19:27:35.425Z"}	10.0.107.223	2025-08-18 19:27:35.425
f7b3c116-6420-4f4d-a3d1-6654760f3bc3	user_11	admin	integrations	export	integrations_xixzxt	{"format": "csv", "records": 620}	10.0.71.19	2025-08-02 20:03:02.322
be3e5e85-ad73-4f83-82f4-72d5b3b7204c	user_10	parent	sessions	delete	sessions_6d112q	{"deleted_at": "2025-07-28T05:25:55.273Z"}	10.0.52.81	2025-07-28 05:25:55.273
166a87a4-71eb-4713-bef5-63d76f9cab7d	user_19	super_admin	payments	delete	payments_d6ntve	{"deleted_at": "2025-07-26T16:48:25.360Z"}	10.0.120.179	2025-07-26 16:48:25.36
5bcf4f32-ed56-4a19-beff-c9b98dfd649a	user_19	admin	payments	logout	payments_fhv4ik	\N	10.0.23.122	2025-07-28 05:46:37.261
69b6e545-2dea-4f74-a99f-4370eb8ca361	user_5	parent	integrations	delete	integrations_it0uk	{"deleted_at": "2025-08-01T23:44:37.706Z"}	10.0.166.153	2025-08-01 23:44:37.706
144cdbfe-91bb-46a0-bc12-23e9a4ade566	user_3	parent	integrations	delete	integrations_oya28c	{"deleted_at": "2025-07-31T18:07:58.113Z"}	10.0.182.229	2025-07-31 18:07:58.113
b7406b35-61b7-431f-852e-12ed3b304841	user_10	parent	settings	export	settings_a7m2rd	{"format": "csv", "records": 963}	10.0.248.167	2025-08-04 00:08:53.459
acaadab5-3a27-4e50-84dd-7d40ed1babf9	user_10	admin	tenants	create	tenants_c3ilr	{"status": "active", "created_at": "2025-08-09T15:21:22.395Z"}	10.0.197.79	2025-08-09 15:21:22.395
3c93dcf0-194e-4dc1-a498-ce5f8a81d277	user_8	admin	settings	logout	settings_ni7fcj	\N	10.0.94.41	2025-07-29 16:32:57.006
97854609-0d38-4114-8c3c-5ef953d51a4e	user_18	admin	integrations	export	integrations_yk3mya	{"format": "csv", "records": 372}	10.0.34.24	2025-08-23 04:37:45.69
5aa7c520-4801-43d1-b7c7-f28f69e54593	user_9	super_admin	tenants	delete	tenants_6ndjc	{"deleted_at": "2025-07-31T19:24:23.911Z"}	10.0.133.42	2025-07-31 19:24:23.911
7aab12b0-f2bc-4191-87ba-6675a88c8ed4	user_8	parent	settings	login	settings_rol2g9	\N	10.0.160.210	2025-08-10 22:28:05.08
58d3bdfb-a93d-4ffc-ab40-6a8993863c5b	user_5	super_admin	tenants	create	tenants_x119n	{"status": "active", "created_at": "2025-08-17T14:27:31.211Z"}	10.0.101.165	2025-08-17 14:27:31.211
66c08a73-7ee2-4f5c-b974-aa671ed69cfd	user_3	parent	settings	login	settings_45k0d	\N	10.0.118.91	2025-08-17 22:07:08.402
6a2ae642-a970-415c-bbc5-c76f980a7fc1	user_7	parent	tenants	export	tenants_vdgc0d	{"format": "csv", "records": 40}	10.0.92.173	2025-08-15 15:36:30.871
eb015a3f-d95c-4c5a-a080-f020806ffd86	user_6	admin	payments	logout	payments_rau8i	\N	10.0.39.81	2025-08-04 01:02:56.508
f05e8d6c-9ff1-4a38-ae61-4e26973bf984	user_14	parent	integrations	login	integrations_z3z8up	\N	10.0.140.71	2025-08-07 13:34:15.009
e15b2cd7-4845-4837-9b22-e350f631fdfc	user_5	parent	users	export	users_p9nv9f	{"format": "csv", "records": 169}	10.0.240.9	2025-08-22 07:04:51.676
ecd92aae-4419-4284-ac39-4a9f7e506c95	user_15	super_admin	settings	import	settings_73lezq	{"rows": 60, "success": true}	10.0.252.25	2025-08-02 12:24:34.669
aa389b39-bf54-4c97-9590-00b93952fc04	user_14	parent	integrations	logout	integrations_fhy9gh	\N	10.0.121.146	2025-08-18 13:10:24.143
9fc99939-16ff-482b-aa49-b6e12746ac7d	user_8	super_admin	payments	login	payments_c0kmgl	\N	10.0.46.130	2025-08-23 08:25:55.055
44b0fb91-98ac-4f6b-9b1d-215df5ae1069	user_1	admin	payments	logout	payments_znztq	\N	10.0.87.161	2025-07-28 11:34:12.538
9ad35779-7854-4273-a625-61fea80d71db	user_2	super_admin	integrations	delete	integrations_sc0ep	{"deleted_at": "2025-08-20T03:42:24.786Z"}	10.0.63.117	2025-08-20 03:42:24.786
db996c43-b776-4e32-9862-f929f2b44f49	user_1	parent	tenants	login	tenants_svqbde	\N	10.0.86.139	2025-08-01 04:07:25.972
13404a7b-4602-4939-8d63-795bc80b7913	user_15	super_admin	integrations	create	integrations_uites	{"status": "active", "created_at": "2025-08-16T22:06:20.603Z"}	10.0.58.121	2025-08-16 22:06:20.603
11388da3-8e33-45d9-896a-98e6ac44e622	user_5	parent	payments	create	payments_f4vx9l	{"status": "active", "created_at": "2025-08-03T09:11:14.889Z"}	10.0.216.232	2025-08-03 09:11:14.889
715ae36d-80d1-4938-9bc6-f239edd4eb1b	user_6	admin	sessions	logout	sessions_fsj0gn	\N	10.0.218.241	2025-07-29 18:18:03.302
4c3004cf-567b-472e-9075-b621c8b6bc0a	user_10	parent	settings	login	settings_pov88b	\N	10.0.144.43	2025-08-17 21:16:50.751
d47c1f77-85b5-4f4f-9448-569fef38dca7	user_19	admin	settings	import	settings_w9w7ig	{"rows": 63, "success": true}	10.0.107.253	2025-08-13 22:17:56.379
6d701dce-15bf-4682-8715-6b27b14faba6	user_20	parent	payments	import	payments_gcd7hm	{"rows": 61, "success": true}	10.0.3.98	2025-08-17 03:02:43.382
2450232a-bf9a-4575-83e0-a7415496579b	user_14	admin	integrations	delete	integrations_xjvjki	{"deleted_at": "2025-07-28T10:43:43.747Z"}	10.0.15.85	2025-07-28 10:43:43.747
584bc4e5-8ca4-4ee0-aea5-ce84174f3d6f	user_5	super_admin	users	logout	users_s06lvc	\N	10.0.207.8	2025-08-14 18:24:01.281
a998445c-608b-4ba3-b247-da634afc7340	user_20	admin	sessions	update	sessions_rbn6mw	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-09T19:17:02.584Z"}	10.0.143.95	2025-08-09 19:17:02.584
a7fa45cb-42da-46b1-a77d-518a6c4fc0eb	user_8	super_admin	sessions	import	sessions_qjj6dk	{"rows": 26, "success": true}	10.0.219.179	2025-08-20 00:12:45.132
908f46e7-67cd-4c8e-99fd-030e9d5c749b	user_7	super_admin	tenants	login	tenants_8ebsej	\N	10.0.205.46	2025-08-14 23:31:28.926
bdd25b4d-b105-49a4-9b53-1ccd3983581a	user_9	super_admin	sessions	import	sessions_bk45g8	{"rows": 97, "success": true}	10.0.214.72	2025-08-17 16:17:03.262
1a556eda-8905-4563-8612-1dcb63e03e79	user_12	parent	settings	create	settings_v9jf5	{"status": "active", "created_at": "2025-08-14T10:17:18.062Z"}	10.0.205.64	2025-08-14 10:17:18.062
60261bf4-47be-4e19-bafc-3466afbe6559	user_1	parent	sessions	logout	sessions_ezjqe	\N	10.0.225.237	2025-08-21 00:48:04.216
90305214-9c2e-4427-9215-2cbded06ea68	user_18	super_admin	settings	login	settings_hgky6o	\N	10.0.132.198	2025-08-14 08:38:22.49
1c48dfe0-dd97-4808-aab8-c9c345ee1bd2	user_3	super_admin	users	create	users_7qz8ma	{"status": "active", "created_at": "2025-08-19T14:01:51.697Z"}	10.0.25.192	2025-08-19 14:01:51.697
b0aee6a4-1ac1-495b-bd1d-6479ab6eb0a8	user_11	parent	integrations	logout	integrations_n6piy4	\N	10.0.84.10	2025-08-13 08:39:33.597
40bef405-b446-4ad3-bff7-21e9246a69b6	user_6	parent	sessions	delete	sessions_k21oo6	{"deleted_at": "2025-08-20T01:14:31.611Z"}	10.0.118.212	2025-08-20 01:14:31.611
df9b902d-d391-40bb-84e2-99956d86fc55	user_11	admin	integrations	delete	integrations_q4nfxs	{"deleted_at": "2025-08-22T11:10:30.857Z"}	10.0.97.172	2025-08-22 11:10:30.857
21926af0-289d-40d1-9cf4-d7aca090a055	user_17	parent	sessions	logout	sessions_17htrq	\N	10.0.22.34	2025-08-13 04:24:06.408
89eb9843-1114-49db-b4a1-992667ba6303	user_1	parent	settings	export	settings_6cqyir	{"format": "csv", "records": 406}	10.0.130.159	2025-08-13 07:36:07.476
41a4f1c2-cc6b-44fa-bedf-49a9987c9606	user_11	parent	tenants	update	tenants_hjq8c9	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-07-29T10:49:32.989Z"}	10.0.29.0	2025-07-29 10:49:32.989
277d1a56-b3ac-4405-ab33-3c2cccf49305	user_15	admin	payments	delete	payments_wm6yt	{"deleted_at": "2025-08-14T05:09:12.862Z"}	10.0.194.242	2025-08-14 05:09:12.862
57b5d786-4ab3-4d55-822c-1b3d804a91d8	user_20	admin	users	login	users_302cft	\N	10.0.223.63	2025-07-29 04:43:24.402
ce2dabb6-fb57-4ad1-8521-e4b2408d6b83	user_9	super_admin	settings	login	settings_wbkvad	\N	10.0.146.231	2025-08-05 04:13:20.378
d1bcba73-ce54-4b5e-aa56-4f573ef26cb8	user_8	super_admin	integrations	delete	integrations_5fvq8s	{"deleted_at": "2025-08-08T15:16:36.722Z"}	10.0.254.254	2025-08-08 15:16:36.722
aaba08d6-68e0-4d4d-942f-5dc2b5fdbd3e	user_12	parent	settings	update	settings_w5vk6	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-14T09:59:43.010Z"}	10.0.213.212	2025-08-14 09:59:43.01
d2a44ac4-2fee-48f2-837b-74a149ca63c3	user_19	super_admin	settings	update	settings_vjygci	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-09T12:50:47.729Z"}	10.0.102.241	2025-08-09 12:50:47.729
a28b4978-0628-4eee-bacc-4292a88ff0de	user_6	super_admin	sessions	login	sessions_xd19bl	\N	10.0.184.237	2025-08-01 18:13:01.4
fe89f9e2-75b7-43c4-90fd-d7af977910fc	user_16	admin	sessions	export	sessions_w501zt	{"format": "csv", "records": 575}	10.0.151.95	2025-08-21 16:58:26.772
d0034b06-6ccc-4134-830c-5e3ecc4f093d	user_2	parent	integrations	login	integrations_f0vb8c	\N	10.0.200.39	2025-08-23 15:35:33.56
237de700-a8a3-4076-8a6c-fbf0c478a9a8	user_2	parent	users	login	users_pmg24l	\N	10.0.230.24	2025-08-12 21:33:14.498
3b872ccd-e243-422b-9ee2-2923adf0980d	user_9	admin	users	update	users_f5bi53	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-11T14:24:21.267Z"}	10.0.25.231	2025-08-11 14:24:21.267
f56b06de-29e3-48d5-a1f4-1d6b222df36e	user_7	super_admin	integrations	logout	integrations_ayewaw	\N	10.0.175.24	2025-08-02 04:15:30.159
0d56a96c-ac27-4664-8045-4235d8d4d59a	user_17	admin	settings	delete	settings_j5spwo	{"deleted_at": "2025-08-03T04:36:43.174Z"}	10.0.51.212	2025-08-03 04:36:43.174
c2c438dc-7ebf-4697-b8bf-acc412f8b7b4	user_11	parent	tenants	create	tenants_azh1ij	{"status": "active", "created_at": "2025-08-04T15:24:37.130Z"}	10.0.9.99	2025-08-04 15:24:37.13
b7633350-366b-4086-b1fd-bedee879ea1d	user_2	parent	payments	login	payments_ec06ei	\N	10.0.122.23	2025-07-25 03:18:34.836
1517e2f7-a25b-46df-b57a-c5db3244d750	user_15	parent	users	export	users_olk8k	{"format": "csv", "records": 873}	10.0.212.6	2025-07-31 17:52:34.943
c8699b6e-6554-4e8a-8c40-a20d1ba0fc0e	user_5	parent	sessions	export	sessions_8tvg4k	{"format": "csv", "records": 256}	10.0.142.229	2025-08-20 02:39:34.758
c012e6ae-345f-4a27-b71a-b9da874ebcba	user_12	super_admin	sessions	export	sessions_qnyumg	{"format": "csv", "records": 727}	10.0.66.160	2025-08-15 18:23:43.87
798d7c80-1c41-4f34-8cf4-8a7457a47737	user_1	super_admin	tenants	logout	tenants_y3wr6	\N	10.0.239.50	2025-08-09 04:32:01.956
a1eb4aec-bbc5-4c33-a8aa-51487d26555b	user_15	super_admin	integrations	import	integrations_p9dbe	{"rows": 22, "success": true}	10.0.231.31	2025-08-11 20:32:23.562
d8503420-3df2-4fa7-af98-d91d33e32b6b	user_9	parent	settings	import	settings_4cdqp	{"rows": 92, "success": true}	10.0.177.215	2025-07-30 13:00:55.818
4a8239b6-7ef0-4c7f-a6fa-29f7b5daff21	user_17	parent	tenants	delete	tenants_qc5vsf	{"deleted_at": "2025-07-28T13:38:23.462Z"}	10.0.1.118	2025-07-28 13:38:23.462
46a2b715-0c8b-4653-8042-3097f283fe4e	user_14	super_admin	sessions	update	sessions_af98q9	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-04T09:56:46.627Z"}	10.0.152.6	2025-08-04 09:56:46.627
1f1e196b-5507-4bcc-87ed-451826f0377a	user_17	super_admin	tenants	export	tenants_lquzef	{"format": "csv", "records": 60}	10.0.98.142	2025-07-29 20:41:38.765
a8c45499-4c64-4620-9101-cd11cc6f8bc1	user_14	parent	users	delete	users_od03fh	{"deleted_at": "2025-08-19T06:23:23.616Z"}	10.0.250.131	2025-08-19 06:23:23.616
5a92cc44-eecf-44ce-8ed9-5607b883062a	user_19	parent	settings	import	settings_p2vzuo	{"rows": 19, "success": true}	10.0.171.219	2025-08-01 09:11:48.792
5821046b-0aff-4043-8afb-6a36409e60e6	user_9	parent	tenants	import	tenants_jgopg6	{"rows": 76, "success": true}	10.0.95.149	2025-07-31 06:57:51.415
f2184699-8adf-4e0e-b751-1832e763b250	user_13	admin	tenants	import	tenants_cjpgdl	{"rows": 22, "success": true}	10.0.159.243	2025-08-04 14:48:14.405
7c723da6-d856-419f-94e5-82f865293a71	user_20	admin	sessions	login	sessions_nnrjrog	\N	10.0.164.44	2025-08-07 22:39:33.9
d55b220d-b8c8-41b7-8a01-1dd6d71a70e5	user_5	admin	users	logout	users_ewtwvn	\N	10.0.233.161	2025-08-09 16:50:12.241
02bf95fa-4dd6-44a5-8e0c-928be71da4b0	user_15	parent	payments	update	payments_3yife	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-07-26T00:00:04.355Z"}	10.0.86.197	2025-07-26 00:00:04.355
89091d5b-2ea7-4e97-b130-478c05cc059f	user_7	admin	sessions	import	sessions_tr4p94	{"rows": 42, "success": true}	10.0.32.254	2025-08-16 01:48:34.27
c31054f1-d9c7-4644-8d08-1f1361fbb9c4	user_8	super_admin	sessions	update	sessions_k3jxdn	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-15T04:44:31.392Z"}	10.0.182.224	2025-08-15 04:44:31.392
37233ec3-3aca-4d26-9675-edaa95653476	user_13	admin	payments	logout	payments_awe5e5	\N	10.0.79.38	2025-08-16 15:45:24.111
3d29a3ac-7aae-478e-bff4-cea414bb2c29	user_1	parent	settings	import	settings_5bqxee	{"rows": 30, "success": true}	10.0.123.180	2025-08-20 02:25:59.538
eaaab7e2-ac17-4f5e-94cb-c89a37831f04	user_20	admin	tenants	login	tenants_u9dpmg	\N	10.0.54.27	2025-08-13 23:21:50.434
4ba95f2f-7da3-40b7-bb5f-656c4671d689	user_10	parent	tenants	import	tenants_rj4tf	{"rows": 31, "success": true}	10.0.103.33	2025-08-10 09:52:13.434
16980911-970e-461a-be03-d64e498c7c07	user_10	super_admin	payments	import	payments_rphz2	{"rows": 35, "success": true}	10.0.37.214	2025-08-19 21:57:41.092
67b0c650-2af0-45f1-8ca8-16698920bb4d	user_16	super_admin	payments	update	payments_1qbo7	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-05T20:52:27.340Z"}	10.0.41.146	2025-08-05 20:52:27.34
fc32eb42-87ac-439d-a5f1-7b5bc1e05011	user_16	admin	users	logout	users_12spia	\N	10.0.156.17	2025-08-23 14:41:40.608
c40923ec-61f3-45ba-9d1e-4de969637b08	user_5	parent	tenants	delete	tenants_5g1yd	{"deleted_at": "2025-08-10T17:53:37.055Z"}	10.0.114.47	2025-08-10 17:53:37.055
ad484b09-1684-4663-8f8f-7c5863b674ca	user_3	super_admin	users	login	users_8br1yk	\N	10.0.39.1	2025-07-29 15:02:32.879
ee653e6b-559b-4c19-910e-b092e7bdb4fc	user_3	parent	payments	logout	payments_0agwie	\N	10.0.78.249	2025-07-27 23:03:09.208
0f81d3f5-e309-4fe1-bd40-ada04213af56	user_12	admin	integrations	logout	integrations_4ns8pm	\N	10.0.192.215	2025-08-08 18:55:27.819
444c86aa-80d8-4709-b737-89563266786c	user_1	parent	tenants	delete	tenants_u5gzj9	{"deleted_at": "2025-08-18T08:33:38.552Z"}	10.0.115.79	2025-08-18 08:33:38.552
8d5f167b-1c6b-40d1-b1e7-b1e35baa214b	user_13	parent	integrations	import	integrations_6w2d6s	{"rows": 12, "success": true}	10.0.104.82	2025-07-30 15:24:27.134
be228ac6-80a0-426e-a5f8-54a52a9d81f7	user_16	super_admin	settings	import	settings_uqtu16	{"rows": 67, "success": true}	10.0.104.98	2025-08-07 01:39:47.301
1c093aa7-919e-4909-b2b8-7ae11cf5baa4	user_4	parent	tenants	export	tenants_z9v7cn	{"format": "csv", "records": 719}	10.0.237.224	2025-08-17 01:09:37.176
af3ee9a0-8b8d-4811-b37c-c7398ca309ed	user_14	super_admin	tenants	logout	tenants_eqq8af	\N	10.0.239.16	2025-08-07 10:21:12.017
634cfe09-507c-425d-b20c-212376f77ac6	user_16	super_admin	tenants	create	tenants_ywvh1b	{"status": "active", "created_at": "2025-08-21T14:24:22.184Z"}	10.0.148.230	2025-08-21 14:24:22.184
b19a3415-32db-478a-b8db-912df9d89b52	user_3	super_admin	integrations	create	integrations_i2tuck	{"status": "active", "created_at": "2025-08-19T17:33:10.131Z"}	10.0.97.159	2025-08-19 17:33:10.131
ec43db1c-63f9-4570-bee9-07365ddb5272	user_13	parent	integrations	login	integrations_0kauvf	\N	10.0.95.30	2025-07-28 00:22:41.783
7b4f5239-8d30-42b8-b4b4-dad37ebed6fe	user_9	super_admin	settings	logout	settings_ese24	\N	10.0.43.49	2025-07-28 11:25:03.052
326f5868-bb9c-4d26-ae11-22f52fb5f4a5	user_16	super_admin	settings	update	settings_0agsnw	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-20T02:47:19.704Z"}	10.0.249.211	2025-08-20 02:47:19.704
d53ae914-92ad-432e-9cb4-363230ee82c1	user_18	parent	tenants	logout	tenants_kijeu	\N	10.0.57.199	2025-08-19 03:27:16.377
049646bd-87b8-48cd-8cf8-80a4799d24f5	user_15	super_admin	sessions	import	sessions_l4ax5	{"rows": 27, "success": true}	10.0.219.143	2025-08-02 14:01:13.196
0e9d0c59-3042-4750-a222-4909c1ad2296	user_20	parent	payments	update	payments_mu8zj8	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-07-29T09:51:44.088Z"}	10.0.42.216	2025-07-29 09:51:44.088
e2678f60-991f-43c6-988c-81e03d21e126	user_8	admin	tenants	import	tenants_yqovpe	{"rows": 87, "success": true}	10.0.124.88	2025-08-12 20:52:07.964
4c96d5e6-8529-4f1d-859f-1033e6e44054	user_18	admin	sessions	delete	sessions_bn65xk	{"deleted_at": "2025-08-22T20:01:08.156Z"}	10.0.3.38	2025-08-22 20:01:08.156
a4265bed-e79a-46bb-b0cf-bbec19ffd82f	user_11	super_admin	payments	create	payments_y17wk1	{"status": "active", "created_at": "2025-08-10T01:38:10.754Z"}	10.0.53.93	2025-08-10 01:38:10.754
b544e909-9fb6-4364-be6c-003ac9a54968	user_19	parent	tenants	create	tenants_laghw	{"status": "active", "created_at": "2025-08-18T06:17:54.757Z"}	10.0.196.245	2025-08-18 06:17:54.757
fbcf9853-9350-437b-9b9e-31eabbd10485	user_18	parent	tenants	export	tenants_5x308p	{"format": "csv", "records": 832}	10.0.244.95	2025-08-04 10:29:35.896
cb2ed75b-995c-491e-8213-3a8b4105534e	user_13	parent	integrations	logout	integrations_fo0r2f	\N	10.0.41.182	2025-08-02 08:06:15.128
b9d89d8b-6c58-4d51-80c4-7af0e31f93dd	user_13	admin	settings	login	settings_xpctn4	\N	10.0.133.222	2025-08-21 02:24:40.588
425d9f36-6348-46c6-9969-de8c9d6153ef	user_11	super_admin	settings	create	settings_s9fgq	{"status": "active", "created_at": "2025-08-20T09:36:42.270Z"}	10.0.192.9	2025-08-20 09:36:42.27
a6d453fc-2a52-426b-beb9-838a8bbbfed6	user_6	admin	tenants	export	tenants_jeq35h	{"format": "csv", "records": 792}	10.0.88.156	2025-08-19 09:34:39.786
9a56c74e-b041-4810-a6e4-dfb7a336c6ec	user_8	admin	users	logout	users_37v1gc	\N	10.0.164.52	2025-08-18 09:36:29.257
507550ec-fcbb-41d2-9cda-e4c2f88a8460	user_10	super_admin	payments	logout	payments_0vdnr	\N	10.0.69.201	2025-08-05 18:48:51.681
0d80ee11-4867-4568-bbf3-9d200dc42772	user_16	super_admin	sessions	login	sessions_vokzu	\N	10.0.74.57	2025-08-05 14:09:06.384
32d6f512-ed68-4eba-ba2a-152212af03cc	user_6	parent	users	export	users_eoplsp	{"format": "csv", "records": 847}	10.0.174.63	2025-08-14 02:19:26.728
08bec291-7ea2-4669-9827-00cceaa9d65a	user_8	parent	payments	export	payments_4avn99	{"format": "csv", "records": 171}	10.0.186.133	2025-08-22 09:32:24.919
373ba3bc-78a9-4302-bbd2-7b9ad8898f9c	user_15	parent	payments	update	payments_h9cbsm	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-20T10:00:31.701Z"}	10.0.98.72	2025-08-20 10:00:31.701
b53f4ee4-4f9f-4f11-acf5-58667c193321	user_1	super_admin	sessions	update	sessions_gg054a	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-05T15:06:15.977Z"}	10.0.91.76	2025-08-05 15:06:15.977
68919e15-92eb-4fd5-a68c-70c64a687861	user_16	super_admin	tenants	login	tenants_hgt7b	\N	10.0.132.94	2025-08-16 11:52:01.668
d43d4ca1-d54e-4f63-975c-7f56be86fa7e	user_4	super_admin	tenants	delete	tenants_ucldy	{"deleted_at": "2025-08-14T21:15:53.067Z"}	10.0.70.144	2025-08-14 21:15:53.067
ce47b76c-b914-4963-bb4c-baea4dde1d31	user_2	parent	sessions	update	sessions_vcsfm8	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-06T17:02:22.534Z"}	10.0.222.122	2025-08-06 17:02:22.534
0b2f051f-c93b-4190-bd23-fc0d4c561f0f	user_6	parent	integrations	login	integrations_pj8gy	\N	10.0.85.121	2025-07-25 21:41:11.014
12d0902a-0564-4640-a3ad-187f5485e69c	user_3	super_admin	integrations	update	integrations_fzv0e	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-09T22:45:31.225Z"}	10.0.249.154	2025-08-09 22:45:31.225
82edac97-0b3b-4b11-b5fa-c14037745ebc	user_20	super_admin	tenants	create	tenants_9ilh	{"status": "active", "created_at": "2025-08-18T12:45:53.496Z"}	10.0.148.130	2025-08-18 12:45:53.496
b9c6c68b-a818-4cc2-8313-57c1d13c32a9	user_17	admin	tenants	create	tenants_gxk2qj	{"status": "active", "created_at": "2025-08-17T09:43:18.994Z"}	10.0.78.29	2025-08-17 09:43:18.994
455f36ec-3395-4a0f-b489-d06f02e457ee	user_14	super_admin	users	logout	users_qvrbfb	\N	10.0.209.8	2025-08-16 03:46:13.08
4055ffaa-7506-434e-a362-8baa17861861	user_4	super_admin	payments	logout	payments_39tglj	\N	10.0.36.59	2025-08-12 22:19:54.002
bab793f8-d03f-4bd9-b0b3-533925e3f8b4	user_1	parent	integrations	create	integrations_yakol	{"status": "active", "created_at": "2025-08-10T07:58:12.678Z"}	10.0.104.72	2025-08-10 07:58:12.678
e177954b-7e65-414c-b027-7c797a967ef9	user_8	parent	sessions	update	sessions_buu4w	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-12T15:39:51.088Z"}	10.0.17.32	2025-08-12 15:39:51.088
5a1898aa-cdc1-43f2-a63f-346d4df0a60b	user_12	super_admin	tenants	update	tenants_p1kvgb	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-16T04:43:56.744Z"}	10.0.87.132	2025-08-16 04:43:56.744
9e8ae4c9-2451-4c06-a2d1-78a9937598ee	user_5	super_admin	sessions	logout	sessions_2g8zj6	\N	10.0.222.248	2025-08-14 08:23:18.648
15b006e8-d601-456f-b3e3-3609e22b9b93	user_11	parent	settings	import	settings_zfcppd	{"rows": 67, "success": true}	10.0.177.130	2025-08-01 12:05:52.098
8527aa5c-a75f-4f53-8550-77a3b155c6e5	user_16	super_admin	integrations	delete	integrations_2q6h2	{"deleted_at": "2025-08-15T14:49:18.963Z"}	10.0.62.104	2025-08-15 14:49:18.963
8709521d-3396-485d-9994-aa72c00a6a45	user_4	super_admin	settings	create	settings_w08jfb	{"status": "active", "created_at": "2025-08-03T12:23:51.431Z"}	10.0.181.145	2025-08-03 12:23:51.431
6732269d-c3f8-4dde-ba65-9ab59bca3ee7	user_11	admin	tenants	logout	tenants_jdv1f	\N	10.0.189.103	2025-07-31 10:23:58.7
c82962c2-2331-4b16-a95c-bb337062fd2a	user_19	admin	settings	update	settings_m6celf	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-21T14:11:18.013Z"}	10.0.58.195	2025-08-21 14:11:18.013
03597837-9e6b-43a5-a0bb-83f04c32838c	user_16	super_admin	sessions	login	sessions_jwlhrg	\N	10.0.61.241	2025-07-27 02:03:13.678
ac0f5022-9871-4aee-b591-76f4dabbfcd4	user_4	admin	sessions	create	sessions_6nvgc9	{"status": "active", "created_at": "2025-08-04T15:57:38.827Z"}	10.0.64.62	2025-08-04 15:57:38.827
9b757ed4-b99f-4009-853d-05e94b51399d	user_13	parent	sessions	delete	sessions_e2o7h8	{"deleted_at": "2025-08-15T00:56:19.833Z"}	10.0.93.198	2025-08-15 00:56:19.833
2601a48d-b43a-4d57-99a2-2ef654b0a59d	user_7	admin	tenants	create	tenants_jsvufb	{"status": "active", "created_at": "2025-08-06T04:57:14.576Z"}	10.0.227.163	2025-08-06 04:57:14.576
5230815e-a5ed-49a1-b10a-e3086089ae29	user_12	parent	settings	logout	settings_2d9m8	\N	10.0.238.165	2025-07-27 16:18:09.935
332b910e-5dab-4ebc-92b8-2153a2836247	user_2	super_admin	users	create	users_wkz7hh	{"status": "active", "created_at": "2025-07-27T01:40:45.688Z"}	10.0.154.67	2025-07-27 01:40:45.688
b747e85f-0d08-44ee-8f6c-c1b222ae9680	user_6	super_admin	users	export	users_w5y1ca	{"format": "csv", "records": 266}	10.0.203.237	2025-08-09 03:14:29.785
40b54bc9-6fcf-46c3-975e-a393fd77cecf	user_11	super_admin	payments	update	payments_p4kw3	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-07-29T06:28:25.319Z"}	10.0.189.234	2025-07-29 06:28:25.319
77a6873f-5a05-4e3f-9d55-6da7a80746c8	user_18	parent	users	delete	users_flxha	{"deleted_at": "2025-08-12T14:05:22.672Z"}	10.0.111.225	2025-08-12 14:05:22.672
81ce75b2-5a88-49d0-9e54-17f4cd30c30d	user_8	admin	payments	update	payments_o3sok	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-03T20:53:33.708Z"}	10.0.203.97	2025-08-03 20:53:33.708
b8ef370a-1f34-48bf-b3d8-89ab9e940c4e	user_6	parent	payments	login	payments_d0rjz	\N	10.0.242.62	2025-07-30 20:18:33.138
e20608cb-f7b3-46ac-8efc-0264b9df6df9	user_3	admin	settings	export	settings_v2h5mj	{"format": "csv", "records": 869}	10.0.205.112	2025-08-19 03:04:25.118
e8009a0c-839c-4893-84b2-cc4993ce3d5a	user_14	super_admin	users	logout	users_30c7qp	\N	10.0.147.43	2025-08-15 13:35:07.797
8b26965e-0277-4b9a-831d-90a6055706a2	user_11	admin	payments	logout	payments_pt6bkx	\N	10.0.181.33	2025-07-26 21:44:28.997
a1f449bd-b45a-4400-abde-a8bb6e91e237	user_17	parent	payments	import	payments_udg2ll	{"rows": 98, "success": true}	10.0.42.96	2025-08-12 23:46:39.793
5eec9746-8f0f-4ec4-a33c-a3bc096284d5	user_18	admin	tenants	import	tenants_3fedv9	{"rows": 92, "success": false}	10.0.246.67	2025-08-05 04:19:13.117
557abc17-0845-4a4c-8df6-bfb4349f9388	user_1	admin	integrations	create	integrations_y4tty9	{"status": "active", "created_at": "2025-07-29T17:01:18.576Z"}	10.0.60.178	2025-07-29 17:01:18.576
5050f8e0-0c45-4373-9e48-7dcf4dffd2ac	user_15	super_admin	integrations	login	integrations_2ozqen	\N	10.0.226.18	2025-08-18 18:13:27.044
b815e7a3-5f5c-43ec-886a-d0138345dea3	user_15	super_admin	tenants	logout	tenants_rjxxy	\N	10.0.10.4	2025-07-28 08:15:31.445
ee9b5f4d-c8eb-425f-868b-603dd3df1704	user_11	admin	sessions	import	sessions_apfjs3	{"rows": 59, "success": true}	10.0.113.244	2025-08-18 21:24:21.164
0de13873-032d-4fdc-941a-a6fd23808e13	user_14	super_admin	settings	login	settings_jtq23	\N	10.0.174.29	2025-08-01 17:47:15.191
59675668-aff7-4945-bd3d-a4df41e02e3b	user_12	admin	payments	import	payments_yee4fs	{"rows": 42, "success": true}	10.0.242.64	2025-08-20 12:44:05.997
bd077d76-4882-4694-8aa8-56ad44d994a8	user_4	parent	settings	create	settings_bk5u6v	{"status": "active", "created_at": "2025-08-13T02:52:17.309Z"}	10.0.31.151	2025-08-13 02:52:17.309
4ee69212-a116-44cb-98e6-acd2c7c75033	user_16	parent	tenants	create	tenants_19p16c	{"status": "active", "created_at": "2025-08-18T01:55:49.505Z"}	10.0.212.12	2025-08-18 01:55:49.505
861e3855-a1af-42a4-a1f1-5a16295bdb91	user_4	parent	tenants	delete	tenants_c25r7h	{"deleted_at": "2025-07-31T17:37:08.449Z"}	10.0.219.204	2025-07-31 17:37:08.449
ae2c55c5-0a2e-487b-8ae3-43c3d3db9868	user_2	admin	users	delete	users_emsglr	{"deleted_at": "2025-08-18T02:52:41.867Z"}	10.0.13.247	2025-08-18 02:52:41.867
8c8d5fce-9c75-4f8b-8236-45142ad28283	user_14	parent	users	export	users_ku01tf	{"format": "csv", "records": 198}	10.0.102.154	2025-08-10 11:52:49.324
ae1b44b0-0834-438d-aca2-b2b35882fe62	user_13	parent	users	update	users_pw6cuk	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-18T07:30:47.144Z"}	10.0.234.112	2025-08-18 07:30:47.144
670f2854-7f1c-4a36-adbd-569d3f4f8744	user_4	admin	sessions	logout	sessions_3ikqcr	\N	10.0.55.122	2025-08-08 14:06:33.485
74d2871a-31c1-4ccd-b01f-7d95dc7a74a2	user_13	super_admin	settings	delete	settings_1iyfbf	{"deleted_at": "2025-08-02T08:37:59.195Z"}	10.0.224.146	2025-08-02 08:37:59.195
43596205-fbfa-48d3-862f-d4d38fbb2679	user_12	parent	sessions	login	sessions_ba27sq	\N	10.0.236.75	2025-08-07 00:02:28.835
d2908503-1d6d-41be-9dd0-114ca013308b	user_16	parent	settings	login	settings_usu9xi	\N	10.0.166.137	2025-08-09 15:10:49.678
92e21d19-7f6b-4481-a67f-d459924fd1a5	user_13	parent	settings	create	settings_wl91i	{"status": "active", "created_at": "2025-08-10T22:52:17.494Z"}	10.0.79.129	2025-08-10 22:52:17.494
6e67a768-b0a3-4657-a6d7-5b3183b33847	user_15	admin	integrations	export	integrations_76ebw	{"format": "csv", "records": 771}	10.0.19.238	2025-08-19 01:31:55.955
093f1bf3-e8de-4bf0-9e8a-593013eea4b8	user_16	admin	integrations	login	integrations_d9uzhh	\N	10.0.90.122	2025-08-16 15:43:16.7
9843272b-d417-4578-8c5c-64def1437745	user_16	super_admin	settings	create	settings_k6sp2f	{"status": "active", "created_at": "2025-08-18T10:50:20.756Z"}	10.0.244.204	2025-08-18 10:50:20.756
9b37950a-5a8d-4acd-94b9-776005156e1c	user_5	super_admin	tenants	import	tenants_zpi0s6	{"rows": 66, "success": true}	10.0.166.31	2025-08-01 03:27:06.134
93d25aa1-aaed-482c-af5f-391d0b8ee777	user_11	super_admin	tenants	create	tenants_zdh22e	{"status": "active", "created_at": "2025-07-28T11:57:32.251Z"}	10.0.87.162	2025-07-28 11:57:32.251
0fc72236-3767-435a-8af0-e843d680a53d	user_16	admin	tenants	logout	tenants_ys546l	\N	10.0.162.245	2025-08-17 01:15:34.179
010a3764-57bc-46c4-b902-bca266d5a171	user_18	parent	payments	login	payments_slp1v	\N	10.0.233.45	2025-08-14 01:22:11.726
2278bf2b-f547-4953-94a7-7208ab8b95e6	user_20	super_admin	payments	create	payments_nyspe	{"status": "active", "created_at": "2025-08-10T00:52:07.956Z"}	10.0.6.127	2025-08-10 00:52:07.956
da7af468-83a5-4236-ac96-4f8eee28ba5b	user_6	super_admin	tenants	export	tenants_260n1bm	{"format": "csv", "records": 217}	10.0.128.245	2025-08-23 12:42:21.991
9235a414-78f9-4b94-bdb9-b2cdbf562399	user_20	super_admin	payments	create	payments_p5xm3r	{"status": "active", "created_at": "2025-07-27T18:05:57.117Z"}	10.0.83.42	2025-07-27 18:05:57.117
1962459c-8c59-45b3-aa3e-b3731110e596	user_8	parent	payments	import	payments_nquncg	{"rows": 22, "success": true}	10.0.39.148	2025-08-16 08:48:38.806
94e525b8-6b85-4bcc-83b7-e734514cb594	user_13	super_admin	users	delete	users_f6xuu	{"deleted_at": "2025-08-12T06:00:17.744Z"}	10.0.36.67	2025-08-12 06:00:17.744
fba3bdcf-e53b-46e1-88ac-71ac526063bb	user_5	parent	integrations	logout	integrations_y80tca	\N	10.0.102.99	2025-08-03 00:00:35.808
1dab0677-7ee9-4145-9fc5-076455c26099	user_17	super_admin	payments	create	payments_4qrcuf	{"status": "active", "created_at": "2025-08-22T10:48:31.049Z"}	10.0.194.229	2025-08-22 10:48:31.049
ab3df1fd-324f-4655-8a4b-834c6440e0bd	user_14	admin	users	import	users_cwepvb	{"rows": 90, "success": true}	10.0.86.31	2025-07-25 13:26:46.522
5270fe70-6b5b-465a-b239-9743f31c0c27	user_1	parent	tenants	update	tenants_7zpk5g	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-09T07:23:20.034Z"}	10.0.146.58	2025-08-09 07:23:20.034
afd77ba1-c9bb-4506-89ef-face33d5ea25	user_9	admin	integrations	update	integrations_hv76mg	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-10T05:37:22.269Z"}	10.0.39.247	2025-08-10 05:37:22.269
0ff3d23a-9cb4-410d-a0d2-04c8620a4356	user_11	super_admin	sessions	delete	sessions_gs0b7n	{"deleted_at": "2025-07-26T22:03:16.232Z"}	10.0.243.101	2025-07-26 22:03:16.232
10301f54-f702-4eb1-b4cc-ec87d55de8ac	user_6	admin	payments	logout	payments_zij59	\N	10.0.196.160	2025-08-01 05:40:15.906
67d56ea2-bdd6-4ec5-8b35-9693fa8c5301	user_20	super_admin	users	export	users_3bnq3	{"format": "csv", "records": 402}	10.0.205.151	2025-07-28 02:13:28.665
202b7ac3-458a-4d76-bb54-21ad8b5d4e66	user_18	parent	sessions	create	sessions_x5jtx	{"status": "active", "created_at": "2025-07-28T09:13:54.268Z"}	10.0.7.4	2025-07-28 09:13:54.268
1cb21a66-66be-42e1-bf26-8de2628cdf89	user_10	super_admin	payments	logout	payments_b4ajin	\N	10.0.169.186	2025-08-20 12:57:46.849
52ed3ea8-e604-4d3d-af08-566fe6a80217	user_9	super_admin	sessions	logout	sessions_rjk9bp	\N	10.0.116.116	2025-08-04 05:37:51.542
3dc277be-1d47-4f2f-8036-992b2f4908b1	user_4	super_admin	tenants	update	tenants_yqd2o6	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-18T12:29:39.288Z"}	10.0.197.53	2025-08-18 12:29:39.288
76a4391a-6215-466e-9b1a-0c8adbdf9872	user_20	parent	tenants	create	tenants_zama9	{"status": "active", "created_at": "2025-08-06T20:51:59.148Z"}	10.0.69.95	2025-08-06 20:51:59.148
b6ee5533-f62c-460d-8a0c-6f2d3210de0a	user_1	admin	integrations	import	integrations_hhtub6	{"rows": 84, "success": true}	10.0.208.222	2025-07-28 15:23:48.424
3dd89f86-3d42-45c6-9222-b5928602628e	user_8	admin	settings	import	settings_hjcm3i	{"rows": 47, "success": true}	10.0.215.14	2025-07-31 02:26:01.962
cd274c09-4b97-4e2a-802e-f27c4d6b68d8	user_18	super_admin	settings	login	settings_1svr6r	\N	10.0.72.221	2025-07-26 00:12:18.709
39511268-cceb-4d2b-a49c-72588fff3508	user_10	parent	payments	update	payments_29norn	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-06T04:43:47.200Z"}	10.0.43.44	2025-08-06 04:43:47.2
93866514-b327-4a6b-907e-7e509b29c4eb	user_13	admin	settings	login	settings_q74s2	\N	10.0.184.150	2025-08-06 10:18:02.36
2dec4f3f-3351-4557-b722-5d3195ef6ba0	user_20	super_admin	integrations	export	integrations_314sui	{"format": "csv", "records": 324}	10.0.107.111	2025-08-13 02:48:44.258
b63cc9cc-dafb-40f7-8452-e150690c2a13	user_15	super_admin	sessions	delete	sessions_3z1y4j	{"deleted_at": "2025-08-21T02:00:27.844Z"}	10.0.85.111	2025-08-21 02:00:27.844
367d418d-1026-4f07-80a6-493a3975f659	user_10	parent	payments	export	payments_u3o9uz	{"format": "csv", "records": 86}	10.0.160.214	2025-08-08 19:27:44.06
3297a7c8-9be0-4342-8879-a76b036bb4e3	user_11	admin	sessions	login	sessions_kkujpd	\N	10.0.35.204	2025-08-13 05:30:13.664
758edb14-543d-4c73-94b2-63dba00f7124	user_2	super_admin	users	create	users_p1wj7l	{"status": "active", "created_at": "2025-08-02T19:26:54.963Z"}	10.0.88.91	2025-08-02 19:26:54.963
a9f6c620-6b51-4bfc-9fa7-7e9a04c54709	user_19	super_admin	tenants	update	tenants_hglnsi	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-14T20:46:53.852Z"}	10.0.229.231	2025-08-14 20:46:53.852
ab4e7487-2747-4d68-a670-19f284cc3175	user_5	admin	sessions	create	sessions_88xsgi	{"status": "active", "created_at": "2025-08-07T03:40:37.504Z"}	10.0.193.233	2025-08-07 03:40:37.504
7a57b60f-d6a0-43e7-a207-32da724ce78e	user_12	super_admin	users	delete	users_xdvk0f	{"deleted_at": "2025-08-13T01:18:11.274Z"}	10.0.227.106	2025-08-13 01:18:11.274
ba45fc49-faba-49b4-bd70-8a576d20cdde	user_12	parent	payments	create	payments_wly6c	{"status": "active", "created_at": "2025-08-05T00:10:03.456Z"}	10.0.199.253	2025-08-05 00:10:03.456
8353d242-168d-4463-873a-9756869eb641	user_19	admin	integrations	logout	integrations_1b9eg	\N	10.0.178.175	2025-08-05 18:03:41.947
81706bda-d21f-4088-8ad4-edd8526069bc	user_13	admin	users	logout	users_qcadyk	\N	10.0.18.210	2025-08-14 14:18:10.63
8fa3e76a-a502-4e02-8e25-a203430ddc12	user_12	parent	payments	logout	payments_p1p9fl	\N	10.0.42.183	2025-07-26 00:08:41.771
f7c34baa-0652-4bf2-a95d-aa7c2c498abd	user_1	admin	users	create	users_352cmp	{"status": "active", "created_at": "2025-07-27T19:55:06.220Z"}	10.0.76.197	2025-07-27 19:55:06.22
2e2b9ace-0942-4856-abf7-6400fcde40a1	user_4	super_admin	integrations	update	integrations_ij602f	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-21T06:32:13.114Z"}	10.0.240.254	2025-08-21 06:32:13.114
4834add0-d933-4f39-937c-5249611d29d3	user_10	super_admin	tenants	create	tenants_ug8l57	{"status": "active", "created_at": "2025-08-22T22:58:42.504Z"}	10.0.30.19	2025-08-22 22:58:42.504
62bbdecb-3fc9-4551-947a-ef3937c751df	user_16	parent	users	import	users_63afs	{"rows": 96, "success": true}	10.0.232.39	2025-08-09 14:45:40.072
b42757a7-4fa1-449f-98d6-ae840d51e2bd	user_15	admin	payments	import	payments_0dg2nd	{"rows": 40, "success": true}	10.0.134.40	2025-08-23 09:26:32.223
cb40c9c3-6b44-4c5c-809c-d1cb963567c1	user_14	admin	payments	logout	payments_id9bmt	\N	10.0.65.122	2025-08-21 23:46:31.649
10b433f9-d56a-4812-8f40-3f361959e5a2	user_3	admin	payments	delete	payments_rkrh6e	{"deleted_at": "2025-07-30T23:44:25.784Z"}	10.0.66.26	2025-07-30 23:44:25.784
cb1f4796-20e9-4e0e-96b7-ba7395c50622	user_15	super_admin	tenants	import	tenants_ulw9op	{"rows": 13, "success": true}	10.0.35.252	2025-07-26 13:20:00.798
96b8a1c2-0759-4bec-9bb0-db30c1444e35	user_2	admin	integrations	export	integrations_p8moxs	{"format": "csv", "records": 721}	10.0.103.228	2025-07-31 14:15:18.811
215d9673-a565-4b83-8fb1-eb395a220d1b	user_6	super_admin	integrations	export	integrations_m0z7x4	{"format": "csv", "records": 172}	10.0.72.136	2025-08-06 04:38:14.084
fe5aa63d-931a-4dcc-8289-b15ff701b9f9	user_5	admin	settings	login	settings_x7bwtx4	\N	10.0.206.217	2025-08-10 13:08:09.183
0b040908-7a88-43ed-9ced-8114e238f3a1	user_1	parent	payments	logout	payments_jzbrl	\N	10.0.18.226	2025-08-13 08:31:49.245
236bf00e-884f-4faf-b6f1-82ea8f1f8df6	user_20	super_admin	integrations	import	integrations_tynk8g	{"rows": 52, "success": true}	10.0.250.213	2025-08-07 06:20:27.644
b7f966db-ed35-453b-b9ad-ee37c8ecdb2b	user_17	admin	tenants	delete	tenants_x3tmv1	{"deleted_at": "2025-07-27T02:58:32.646Z"}	10.0.136.63	2025-07-27 02:58:32.646
a0ea182c-2d7e-4970-9881-cccd3f7664ce	user_12	admin	settings	logout	settings_99z60l	\N	10.0.146.105	2025-08-04 12:00:14.286
5a0a9382-91e0-426a-964d-50b5d5ce9fe5	user_8	parent	sessions	delete	sessions_unjtoh	{"deleted_at": "2025-07-26T08:29:03.027Z"}	10.0.120.134	2025-07-26 08:29:03.027
cad05670-66ea-4e7e-81bc-862e3a1e925e	user_9	super_admin	sessions	update	sessions_datwu	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-07-26T12:35:37.800Z"}	10.0.131.27	2025-07-26 12:35:37.8
894d3df5-2988-4891-9d34-668606f201be	user_9	admin	users	delete	users_fkcudgi	{"deleted_at": "2025-07-25T09:38:00.077Z"}	10.0.74.44	2025-07-25 09:38:00.077
da161a85-302f-4de9-bc3d-b604c72dea86	user_4	admin	tenants	export	tenants_nuj50r	{"format": "csv", "records": 27}	10.0.139.209	2025-08-12 22:01:09.061
29c4d4be-8045-46b7-ba64-dc514f05ba8d	user_11	admin	integrations	login	integrations_7q1gg	\N	10.0.19.248	2025-08-15 16:48:20.447
1a9fe76f-9914-469e-ba46-c5a03681efbc	user_1	super_admin	settings	delete	settings_em0n2l	{"deleted_at": "2025-07-31T09:32:26.569Z"}	10.0.199.101	2025-07-31 09:32:26.569
c016f0b3-a4bc-43e7-a148-d1c6c406cd9b	user_20	super_admin	sessions	export	sessions_6ofrpn	{"format": "csv", "records": 613}	10.0.40.205	2025-07-25 05:06:21.766
9b61bda9-0d0b-40e7-bd6a-618ffd07599a	user_19	admin	integrations	login	integrations_4jqy1f	\N	10.0.89.74	2025-08-04 08:50:47.706
9fb9d973-81a4-463f-9efd-e09ecc26c640	user_6	admin	users	delete	users_7vbfhy	{"deleted_at": "2025-08-03T04:59:46.668Z"}	10.0.48.251	2025-08-03 04:59:46.668
556cea1b-9798-4482-9ed1-6efe0bb1de2c	user_14	admin	users	logout	users_lwd5q	\N	10.0.191.73	2025-08-01 16:55:19.574
708cb78b-276c-44ba-b457-4fc8a0442341	user_7	parent	users	import	users_resuzf	{"rows": 0, "success": true}	10.0.60.30	2025-08-09 01:27:32.396
6ff28f89-d4fd-4c6e-9481-c7190461752d	user_15	super_admin	settings	import	settings_6dj76vt	{"rows": 67, "success": true}	10.0.52.20	2025-07-27 22:22:45.808
63712d41-78e0-4042-8261-991bd2c88b28	user_5	parent	users	logout	users_r22so	\N	10.0.165.147	2025-08-18 12:06:24.854
1baa59f1-e09d-4b3d-a2a8-c2c51fadea8a	user_4	parent	users	create	users_q0n76s	{"status": "active", "created_at": "2025-08-03T11:41:29.783Z"}	10.0.85.170	2025-08-03 11:41:29.783
e8275f82-16a7-49fc-9eb4-7f3d53ceb3be	user_3	parent	payments	delete	payments_h85q5	{"deleted_at": "2025-08-04T12:22:04.011Z"}	10.0.11.26	2025-08-04 12:22:04.011
34a6f8bb-9c96-40c7-bb9b-4c5704802c6d	user_12	admin	payments	login	payments_j7v54n	\N	10.0.84.225	2025-08-17 18:36:21.358
8a822a66-7780-484b-91fd-3a6e2d67c2ea	user_19	parent	payments	create	payments_del3e7	{"status": "active", "created_at": "2025-08-08T04:10:46.349Z"}	10.0.13.173	2025-08-08 04:10:46.349
41cbe48b-d656-45b7-8ceb-7dc9853d9d33	user_15	super_admin	sessions	import	sessions_4g8g9j	{"rows": 12, "success": true}	10.0.128.216	2025-08-17 04:33:53.465
7b5f53f6-fa69-4b4b-b74c-2fbee1a2ffdd	user_5	admin	integrations	create	integrations_1tzc4e	{"status": "active", "created_at": "2025-08-11T22:37:55.638Z"}	10.0.181.240	2025-08-11 22:37:55.638
ef2252f5-fb09-475a-8131-b8f0fe6c368c	user_17	super_admin	settings	export	settings_68qtfs	{"format": "csv", "records": 360}	10.0.91.224	2025-08-16 15:21:28.211
17d92a6d-3dc1-4a4f-b329-bef12044640e	user_6	admin	settings	update	settings_qx0jfk	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-14T04:52:40.814Z"}	10.0.33.139	2025-08-14 04:52:40.814
ee39c146-b533-4d7b-a155-daa5a036a198	user_3	parent	sessions	import	sessions_vpdsh	{"rows": 41, "success": true}	10.0.120.225	2025-07-26 14:35:22.974
a4e55870-ac03-4069-b9c7-50bba14d3cc3	user_15	admin	sessions	import	sessions_2tnyk2	{"rows": 57, "success": true}	10.0.83.254	2025-08-19 18:09:26.849
177ee5e8-955c-4daf-9bfb-b31c0cefa846	user_4	super_admin	payments	login	payments_4zlis	\N	10.0.228.209	2025-08-11 11:54:52.452
62a3e3a0-1989-4f05-bec3-38be986e1b33	user_1	super_admin	payments	update	payments_cx3y7	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-09T18:32:26.207Z"}	10.0.241.118	2025-08-09 18:32:26.207
6e4a31e3-5aa8-40ec-9157-c9ad419d47a0	user_17	parent	users	create	users_b24fls	{"status": "active", "created_at": "2025-07-31T01:50:16.816Z"}	10.0.240.154	2025-07-31 01:50:16.816
93b0898c-c7d6-4a61-9a5c-bdbeb3c7a2a1	user_12	super_admin	tenants	create	tenants_nivvko	{"status": "active", "created_at": "2025-08-05T15:59:35.146Z"}	10.0.86.105	2025-08-05 15:59:35.146
901d52d2-1cd9-4d4a-aafb-85295f4f6763	user_4	parent	tenants	login	tenants_cypbow	\N	10.0.183.119	2025-07-29 14:17:17.379
4da2931f-b0ba-45ac-8fbf-f238e2dbd5d1	user_14	admin	payments	login	payments_8a48fs	\N	10.0.152.127	2025-08-11 08:06:21.35
6fef10db-45ab-48a9-8824-303e0095953b	user_13	super_admin	settings	import	settings_9c9zt	{"rows": 80, "success": true}	10.0.128.49	2025-07-28 16:57:21.234
1c554d89-ef86-4d8a-9498-66c7db4cac9a	user_15	admin	sessions	create	sessions_fob4gg	{"status": "active", "created_at": "2025-08-13T07:57:03.372Z"}	10.0.8.62	2025-08-13 07:57:03.372
02fb14d4-09ad-45fa-b692-169ffa0067d6	user_7	super_admin	payments	export	payments_2xi4m	{"format": "csv", "records": 744}	10.0.232.107	2025-08-05 07:12:29.179
ced7e34e-9475-4910-b769-89714258b10f	user_6	super_admin	payments	export	payments_0m0g2l	{"format": "csv", "records": 344}	10.0.51.113	2025-07-27 09:14:16.381
dda376be-4eff-4418-8e0d-b4359b086f2b	user_16	super_admin	settings	import	settings_0nzesp	{"rows": 24, "success": true}	10.0.253.121	2025-08-13 21:18:23.477
3adc5f1b-e39e-402b-bac5-305e48e8df24	user_4	admin	users	logout	users_yebbrs	\N	10.0.216.253	2025-08-16 21:37:30.618
ddf36064-e07b-48a3-b78d-5302c69fb940	user_12	super_admin	users	export	users_5bk3u	{"format": "csv", "records": 199}	10.0.27.54	2025-08-17 02:13:50.312
a51f57b1-0c86-4ef2-9833-62617a83a8b0	user_16	super_admin	settings	import	settings_go09m	{"rows": 66, "success": false}	10.0.195.207	2025-07-27 16:25:30.829
c29897b7-acf3-4848-8c73-f3a5440ee9f2	user_19	parent	sessions	import	sessions_hm3qol	{"rows": 29, "success": true}	10.0.225.45	2025-08-13 17:45:09.36
3ed8793c-0ff9-43e1-82fb-ae95465e7c80	user_10	parent	payments	login	payments_rwylz4	\N	10.0.108.197	2025-08-06 13:36:09.291
a74ecbee-8a81-4ab4-8736-3eacbad8ed0c	user_13	admin	users	logout	users_va09kh	\N	10.0.182.120	2025-08-16 23:24:13.879
e0caffde-821b-46df-b0ba-72c92211ad78	user_3	super_admin	tenants	export	tenants_ecn58c	{"format": "csv", "records": 950}	10.0.153.244	2025-08-02 03:27:04.629
e641aee4-b3b7-4ab7-b39d-5f37c8f88716	user_10	super_admin	users	export	users_4dcjcj	{"format": "csv", "records": 359}	10.0.155.9	2025-08-22 02:25:50.38
f972eed9-6bef-4f1f-9b35-b2250e1f87d4	user_15	parent	users	logout	users_1wo7z	\N	10.0.195.48	2025-08-13 04:21:32.464
8641bce1-bd69-48c2-9365-c3d26539a344	user_2	super_admin	users	create	users_7xch0k	{"status": "active", "created_at": "2025-07-26T21:36:47.428Z"}	10.0.64.219	2025-07-26 21:36:47.428
b7a13cd2-6421-4833-b4f0-97a769b41b5a	user_18	parent	tenants	update	tenants_v75a57	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-01T20:28:58.759Z"}	10.0.232.175	2025-08-01 20:28:58.759
0bac4110-5f69-4ce6-8bb1-cb30e537294d	user_3	super_admin	tenants	delete	tenants_xzowx	{"deleted_at": "2025-08-23T03:41:59.036Z"}	10.0.3.22	2025-08-23 03:41:59.036
74fcafcd-5f00-4a64-8c8b-b5a8b00e0206	user_11	admin	tenants	export	tenants_q9dyq	{"format": "csv", "records": 255}	10.0.124.19	2025-08-15 19:53:03.267
8798eefd-4d69-4b82-b9c5-c9af0f103056	user_6	super_admin	sessions	export	sessions_bl641e	{"format": "csv", "records": 880}	10.0.191.160	2025-08-19 01:44:04.439
9bb8be91-fe0c-4ed2-9a75-8b15dfa092dd	user_8	parent	users	update	users_zufvln	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-07-28T22:20:16.181Z"}	10.0.187.38	2025-07-28 22:20:16.181
e1ffda67-ac5a-4ea2-a5d6-90b15a43e394	user_13	admin	payments	update	payments_ztdrhp	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-04T04:24:42.496Z"}	10.0.40.89	2025-08-04 04:24:42.496
62b4db69-14b9-4fe3-a6b8-cd8fcd232580	user_4	parent	settings	login	settings_pimvef	\N	10.0.22.22	2025-08-03 07:20:16.818
30e8ffac-56f6-4db9-b9aa-4b54b95bacfd	user_18	parent	sessions	logout	sessions_i3uxth	\N	10.0.98.67	2025-08-21 13:54:39.888
302f2750-cc1b-4954-9c1d-fd87167a0816	user_8	super_admin	settings	create	settings_39pd7g	{"status": "active", "created_at": "2025-08-12T07:52:43.484Z"}	10.0.59.24	2025-08-12 07:52:43.484
8a8d2645-6928-48c0-99c8-f3436a286a98	user_9	admin	users	export	users_ttcror	{"format": "csv", "records": 179}	10.0.109.190	2025-08-08 04:16:44.332
2a59cf1e-7cb8-4a5a-9dc7-93b3a608c354	user_10	super_admin	payments	update	payments_4sjyar	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-09T14:14:30.001Z"}	10.0.249.15	2025-08-09 14:14:30.001
140bb78a-5bcb-4686-abd8-317c50c54eb0	user_20	parent	users	create	users_auk656	{"status": "active", "created_at": "2025-08-15T06:16:10.136Z"}	10.0.100.140	2025-08-15 06:16:10.136
ed1b6c63-d012-412d-b227-144dba27ede6	user_15	parent	integrations	import	integrations_x4npr	{"rows": 38, "success": true}	10.0.10.179	2025-07-29 05:34:43.406
e0a028ec-d239-4627-9adb-38145b4b0c22	user_9	admin	settings	logout	settings_2shxbe	\N	10.0.241.87	2025-08-06 23:29:12.998
0303e2bf-7e41-4b39-a0b9-8c51534d6430	user_4	admin	sessions	delete	sessions_lpjk55	{"deleted_at": "2025-07-28T19:45:21.212Z"}	10.0.9.148	2025-07-28 19:45:21.212
5448e893-a8fc-4bfe-af76-385420d9bae4	user_6	super_admin	sessions	import	sessions_mm5s4g	{"rows": 27, "success": true}	10.0.100.195	2025-07-26 14:16:31.733
d37c8bd6-e045-43f2-9921-5e4103f824f2	user_9	admin	integrations	delete	integrations_i4uh6	{"deleted_at": "2025-08-23T13:37:23.507Z"}	10.0.186.111	2025-08-23 13:37:23.507
06f655ed-97eb-4769-a18d-b58bde22357f	user_5	admin	settings	create	settings_mkvbi	{"status": "active", "created_at": "2025-08-06T18:43:08.216Z"}	10.0.39.87	2025-08-06 18:43:08.216
28a86856-6b5e-4aac-a7ff-d0ea47e179e3	user_6	admin	payments	create	payments_n730ob	{"status": "active", "created_at": "2025-07-25T20:11:57.998Z"}	10.0.163.103	2025-07-25 20:11:57.998
315ad8fc-814b-4b06-8d5d-b2b5c0a459e4	user_18	admin	settings	export	settings_fewnp9	{"format": "csv", "records": 401}	10.0.33.88	2025-08-14 11:11:54.656
3b03d568-2a9c-447c-8630-dc89abbcb477	user_13	admin	payments	delete	payments_6ngoij	{"deleted_at": "2025-08-12T01:08:24.382Z"}	10.0.165.235	2025-08-12 01:08:24.382
4f01102f-35fc-47ce-afd0-db2fe4658516	user_11	admin	payments	export	payments_jj2qu	{"format": "csv", "records": 305}	10.0.73.215	2025-08-11 15:52:31.015
a3b060ed-d902-4a6d-81d0-069e450fef1e	user_7	super_admin	sessions	create	sessions_j03hyh	{"status": "active", "created_at": "2025-08-04T02:25:01.545Z"}	10.0.142.128	2025-08-04 02:25:01.545
44ce4a1a-ae8d-41c3-a53e-bc8c0106a237	user_12	super_admin	sessions	login	sessions_p1deq4	\N	10.0.43.241	2025-08-09 09:11:00.641
c0590921-f597-4b92-986f-39250b89d9af	user_16	parent	payments	update	payments_nxhh2	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-01T15:31:20.261Z"}	10.0.176.187	2025-08-01 15:31:20.261
a245749b-42b0-4459-ac50-74aa7f275ccb	user_11	super_admin	sessions	create	sessions_mkejt	{"status": "active", "created_at": "2025-08-23T09:21:42.945Z"}	10.0.206.49	2025-08-23 09:21:42.945
692f1cbd-ee00-4cfa-9d04-0c6350f669d7	user_9	parent	tenants	export	tenants_pwwjz	{"format": "csv", "records": 469}	10.0.195.149	2025-08-03 10:21:05.16
c9e126ff-d939-4228-aead-b822dd621bb2	user_3	admin	payments	import	payments_pvewmk	{"rows": 25, "success": true}	10.0.37.94	2025-08-19 04:02:52.286
5e8a276b-4a6d-4c64-b2fc-a429a780a6ac	user_10	admin	payments	import	payments_c8ifv	{"rows": 94, "success": true}	10.0.167.119	2025-07-30 21:19:09.545
ec64dacd-79b0-481e-9515-25022e9ce6d9	user_20	super_admin	payments	update	payments_4ktng	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-18T05:31:50.676Z"}	10.0.14.224	2025-08-18 05:31:50.676
d557cfdb-fc1b-4771-b786-a6e94726cf9b	user_6	super_admin	tenants	delete	tenants_w03h4q	{"deleted_at": "2025-07-25T20:04:07.543Z"}	10.0.138.0	2025-07-25 20:04:07.543
0bc372aa-bb8e-43d6-b15e-323b66b2446a	user_15	super_admin	payments	export	payments_2qd22	{"format": "csv", "records": 537}	10.0.157.92	2025-08-01 23:18:19.891
598e71e2-c33b-4329-9b5b-8c78f3a34a09	user_2	super_admin	tenants	create	tenants_03skr	{"status": "active", "created_at": "2025-08-18T23:03:15.707Z"}	10.0.125.251	2025-08-18 23:03:15.707
d16918c4-4a94-417e-a465-708fc003795a	user_15	super_admin	users	update	users_r7zmeo	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-04T16:25:03.172Z"}	10.0.101.203	2025-08-04 16:25:03.172
354fa5a7-e8d7-4fe0-81c5-696891106dd8	user_3	parent	payments	delete	payments_zg3l6c	{"deleted_at": "2025-08-21T18:51:21.865Z"}	10.0.181.96	2025-08-21 18:51:21.865
709dfa83-782a-4d0f-91bf-acca80774a4e	user_19	super_admin	integrations	export	integrations_15iwop	{"format": "csv", "records": 445}	10.0.232.121	2025-08-20 20:40:48.592
3575f6d7-1138-40cb-b638-7713de28bd25	user_11	parent	settings	export	settings_jiqwum	{"format": "csv", "records": 867}	10.0.127.35	2025-08-12 19:20:44.756
fa0e81e4-3e71-475a-889e-b8c654b051a2	user_8	super_admin	tenants	login	tenants_n7n6vr	\N	10.0.245.57	2025-08-18 20:22:35.033
c1e1bb39-b56e-449b-be14-17eea95b2492	user_7	admin	tenants	logout	tenants_pzg48m	\N	10.0.15.243	2025-08-15 19:13:17.173
603e3466-5686-4720-a420-ccdfb1098094	user_8	super_admin	settings	login	settings_tqulk	\N	10.0.10.193	2025-08-23 13:22:03.539
61200379-eeaa-4098-a323-2cddb57a4de1	user_8	admin	users	create	users_kf6i2q	{"status": "active", "created_at": "2025-08-04T00:09:50.807Z"}	10.0.91.188	2025-08-04 00:09:50.807
a566a34d-3458-45a5-8aad-d8792e6d95c5	user_9	super_admin	users	login	users_ewamu	\N	10.0.129.48	2025-08-23 02:56:12.262
6717cc9d-b75c-4137-b518-cc0cb5602d7d	user_12	super_admin	settings	delete	settings_hf5iwm	{"deleted_at": "2025-08-22T23:16:42.828Z"}	10.0.122.142	2025-08-22 23:16:42.828
02d71fde-f5d9-4cf9-94f4-abaecb6323f2	user_1	admin	settings	export	settings_rn9bv8	{"format": "csv", "records": 338}	10.0.38.6	2025-08-17 16:15:59.636
81edf640-3aac-41e7-912f-85af5d9425cd	user_19	admin	payments	create	payments_dgupo8	{"status": "active", "created_at": "2025-08-07T01:48:51.118Z"}	10.0.192.157	2025-08-07 01:48:51.118
544639b3-8692-43e8-ae3c-a66a56958330	user_7	parent	integrations	login	integrations_aowuncd	\N	10.0.189.149	2025-08-13 18:44:13.859
9f847907-c5b1-44f7-821b-cdc570506359	user_2	super_admin	integrations	export	integrations_u01bvr	{"format": "csv", "records": 273}	10.0.167.8	2025-07-28 12:49:43.731
50382e5a-4166-44ed-aa64-775a283641e2	user_7	parent	settings	update	settings_4ec4d	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-20T15:35:56.684Z"}	10.0.113.30	2025-08-20 15:35:56.684
029f2509-2a7e-4089-a3aa-eb3a42475055	user_14	parent	payments	delete	payments_e1zseo	{"deleted_at": "2025-08-10T14:00:07.386Z"}	10.0.72.42	2025-08-10 14:00:07.386
4c77d6a6-8309-46ed-84fd-37cc24c36701	user_9	admin	payments	delete	payments_wbw1x	{"deleted_at": "2025-08-10T21:46:24.640Z"}	10.0.47.185	2025-08-10 21:46:24.64
d3d0bb4b-59db-4342-8b5e-bb87d9f61576	user_7	super_admin	tenants	create	tenants_g2dx4b	{"status": "active", "created_at": "2025-08-21T03:00:29.609Z"}	10.0.42.96	2025-08-21 03:00:29.609
9617d427-94b2-48c4-8fad-d3aa66846acb	user_9	super_admin	tenants	create	tenants_n53yov	{"status": "active", "created_at": "2025-08-23T00:52:25.236Z"}	10.0.154.202	2025-08-23 00:52:25.236
1feccec8-6ab8-4272-9499-2284cdf9352f	user_3	admin	tenants	login	tenants_c533u7	\N	10.0.234.172	2025-08-17 18:24:01.867
822a681d-a215-4cd9-afec-79a8b5a2db36	user_8	parent	settings	delete	settings_wwlkfg	{"deleted_at": "2025-08-03T10:45:23.552Z"}	10.0.188.23	2025-08-03 10:45:23.552
cdfe08c4-cb23-4657-88d2-131e407e87f4	user_11	super_admin	tenants	update	tenants_lnw26	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-06T13:47:32.194Z"}	10.0.83.215	2025-08-06 13:47:32.194
33ca0113-a513-4492-b967-7afba469ba3a	user_8	super_admin	users	import	users_dcjlme	{"rows": 48, "success": true}	10.0.195.167	2025-08-12 15:56:41.282
2a316e1e-07f0-4736-818e-99693a97e792	user_20	super_admin	integrations	import	integrations_ti1ntg	{"rows": 75, "success": true}	10.0.181.107	2025-08-01 17:35:10.729
a558b7ed-1a29-457a-9076-1cca6fb34513	user_20	parent	users	export	users_8zeq6	{"format": "csv", "records": 828}	10.0.49.197	2025-08-01 06:24:49.045
d29f38ff-236c-401a-9dda-8ff70788755f	user_20	admin	users	update	users_gtah4	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-07-30T18:46:26.892Z"}	10.0.243.75	2025-07-30 18:46:26.892
4de13e96-4170-4992-b84b-c5269a51ad26	user_6	super_admin	integrations	update	integrations_7ty	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-23T09:23:05.570Z"}	10.0.197.101	2025-08-23 09:23:05.57
a5e2301e-2297-4d4f-949e-c13016f51762	user_13	parent	tenants	export	tenants_ujuhu	{"format": "csv", "records": 47}	10.0.160.18	2025-08-09 20:45:39.626
347c48af-550a-4bcd-8513-4be42200ad1a	user_8	admin	sessions	export	sessions_kkzaqgk	{"format": "csv", "records": 579}	10.0.126.196	2025-08-17 21:23:45.292
8b9f7b78-0d36-4644-9abe-0a91fac32f98	user_5	super_admin	sessions	logout	sessions_oro4uf	\N	10.0.4.59	2025-07-31 18:22:48.771
d903fc18-adf3-4096-b046-76e2d8d652f6	user_20	parent	tenants	logout	tenants_9e47b	\N	10.0.238.48	2025-08-20 01:52:11.375
9a329e4f-1ff9-46d0-bdc6-025b8bee318f	user_1	super_admin	integrations	logout	integrations_noyrkh	\N	10.0.74.221	2025-07-31 20:40:13.066
462efa77-7a8a-437c-8532-5215db0cd7b5	user_15	parent	users	logout	users_fxaebr	\N	10.0.130.57	2025-08-02 22:23:02.499
72be6b9f-8872-4be5-a0c8-885573656b7b	user_20	super_admin	settings	update	settings_flrvwb	{"status": {"to": "active", "from": "pending"}, "updated_at": "2025-08-07T08:35:17.719Z"}	10.0.192.117	2025-08-07 08:35:17.719
\.


--
-- Data for Name: comm_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comm_templates (id, type, key, name, version, active, last_used_at) FROM stdin;
0a4b9cde-9488-4d76-b65a-9251877c14c0	email	booking_confirmation	Booking Confirmation	1	t	\N
c751fd4d-1492-48ce-b5c9-b662bb991b5c	email	booking_reminder_email	Session Reminder (Email)	1	t	\N
c6ba424f-c519-42cd-ac63-a123060e32c9	sms	booking_reminder_sms	Session Reminder (SMS)	1	t	\N
cefd27ce-93aa-4474-b31a-2d6272b1cea5	email	payment_receipt	Payment Receipt	1	t	\N
4dc5dc36-3b3c-4dbd-b8cc-c61a332802d2	email	cancellation_notice_email	Cancellation Notice (Email)	1	t	\N
aa889e6a-d82b-4739-b6b9-2bff41ca3eb0	sms	cancellation_notice_sms	Cancellation Notice (SMS)	1	t	\N
15effa44-20e8-4fa1-9d28-d71b13ac1d37	sms	waitlist_promoted	Waitlist Promotion	1	t	\N
d0764eb0-f719-4cbc-9e6c-0358c43adc7b	email	password_reset	Password Reset	1	t	\N
a1c2cf0e-cff7-4166-896b-2dbfe2670084	email	welcome_email	Welcome Email	1	t	\N
ce8c6641-33de-4329-a027-d61fb2122ef6	sms	session_full	Session Full Alert	1	t	\N
\.


--
-- Data for Name: consent_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consent_documents (id, tenant_id, player_id, parent_id, template_id, status, signed_at, signer_ip, signer_user_agent, digital_signature, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: consent_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consent_events (id, tenant_id, user_id, channel, type, source, ip, user_agent, occurred_at) FROM stdin;
\.


--
-- Data for Name: consent_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consent_templates (id, tenant_id, template_type, title, content, file_path, file_name, file_size, is_custom, version, is_active, created_at, updated_at) FROM stdin;
7c8243b6-e8a0-484d-b11a-f2b89c2eabe9	d98c4191-c7e0-474d-9dd7-672219d85e4d	liability	Liability Waiver	<h3>Assumption of Risk, Waiver of Claims, and Release Agreement</h3>\n<p><strong>{{COMPANY_NAME}}</strong></p>\n<p><strong>Player:</strong> {{PLAYER_NAME}}<br>\n<strong>Parent/Guardian:</strong> {{PARENT_NAME}}<br>\n<strong>Date:</strong> {{DATE_SIGNED}}</p>\n\n<p>I acknowledge that participation in futsal activities organized by {{COMPANY_NAME}} involves inherent risks of injury. I understand these risks and voluntarily assume them on behalf of my child/ward.</p>\n\n<p>In consideration for allowing my child to participate in {{COMPANY_NAME}} programs, I hereby:</p>\n<ul>\n<li>Release and hold harmless {{COMPANY_NAME}}, its coaches, staff, and volunteers from any liability for injuries</li>\n<li>Waive any claims for damages arising from participation in futsal activities</li>\n<li>Agree to indemnify {{COMPANY_NAME}} against any claims made by others arising from my child's participation</li>\n</ul>\n\n<p>I understand this release covers all activities including training, games, tournaments, and related events organized by {{COMPANY_NAME}}.</p>\n\n<p>I have read and understand this agreement and sign it voluntarily.</p>\n\n<p>For questions about this waiver, please contact us at {{SUPPORT_EMAIL}} or {{SUPPORT_PHONE}}.</p>\n\n<p><em>{{COMPANY_NAME}}<br>\n{{COMPANY_ADDRESS}}<br>\n{{CONTACT_EMAIL}} • {{SUPPORT_PHONE}}</em></p>	\N	\N	\N	f	1	f	2025-08-25 00:29:51.790802	2025-08-25 00:29:54.207
4b7233a7-9c99-4b2a-a8a3-1fec09660589	d98c4191-c7e0-474d-9dd7-672219d85e4d	medical	Medical Information Release Form	<h3>Medical Information Release and Emergency Treatment Authorization</h3>\n<p><strong>{{COMPANY_NAME}}</strong></p>\n<p><strong>Player:</strong> {{PLAYER_NAME}}<br>\n<strong>Parent/Guardian:</strong> {{PARENT_NAME}}<br>\n<strong>Date:</strong> {{DATE_SIGNED}}</p>\n\n<p>I hereby authorize the coaching staff and administration of {{COMPANY_NAME}} to obtain emergency medical treatment for my child/ward in the event that I cannot be reached. I understand that every effort will be made to contact me before any treatment is administered.</p>\n\n<p>I consent to the release of my child's medical information to emergency medical personnel and healthcare providers as necessary for treatment.</p>\n\n<h4>Emergency Contact Information:</h4>\n<ul>\n<li>Primary Contact: [To be filled by parent]</li>\n<li>Secondary Contact: [To be filled by parent]</li>\n<li>Family Doctor: [To be filled by parent]</li>\n<li>Medical Insurance Provider: [To be filled by parent]</li>\n</ul>\n\n<p><strong>Known Allergies or Medical Conditions:</strong> [To be filled by parent]</p>\n<p><strong>Current Medications:</strong> [To be filled by parent]</p>\n\n<p>For questions or concerns, please contact us at {{SUPPORT_EMAIL}} or {{SUPPORT_PHONE}} during {{SUPPORT_HOURS}}.</p>\n\n<p><em>{{COMPANY_NAME}}<br>\n{{COMPANY_ADDRESS}}<br>\n{{CONTACT_EMAIL}} • {{SUPPORT_PHONE}}</em></p>	\N	\N	\N	f	1	f	2025-08-25 00:29:45.070112	2025-08-25 00:29:56.013
74509d89-e399-4b9c-b43f-ff0e02d30b2f	d98c4191-c7e0-474d-9dd7-672219d85e4d	test	test	testestest	\N	\N	\N	t	1	f	2025-08-25 00:30:24.281757	2025-08-25 02:10:25.2
\.


--
-- Data for Name: contact_group_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_group_members (id, group_id, user_id, added_by, added_at) FROM stdin;
\.


--
-- Data for Name: contact_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_groups (id, tenant_id, name, description, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dev_achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dev_achievements (id, tenant_id, player_id, badge_key, title, description, awarded_at, created_at) FROM stdin;
\.


--
-- Data for Name: dev_skill_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dev_skill_categories (id, tenant_id, name, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dev_skill_rubrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dev_skill_rubrics (id, tenant_id, skill_id, level, label, descriptor, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dev_skills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dev_skills (id, tenant_id, category_id, name, description, sport, age_band, sort_order, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: discount_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discount_codes (id, tenant_id, code, description, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, is_active, created_by, created_at, updated_at, locked_to_player_id, locked_to_parent_id, stripe_coupon_id, stripe_promotion_code_id) FROM stdin;
\.


--
-- Data for Name: drills_library; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.drills_library (id, tenant_id, title, objective, equipment, steps, video_url, tags, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dunning_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dunning_events (id, invoice_id, attempt_no, status, gateway_txn_id, reason, created_at) FROM stdin;
\.


--
-- Data for Name: email_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_events (id, provider, message_id, tenant_id, template_key, to_addr, event, reason, created_at) FROM stdin;
cca78530-7e13-4656-93a6-976019b0477a	mailgun	msg_ch7un	\N	booking_confirmation	user82@example.com	spamreport	Invalid email	2025-08-14 01:59:14.609
c0a4797e-505c-435f-ab2f-783cb0ea80f9	mailgun	msg_37y3yt	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user33@example.com	delivered	\N	2025-08-09 06:08:53.544
d21747a6-f7a4-4c0e-90e7-969750580aea	sendgrid	msg_m054y9	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user3@example.com	spamreport	\N	2025-07-26 04:34:11.833
19f01beb-2acd-4e9d-abdd-515787010761	mailgun	msg_kx9xoi	\N	booking_reminder_email	user68@example.com	delivered	\N	2025-08-13 03:18:34.795
72fba513-8838-4883-96da-005a83086252	mailgun	msg_wwjirn	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user21@example.com	dropped	\N	2025-07-28 19:53:32.144
84fadc0e-fb2d-463c-bce6-f4943303cfa7	ses	msg_suqzwe	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user88@example.com	bounce	Mailbox full	2025-08-22 22:43:16.56
f846cc1a-bd63-4e19-9b1e-07f3fda915b7	mailgun	msg_7bubhq	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user63@example.com	deferred	\N	2025-07-26 13:45:47.318
e7b8f3ae-f23c-4f7a-b587-d9ed00b6b4c7	ses	msg_vza4o6	\N	password_reset	user1@example.com	click	Spam filter	2025-08-14 22:14:48.117
89c3bf09-bfe9-4b5b-8999-58d0bfe82691	mailgun	msg_r8v7zk	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user90@example.com	processed	\N	2025-08-15 15:40:37.713
c670e182-f4c6-4adc-aae3-d99f6697fc5e	sendgrid	msg_c0n8gc	\N	payment_receipt	user44@example.com	processed	\N	2025-07-30 02:21:40.312
08876c51-a367-4564-87d4-b3d2bc9fef2d	mailgun	msg_99ni6l	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user33@example.com	dropped	Mailbox full	2025-08-12 22:07:55.195
821fc015-e209-42aa-945f-e7a1b97494db	ses	msg_jugofb	\N	booking_confirmation	user70@example.com	spamreport	Spam filter	2025-08-17 14:37:48.598
29ddae65-bb1d-4e4c-a9f2-00068942725d	sendgrid	msg_d7at9	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user77@example.com	open	\N	2025-08-04 04:47:25.4
6131b43f-7335-4090-a40e-e2cc2f4dbec3	mailgun	msg_ypq1cc	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user37@example.com	bounce	\N	2025-08-18 09:11:34.218
72698f14-ca3d-47ba-b51a-95fce87b8b7b	sendgrid	msg_wbcd5	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user37@example.com	spamreport	\N	2025-08-20 19:25:30.982
7d6bddd8-3873-43bd-92dd-ee2b517b805f	ses	msg_krbc06	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user54@example.com	spamreport	\N	2025-08-16 14:08:34.598
dae51543-f89f-48ad-bd5c-b88f4026490a	mailgun	msg_5rbufa	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user55@example.com	dropped	Spam filter	2025-08-11 04:46:27.722
366dcb7b-f955-4d27-bfa7-f78258121dee	sendgrid	msg_8jpri0j	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user39@example.com	delivered	\N	2025-07-25 05:36:08.478
a47c4a86-b34e-4805-983f-a28fc599d0cc	mailgun	msg_47rlkr	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user8@example.com	spamreport	\N	2025-08-15 19:55:40.585
0473f871-bd10-43b8-be2b-3de9287c1e50	ses	msg_drx2um	\N	payment_receipt	user17@example.com	processed	\N	2025-08-13 17:47:05.271
8bce0301-2285-479a-a8d5-26cae3b54e97	mailgun	msg_0l3t5j	\N	cancellation_notice_email	user31@example.com	bounce	\N	2025-08-12 16:28:42.504
db7c4cd2-ee40-492d-9443-78d3ba697fcc	mailgun	msg_568m7b	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user73@example.com	open	\N	2025-08-15 14:27:36.43
b2a1bbf9-59ca-43e7-9954-6fcdd5e03555	mailgun	msg_ziihx	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user21@example.com	delivered	\N	2025-08-18 16:41:34.97
9f544847-1419-458d-89ab-f289be5e06c6	mailgun	msg_huxoc	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user21@example.com	open	\N	2025-07-25 22:06:29.846
3e0aefc3-5451-4d83-b3ba-dac56894e11c	mailgun	msg_emt77f	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user58@example.com	spamreport	\N	2025-08-13 12:50:54.626
cb83da03-f600-40ee-979d-5b2cb5787f21	sendgrid	msg_mk3c0k	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user97@example.com	delivered	Spam filter	2025-08-03 08:30:36.211
ccf28be2-d476-4745-97cf-019850958566	mailgun	msg_1nbjbc	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user21@example.com	processed	\N	2025-08-17 23:54:11.549
9f3ef552-dcd3-419e-9348-c94227c22a24	sendgrid	msg_ezh60bt	\N	payment_receipt	user51@example.com	delivered	\N	2025-08-15 14:04:54.566
78fea436-0ab1-45bc-ad65-33560eb3c454	sendgrid	msg_s978y	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user81@example.com	click	Invalid email	2025-08-22 19:50:30.397
8079b8d1-c2b4-446e-b8a9-f0d3120c72e3	sendgrid	msg_a8cl1	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user51@example.com	bounce	\N	2025-08-16 00:42:27.45
e0da3c1f-667a-4543-89f9-32ba063e16ba	mailgun	msg_2g67mk	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user58@example.com	spamreport	\N	2025-08-12 16:28:58.371
c07b7d5c-1f7b-4acf-8d86-cdad08be7a18	mailgun	msg_o5j4xn	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user83@example.com	dropped	\N	2025-08-15 08:51:54.869
65d37b25-d6c2-4209-aec2-8bed40280bc9	mailgun	msg_z6e6	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user65@example.com	dropped	\N	2025-07-31 18:50:08.612
c834e1fc-85fb-4936-86d9-03c1b9b294de	sendgrid	msg_pvhnx	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user67@example.com	processed	\N	2025-08-12 12:45:38.731
91f888a7-56da-47c9-8946-b88c571bb794	mailgun	msg_abwdjk	\N	cancellation_notice_email	user10@example.com	dropped	\N	2025-08-18 01:58:28.862
0e875b3f-8f61-488c-8d56-e40d20868a13	mailgun	msg_nl67cr	\N	cancellation_notice_email	user66@example.com	bounce	\N	2025-08-15 23:47:59.825
5a3a42cf-f380-4897-9f54-0b406e7bd833	sendgrid	msg_2m79uyy	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user68@example.com	processed	\N	2025-08-22 10:55:05.897
5647dcac-d33f-4de3-8f4a-bac74185e322	sendgrid	msg_xjmtm9j	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user39@example.com	deferred	\N	2025-08-22 14:14:14.512
4860342a-19c3-45fe-9a61-783d8eac0abc	mailgun	msg_e0vcpd	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user45@example.com	processed	\N	2025-07-29 19:21:00.757
c1a6b0bf-0b60-4a33-b862-6e4ea4c80cfb	sendgrid	msg_h1l37	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user37@example.com	bounce	\N	2025-08-17 02:41:28.047
5bd5ea58-0726-469a-b054-6e59f211e256	mailgun	msg_5hbzno	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user42@example.com	deferred	Invalid email	2025-08-13 11:16:41.285
b34b6e96-c1e2-4df1-8697-3fcfcab11c59	ses	msg_j3jier	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user54@example.com	processed	\N	2025-08-21 13:44:16.128
1971444b-5371-4276-833e-1da9d53d3473	ses	msg_6f6dt5	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user93@example.com	processed	\N	2025-08-07 21:37:47.903
0a9a0020-af3f-4f65-b18c-bc2cb999ff60	sendgrid	msg_04xwc	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user78@example.com	delivered	\N	2025-08-08 21:54:06.292
9830cb63-442e-4930-ae22-d5a9ec0332a4	sendgrid	msg_7u1agj	\N	booking_reminder_email	user54@example.com	processed	\N	2025-08-11 03:51:35.808
c3ebbcf8-5915-459a-9fd0-8c327b28c4a5	ses	msg_4a66sr	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user87@example.com	open	\N	2025-08-04 05:19:14.093
c2ab9345-7830-4c7c-a55d-b32c7a7633e7	sendgrid	msg_fm00ks	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user59@example.com	open	\N	2025-08-07 14:22:29.095
d9c58d8b-163e-4e30-835e-4debb4a61ea0	ses	msg_5ossf	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user24@example.com	delivered	\N	2025-07-26 01:15:52.563
fb50e717-03a6-47c2-bf96-c80908603f26	ses	msg_pifqop	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user17@example.com	dropped	\N	2025-08-23 03:58:22.421
5007ac45-ee74-4a1d-b21c-e64f6757c050	sendgrid	msg_h5de7l	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user37@example.com	open	\N	2025-08-12 11:00:07.469
70138ea6-c627-46bc-b3f2-458f8a5ea4be	sendgrid	msg_g15jld	\N	cancellation_notice_email	user36@example.com	spamreport	\N	2025-08-18 05:33:03.797
19290445-a9db-4410-9388-a02add3d0294	mailgun	msg_2b6j6e	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user87@example.com	delivered	Invalid email	2025-08-17 12:14:08.023
7bbab9bd-7808-4235-a5b8-e6638835b5f7	ses	msg_dkrb7w	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user6@example.com	processed	Mailbox full	2025-08-10 11:33:25.222
338a1448-a41b-4615-9fc3-baaa6b359df5	sendgrid	msg_3j0lyg	\N	payment_receipt	user25@example.com	click	Spam filter	2025-08-02 11:05:49.53
705d7985-7ed7-432b-a716-02b81857cc24	mailgun	msg_cdnclb	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user11@example.com	delivered	\N	2025-08-09 22:53:17.492
6dfbb379-e311-4470-a875-e9365ad414c8	mailgun	msg_04ngsn	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user97@example.com	delivered	\N	2025-08-16 07:03:53.654
7acd2f4d-90b7-4138-8b09-0f6ea7a0d39f	sendgrid	msg_y0w5mn	\N	welcome_email	user27@example.com	spamreport	Spam filter	2025-08-11 22:12:36.38
67f67854-c19e-45ce-ab25-085ced57ac32	sendgrid	msg_e1s2us	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user33@example.com	delivered	Spam filter	2025-08-15 06:02:48.38
841be3e9-b5a5-4fa6-a286-b986d870ac4c	sendgrid	msg_w5y4w	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user29@example.com	open	\N	2025-08-21 01:04:13.068
c7138b34-72ea-4019-ab50-ed0ad6602d91	ses	msg_mhiyq	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user34@example.com	click	\N	2025-08-02 22:57:12.243
26843f75-143a-46fc-b581-c628f7745e0e	sendgrid	msg_xveika	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user34@example.com	click	\N	2025-08-14 00:27:47.818
b0b8265a-9f3b-48e4-8106-9fe4b820d5a7	ses	msg_6pcu19	\N	cancellation_notice_email	user33@example.com	open	\N	2025-07-27 04:17:04.29
bb65ed54-bbd1-408b-96f2-e7b429505181	ses	msg_7d18bo	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user49@example.com	click	\N	2025-08-18 16:44:59.533
120617e1-d6ac-46ba-8a07-88231ab3ecf4	sendgrid	msg_h8tvc6c	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user91@example.com	dropped	Invalid email	2025-07-28 17:42:36.038
06207a17-5a43-49d0-9105-bdfed4936c13	sendgrid	msg_zmt1hg	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user26@example.com	spamreport	\N	2025-07-30 17:34:46.673
7801f53d-4f0a-4510-909a-8dbdcc4382ed	sendgrid	msg_04k4z	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user58@example.com	dropped	\N	2025-08-02 12:45:04.356
a21de30c-be11-4e12-a608-994497ccb897	sendgrid	msg_ni0y7	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user7@example.com	click	\N	2025-08-02 18:03:06.728
d7369ff6-ea57-42bf-a9bc-7cc745250d8d	ses	msg_wzs5co	\N	welcome_email	user36@example.com	deferred	Invalid email	2025-08-20 02:18:53.962
cf39e91f-ab28-4c27-b745-cc5899c5d171	sendgrid	msg_6lieyl	\N	cancellation_notice_email	user62@example.com	open	\N	2025-08-23 21:36:06.705
e631e76b-cd5b-4284-82dc-3fc6bf4e2cc2	mailgun	msg_tv1qj2	\N	booking_reminder_email	user13@example.com	spamreport	Spam filter	2025-07-28 14:16:12.922
c7369c28-8784-4be7-9162-e85ae57090d9	ses	msg_bvr90q	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user10@example.com	processed	\N	2025-07-30 09:01:55.305
0e5aaeab-46ea-442f-b206-fd6f1cf08d18	ses	msg_xs1y5	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user92@example.com	open	\N	2025-08-17 17:15:24.072
ec5dd234-dd49-4afa-84e3-96088cd5d249	mailgun	msg_uovhls	\N	booking_confirmation	user43@example.com	deferred	\N	2025-08-20 10:45:52.274
7d6d7ce5-ff11-4c50-b5a9-af7dbb07a304	sendgrid	msg_yn4iyp	\N	cancellation_notice_email	user50@example.com	dropped	\N	2025-08-02 02:18:19.313
739e6fb7-6666-4ed4-b446-1a4bb2857d0c	ses	msg_39xmci	\N	cancellation_notice_email	user86@example.com	delivered	\N	2025-08-18 14:21:43.238
0c59aaa9-fb10-4a4a-8955-943be4546dfc	ses	msg_v51o	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user67@example.com	spamreport	\N	2025-07-29 23:10:55.623
5512fb25-2b23-432c-ad6d-990d60460e0e	sendgrid	msg_np92p8	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user31@example.com	deferred	Mailbox full	2025-08-11 13:28:52.35
192aa752-4e31-4dcf-87c1-10fb0c575258	mailgun	msg_1ata	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user15@example.com	dropped	Spam filter	2025-07-31 16:02:07.961
1ec70af6-2de7-465d-a8c1-4d37d46854a8	mailgun	msg_tpdtp	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user15@example.com	open	\N	2025-08-05 15:31:40.827
9e5eec57-557c-49d1-a7ba-e068bf20a682	mailgun	msg_um52ta	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user34@example.com	bounce	\N	2025-08-10 06:21:17.201
c32b522c-efc9-48aa-b3f4-a095d52523fe	sendgrid	msg_uefbwo	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user39@example.com	spamreport	\N	2025-08-22 13:06:52.137
302ddb13-2fda-4d80-98a1-eac0622a786c	sendgrid	msg_kcqflg	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user91@example.com	bounce	\N	2025-08-01 08:50:22.273
61ca8ec6-f35f-459e-8f05-d8756123d147	ses	msg_2gt5rj	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user6@example.com	click	\N	2025-08-08 13:14:26.983
f754ec59-767d-496e-b3fc-9e7ccd5df72d	ses	msg_f277k	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user22@example.com	deferred	Invalid email	2025-08-10 02:43:56.059
8578bf45-646d-4e4b-a44f-77cd019bcffb	mailgun	msg_n7kpws	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user11@example.com	processed	\N	2025-08-19 08:33:34.092
7ddc9c4c-4855-4c5f-b9ac-78a15200a47f	ses	msg_47ym6	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user69@example.com	deferred	\N	2025-08-12 20:26:44.385
e4e9087d-5a82-434d-af3a-0216f19a3236	mailgun	msg_82e2oh	\N	payment_receipt	user45@example.com	bounce	\N	2025-08-18 01:02:15.69
ab6029e4-bcc6-4d9c-8351-2d200be25ede	mailgun	msg_6whkag	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user55@example.com	click	\N	2025-07-31 06:26:44.449
1d8a7fd1-5a32-4f7a-b896-0844dc2c7235	mailgun	msg_1xiyng	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user47@example.com	processed	\N	2025-08-18 04:43:49.608
cca7142a-3894-4f16-a97b-9b9e3ca688da	mailgun	msg_1jm84c	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user53@example.com	bounce	\N	2025-08-10 13:16:08.407
918e4300-ca67-48a9-9cd1-24dc55b93895	sendgrid	msg_ob45kr	\N	payment_receipt	user18@example.com	delivered	Invalid email	2025-08-09 17:01:14.663
d1c8c0ec-c0f9-4d36-8c2c-53e24213c3fe	sendgrid	msg_657ada	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user43@example.com	processed	Mailbox full	2025-08-05 02:06:41.854
14396745-50ba-4991-b719-0232e379e8b4	ses	msg_5x52i	\N	cancellation_notice_email	user83@example.com	delivered	\N	2025-08-04 21:14:39.628
2adef6d2-1079-46e7-92d3-e60912e9e202	mailgun	msg_gvl63vm	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user43@example.com	processed	\N	2025-08-04 10:50:48.024
31ee5b67-569f-42b5-b168-06255362ade7	ses	msg_3cka6g	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user23@example.com	open	Invalid email	2025-08-18 08:59:31.277
a6d8517f-982e-49e6-9529-52da9684ab37	mailgun	msg_7fm4b3o	\N	cancellation_notice_email	user9@example.com	dropped	\N	2025-08-15 13:29:55.047
71828cd0-aa21-4e35-b2f8-d59735c6f13c	ses	msg_lu0fz	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user4@example.com	open	\N	2025-07-31 00:46:02.338
98ed0905-07ff-4da8-9ab7-b319e4079ee4	ses	msg_pumi43	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user77@example.com	open	\N	2025-08-21 16:02:00.401
d0e79fcc-ade4-4c96-a7a7-aaa6dd47a964	ses	msg_2pk7be	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user46@example.com	processed	\N	2025-08-03 19:06:42.098
ca592d8a-1915-4644-817d-b85814406eb5	sendgrid	msg_pkzokh	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user36@example.com	bounce	\N	2025-07-25 00:40:29.113
b978241a-6e59-40ff-ae9a-8150749cfa59	mailgun	msg_5eb575	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user54@example.com	deferred	\N	2025-07-25 17:45:28.904
2a0f169d-2750-420b-8885-7abf3dfdb905	ses	msg_h9w1xf	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user8@example.com	spamreport	Spam filter	2025-08-22 11:29:51.451
69ebc6b4-f626-4733-9e5f-bf7ea26d7189	ses	msg_bvyn6	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user60@example.com	open	\N	2025-07-25 19:08:05.872
10a67be2-3a4f-4497-810c-05eddab76b80	ses	msg_qk23u	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user71@example.com	bounce	\N	2025-08-11 20:11:28.271
4550c2a2-e835-4d0b-83c2-1b7aeb7b46c2	sendgrid	msg_j8cd	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user39@example.com	deferred	\N	2025-07-31 00:40:47.373
c905f218-b38f-45d2-a0bd-bbe63e161290	mailgun	msg_ueotug	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user97@example.com	deferred	\N	2025-08-10 13:38:31.754
b811b322-3f2d-4b66-86fe-5c8e65e25d68	mailgun	msg_5s5tig	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user81@example.com	delivered	\N	2025-08-11 15:48:13.038
de12d75f-6c66-4968-8df2-c629e9b7f140	ses	msg_hplqbj	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user61@example.com	deferred	\N	2025-08-09 23:32:32.534
48b1fe00-b4c6-4150-a054-58e5a9f7054f	sendgrid	msg_kz26oe	\N	password_reset	user5@example.com	bounce	\N	2025-08-21 07:01:50.485
dfde2ab8-74f0-4208-a1e1-02a326d56f7a	ses	msg_l40sa	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user83@example.com	bounce	Invalid email	2025-08-20 00:39:23.664
c755c16a-d2a6-4887-aee5-5da9c1004a60	mailgun	msg_diss4e	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user38@example.com	processed	Spam filter	2025-08-09 04:48:24.642
f4fe043a-03bb-4298-939d-bfd0d6425607	mailgun	msg_igxfut	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user79@example.com	open	\N	2025-07-29 03:57:52.009
398893b0-7a85-40de-86cd-088f92087a9f	mailgun	msg_jv2hy8	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user32@example.com	open	\N	2025-08-21 05:49:23.029
b316fd65-1d08-455d-b150-34f41d46d88e	ses	msg_94bvrv	\N	cancellation_notice_email	user35@example.com	deferred	\N	2025-08-01 02:28:56.254
5cfd73fe-ca91-4358-b99c-6f7ed422387e	ses	msg_nthog1	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user37@example.com	bounce	\N	2025-08-12 13:19:10.119
adeb3454-c9de-471c-b2d3-9c422c83e076	ses	msg_otlldh	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user57@example.com	processed	Mailbox full	2025-08-22 13:54:42.917
fdbb5074-02cc-48db-9096-4fe8d8610163	ses	msg_bpwo98	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user39@example.com	click	Spam filter	2025-08-22 11:33:25.412
21927515-f910-42c0-9696-d3c30f0e37b6	ses	msg_8e7ond	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user48@example.com	dropped	Mailbox full	2025-08-16 23:40:58.248
fe66c157-3270-4159-8354-6d4d92208c92	ses	msg_m4co1	\N	cancellation_notice_email	user54@example.com	bounce	\N	2025-08-02 16:14:10.358
121fe4da-445a-407e-a35a-2367bf1146a3	ses	msg_c6q95o	\N	cancellation_notice_email	user79@example.com	click	\N	2025-08-18 22:04:39.27
3300f4d3-ff8f-4ef4-8f74-07a43e2b4e98	mailgun	msg_v7k7ec	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user35@example.com	delivered	\N	2025-08-11 06:15:22.71
bbc01109-bde0-42a6-91a3-62ba40ed5b80	ses	msg_yg72fq	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user28@example.com	spamreport	\N	2025-08-19 02:13:52.363
6826773e-7d2f-4296-a9c7-e5d05b8f8f9f	mailgun	msg_nh6ggl	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user81@example.com	bounce	\N	2025-08-02 13:00:56.046
bce8a78b-da31-48c4-80eb-23a160c4fa0c	mailgun	msg_hpjx7	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user39@example.com	open	Invalid email	2025-08-22 19:48:38.505
aba88add-c266-4241-a4e4-7cae46c4baf9	mailgun	msg_bmioji	\N	booking_reminder_email	user93@example.com	click	Mailbox full	2025-08-23 05:20:18.552
a454ee4a-a5da-4676-8b73-0607190d460c	mailgun	msg_np8pw	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user8@example.com	click	Spam filter	2025-08-21 10:10:01.209
8dfdb371-9333-404c-912f-8027e615ade6	ses	msg_7hhlxr	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user80@example.com	bounce	Invalid email	2025-08-09 02:39:44.725
d9b287a0-d981-4aed-acc7-20956ff89a43	sendgrid	msg_udbiqb	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user76@example.com	processed	Mailbox full	2025-08-18 19:02:08.957
93d97a78-668b-4ce0-a466-9e7a12d4e888	mailgun	msg_hdi0ai	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user98@example.com	spamreport	\N	2025-08-21 01:09:10.391
eded336a-7d7e-42e0-acec-eb68831d3923	mailgun	msg_kq1ez	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user13@example.com	deferred	\N	2025-07-26 10:23:31.783
89ff9ad0-f476-4554-b590-ee6e25e8beb1	sendgrid	msg_6g3rf5	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user78@example.com	spamreport	Mailbox full	2025-08-02 08:22:22.932
bc40b6fb-b5a8-4d7c-b62d-bcee374fc123	mailgun	msg_vjf4ru9	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user88@example.com	click	\N	2025-07-29 18:32:47.062
03356e14-745d-454d-aabe-7230c46973d7	ses	msg_jyybta	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user36@example.com	dropped	\N	2025-08-19 19:50:07.237
87c95983-c502-49bc-b7c1-09b392186568	ses	msg_ca9lmt	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user59@example.com	deferred	\N	2025-07-27 06:14:00.775
df695b11-fc36-410f-9181-0c48442ba7d5	mailgun	msg_4l3hjq	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user87@example.com	processed	\N	2025-08-04 00:07:49.038
e4c0b24a-fa5b-45cf-923c-b665d5c69714	mailgun	msg_a32bx	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user56@example.com	spamreport	\N	2025-08-12 15:57:25.364
ceab5117-da2f-4665-bdd7-22ec9d8b5804	mailgun	msg_xph38dk	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user77@example.com	spamreport	\N	2025-08-10 00:00:57.395
7294c37d-1245-4e80-aa5a-e8d47191ff7b	sendgrid	msg_jpdn7q	\N	welcome_email	user14@example.com	open	\N	2025-08-17 08:32:36.097
d7a2cc99-cc5e-45c9-9b7a-48edcbd21c3c	sendgrid	msg_iizaco	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user92@example.com	dropped	\N	2025-07-28 04:01:18.838
e257de4c-cca0-4559-8d5e-6e27292659f3	ses	msg_9mizm	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user82@example.com	deferred	\N	2025-08-16 13:14:23.634
75512732-659c-4a73-aed2-ef4188bbc837	mailgun	msg_rlfeeg	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user46@example.com	open	\N	2025-08-18 14:50:33.254
00773861-f488-4fd4-aed0-7eddff75ce38	sendgrid	msg_i07veq	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user13@example.com	bounce	\N	2025-07-26 19:42:08.687
02901bd9-42cf-4a76-9905-fc1712898fc1	ses	msg_g06urf	\N	cancellation_notice_email	user76@example.com	click	Spam filter	2025-08-09 23:25:23.695
e0bdfc98-4b9e-4203-871f-57f2467241e9	sendgrid	msg_ev3spf	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user37@example.com	deferred	\N	2025-08-10 04:17:59.271
0da49555-34b2-4943-95e7-c92b0f9a8e6c	ses	msg_r1h7jad	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user25@example.com	open	\N	2025-07-27 21:18:57.521
295f5065-f114-4f6a-800e-23c01d21d343	ses	msg_tczvcko	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user20@example.com	delivered	Mailbox full	2025-08-11 23:12:54.399
50a03358-fd95-4c0f-a1fd-830d3f79de5a	ses	msg_sv9h2c	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user20@example.com	dropped	\N	2025-08-18 03:55:49.311
45e6cc93-5fc7-42f5-b447-40dfe1a9cd95	sendgrid	msg_dkzz1	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user4@example.com	click	\N	2025-08-14 20:24:12.276
506d08a8-6348-4ace-9226-c2c0bdcef521	sendgrid	msg_tvipp	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user65@example.com	delivered	\N	2025-08-03 18:31:08.67
1bdd4d98-bcaa-4300-9b14-93ca7a2b31d5	sendgrid	msg_bffvop	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user99@example.com	processed	\N	2025-08-14 21:23:02.637
348703fd-615a-445b-8da7-f8bf86ad9159	ses	msg_vdvd28	\N	cancellation_notice_email	user41@example.com	dropped	\N	2025-08-15 20:15:32.147
991988de-12db-4073-b52c-1088f2c2257e	mailgun	msg_cbahtf	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user59@example.com	dropped	\N	2025-08-23 14:07:42.108
f2ec72ef-41d4-485c-a952-cbc5596e9a56	ses	msg_8uaegg	\N	welcome_email	user82@example.com	click	\N	2025-08-02 18:05:26.377
a4e66413-38bb-4789-9911-c87f035b789b	sendgrid	msg_34u7pi	\N	cancellation_notice_email	user73@example.com	processed	Invalid email	2025-08-05 15:08:03.011
f9fbcd72-1f16-4785-9a6f-d58ab6ba009e	sendgrid	msg_gnbj4	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user72@example.com	spamreport	Spam filter	2025-08-15 06:45:49.393
93e356e7-4370-4177-afc0-4e495e909927	ses	msg_gtt7vs	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user81@example.com	processed	\N	2025-08-08 08:06:05.826
69413882-8810-416c-9d07-f3d539b7c819	ses	msg_ps5d2o	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user40@example.com	processed	\N	2025-08-10 05:17:50.32
d2814735-1e47-45c0-92d3-fa025642cd5e	mailgun	msg_wlwi66	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user79@example.com	bounce	\N	2025-08-03 05:44:59.037
703b272c-dd1b-403a-8b5c-caeea387fb6f	ses	msg_4cjpl8	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user8@example.com	delivered	\N	2025-08-20 21:10:03.56
71a53118-2f32-4ebc-ae88-02b4d0f1cbff	sendgrid	msg_ufzxj9	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user22@example.com	bounce	Invalid email	2025-08-02 12:15:37.832
0f63a0fa-4448-4589-a3d0-4f5c575710a0	mailgun	msg_y46or	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user80@example.com	bounce	\N	2025-07-26 14:47:32.421
7536a69d-8101-4fcc-8124-67e3b5a21ea4	mailgun	msg_ucn6l9	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user5@example.com	delivered	\N	2025-08-10 09:03:36.27
1ad6176a-cfcc-428b-96ed-76e70a2f9249	mailgun	msg_o5f80za	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user0@example.com	spamreport	\N	2025-08-23 15:04:40.511
c18ec48a-7fe2-484c-a7b7-b6b065c1625e	sendgrid	msg_xts7eq	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user54@example.com	deferred	\N	2025-07-30 22:40:59.777
69d40718-e079-43bc-98e2-be29894d714a	sendgrid	msg_gdad56	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user97@example.com	open	Mailbox full	2025-08-16 01:46:01.335
42b66c97-6432-4f88-b70f-c786ab5c2dce	sendgrid	msg_d4k46qc	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user55@example.com	processed	\N	2025-08-04 12:05:45.548
ffefcb32-83f0-42c7-8874-bf41774e5064	mailgun	msg_lh9a1y	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user32@example.com	open	\N	2025-08-07 12:31:37.254
c964bae9-e193-4643-9bab-f16528444c38	mailgun	msg_fm02tm	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user5@example.com	spamreport	\N	2025-08-12 10:31:39.474
287314d8-7731-45e6-b7da-fbd795c39e93	mailgun	msg_1oiqfp	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user36@example.com	delivered	\N	2025-07-28 20:07:02.971
fb89630f-9660-4881-ab35-56eddb930cba	ses	msg_vh94pm	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user90@example.com	bounce	\N	2025-08-04 19:40:13.194
210e03b8-fc86-4464-8b0b-518eca3b1e01	mailgun	msg_6w69ph	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user73@example.com	delivered	\N	2025-08-07 11:56:52.973
3e34a35d-6852-4c19-be9a-ca203981858c	mailgun	msg_pr8oxt	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user26@example.com	deferred	Spam filter	2025-08-05 23:52:56.132
7e8760f3-5932-45f5-9669-41f3bd4ca656	sendgrid	msg_36zbjs	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user62@example.com	bounce	\N	2025-07-30 22:23:35.109
1e5d04da-96d1-41c0-8fba-975df3821929	mailgun	msg_2odp7	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user93@example.com	deferred	\N	2025-08-22 23:07:05.403
7a98a210-84bc-4f45-b7a6-50285bbe89cb	mailgun	msg_1k7exg	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user20@example.com	processed	Invalid email	2025-08-13 01:05:21.597
572d186f-9c32-4933-be8f-f50427f772d1	mailgun	msg_dvd52j	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user49@example.com	processed	\N	2025-08-23 00:44:53.162
898a3764-925b-40ce-81d9-3c25ebc1cec6	mailgun	msg_tnmc4g	\N	booking_reminder_email	user59@example.com	bounce	\N	2025-07-27 07:24:24.095
093d3ab0-569b-477f-9406-9fb03a5b46db	ses	msg_gics3	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user24@example.com	click	Spam filter	2025-08-22 20:24:10.857
ef94903d-4699-4ae3-9f8d-8b87ab88bb4f	mailgun	msg_4awkq9	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user32@example.com	delivered	\N	2025-08-08 16:09:46.942
d521b6e3-2565-48dd-8d41-cbe9b82f19d1	sendgrid	msg_tqp5xm	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user69@example.com	open	Invalid email	2025-08-03 04:40:21.924
e547d863-3a75-42d1-b03a-16adb918a5fa	ses	msg_k9dtv8	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user63@example.com	bounce	\N	2025-07-26 05:48:32.058
27d284cf-54ff-46e6-b908-22a92b0a6df3	mailgun	msg_77mb17	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user31@example.com	processed	\N	2025-08-02 17:17:34.656
3a4f6590-70be-4898-88cc-2986e736c6e9	ses	msg_y72fv	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user94@example.com	delivered	\N	2025-08-08 22:57:49.717
ce5d5a83-f082-4bf3-bce8-6b3a6a3bab42	sendgrid	msg_y87rjx	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user54@example.com	click	\N	2025-08-03 00:20:18.461
5f3374f4-8206-41a5-af0a-52a4157a4402	sendgrid	msg_rw85rp	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user42@example.com	deferred	Invalid email	2025-08-04 13:42:17.014
c9724075-d5a0-404d-9da3-e678d0d61d8c	mailgun	msg_udptla	\N	welcome_email	user40@example.com	dropped	Mailbox full	2025-08-19 05:20:55.501
55b39703-4666-4777-9617-b6f6e5650985	mailgun	msg_xkdkvf	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user45@example.com	delivered	Invalid email	2025-08-05 19:09:03.788
07f3c988-902b-478b-86f3-d6bc2d3d14a8	sendgrid	msg_3qnyif	\N	cancellation_notice_email	user95@example.com	dropped	Spam filter	2025-07-30 21:43:55.036
5643d05a-a152-4503-bf2d-14a9d63ebd9f	mailgun	msg_8ljx3s	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user95@example.com	spamreport	\N	2025-07-28 06:18:55.303
9cffef4a-3692-4e55-8c1f-7c78eaac9315	mailgun	msg_2ze70i	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user86@example.com	delivered	\N	2025-08-14 07:26:04.291
49bf195e-94d9-4ee6-8afb-794dc5493b9b	sendgrid	msg_v362sb	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user34@example.com	dropped	Mailbox full	2025-08-09 10:40:28.405
86a15903-3706-4ff0-b624-bdbf29bc5066	sendgrid	msg_f393sf	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user99@example.com	dropped	\N	2025-08-11 13:19:52.672
5bb441ef-0d78-4a1c-a468-931210fcdaee	sendgrid	msg_mowaf4	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user97@example.com	bounce	\N	2025-07-30 16:11:06.277
ce06f5cc-730e-4dc3-a61d-b5ca2bf7ba6b	ses	msg_d0umf	\N	password_reset	user28@example.com	delivered	\N	2025-08-22 12:44:53.752
be7dbf04-62d7-46e9-85db-e5d73f883ce5	sendgrid	msg_8rj9oo	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user3@example.com	deferred	\N	2025-07-29 19:47:21.938
171e9b58-9d84-4f6f-963a-6e2678d00ae6	mailgun	msg_cru3kd	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user94@example.com	click	\N	2025-08-23 07:37:00.67
ecdad53c-990a-40f6-bee0-adce90b78adb	ses	msg_iqmtvb	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user6@example.com	spamreport	\N	2025-08-16 06:35:58.42
bd336d98-6bfd-4b32-aafc-b3ba131f6051	mailgun	msg_nd84uk	\N	booking_reminder_email	user17@example.com	dropped	\N	2025-08-06 23:39:13.27
2ba706ec-d21f-4f3b-b17a-9af0b4ad96fa	mailgun	msg_xp6yvh	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user97@example.com	deferred	Invalid email	2025-08-02 16:10:14.801
464a6191-45a4-4954-8754-1ac52da1aa8d	mailgun	msg_y2le3m	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user51@example.com	dropped	\N	2025-08-22 06:31:49.044
9ffe9c75-3e19-4ea5-b07a-a6b389ca054a	mailgun	msg_t5lgsn	\N	payment_receipt	user97@example.com	dropped	Mailbox full	2025-07-25 09:22:06.87
a8ea61e1-bbed-448e-942e-0b8fd6de0b53	sendgrid	msg_1u7c5f	\N	booking_reminder_email	user4@example.com	click	\N	2025-08-06 21:12:23.455
3da53d9e-7156-40f4-826a-70c3e8a56312	mailgun	msg_pc6irf	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user20@example.com	delivered	\N	2025-08-19 03:21:56.302
12e6a504-99ac-464b-b407-10f39021c2b9	mailgun	msg_gqr3r5	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user71@example.com	click	\N	2025-08-05 05:34:33.09
9c476fe4-d7b9-4d12-b187-1e067122bd08	ses	msg_dretkv	\N	welcome_email	user94@example.com	dropped	\N	2025-08-03 17:57:38.845
64080464-15b2-4df0-9952-ef84b4960453	mailgun	msg_o5jo8zp	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user83@example.com	open	Mailbox full	2025-08-18 11:40:41.107
93a82ffd-a1ce-4c63-ae5c-f1755313583a	sendgrid	msg_65f2zx	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user47@example.com	click	\N	2025-08-06 17:47:17.555
009de818-694c-45d1-90d9-97a888702ef0	mailgun	msg_pr1z44	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user93@example.com	deferred	\N	2025-08-10 16:05:20.235
2883881c-e53f-4323-bf7d-6dda989b2c89	mailgun	msg_v4zgdp	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user23@example.com	dropped	\N	2025-08-05 04:25:49.611
bdffb26f-34ca-4065-a736-3285fd788af4	ses	msg_cdhg73	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user0@example.com	dropped	\N	2025-08-15 06:18:46.917
92900170-45d2-4083-8d03-46c2ce48e8ed	mailgun	msg_1r7jvw	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user56@example.com	delivered	\N	2025-08-02 01:33:00.171
186c2d97-e14b-435b-8b27-cc2b62e6cf28	sendgrid	msg_1ooc78	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user86@example.com	delivered	Spam filter	2025-07-28 13:13:05.971
b84c7742-dfd7-4baa-9df7-29288dc69a28	sendgrid	msg_nuwy02	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user37@example.com	click	\N	2025-08-17 00:13:45.988
ad0122b0-4e69-4bb0-8e55-7e04412fcf03	sendgrid	msg_giaz9v	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user74@example.com	deferred	\N	2025-08-02 00:24:13.893
7f345fc6-8749-4959-926e-29b0a4b61afc	ses	msg_hf5r3l	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user77@example.com	deferred	\N	2025-08-21 21:46:34.838
21770cff-2ab0-4cc1-b691-37d5b833f514	mailgun	msg_0ci85q	\N	welcome_email	user23@example.com	spamreport	\N	2025-08-05 19:08:58.474
b08ba5a4-659e-492d-8780-d563086b6f52	sendgrid	msg_n8nkze	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user5@example.com	open	Invalid email	2025-07-28 18:25:05.633
fe963bc0-ee62-494a-98fe-f9a9f4527c65	sendgrid	msg_l6m6q	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user15@example.com	dropped	\N	2025-08-03 00:53:32.12
d576416a-ab5f-4713-ae7f-32ce529a2a41	sendgrid	msg_kvy0f	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user35@example.com	spamreport	\N	2025-08-13 20:46:51.91
44f00fdf-9d41-4b55-a98e-a1ad4a75dd21	sendgrid	msg_8a16lk	\N	booking_confirmation	user53@example.com	click	Invalid email	2025-07-27 08:12:48.254
46f7eb41-32ba-443e-a1ff-66eb9d3cdfe8	mailgun	msg_8xyx9f	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user86@example.com	spamreport	\N	2025-08-08 21:02:33.81
d9b43fff-2ac6-4fe7-bd7e-cc3b1c04f345	ses	msg_x6o2q7	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user56@example.com	delivered	\N	2025-08-13 22:42:22.71
d35d69ed-f712-45ab-b23d-ebc3ca6b77fc	ses	msg_gwxnn8	\N	cancellation_notice_email	user84@example.com	deferred	Invalid email	2025-07-25 20:27:23.046
35773445-b117-4044-9397-fb959c6a1bea	ses	msg_jox5i	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user35@example.com	spamreport	Spam filter	2025-08-16 12:06:35.819
5b42a8f9-3e9b-4ae1-8c1a-1cfb5307beb8	mailgun	msg_vrh58v	\N	payment_receipt	user44@example.com	open	\N	2025-08-09 01:17:32.91
651f4594-da9c-4592-b6b3-9e5fb3253454	ses	msg_j73x7	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user59@example.com	dropped	\N	2025-08-04 13:12:58.552
9db59bdd-b3a6-4810-a3ff-7fab17fce319	sendgrid	msg_6gvlm	\N	cancellation_notice_email	user97@example.com	spamreport	\N	2025-08-17 04:16:23.693
2f3b2b3c-eb0d-417e-8a2c-a43edb9850cd	ses	msg_kyq78	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user98@example.com	deferred	\N	2025-08-08 05:42:49.065
2db6f821-e0e9-45be-aa8f-1b54191a3f76	ses	msg_ch5dde	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user8@example.com	deferred	\N	2025-07-30 21:10:10.379
ed3d0f1a-37ce-4c2f-bee4-c23aee53920d	ses	msg_khexec	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user87@example.com	click	\N	2025-08-12 03:56:37.265
936ef098-9ce0-413d-9c59-21625f9c3e43	ses	msg_bdzx0si	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user21@example.com	bounce	\N	2025-08-03 10:05:34.461
bc228ef7-245b-4bab-a98e-c98d3c33496e	mailgun	msg_fwctkg	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user60@example.com	spamreport	\N	2025-07-25 23:20:08.571
ce481412-1867-4952-bab5-5e453bf1416d	sendgrid	msg_u9eddv	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user44@example.com	processed	\N	2025-08-22 15:26:31.393
63210c65-e29d-4563-aaf7-c4a9b471d89e	ses	msg_vy88lo	\N	payment_receipt	user74@example.com	deferred	Mailbox full	2025-08-17 12:38:10.949
c3b71695-c70e-4728-acd5-c9a50e7e8f1f	ses	msg_mscilp	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user41@example.com	delivered	Invalid email	2025-08-08 14:34:51.086
8317ce87-bc91-45ea-9f12-b1fce77bce55	mailgun	msg_idmisa	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user79@example.com	open	Mailbox full	2025-07-31 14:08:48.412
054fd851-17fb-41f9-8a4c-e9ad7459a699	ses	msg_nyq5j2	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user61@example.com	click	\N	2025-08-20 23:10:49.884
488e25ea-f744-4d9a-8d71-f3cbca998e9c	ses	msg_j7why	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user80@example.com	open	\N	2025-08-15 05:04:42.629
4b41b703-5e62-40bc-887b-5ebf575bc61a	mailgun	msg_ryabaw	\N	welcome_email	user68@example.com	dropped	Spam filter	2025-08-18 19:12:33.601
1f4d662f-038e-42d7-b4de-17da02432036	ses	msg_oia9os	\N	booking_reminder_email	user19@example.com	deferred	Spam filter	2025-08-06 15:07:24.257
072e6ed2-ced5-4f49-bdb2-b0fc5b6471a8	mailgun	msg_57705d	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user7@example.com	processed	Spam filter	2025-08-17 17:11:15.085
04d57779-71ad-4c84-9d78-632631dbbbcf	mailgun	msg_b0drt9	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user10@example.com	deferred	\N	2025-07-30 23:25:25.318
66c70673-37ae-4cf9-9d63-a0ba8e5e103d	mailgun	msg_zqbqdq	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user57@example.com	delivered	Spam filter	2025-07-31 03:13:43.188
774460e7-8f3d-4107-bfef-ef078d58cf98	mailgun	msg_f4nzf	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user11@example.com	spamreport	\N	2025-08-05 07:03:08.487
432c72ae-8e23-4924-a358-b42e21cda17f	sendgrid	msg_mssds8	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user82@example.com	delivered	Spam filter	2025-08-07 23:42:57.585
177516e5-064e-4e82-be98-3dfd1a6d4369	sendgrid	msg_hr25xe	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user93@example.com	spamreport	Mailbox full	2025-08-11 19:57:52.036
fb3f1cf7-1007-4046-ab71-64cc9f4409f5	ses	msg_pvzb3d	\N	password_reset	user35@example.com	click	\N	2025-08-15 21:14:44.66
32efb41d-bf97-4b7d-83a5-6651287434b2	mailgun	msg_gcvaki	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user79@example.com	dropped	\N	2025-08-10 10:41:39.17
b8b654b7-f90c-454f-a10d-5cd1f0cdf61b	sendgrid	msg_e08glf	\N	booking_confirmation	user92@example.com	bounce	\N	2025-08-05 21:15:21.503
c71d0991-118c-4d12-afe7-fc3023fbcf50	mailgun	msg_rm5mqk	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user80@example.com	spamreport	\N	2025-07-25 03:56:29.059
dcc296ac-f5f9-4790-aee8-1e6a0959a14d	ses	msg_vohpzt	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user81@example.com	open	\N	2025-08-08 20:50:26.827
ec4590b4-0c0b-4884-9f38-4acc17d6b891	sendgrid	msg_lqxor	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user46@example.com	delivered	Invalid email	2025-07-30 01:41:50.847
50537411-a637-4c4f-ad72-6bf654affe0f	sendgrid	msg_a2u6m4	\N	payment_receipt	user13@example.com	delivered	\N	2025-08-08 19:12:27.577
4aa4045c-c061-4f40-ab9c-a7a88c8ddcae	ses	msg_aawqe6	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user53@example.com	processed	\N	2025-08-22 10:52:38.072
21212a9f-4333-4916-ace2-c628e6a9f081	mailgun	msg_esjtgf	\N	cancellation_notice_email	user54@example.com	bounce	\N	2025-08-04 17:32:49.228
fb350de5-9711-4ba1-a71e-415b0077de00	ses	msg_2y7sd7	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user87@example.com	processed	\N	2025-08-18 07:36:33.578
38c88c39-2022-4072-bc53-ffa1539d45e8	ses	msg_31ggdm	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user33@example.com	click	\N	2025-07-30 13:06:07.224
2f713417-791e-4a2f-b919-0420519ef611	sendgrid	msg_g5uav7	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user17@example.com	open	Invalid email	2025-08-11 01:01:04.04
0c710796-57a5-470e-b940-7beb8b0a66b0	ses	msg_z3o6bu	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user18@example.com	dropped	\N	2025-07-29 15:13:09.995
10b18aa1-a529-4374-b814-35bea037ad57	sendgrid	msg_wzx4lf	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user26@example.com	click	\N	2025-08-06 19:33:52.638
2de667d0-9693-4d53-870a-aeab3017f66e	ses	msg_jiwuby	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user57@example.com	processed	\N	2025-08-18 12:38:12.073
9f6ff369-9402-4f06-b6f9-db4541d9d23a	ses	msg_6tv4u7	\N	password_reset	user66@example.com	spamreport	Mailbox full	2025-07-25 07:24:10.235
8780a48b-8099-4957-9f88-ee031b5be3b3	ses	msg_1q090q	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user86@example.com	processed	\N	2025-08-07 21:58:13.088
21c4f52b-b330-4bc0-8a47-dd3c00744335	sendgrid	msg_eni33	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user42@example.com	open	Mailbox full	2025-08-22 12:44:53.773
0ddb592c-78c7-4be7-bbdf-4a89e70c9f35	sendgrid	msg_uwqku	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user18@example.com	deferred	\N	2025-08-18 20:33:37.11
9e3c22d9-a643-452b-9c9d-715635e3db5d	mailgun	msg_fcwwgd	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user63@example.com	processed	Mailbox full	2025-08-17 23:56:47.128
7d8b6c2b-297b-4c48-ac2c-397b868c8dd4	mailgun	msg_2qv7y8	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user39@example.com	dropped	\N	2025-08-18 17:46:20.667
6f7fd8ba-47ef-469e-a082-fe77a48debef	ses	msg_12ey73	\N	cancellation_notice_email	user41@example.com	dropped	Spam filter	2025-07-25 13:41:03.145
b307c11e-8824-4431-988e-15ebf51acd93	sendgrid	msg_ra2kf	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user84@example.com	open	Mailbox full	2025-08-11 03:14:50.943
fde01137-51b5-4c8a-8536-ee5f5b76566d	mailgun	msg_rt4ub	\N	welcome_email	user83@example.com	dropped	\N	2025-08-23 10:21:18.16
ff8caf51-c01e-4139-a259-ed99b99ad595	mailgun	msg_h3zlbo	\N	cancellation_notice_email	user67@example.com	spamreport	\N	2025-07-26 20:06:06.302
143ce646-c580-46bd-962e-55b618c300b8	mailgun	msg_ahex0p	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user77@example.com	click	\N	2025-08-21 22:46:17.549
fff895bf-79b3-4223-8731-b80926427faf	sendgrid	msg_ttvajs	\N	booking_confirmation	user55@example.com	spamreport	\N	2025-08-21 03:36:25.637
bca90f0f-da2a-45d1-ba44-db9520798300	ses	msg_8v7wfi	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user36@example.com	deferred	\N	2025-08-21 01:53:11.838
e2b2eb7e-2f3b-4a58-a0a6-dee3bf160dfc	ses	msg_jnd8k	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user72@example.com	spamreport	\N	2025-08-21 11:45:38.891
5882e4e1-3b6c-44a2-8e2f-22354563dc26	ses	msg_j77qis	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user91@example.com	bounce	\N	2025-08-04 05:29:03.619
ccfc625b-7b05-4cf7-b1fb-5be2c80fe563	sendgrid	msg_e8ydv	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user40@example.com	open	\N	2025-08-17 09:44:42.224
33c80ba9-46f4-4263-8e4b-0d119f097f16	ses	msg_vaglbp	\N	cancellation_notice_email	user94@example.com	deferred	Spam filter	2025-08-07 03:00:08.201
55f61dcd-e4ec-4d6d-818d-3ae768c82361	mailgun	msg_86mb1	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user51@example.com	spamreport	\N	2025-08-14 02:55:29.218
d1a3e579-50e5-4196-8b4a-9bc98a7bf8f8	mailgun	msg_x96yn8	\N	booking_confirmation	user50@example.com	processed	Invalid email	2025-08-03 20:55:18.935
e93869e9-6c9f-43c6-9cbc-cce5180fd7e0	mailgun	msg_gsf9rc	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user76@example.com	deferred	\N	2025-07-31 23:33:00.056
2fec4dd2-897b-4683-9b2c-1ebe8adb2bf0	mailgun	msg_4fqyjp	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user24@example.com	delivered	\N	2025-08-08 03:53:32.927
d929de1b-5698-4bba-92b2-1826d494be28	ses	msg_r6oy1m	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user96@example.com	spamreport	\N	2025-07-26 03:09:58.19
1336e35a-1629-4a10-a120-fe1c9f41cab7	ses	msg_7zi6yr	\N	password_reset	user31@example.com	deferred	\N	2025-08-06 03:38:29.952
12bd866c-fbdf-4298-843d-ba62d125cd73	mailgun	msg_q55tec	\N	booking_reminder_email	user60@example.com	delivered	\N	2025-08-04 23:04:41.432
3e4cab37-456a-40d3-a724-35d1c808c9b8	mailgun	msg_amvphc	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user65@example.com	bounce	\N	2025-08-14 04:31:20.573
fe036f83-94a3-4be6-a541-ce015fa54ac0	sendgrid	msg_n58i7l	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user49@example.com	spamreport	\N	2025-07-31 05:58:19.956
33ca8dd6-2880-46ee-87b5-8841c0f9ad30	mailgun	msg_yzob7n	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user77@example.com	delivered	Mailbox full	2025-07-27 22:36:40.457
ae0df4ed-765f-4ee3-9101-8ec22123cf7a	sendgrid	msg_qy6i6f	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user50@example.com	processed	\N	2025-07-31 12:24:42.236
33b5ce0c-7f9f-4b39-8a7b-ed75ed8763d6	sendgrid	msg_t0401m	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user83@example.com	open	\N	2025-08-15 19:02:14.877
dfad4467-5452-4e3a-b478-645d5fa86a33	sendgrid	msg_nem43f	\N	payment_receipt	user79@example.com	spamreport	\N	2025-07-31 07:16:56.257
fe295a47-210b-4c79-a8a8-bf6cbdb59827	mailgun	msg_szbdu	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user99@example.com	processed	Mailbox full	2025-08-23 09:59:18.194
c914eb6e-e46f-4b52-9e67-8e2044e539ab	ses	msg_u2rl0a	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user97@example.com	deferred	\N	2025-08-18 17:39:17.846
be1bf2f7-f5e2-42ac-b62e-ff6ed369b5ad	sendgrid	msg_1zkvuu9	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user83@example.com	processed	\N	2025-07-30 10:36:10.425
617abc8f-5e5f-4e8b-9a45-2c07955150b8	sendgrid	msg_gjecr2	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user79@example.com	open	\N	2025-08-20 15:05:47.947
b0afdf93-1206-4023-bf0c-4cb850d5d9f6	mailgun	msg_waqzf	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user53@example.com	dropped	\N	2025-07-31 12:20:27.586
4944ef5e-2d78-44eb-b853-b9afe0533ccc	ses	msg_w41c	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user60@example.com	dropped	\N	2025-08-13 16:58:39.873
6b2c83d8-3d9a-4924-8e61-74056ac1eb94	ses	msg_be0d8	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user70@example.com	spamreport	\N	2025-07-27 08:18:32.467
c0a814d7-d4ca-42f5-89c7-28265a0a8fbb	ses	msg_iz7h0k	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user84@example.com	delivered	\N	2025-08-11 17:34:06.752
5fd2efa2-a0b3-4ed3-8b78-1499db2f3eaa	sendgrid	msg_vsg4qa	\N	cancellation_notice_email	user77@example.com	click	\N	2025-08-01 02:38:09.685
8ceb2dc6-3866-4faf-992d-cb7a3aea6e38	mailgun	msg_ru88t	\N	welcome_email	user60@example.com	click	\N	2025-08-17 18:36:47.904
2719e1f4-010a-40ae-b0f6-8a0724e68dd9	mailgun	msg_2w6ddw	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user64@example.com	spamreport	\N	2025-08-17 02:04:23.572
06842f47-0399-422d-8c08-20b6321d4794	ses	msg_6b5zkb	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user74@example.com	dropped	\N	2025-08-04 23:25:34.327
055658d2-eb96-4160-a8db-202628aae003	sendgrid	msg_5skc59	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user54@example.com	dropped	\N	2025-08-02 13:05:24.703
8db48450-8b12-4da1-97a6-4887c3fcd171	mailgun	msg_c39lgw	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user15@example.com	processed	\N	2025-08-01 16:26:53.867
1e0fb0d7-462e-4102-9ade-589b73bb8d4d	sendgrid	msg_o2mw1w	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user97@example.com	delivered	Mailbox full	2025-07-25 17:40:23.895
c43668ce-e10c-4bc3-bc00-63c1529dc6b2	mailgun	msg_zyeae8	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user39@example.com	spamreport	\N	2025-08-20 03:42:40.098
6d6c8668-8156-4153-b31b-e6859542051b	ses	msg_fm3tsw	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user66@example.com	processed	\N	2025-08-02 21:19:31.784
2fe55c66-db77-4974-86bb-e0034b429cb0	mailgun	msg_blsf8p	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user71@example.com	click	\N	2025-08-12 13:59:43.581
2b024b34-c4ed-4869-9c3e-93f959294b60	ses	msg_qmlusn	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user19@example.com	delivered	Mailbox full	2025-08-18 09:11:03.553
852cb7ad-71f6-407c-8d77-bc001dc3024b	mailgun	msg_4pjcae	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user81@example.com	spamreport	\N	2025-08-21 04:19:46.942
7c846dcf-50b3-418d-abea-4b00406a494a	sendgrid	msg_obo9g	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user86@example.com	delivered	\N	2025-08-17 02:58:40.726
9b453c65-6c1c-4b40-b0fe-679533bc2e9b	mailgun	msg_3f7fpc	\N	booking_confirmation	user67@example.com	deferred	\N	2025-08-20 01:47:40.843
ef370ad3-eaf2-4eb3-8888-91d8e38b8347	ses	msg_l0z69n	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user7@example.com	spamreport	\N	2025-08-10 21:57:46.287
aa4e4fb1-e10c-45dc-bd29-2ec9e08bdecf	mailgun	msg_xaq3tf	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user47@example.com	click	\N	2025-08-01 14:19:06.78
b92c9ff9-6819-45c3-a1fc-1148aded2cdb	mailgun	msg_rr3dii	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user55@example.com	dropped	\N	2025-07-26 07:48:20.676
89ddfb17-f775-48f3-a7f4-24b584a67068	mailgun	msg_e8wk2	\N	booking_confirmation	user12@example.com	click	\N	2025-07-25 03:10:12.017
db3eaa2a-ab9e-448a-929d-0e8583d314d3	mailgun	msg_bjb63b	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user81@example.com	processed	\N	2025-08-06 23:57:19.014
1952aab7-e160-41e5-afa7-5ec3856357c2	ses	msg_iuee5g	\N	payment_receipt	user0@example.com	deferred	\N	2025-08-16 00:21:38.723
2cec9bab-ed94-4ec7-8524-a9635e557c31	ses	msg_rlk78m	\N	cancellation_notice_email	user73@example.com	processed	\N	2025-08-12 18:05:44.257
8f3cde98-34e7-445f-afc1-310477e6d7a2	sendgrid	msg_9chzg	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user54@example.com	delivered	Mailbox full	2025-07-28 06:23:54.943
98df6e37-5496-4192-83a6-0453f41462a7	mailgun	msg_12mnq6	\N	payment_receipt	user7@example.com	processed	\N	2025-08-15 22:00:25.671
a83d7dbb-f0c9-463c-bda0-eca7b8cfb550	mailgun	msg_dvzpa4	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user99@example.com	spamreport	\N	2025-08-01 21:53:49.796
2469a419-ea86-437f-850f-f32ac320979d	sendgrid	msg_6bb96c	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user20@example.com	spamreport	Mailbox full	2025-08-12 13:08:31.992
a97733bc-40ea-4bf9-a2a0-f1d6ba65245f	mailgun	msg_tw225q	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user73@example.com	processed	\N	2025-08-05 17:33:59.003
08484b94-468b-42ed-9f52-b6fc54903a4a	mailgun	msg_iu8r5q	\N	password_reset	user69@example.com	spamreport	\N	2025-08-09 08:09:47.881
8185e4ba-f653-4566-bb22-a33df02a1e04	ses	msg_oycuq5	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user5@example.com	deferred	Spam filter	2025-08-23 02:58:19.674
ba732c9f-103d-480f-804c-26ab64b715e3	sendgrid	msg_zidmes	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user13@example.com	bounce	\N	2025-07-30 18:05:58.706
a02d2fda-c34d-40ba-8f8a-8924ae896222	mailgun	msg_hlksr	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user22@example.com	open	Invalid email	2025-08-15 19:01:13.835
48aa1c67-d502-4a17-991c-2387e6f35e01	ses	msg_t9547g	\N	payment_receipt	user36@example.com	dropped	\N	2025-08-18 09:46:19.604
f08e226d-0331-45e8-8b3e-2c8205013243	sendgrid	msg_oxau9p	\N	booking_reminder_email	user60@example.com	spamreport	Invalid email	2025-07-28 00:58:50.904
aec21f8b-6ef3-4c81-a7b9-4c32a2c000ee	sendgrid	msg_5iwzrr	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user21@example.com	spamreport	Invalid email	2025-08-02 13:41:49.708
de1d2315-7174-4452-81a5-748531a1c30b	mailgun	msg_th1w3e	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user41@example.com	dropped	\N	2025-07-29 15:06:39.183
72151a2d-4570-4c14-8dc8-12d521db2df9	sendgrid	msg_rj3ih6s	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user87@example.com	click	\N	2025-08-08 21:13:03.812
5d9f0a86-32f7-4a1b-97f0-66212439bd95	ses	msg_54kjus	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user59@example.com	bounce	\N	2025-08-03 05:50:17.413
cde9fd14-fd0a-4d35-8c6f-6d1b2a7fe033	mailgun	msg_w56urh	\N	booking_reminder_email	user38@example.com	processed	\N	2025-08-19 13:39:52.179
ce1b3f49-0ed3-4398-8890-72ccc803c693	ses	msg_u2rdmk	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user64@example.com	processed	\N	2025-08-01 20:16:09.561
8fcf301e-295b-4611-87cf-be1fd0d6fa32	ses	msg_ou53wt	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user47@example.com	open	\N	2025-08-21 23:12:16.511
22b5791c-1ebc-45e0-8bdb-02b5015eeaad	sendgrid	msg_wsrzxr	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user45@example.com	open	\N	2025-08-07 06:33:02.868
0f1bbabe-d5be-4e7f-ae94-196f2bdb1973	ses	msg_5y1a0c	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user41@example.com	bounce	\N	2025-08-16 04:31:18.049
2e1d5f65-dedf-4988-aa17-a4f9016ddcd3	mailgun	msg_ll3rb	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user72@example.com	spamreport	\N	2025-08-22 12:41:32.643
f3ad6025-d527-4c80-bfa2-f17172cf6118	ses	msg_jtfy0g	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user89@example.com	dropped	\N	2025-08-10 23:31:22.072
bb605082-d610-48c6-9888-5a8d6ea9a8c5	mailgun	msg_tmc6u	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user25@example.com	deferred	\N	2025-08-02 23:15:36.048
0e30085f-e867-4fd7-8047-fbdd42eeeb49	sendgrid	msg_zc2k3	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user17@example.com	click	\N	2025-08-03 12:35:07.221
e99ab1df-92b9-4954-adb7-3e3b7177dc95	mailgun	msg_wwat0g	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user57@example.com	spamreport	\N	2025-08-11 18:23:54.987
bf621fe2-a717-4c6c-8057-62a531e1dc1e	mailgun	msg_v71il	\N	cancellation_notice_email	user11@example.com	dropped	\N	2025-08-14 16:38:19.791
e19e14dd-7489-4b36-b72b-6709222acf47	mailgun	msg_0mb4of	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user33@example.com	spamreport	\N	2025-08-14 01:56:16.898
77560f1b-b39f-430f-9b57-09a98efa93f2	mailgun	msg_frsf8f	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user91@example.com	deferred	Mailbox full	2025-08-17 22:56:01.009
07d5acf8-5803-4840-85a0-ff29d0d747b8	mailgun	msg_e8el9j	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user72@example.com	bounce	\N	2025-08-17 04:06:58.882
38bf12b0-66bd-4992-b36d-47f2967ae1e5	sendgrid	msg_cncj9f	\N	password_reset	user20@example.com	open	Spam filter	2025-08-19 04:14:29.876
dca851c2-2ae6-44dd-9857-92a1e2ddc512	mailgun	msg_u9pbay	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user58@example.com	bounce	\N	2025-07-27 15:21:57.786
4c511004-a2cd-4d4e-aeac-b1fa4174d3d0	sendgrid	msg_66z5b	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user28@example.com	bounce	\N	2025-08-11 13:17:34.446
c0dd518a-947a-4ce3-a7c0-bcba690a5979	mailgun	msg_q7phv	\N	booking_reminder_email	user85@example.com	spamreport	\N	2025-08-21 08:55:23.877
176e03cf-f596-4186-8857-8a8cd00093ff	ses	msg_60prgi	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user97@example.com	spamreport	\N	2025-07-28 21:30:35.69
d95cc1a8-f89c-4ca3-a18a-9077140bc888	ses	msg_b04ctf	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user74@example.com	dropped	\N	2025-07-28 08:42:48.962
ae82ba6a-0b9c-4080-9fcf-b148794ed6df	mailgun	msg_pb0iv6	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user72@example.com	dropped	\N	2025-07-27 12:51:16.598
db1789fd-830d-4693-8201-6c93d77fc128	mailgun	msg_0vtqnd	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user78@example.com	bounce	\N	2025-08-04 07:53:47.978
342d7e08-4a4c-4c0d-961f-a4ab2fbad325	ses	msg_vpb5c8	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user5@example.com	spamreport	\N	2025-08-13 09:27:23.287
f0cbbee8-c544-4fe0-93ac-34ee0d771a1e	sendgrid	msg_2fw7jj	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user87@example.com	bounce	Mailbox full	2025-08-13 18:59:23.231
d6c7a76c-51b3-46cd-a197-53667488ed14	sendgrid	msg_xvxq5r	\N	booking_confirmation	user80@example.com	delivered	Mailbox full	2025-08-23 14:56:08.014
484978b0-e7c8-402c-ade3-30de8b20871c	sendgrid	msg_h5b7ac	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user6@example.com	delivered	\N	2025-07-29 19:18:22.283
7f9e152b-c7b0-445e-8b32-90db94b5853c	sendgrid	msg_v2bbn8	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user3@example.com	dropped	\N	2025-08-15 16:21:54.068
61dbaf29-29aa-4edd-9dbb-16a330805214	mailgun	msg_zuezdi	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user64@example.com	open	\N	2025-07-31 03:29:54.803
d488eff9-c11a-43be-b772-37749c854944	mailgun	msg_59pwu	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user39@example.com	click	Spam filter	2025-08-17 10:15:35.449
fd288125-debb-49fa-8b99-ef5767de3379	mailgun	msg_egclf8	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user1@example.com	click	\N	2025-08-10 05:06:25.937
3c90292f-9a55-4b4c-9347-415edca1cb1f	sendgrid	msg_5mksq	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user72@example.com	processed	\N	2025-08-05 21:34:38.863
89647b75-5a1b-48f7-8d60-9cb50a8a3f05	mailgun	msg_0a2bc	\N	welcome_email	user21@example.com	click	\N	2025-08-11 19:12:58.115
47099d26-149e-4d9b-91a9-44e207baf2d8	ses	msg_ypzlec	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user49@example.com	bounce	\N	2025-08-08 15:42:27.947
95764dfd-e710-4049-9a56-2e8e59918886	ses	msg_1bz6qn	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user87@example.com	spamreport	\N	2025-07-29 12:54:50.523
e8edc536-af86-4e5c-a052-6fe921278b6c	mailgun	msg_hqffmr	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user2@example.com	delivered	\N	2025-07-30 16:54:50.912
7b1b5ed6-474c-4f07-b86f-947a6c7481aa	ses	msg_cggli6	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user17@example.com	bounce	\N	2025-08-03 06:54:09.775
40793752-8d1e-401d-ae18-fbf31f2bea90	ses	msg_gvz8m6	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user71@example.com	bounce	\N	2025-07-28 06:27:40.03
53c0053a-09e5-450b-a54a-4a87f34b9415	ses	msg_poi1ik	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user78@example.com	deferred	\N	2025-08-14 19:57:42.954
4e8c540a-0df2-4f0a-9678-4b63ad2a7a05	mailgun	msg_ej3p5	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user69@example.com	deferred	\N	2025-07-26 08:01:46.099
f01132b7-e301-483f-8fbe-c1cf12c92533	sendgrid	msg_gtln9	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user21@example.com	click	\N	2025-08-03 17:08:36.407
8b677771-ac8d-4c4b-bdbb-33cf07f1332e	ses	msg_k1h4ah	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user65@example.com	click	\N	2025-08-11 19:16:06.097
4fa1dabd-4f75-4157-9661-27ac07bc8c20	sendgrid	msg_igssea	\N	booking_reminder_email	user49@example.com	open	\N	2025-08-10 02:28:03.816
3c9f1398-b2c7-4f1b-a5d5-d98acd36a2a8	ses	msg_kofpk7	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user1@example.com	dropped	\N	2025-08-04 09:04:01.957
ecbf2279-82b2-4c78-aec4-4b8f7604a0ab	mailgun	msg_2bxwpd	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user70@example.com	processed	\N	2025-07-29 17:24:42.453
0f851589-8871-4c19-ba8f-b36b79d29a35	ses	msg_t3rqkt	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user55@example.com	spamreport	Invalid email	2025-07-25 02:59:28.854
ce344a80-2293-4141-b581-f35ddc6c0634	sendgrid	msg_4zpm8n	\N	booking_reminder_email	user57@example.com	deferred	\N	2025-07-28 14:36:01.634
e3593dae-845d-4a43-81c4-9f2d5382a19f	ses	msg_g4ep4	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user98@example.com	deferred	\N	2025-08-02 01:24:15.959
ca5268f7-7ed1-4410-85ac-78c10994adc4	sendgrid	msg_o0qoe	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user76@example.com	deferred	\N	2025-08-10 13:54:51.4
8834e8f1-49f8-40bc-a009-db00086e9596	sendgrid	msg_c5it1	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user46@example.com	spamreport	\N	2025-08-17 18:27:27.438
0d940862-c19a-4d4c-8d13-a0a988e62988	sendgrid	msg_umgqbi	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user90@example.com	dropped	\N	2025-07-31 13:34:21.951
4eea65df-9034-428c-882a-d2b80fd41aff	sendgrid	msg_wh5y8	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user84@example.com	open	Mailbox full	2025-08-18 23:41:31.892
736214e1-8220-4952-a54e-554ec506f4c7	mailgun	msg_pg3b2	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user38@example.com	bounce	\N	2025-07-29 09:06:50.979
48141144-4af1-42a1-8dbb-5643e5095f72	ses	msg_pkb3ji	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user80@example.com	deferred	Spam filter	2025-08-12 23:55:19.036
87bbd237-66a0-4423-928d-d075b2463190	ses	msg_1l65ml	\N	booking_confirmation	user54@example.com	delivered	\N	2025-08-23 18:48:29.605
24996f7c-7c8e-41b4-9e80-527c0e914412	sendgrid	msg_szb7xi	\N	password_reset	user29@example.com	delivered	\N	2025-08-18 01:08:29.145
74f2db41-0c01-4f2b-a2f2-adaf8a59187c	ses	msg_inubf8	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user21@example.com	click	Invalid email	2025-08-19 08:59:37.604
c1b9c64e-eb50-46ae-8b44-f867595bfa5b	mailgun	msg_ewjeb	\N	booking_reminder_email	user10@example.com	spamreport	\N	2025-08-07 15:47:42.77
d29b5946-4201-4cfe-9d65-f762a0deac8f	sendgrid	msg_1xp8ls	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user15@example.com	click	Invalid email	2025-08-21 11:19:05.237
72b544ed-ac61-40d3-8cb3-a6b71586fb51	sendgrid	msg_57poq4j	\N	booking_confirmation	user91@example.com	processed	Spam filter	2025-08-23 08:29:44.58
6b21211f-1e3f-4bef-9b50-88a9e9716a25	sendgrid	msg_zscikg	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user39@example.com	dropped	\N	2025-08-05 17:32:30.661
8386ebc8-e1f7-4043-98d8-b79ade6dd35a	mailgun	msg_a3d9z	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user83@example.com	delivered	\N	2025-08-23 03:40:27.588
e6597f46-fc81-4180-9465-948fe03fc8c8	ses	msg_q5c3x	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user76@example.com	spamreport	\N	2025-08-07 09:47:57.218
a0c1451b-840a-4333-baa7-ae457b42581f	mailgun	msg_hig87c	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user4@example.com	open	\N	2025-08-17 23:43:39.708
dd338f89-b61f-4c06-9f99-b55b7f793d30	sendgrid	msg_8fe0hj	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user45@example.com	bounce	Invalid email	2025-08-06 15:37:11.237
1708c27f-8e35-4f56-8f4e-e2bfc2cd0e26	ses	msg_n2bvmr	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user9@example.com	deferred	\N	2025-08-18 17:09:53.04
2f5fb73d-5406-408c-be12-0adb22399496	sendgrid	msg_3mfxpj	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user35@example.com	spamreport	\N	2025-08-04 03:08:39.952
0ee1730c-9916-429d-856c-73231a4d4a6f	mailgun	msg_ru688c	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user14@example.com	click	\N	2025-08-21 12:28:46.221
b8994600-3f64-47f0-bc32-c3c3cd692329	sendgrid	msg_8hpfd	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user35@example.com	bounce	\N	2025-08-07 03:36:36.779
8ff08c44-89c4-4ee5-9772-9cebcbb6910d	ses	msg_mi408n	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user80@example.com	delivered	\N	2025-07-30 09:55:39.546
8e8db26f-ded8-41c2-a9f1-8ea59be65e91	sendgrid	msg_533pc	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user59@example.com	click	\N	2025-08-15 04:50:33.373
2ff05137-5c31-4331-9ac3-be7ee7d4c9c3	mailgun	msg_r63zto	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user47@example.com	bounce	\N	2025-08-23 03:30:31.79
c403b091-6699-441d-b7e2-89e7b1df5225	mailgun	msg_5g9yp	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user91@example.com	dropped	\N	2025-08-21 15:20:20.542
f8154368-4e01-40c8-808a-60ea88814d97	sendgrid	msg_rj75p	\N	booking_confirmation	user39@example.com	delivered	\N	2025-07-30 17:28:38.968
6dda0d5f-1e90-4982-b433-e0ba4e01b1bb	sendgrid	msg_dzlu0s	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user35@example.com	open	\N	2025-08-10 19:05:51.771
047e39e7-5fcc-449b-9af9-a93db6dc38ad	sendgrid	msg_bfryka	\N	booking_confirmation	user50@example.com	delivered	\N	2025-08-13 04:19:11.152
ac329e5f-4b45-4603-a3a4-a843cca0a5eb	sendgrid	msg_uthh9w	\N	payment_receipt	user16@example.com	dropped	Spam filter	2025-07-29 19:06:17.343
a4a3b0f9-5b0b-4d29-b082-ee8c952dbda4	ses	msg_zf8o0m	\N	booking_confirmation	user22@example.com	spamreport	\N	2025-07-26 01:18:03.28
95a399cf-efab-4e1e-9546-8ff71a944972	ses	msg_374qzm	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user58@example.com	dropped	\N	2025-08-09 01:37:07.975
6c9d2f92-cceb-451c-9a20-03862b4f1e01	mailgun	msg_lydbpr	\N	booking_confirmation	user99@example.com	open	\N	2025-08-18 05:33:35.345
92540901-944a-4d61-a111-b0f7b69fb87e	sendgrid	msg_ruptu	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user25@example.com	spamreport	\N	2025-07-26 01:49:41.254
9fcfee9d-04f2-4fc0-8023-92d3b9d89cf1	ses	msg_tsczve	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user92@example.com	processed	\N	2025-07-31 12:39:35.188
302d7e53-9775-4111-9041-048e8c897a89	mailgun	msg_787i5j	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user11@example.com	bounce	Mailbox full	2025-07-25 12:21:45.957
daa9c02f-8c99-42a4-aab2-5b55fa2d78d9	mailgun	msg_evvx	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user68@example.com	spamreport	\N	2025-07-31 10:30:00.358
a1308155-30f7-4d77-a6d6-e7cfc37baaf2	mailgun	msg_r3o2yu	\N	booking_confirmation	user30@example.com	processed	\N	2025-08-09 11:40:41.369
a1f1c640-2c32-4c92-b770-08beb5f3975a	ses	msg_1j7v5	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user81@example.com	delivered	Spam filter	2025-08-12 15:32:23.072
e1deab4d-2445-4a1d-80d8-6e675d4bf6fe	ses	msg_1rj6qq	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user8@example.com	spamreport	Invalid email	2025-08-22 06:22:30.65
f4e323a0-eebf-480d-8182-e58abdfae431	mailgun	msg_bourie	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user2@example.com	click	\N	2025-08-20 19:03:08.609
cd9fc4e3-e7fe-4819-8c43-f02917eb1874	mailgun	msg_b0rs4s	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user16@example.com	open	\N	2025-07-28 02:13:05.327
a22d7743-c413-4af5-8352-df687fc9f9cb	ses	msg_p29bqo	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user97@example.com	dropped	Invalid email	2025-08-17 04:49:27.209
5352fc43-5539-4b2c-bdce-4986629a26dc	mailgun	msg_hg6oed	\N	booking_confirmation	user73@example.com	click	\N	2025-08-03 13:41:36.784
14127f9d-9382-4abd-a984-25c23ff1d0ab	ses	msg_3h7bpsi	\N	password_reset	user72@example.com	processed	\N	2025-08-23 20:08:54.704
23d506d4-7eb0-4866-8ce2-40734fef82f5	mailgun	msg_c3d0ar	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user52@example.com	bounce	\N	2025-08-14 03:15:01.148
02fcd0a9-cf57-4031-ba9a-0604dec6c278	mailgun	msg_s7o31	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user51@example.com	bounce	Spam filter	2025-07-29 01:30:29.917
2c83bf9d-240f-4e0f-81ba-279e109e0de3	ses	msg_ewchso	\N	password_reset	user40@example.com	deferred	Spam filter	2025-07-28 15:59:58.58
dfdf86a7-9a4d-458d-a0a3-39d8e0adfc54	sendgrid	msg_j25e8m	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user33@example.com	bounce	\N	2025-08-08 15:32:00.55
035212f8-1ccb-436e-b9eb-7a9a0de703f2	sendgrid	msg_cdyjw	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user10@example.com	spamreport	\N	2025-08-09 06:27:41.678
48ca83ed-5971-4205-82b2-57ff6da2da2c	ses	msg_khjnk	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user17@example.com	spamreport	\N	2025-08-11 17:11:22.904
51bd439d-220c-44be-ae0f-506867ee1314	mailgun	msg_0r6olf	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user58@example.com	delivered	\N	2025-08-03 02:38:16.289
7e8a0f17-f76f-49a0-b114-d7d6063f283f	mailgun	msg_fhwjup	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user9@example.com	dropped	\N	2025-07-31 21:23:45.206
91fb99c6-2304-475d-b80a-c53526d2e32e	sendgrid	msg_pve1oa	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user10@example.com	dropped	Invalid email	2025-07-30 15:10:41.64
71aca13b-227c-4347-9e0a-c03a5f35ac01	ses	msg_82k8zr	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user89@example.com	processed	\N	2025-08-04 10:37:46.673
9ded9c30-490d-4d92-9eb1-e44f3f29ea38	mailgun	msg_bamxrs	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user20@example.com	dropped	\N	2025-08-22 05:36:28.566
79c78a69-336f-4592-8233-2cdb86d1bdf4	mailgun	msg_oxldg9	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user21@example.com	processed	\N	2025-08-13 15:01:46.916
24cec721-744d-49e1-a4f5-51806e7fe5c0	mailgun	msg_lpc3o4	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user56@example.com	dropped	Mailbox full	2025-07-31 15:41:08.692
e7c478f7-d100-4c5b-8fea-95df7ad3a7db	mailgun	msg_1hu049	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user64@example.com	open	Spam filter	2025-08-23 03:33:27.241
1f61df75-790c-43ac-a865-e617c44948b0	sendgrid	msg_o30n6p	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user42@example.com	bounce	\N	2025-08-14 18:08:49.307
a3dcca54-ee2d-4968-99f3-fe627e2cb647	mailgun	msg_cis38	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user20@example.com	bounce	\N	2025-08-19 17:44:48.472
72eb416e-a30c-4dfb-b6f4-a2cac8f49f6c	ses	msg_w7endg	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user15@example.com	open	Spam filter	2025-08-09 11:16:23.829
ca866a9a-e27c-420a-98a7-d1abcdc50d20	ses	msg_uk56ic	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user47@example.com	delivered	\N	2025-08-23 13:50:15.665
afeb7911-de77-4dd8-b2aa-2965e1e287f3	mailgun	msg_ig64v	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user94@example.com	delivered	\N	2025-08-19 18:50:50.548
96e17159-994d-483f-9e56-a2b6ee4392b4	sendgrid	msg_mmlo6n	\N	cancellation_notice_email	user95@example.com	deferred	\N	2025-08-17 01:11:28.999
9207a267-58c6-4101-a0b1-16fef9b24a72	ses	msg_r8frh	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user27@example.com	open	\N	2025-08-05 17:29:55
ae986ac3-0eea-4af4-8d7a-16549153e3d6	sendgrid	msg_o8bgc	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user34@example.com	delivered	\N	2025-08-09 22:14:20.476
5ddc1819-f810-4b26-a41b-f0834131f876	ses	msg_ndejzs	\N	cancellation_notice_email	user94@example.com	spamreport	Spam filter	2025-08-07 15:10:30.433
42056610-80e9-4118-9bd6-ae2cb9b59c46	mailgun	msg_2o3nq9	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user81@example.com	open	Spam filter	2025-08-16 21:38:31.745
58e18922-cdaa-4c17-a0cc-e4d95a461fc4	mailgun	msg_lut56q	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user52@example.com	dropped	\N	2025-08-08 10:23:28.034
aed80692-2ca1-4b6c-9b6b-092837b52123	ses	msg_ir0w4	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user12@example.com	dropped	\N	2025-08-09 02:05:36.93
ea4df00e-fa35-466d-9d88-1f4304b49a18	mailgun	msg_rmjrqt	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user49@example.com	processed	\N	2025-08-07 17:43:19.846
447dd016-e09b-404d-9b50-c838b20213e3	ses	msg_invztm	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user24@example.com	spamreport	Mailbox full	2025-08-14 21:27:25.411
14bb56c6-9254-405b-a5a7-a45069afa537	ses	msg_6z326t	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user65@example.com	click	\N	2025-08-21 03:10:44.356
296bd96d-f629-4967-baca-6525edb72a61	ses	msg_sxp0cc	\N	booking_reminder_email	user25@example.com	dropped	Invalid email	2025-08-22 16:25:43.243
a2a5dea0-1890-4719-800c-b611e3fc9272	sendgrid	msg_9e1q5a	\N	booking_reminder_email	user10@example.com	deferred	\N	2025-08-09 12:31:16.059
f953883d-700f-4e0b-b50d-88cd5a478bf8	mailgun	msg_i857s	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user7@example.com	dropped	\N	2025-08-09 21:23:04.284
2a4a13b0-6805-479c-84de-e634be79f1e9	mailgun	msg_s582yi	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user1@example.com	processed	Mailbox full	2025-08-10 00:29:39.46
18463dbb-0881-4633-8313-c95f84fd60ce	ses	msg_wcac3l	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user58@example.com	bounce	\N	2025-08-09 08:29:30.358
cd560227-b1a6-4895-9390-f2af67f3247a	ses	msg_xmv31j	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user87@example.com	bounce	\N	2025-08-19 01:53:54.431
6c3663e1-0550-4b82-93c9-fcec1da41f15	mailgun	msg_i6d44	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user99@example.com	dropped	\N	2025-08-20 18:47:14.861
bd5503b2-34d7-4191-849d-ad240d7e707f	ses	msg_cdlbhc	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user89@example.com	click	Invalid email	2025-08-03 02:22:06.229
c90c6bf3-5f7f-483c-b13e-d57337e1c1f6	sendgrid	msg_r5fp8n	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user90@example.com	spamreport	\N	2025-08-19 07:41:52.458
fc08e912-037e-4d5d-ae0a-7e5693ab8552	sendgrid	msg_my0m7p	\N	booking_reminder_email	user89@example.com	click	\N	2025-08-06 18:01:16.075
60bf985e-bba5-4d2a-a550-de25d4042749	sendgrid	msg_u5gulo	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user33@example.com	dropped	\N	2025-07-30 19:30:24.027
61b22313-4dff-4c2c-8a37-7401dd2aab8b	mailgun	msg_kbt3q8	\N	booking_confirmation	user0@example.com	spamreport	Spam filter	2025-08-17 00:37:21.058
a37b16df-20ea-4c71-9d52-763e5091ead4	ses	msg_b45npc	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user81@example.com	delivered	Invalid email	2025-08-13 18:10:50.085
c5d91ef4-aa8b-435f-8539-d8abdb486ec5	sendgrid	msg_r8upqa	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user7@example.com	dropped	\N	2025-07-30 14:38:31.391
eb625667-667f-4b2c-a666-bd609354910b	sendgrid	msg_1bd0s8	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user40@example.com	open	Mailbox full	2025-08-16 19:36:05.714
dd101b4d-70a3-40a1-9e1a-e7277649181f	mailgun	msg_dmjoxl	\N	password_reset	user85@example.com	delivered	\N	2025-07-25 02:49:54.146
045e665a-1235-45e7-94a2-b4d8246906e0	ses	msg_6uv9ht	\N	cancellation_notice_email	user48@example.com	bounce	\N	2025-08-07 15:52:31.505
0cdc1b41-119f-4d05-8416-9057f844bed2	mailgun	msg_jdpx9j	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user61@example.com	open	\N	2025-08-05 02:57:10.92
8297271b-812e-4d2f-8c75-cf050723ce2a	ses	msg_3jxwv	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user73@example.com	dropped	\N	2025-08-23 18:02:21.245
38ee9fd9-9487-4c5e-9280-757e7483c504	sendgrid	msg_1qhwdm	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user20@example.com	open	\N	2025-08-09 19:32:45.935
9cac1761-02db-46a0-83d6-ecd2e71f1287	sendgrid	msg_1b40p8	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user53@example.com	dropped	\N	2025-08-08 14:49:56.731
da92fbcd-2fb3-484e-a606-0fd083cca41a	sendgrid	msg_v4bii	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user17@example.com	spamreport	\N	2025-07-26 15:09:56.25
f484cf2a-fbcb-4ca4-a99f-d927689df15d	sendgrid	msg_gsupur	\N	welcome_email	user0@example.com	dropped	\N	2025-08-11 09:10:44.999
9d237e0a-cba4-496e-9027-ddfd5c5050ce	mailgun	msg_i7jdp	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user83@example.com	deferred	\N	2025-08-10 02:25:34.863
14bd216d-c327-414e-8a19-48ee40207583	ses	msg_co9ppq	\N	welcome_email	user73@example.com	click	Spam filter	2025-08-15 18:15:03.359
8b32f78a-2e87-4332-b71f-cd17f0c8acd7	sendgrid	msg_5he1g	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user67@example.com	deferred	\N	2025-08-10 13:27:51.426
bc4d06ec-d56f-4f07-b253-410107736761	ses	msg_ltc6s8	\N	cancellation_notice_email	user68@example.com	open	\N	2025-08-22 18:44:10.869
f11bb47f-6a4a-4162-b461-c41b47d3a04b	ses	msg_6edsh	\N	booking_confirmation	user80@example.com	delivered	\N	2025-08-23 09:54:50.26
ce5c90e0-3e75-4aee-bd39-c48c736b3910	mailgun	msg_780j3	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user29@example.com	bounce	Spam filter	2025-07-29 16:57:36.625
00dd944b-a01b-44b2-bc01-1d04e129bfed	ses	msg_wroaul	\N	booking_reminder_email	user12@example.com	processed	\N	2025-07-27 18:07:24.49
7aca0f8d-be03-4c22-9150-e6285e124790	mailgun	msg_gnczw	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user88@example.com	bounce	\N	2025-07-30 11:40:48.652
311c2b75-f3b1-44a1-a480-e8076678367c	ses	msg_bz0xwi	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user25@example.com	bounce	\N	2025-08-01 00:36:39.473
9cff49a0-d184-4967-9951-1d89abf46436	mailgun	msg_zp8s6	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user61@example.com	processed	Spam filter	2025-08-18 09:56:37.554
ebeafa3e-3eeb-4c45-b939-b5cd17e003a0	mailgun	msg_pkinu5	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user17@example.com	deferred	\N	2025-08-21 13:35:22.59
0742449a-62bd-4f09-b1a1-4457dcfcfa6c	ses	msg_sqr1gw	\N	booking_reminder_email	user53@example.com	processed	\N	2025-08-16 18:40:29.837
6d3f0789-1977-4bf3-b60d-600650eedde1	ses	msg_5b9are	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user42@example.com	spamreport	\N	2025-08-23 02:43:15.276
4d356222-b277-4795-8d63-28b6d718f705	ses	msg_b7e88p	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user4@example.com	delivered	Mailbox full	2025-08-21 10:30:02.911
48bbade2-df9b-4a77-a980-a75deb98b3b4	sendgrid	msg_4ydoos	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user84@example.com	dropped	\N	2025-07-27 03:41:24.817
1fb0ba47-9d6b-49a7-8897-8b541de7ce52	mailgun	msg_o7s7lq	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user59@example.com	click	\N	2025-08-14 08:01:27.773
664bb45c-0636-4a13-ba2b-cc04a92c3caf	sendgrid	msg_1ju00s	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user93@example.com	dropped	\N	2025-07-26 06:26:55.983
e092417b-8945-4141-b8d9-b44a02b65fd7	mailgun	msg_pg7d0n	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user25@example.com	bounce	Mailbox full	2025-08-19 20:01:17.843
319c975c-1d7f-424b-91a6-9709b1f59acb	mailgun	msg_85qou	\N	cancellation_notice_email	user52@example.com	deferred	Spam filter	2025-08-14 02:23:59.656
476718b5-8644-4110-b002-63ec4717ff40	ses	msg_kfc70m	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user80@example.com	deferred	\N	2025-08-23 08:44:16.963
24c0ab68-a9a3-4e6f-981e-9317b5cd3ace	mailgun	msg_2arzub	\N	payment_receipt	user58@example.com	processed	\N	2025-08-05 07:25:47.61
8656d3a0-adf8-404d-a010-86dab6e72688	ses	msg_ikvcvu	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user36@example.com	processed	\N	2025-08-22 02:04:54.067
eb2c05f5-3ddb-492d-bc0e-ab764a6e7e67	ses	msg_bbjt7e	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user97@example.com	open	Mailbox full	2025-08-01 10:10:35.488
c5c070b4-fb3a-4081-a3e6-3dbf9128e5ce	mailgun	msg_2apiwe	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user59@example.com	delivered	Mailbox full	2025-08-03 09:54:34.654
25b085ce-0abc-42c7-805d-359981c487be	mailgun	msg_pzlyjp	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user96@example.com	click	\N	2025-08-21 21:27:27.436
4dacec79-b8f1-450c-81fb-12337a315ae8	sendgrid	msg_xr0hz	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user83@example.com	deferred	\N	2025-08-03 01:57:59.699
bb865a77-d9a1-44e2-b0dc-3691c3a626dc	mailgun	msg_12e9j9	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user23@example.com	click	Mailbox full	2025-08-22 02:11:33.996
06e83bf7-2e7f-4926-a15c-59162e6a9282	mailgun	msg_4btnvh	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user13@example.com	bounce	\N	2025-08-21 03:08:43.69
aacf6e99-c099-4456-b0a6-0694cff5dbf4	mailgun	msg_147nxr	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user23@example.com	spamreport	Invalid email	2025-08-23 08:15:01.733
6f1e11e2-cdc5-4661-8774-91790e6fd237	ses	msg_ffw8x	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user15@example.com	spamreport	\N	2025-08-18 17:08:01.876
585e1fd3-0649-4bb5-a3c2-45f0df76bbdb	mailgun	msg_ijzhhc	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user65@example.com	processed	Invalid email	2025-07-28 01:59:03.275
85e4ab93-9252-4956-84a5-9eabdffc18f7	sendgrid	msg_sepo5e	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user95@example.com	deferred	\N	2025-07-29 13:35:37.497
1e9b6555-958f-49c7-a3a7-f6c4dc4011f9	ses	msg_3yj4pp	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user19@example.com	open	\N	2025-08-09 01:25:47.087
6c0e89ec-a7a3-4691-a8d6-ba0c61186f06	sendgrid	msg_hhwnxu	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user93@example.com	bounce	\N	2025-07-30 09:04:46.24
0a6b2eea-0bec-4f17-a18f-9c0452e172f0	mailgun	msg_mu0c99	\N	booking_confirmation	user94@example.com	bounce	\N	2025-08-13 07:15:56.395
cfacc6a6-29de-4dc7-975d-a64acc2697ad	ses	msg_d0d54a	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user55@example.com	delivered	Spam filter	2025-08-18 02:15:18.934
9785238f-2331-49f6-90c5-7f7bc83fe41f	mailgun	msg_u0hio8	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user52@example.com	dropped	\N	2025-08-22 18:36:18.109
2b182713-5528-4f36-990c-703b12f9399b	sendgrid	msg_8nqtgj	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user64@example.com	delivered	\N	2025-08-16 07:55:36.994
a64452de-d270-4d76-acd6-83b96243c9b0	sendgrid	msg_34dw8n	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user82@example.com	processed	\N	2025-07-25 06:59:58.483
8f0fc8bd-a9ef-4e41-9d7e-40a8e47c144e	sendgrid	msg_q355lqd	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user83@example.com	dropped	\N	2025-08-08 06:19:45.216
8d71a0ac-34f9-46d2-9e1b-235f5aa10edc	sendgrid	msg_j45xm	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user40@example.com	deferred	\N	2025-07-27 11:28:18.469
6e851913-3da5-451a-9d9e-a2e07d173152	mailgun	msg_1vdzo	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user34@example.com	open	\N	2025-07-30 05:59:21.047
be8bd3ca-3046-4c20-b274-dcdf61182518	sendgrid	msg_eik4qe	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user48@example.com	dropped	\N	2025-08-05 05:23:14.223
4e2f3bd2-a39f-4908-a549-f67059914bc7	mailgun	msg_aswvsp	\N	booking_confirmation	user40@example.com	bounce	\N	2025-07-30 14:21:49.934
4c61b02a-85b8-42ba-8c0d-e191b005b6d8	sendgrid	msg_6wo7a	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user19@example.com	bounce	Invalid email	2025-07-26 11:03:18.968
b73aa84b-c5be-4d79-a8d3-82303013307d	sendgrid	msg_n175ho	\N	cancellation_notice_email	user68@example.com	dropped	\N	2025-08-12 09:14:48.914
40d01ae2-39e4-4efb-a125-fae91fc0db37	ses	msg_d76mhn	\N	booking_confirmation	user68@example.com	deferred	\N	2025-08-15 02:27:48.377
031a5141-8d9d-4b24-acb7-41e2da323aea	sendgrid	msg_a34e9	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user8@example.com	delivered	Invalid email	2025-07-29 23:44:35.013
f27774b3-62cc-4d49-b64b-21923ae9cf90	mailgun	msg_htnvi	\N	welcome_email	user94@example.com	bounce	\N	2025-08-03 02:37:00.211
b1647f9e-e3e9-47bb-a426-50df18bb58f7	mailgun	msg_9o5cuc	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user28@example.com	open	\N	2025-08-20 09:31:36.396
39acaa6a-dd4a-42c2-b11f-8bb8975c80b8	ses	msg_vtzn9f	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user29@example.com	spamreport	Spam filter	2025-08-13 05:13:25.282
35fcd2c8-1516-43a4-af48-94a220560793	mailgun	msg_alw1kn	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user90@example.com	bounce	\N	2025-08-07 21:56:46.669
f3f5a102-7f94-4d5e-a545-da7a4179fd5d	mailgun	msg_x18dfo	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user70@example.com	dropped	\N	2025-08-13 23:13:46.534
da941cb2-e676-4214-bd0a-2ee3f481cb2a	sendgrid	msg_eb6pcp	\N	welcome_email	user66@example.com	open	\N	2025-08-12 02:19:37.109
dcc8df9a-f4b3-4421-82ff-0ae8f0e2e23a	ses	msg_wqzwx	\N	payment_receipt	user12@example.com	open	\N	2025-08-20 01:24:01.438
2fda4bd4-66bb-463c-9a6a-a9b946a16948	mailgun	msg_ytnf9i	\N	password_reset	user63@example.com	processed	\N	2025-08-08 00:51:56.608
bb050307-da5b-46a1-b3c8-aaaf2b46deef	ses	msg_8x1loh	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user56@example.com	click	Invalid email	2025-08-08 21:55:12.237
aafc3450-efb9-4652-9b1c-f587845e8125	mailgun	msg_54hlx	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user58@example.com	delivered	Invalid email	2025-08-23 00:20:44.097
bc9979a4-5436-4410-bb3a-551aa1ff05b0	mailgun	msg_jm5m2j	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user33@example.com	dropped	\N	2025-08-11 19:49:35.079
4e15b503-c403-47b6-9f79-08fd7a99f98f	mailgun	msg_cp6awn	\N	cancellation_notice_email	user25@example.com	delivered	\N	2025-08-08 17:10:21.786
5a1b01b6-98fa-428d-88dd-e5a836e829b4	sendgrid	msg_hxaj4	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user34@example.com	click	\N	2025-08-12 00:00:45.791
f4631b28-7c27-4731-96bb-df862ff4549a	sendgrid	msg_7vysfv	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user69@example.com	click	Spam filter	2025-08-21 15:03:41.157
4be229a3-3582-4e06-afa4-547760aab101	ses	msg_lt4zpi	\N	welcome_email	user22@example.com	bounce	\N	2025-08-18 19:30:15.006
d247e807-9ea0-472e-a03a-56adf53457ef	ses	msg_jdhb4o	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user72@example.com	bounce	\N	2025-08-05 06:44:19.966
211afb71-e12e-4a0e-84e4-b24f3ecfd9dc	sendgrid	msg_cqrfi8	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user56@example.com	dropped	Mailbox full	2025-08-10 00:32:12.882
08ceff53-b594-4019-a245-646c98edc16e	ses	msg_9i2rnk	\N	cancellation_notice_email	user19@example.com	processed	Invalid email	2025-07-26 03:36:49.393
1cd9940a-8f26-4176-b082-9bee98fd13cb	ses	msg_1g4cli	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user66@example.com	bounce	Mailbox full	2025-07-31 08:46:19.368
7ab99f7e-1780-4a45-ae1f-f073afea7772	ses	msg_t1zxrd	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user80@example.com	spamreport	\N	2025-08-08 21:39:41.019
86af5dea-f05d-4792-8e09-ddf107971860	sendgrid	msg_4j1akc	\N	welcome_email	user89@example.com	delivered	Mailbox full	2025-08-19 06:09:15.383
246665a4-2f2c-4a1b-b835-38cc52595973	mailgun	msg_jup5wq	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user37@example.com	click	\N	2025-08-20 18:00:19.277
bb8d6280-14c1-481f-9c84-3ad595fab9c6	mailgun	msg_7ope0c	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user79@example.com	open	\N	2025-08-16 14:38:24.598
696725ba-e7cc-4a1a-ad8b-21ecde1e8951	sendgrid	msg_mhb5l8	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user87@example.com	processed	Invalid email	2025-08-20 23:44:16.147
0e8c6555-6bb6-4009-a600-7dfd4fe8b26c	ses	msg_qydcmm	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user72@example.com	spamreport	\N	2025-08-12 20:25:30.417
7bd41ee1-f97a-4fdc-a476-1116b738bec6	mailgun	msg_hpjdj	\N	payment_receipt	user10@example.com	click	\N	2025-08-20 13:08:04.097
ea5f4605-b28e-4d0d-a172-e024c2bd067a	ses	msg_6z11po	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user84@example.com	spamreport	\N	2025-08-10 21:22:26.862
43e9932e-a24c-464b-92f2-ddd6d6de4aa3	mailgun	msg_j1zbps	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user82@example.com	click	\N	2025-08-08 04:49:06.39
c25b86e8-b3a6-4c79-9a94-6a23259e42fc	mailgun	msg_n67lkj	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user60@example.com	bounce	\N	2025-08-03 04:45:04.312
dda9cfbe-6887-4246-b6f0-2ba29bdba726	sendgrid	msg_c7ghrb	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user0@example.com	processed	Invalid email	2025-08-19 21:05:43.924
c622d899-ab48-4883-8128-effb88b1aed1	sendgrid	msg_zct7xf	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user24@example.com	click	\N	2025-08-19 14:38:26.579
0b5a5d2e-b11b-4ebb-92b3-601d698dad77	sendgrid	msg_kawxdk	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user43@example.com	click	\N	2025-08-14 05:57:19.251
8238c686-ab69-44e0-b405-c04e6710bd25	mailgun	msg_tz09z	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user7@example.com	deferred	\N	2025-07-27 10:46:35.843
a1449a3d-ad57-4477-a864-51de79a3d64f	ses	msg_pe629k	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user65@example.com	open	\N	2025-08-09 16:06:49.452
d0963d9c-6e74-426b-aa5c-111860607524	ses	msg_8c1qa4	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user99@example.com	dropped	\N	2025-08-08 02:58:09.898
bcde30ca-8667-49e6-9132-49b54e4f4a19	mailgun	msg_pgllqd	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user96@example.com	deferred	\N	2025-08-19 11:24:11.93
fb901288-62fb-47bf-b335-877e8b053062	ses	msg_8udp7l	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user44@example.com	click	\N	2025-08-21 01:01:48.163
bd750226-8af5-46bf-88c4-6af86549d2fe	mailgun	msg_kk65g5	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user42@example.com	open	\N	2025-08-08 11:34:51.252
5df0f85b-2977-442e-bd60-5ff6dc400c78	ses	msg_m695le	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user98@example.com	delivered	\N	2025-08-19 21:26:24.212
42d8898b-b805-4633-b137-a4f355563642	mailgun	msg_50nvf	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user84@example.com	deferred	\N	2025-08-11 04:21:16.235
f216d835-f6f6-4ff7-a021-5259beb011ee	ses	msg_ifexe	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user52@example.com	bounce	\N	2025-08-21 18:56:59.596
c89efe5b-c2e2-4be7-bd06-c0eef21cc93c	sendgrid	msg_l1cz1h	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user26@example.com	click	\N	2025-08-04 01:33:54.43
86b779f3-9cd3-42d6-acad-5e2f83ba31ff	ses	msg_z2ok8g	\N	welcome_email	user65@example.com	click	\N	2025-08-22 06:59:24.116
2b95ad21-5e5a-4cab-8b92-ef645aeb61c1	ses	msg_33i1ab	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user7@example.com	click	\N	2025-08-18 23:59:09.864
311e6bfe-6cfa-4869-bf55-eb4a9114c123	mailgun	msg_th6x08	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user32@example.com	bounce	Mailbox full	2025-08-15 13:06:49.338
dbdb9642-6a3c-4a77-a318-d692c6682b93	sendgrid	msg_febq3t	\N	booking_confirmation	user9@example.com	click	\N	2025-08-20 21:58:13.247
23f0e6bf-0f12-4f67-939c-60b3024ab988	mailgun	msg_7svdhce	\N	password_reset	user63@example.com	click	\N	2025-08-09 13:24:15.763
c01b7c5e-da80-4ca0-917f-932255444bf5	ses	msg_6dq1yl	\N	password_reset	user8@example.com	click	\N	2025-08-03 19:18:17.433
df2e0a71-f4d4-418d-9930-f35bd1eea0cb	mailgun	msg_tth5j	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user62@example.com	bounce	\N	2025-08-07 06:20:51.937
d76b67a5-437b-4fa5-bb0f-aa22a93f00b8	ses	msg_juwkd	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user12@example.com	dropped	\N	2025-08-17 12:14:09.5
b6f6fddc-c514-4f6c-9425-a0f240515da9	sendgrid	msg_2b8t6s	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user83@example.com	delivered	\N	2025-08-01 09:39:47.436
34ded88b-1e44-4e39-838e-be49c6722888	mailgun	msg_yw2wlw	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user28@example.com	processed	\N	2025-08-10 16:58:52.022
dbbc5abe-6ab5-4bd8-9ed3-bbcfe17497c6	sendgrid	msg_79asbs	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user56@example.com	dropped	\N	2025-08-10 22:19:53.383
3071d734-9046-40c8-a6f3-16056bf91d95	sendgrid	msg_v1vj3q	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user38@example.com	delivered	Spam filter	2025-07-28 02:40:53.982
049b5b80-a681-436b-8f25-7390e7b08a28	sendgrid	msg_qayoml	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user88@example.com	processed	\N	2025-08-01 20:08:27.273
0f2b3d3c-71cc-4735-a0e0-08986b5ce209	sendgrid	msg_45qh2	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user87@example.com	open	\N	2025-08-19 04:26:27.417
92b75153-0e19-428d-a281-973458699025	sendgrid	msg_yxfisq	\N	booking_reminder_email	user17@example.com	click	\N	2025-08-03 00:41:52.912
00664ec7-65b1-4c5d-834f-1f273a791a85	ses	msg_rh7ra5	\N	cancellation_notice_email	user46@example.com	processed	\N	2025-08-15 21:24:02.866
0312c434-470c-45eb-9b57-75f31b6a1e59	ses	msg_o8ln0f	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user75@example.com	click	\N	2025-08-10 15:58:59.228
782849ac-7655-4981-9852-b72359ed0cee	sendgrid	msg_zoc6os	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user61@example.com	processed	\N	2025-08-15 11:34:00.718
dc05eeb0-d4c9-4733-b3ed-c7dd579dff36	ses	msg_4rp5ra	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user64@example.com	open	\N	2025-08-08 07:39:37.933
ebb77a26-e680-48ae-bf2e-4a788735de76	sendgrid	msg_ezs4qd	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user42@example.com	click	Invalid email	2025-08-04 06:53:54.566
ab948682-4c5c-4331-a764-8549ccbaf319	ses	msg_rf06oe	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user27@example.com	spamreport	\N	2025-08-07 15:13:01.904
22598e2b-db43-4d62-86d8-d14800b88467	sendgrid	msg_h8tz9oh	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user99@example.com	open	\N	2025-08-22 01:26:59.025
f03653d1-75ff-48c0-83a9-e7d373efaf93	sendgrid	msg_ez4zbc	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user55@example.com	processed	Mailbox full	2025-07-29 04:56:46.972
c87d2b3e-b8e3-4058-918d-029c0de002de	mailgun	msg_tn4ivg	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user96@example.com	open	\N	2025-07-28 03:21:27.776
8389acfd-1206-41ca-85fc-edb11a331bd9	ses	msg_3styn	\N	cancellation_notice_email	user19@example.com	delivered	Invalid email	2025-08-07 21:13:28.467
f8b99947-ebaa-4c0c-a1b8-fae46d3a64de	ses	msg_7n9uc	\N	payment_receipt	user72@example.com	bounce	\N	2025-07-31 03:53:15.958
bcbab6c6-372a-4a60-853e-af746049cf31	sendgrid	msg_muy03	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user52@example.com	delivered	\N	2025-07-29 19:40:57.12
dafa382d-3a87-42f6-80d7-3746e3f1aa9c	mailgun	msg_cf3vpo	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user92@example.com	spamreport	\N	2025-08-22 08:36:15.097
2c16b7b8-f30d-4366-8b8a-ae4c0da97f1d	sendgrid	msg_qtvbnm	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user69@example.com	spamreport	Spam filter	2025-07-30 20:05:30.811
0c05cc99-f81d-4aa8-8be5-5c3fd6fa5de9	sendgrid	msg_1o6fc	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user56@example.com	click	Mailbox full	2025-08-05 20:31:51.311
1a63ecd9-9182-469c-9e14-d2fec65eb681	sendgrid	msg_vfj1ir	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user43@example.com	deferred	Invalid email	2025-08-15 16:38:01.405
0fc3aa08-1934-4dd0-8fed-19ccbcd540d7	ses	msg_nfgop	\N	password_reset	user17@example.com	dropped	\N	2025-08-13 22:07:53.983
239d7883-eae7-4e4e-b754-0a8ab976f648	ses	msg_eynqkg5	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user20@example.com	click	Invalid email	2025-08-23 06:26:26.095
deabebf7-31b4-4015-bf9b-39ee1b3c1bcd	sendgrid	msg_ag1gff	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user94@example.com	dropped	\N	2025-08-21 11:29:06.075
5e29ed58-fecc-47dd-96f7-d69ee9ff8db5	mailgun	msg_g6thvfr	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user60@example.com	deferred	Mailbox full	2025-08-16 16:43:04.498
8f1d961d-e41f-44f4-9d5c-85c812bb6911	ses	msg_zk66eg	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user72@example.com	dropped	\N	2025-08-03 23:13:16.098
e1914fcd-3edf-475c-9ad0-eb1ba8afb1ed	ses	msg_2z020f	\N	cancellation_notice_email	user98@example.com	bounce	\N	2025-08-01 21:30:31.543
d4331006-7daf-450f-ae90-5dbe26ba4731	mailgun	msg_x3ss7	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user63@example.com	bounce	\N	2025-08-01 04:32:22.106
1e787986-9224-46d0-9dbc-8e50d301c291	sendgrid	msg_7cozbt	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user88@example.com	open	\N	2025-08-12 10:20:22.406
d793d582-e73f-4617-9474-a3e06af978e4	ses	msg_t3ftje	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user87@example.com	spamreport	Spam filter	2025-08-14 13:08:50.856
4e239785-81ef-4c7a-8691-1226753d9689	sendgrid	msg_err1g	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user13@example.com	delivered	\N	2025-08-07 10:48:56.825
c3a301e1-7437-466d-b0af-1acc1846e228	sendgrid	msg_8od1yg	\N	payment_receipt	user97@example.com	bounce	\N	2025-08-07 03:57:18.008
5eeaf169-8f30-408a-bb07-43414cbe0270	ses	msg_hu4pf3f	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user76@example.com	click	Spam filter	2025-08-05 10:29:07.705
cfc5f86b-c770-4a02-8392-e623e6541b03	mailgun	msg_jkgu3n	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user22@example.com	delivered	\N	2025-08-01 12:26:42.747
69edc7f9-7ba5-4713-89fd-827ce1717b8b	mailgun	msg_dunroh	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user69@example.com	dropped	\N	2025-08-10 11:33:45.597
21aaf567-e683-4509-995c-bc1d8f311885	sendgrid	msg_jkc10k	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user96@example.com	bounce	\N	2025-08-20 15:48:30.772
8fb4875a-7e82-4e92-9566-97bb7bfbd316	mailgun	msg_y9xqlu	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user4@example.com	processed	\N	2025-08-05 21:46:41.459
a89428b6-419c-486c-8cf3-40c382e0b44b	sendgrid	msg_vmvz0z	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user12@example.com	open	\N	2025-07-25 02:21:54.161
1e87747f-3996-482a-a08f-c1fcc8c56374	mailgun	msg_mb5qyw	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user8@example.com	bounce	Invalid email	2025-08-20 07:28:45.682
fef47e63-eb3e-4853-ae48-40b88cf965aa	mailgun	msg_ixeuam	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user16@example.com	dropped	Invalid email	2025-08-04 15:47:18.915
7d2b7a60-5959-479b-9b7b-2796affaccba	mailgun	msg_dhjpqd	\N	booking_confirmation	user76@example.com	spamreport	Mailbox full	2025-08-01 18:23:15.646
d28c3a4d-9c11-4932-b702-362b1c59a312	mailgun	msg_h9gp1	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user76@example.com	dropped	\N	2025-07-25 05:58:38.248
4d4551d9-c23a-4e12-891d-20af4be382a9	ses	msg_d33vd	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user6@example.com	spamreport	\N	2025-07-30 02:06:33.871
f2f42cc2-c2e1-4cdf-bafc-2a9e08a97ebb	sendgrid	msg_yemosg	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user18@example.com	open	\N	2025-08-08 09:19:35.263
939fb1b2-08a7-4615-bf4b-c9bf1c220b13	ses	msg_t1mc6w	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user90@example.com	processed	Invalid email	2025-08-20 17:56:12.387
b20538fb-496c-4528-9e5c-89454773dbae	sendgrid	msg_k26y7	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user25@example.com	spamreport	\N	2025-08-09 17:29:42.784
962ef2b4-260b-40de-ad35-bd3302ca68bf	mailgun	msg_cvb85s	\N	cancellation_notice_email	user28@example.com	click	Mailbox full	2025-08-18 14:30:29.64
93b03024-6f51-4901-b605-8ea47e5758ab	sendgrid	msg_jq8zbj	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user47@example.com	spamreport	\N	2025-08-08 17:54:27.564
59d51e3b-08a9-417e-ac4c-62a47c1f47be	mailgun	msg_zw42ok	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user7@example.com	open	Spam filter	2025-08-18 11:14:16.546
7e8663a1-6a1f-4d11-9576-2c55916cdc4e	ses	msg_719l1m	\N	booking_confirmation	user73@example.com	deferred	\N	2025-08-11 09:06:36.82
a924f977-43b8-4a16-b43e-811d0bc4a7e6	ses	msg_nynx83j	\N	payment_receipt	user0@example.com	bounce	Mailbox full	2025-08-02 09:27:17.802
34f0fd65-7a3c-457e-b5ee-195ea48472b2	sendgrid	msg_9lgu	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user67@example.com	processed	Invalid email	2025-08-08 17:51:26.527
2a690260-6364-4b51-8df0-e547a78d1fd3	ses	msg_ezj5al	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user55@example.com	processed	\N	2025-08-23 05:21:59.437
3411123a-b954-4e6a-b887-bd4b70874a9a	ses	msg_j7qy2	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user55@example.com	click	\N	2025-07-26 19:38:36.883
5aa5d4a8-82b4-4126-b8a0-b7e3c026885e	mailgun	msg_mr12mb	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user44@example.com	spamreport	\N	2025-07-31 07:18:30.402
7fb325c6-446c-4d93-8f0e-b9abe1893983	sendgrid	msg_p96pp	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user88@example.com	processed	\N	2025-08-17 19:49:15.94
55f4c40b-7bd5-4aaf-8b89-55af35a08790	sendgrid	msg_vhvuw	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user62@example.com	dropped	\N	2025-08-21 19:34:33.593
d07b0904-93dc-423c-a8a6-2d68ebfdf4e0	ses	msg_uof9f9	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user40@example.com	click	\N	2025-08-23 08:08:06.035
63b47c2b-d113-4f65-919d-c3b8644cfd3d	mailgun	msg_xlkf2l	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user46@example.com	bounce	Spam filter	2025-08-21 15:25:14.081
401a5cab-4c6c-4170-941b-e90df6f2b2f0	mailgun	msg_41ante	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user91@example.com	open	\N	2025-07-29 17:17:45.663
4c1b6493-0913-4891-a507-5b48f5ec68c5	ses	msg_snhngw	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user30@example.com	delivered	\N	2025-08-23 13:17:13.861
b015e5ea-4446-41e6-815f-66cc0d25ef90	mailgun	msg_glxh0q	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user67@example.com	dropped	\N	2025-08-21 09:58:47.154
80771790-afd5-4734-8c07-877f7b993e35	mailgun	msg_97qg9s	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user58@example.com	open	Spam filter	2025-08-19 01:53:53.948
5dd1f3b4-38ca-412d-9e8a-8861fd58a9a6	mailgun	msg_4e28n	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user15@example.com	open	\N	2025-07-27 13:06:25.68
8d98485e-f8da-462a-b0d4-5bf8da3e8db5	ses	msg_efzrc	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user22@example.com	open	\N	2025-08-23 16:21:27.288
51b53bcf-1426-4bc3-bff8-69f7a533322e	ses	msg_k9e20h	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user26@example.com	spamreport	\N	2025-08-13 20:32:43.101
9ae24b02-8666-4453-8f24-741ea8b5dcbb	ses	msg_oxezah	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user25@example.com	processed	Mailbox full	2025-08-16 11:36:52.619
66b7a5eb-f5c6-4fec-9e31-cce001239fc8	sendgrid	msg_4w3o0k	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user36@example.com	dropped	\N	2025-08-05 21:51:44.708
7ede9c84-ec33-4da9-8216-39f9215dc1ac	sendgrid	msg_c5s1yb	\N	booking_confirmation	user78@example.com	open	\N	2025-08-21 10:00:07.169
94a15c4c-5147-4e2c-bd84-099bc20da5fe	mailgun	msg_8o9xlr	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user57@example.com	deferred	\N	2025-08-07 09:38:08.77
d100eba7-4455-481a-b6db-e3252c14c196	mailgun	msg_sxgyze	\N	booking_reminder_email	user5@example.com	deferred	\N	2025-08-20 12:35:53.501
84a52ade-a155-4666-86d1-41f7d738d8f9	mailgun	msg_8lh6ch	\N	booking_confirmation	user44@example.com	deferred	Mailbox full	2025-08-11 21:28:52.511
d515a38a-4582-4eef-ae60-f3e7c76cf961	ses	msg_kok0sn	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user51@example.com	deferred	\N	2025-08-19 12:16:43.599
2c108f51-8cb6-4e6e-a8c6-72777d6aa4dd	sendgrid	msg_jtxexi	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user35@example.com	click	\N	2025-07-26 19:05:53.082
9f0040c5-c016-4433-95e2-c63699b42354	mailgun	msg_peo0ye	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user10@example.com	spamreport	\N	2025-08-11 22:00:44.151
70e7d33a-55fa-4c44-8ff8-2c3e8bc774f2	mailgun	msg_of9vhe	\N	cancellation_notice_email	user62@example.com	bounce	\N	2025-08-21 04:02:55.853
5378f1f2-97a0-4670-aa47-bcda04dc33d8	mailgun	msg_zsx3a	\N	welcome_email	user36@example.com	open	\N	2025-08-09 20:58:35.657
9ad3f142-9a35-41c4-bafc-6f8cb59c233a	mailgun	msg_evfhy	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user42@example.com	click	\N	2025-07-27 02:37:58.917
d2f464ff-0c0d-4228-9f6e-40ddfa6383cf	sendgrid	msg_xfolgh	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user68@example.com	dropped	\N	2025-08-22 10:59:53.451
18df5318-5624-411d-934c-48b02bc751cc	ses	msg_kvb8t6	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user31@example.com	deferred	Invalid email	2025-08-06 07:03:32.621
6d949c39-cd92-4874-8973-359aa10d2153	mailgun	msg_9gy6fs	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user65@example.com	delivered	\N	2025-08-20 19:52:15.941
600c578f-a05a-4534-941c-dc1949451170	mailgun	msg_ocpasl	\N	booking_reminder_email	user84@example.com	spamreport	\N	2025-08-21 11:26:50.413
40786414-ebeb-45fc-93fc-a425ba396936	ses	msg_k5fp9h	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user32@example.com	dropped	\N	2025-08-01 15:59:15.535
f06fd013-4854-44ba-875d-e9f896ef1d26	sendgrid	msg_rg8wso	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user31@example.com	deferred	\N	2025-08-05 21:55:58.982
f49aa6aa-b16e-44e1-a3a6-96345e296b34	mailgun	msg_vhoeo	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user99@example.com	deferred	\N	2025-08-15 21:58:41.324
b980d2cf-3209-48cc-afe0-81befa0f2464	ses	msg_700mss	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user65@example.com	click	\N	2025-08-08 04:59:23.333
ce160ff9-1c8f-47aa-abd3-1b0a255b1817	mailgun	msg_fdjey6	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user24@example.com	bounce	\N	2025-08-05 14:57:34.947
b00adf6f-c35e-4643-8ac7-6946f77364b4	ses	msg_ri036	\N	booking_confirmation	user90@example.com	dropped	Mailbox full	2025-08-21 22:03:10.499
d0b5f16d-ad76-469e-be9b-9ce1aa56237e	ses	msg_2r2td	\N	booking_confirmation	user54@example.com	click	\N	2025-07-27 06:13:58.841
d4d2a1e2-6798-445d-86fd-273988de1a34	mailgun	msg_q0lh5	\N	payment_receipt	user34@example.com	dropped	Mailbox full	2025-08-18 15:45:43.31
22acfc3d-1703-451e-8163-16bbc9b51dd3	mailgun	msg_l5vcor	\N	booking_reminder_email	user18@example.com	open	Invalid email	2025-08-04 00:19:58.649
1b1a069e-a852-4a0a-973e-549b56eeb541	mailgun	msg_m4ajhb	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user30@example.com	dropped	\N	2025-07-29 22:31:16.7
ef6ad4db-12e0-4e18-b05a-cf54ac160a6e	mailgun	msg_6pyaph	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user98@example.com	spamreport	\N	2025-08-05 14:44:30.479
48345506-33dc-4541-afa0-d0e1d7df059c	mailgun	msg_whvqcf	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user76@example.com	open	\N	2025-07-26 06:25:01.497
418683e6-fbe9-4357-adc6-29949f1ed837	mailgun	msg_rz83th	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user74@example.com	bounce	\N	2025-08-13 02:05:01.255
b9dda543-9398-4a90-b10b-bd391037da79	sendgrid	msg_1cv1v	\N	welcome_email	user48@example.com	bounce	\N	2025-08-22 06:02:15.527
5e9ce21c-bd30-4f41-99f3-836774351a52	sendgrid	msg_eypr7e	\N	booking_confirmation	user51@example.com	spamreport	Invalid email	2025-08-03 12:50:01.667
10d1686a-7895-4e25-af53-0e7e857a40f2	mailgun	msg_fsppkl	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user72@example.com	spamreport	\N	2025-07-25 19:07:18.481
99825736-94db-4162-b157-5e1bdaaaf4a8	ses	msg_0p8vun	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user42@example.com	processed	Spam filter	2025-08-15 05:03:23.393
9b4a27e7-9d32-48e0-b8d6-9964da235f46	mailgun	msg_c8hl09	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user22@example.com	delivered	Invalid email	2025-08-08 04:30:29.496
d1c183e1-28a5-41c7-aa4c-566a7754298c	sendgrid	msg_f1gkxs	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user92@example.com	open	Mailbox full	2025-08-21 02:09:41.061
dd3e6137-3793-4dbb-b004-0fc83d0dc199	sendgrid	msg_dr59kw	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user33@example.com	click	\N	2025-08-20 10:01:11.67
b0aa851b-c456-45a4-85f9-b10107419228	sendgrid	msg_caara5	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user37@example.com	deferred	\N	2025-08-04 13:21:53.479
28315d4f-68b6-4f6b-be8a-aaaec9c3267b	sendgrid	msg_214itu	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user29@example.com	deferred	\N	2025-08-05 14:34:29.201
00699525-f424-4031-9ba2-66e831ef9f32	mailgun	msg_fxabx	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user33@example.com	delivered	Spam filter	2025-08-22 16:56:48.323
7c1cd8e6-9d85-4322-abb0-19ef9e18636d	ses	msg_cjm1mt	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user76@example.com	dropped	\N	2025-08-09 08:28:04.984
0db1d4be-480a-412e-b93d-25050c203b27	sendgrid	msg_ozl6t9h	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user90@example.com	deferred	Spam filter	2025-08-19 08:27:41.326
5b5e6e0f-2dcd-4cd9-83a8-c1caf5bf2f24	sendgrid	msg_69o4ke	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user14@example.com	click	\N	2025-07-31 03:04:09.525
6badad96-eda4-44d6-8deb-718ed803edbf	mailgun	msg_thtxc	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user91@example.com	processed	\N	2025-08-02 08:00:59.784
1bdcd59a-d59c-4a42-a859-88ece2346b54	sendgrid	msg_c7zvyo	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user65@example.com	bounce	\N	2025-08-23 22:43:11.229
ccf4ab4e-cf61-440b-b43d-e71d9a7bbc55	mailgun	msg_fi3rgt	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user41@example.com	bounce	\N	2025-07-28 13:13:46.102
3d0b15af-1399-4ada-a8b3-bef86f0ec48d	ses	msg_vemxd6	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user0@example.com	processed	Invalid email	2025-08-11 13:00:19.902
c6c936d8-8b11-456a-bc5f-2ce7a98330bc	ses	msg_xvcwerp	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user27@example.com	dropped	\N	2025-07-27 23:30:10.696
75cbc81a-5d9a-4624-9304-c93f468ca574	ses	msg_852o8	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user98@example.com	processed	Mailbox full	2025-08-07 09:55:31.872
50dea65d-8500-46ee-a008-bd6ea3e01d48	ses	msg_crgjy	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user17@example.com	bounce	Spam filter	2025-08-23 16:08:23.88
bfe2c924-06b4-44e9-88c1-9c3e2d968afa	sendgrid	msg_tws2k6	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user81@example.com	delivered	\N	2025-08-02 19:11:37.017
406985ba-bd91-4759-93ed-b08d9479eeed	mailgun	msg_yrgmm9	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user83@example.com	dropped	Spam filter	2025-07-25 04:27:30.061
82a5f2e8-4dfa-408d-8924-7ceabc5c9c0e	sendgrid	msg_538ips	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user94@example.com	click	\N	2025-08-02 22:41:41.095
87d39270-9e61-48af-a3dc-62b1bd8761a7	ses	msg_yjs0qf	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user29@example.com	delivered	Invalid email	2025-08-09 20:09:33.243
a89aa1a2-6c7d-425f-9817-f0fafbeaff45	mailgun	msg_3gb24h	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user57@example.com	open	\N	2025-08-15 06:15:12.414
947b69b0-f01f-4f9c-b7b2-131e84838f94	sendgrid	msg_jxxfyl	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user62@example.com	deferred	Spam filter	2025-08-07 19:08:27.62
5403649e-317d-4439-a3c9-23f5b45db6e4	mailgun	msg_kdsymv	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user9@example.com	spamreport	\N	2025-08-11 10:22:27.809
15d5974f-b444-48ab-b061-d0b6292cd413	ses	msg_24ija	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user95@example.com	dropped	\N	2025-08-07 21:52:29.882
5f861096-8dfa-48c1-b55e-8fe99e9affa9	sendgrid	msg_4t5qpl	\N	password_reset	user46@example.com	click	\N	2025-08-17 11:41:34.065
e1b70062-741f-4856-9097-f1f388ec7cc2	ses	msg_fwih2	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user65@example.com	processed	\N	2025-08-07 11:56:00.088
4cbf762b-af72-4e8f-b090-85d50b0d765d	ses	msg_7qsa2a	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user26@example.com	deferred	\N	2025-08-13 21:40:57.678
00e2a48f-1a3f-4596-a318-b41b6e8e3e35	ses	msg_8u3p1f	\N	welcome_email	user16@example.com	processed	\N	2025-08-06 05:09:30.009
d9eb0610-a33a-461e-bd56-901a58e2b0ee	sendgrid	msg_u7alj	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user29@example.com	processed	\N	2025-07-28 19:52:54.434
9e0bab3b-ab21-47a5-a80b-eb6d0e16bfc9	ses	msg_y9q1hb	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user22@example.com	click	\N	2025-07-30 00:48:21.096
ec762708-c105-4ff1-9826-782a2b657e17	mailgun	msg_2rk1kr	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user73@example.com	spamreport	\N	2025-08-12 09:51:35.705
22131ce5-1ba3-4cd3-8b20-ec57ffa7a7dd	ses	msg_nifr3g	\N	cancellation_notice_email	user1@example.com	dropped	\N	2025-08-05 20:05:11.645
60ea91ce-27c9-4f2a-af96-1c28cd64500e	sendgrid	msg_xs8jyq	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user23@example.com	bounce	Mailbox full	2025-08-01 02:05:15.685
91400c38-82fa-42d9-9538-9074ccfe6790	mailgun	msg_6zueaa	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user10@example.com	bounce	\N	2025-08-09 05:17:15.369
41ef7553-cce1-4839-84e9-9d486bac8d90	sendgrid	msg_vmrfzv	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user4@example.com	click	Mailbox full	2025-07-31 02:25:16.9
20901e5e-1e6b-47c5-891b-c915c85e2381	ses	msg_z5rhi	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user41@example.com	spamreport	\N	2025-08-03 16:19:11.49
b7fa2a95-866b-4ac8-b578-6f5b853bb3b0	sendgrid	msg_12csqn	\N	booking_reminder_email	user39@example.com	click	\N	2025-07-31 04:54:48.13
53b0f22b-7b35-4e78-a355-068a3e2cfb4f	sendgrid	msg_7azrop	\N	password_reset	user69@example.com	dropped	\N	2025-08-13 08:13:53.901
71cdbee8-b9b8-49f3-979d-206de2d966df	sendgrid	msg_0l3zge	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user55@example.com	open	\N	2025-08-21 09:17:24.335
dffe6233-dd36-474f-999d-e6596c71eb8d	sendgrid	msg_l4oywl	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user78@example.com	open	\N	2025-08-06 07:01:29.833
a40bc148-b3d5-4000-9aa1-84ba9f5d085f	mailgun	msg_f7czsp	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user45@example.com	delivered	\N	2025-08-08 01:38:33.069
bc0ad4c2-37e3-4f64-89e7-1b9e067da9ad	ses	msg_m6x1a	\N	cancellation_notice_email	user22@example.com	bounce	\N	2025-07-25 16:02:32.776
97c2f131-62a6-41ec-aa01-a2533d325106	ses	msg_fid8ob	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user44@example.com	click	\N	2025-08-07 02:30:33.77
4c9f1fb3-cddf-4590-9780-09809d346cc8	ses	msg_417sdb	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user65@example.com	processed	\N	2025-07-27 02:53:58.402
29be3a8a-9bb5-427d-a03b-42ed3b580469	ses	msg_asfgm1	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user21@example.com	click	Spam filter	2025-08-22 21:39:58.306
d7c008f7-11b2-4998-a150-98c41ac94920	sendgrid	msg_td9qt	\N	cancellation_notice_email	user46@example.com	delivered	Invalid email	2025-07-29 08:16:16.608
5892c87c-4752-4c9f-a2cc-386f0cbae4a3	mailgun	msg_ym69g3q	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user7@example.com	processed	Invalid email	2025-08-01 05:59:52.715
c70353d0-404e-47db-b09e-87f56feb83bc	ses	msg_84rkhf	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user99@example.com	deferred	\N	2025-08-08 07:57:29.147
42f79f1a-c49b-4347-b364-5a302106c4c4	ses	msg_o80f5g	\N	booking_confirmation	user54@example.com	deferred	\N	2025-08-08 22:14:45.383
28832935-6619-47d9-94c7-3c3451070776	sendgrid	msg_8ci1gl	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user69@example.com	click	\N	2025-08-21 14:43:25.657
7fdc434d-f563-4739-b4fd-c072c2f0677b	ses	msg_z3n3xm	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user7@example.com	click	\N	2025-08-10 23:17:16.622
1318d632-74f4-4e22-acfb-827f628b230f	sendgrid	msg_ntbluo	\N	welcome_email	user42@example.com	delivered	Invalid email	2025-08-12 12:29:47.828
f80cfcf0-410f-47fb-82c2-31b30a5996a9	mailgun	msg_iswadi	\N	cancellation_notice_email	user80@example.com	open	Mailbox full	2025-08-17 10:10:14.739
3a84682a-dadb-4f53-a201-41cd3b08846f	mailgun	msg_70tvta	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user93@example.com	dropped	\N	2025-07-27 11:06:25.825
c904f049-9ebf-4ebf-b21d-9ab1d8a7b9af	mailgun	msg_bi1cgp	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user41@example.com	deferred	\N	2025-08-20 12:22:53.077
9aa85324-bac1-47bf-bac7-7530f2a503ca	ses	msg_lr2vnp	\N	booking_reminder_email	user31@example.com	dropped	Invalid email	2025-08-01 07:57:35.962
e0b61d56-eff2-4787-be41-e430b7b559ea	sendgrid	msg_79u5k	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user49@example.com	spamreport	\N	2025-07-26 05:16:34.834
4a6257b8-bf19-412d-b87a-7a1700b404e8	ses	msg_8w1jh	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user63@example.com	spamreport	\N	2025-08-22 05:32:22.923
10684270-eb6b-4b11-8204-f8c29db924ba	ses	msg_xaimf	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user95@example.com	bounce	\N	2025-08-22 16:19:50.967
24e2f431-7d01-4822-94aa-79205f0de328	ses	msg_og7k2g	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user94@example.com	spamreport	\N	2025-08-05 22:13:04.999
47d174bb-7d0d-4b85-a05a-fc24591a33f9	sendgrid	msg_i518n	\N	password_reset	user86@example.com	deferred	\N	2025-07-30 15:55:31.212
2bac17c1-e048-488c-bb20-08d63418ffba	sendgrid	msg_dq0ov	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user7@example.com	dropped	\N	2025-08-01 10:49:34.039
4e3edd1b-4cef-4196-9e0f-2fbd82f1c0c6	ses	msg_hnxyki	\N	password_reset	user8@example.com	click	\N	2025-07-30 01:37:27.377
90e0f2aa-07f5-4001-a511-332dd5086d55	ses	msg_ecwddb	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user57@example.com	delivered	\N	2025-08-10 09:00:30.094
3d94f318-c7fe-48e3-8bb5-13751b5926f4	ses	msg_8w662q	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user26@example.com	delivered	\N	2025-08-09 23:04:37.058
c68f45ab-5ae7-4102-93c7-d45f2a3019df	mailgun	msg_7l5pg	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user82@example.com	open	Invalid email	2025-07-29 09:11:18.264
28e44063-5055-4da4-8c51-5339aa3df296	mailgun	msg_oms77j	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user6@example.com	dropped	Mailbox full	2025-08-18 11:52:04.442
50cbd324-ad6b-4c35-b4e9-1c2d3ffc8740	sendgrid	msg_kwv8rx	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user18@example.com	spamreport	\N	2025-07-31 01:59:20.046
11e77855-003f-4a62-b9d4-ca7d8828a768	mailgun	msg_73tqg	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user60@example.com	delivered	\N	2025-07-25 10:45:13.063
1f0845c3-97d5-414c-bdaf-cba7df4e4afb	mailgun	msg_7ztah	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user15@example.com	delivered	Spam filter	2025-08-21 16:10:53.277
c8ed3b13-063c-4953-aaa3-06f4d86dc410	sendgrid	msg_l731ma	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user75@example.com	processed	Invalid email	2025-08-06 06:56:42.061
92b15e42-d9a8-4d00-a2aa-3095b42d5979	ses	msg_69bg2m	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user20@example.com	dropped	Spam filter	2025-08-14 12:48:12.304
634b1102-5d20-4302-abd1-61745c47f578	mailgun	msg_ll2kkhm	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user25@example.com	click	\N	2025-08-18 18:33:31.706
6c84652d-8547-406a-8302-b90ee9555d68	ses	msg_caydzc	\N	welcome_email	user93@example.com	delivered	Spam filter	2025-07-28 13:48:35.278
63c472a6-2add-4592-93ae-d9cbab1fe628	ses	msg_imhxil	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user59@example.com	dropped	\N	2025-07-25 03:55:58.203
1d8a2ed8-6bb1-43dc-9c63-f93fd4f31832	sendgrid	msg_kd9f4i	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user61@example.com	open	Mailbox full	2025-07-31 20:14:25.017
5632472a-feb5-4584-87c0-8810c17b0285	mailgun	msg_lk4qn4	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user44@example.com	dropped	\N	2025-07-25 16:38:21.122
faac20d6-d017-4832-886a-a80eb9494d15	mailgun	msg_lfhga	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user43@example.com	click	Spam filter	2025-07-25 20:14:16.314
18694812-1d2d-4419-8d8e-1a37632adbc2	sendgrid	msg_1tggq9	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user20@example.com	deferred	\N	2025-08-05 08:42:08.018
5ee59e47-0376-4b96-93ff-54663dd307ad	mailgun	msg_89j8x	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user38@example.com	spamreport	\N	2025-08-06 09:02:43.973
bf279066-85f8-46ba-bc53-99bb049da194	ses	msg_kax539	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user74@example.com	delivered	\N	2025-08-16 10:31:00.142
86613373-64cb-4113-9410-3e18f805efc7	mailgun	msg_21j45s	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user17@example.com	bounce	Mailbox full	2025-08-15 17:05:57.654
2b451f0f-ce58-4471-b3c3-e4ead06486d3	ses	msg_2x4l7	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user69@example.com	delivered	Invalid email	2025-08-12 06:00:47.876
ff403144-5bcf-4656-9566-c464af830702	mailgun	msg_v3t0y	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user13@example.com	deferred	Spam filter	2025-08-13 01:54:47.549
f0b41c0f-9801-4e98-88cb-454202c7a939	mailgun	msg_hwhkw	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user10@example.com	spamreport	\N	2025-07-26 03:14:57.794
f631484b-b0e5-4709-a3fd-e81eef29e4de	ses	msg_k48a6j	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user32@example.com	bounce	\N	2025-08-07 18:38:17.667
b718a331-8836-4395-a4a7-f0fc265ae01b	ses	msg_5cs5er	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user20@example.com	delivered	\N	2025-08-02 18:07:13.676
76c1dedf-fb0a-4084-9319-528cd8176d5f	ses	msg_r3rn0c	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user17@example.com	open	\N	2025-08-18 17:04:16.422
96400133-be06-467c-8a51-929fbf1cbf9c	mailgun	msg_2wiqcq	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user89@example.com	dropped	\N	2025-08-19 19:12:26.538
61892da8-0824-41a5-ae12-ae998cd3c3f8	mailgun	msg_gr7xwhdw	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user43@example.com	delivered	Spam filter	2025-08-13 14:11:44.798
13fdf271-1703-44c1-a9fd-432863c6c99d	mailgun	msg_6ygc08e	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user9@example.com	bounce	Mailbox full	2025-08-12 16:54:51.728
ffd789f7-d41b-4d7c-ab74-2e86505aa1af	sendgrid	msg_tk33fjh	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user27@example.com	open	\N	2025-08-23 00:46:50.033
f7f8eed2-b7c1-4b79-9aa9-3f8e1ad3238d	ses	msg_afdqyr	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user46@example.com	delivered	\N	2025-08-02 18:36:40.448
6ac2b319-ec91-4268-bcdb-2401cbff9320	sendgrid	msg_fyjdtn	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user1@example.com	spamreport	\N	2025-08-17 09:07:09.132
6537a4e7-4847-4ab0-942b-1f256ddc2229	mailgun	msg_3400l	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user11@example.com	processed	Spam filter	2025-08-23 18:31:47.838
f7ba9628-d057-49eb-9924-67056aa5d14f	ses	msg_u35r48	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user27@example.com	spamreport	\N	2025-08-01 21:53:14.694
7d2c1e40-d63d-4125-b825-4f7a295ea82a	sendgrid	msg_t1ssfv	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user29@example.com	click	\N	2025-08-16 11:48:08.885
e2c12c28-55a5-4e3d-9060-af34d38c2648	sendgrid	msg_t2gb5	\N	cancellation_notice_email	user15@example.com	open	\N	2025-07-25 10:35:22.622
4e5b5163-0a52-4728-aaf3-65a6bdce7f4a	ses	msg_m0p0je	\N	password_reset	user12@example.com	deferred	\N	2025-08-10 05:40:41.642
89e57f47-ff72-4947-a3d1-e677e191a909	ses	msg_ncnhfd	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user48@example.com	click	Invalid email	2025-08-09 12:38:37.713
ed2dcc1c-21e5-41c8-9093-b2d5591dadf3	mailgun	msg_y9kc58	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user62@example.com	click	\N	2025-08-09 03:29:31.379
8702d555-8c14-4e2d-a67e-22eb7ab9e9cc	ses	msg_kkhj6k	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user70@example.com	delivered	\N	2025-08-12 07:42:15.613
fc2507cc-088a-43d4-adb7-16fc796a6a6a	ses	msg_xi569i	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user46@example.com	dropped	Mailbox full	2025-08-16 07:33:54.371
18633351-c7db-4b57-8624-8d6a9d64059a	mailgun	msg_h9u4ft	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user54@example.com	bounce	Mailbox full	2025-07-25 03:02:39.641
9758da7b-8b02-4df4-b3a5-f8a7f884fc26	sendgrid	msg_mtgqgg	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user67@example.com	deferred	\N	2025-07-28 11:55:21.784
eb2e665c-6b47-470b-813e-4850fbc760e1	mailgun	msg_chibaj	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user73@example.com	click	\N	2025-08-22 23:06:28.592
967177ad-6ff2-46b2-b59b-c36ef000c922	sendgrid	msg_2xbm2k	\N	password_reset	user94@example.com	processed	\N	2025-08-02 05:17:11.273
76281825-fcc1-405b-bc9b-4bbf80bc4eeb	ses	msg_rxo2n	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user86@example.com	click	\N	2025-08-06 09:58:13.827
3e9e1a03-1471-4b4b-914c-78703ddb7d7b	sendgrid	msg_satne	\N	welcome_email	user48@example.com	click	\N	2025-08-21 05:30:01.007
d49686e7-9d96-4714-8634-8feed41d90c3	sendgrid	msg_8ixd9y	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user19@example.com	open	\N	2025-07-25 13:09:50.079
50f72096-9f0f-4fa3-a678-b855534fe127	sendgrid	msg_5r41x	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user71@example.com	spamreport	\N	2025-08-16 09:02:06.988
742a44d4-896a-4a3f-ba8e-e2471d9d20b7	ses	msg_c9igvk	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user45@example.com	open	Mailbox full	2025-07-28 06:08:12.169
2f4920c5-bddf-45ef-8e24-c3769a92d612	ses	msg_1qv78f	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user3@example.com	click	\N	2025-08-03 04:14:03.241
c4e51d25-13d6-40a4-83e7-eab23d831479	sendgrid	msg_i5ww4p	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user9@example.com	processed	\N	2025-08-17 06:41:03.048
8884852e-a5ef-4aa5-b1ba-7dfc38957d90	ses	msg_comfts	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user18@example.com	deferred	\N	2025-08-20 02:27:14.804
fafec5f7-d714-4a39-a735-04b32d2662ce	mailgun	msg_n5os3	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user13@example.com	bounce	\N	2025-07-30 01:30:55.445
f09c6479-b958-425d-92fa-81412ceb41e4	ses	msg_5pyel	\N	password_reset	user87@example.com	processed	\N	2025-08-17 12:36:31.259
adb47773-3667-4346-8401-eb5a0edac823	mailgun	msg_u6izia	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user60@example.com	open	\N	2025-08-11 13:43:26.525
661cbf15-07c1-4109-934a-e6cdeda8fd5e	mailgun	msg_w3xmac	\N	booking_confirmation	user30@example.com	dropped	\N	2025-08-15 21:20:03.92
fb11a74b-34ba-4c56-b147-532583606774	mailgun	msg_rjqbqi	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user78@example.com	spamreport	Spam filter	2025-08-21 17:54:54.744
b6e04309-b8e3-4e8a-a2bc-021522333460	ses	msg_ybzpc	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user12@example.com	click	Invalid email	2025-08-05 06:19:16.474
5df3f172-4b81-4e8f-bc26-d390163bc053	sendgrid	msg_kyo1q	\N	booking_reminder_email	user7@example.com	click	\N	2025-08-11 20:21:37.71
18cab962-db6d-4ad2-9952-795426ca3803	sendgrid	msg_pi5dr	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user1@example.com	bounce	Spam filter	2025-08-12 05:40:29.78
953d2237-51fb-41cf-bb2d-f91ed142337e	ses	msg_gzsvah	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user26@example.com	click	\N	2025-07-27 16:56:13.707
c8335178-8249-4005-a548-7d610f84a71d	ses	msg_htjhab	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user87@example.com	click	Spam filter	2025-08-15 01:58:09.865
31df6fbb-6d4b-42a7-82ff-40a7ecf4aa0c	sendgrid	msg_5tiqdk	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user77@example.com	processed	Spam filter	2025-07-30 22:00:02.304
3acec61a-f202-48fd-912b-3ea8ddf2d306	mailgun	msg_8qllx	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user71@example.com	dropped	\N	2025-07-25 19:46:50.323
d3e58d43-8fe3-4812-a0c9-ba4ae9b3faf8	sendgrid	msg_zk1d35n	\N	booking_confirmation	user6@example.com	delivered	\N	2025-08-14 18:27:42.246
aa606ae0-75e5-4a38-8f4b-08e96dabef0c	sendgrid	msg_ay0ypk	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user84@example.com	delivered	\N	2025-07-29 18:55:00.449
6f25e733-c213-4f1d-8c41-eae5267ba36c	ses	msg_a18vzb	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user18@example.com	bounce	\N	2025-07-28 04:54:46.721
57039ca0-0f34-400f-8c21-fb53e6fd038d	sendgrid	msg_a27p4v	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user83@example.com	click	\N	2025-08-14 09:17:09.234
6aec4dc1-0bb5-45d1-8b47-f151f80f87c5	mailgun	msg_mi7zc	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user94@example.com	open	\N	2025-08-10 14:48:29.787
249a7c09-edf0-445f-a675-bffe4a2b4508	mailgun	msg_hhnt8	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user8@example.com	bounce	\N	2025-08-13 05:01:05.549
ae77f9ea-12cf-4908-aa10-a2e6d50f8262	mailgun	msg_jjafs	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user37@example.com	delivered	\N	2025-08-04 23:15:03.838
0d904bda-6c9e-4622-a4ae-8ac56dde81ba	ses	msg_vplpac	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user14@example.com	click	\N	2025-08-12 01:28:27.733
d6ae1469-64bc-4eff-8247-d7af325163f8	ses	msg_ctjkzg	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user78@example.com	open	\N	2025-08-17 04:38:26.074
0d6393e1-fad4-4c33-8a52-1e63303047e0	sendgrid	msg_94d39occ	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user78@example.com	click	\N	2025-08-18 20:05:43.813
5036b79a-6c66-4fde-a937-dca9e38a961b	mailgun	msg_bk7j1i	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user83@example.com	delivered	\N	2025-08-22 06:29:03.878
9ae7bc2f-489b-44f4-8f79-5d04a91972b4	ses	msg_d7zj35	\N	booking_confirmation	user51@example.com	delivered	\N	2025-08-13 06:21:30.526
6fa31e68-232f-41bd-a465-41ba2dd90078	ses	msg_zm8ll	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user79@example.com	delivered	\N	2025-08-03 08:49:56.843
3dda41d3-01d1-408b-b9b5-1177d350d7b5	sendgrid	msg_xaonkn	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user87@example.com	processed	\N	2025-07-31 18:20:51.505
16ca3d5b-dd4f-4edb-9609-dc219b7e81c5	mailgun	msg_o91nws	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user45@example.com	processed	\N	2025-07-27 15:09:32.953
a1330bf3-6725-4577-aa7e-8fa2121bdee4	ses	msg_5rafvr	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user68@example.com	spamreport	Invalid email	2025-08-15 09:44:43.807
f4ec6f85-194b-440e-a8d2-8c91e4397c40	ses	msg_eu3p5o	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user65@example.com	bounce	\N	2025-08-21 13:45:02.243
dc2a8cc1-de21-44df-9e0a-5e133d4630e4	ses	msg_5xcbs5	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user95@example.com	processed	\N	2025-08-15 02:13:29.681
41060751-e105-4019-821d-1471082b5e92	sendgrid	msg_nqc47o	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user14@example.com	delivered	Spam filter	2025-08-19 08:54:23.468
956b36fc-31c4-4cd5-a6d2-ab6f52b3e997	mailgun	msg_7jxwek	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user96@example.com	dropped	Spam filter	2025-08-11 20:36:06.755
9b3d82a2-81d6-488e-a2f4-6bc8db572f62	mailgun	msg_1pubif	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user76@example.com	spamreport	\N	2025-08-20 03:52:18.327
fcc9e91a-fef2-4260-908f-99024b35b9e7	mailgun	msg_mtdycj	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user38@example.com	bounce	Invalid email	2025-08-22 11:02:26.156
69a3c310-fb6a-4296-961e-0e4262f70cb8	mailgun	msg_5852r3	\N	booking_confirmation	user72@example.com	deferred	\N	2025-08-14 17:53:10.031
d0d00a49-b1a4-4cbb-883c-68eb55f15373	mailgun	msg_xwy9dz7	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user94@example.com	dropped	Mailbox full	2025-08-10 23:05:34.745
71d86eff-c011-48fa-8536-451ee1d9b9af	sendgrid	msg_81m51e	\N	payment_receipt	user9@example.com	spamreport	Spam filter	2025-08-18 21:39:39.183
6df77e7e-2b32-4b1a-aa3f-0f3bb7369735	mailgun	msg_pemw7e	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user31@example.com	processed	Spam filter	2025-08-14 06:51:21.547
21062e9d-27d5-4b4e-9ffc-3eb607f6575d	mailgun	msg_ifxdv	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user64@example.com	deferred	\N	2025-08-17 06:31:36.712
97d24d3b-bfe7-44c4-8adf-6d32cbcca296	sendgrid	msg_9x3yw	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user64@example.com	spamreport	\N	2025-08-08 06:45:34.387
28402667-4c2e-4a72-91c6-9dcb52b33454	ses	msg_6ghzm	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user89@example.com	click	\N	2025-08-20 00:00:47.766
2389cfab-5c60-45e5-b96d-041616ac8ce7	sendgrid	msg_7mk5n8	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user75@example.com	dropped	Invalid email	2025-08-06 11:41:01.504
624777ed-cf56-49af-bd83-28246e1e390a	ses	msg_zyfc3	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user12@example.com	dropped	\N	2025-07-25 17:54:29.264
7bf7fcd3-997a-4e10-9ab0-c099bb77eb8d	ses	msg_aylprg	\N	password_reset	user7@example.com	delivered	\N	2025-08-09 12:53:21.55
8a32af66-6741-4507-b3e0-6a00c710e783	mailgun	msg_1yejp	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user2@example.com	spamreport	\N	2025-08-03 22:54:23.986
78a52df1-fd2f-43e6-ab53-f50b1dbf0d09	mailgun	msg_bzkkog	\N	welcome_email	user62@example.com	open	\N	2025-08-01 22:41:41.751
9c47e6e2-e468-4663-8e58-a921aa9f8ed3	mailgun	msg_vfae8	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user15@example.com	delivered	\N	2025-08-14 18:45:06.173
1c661482-5521-4c0e-8204-6052395a5c18	sendgrid	msg_5r32hc	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user40@example.com	delivered	Invalid email	2025-07-25 01:07:35.75
ace8cb5d-be65-4d32-a8d9-be4b64318f8a	mailgun	msg_wj3e8l	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user89@example.com	delivered	\N	2025-07-26 18:54:09.37
be625989-29ed-4ebf-a839-c3c1bd0728d2	ses	msg_c9mnx7	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user63@example.com	deferred	Invalid email	2025-08-04 19:49:34.417
206f22f6-81f2-493e-a9bb-9858d23939ba	mailgun	msg_dt41oa	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user14@example.com	processed	Mailbox full	2025-08-21 07:04:36.722
15e7f875-cf83-41c1-bf8d-d72848ffbb17	sendgrid	msg_o0q0a9	\N	welcome_email	user51@example.com	dropped	\N	2025-08-17 12:43:38.253
c9e6dafa-1430-4a0c-91bf-ecb6af9cca14	ses	msg_t70f8c	\N	cancellation_notice_email	user6@example.com	bounce	Spam filter	2025-07-28 12:43:45.91
2abae435-03b2-4681-8459-21161f05b97a	mailgun	msg_da1aqi	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user18@example.com	open	\N	2025-08-10 18:55:51.564
e6132fe0-b4ea-4ef2-a873-4005a3d608a4	mailgun	msg_ud0iru	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user50@example.com	spamreport	\N	2025-08-11 13:52:18.816
3e498f13-c485-46b4-8833-2fe2499ab99f	mailgun	msg_mtunqw	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user24@example.com	processed	\N	2025-08-18 03:08:58.633
05c9c69e-e5e0-4f67-a563-55273ec77342	ses	msg_h5v2k	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user19@example.com	bounce	Mailbox full	2025-08-16 23:24:39.484
1d158051-9277-4fab-a808-ab105b41a97b	ses	msg_sby8jq	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user90@example.com	deferred	\N	2025-07-30 22:25:37.174
dc13086f-7351-471e-afab-7b30156a158c	ses	msg_yuxid	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user92@example.com	processed	Mailbox full	2025-08-16 11:41:40.03
76907ecd-6cb4-4733-9069-bf1b22991d1c	ses	msg_9w5q9f	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user57@example.com	deferred	Mailbox full	2025-08-08 10:35:51.409
f8333a91-4e26-4527-96cf-4ba14cdc6df1	ses	msg_b6ukkb	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user21@example.com	delivered	Invalid email	2025-08-12 03:19:43.729
261e72d9-ff96-41b7-8b8f-54027737cc79	ses	msg_tuoi6j	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user17@example.com	processed	Invalid email	2025-08-01 16:17:03.178
c68b1945-d5ad-4d13-b762-e113f98f14f0	ses	msg_25qml26	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user77@example.com	processed	\N	2025-08-16 12:40:43.768
4151c6c3-ec56-43c5-918e-fe092b7caac6	mailgun	msg_nptvwq	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user20@example.com	processed	\N	2025-08-21 11:45:34.706
edfc6021-b1cc-4dfb-a5cf-aef590c5b480	sendgrid	msg_1vl4x5	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user34@example.com	processed	Spam filter	2025-08-09 01:35:08.802
d0fe1468-4267-4e15-bfc9-15a578def21b	sendgrid	msg_h551d	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user61@example.com	dropped	\N	2025-08-14 00:03:45.944
7cf08f4f-7a7f-4d57-afa7-c492db5dea5e	sendgrid	msg_odpl1	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user2@example.com	bounce	Mailbox full	2025-08-12 05:36:50.268
5957d623-a1e7-41ef-93e8-c43c56cb502a	ses	msg_m0cvb9	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user54@example.com	dropped	\N	2025-08-14 02:34:39.773
3ecf49bf-196f-4bf0-bd01-42f2735da286	ses	msg_1vyn7l	\N	payment_receipt	user5@example.com	processed	\N	2025-08-17 20:13:26.058
6f0e0956-6119-4c47-ae80-07e472210aae	mailgun	msg_tmz7nk	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user14@example.com	deferred	Invalid email	2025-08-21 12:24:32.382
bfb9b070-76a2-4324-b104-46f9294f300b	sendgrid	msg_xrqmsb	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user37@example.com	spamreport	Invalid email	2025-08-02 14:48:49.485
801c2b94-f900-4365-8aca-ac58da143dde	ses	msg_uc2y7v	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user19@example.com	delivered	Spam filter	2025-07-30 14:29:52.65
195c82e0-4fb6-4283-87d3-a4ee5ad9b394	sendgrid	msg_swdx6u	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user43@example.com	spamreport	\N	2025-07-28 10:54:17.428
4bddff33-3a07-4655-af6a-aa6a61b6a301	sendgrid	msg_qswm5n	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user18@example.com	processed	\N	2025-08-16 19:21:07.638
41ce6103-211f-4df0-bcf1-3971674c5f40	ses	msg_zqxv1h	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user83@example.com	bounce	\N	2025-08-14 21:41:01.122
a87ae48e-915b-447e-acb5-b3093b727a89	ses	msg_qsc6ap	\N	welcome_email	user30@example.com	open	Mailbox full	2025-08-11 00:41:41.478
ff5583ba-90ee-4882-abd8-e654acf01388	mailgun	msg_8izx08	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user41@example.com	processed	\N	2025-08-22 08:49:35.722
d27d40a6-ee59-4d9e-880d-750a3473fdc5	sendgrid	msg_e26its	\N	cancellation_notice_email	user91@example.com	dropped	\N	2025-08-02 23:03:56.881
2279c73e-e5b3-47b6-94e2-b99e3f241e66	sendgrid	msg_j5461k	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user1@example.com	delivered	Spam filter	2025-08-14 18:51:20.725
ab03db76-3689-49b9-a709-0546d36ded8c	mailgun	msg_tabpdb	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user18@example.com	click	\N	2025-07-28 07:59:39.755
7974ec1f-6d76-46b8-88aa-6086d31c155e	mailgun	msg_vtwkwh	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user5@example.com	click	\N	2025-08-23 20:35:47.982
9e9ca218-8b23-400f-a384-1e629c67990f	sendgrid	msg_solct5	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user90@example.com	open	Invalid email	2025-08-12 19:06:24.239
f27f6ed7-e545-4d89-a7b1-d8667b0e945f	mailgun	msg_05jt2f	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user55@example.com	bounce	Invalid email	2025-07-25 20:14:06.243
981b34cd-1994-4abd-b7f3-d96480af11c2	mailgun	msg_ull0zo	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user79@example.com	deferred	\N	2025-08-21 18:58:50.169
db50c33f-228b-43ff-8ce5-2759326b2584	ses	msg_rorof	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user43@example.com	dropped	\N	2025-08-13 23:47:15.352
67450656-9fca-438a-94fe-30dc1ef0eb92	mailgun	msg_iq9asu	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user83@example.com	dropped	\N	2025-08-07 21:57:11.2
8910c7f0-f2a8-4cce-b6d1-ce5be35d2e5d	ses	msg_d9qydd	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user33@example.com	processed	\N	2025-08-17 21:19:48.861
3dd82a1a-51d6-46f2-8650-007d9582e7f8	mailgun	msg_hh74go	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user95@example.com	bounce	\N	2025-08-19 03:07:34.101
52e4ce9a-e58b-4dbf-8c42-7212ca106036	sendgrid	msg_1zrjyj	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user26@example.com	deferred	\N	2025-08-05 05:48:11.541
d040f463-f043-43a5-836c-ec3b3b6a81c9	ses	msg_vjoqp	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user37@example.com	deferred	Spam filter	2025-08-19 23:22:15.624
3e99bc05-490c-46a9-9d8c-52e4dccbed7e	mailgun	msg_t63r2p	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user63@example.com	delivered	\N	2025-07-27 21:49:59.319
a2db9ced-54b8-4f4b-ba0c-60b46ab61543	sendgrid	msg_wgx3sk	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user92@example.com	processed	\N	2025-08-18 18:09:04.377
f2392e5f-d9a7-43f6-b13d-0ff8914c71bf	ses	msg_yh34a	\N	password_reset	user61@example.com	deferred	\N	2025-07-25 10:32:47.646
83c86fef-2ff1-4cd6-adb9-3d3db15518cf	mailgun	msg_mht6ds	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user16@example.com	dropped	\N	2025-08-06 14:51:11.359
99e4c6fb-1940-4624-bd3f-05ec1be01ed5	sendgrid	msg_blu0ak	\N	booking_confirmation	user45@example.com	bounce	\N	2025-07-27 19:16:36.733
fdadd458-8277-4f93-adc4-a2d44568fccb	sendgrid	msg_qj18fj	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user13@example.com	deferred	\N	2025-07-28 09:56:39.174
852752e0-659d-4fda-bb61-eb5c1298f5da	ses	msg_3nfdil	\N	booking_confirmation	user18@example.com	click	\N	2025-08-22 08:35:34.181
27ff8f66-1a7a-41c7-b949-55676f92b859	sendgrid	msg_wblqja	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user11@example.com	spamreport	\N	2025-07-27 19:49:51.841
6a890b80-8799-494d-a42f-de07a07848f1	sendgrid	msg_kd8u7g	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user63@example.com	bounce	\N	2025-08-06 23:12:48.976
7030b570-a1d4-4f21-be6d-99f6844d4057	ses	msg_buyn79	\N	welcome_email	user48@example.com	processed	Mailbox full	2025-08-18 09:54:34.298
562d4ecf-6a69-4a31-9ef7-adbe7f886393	mailgun	msg_9dqqai	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user90@example.com	deferred	\N	2025-07-31 11:38:48.229
77340987-6241-4434-9347-41a39d9978be	mailgun	msg_wuzdvn	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user64@example.com	open	\N	2025-08-02 21:12:12.017
ac688ac9-001a-40de-9368-58bc1402d05d	mailgun	msg_o2usvq	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user99@example.com	open	\N	2025-08-19 14:22:24.385
5f0766af-c28c-4684-be56-fd27cf64ad4e	ses	msg_x5yufj	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user11@example.com	bounce	\N	2025-08-02 19:54:14.262
90e4f0fb-a309-4d00-9257-3256fc6f1d7e	mailgun	msg_z77mk	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user84@example.com	processed	\N	2025-08-08 16:56:45.158
8506c35d-a0af-4fcf-a3a9-5e1f832a72e7	sendgrid	msg_etnugk	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user74@example.com	open	\N	2025-08-11 23:33:46.422
92b4ab0a-65d8-4634-95f3-1bf1986c907f	sendgrid	msg_u1nzg	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user44@example.com	click	\N	2025-08-05 02:16:30.86
fccff07a-28c6-4b49-b069-5ae7e79b4f8e	sendgrid	msg_ygdths	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user84@example.com	spamreport	\N	2025-08-01 15:40:10.38
d6a65729-afae-415c-a3bc-925b139adf76	sendgrid	msg_p6hw4s	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user35@example.com	bounce	Invalid email	2025-08-05 10:29:33.898
aecb7a80-a5f6-4f13-a3f6-1aec55d6dabd	ses	msg_u7hudl	\N	booking_reminder_email	user56@example.com	click	\N	2025-08-20 02:55:26.119
c2cbe2df-2e0b-49d0-bd5d-e4a5e2f69fd6	mailgun	msg_o725bs	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user36@example.com	click	Mailbox full	2025-08-11 17:02:03.564
3f6700b7-44fe-423a-8346-7306b2eb48a3	sendgrid	msg_btab1f	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user32@example.com	deferred	\N	2025-08-05 14:57:14.294
3f120a4e-99ae-4251-a10d-0d87646c8b63	sendgrid	msg_7mpz0q	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user15@example.com	deferred	\N	2025-08-11 23:07:00.669
029d7f30-8540-4dd1-9565-529ce6ec87f6	sendgrid	msg_g1rl5h	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user24@example.com	dropped	Spam filter	2025-07-25 16:29:55.62
df7c4dda-82e9-4885-9385-1531e27bf683	mailgun	msg_o2nex	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user37@example.com	bounce	Mailbox full	2025-08-18 20:36:12.821
9da5e202-134d-4d6c-a0ea-def28aa7d8d5	mailgun	msg_gpinak	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user82@example.com	spamreport	Mailbox full	2025-08-09 06:31:50.224
d7a62883-7b0e-416b-b943-58b89c5e543f	mailgun	msg_szgjo9	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user47@example.com	processed	\N	2025-08-01 23:02:28.988
a0cfaae0-8c9c-40e9-8047-674ce2c41d9b	mailgun	msg_8p5lf	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user6@example.com	dropped	Mailbox full	2025-08-19 18:31:12.422
48aa5ac9-b4bd-4edf-8a6b-141adb21ac33	sendgrid	msg_f64d9f	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user88@example.com	dropped	\N	2025-08-16 20:30:10.626
91c79301-8814-454e-a57a-01ff0505568e	ses	msg_u1bsrs	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user11@example.com	delivered	\N	2025-08-06 02:49:42.881
1d124ed6-9984-43a2-bfde-bcff3880fb16	ses	msg_b1cbj	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user3@example.com	delivered	\N	2025-08-21 08:19:42.886
6fc7b824-02a8-4301-a4b7-0ddabd677b26	ses	msg_rnzwoi	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user83@example.com	processed	\N	2025-07-25 00:30:32.355
b800b52d-19bc-48dd-82f4-d3b8c6469688	sendgrid	msg_v2iu4p	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user67@example.com	bounce	\N	2025-08-15 07:09:14.274
3d721685-9d37-45d7-9a8f-8fcac1598bd0	sendgrid	msg_jqvg4o	\N	cancellation_notice_email	user36@example.com	dropped	Invalid email	2025-08-21 01:00:42.699
e5b828ac-ee5f-4c3a-bbe2-326519ff6a62	mailgun	msg_9hgvxa	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user91@example.com	processed	\N	2025-08-12 12:28:54.931
6889fa66-4bfd-478e-abb4-2a32854dd4f4	sendgrid	msg_m1r3du	\N	booking_reminder_email	user40@example.com	deferred	\N	2025-08-09 21:41:14.651
511c11e9-be1b-4e71-a9df-0ad040d67c1e	ses	msg_clqj6g	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user11@example.com	spamreport	Spam filter	2025-08-22 05:16:54.734
e83204c5-34db-407c-b627-528764fd80b2	mailgun	msg_mv553	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user9@example.com	open	\N	2025-07-27 17:09:14.86
bc29d4c2-011d-476e-a7fc-aa6c84d8a1b8	ses	msg_jzw98p	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user85@example.com	spamreport	\N	2025-08-18 17:34:24.167
931d851d-7b57-4250-8374-6dc751b79770	ses	msg_3rfmec	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user42@example.com	delivered	Mailbox full	2025-07-27 09:31:02.57
96d77889-b039-4892-96df-5e36facb763f	sendgrid	msg_qd9ad	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user9@example.com	spamreport	\N	2025-08-10 16:22:25.43
aba6f60a-08ed-4718-bdee-5bad91393e25	sendgrid	msg_8xtj3	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user35@example.com	click	\N	2025-08-23 06:29:08.977
3219c684-ae13-4314-a3c0-3cba75e7bd7c	sendgrid	msg_vsrb8t	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user56@example.com	click	Mailbox full	2025-08-22 09:54:14.935
ac6c2ddf-10c9-4c75-94af-37974dac837e	mailgun	msg_7e393	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user23@example.com	processed	Spam filter	2025-08-12 00:16:41.591
04f19a03-7662-4cba-aa55-6bdc40151f3a	ses	msg_5trwyj	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user72@example.com	processed	\N	2025-08-05 18:16:54.39
cca1036e-4107-40b2-b72c-d4a328da3287	ses	msg_liqeq	\N	password_reset	user8@example.com	open	Mailbox full	2025-07-28 15:40:01.903
0210e7b8-b2f1-46ab-abc8-58dce5a06dbd	ses	msg_b8kk4d	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user25@example.com	open	\N	2025-08-09 14:02:24.374
4dfb0daa-382d-408d-8826-e16605eab1d8	mailgun	msg_cz0uxn	\N	payment_receipt	user81@example.com	deferred	Mailbox full	2025-07-25 22:12:39.2
2f2234a3-fa01-4544-8da1-a297ad144334	ses	msg_vy6p2f	\N	booking_reminder_email	user93@example.com	open	\N	2025-08-17 20:46:11.813
a841b883-c17a-4fa7-8cdc-d189b7559574	ses	msg_d03cy	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_reminder_email	user82@example.com	click	\N	2025-08-14 17:26:07.883
dc99d839-fcdf-442a-b712-81a8b2b8daa1	ses	msg_t6unhb	\N	payment_receipt	user42@example.com	open	Mailbox full	2025-08-19 17:17:44.151
36f4a4af-9d4b-46a3-a812-e7080f071424	ses	msg_96aa9	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user80@example.com	processed	\N	2025-08-11 11:14:31.471
f31e8ea5-9e89-4517-bb53-ad4bc52a9a8d	ses	msg_mq21x	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user57@example.com	bounce	\N	2025-07-26 19:59:57.824
af447b70-f961-4902-96c6-1fd7bbaa5a28	ses	msg_5uzpa	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user80@example.com	open	\N	2025-08-18 08:20:11.063
3d9a13df-f11b-49ba-9408-5bb77319f647	sendgrid	msg_z0dtgs	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user40@example.com	processed	\N	2025-08-14 00:58:18.63
c15b9bad-dd6f-4c37-89fe-0680900eb5ec	mailgun	msg_8mrqqb	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user96@example.com	click	\N	2025-08-22 00:28:35.676
8b151ef5-1d30-43d5-a53b-1b739185045e	sendgrid	msg_ytunuc	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user92@example.com	bounce	Mailbox full	2025-07-29 22:05:32.395
e08d460a-f61a-44ac-9ab9-fee2040a5e21	ses	msg_hirvcr	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user3@example.com	bounce	Spam filter	2025-08-13 06:23:41.723
046ab6e0-3b7c-4002-8f1a-1c87a7546c15	mailgun	msg_8waw3o	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user82@example.com	delivered	\N	2025-08-18 04:56:43.509
d7d5a45d-2bb9-4bbd-83fe-0c40e9d0a794	ses	msg_3af4h9	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user73@example.com	delivered	\N	2025-08-12 05:19:33.645
0ca3ac4d-6d25-4545-a865-0d98beb235e7	sendgrid	msg_bgskpo	\N	welcome_email	user36@example.com	open	\N	2025-08-17 10:55:23.834
b48987dc-d479-48e9-8eed-efdcd104cec7	mailgun	msg_zh5icq	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user42@example.com	dropped	\N	2025-08-05 22:00:57.353
37116f3d-cb03-4fcc-b582-b505e7a18d8b	mailgun	msg_89a	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user49@example.com	deferred	\N	2025-08-13 19:06:01.441
df8ae35b-adfd-49c7-9a04-7c500bd1f481	mailgun	msg_3e0rb9	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user84@example.com	click	Mailbox full	2025-08-16 22:37:10.165
d489e154-5ff1-45c0-8838-1b883752fd28	sendgrid	msg_dxeaqn	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user89@example.com	deferred	\N	2025-08-05 02:50:24.091
6900e5bf-ad01-40b7-b33d-4dc9b357889d	ses	msg_mpqfk	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user79@example.com	bounce	Invalid email	2025-07-31 13:41:17.813
76b5866a-261b-40e3-b28c-e14593b63e45	sendgrid	msg_dzz3rj	\N	booking_confirmation	user43@example.com	delivered	\N	2025-08-11 09:03:25.143
7fa7defd-58c5-4c14-9c0a-baa78a6f9809	mailgun	msg_gdk3q	\N	cancellation_notice_email	user57@example.com	delivered	\N	2025-08-08 20:01:40.298
d25b0b29-943a-4ff8-a39d-35159a067a14	ses	msg_u3c2rb	d98c4191-c7e0-474d-9dd7-672219d85e4d	password_reset	user37@example.com	deferred	Invalid email	2025-08-03 11:36:49.866
80e9de97-9027-4f7a-aa4d-cb08b10a72ef	sendgrid	msg_vidbwg	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user40@example.com	dropped	\N	2025-07-31 15:06:50.348
8c824a56-2587-4d71-abbc-9d7d7272f698	sendgrid	msg_ottzjm	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user67@example.com	bounce	\N	2025-08-18 08:31:14.982
7b285004-d74a-4d68-af6a-0d87ac6f640d	sendgrid	msg_8soupn	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user97@example.com	processed	\N	2025-08-14 21:39:51.048
a54ee516-b294-4310-894a-542139de24ad	mailgun	msg_lc4mux	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user42@example.com	open	\N	2025-08-18 15:53:00.366
5d6a4443-e67d-42d2-9a85-080567c521d8	mailgun	msg_xzribb	\N	cancellation_notice_email	user17@example.com	click	\N	2025-07-27 20:36:59.575
1b25de5f-116e-4dd2-8330-008999fb0896	mailgun	msg_dobxux	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user63@example.com	deferred	\N	2025-07-29 22:43:35.765
b15a4bd1-43a3-4462-a272-66a6223e2847	mailgun	msg_eh6nq	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user82@example.com	spamreport	\N	2025-08-23 03:24:09.09
03ab42ce-b92d-4d87-942a-5bc303b5d1f9	ses	msg_nomudm	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user19@example.com	deferred	\N	2025-08-14 00:46:47.131
84e76e11-142f-4c6c-be7d-a6983113eaec	ses	msg_5sowvl	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user5@example.com	bounce	\N	2025-08-13 10:25:21.966
bb27b7f7-6e8e-4b23-8dae-ef965ec32f4e	ses	msg_56qtp9	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user77@example.com	open	\N	2025-07-30 00:27:59.032
2becf111-bbf9-46b2-8803-2bf0ed9ac7c4	ses	msg_d4jz1p	\N	cancellation_notice_email	user8@example.com	spamreport	\N	2025-08-05 04:02:08.899
2fe5089e-7312-4fea-988f-6ee28069ccb5	ses	msg_g1x1we	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user4@example.com	processed	\N	2025-08-06 16:50:09.644
969cade4-e182-4a60-a36f-ced01ce341eb	sendgrid	msg_wu3uxrd	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user65@example.com	spamreport	\N	2025-08-19 19:04:03.025
72a24c9b-c393-4430-bb8f-9189e44c2337	mailgun	msg_k67yl	\N	welcome_email	user57@example.com	deferred	\N	2025-08-23 14:40:44.191
2bf53b15-525d-4b3c-b1a5-7b50b387472a	ses	msg_u7d9w	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user49@example.com	open	\N	2025-08-02 04:13:06.914
621efbb7-489e-483d-9c7f-ea4af9e5cbf5	sendgrid	msg_xpyy2n	\N	booking_confirmation	user16@example.com	bounce	\N	2025-08-10 18:01:54.979
c982047c-308a-4dbc-89f5-89e0d87f4dd7	mailgun	msg_pamp57	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user43@example.com	open	\N	2025-08-14 12:49:03.345
601f4d7e-03f2-400f-8b0e-eeb8b61e9727	sendgrid	msg_zl1xhe	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user79@example.com	spamreport	\N	2025-07-28 17:51:53.001
b881b195-e46e-469d-bad4-f05ef4ef01b3	sendgrid	msg_aowgg	\N	password_reset	user69@example.com	deferred	\N	2025-08-14 18:04:12.563
18c4b28e-2663-422c-996b-515e0fb14b98	ses	msg_klc49i	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user28@example.com	bounce	\N	2025-08-05 15:46:22.973
49c23b08-f5b9-49f9-922f-ddf92ea88a6d	mailgun	msg_9oxlge	c2d95cef-9cd3-4411-9e12-c478747e8c06	welcome_email	user45@example.com	click	\N	2025-08-03 09:39:35.985
e4f44e80-59db-48be-8dde-c7680041a58f	mailgun	msg_wi8x4p	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user8@example.com	processed	\N	2025-08-19 14:16:59.194
1ee174b6-dec2-474e-8d61-d3e0e9611b0a	ses	msg_ftxf2	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user47@example.com	dropped	\N	2025-08-19 23:47:37.338
a99ecdf0-cb46-4752-a32e-57fc3d56d6c9	mailgun	msg_ulhvla	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user2@example.com	click	\N	2025-08-17 18:29:57.935
0d216b1d-821a-4fda-aa67-2e67baa3d36c	mailgun	msg_z0fuhx	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user81@example.com	processed	\N	2025-08-04 10:20:53.223
e5703d97-f59f-4dd2-b293-1366c73f08ed	ses	msg_v4q9zt	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user32@example.com	spamreport	Mailbox full	2025-08-12 07:40:28.851
26f8652d-10d6-460e-9996-e92177a9d7fa	sendgrid	msg_ybkpto	c2d95cef-9cd3-4411-9e12-c478747e8c06	payment_receipt	user71@example.com	bounce	\N	2025-08-15 04:19:31.624
54e55bc9-4bb2-4bf3-86fa-c4d803122d99	ses	msg_zt0kb	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user80@example.com	dropped	\N	2025-08-05 12:46:12.436
e1f8fb98-590c-4572-b23c-40dfb1da936f	sendgrid	msg_tgatq	\N	welcome_email	user6@example.com	delivered	\N	2025-08-01 05:14:13.77
7be92c8b-a22b-4448-8eb0-9ff29a86f86b	ses	msg_igfm3e	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user66@example.com	deferred	Spam filter	2025-08-11 08:26:26.947
50c1636a-811c-411b-9112-4a803ee78888	ses	msg_9m2vpj	\N	booking_confirmation	user94@example.com	processed	\N	2025-08-09 11:31:04.026
35647beb-e149-4520-8c86-2416a42899f8	sendgrid	msg_nbew3k	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user66@example.com	dropped	\N	2025-08-03 08:08:04.837
9c355a75-c14a-4368-a18c-c220fe8a75e0	ses	msg_bqsp2	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user89@example.com	spamreport	\N	2025-08-20 02:38:43.44
e24654e6-0d62-4324-a451-de65d61abd15	mailgun	msg_itseph2	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user21@example.com	delivered	\N	2025-08-23 15:01:18.805
2994958d-7e3c-4b4e-bd6c-b02c3ab1b9ba	sendgrid	msg_ah8kel	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user34@example.com	bounce	\N	2025-08-18 17:40:52.734
bce8580e-3a84-4840-b17b-a4cca20bc728	ses	msg_8yaunj	d98c4191-c7e0-474d-9dd7-672219d85e4d	cancellation_notice_email	user94@example.com	open	\N	2025-08-20 17:26:23.717
4bde177c-7c51-4625-b118-436483994167	mailgun	msg_ujdwo	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_confirmation	user30@example.com	bounce	\N	2025-08-14 09:52:39.529
34da5df6-0ad0-46a5-baa4-bc3671462e53	mailgun	msg_t87voj	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user8@example.com	delivered	Spam filter	2025-08-17 02:38:32.914
423cbc0e-6339-4940-9d59-e2ab1848ce79	sendgrid	msg_pxlbz	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user73@example.com	dropped	\N	2025-08-21 06:53:06.376
2fa1cc32-fd8c-4c6c-976c-6660e8b67edb	sendgrid	msg_w7usbe	d98c4191-c7e0-474d-9dd7-672219d85e4d	welcome_email	user52@example.com	click	\N	2025-08-03 00:02:52.196
9e9ff2fb-2589-43c3-967c-05ad1c1a9f50	ses	msg_ypkdj	\N	booking_confirmation	user86@example.com	deferred	Mailbox full	2025-08-13 02:20:43.294
88d61a11-ee6d-4776-80d3-8ea760e05efe	mailgun	msg_ly3d64	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user96@example.com	click	\N	2025-08-08 15:22:37.035
03577c83-1511-4587-84f4-c716adac7b70	mailgun	msg_2kf3r	c2d95cef-9cd3-4411-9e12-c478747e8c06	booking_confirmation	user74@example.com	click	Spam filter	2025-08-08 22:37:06.631
35576a37-6e80-4068-8a5e-2b53b17589b1	mailgun	msg_1ph6hni	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user87@example.com	processed	\N	2025-08-08 14:48:44.92
e535ee3f-e20f-4798-98e3-ad114a72d89f	mailgun	msg_v5mtti	d98c4191-c7e0-474d-9dd7-672219d85e4d	booking_reminder_email	user63@example.com	delivered	Spam filter	2025-08-11 03:14:50.328
88c2e522-b4ee-4fa7-bbf9-4d617a19d482	mailgun	msg_7ci2z	c2d95cef-9cd3-4411-9e12-c478747e8c06	cancellation_notice_email	user46@example.com	deferred	\N	2025-08-09 11:14:17.96
884ac50f-299c-4d46-8796-c4327b6c3d0c	mailgun	msg_cz3vt9	d98c4191-c7e0-474d-9dd7-672219d85e4d	payment_receipt	user72@example.com	bounce	\N	2025-08-13 16:19:04.072
9cbf0ec0-ec99-42ec-89be-1d0e6d2f272b	ses	msg_bkjcdq	\N	password_reset	user63@example.com	bounce	\N	2025-08-10 20:39:50.571
f595c8b6-7119-4ce5-a609-85c71035edc0	ses	msg_c666oy	c2d95cef-9cd3-4411-9e12-c478747e8c06	password_reset	user14@example.com	click	Invalid email	2025-08-14 06:07:00.124
\.


--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_verification_tokens (id, expires_at, created_at, user_id, token_hash, used_at) FROM stdin;
f0908827-7448-47e9-ae58-6f9af32a90d0	2025-08-28 02:11:54.565	2025-08-26 02:11:54.584407	3c2d76d8-4767-4ef5-93a7-84b92ea4026d	8a89c694d4b715d7e0f1afa26cf4ba00b072249c75bbaef9b637b1079be6b61a	\N
b21ab7e7-9fb3-414a-afa3-730812759a87	2025-08-28 03:04:11.349	2025-08-26 03:04:11.367919	98c7aad9-1d62-454a-8a8a-9664e0286c61	844684897d7839eaadbc66da0abb420cbcc34789ca091f7ba1791364fc1f32eb	2025-08-26 03:04:48.123
16bd0bb2-d024-4f3f-9728-1e433e632858	2025-08-28 21:17:06.199	2025-08-26 21:17:06.218936	be809f62-7504-4b07-a6e3-7494f75ba49a	e4277657e406da10f8909bf87260714d3e3cc5126e1614e4e0454fe8657c3ceb	\N
f7840002-669f-41b2-8bb0-d4e01ffa43e2	2025-08-29 02:30:58.474	2025-08-27 02:30:58.491767	d9fd4e4d-4e63-4a2b-8a61-cb02fb5a16a2	90c50d6247ad27918e98bf7adae3c3ef396c3acd9f681aea766442dd16c4430f	\N
e163452b-bfbc-4325-9563-7aca50a26e4d	2025-08-29 02:31:20.976	2025-08-27 02:31:20.993812	5096273e-3b4f-48f4-a1b6-f40b8ca8c463	161955dc4f0c09ae54a5c2e537f8a15a2b03492da4836bba7169e88250c1430d	\N
599a510c-14a7-4ef3-ac62-a0b41018a84f	2025-08-29 02:33:13.475	2025-08-27 02:33:13.494309	94f24015-c007-418f-8092-ade6ce00478a	2a9eb83a2db2cf2243cdd5f220990b40b8f4a6290887cc54e21a7e594d45ac68	2025-08-27 02:33:53.209
9f60cf5a-0f87-4f36-bf80-a7625ffb8147	2025-08-29 02:42:32.939	2025-08-27 02:42:32.957442	ca235680-87cf-4b11-bd5c-c0ba1065fd82	d4889a011dd956396badb6c52e842f42ca2b5a0331dc19b14391a62259fdfdc2	\N
56a989b4-ca58-4234-81b9-3d7aabe784eb	2025-08-29 02:43:01.072	2025-08-27 02:43:01.103242	eb672165-c275-4ef1-b9a1-9f7e0fcc79a9	2e6f9d6f516fbbde6ede121fd4c478869978328a190df8b051a65be889df2b4e	\N
3dab7bd8-cdc1-4794-b76f-546e5a84c4be	2025-08-29 02:48:16.25	2025-08-27 02:48:16.267628	865b9d24-de32-4b12-8d2b-022271a74b9a	cc4b58990eb2c405bac0917ab76766704e3815de40d3862cb6640f1c78a05407	\N
208ace34-3559-4b52-ab79-2cf7a641c838	2025-08-29 02:52:52.907	2025-08-27 02:52:52.926523	ccc1d1fc-bc5e-4963-91b1-85ced1b5f31e	45fb740f6e7b3bf7dffdc5275d87deded99f8f91a389b78144f3c26c77120f1f	\N
7a516f77-c470-41d4-9189-2aa14bbe8fde	2025-09-04 01:33:59.968	2025-09-03 01:33:59.987964	b2c6f868-ac77-42bd-ae8c-fd7ae34a6105	7c8538a16a1c7fcf35958690e1157c64291340322f03a58333734e1dbf510d02	2025-09-03 01:34:46.064
4a5d2b46-f98b-4d80-a886-846bb998ef1a	2025-10-10 01:42:22.164	2025-10-08 01:42:22.182641	d576db26-32ba-4256-86f1-1478b2d8fbc7	780b3a5b1a23ed8092fa7ab1aec999396422272bed08351c9d9bcfe5e30674a1	2025-10-08 01:42:59.74
f6ddf4cf-2855-4bf6-a526-eb817f11aa46	2025-12-03 03:00:34.165	2025-12-02 03:00:34.184238	b2c6f868-ac77-42bd-ae8c-fd7ae34a6105	370137565dbcefba5e4c06e8c4ad24b85b7981e255d12b787e829da8c194de0f	2025-12-02 03:12:36.767
3f72962b-ae73-44d3-82c1-622c88962c93	2025-12-06 04:01:09.993	2025-12-04 04:01:10.009501	ac0b38f9-b135-4242-8d90-2c8511357026	3a39975dc5441fe83166374fe51dd8ff43cf03219c68be1bd273f8afb77d2d0e	\N
\.


--
-- Data for Name: feature_adoption_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feature_adoption_events (id, tenant_id, user_id, feature_key, occurred_at) FROM stdin;
\.


--
-- Data for Name: feature_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feature_audit_log (id, entity_type, entity_id, feature_key, old_value, new_value, changed_by, change_reason, ip, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feature_flags (id, plan_level, feature_key, enabled, created_at, updated_at) FROM stdin;
2b9b1d78-0f61-4d19-b61c-c672226807a6	elite	player_development	t	2025-10-08 23:05:52.294094	2025-10-08 23:05:52.294094
\.


--
-- Data for Name: feature_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feature_requests (id, tenant_id, title, description, status, submitted_by, reviewed_by, status_notes, created_at, updated_at, priority, plan_level, estimated_review_weeks, reviewed_at) FROM stdin;
\.


--
-- Data for Name: features; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.features (key, name, category, type, description, options_json, is_active, display_order, created_at, updated_at) FROM stdin;
core.session_management	Session Management	core	enum	Create and manage training sessions	{"values": ["manual_only", "recurring", "recurring_bulk"]}	t	1	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
core.parent_player_booking	Parent/Player Booking	core	boolean	Allow parents and players to book sessions	\N	t	2	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
core.waitlist	Waitlist Management	core	enum	Manage session waitlists	{"values": ["off", "manual_only", "auto_promote"]}	t	3	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
core.csv_export	CSV Export	core	boolean	Export data to CSV format	\N	t	4	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
core.csv_import	CSV Import	core	boolean	Import data from CSV files	\N	t	5	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
core.bulk_operations	Bulk Operations	core	boolean	Perform bulk actions on multiple items	\N	t	6	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
core.access_codes	Access Codes	core	boolean	Create and manage access codes for sessions	\N	t	7	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
core.discount_codes	Discount Codes	core	boolean	Create and manage discount codes	\N	t	8	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
comm.email_notifications	Email Notifications	communication	boolean	Send email notifications to users	\N	t	10	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
comm.sms_notifications	SMS Notifications	communication	boolean	Send SMS notifications to users	\N	t	11	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
comm.email_sms_gateway	Email/SMS Gateway	communication	boolean	Advanced email and SMS delivery options	\N	t	12	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
pay.accept_online_payments	Accept Online Payments	payments_billing	boolean	Accept payments online through integrated processors	\N	t	20	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
pay.payment_integrations	Payment Integrations	payments_billing	enum	Available payment processing integrations	{"values": ["stripe_only", "multiple_providers"]}	t	21	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
analytics.level	Analytics Level	analytics	enum	Level of analytics and reporting available	{"values": ["none", "basic", "advanced", "ai_powered"]}	t	30	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
integrations.calendar	Calendar Integration	integrations	boolean	Integrate with calendar applications	\N	t	40	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
integrations.additional	Additional Integrations	integrations	enum	Third-party service integrations	{"values": ["none", "sendgrid_mailchimp_quickbooks", "sendgrid_mailchimp_quickbooks_braintree"]}	t	41	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
dev.api_access	API Access	developer	boolean	Access to developer APIs	\N	t	50	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
support.level	Support Level	support	enum	Level of customer support available	{"values": ["basic", "standard", "priority_phone"]}	t	60	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
support.feature_request_queue	Feature Request Queue	support	enum	Priority level for feature requests	{"values": ["basic", "standard", "priority"]}	t	61	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
limit.players_max	Maximum Players	limits	limit	Maximum number of players allowed	{"max": 999999, "min": 0, "step": 1, "unit": "players"}	t	70	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
limit.sessions_monthly	Monthly Sessions	limits	limit	Maximum sessions per month	{"max": 999999, "min": 0, "step": 1, "unit": "sessions"}	t	71	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
limit.storage_gb	Storage (GB)	limits	limit	Storage space in gigabytes	{"max": 10000, "min": 0, "step": 1, "unit": "GB"}	t	72	2025-08-24 00:37:21.25756+00	2025-08-24 00:37:21.25756+00
\.


--
-- Data for Name: financial_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.financial_transactions (id, tenant_id, transaction_type, amount_cents, currency, source_type, source_id, user_id, player_id, session_id, processor_type, processor_transaction_id, qb_sync_status, qb_synced_at, qb_transaction_id, qb_error, description, metadata, transaction_date, created_at) FROM stdin;
\.


--
-- Data for Name: futsal_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.futsal_sessions (id, tenant_id, title, location, age_groups, genders, start_time, end_time, capacity, price_cents, status, booking_open_hour, booking_open_minute, has_access_code, access_code, created_at, location_name, address_line1, address_line2, city, state, postal_code, country, lat, lng, gmaps_place_id, waitlist_enabled, waitlist_limit, payment_window_minutes, auto_promote, no_time_constraints, days_before_booking) FROM stdin;
session-metro-1	uuid-1	U12 Boys Training	Metro Soccer Fields	{U12}	{boys}	2025-08-25 04:20:10.925759	2025-08-25 05:20:10.925759	16	2500	upcoming	8	0	f	\N	2025-08-24 04:20:10.925759	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-metro-2	uuid-1	U11 Girls Skills	Metro Soccer Fields	{U11}	{girls}	2025-08-26 04:20:10.925759	2025-08-26 05:20:10.925759	14	2500	upcoming	8	0	f	\N	2025-08-24 04:20:10.925759	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-metro-3	uuid-1	Mixed Age Training	Metro Soccer Fields	{U10,U11,U12}	{boys,girls}	2025-08-27 04:20:10.925759	2025-08-27 05:50:10.925759	20	3000	upcoming	8	0	f	\N	2025-08-24 04:20:10.925759	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-metro-4	uuid-1	Advanced U13 Boys	Metro Soccer Fields	{U13}	{boys}	2025-08-28 04:20:10.925759	2025-08-28 05:20:10.925759	12	3500	upcoming	8	0	f	\N	2025-08-24 04:20:10.925759	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-metro-5	uuid-1	U10 Development	Metro Soccer Fields	{U10}	{boys,girls}	2025-08-29 04:20:10.925759	2025-08-29 05:20:10.925759	18	2000	upcoming	8	0	f	\N	2025-08-24 04:20:10.925759	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
dRbBt6dDMyBKCO1LM05pS	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Sports Hub	{U11}	{mixed,boys}	2025-08-11 16:00:00	2025-08-11 17:30:00	2	1000	full	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	5	45	t	f	\N
session-rising-1	uuid-2	Beginner Futsal	Rising Stars Indoor	{U10,U11}	{boys,girls}	2025-08-25 04:20:13.922668	2025-08-25 05:20:13.922668	15	2000	upcoming	8	0	f	\N	2025-08-24 04:20:13.922668	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-rising-2	uuid-2	Girls Development	Rising Stars Indoor	{U11,U12}	{girls}	2025-08-27 04:20:13.922668	2025-08-27 05:20:13.922668	12	2500	upcoming	8	0	f	\N	2025-08-24 04:20:13.922668	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-rising-3	uuid-2	Weekend Warriors	Rising Stars Indoor	{U12,U13}	{boys}	2025-08-29 04:20:13.922668	2025-08-29 05:50:13.922668	16	3000	upcoming	8	0	f	\N	2025-08-24 04:20:13.922668	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-champ-1	uuid-3	Elite Training Program	Champions Complex	{U11,U12,U13}	{boys,girls}	2025-08-25 04:20:19.405606	2025-08-25 06:20:19.405606	24	4000	upcoming	8	0	f	\N	2025-08-24 04:20:19.405606	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-champ-2	uuid-3	Advanced Girls	Champions Complex	{U12,U13}	{girls}	2025-08-26 04:20:19.405606	2025-08-26 05:50:19.405606	16	3500	upcoming	8	0	f	\N	2025-08-24 04:20:19.405606	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-champ-3	uuid-3	Boys Academy	Champions Complex	{U11,U12}	{boys}	2025-08-27 04:20:19.405606	2025-08-27 05:50:19.405606	18	3500	upcoming	8	0	f	\N	2025-08-24 04:20:19.405606	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-champ-4	uuid-3	Future Stars	Champions Complex	{U10,U11}	{boys,girls}	2025-08-28 04:20:19.405606	2025-08-28 05:20:19.405606	20	3000	upcoming	8	0	f	\N	2025-08-24 04:20:19.405606	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-champ-5	uuid-3	Championship Prep	Champions Complex	{U13}	{boys,girls}	2025-08-29 04:20:19.405606	2025-08-29 06:20:19.405606	14	4500	upcoming	8	0	f	\N	2025-08-24 04:20:19.405606	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-champ-6	uuid-3	Technical Skills	Champions Complex	{U10,U11,U12}	{boys,girls}	2025-08-30 04:20:19.405606	2025-08-30 05:20:19.405606	22	3000	upcoming	8	0	f	\N	2025-08-24 04:20:19.405606	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Ml4x8BHJQrBaxpcTHdQ5R	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U9 Training Session	Sports Hub	{U13,U16,U9}	{boys,girls}	2025-07-28 17:30:00	2025-07-28 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-youth-1	uuid-4	Foundation Skills	Youth Hub Center	{U10,U11}	{boys,girls}	2025-08-25 04:20:23.126588	2025-08-25 05:20:23.126588	16	2200	upcoming	8	0	f	\N	2025-08-24 04:20:23.126588	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-youth-2	uuid-4	Girls Power	Youth Hub Center	{U11,U12}	{girls}	2025-08-27 04:20:23.126588	2025-08-27 05:20:23.126588	14	2500	upcoming	8	0	f	\N	2025-08-24 04:20:23.126588	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-youth-3	uuid-4	Boys Development	Youth Hub Center	{U12,U13}	{boys}	2025-08-28 04:20:23.126588	2025-08-28 05:50:23.126588	16	2800	upcoming	8	0	f	\N	2025-08-24 04:20:23.126588	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-youth-4	uuid-4	Mixed Training	Youth Hub Center	{U10,U11,U12}	{boys,girls}	2025-08-30 04:20:23.126588	2025-08-30 05:20:23.126588	18	2400	upcoming	8	0	f	\N	2025-08-24 04:20:23.126588	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
0xoUKJxi_s7kJsFDfuEvf	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U18 Training Session	Turf City	{U18}	{girls}	2025-07-07 19:00:00	2025-07-07 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
cQ7nQK0iCQpCz26Z6o3om	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U18-U9 Training Session	Turf City	{U18,U9}	{girls,boys,mixed}	2025-07-08 16:30:00	2025-07-08 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
CQ3pg4AfE_CfIeZPeSWd_	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U15 Training Session	Sports Hub	{U10,U15}	{mixed,girls}	2025-04-01 18:00:00	2025-04-01 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
DggOIR1SEzmYaaUIooOm3	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U9 Training Session	Sports Hub	{U9}	{girls,boys,mixed}	2025-04-03 17:00:00	2025-04-03 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
aMfhy2GPh_-13EdDydXJH	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U18 Training Session	Sports Hub	{U18}	{mixed,girls}	2025-04-04 19:00:00	2025-04-04 20:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
P0XSQlTW0ReBTz0BBg4L4	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8-U9 Training Session	Jurong East	{U8,U9}	{mixed}	2025-04-01 17:30:00	2025-04-01 19:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-skill-1	uuid-5	Skill Building	Skillful Feet Facility	{U10,U11}	{boys,girls}	2025-08-26 04:20:25.519514	2025-08-26 05:20:25.519514	12	2000	upcoming	8	0	f	\N	2025-08-24 04:20:25.519514	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-skill-2	uuid-5	Advanced Training	Skillful Feet Facility	{U12,U13}	{boys,girls}	2025-08-28 04:20:25.519514	2025-08-28 05:50:25.519514	14	2800	upcoming	8	0	f	\N	2025-08-24 04:20:25.519514	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-1	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U12 Training Session	Turf City	{U10,U11,U12}	{girls,boys}	2025-08-08 18:00:00	2025-08-08 19:30:00	15	1000	upcoming	8	0	f	\N	2025-08-01 18:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-premier-1	uuid-6	Premier Training	Premier Complex	{U11,U12,U13}	{boys,girls}	2025-08-25 04:20:30.087477	2025-08-25 06:20:30.087477	20	4500	upcoming	8	0	f	\N	2025-08-24 04:20:30.087477	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-premier-2	uuid-6	Elite Girls Program	Premier Complex	{U12,U13}	{girls}	2025-08-26 04:20:30.087477	2025-08-26 05:50:30.087477	16	4000	upcoming	8	0	f	\N	2025-08-24 04:20:30.087477	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-premier-3	uuid-6	Boys Academy Elite	Premier Complex	{U11,U12,U13}	{boys}	2025-08-27 04:20:30.087477	2025-08-27 06:20:30.087477	18	4200	upcoming	8	0	f	\N	2025-08-24 04:20:30.087477	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-premier-4	uuid-6	Championship Series	Premier Complex	{U13}	{boys,girls}	2025-08-29 04:20:30.087477	2025-08-29 06:20:30.087477	14	5000	upcoming	8	0	f	\N	2025-08-24 04:20:30.087477	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-premier-5	uuid-6	Technical Mastery	Premier Complex	{U10,U11,U12}	{boys,girls}	2025-08-30 04:20:30.087477	2025-08-30 05:50:30.087477	22	3800	upcoming	8	0	f	\N	2025-08-24 04:20:30.087477	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
1ybLUC31-tBq2WqdWSBIp	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U16-U8 Training Session	Jurong East	{U16,U8}	{girls}	2025-04-02 18:00:00	2025-04-02 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
6o6rwIzIhpNtsyrKXZ6rA	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U8 Training Session	Jurong East	{U13,U18,U8}	{boys,girls}	2025-04-04 17:30:00	2025-04-04 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Nc7gOgpc0qVttYgIoPF9I	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12 Training Session	Jurong East	{U12}	{girls,boys}	2025-04-07 17:00:00	2025-04-07 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Q3-Kf50y2_mWbQT7u1qBS	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U18 Training Session	Jurong East	{U14,U18}	{boys,girls}	2025-05-06 18:00:00	2025-05-06 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
vB-5izGxGN5bLkS3vKrOn	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17-U8 Training Session	Jurong East	{U17,U8}	{boys,girls}	2025-05-06 16:00:00	2025-05-06 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
477GJn6O0G1GsnVzbrhwN	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U16 Training Session	Jurong East	{U11,U16}	{boys,girls}	2025-05-12 16:30:00	2025-05-12 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
FQbLWaFutBlXAUDcmWiLv	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17-U9 Training Session	Jurong East	{U17,U8,U9}	{mixed}	2025-05-15 18:30:00	2025-05-15 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
kAkmNtgFPD9h2GULP6aRr	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15 Training Session	Jurong East	{U15}	{boys,girls}	2025-05-15 16:30:00	2025-05-15 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
KogMRyloQw97omNG5sDMM	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U9 Training Session	Jurong East	{U10,U11,U9}	{boys,mixed}	2025-05-19 16:30:00	2025-05-19 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
da3L6-Qfr2dThWo88X-cX	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Jurong East	{U8}	{girls,boys}	2025-05-28 16:30:00	2025-05-28 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
TEQ_gFPSyN1AzbxaSqVS-	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U11-U9 Training Session	Jurong East	{U11,U14,U9}	{girls}	2025-05-29 17:00:00	2025-05-29 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
sV4fmM4HkfUZxU7w0BZcM	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8-U9 Training Session	Jurong East	{U8,U9}	{mixed,girls}	2025-06-12 16:00:00	2025-06-12 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
gNGBiVQMV--dzcePpOccF	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U9 Training Session	Turf City	{U10,U13,U9}	{boys,girls}	2025-04-02 17:00:00	2025-04-02 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
323718ad-da4f-4a17-8955-0581a21582d4	d98c4191-c7e0-474d-9dd7-672219d85e4d	Evening Training Session	Sports Hub	{U10,U11,U12}	{girls,boys}	2025-08-11 19:00:00	2025-08-11 20:00:00	12	1000	upcoming	8	0	f	\N	2025-08-11 18:39:07.969361	Sports Hub Training Center	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
QAZYr6iATHLdfPrS6BpIt	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U10-U18 Training Session	Jurong East	{U10,U15,U18}	{boys}	2025-06-04 16:30:00	2025-06-04 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ka4ZovNUh6thm4aQZeiJ-	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Sports Hub	{U8}	{mixed,boys}	2025-04-09 16:30:00	2025-04-09 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
-RYH2JhdLPiqJKvRzG4m5	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17 Training Session	Sports Hub	{U17}	{mixed,girls}	2025-04-10 18:30:00	2025-04-10 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
lZjJthmJDFTiEWRtS9ObX	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U9 Training Session	Sports Hub	{U13,U8,U9}	{mixed,girls}	2025-04-14 19:00:00	2025-04-14 20:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
a9vLR0Rs11ZuAMl2tkL98	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U14-U15 Training Session	Sports Hub	{U14,U15}	{boys}	2025-04-16 18:30:00	2025-04-16 20:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
B1CAoewYOgETCiP5knftu	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U15 Training Session	Sports Hub	{U14,U15}	{mixed,girls}	2025-04-17 18:00:00	2025-04-17 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
cYVM2SGvYwIvVohWITHyI	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Sports Hub	{U11}	{mixed}	2025-04-21 16:00:00	2025-04-21 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
p82k_XS1vP-_gj9PCzhjE	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U15 Training Session	Sports Hub	{U15}	{boys}	2025-04-28 17:30:00	2025-04-28 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
a9e03e7b-5622-4e6a-a06f-243b7ac7acc1	d98c4191-c7e0-474d-9dd7-672219d85e4d	Payment Test Session	Sports Hub	{U12}	{girls}	2025-10-02 02:49:00	2025-10-02 03:49:00	12	1000	upcoming	8	0	f	\N	2025-08-11 22:49:57.536797	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	15	t	t	0
Jn414Bdfk3n62HaEGGPrW	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Sports Hub	{U11}	{boys,girls}	2025-04-28 16:00:00	2025-04-28 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
IerOKGGkpYxmu7XReuKv9	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U9 Training Session	Sports Hub	{U14,U9}	{girls,boys,mixed}	2025-04-29 16:00:00	2025-04-29 17:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
i_C9hpFirXNsAdppDo0s_	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8-U9 Training Session	Sports Hub	{U8,U9}	{mixed}	2025-05-01 19:00:00	2025-05-01 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
sXyKLqPVVvk3fcBOx82bv	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16-U18 Training Session	Sports Hub	{U16,U17,U18}	{mixed,girls}	2025-05-01 18:30:00	2025-05-01 20:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
S8pith_fjdtP9XM3NWp6N	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12 Training Session	Sports Hub	{U12}	{mixed,girls,boys}	2025-05-05 19:00:00	2025-05-05 20:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
a_2L_lW416k8px3thI8ga	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U16 Training Session	Sports Hub	{U12,U15,U16}	{mixed,girls,boys}	2025-05-07 17:00:00	2025-05-07 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
aD1wjlyKU02IofvWKCGEw	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U17 Training Session	Sports Hub	{U15,U16,U17}	{mixed}	2025-05-13 17:00:00	2025-05-13 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
XSopiVWRzH4kQ-zJrv0Yg	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U8 Training Session	Sports Hub	{U14,U8}	{mixed}	2025-05-19 19:00:00	2025-05-19 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
6104d829-b270-41f5-a427-da6940799090	d98c4191-c7e0-474d-9dd7-672219d85e4d	test session	Sports Hub	{U12,U11,U13,U10}	{girls}	2025-08-12 03:00:00	2025-08-12 03:59:00	12	1000	upcoming	6	0	f	\N	2025-08-11 23:04:58.429195	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	t	0
mX-VckkDMkBxs_CS3DVhD	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U9 Training Session	Sports Hub	{U14,U9}	{mixed,girls}	2025-05-20 18:00:00	2025-05-20 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
bF8GlURR_TwsWzXhz3AWb	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U16 Training Session	Sports Hub	{U11,U16}	{mixed,girls}	2025-05-20 19:00:00	2025-05-20 20:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
h241DzqMgwmTY9q16kJZW	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Sports Hub	{U11,U13,U18}	{mixed}	2025-05-23 18:00:00	2025-05-23 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
sTbvxjRa9zffQ1hZFECmN	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U9 Training Session	Sports Hub	{U12,U14,U9}	{girls,boys}	2025-05-26 19:00:00	2025-05-26 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ToAPvO4p05hnoHImfmQGU	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U16-U9 Training Session	Sports Hub	{U16,U8,U9}	{boys}	2025-05-27 16:30:00	2025-05-27 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
y-skqwEDWOuyhEyM4HuMC	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U8 Training Session	Sports Hub	{U8}	{boys}	2025-05-29 17:00:00	2025-05-29 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
evQRCqTozkPZ-tCUjUyRr	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14 Training Session	Sports Hub	{U14}	{mixed,boys,girls}	2025-06-02 16:30:00	2025-06-02 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
oRL644UqfMl1HP1H8e-z-	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U9 Training Session	Sports Hub	{U11,U15,U9}	{mixed,boys,girls}	2025-06-03 18:00:00	2025-06-03 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
owlTEbr_Kfy_u2TmF9H0Y	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U18 Training Session	Sports Hub	{U10,U11,U18}	{boys,girls}	2025-06-05 18:00:00	2025-06-05 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
JbT3GXvEE40B353JthkyX	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12 Training Session	Sports Hub	{U12}	{mixed}	2025-06-05 16:30:00	2025-06-05 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
5Tlvq82iw6ZbjkxeszV1w	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12 Training Session	Sports Hub	{U12}	{mixed,girls}	2025-06-09 18:00:00	2025-06-09 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
0iHh8-337KLr7UBiZuxlc	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14 Training Session	Sports Hub	{U14}	{boys,girls}	2025-06-11 17:00:00	2025-06-11 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
test-today-3	d98c4191-c7e0-474d-9dd7-672219d85e4d	U13+ Boys Advanced	Sports Hub	{U13,U14,U15}	{boys}	2025-07-28 06:00:00	2025-07-28 07:30:00	10	1500	open	8	0	f	\N	2025-07-28 21:34:29.435721	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
JCB6mSMNvxmGrY8lLwaMP	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U14 Training Session	Sports Hub	{U12,U14}	{boys,girls}	2025-06-11 18:30:00	2025-06-11 20:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
EtXMyUZbALRRG5J3HDyCN	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12 Training Session	Sports Hub	{U12}	{mixed,boys}	2025-06-18 16:30:00	2025-06-18 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
sCSpQ3AwxAhW_jFgHq0AI	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U8 Training Session	Sports Hub	{U11,U12,U8}	{mixed,girls}	2025-06-18 18:30:00	2025-06-18 20:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
PqluBMUgcHPLjQIlczI0N	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12 Training Session	Sports Hub	{U12}	{mixed,girls}	2025-06-19 16:30:00	2025-06-19 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
7Dtbb4ZG3h_zYdkec_zdy	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U8-U9 Training Session	Sports Hub	{U8,U9}	{girls}	2025-06-19 16:30:00	2025-06-19 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Hq7L1Re_Iqm0TPxFsy15m	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16-U17 Training Session	Sports Hub	{U16,U17}	{mixed,girls}	2025-06-24 16:00:00	2025-06-24 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
vPqvK4DqRIZKdl3OqKgd7	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U17 Training Session	Sports Hub	{U13,U16,U17}	{mixed}	2025-06-24 17:30:00	2025-06-24 19:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
q7Y7myhjnF2tnieUNUVbH	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17-U9 Training Session	Sports Hub	{U17,U8,U9}	{boys,girls,mixed}	2025-06-24 16:30:00	2025-06-24 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
KTgdgJYGsov9gEwVtUBpT	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U8 Training Session	Sports Hub	{U8}	{boys}	2025-06-25 17:00:00	2025-06-25 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
R7f0R3fKCUGJrml3VaReI	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13 Training Session	Sports Hub	{U13}	{mixed,girls,boys}	2025-06-26 16:00:00	2025-06-26 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
9Rh5bt_jJiFVIDZPfo_nI	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U14 Training Session	Sports Hub	{U10,U14}	{girls,boys,mixed}	2025-06-27 16:00:00	2025-06-27 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
W1Xay3o6H1kz5i-32SqBI	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U14 Training Session	Sports Hub	{U13,U14}	{boys,girls,mixed}	2025-06-30 17:00:00	2025-06-30 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
t6YyF7mfUqcjcJpErlaQP	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U8 Training Session	Sports Hub	{U12,U8}	{girls,boys}	2025-07-03 17:00:00	2025-07-03 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
T1IoomwzQI71H7STUw6kn	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U8 Training Session	Sports Hub	{U15,U8}	{girls,boys}	2025-07-07 16:30:00	2025-07-07 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
HT-MERf1VbpSYg_rMwHKj	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17-U9 Training Session	Sports Hub	{U17,U18,U9}	{mixed,girls,boys}	2025-07-11 16:00:00	2025-07-11 17:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
GLu5NgqRMscw6RcyxFszA	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U9 Training Session	Sports Hub	{U10,U11,U9}	{mixed,girls}	2025-07-11 16:30:00	2025-07-11 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
GAEd5cife2Lzt-EMKLAPs	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U8 Training Session	Sports Hub	{U14,U8}	{mixed,girls}	2025-07-11 17:30:00	2025-07-11 19:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
XiBEQCtxbGlb63o4jgrkD	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U11 Training Session	Sports Hub	{U11}	{girls}	2025-07-15 17:30:00	2025-07-15 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
q50yoR4xZwtACj7BQhQ-b	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U9 Training Session	Sports Hub	{U10,U13,U9}	{girls,boys}	2025-07-16 19:00:00	2025-07-16 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Ot9Sx7rF2wIZU_3A8qPss	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17 Training Session	Sports Hub	{U17}	{mixed}	2025-07-18 18:30:00	2025-07-18 20:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
jwM7SkZcrMKrGAULBng8V	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U16 Training Session	Sports Hub	{U11,U16}	{boys,girls}	2025-07-18 17:30:00	2025-07-18 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
YH2ILZELrv1OWjoblg60S	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15 Training Session	Sports Hub	{U15}	{boys,girls}	2025-07-18 18:00:00	2025-07-18 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
SWiig2YxfSv8t2sLQP5zm	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U11-U16 Training Session	Sports Hub	{U11,U13,U16}	{girls}	2025-07-21 16:30:00	2025-07-21 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
7U8SJ192K-JQp5KdBvAgw	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12 Training Session	Sports Hub	{U12}	{mixed,girls}	2025-07-22 17:00:00	2025-07-22 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
2-eSpdH-2MG6dhX1s9bwj	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Sports Hub	{U11}	{girls,mixed}	2025-07-23 18:30:00	2025-07-23 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
rt2gM9D4s7O1771x1_QDz	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U12-U16 Training Session	Sports Hub	{U12,U13,U16}	{girls}	2025-07-23 16:30:00	2025-07-23 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
SDb8VLdc8GEK1teHd_-Ua	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14 Training Session	Sports Hub	{U14}	{boys,girls}	2025-07-23 17:30:00	2025-07-23 19:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ubTmQTnXaaZvynu6DSl0Z	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U13-U16 Training Session	Sports Hub	{U13,U16}	{girls}	2025-07-24 18:00:00	2025-07-24 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
AGnQi9ui8gxtEiS-yk6xT	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Sports Hub	{U8}	{boys,girls,mixed}	2025-07-25 16:00:00	2025-07-25 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
test-today-1	d98c4191-c7e0-474d-9dd7-672219d85e4d	U11 Girls Training	Test	{U11}	{girls}	2025-07-28 02:00:00	2025-07-28 03:30:00	12	1000	open	8	0	f	\N	2025-07-28 21:34:29.435721	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
PI7XMc9Pc0zRvMH9vfUA6	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U10-U16 Training Session	Sports Hub	{U10,U14,U16}	{boys}	2025-07-29 18:00:00	2025-07-29 19:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
M6zF4aa9V9u_wdl_66fvd	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U18 Training Session	Sports Hub	{U15,U18}	{boys,mixed}	2025-07-29 18:30:00	2025-07-29 20:00:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
nyUUbqRgRTybdu1ljeB6Z	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U8 Training Session	Sports Hub	{U11,U16,U8}	{mixed}	2025-07-30 17:30:00	2025-07-30 19:00:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
wsD1I1X456GDdCSTQ4viv	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U12 Training Session	Sports Hub	{U11,U12}	{girls,boys,mixed}	2025-08-11 18:30:00	2025-08-11 20:00:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
rh9_kWK6TtqNajBgsmeNR	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U15-U8 Training Session	Sports Hub	{U15,U16,U8}	{boys}	2025-08-12 17:30:00	2025-08-12 19:00:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
dxkSbUMgXUtjKChCxBdV1	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13 Training Session	Sports Hub	{U13}	{boys,mixed}	2025-08-15 19:00:00	2025-08-15 20:30:00	12	1000	full	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
FDXFJcMTvEdzhaxbkzrwp	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U8 Training Session	Sports Hub	{U15,U8}	{girls,boys}	2025-08-18 18:00:00	2025-08-18 19:30:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
4OK7MtNwFtQH4FFjuy65U	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U15 Training Session	Sports Hub	{U13,U15}	{boys,girls}	2025-08-18 17:30:00	2025-08-18 19:00:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
1MhGE46eI9WExniFcAVEr	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14 Training Session	Sports Hub	{U14}	{boys,girls}	2025-08-25 16:30:00	2025-08-25 18:00:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
VLC-3XW6DDSeAbMVj7Dgw	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U14 Training Session	Sports Hub	{U13,U14}	{girls,boys}	2025-08-26 16:30:00	2025-08-26 18:00:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
lLRhVKZEmVkZ_toty2R_9	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16 Training Session	Sports Hub	{U16}	{boys,girls}	2025-08-26 16:30:00	2025-08-26 18:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
7EhFuByC6DdAjSzmjHm_n	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U10-U11 Training Session	Turf City	{U10,U11}	{girls}	2025-04-16 16:00:00	2025-04-16 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ctACrhHnjl0iNSqJQDIiA	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U9 Training Session	Turf City	{U9}	{boys,girls}	2025-04-17 17:00:00	2025-04-17 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
QPY2QDGXFAf03UZK10f44	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U18-U9 Training Session	Turf City	{U18,U9}	{boys}	2025-04-17 17:00:00	2025-04-17 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
AwxxjWmUEf7lMGThnLWYA	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17 Training Session	Turf City	{U17}	{boys,girls}	2025-04-18 16:00:00	2025-04-18 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
9vbYf9UeENjuTmaLogr4t	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U17 Training Session	Turf City	{U15,U17}	{boys,girls}	2025-04-21 17:00:00	2025-04-21 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Lun9NntED4ZA0P0sMC1Fg	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U13-U8 Training Session	Turf City	{U13,U16,U8}	{girls}	2025-05-02 17:00:00	2025-05-02 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
bYOMq2GTkduA6NeT45_2o	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U17 Training Session	Turf City	{U10,U17}	{boys,girls}	2025-05-14 17:30:00	2025-05-14 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
JNrJyYezltm0G_2LfVv3D	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U17-U8 Training Session	Turf City	{U17,U8}	{girls}	2025-05-14 16:30:00	2025-05-14 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
fcd2o7aw3lBQd1RVB1AdU	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Turf City	{U8}	{boys,girls}	2025-05-14 17:30:00	2025-05-14 19:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
rzo44QPKq-BIDSu8Njlw8	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14 Training Session	Turf City	{U14}	{mixed,girls}	2025-05-16 16:30:00	2025-05-16 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
HSX_gVTzNFDec1t3ejRWN	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U9 Training Session	Turf City	{U14,U18,U9}	{mixed,girls,boys}	2025-05-16 18:30:00	2025-05-16 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
59rK1ubA4CemqnnGHtjz5	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Turf City	{U11,U17,U18}	{boys,girls}	2025-06-06 17:00:00	2025-06-06 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Z3SsNjTigufTiMWPUeibd	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U9 Training Session	Turf City	{U10,U9}	{boys,girls}	2025-06-09 18:00:00	2025-06-09 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
F0dDVXFmXIClK8BBd9dYs	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U8 Training Session	Turf City	{U15,U8}	{mixed}	2025-06-10 19:00:00	2025-06-10 20:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
d3GomKVeW7vugQRVYsGOE	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Turf City	{U8}	{mixed,girls}	2025-07-07 16:30:00	2025-07-07 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
p3-N-jgbHNyZvxflMi-tq	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U8 Training Session	Turf City	{U11,U13,U8}	{boys,girls}	2025-04-03 17:30:00	2025-04-03 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
DhFrbFwr9PFpo3dgtqt-P	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U10-U18 Training Session	Test	{U10,U11,U18}	{girls}	2025-04-01 16:30:00	2025-04-01 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
3KQoxP_MD6JMnO1t8pfBk	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U9 Training Session	Test	{U9}	{boys}	2025-04-03 17:00:00	2025-04-03 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
DRPWOTkE4VbO92XMwGAVO	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U10-U18 Training Session	Test	{U10,U14,U18}	{girls}	2025-04-03 18:00:00	2025-04-03 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
1RbvAkzNFR-pPVUQP2Lhw	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U18 Training Session	Test	{U12,U18}	{boys,mixed}	2025-04-04 16:00:00	2025-04-04 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-2	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U12 Training Session	Test Location	{U12}	{girls,boys}	2025-08-05 19:00:00	2025-08-05 20:30:00	15	1000	upcoming	8	0	f	\N	2025-07-29 19:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-3	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U12 Training Session	Sports Hub	{U11,U12}	{girls,boys}	2025-08-02 20:00:00	2025-08-02 21:30:00	15	1000	upcoming	8	0	f	\N	2025-07-26 20:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-4	d98c4191-c7e0-474d-9dd7-672219d85e4d	Technical Skills Session	Turf City	{U10,U11,U12}	{girls,boys}	2025-07-30 17:00:00	2025-07-30 18:30:00	15	1000	upcoming	8	0	f	\N	2025-07-23 17:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-5	d98c4191-c7e0-474d-9dd7-672219d85e4d	Match Preparation Session	Test Location	{U12}	{girls,boys}	2025-07-27 18:00:00	2025-07-27 19:30:00	15	1000	upcoming	8	0	f	\N	2025-07-20 18:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-6	d98c4191-c7e0-474d-9dd7-672219d85e4d	Fitness & Agility Session	Sports Hub	{U11,U12}	{girls,boys}	2025-07-24 19:00:00	2025-07-24 20:30:00	15	1000	upcoming	8	0	f	\N	2025-07-17 19:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-7	d98c4191-c7e0-474d-9dd7-672219d85e4d	Advanced Training Session	Turf City	{U10,U11,U12}	{girls,boys}	2025-07-21 20:00:00	2025-07-21 21:30:00	15	1000	upcoming	8	0	f	\N	2025-07-14 20:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-8	d98c4191-c7e0-474d-9dd7-672219d85e4d	Evening Training Session	Test Location	{U12}	{girls,boys}	2025-07-18 17:00:00	2025-07-18 18:30:00	15	1000	upcoming	8	0	f	\N	2025-07-11 17:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-9	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U12 Training Session	Sports Hub	{U11,U12}	{girls,boys}	2025-07-15 18:00:00	2025-07-15 19:30:00	15	1000	upcoming	8	0	f	\N	2025-07-08 18:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
aYWMendMZYRDm-Fq-9EwX	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U13 Training Session	Jurong East	{U13}	{boys}	2025-04-07 19:00:00	2025-04-07 20:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
dkp5DoTOVyp9X7V-qdZac	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Jurong East	{U11}	{boys,girls}	2025-04-07 17:00:00	2025-04-07 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
b0lkk_CirDgsXxmsB4Hkx	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U8 Training Session	Jurong East	{U10,U16,U8}	{boys,girls}	2025-04-08 16:30:00	2025-04-08 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
iKO6Xi2LGzBvx8p3aZBwY	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U11-U15 Training Session	Jurong East	{U11,U15}	{boys}	2025-04-09 17:00:00	2025-04-09 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
x8zxP_K_q_kA7LxpaKnMT	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Jurong East	{U8}	{mixed,girls,boys}	2025-04-16 16:00:00	2025-04-16 17:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
a-Q0gWtc0cqb1td8F6qLP	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U13 Training Session	Turf City	{U11,U13}	{boys,girls}	2025-04-08 19:00:00	2025-04-08 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
03yNbhEdxXMwSZi9t3gBK	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U14 Training Session	Turf City	{U13,U14}	{mixed,boys,girls}	2025-04-08 18:00:00	2025-04-08 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
6TtppRedsSapqieQ_WgLE	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8-U9 Training Session	Turf City	{U8,U9}	{boys,girls}	2025-04-08 17:00:00	2025-04-08 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
1e6D8bjEJKwRvYT1wT9Ur	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U16-U9 Training Session	Turf City	{U16,U8,U9}	{boys}	2025-04-14 16:30:00	2025-04-14 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
4k7uJbR_rbgKCNQ-3vuZH	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U8 Training Session	Turf City	{U15,U16,U8}	{boys,girls}	2025-04-15 17:00:00	2025-04-15 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Owbf6gAW0YYxBrcsODAiY	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U12-U9 Training Session	Turf City	{U12,U16,U9}	{boys}	2025-04-15 17:30:00	2025-04-15 19:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
95JCXHXjRl8SylzrUm83k	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U11-U18 Training Session	Test	{U11,U18}	{boys}	2025-04-10 18:30:00	2025-04-10 20:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Do94EBp8CHT94bpR0bTH3	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U12 Training Session	Test	{U11,U12}	{boys,girls}	2025-04-11 19:00:00	2025-04-11 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
RuPCHJLGLJZxZqVGm7nvb	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U9 Training Session	Test	{U12,U9}	{mixed,boys}	2025-04-11 16:30:00	2025-04-11 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
KqBHE8pot51GWG1kDdg6-	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U9 Training Session	Test	{U14,U15,U9}	{mixed,girls,boys}	2025-04-11 17:30:00	2025-04-11 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
b41UlDMwTdcm6kMeeunK0	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U17 Training Session	Test	{U15,U16,U17}	{boys,mixed}	2025-04-11 17:00:00	2025-04-11 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
stWCZ4p7X3F7H2j22Nrf0	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U18 Training Session	Test	{U14,U18}	{mixed,girls}	2025-04-15 18:00:00	2025-04-15 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ADjuRqTyqgRjzwa-XEPc7	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Test	{U11}	{boys,girls,mixed}	2025-04-18 19:00:00	2025-04-18 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
_07Sf_SqgbagmvmhYiS4H	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10 Training Session	Test	{U10}	{mixed,girls}	2025-04-21 16:00:00	2025-04-21 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
test-session-harper-9pm	d98c4191-c7e0-474d-9dd7-672219d85e4d	Test Session for Harper - 9PM	Test Location	{U10,U11,U12}	{girls,boys}	2025-08-11 21:00:00	2025-08-11 22:30:00	12	1000	open	8	0	f	\N	2025-08-11 19:06:16.243949	Test Training Center	\N	\N	\N	\N	\N	US	\N	\N	\N	t	5	45	t	f	\N
hist-session-10	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U12 Training Session	Turf City	{U10,U11,U12}	{girls,boys}	2025-07-12 19:00:00	2025-07-12 20:30:00	15	1000	upcoming	8	0	f	\N	2025-07-05 19:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-11	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U12 Training Session	Test Location	{U12}	{girls,boys}	2025-07-09 20:00:00	2025-07-09 21:30:00	15	1000	upcoming	8	0	f	\N	2025-07-02 20:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-12	d98c4191-c7e0-474d-9dd7-672219d85e4d	Technical Skills Session	Sports Hub	{U11,U12}	{girls,boys}	2025-07-06 17:00:00	2025-07-06 18:30:00	15	1000	upcoming	8	0	f	\N	2025-06-29 17:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-13	d98c4191-c7e0-474d-9dd7-672219d85e4d	Match Preparation Session	Turf City	{U10,U11,U12}	{girls,boys}	2025-07-03 18:00:00	2025-07-03 19:30:00	15	1000	upcoming	8	0	f	\N	2025-06-26 18:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-14	d98c4191-c7e0-474d-9dd7-672219d85e4d	Fitness & Agility Session	Test Location	{U12}	{girls,boys}	2025-06-30 19:00:00	2025-06-30 20:30:00	15	1000	upcoming	8	0	f	\N	2025-06-23 19:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-15	d98c4191-c7e0-474d-9dd7-672219d85e4d	Advanced Training Session	Sports Hub	{U11,U12}	{girls,boys}	2025-06-27 20:00:00	2025-06-27 21:30:00	15	1000	upcoming	8	0	f	\N	2025-06-20 20:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-16	d98c4191-c7e0-474d-9dd7-672219d85e4d	Evening Training Session	Turf City	{U10,U11,U12}	{girls,boys}	2025-06-24 17:00:00	2025-06-24 18:30:00	15	1000	upcoming	8	0	f	\N	2025-06-17 17:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
3N33i6qx5U3W2BMKTdlT0	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13 Training Session	Jurong East	{U13}	{girls,boys,mixed}	2025-04-21 19:00:00	2025-04-21 20:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
NBLX5fUQ6sQN4xztyQvqw	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U13-U9 Training Session	Jurong East	{U13,U9}	{boys}	2025-04-24 16:30:00	2025-04-24 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
dQwEgf3V4JWPybnHV3h0N	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U18 Training Session	Jurong East	{U14,U18}	{girls,mixed}	2025-04-25 18:30:00	2025-04-25 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
twPO44VHYPiueKAhJI6YX	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U8 Training Session	Jurong East	{U8}	{boys}	2025-05-01 18:00:00	2025-05-01 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Ld7SnkcyyqnX9_uxpVchI	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Jurong East	{U8}	{boys,mixed}	2025-05-02 16:00:00	2025-05-02 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
DLEfhMymrG7aaFP_wTfKu	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U9 Training Session	Jurong East	{U14,U9}	{boys,girls}	2025-05-02 19:00:00	2025-05-02 20:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
OrmJgGKQ6ZQcR3wdMTHyB	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16-U18 Training Session	Turf City	{U16,U17,U18}	{mixed}	2025-04-22 16:00:00	2025-04-22 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
8yImeHIKdAqDJajL_UKSl	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U10-U16 Training Session	Turf City	{U10,U12,U16}	{boys}	2025-04-23 16:30:00	2025-04-23 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
2ihKrnz34ATFlIsz7_u17	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U11 Training Session	Turf City	{U11}	{boys}	2025-04-23 17:00:00	2025-04-23 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
R_2qOuj2MAml-8zHTM5AT	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U8 Training Session	Turf City	{U13,U17,U8}	{boys,girls}	2025-04-23 18:00:00	2025-04-23 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
2XoVv2ABaxL7uPr-QsnnO	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U14 Training Session	Turf City	{U10,U13,U14}	{boys,girls}	2025-04-24 16:30:00	2025-04-24 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
GCA8_54w6J_1sQWRImoIv	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Turf City	{U8}	{boys,girls,mixed}	2025-04-30 19:00:00	2025-04-30 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
WRwS5Bo7oJMhllSdw8UvK	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U8 Training Session	Turf City	{U15,U8}	{mixed}	2025-04-30 16:30:00	2025-04-30 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
iqTviwP0kk_3WzUAY6RkN	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U9 Training Session	Turf City	{U10,U9}	{mixed}	2025-05-02 18:30:00	2025-05-02 20:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
RmgBI1wmHkmVkeq-TC8FZ	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U8 Training Session	Test	{U13,U18,U8}	{boys,girls}	2025-04-22 16:00:00	2025-04-22 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
0V_-9gdFKiAGYukctM3Vc	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U13 Training Session	Test	{U10,U13}	{mixed}	2025-04-23 18:00:00	2025-04-23 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
jpaKuf0fR_KjwejleWFkG	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14 Training Session	Test	{U14}	{boys,girls}	2025-04-25 19:00:00	2025-04-25 20:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
fAT_RPC7ge_IZH34IvClx	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U14 Training Session	Test	{U14}	{girls}	2025-04-29 17:30:00	2025-04-29 19:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
9bkY7wkyfyNhBTsCvhGN5	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16-U8 Training Session	Test	{U16,U8}	{boys,girls}	2025-05-05 18:00:00	2025-05-05 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
vAL5iYtjcDKd9oB5ZYsQM	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16-U8 Training Session	Test	{U16,U8}	{mixed,girls}	2025-05-05 17:30:00	2025-05-05 19:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
z0kWK8LdOOy1QpvkH2W9q	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Test	{U11,U18}	{mixed,girls}	2025-05-07 17:30:00	2025-05-07 19:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-17	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U12 Training Session	Test Location	{U12}	{girls,boys}	2025-06-21 18:00:00	2025-06-21 19:30:00	15	1000	upcoming	8	0	f	\N	2025-06-14 18:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-18	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U12 Training Session	Sports Hub	{U11,U12}	{girls,boys}	2025-06-18 19:00:00	2025-06-18 20:30:00	15	1000	upcoming	8	0	f	\N	2025-06-11 19:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-19	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U12 Training Session	Turf City	{U10,U11,U12}	{girls,boys}	2025-06-15 20:00:00	2025-06-15 21:30:00	15	1000	upcoming	8	0	f	\N	2025-06-08 20:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-20	d98c4191-c7e0-474d-9dd7-672219d85e4d	Technical Skills Session	Test Location	{U12}	{girls,boys}	2025-06-12 17:00:00	2025-06-12 18:30:00	15	1000	upcoming	8	0	f	\N	2025-06-05 17:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-21	d98c4191-c7e0-474d-9dd7-672219d85e4d	Match Preparation Session	Sports Hub	{U11,U12}	{girls,boys}	2025-06-09 18:00:00	2025-06-09 19:30:00	15	1000	upcoming	8	0	f	\N	2025-06-02 18:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-22	d98c4191-c7e0-474d-9dd7-672219d85e4d	Fitness & Agility Session	Turf City	{U10,U11,U12}	{girls,boys}	2025-06-06 19:00:00	2025-06-06 20:30:00	15	1000	upcoming	8	0	f	\N	2025-05-30 19:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-23	d98c4191-c7e0-474d-9dd7-672219d85e4d	Advanced Training Session	Test Location	{U12}	{girls,boys}	2025-06-03 20:00:00	2025-06-03 21:30:00	15	1000	upcoming	8	0	f	\N	2025-05-27 20:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-24	d98c4191-c7e0-474d-9dd7-672219d85e4d	Evening Training Session	Sports Hub	{U11,U12}	{girls,boys}	2025-05-31 17:00:00	2025-05-31 18:30:00	15	1000	upcoming	8	0	f	\N	2025-05-24 17:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-25	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U12 Training Session	Turf City	{U10,U11,U12}	{girls,boys}	2025-05-28 18:00:00	2025-05-28 19:30:00	15	1000	upcoming	8	0	f	\N	2025-05-21 18:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-26	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U12 Training Session	Test Location	{U12}	{girls,boys}	2025-05-25 19:00:00	2025-05-25 20:30:00	15	1000	upcoming	8	0	f	\N	2025-05-18 19:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-27	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U12 Training Session	Sports Hub	{U11,U12}	{girls,boys}	2025-05-22 20:00:00	2025-05-22 21:30:00	15	1000	upcoming	8	0	f	\N	2025-05-15 20:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
4iUVjVjmi7HcQT2oUopGO	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U14 Training Session	Jurong East	{U12,U13,U14}	{boys,girls}	2025-05-07 17:30:00	2025-05-07 19:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
qJrLRJmUuGzM6mKYVXDYd	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U15 Training Session	Jurong East	{U11,U14,U15}	{boys,girls}	2025-05-09 18:00:00	2025-05-09 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
0XRtKZdDD8r1SAEwpf6zq	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U9 Training Session	Turf City	{U10,U18,U9}	{boys,girls,mixed}	2025-05-07 17:30:00	2025-05-07 19:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
InrVw-m5vc2jqehKruq2B	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U15 Training Session	Turf City	{U11,U15}	{boys,girls,mixed}	2025-05-08 18:30:00	2025-05-08 20:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
CKNcJlow_FNE9vOpzhCNU	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U10 Training Session	Turf City	{U10}	{girls}	2025-05-09 16:00:00	2025-05-09 17:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
tpxVV1KSJ5XtXu5mWezyV	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U9 Training Session	Turf City	{U12,U8,U9}	{mixed,girls}	2025-05-12 16:00:00	2025-05-12 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
X8Nz5IfMTsuSCE5mGHotK	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U10-U15 Training Session	Turf City	{U10,U14,U15}	{boys}	2025-05-12 17:30:00	2025-05-12 19:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ZrQQyF_9cxhqSvlRCFmvd	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U9 Training Session	Turf City	{U13,U8,U9}	{mixed,boys}	2025-05-13 18:30:00	2025-05-13 20:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
64V_5rwzwLvGO4ZhfGu7p	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U9 Training Session	Test	{U9}	{boys,girls,mixed}	2025-05-08 18:00:00	2025-05-08 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
V_wGJkLlRqT57Cdw2wQlz	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U8 Training Session	Test	{U13,U15,U8}	{mixed,girls}	2025-05-08 18:30:00	2025-05-08 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
rsdjsEOdReWPdESDn5q1v	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U18-U9 Training Session	Test	{U18,U9}	{boys,girls}	2025-05-08 17:00:00	2025-05-08 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
VrrPLtcHBioUB-bSc81IA	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U16 Training Session	Test	{U10,U13,U16}	{girls,boys}	2025-05-09 17:30:00	2025-05-09 19:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
jlioFKH6uU9MNjW2CliG1	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U9 Training Session	Test	{U13,U8,U9}	{mixed}	2025-05-12 19:00:00	2025-05-12 20:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
1_-eysNtMTFxGLYjwHV2l	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U10-U13 Training Session	Test	{U10,U13}	{girls}	2025-05-13 18:00:00	2025-05-13 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
iSKOiLiO21auEMTqn48f4	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U18 Training Session	Test	{U10,U11,U18}	{boys,girls,mixed}	2025-05-13 19:00:00	2025-05-13 20:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
M22XLfiZyt7v7RPCaqNQw	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U10-U9 Training Session	Test	{U10,U9}	{girls}	2025-05-15 18:00:00	2025-05-15 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
OiWf5qs3xB7HsNjNBQ65e	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U9 Training Session	Test	{U14,U9}	{girls,boys}	2025-05-16 17:00:00	2025-05-16 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
YIPd8RggGyiFV7CdfbSiE	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U18 Training Session	Test	{U14,U16,U18}	{boys,mixed,girls}	2025-05-16 18:30:00	2025-05-16 20:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hist-session-28	d98c4191-c7e0-474d-9dd7-672219d85e4d	Technical Skills Session	Turf City	{U10,U11,U12}	{girls,boys}	2025-05-19 17:00:00	2025-05-19 18:30:00	15	1000	upcoming	8	0	f	\N	2025-05-12 17:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Eg5PJ9_V90F3QqQSXdaFZ	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13 Training Session	Jurong East	{U13}	{mixed,boys,girls}	2025-05-19 17:30:00	2025-05-19 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
3NYmkjFQlfeRLSZSZOVX4	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U12 Training Session	Jurong East	{U11,U12}	{mixed,girls}	2025-05-22 16:30:00	2025-05-22 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
q7SSGNNRD9XT8kIsYtJzy	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U14 Training Session	Jurong East	{U14}	{girls}	2025-05-22 16:30:00	2025-05-22 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
tfbApnegtJSQF74qyx2Cm	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U17 Training Session	Jurong East	{U11,U17}	{girls,boys}	2025-05-23 17:30:00	2025-05-23 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
c9OBBTLuIuuY5qC5yHkLi	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U10-U15 Training Session	Jurong East	{U10,U12,U15}	{boys}	2025-05-26 16:30:00	2025-05-26 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
kzabua6atORBVb49KOSg6	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13 Training Session	Jurong East	{U13}	{mixed,girls}	2025-05-27 16:00:00	2025-05-27 17:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
cEld81_5LOof87C-Hi1jq	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15 Training Session	Turf City	{U15}	{girls,boys}	2025-05-21 18:00:00	2025-05-21 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
uC2-HMQ6L83nssiyZS0wA	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U15 Training Session	Turf City	{U14,U15}	{girls,boys,mixed}	2025-05-22 17:30:00	2025-05-22 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
gcAfYuOuBzLMXv3KY7wcm	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14 Training Session	Turf City	{U14}	{boys,girls}	2025-05-22 16:30:00	2025-05-22 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
XhalQM0pbP3Fx6X1aW6fr	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U11 Training Session	Turf City	{U11}	{girls}	2025-05-26 19:00:00	2025-05-26 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
P1LahAqAC4uH2h2iaY3aU	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U12 Training Session	Turf City	{U11,U12}	{boys,girls}	2025-05-28 18:00:00	2025-05-28 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
kSS6Fv4rcEcXeGS_L30Ls	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U18 Training Session	Turf City	{U18}	{boys}	2025-05-29 16:30:00	2025-05-29 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
VorvX3NqgY8MJR-ZTKEi7	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U9 Training Session	Turf City	{U12,U13,U9}	{boys,mixed}	2025-05-30 18:30:00	2025-05-30 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
GacTBXetzTt8RxwfNj_Ha	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U12-U8 Training Session	Turf City	{U12,U17,U8}	{girls}	2025-05-30 18:00:00	2025-05-30 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
cXa3NC5eIdzUwJuTuUns_	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U18 Training Session	Test	{U14,U15,U18}	{mixed,girls,boys}	2025-05-20 16:00:00	2025-05-20 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
z75v1seZGKYErNI0BAnrd	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Test	{U8}	{mixed,girls}	2025-05-21 19:00:00	2025-05-21 20:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
LJ8AHY2BuvmVin0RNszOt	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17-U8 Training Session	Test	{U17,U8}	{boys,girls,mixed}	2025-05-26 18:00:00	2025-05-26 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
oVMR6oq67ns1U2c1Acc3T	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17 Training Session	Test	{U17}	{girls,boys}	2025-05-27 16:30:00	2025-05-27 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Rv-sSuGfDv76c8rD2DoA6	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U15-U17 Training Session	Test	{U15,U17}	{boys}	2025-05-27 17:00:00	2025-05-27 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
yId19Qwg2QQRFZika5JhU	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U17 Training Session	Test	{U10,U11,U17}	{mixed}	2025-05-30 18:30:00	2025-05-30 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
aOoeovxBJfxY0V6-AKV2F	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U10-U18 Training Session	Test	{U10,U18}	{girls}	2025-05-30 18:00:00	2025-05-30 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
x5TwPGJTCAe1j-q6WHvhc	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10 Training Session	Test	{U10}	{boys,girls}	2025-06-02 16:00:00	2025-06-02 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
session-jul30-mixed-u10u13	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U13 Training Session	Sports Hub	{U10,U11,U12,U13}	{boys,girls}	2025-07-30 18:30:00	2025-07-30 20:00:00	15	1000	upcoming	8	0	f	\N	2025-07-23 10:00:00	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
aqDBO_51tn8Uy7HWsqbCX	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U8 Training Session	Jurong East	{U11,U14,U8}	{mixed,girls}	2025-06-02 17:30:00	2025-06-02 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Gq1WehsAGSFgqunQQsLXl	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U9 Training Session	Jurong East	{U9}	{mixed,girls}	2025-06-05 18:00:00	2025-06-05 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
W1lNPlywXMsPna-34y2PW	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U8 Training Session	Jurong East	{U14,U18,U8}	{mixed}	2025-06-09 18:30:00	2025-06-09 20:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
_jSGIH_u4-SGcmsI0pjp6	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U15-U18 Training Session	Jurong East	{U15,U18}	{girls}	2025-06-10 16:30:00	2025-06-10 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
6JqEdtKdIrnjeXphXbwGz	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U17 Training Session	Jurong East	{U13,U17}	{mixed}	2025-06-11 16:30:00	2025-06-11 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
x0zxrHIrIClXncqwJbPeS	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U8 Training Session	Jurong East	{U15,U17,U8}	{mixed}	2025-06-11 16:30:00	2025-06-11 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
lzltfLX_k6mC6xLdh1FSo	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U9 Training Session	Turf City	{U14,U9}	{boys,girls}	2025-06-03 18:30:00	2025-06-03 20:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
mbx3XOS5BC0qYvBNgsbZO	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U15 Training Session	Turf City	{U11,U15}	{boys,girls,mixed}	2025-06-03 16:30:00	2025-06-03 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
pO9w76zb9_X5Jqu5ldM2z	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U18-U8 Training Session	Turf City	{U18,U8}	{mixed,boys,girls}	2025-06-04 18:30:00	2025-06-04 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
nY7xpLbD_egsTre3fOVt6	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U18-U9 Training Session	Turf City	{U18,U8,U9}	{boys,girls,mixed}	2025-06-04 17:00:00	2025-06-04 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
t87jv0rXg9gN765onoaFs	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15 Training Session	Turf City	{U15}	{mixed,girls}	2025-06-05 19:00:00	2025-06-05 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
KYYc7kz8myrj_eIeMPEpJ	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U16 Training Session	Turf City	{U14,U15,U16}	{boys,girls}	2025-06-06 16:00:00	2025-06-06 17:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
p68VX2KVTL8ZnY9ZBcjrs	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U13-U17 Training Session	Turf City	{U13,U17}	{boys}	2025-06-06 18:30:00	2025-06-06 20:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
nWZnJBYipP4RPIFPSb15_	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16 Training Session	Test	{U16}	{mixed,girls,boys}	2025-06-02 18:00:00	2025-06-02 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hiC9Np_nj2IYOSSMqZGg4	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U14 Training Session	Test	{U10,U11,U14}	{boys,girls}	2025-06-04 18:30:00	2025-06-04 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
87Deq1fZnhmicj3pH3svE	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14 Training Session	Test	{U14}	{boys,girls,mixed}	2025-06-06 17:30:00	2025-06-06 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
exLSiAYLO8WDxL94zyHNX	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U17 Training Session	Test	{U13,U14,U17}	{mixed}	2025-06-09 16:30:00	2025-06-09 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
7vKoy9COa7Su-C68UOLgC	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U9 Training Session	Test	{U10,U9}	{boys,girls}	2025-06-12 16:00:00	2025-06-12 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
TrJxb8pMLZIAEe0VMYI7I	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U15 Training Session	Jurong East	{U10,U14,U15}	{mixed}	2025-06-12 18:00:00	2025-06-12 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
d9RIRzRZtfKH0iCP3kbmf	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U8 Training Session	Jurong East	{U13,U18,U8}	{mixed}	2025-06-16 16:30:00	2025-06-16 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
YCBEQWLnyLKj1iob4CwVM	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8-U9 Training Session	Jurong East	{U8,U9}	{mixed,girls}	2025-06-16 16:30:00	2025-06-16 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
T5iEJmeFqUelrhrGSWtuk	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14 Training Session	Jurong East	{U14}	{mixed}	2025-06-17 18:30:00	2025-06-17 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
6O8lNDoip9oQhS_5C8xNs	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U15 Training Session	Jurong East	{U14,U15}	{girls,boys}	2025-06-17 17:00:00	2025-06-17 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
9K97m6vndMUvGE2ksXMvy	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U14 Training Session	Jurong East	{U12,U13,U14}	{mixed,girls,boys}	2025-06-18 16:00:00	2025-06-18 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
IOGjD2rFTjTjJddcH0nc8	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U11-U8 Training Session	Jurong East	{U11,U14,U8}	{boys}	2025-06-23 18:30:00	2025-06-23 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
mTV6L0BfekXzG0gMrWH-T	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U17 Training Session	Turf City	{U13,U15,U17}	{mixed,boys}	2025-06-12 16:00:00	2025-06-12 17:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
b-n8SfXq98-2tUB7H4XmR	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Turf City	{U8}	{mixed,girls}	2025-06-13 18:30:00	2025-06-13 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.753	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
En3M2qhEaPaRwhcQVeYQf	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U16-U8 Training Session	Turf City	{U16,U17,U8}	{girls}	2025-06-16 17:30:00	2025-06-16 19:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
9m-wgZep8tDb4gxk2-sf1	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U8 Training Session	Turf City	{U10,U8}	{girls,boys}	2025-06-18 16:30:00	2025-06-18 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
q03FlxNKik4jpmNZYmNqS	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U8 Training Session	Turf City	{U11,U8}	{boys,girls}	2025-06-20 17:00:00	2025-06-20 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
TOaO06pq9_rMpjKxk422R	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U14 Training Session	Turf City	{U14}	{boys}	2025-08-21 18:00:00	2025-08-21 19:30:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
GWEq7VHuZxeKiydcsxQyo	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U8 Training Session	Turf City	{U11,U8}	{boys,girls}	2025-06-20 16:30:00	2025-06-20 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ufK_CHysIozT6-Dtn5JzS	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14 Training Session	Turf City	{U14}	{boys,girls,mixed}	2025-06-20 17:00:00	2025-06-20 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
OiSHTQfGpe0IsKBlTcRrx	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U15-U9 Training Session	Test	{U15,U8,U9}	{boys}	2025-06-13 17:00:00	2025-06-13 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
eczdB1foP9Y3BOxcJ1AYC	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U9 Training Session	Test	{U13,U8,U9}	{boys,mixed}	2025-06-16 18:00:00	2025-06-16 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
gM_DJFbkhR-_7wZgDvFYf	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U8 Training Session	Test	{U12,U18,U8}	{mixed,girls}	2025-06-19 18:30:00	2025-06-19 20:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
PwutFbcEMxjxbb3CjpqXT	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Test	{U11,U15,U18}	{boys,girls}	2025-06-23 16:00:00	2025-06-23 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
k4XJ3cnT_RfP_hvnB48kJ	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Test	{U11,U15,U18}	{mixed,girls}	2025-06-25 16:00:00	2025-06-25 17:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
qvj4l6l213qADlkzdvkRc	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U8 Training Session	Test	{U14,U18,U8}	{mixed,girls}	2025-06-25 16:30:00	2025-06-25 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
TsTU2wWSLVbwIDOhFEPyW	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U11-U8 Training Session	Jurong East	{U11,U8}	{boys}	2025-06-26 18:00:00	2025-06-26 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
iJKR4NIno-NU4RKzVdklN	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Jurong East	{U11,U13,U18}	{mixed}	2025-06-30 17:00:00	2025-06-30 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ZaE6Uusnis_JrfEEPybT5	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U14 Training Session	Jurong East	{U14}	{boys}	2025-07-04 16:30:00	2025-07-04 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
hzDwwgULcHXVXCDF5EGC5	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13 Training Session	Jurong East	{U13}	{mixed}	2025-07-04 16:30:00	2025-07-04 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Y2wqKAzCVGUtNhqjYKvlA	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U11 Training Session	Jurong East	{U11}	{boys}	2025-07-08 18:30:00	2025-07-08 20:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
lbeR_M_kN6JlgSQH-3-4P	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Turf City	{U11,U14,U18}	{girls,mixed}	2025-06-26 19:00:00	2025-06-26 20:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
33X4yxSVUmBfeLBs3IY5S	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8-U9 Training Session	Turf City	{U8,U9}	{boys,girls}	2025-06-27 17:30:00	2025-06-27 19:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
rFoVdb7fJ1_tEeKUDergj	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U14 Training Session	Turf City	{U13,U14}	{mixed,girls}	2025-06-30 17:00:00	2025-06-30 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Cfa1j_-Y73QU5NH2iuya4	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U8 Training Session	Turf City	{U11,U14,U8}	{boys,girls}	2025-07-01 18:00:00	2025-07-01 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
qaPTK_GBkD3NRTh7vR7RE	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U18 Training Session	Turf City	{U10,U13,U18}	{mixed,girls}	2025-07-03 18:30:00	2025-07-03 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
S1rPopz6ZtFQgDY2A_fhr	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U18 Training Session	Test	{U13,U18}	{boys,girls}	2025-06-25 18:00:00	2025-06-25 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
A-fkpIf9tmfeYaC_-1SKd	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U18 Training Session	Test	{U13,U14,U18}	{mixed}	2025-06-26 16:00:00	2025-06-26 17:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
-cpyhbmXuk2GNeP0BHIXu	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U18-U8 Training Session	Test	{U18,U8}	{girls}	2025-06-30 18:30:00	2025-06-30 20:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
1LnKEk7FXGXeRRDVUTxml	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U8-U9 Training Session	Test	{U8,U9}	{boys}	2025-07-01 16:30:00	2025-07-01 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
wmeSlm6q0iXYxE_yq2Ych	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U9 Training Session	Test	{U11,U18,U9}	{girls,boys}	2025-07-01 16:00:00	2025-07-01 17:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
upXRATS_jSOjtaMeIY-j4	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Test	{U11,U14,U18}	{mixed}	2025-07-02 16:30:00	2025-07-02 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
DNPIVL_vFkPn3HNHezlYQ	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U8 Training Session	Test	{U11,U8}	{mixed,girls}	2025-07-02 18:30:00	2025-07-02 20:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
HQDRIg3k9TkGT4Qk_0xlk	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U17 Training Session	Test	{U13,U15,U17}	{boys,girls}	2025-07-03 16:00:00	2025-07-03 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
7rnGXSKT8shYopFhzZvv8	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U8 Training Session	Test	{U14,U16,U8}	{girls,boys}	2025-07-04 18:30:00	2025-07-04 20:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
zO-vxsWdO45hFo6NqzYwF	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U11-U16 Training Session	Jurong East	{U11,U16}	{boys}	2025-07-09 17:30:00	2025-07-09 19:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
NXZUukS2mqxbJHWbcA972	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U8 Training Session	Jurong East	{U11,U8}	{mixed}	2025-07-10 18:00:00	2025-07-10 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ysWnRxxp4uO-zRZkxBZkn	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U8 Training Session	Jurong East	{U13,U16,U8}	{girls,boys,mixed}	2025-07-14 18:00:00	2025-07-14 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
rZTYsSM18wUFgVlZRTVgy	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U13-U15 Training Session	Jurong East	{U13,U14,U15}	{girls}	2025-07-14 17:00:00	2025-07-14 18:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
snxly0xf9Eh92cBKalpSJ	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Jurong East	{U8}	{boys,girls}	2025-07-14 18:00:00	2025-07-14 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
4XJWSx05XEwZ_XGg_w5WR	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U13-U8 Training Session	Jurong East	{U13,U15,U8}	{boys}	2025-07-15 19:00:00	2025-07-15 20:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
7ouAyZhMrvtT3ri2Z9kXq	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U8 Training Session	Jurong East	{U13,U18,U8}	{mixed,girls}	2025-07-15 17:00:00	2025-07-15 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
4Zw5rSxWgQKM8w65T_Vmf	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Jurong East	{U11}	{mixed}	2025-07-16 16:30:00	2025-07-16 18:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
q0HaaXOj5qqL67fc3ztgY	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10 Training Session	Jurong East	{U10}	{mixed}	2025-07-21 16:00:00	2025-07-21 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
c2gnXdC1pKVEwLd_l-7iB	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Turf City	{U11,U17,U18}	{boys,girls}	2025-07-10 16:00:00	2025-07-10 17:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
fOUfxZv_JgAjVH7gNgvr-	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16-U8 Training Session	Turf City	{U16,U8}	{mixed,girls,boys}	2025-07-10 16:30:00	2025-07-10 18:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
upyoen9xjhvn7tw3_G6iR	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17 Training Session	Turf City	{U17}	{mixed,girls}	2025-07-17 19:00:00	2025-07-17 20:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
t9BXa6yU-rivCBe0S3XuQ	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Turf City	{U11,U13,U18}	{boys,girls}	2025-07-17 16:30:00	2025-07-17 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
6xLrDUnGQPWh2qc2KzQhW	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U8 Training Session	Test	{U11,U17,U8}	{mixed}	2025-07-09 18:30:00	2025-07-09 20:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
LAvJm0ISQUybbFdRQT1ya	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15 Training Session	Test	{U15}	{mixed,girls,boys}	2025-07-09 16:30:00	2025-07-09 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
asfgg82OnZNLceTiVZdkH	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U18 Training Session	Test	{U10,U18}	{girls,boys}	2025-07-10 17:00:00	2025-07-10 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
oxxb72YXw2qNNARR1SnNj	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10 Training Session	Test	{U10}	{boys,girls}	2025-07-14 16:30:00	2025-07-14 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
0EuhLxyh320-3QwkZaXX2	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15 Training Session	Test	{U15}	{mixed}	2025-07-18 16:00:00	2025-07-18 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ydN1ESGUKJeEgfTAlRuh1	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13 Training Session	Jurong East	{U13}	{mixed}	2025-07-24 18:30:00	2025-07-24 20:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Hg3-ANLKiUMAtqLy1qZSZ	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17-U18 Training Session	Jurong East	{U17,U18}	{mixed,girls}	2025-07-25 16:00:00	2025-07-25 17:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
eJPQhTOerZ3kK1sFzh-D6	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8-U9 Training Session	Jurong East	{U8,U9}	{mixed}	2025-07-25 18:30:00	2025-07-25 20:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
3zGYhUFQSeccLGxSl9Q9t	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U12 Training Session	Jurong East	{U10,U11,U12}	{girls,mixed}	2025-07-28 16:30:00	2025-07-28 18:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
0riZeMGANajZpnLjYb6w8	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Jurong East	{U11}	{mixed,girls}	2025-07-28 18:30:00	2025-07-28 20:00:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
1328X1l-i3e2We0C3dO85	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Jurong East	{U11}	{girls,mixed}	2025-07-29 17:30:00	2025-07-29 19:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
rcn7m3nXe1DUiEAsN5AFD	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U13 Training Session	Jurong East	{U12,U13}	{mixed,girls}	2025-07-29 16:00:00	2025-07-29 17:30:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Q8vrCwY_9bC345cmEa3YG	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U18-U9 Training Session	Jurong East	{U18,U8,U9}	{mixed}	2025-07-30 16:00:00	2025-07-30 17:30:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
sLRDH0e2yQhChJUH_uFq3	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15 Training Session	Jurong East	{U15}	{boys,mixed}	2025-07-31 18:30:00	2025-07-31 20:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
8RWe3ZF6OEdeF_-BvUecy	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Jurong East	{U8}	{boys,girls,mixed}	2025-07-31 17:00:00	2025-07-31 18:30:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
GdMYAlX2_-dtBJ0WIHk1R	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U15 Training Session	Turf City	{U15}	{girls}	2025-07-22 19:00:00	2025-07-22 20:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
yhoOE418zy5pbNLNc7Mll	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15 Training Session	Turf City	{U15}	{boys,mixed}	2025-07-25 17:30:00	2025-07-25 19:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
0lNQuaRfNIrkmsBagvY61	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U15 Training Session	Turf City	{U15}	{boys}	2025-08-01 18:00:00	2025-08-01 19:30:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
dsr07xR5HnF5legtinIFe	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16-U18 Training Session	Test	{U16,U18}	{mixed}	2025-07-21 19:00:00	2025-07-21 20:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
O4uEkhKcwFaSk2gzUn0WC	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Test	{U8}	{girls,boys,mixed}	2025-07-22 18:00:00	2025-07-22 19:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
AWiQpa7jKENPCo3IsfGs8	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U8 Training Session	Test	{U10,U8}	{girls,boys}	2025-07-28 16:00:00	2025-07-28 17:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
RKWcBfH5P1cefJLp8zLwt	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U9 Training Session	Test	{U10,U11,U9}	{mixed}	2025-07-30 16:30:00	2025-07-30 18:00:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
_Su7spEEjb1W0KHxh-Lvy	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U11 Training Session	Test	{U10,U11}	{girls,boys,mixed}	2025-07-30 18:00:00	2025-07-30 19:30:00	12	1000	full	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
kudq2dMWaoQiOfOrSMRAZ	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U18 Training Session	Test	{U10,U11,U18}	{boys,girls}	2025-07-31 18:30:00	2025-07-31 20:00:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
sjZCJQuhK7ceV_76EnjB9	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U13 Training Session	Test	{U10,U13}	{girls,boys}	2025-07-31 18:30:00	2025-07-31 20:00:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
qS_aaZF8QjsIQQhZhmqaz	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16 Training Session	Jurong East	{U16}	{boys,girls}	2025-08-01 17:30:00	2025-08-01 19:00:00	15	1000	full	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
tJ_m6Aaokl87T1WupK_G5	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U8 Training Session	Jurong East	{U14,U18,U8}	{mixed,girls}	2025-08-04 17:00:00	2025-08-04 18:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
WEIdfDZF5GVjyKFV4JRGN	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U12 Training Session	Jurong East	{U12}	{boys}	2025-08-13 18:30:00	2025-08-13 20:00:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
dpYTali-UPnEBZt4LicfN	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Turf City	{U11}	{girls,boys}	2025-08-01 16:30:00	2025-08-01 18:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
rUaZAeEv4Mjo_cF3Fhm9-	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U16 Training Session	Turf City	{U10,U11,U16}	{boys,girls,mixed}	2025-08-05 18:30:00	2025-08-05 20:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
fIDm8h-AnWS355VxotU_u	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U13-U9 Training Session	Turf City	{U13,U9}	{boys}	2025-08-07 18:30:00	2025-08-07 20:00:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
iKFsJZoPiX8I1f8AfyqjX	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U18 Training Session	Turf City	{U18}	{mixed,girls}	2025-08-07 17:00:00	2025-08-07 18:30:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
5Nj1pB7eqbfYjnwGlTYlc	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U15-U9 Training Session	Test	{U15,U9}	{boys}	2025-08-01 17:30:00	2025-08-01 19:00:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
RSS88Aq7pMH5BFJedZkru	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U16 Training Session	Test	{U11,U16}	{mixed,girls,boys}	2025-08-04 17:30:00	2025-08-04 19:00:00	15	1000	full	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
2AzBegIG2_UidaeKdm6Fd	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Test	{U11}	{mixed}	2025-08-05 17:00:00	2025-08-05 18:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ysmfE4E8eSk7kpOWD5kG6	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Test	{U11}	{boys,girls}	2025-08-05 18:00:00	2025-08-05 19:30:00	15	1000	full	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
TZ_rb0V_anAUHZLv_4XP1	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15 Training Session	Test	{U15}	{boys,girls}	2025-08-05 18:30:00	2025-08-05 20:00:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
H6HpA57a4_ONjv8t-ZA1H	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U13 Training Session	Test	{U13}	{boys}	2025-08-06 19:00:00	2025-08-06 20:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
5T5GNhzm4va_Lnm6cuMCt	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U12 Training Session	Test	{U12}	{girls}	2025-08-06 17:30:00	2025-08-06 19:00:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
4y8XbbrmtkAILSCcPJn-f	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12 Training Session	Test	{U12}	{mixed,girls}	2025-08-06 16:00:00	2025-08-06 17:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
WGffUCtfraEfu3bgY1lJn	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U16 Training Session	Test	{U11,U16}	{girls,boys,mixed}	2025-08-08 17:00:00	2025-08-08 18:30:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
F0YlrXt4w62f8BqoNP0_3	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U8 Training Session	Jurong East	{U15,U8}	{mixed,girls}	2025-08-15 16:30:00	2025-08-15 18:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
rHRpfiuAYMBxvXqTYPqGp	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16-U9 Training Session	Jurong East	{U16,U9}	{boys,girls,mixed}	2025-08-18 16:30:00	2025-08-18 18:00:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
0UFCcIq4noqvaMlbOuSkM	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U17 Training Session	Jurong East	{U12,U14,U17}	{girls,boys}	2025-08-19 19:00:00	2025-08-19 20:30:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
D6sjUSFL4hCH1aIp7HkYH	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Jurong East	{U8}	{mixed}	2025-08-21 18:30:00	2025-08-21 20:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
MWL-nShTrCPonNroSW1po	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U8 Training Session	Jurong East	{U11,U13,U8}	{boys,girls,mixed}	2025-08-22 16:30:00	2025-08-22 18:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
6wCTrJnQqyhAOM_UthHS9	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U9 Training Session	Turf City	{U11,U17,U9}	{boys,girls}	2025-08-20 17:00:00	2025-08-20 18:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
mupQv2FOSvV1pEy49ur9K	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U14-U8 Training Session	Turf City	{U14,U16,U8}	{mixed,boys}	2025-08-26 18:30:00	2025-08-26 20:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
MMHTIEuIFELEbfYkLotxs	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U18 Training Session	Turf City	{U18}	{boys,girls,mixed}	2025-08-27 18:00:00	2025-08-27 19:30:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
2H67yzx53gsQN3C870Xsd	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U13 Training Session	Turf City	{U11,U13}	{mixed,girls,boys}	2025-08-27 17:00:00	2025-08-27 18:30:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
LQ3ZJiJxZIInJzyqRrhfE	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U10-U11 Training Session	Test	{U10,U11}	{boys}	2025-08-14 18:00:00	2025-08-14 19:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
i1APjLE8luUZT6GfO0qLS	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U9 Training Session	Test	{U9}	{girls,mixed}	2025-08-14 16:30:00	2025-08-14 18:00:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
PwGR5iMBrO59VChmffLc0	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U15 Training Session	Test	{U10,U15}	{mixed}	2025-08-15 16:00:00	2025-08-15 17:30:00	15	1000	full	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
z70t433_C9E4lS_NFA2k5	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U15-U17 Training Session	Test	{U15,U16,U17}	{boys}	2025-08-15 19:00:00	2025-08-15 20:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
M_Pr_mQOUlw4-Hd2AuYt_	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U11-U8 Training Session	Test	{U11,U8}	{boys}	2025-08-19 18:00:00	2025-08-19 19:30:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
3izHPyXN2bMWO874JeL4B	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U15-U8 Training Session	Test	{U15,U17,U8}	{boys}	2025-08-19 17:30:00	2025-08-19 19:00:00	18	1000	full	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
JEK39j3I5XYg4WDQeIeD3	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U8 Training Session	Test	{U12,U8}	{girls,mixed,boys}	2025-08-20 17:00:00	2025-08-20 18:30:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ErSiI_6_PT0Ik45ej6zd1	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U14 Training Session	Test	{U13,U14}	{boys,girls,mixed}	2025-08-21 16:00:00	2025-08-21 17:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
3IFWEMRiflxU4VT8eoBqs	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U12 Training Session	Sports Hub	{U10,U12}	{mixed}	2025-08-29 18:30:00	2025-08-29 20:00:00	18	1000	open	8	0	t	MQIXTB	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
VPXuko_OdHmQLqs5Y8F1h	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U14 Training Session	Sports Hub	{U14}	{girls}	2025-08-28 17:00:00	2025-08-28 18:30:00	15	1000	full	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
A6xnxFuWuit4ZooSViUwo	d98c4191-c7e0-474d-9dd7-672219d85e4d	Girls U11-U9 Training Session	Jurong East	{U11,U8,U9}	{girls}	2025-06-23 17:00:00	2025-06-23 18:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ws8pwajNon_o1E82wFHzM	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17-U9 Training Session	Jurong East	{U17,U8,U9}	{mixed}	2025-06-24 17:00:00	2025-06-24 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
cXWslIXJRb6wGvqWHk-Ae	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U9 Training Session	Jurong East	{U12,U8,U9}	{mixed}	2025-08-14 16:30:00	2025-08-14 18:00:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
pXWrJ7GOjU_x1bY2wdwoc	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U8 Training Session	Jurong East	{U15,U8}	{boys,girls}	2025-08-22 18:00:00	2025-08-22 19:30:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
klbLgJkLxxsMa4q5hhZtE	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16 Training Session	Jurong East	{U16}	{mixed,girls}	2025-08-26 18:00:00	2025-08-26 19:30:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ofpRgV3HoVkF4K0b1fvRi	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U15 Training Session	Jurong East	{U10,U15}	{mixed,girls,boys}	2025-08-28 18:30:00	2025-08-28 20:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
_BXoYZN2Ne_ej6J3DiM7L	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10 Training Session	Jurong East	{U10}	{boys,girls}	2025-08-29 18:00:00	2025-08-29 19:30:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
nHYnr6ZKA_98_8q58EI4q	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U9 Training Session	Jurong East	{U15,U18,U9}	{girls,mixed}	2025-08-29 17:00:00	2025-08-29 18:30:00	12	1000	full	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
MRh1dQv9UYKuGWYrpPTMi	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17-U8 Training Session	Turf City	{U17,U8}	{boys,girls}	2025-07-09 18:00:00	2025-07-09 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
N7cb4sKVSwaCXkb9xZ-zp	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Turf City	{U8}	{boys,girls}	2025-08-07 17:30:00	2025-08-07 19:00:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Ytz5Rqt_RzpWdRL1w2kTZ	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8 Training Session	Turf City	{U8}	{girls,boys}	2025-08-08 16:00:00	2025-08-08 17:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
p8exIVfLeOzFLjbn9TfGj	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U12 Training Session	Turf City	{U11,U12}	{mixed}	2025-08-08 18:00:00	2025-08-08 19:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
ClEM8CHrl_MMadwCWmeWS	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10 Training Session	Turf City	{U10}	{mixed,boys}	2025-08-12 19:00:00	2025-08-12 20:30:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
wVLAGxiiu53N8lXJFnvnN	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U16-U8 Training Session	Turf City	{U16,U18,U8}	{mixed,boys,girls}	2025-08-12 19:00:00	2025-08-12 20:30:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
1ua6NsF3gj8pgOohJPE-H	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15 Training Session	Turf City	{U15}	{mixed}	2025-08-28 17:30:00	2025-08-28 19:00:00	12	1000	full	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
test-today-2	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U8-U12 Session	Test	{U8,U9,U10,U11,U12}	{mixed}	2025-07-28 04:00:00	2025-07-28 05:30:00	16	1000	open	8	0	f	\N	2025-07-28 21:34:29.435721	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
LSmCK6-Kz1ANQMU37C6Wk	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U17 Training Session	Test	{U12,U13,U17}	{mixed,girls,boys}	2025-04-07 17:00:00	2025-04-07 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.752	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
4nkfuV-E1o6txKcPxwAR1	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11 Training Session	Test	{U11}	{boys,mixed}	2025-07-04 17:00:00	2025-07-04 18:30:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Hmsny_e_IbbrMeyNV-nmY	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U12-U8 Training Session	Test	{U12,U17,U8}	{mixed}	2025-07-08 17:30:00	2025-07-08 19:00:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
aaoiibc_zgXv4QuiaPhUE	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13-U9 Training Session	Test	{U13,U8,U9}	{mixed,boys}	2025-07-15 18:00:00	2025-07-15 19:30:00	15	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Z4Mzms-j5xT9ktaO6tCri	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U10-U9 Training Session	Test	{U10,U17,U9}	{mixed,girls,boys}	2025-07-16 18:30:00	2025-07-16 20:00:00	18	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
G6R1OFZ-pP1DxZ6jWRoen	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U18-U9 Training Session	Test	{U18,U9}	{boys,girls}	2025-07-17 18:00:00	2025-07-17 19:30:00	12	1000	closed	8	0	f	\N	2025-07-28 21:05:54.754	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
Cb1sbCsdPZcaxWUWV4-6E	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U13 Training Session	Test	{U13}	{boys,girls}	2025-08-11 18:00:00	2025-08-11 19:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
S6Lm6eIXUCt7nUfagyyFO	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U13 Training Session	Test	{U11,U12,U13}	{boys,girls}	2025-08-12 18:30:00	2025-08-12 20:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
YYnRE8-8by0EPoN1sPQoC	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Test	{U11,U14,U18}	{boys,girls}	2025-08-13 18:30:00	2025-08-13 20:00:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
bXt3ybXFjU1hkAJHJ4H8R	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Test	{U11,U18}	{girls,mixed}	2025-08-13 18:30:00	2025-08-13 20:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
9Lx3wOXic_4MDWnXzvAkS	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U16 Training Session	Test	{U11,U15,U16}	{mixed}	2025-08-13 18:30:00	2025-08-13 20:00:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
BILqWbMb4dUGI3pQydcOE	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U17 Training Session	Test	{U17}	{mixed,girls}	2025-08-22 17:00:00	2025-08-22 18:30:00	12	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
QrgBXR44nCzPnwO7QLtuF	d98c4191-c7e0-474d-9dd7-672219d85e4d	Boys U14 Training Session	Test	{U14}	{boys}	2025-08-25 16:30:00	2025-08-25 18:00:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
F-1-OOjYcKH_wwodpXr_T	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U11-U18 Training Session	Test	{U11,U13,U18}	{mixed,boys,girls}	2025-08-25 16:00:00	2025-08-25 17:30:00	18	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
egN-fo-gFw06-V0Z4hDvu	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mixed U15-U8 Training Session	Test	{U15,U18,U8}	{mixed,girls}	2025-08-28 17:30:00	2025-08-28 19:00:00	15	1000	open	8	0	f	\N	2025-07-28 21:05:54.755	\N	\N	\N	\N	\N	\N	US	\N	\N	\N	t	\N	60	t	f	\N
\.


--
-- Data for Name: guardian_links; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guardian_links (id, tenant_id, parent_id, player_id, relationship, permission_book, permission_pay, permission_consent, relationship_status, aged_out_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: help_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.help_requests (id, tenant_id, status, first_name, last_name, phone, email, subject, category, priority, message, resolved, resolved_by, resolution_note, resolved_at, reply_history, created_at, source, first_response_at) FROM stdin;
9729b48d-49f8-4f66-8799-0a3f3334151e	d98c4191-c7e0-474d-9dd7-672219d85e4d	resolved	Mary	Miller	\N	parent12@futsalculture.com	Password reset request	billing	high	Help request regarding session cancellation inquiry. Please assist with this matter.	f	admin-d98c4191-c7e0-474d-9dd7-672219d85e4d-0	Issue has been resolved. Thank you for contacting support.	2025-06-25 13:39:50.034	[]	2025-07-28 18:33:12.054093	main_page	\N
71d307d0-9596-48d0-b0a9-94b7f913cf51	d98c4191-c7e0-474d-9dd7-672219d85e4d	resolved	Donald	Harris	\N	parent10@futsalculture.com	Location change request	general	high	Help request regarding payment didn't go through. Please assist with this matter.	f	admin-d98c4191-c7e0-474d-9dd7-672219d85e4d-0	Issue has been resolved. Thank you for contacting support.	2025-06-28 12:19:16.33	[]	2025-07-28 18:33:12.089253	main_page	\N
cb37b99b-3ec2-446d-99b5-b93394590f3a	d98c4191-c7e0-474d-9dd7-672219d85e4d	resolved	William	Lopez	\N	parent4@futsalculture.com	Payment didn't go through	technical	low	Help request regarding session cancellation inquiry. Please assist with this matter.	f	admin-d98c4191-c7e0-474d-9dd7-672219d85e4d-1	Issue has been resolved. Thank you for contacting support.	2025-07-06 00:04:21.635	[]	2025-07-28 18:33:12.121863	main_page	\N
602e988d-a649-4c92-9300-c4179640ebb3	d98c4191-c7e0-474d-9dd7-672219d85e4d	replied	Thomas	Thompson	\N	parent14@futsalculture.com	Password reset request	billing	medium	Help request regarding account access issue. Please assist with this matter.	f	\N	\N	\N	[]	2025-07-28 18:33:12.153996	main_page	\N
77328de9-3dde-4646-abc0-93376e6f791e	d98c4191-c7e0-474d-9dd7-672219d85e4d	open	Daniel	Jackson	\N	parent16@futsalculture.com	Refund request	technical	medium	Help request regarding session time conflict. Please assist with this matter.	f	\N	\N	\N	[]	2025-07-28 18:33:12.18611	main_page	\N
1022c045-5039-4dfc-8601-a5500a146db7	c2d95cef-9cd3-4411-9e12-c478747e8c06	resolved	Deborah	Walker	\N	parent2@elitefootworkacademy.com	Can't book session	general	low	Help request regarding session time conflict. Please assist with this matter.	f	admin-c2d95cef-9cd3-4411-9e12-c478747e8c06-1	Issue has been resolved. Thank you for contacting support.	2025-06-15 08:46:46.913	[]	2025-07-28 18:33:44.293191	main_page	\N
671f0b46-f18b-4c59-aac9-302c2a964ace	c2d95cef-9cd3-4411-9e12-c478747e8c06	resolved	Lisa	Lee	\N	parent17@elitefootworkacademy.com	Payment didn't go through	general	medium	Help request regarding age group eligibility question. Please assist with this matter.	f	super-admin-c2d95cef-9cd3-4411-9e12-c478747e8c06	Issue has been resolved. Thank you for contacting support.	2025-06-13 19:56:50.88	[]	2025-07-28 18:33:44.326821	main_page	\N
1009ae57-e487-4474-a543-9a2ad9fa39ba	c2d95cef-9cd3-4411-9e12-c478747e8c06	resolved	Sharon	Moore	\N	parent16@elitefootworkacademy.com	Location change request	billing	low	Help request regarding mobile app not working. Please assist with this matter.	f	admin-c2d95cef-9cd3-4411-9e12-c478747e8c06-0	Issue has been resolved. Thank you for contacting support.	2025-04-04 18:22:01.815	[]	2025-07-28 18:33:44.360354	main_page	\N
9250c2da-e09e-45c8-99f0-8ddb99f4a17e	c2d95cef-9cd3-4411-9e12-c478747e8c06	open	Donald	Lopez	\N	parent9@elitefootworkacademy.com	Can't book session	technical	high	Help request regarding mobile app not working. Please assist with this matter.	f	\N	\N	\N	[]	2025-07-28 18:33:44.394543	main_page	\N
19e9d37f-c732-49ab-9c7b-510c05c9a62a	c2d95cef-9cd3-4411-9e12-c478747e8c06	resolved	Ruth	Young	\N	parent13@elitefootworkacademy.com	Mobile app not working	general	medium	Help request regarding refund request. Please assist with this matter.	f	super-admin-c2d95cef-9cd3-4411-9e12-c478747e8c06	Issue has been resolved. Thank you for contacting support.	2025-05-31 17:46:03.934	[]	2025-07-28 18:33:44.428315	main_page	\N
ed39fd04-7e1c-4f58-b3fd-647e9cf6dc89	c2d95cef-9cd3-4411-9e12-c478747e8c06	resolved	Laura	Johnson	\N	parent15@elitefootworkacademy.com	Refund request	billing	high	Help request regarding age group eligibility question. Please assist with this matter.	f	admin-c2d95cef-9cd3-4411-9e12-c478747e8c06-0	Issue has been resolved. Thank you for contacting support.	2025-06-22 02:25:19.074	[]	2025-07-28 18:33:44.460888	main_page	\N
0295d98b-7e33-49b7-a692-b312ce4537c6	c2d95cef-9cd3-4411-9e12-c478747e8c06	resolved	Paul	Hernandez	\N	parent2@elitefootworkacademy.com	Password reset request	technical	medium	Help request regarding payment didn't go through. Please assist with this matter.	f	admin-c2d95cef-9cd3-4411-9e12-c478747e8c06-1	Issue has been resolved. Thank you for contacting support.	2025-04-04 02:26:02.107	[]	2025-07-28 18:33:44.494735	main_page	\N
8369693e-fd8f-45ad-9785-fd505a105cbb	d98c4191-c7e0-474d-9dd7-672219d85e4d	open	John	Unknown	\N	john.unknown@external.com	General inquiry about sessions	general	medium	Hi, I am interested in learning more about your futsal training sessions for my child. Could you please provide me with more information about pricing and availability?	f	\N	\N	\N	[]	2025-07-29 01:24:41.159858	main_page	\N
4c1eef4e-d954-4d07-9100-6eb38e64331d	d98c4191-c7e0-474d-9dd7-672219d85e4d	open	Maria	Newcomer	(555) 987-6543	maria.newcomer@gmail.com	Questions about enrollment process	general	high	Hello, I just moved to the area and I am looking for a good futsal program for my 10-year-old daughter. She has never played before but is very interested in learning. What is your enrollment process and when can she start?	f	\N	\N	\N	[]	2025-07-29 01:24:49.990165	main_page	\N
5f878aff-c495-4c6a-8d7c-cd880d0d5f3c	d98c4191-c7e0-474d-9dd7-672219d85e4d	open	Sarah	Parent	(555) 123-4567	sarah.parent@example.com	Question about my child session	general	medium	I am logged into the parent portal and have a question about scheduling for my child. Could you help me understand the booking process better?	f	\N	\N	\N	[]	2025-07-29 01:32:39.815518	parent_portal	\N
4ef0c6ab-3340-472c-a878-16156f4f3ab0	d98c4191-c7e0-474d-9dd7-672219d85e4d	open	Player0	Test	\N	player0@test.com	Question from player portal	technical	low	I am using the player portal and have a question about my sessions.	f	\N	\N	\N	[]	2025-07-29 01:33:10.315465	player_portal	\N
\.


--
-- Data for Name: household_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.household_members (id, household_id, tenant_id, user_id, player_id, role, added_at, added_by) FROM stdin;
d35666fd-252a-44e1-8cd5-f98c4971889f	9b0376c9-676d-4f1d-9380-d7bd3477fbc5	8b976f98-3921-49f2-acf5-006f41d69095	b2c6f868-ac77-42bd-ae8c-fd7ae34a6105	\N	primary	2025-12-02 17:04:33.413947	b2c6f868-ac77-42bd-ae8c-fd7ae34a6105
872b49d9-a7b6-44b5-8721-d95c2f59ec10	26e28bd8-d91d-4f3d-b11a-7d516ecf01f9	platform-staging	ffc30f02-57cc-4409-a9bc-622228d247b4	\N	primary	2025-12-04 23:01:33.9857	ffc30f02-57cc-4409-a9bc-622228d247b4
\.


--
-- Data for Name: households; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.households (id, tenant_id, name, created_at, created_by) FROM stdin;
9b0376c9-676d-4f1d-9380-d7bd3477fbc5	8b976f98-3921-49f2-acf5-006f41d69095	The Brind Family	2025-12-02 17:04:33.37211	b2c6f868-ac77-42bd-ae8c-fd7ae34a6105
6287a134-030f-4822-a310-c3992bea0d08	8b976f98-3921-49f2-acf5-006f41d69095	The Brind Family	2025-12-02 17:10:00.502568	b2c6f868-ac77-42bd-ae8c-fd7ae34a6105
9fe821ff-160f-485b-94a4-831ae11e19bc	8b976f98-3921-49f2-acf5-006f41d69095	The Brind Family	2025-12-02 17:21:23.081653	b2c6f868-ac77-42bd-ae8c-fd7ae34a6105
26e28bd8-d91d-4f3d-b11a-7d516ecf01f9	platform-staging	The Brind Family	2025-12-04 23:01:33.935724	ffc30f02-57cc-4409-a9bc-622228d247b4
\.


--
-- Data for Name: impersonation_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.impersonation_events (id, super_admin_id, tenant_id, reason, token_jti, started_at, expires_at, revoked_at, ip) FROM stdin;
\.


--
-- Data for Name: integration_status_pings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integration_status_pings (id, integration, ok, latency_ms, created_at) FROM stdin;
\.


--
-- Data for Name: integration_webhook; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integration_webhook (id, name, url, enabled, signing_secret_enc, last_status, last_latency_ms, created_at, updated_at) FROM stdin;
wh_stripe_payments	Stripe Payment Webhooks	https://api.example.com/webhooks/stripe	t	\N	\N	\N	2025-08-23 22:52:38.588505	2025-08-23 22:52:38.588505
wh_sendgrid_email	SendGrid Email Events	https://api.example.com/webhooks/sendgrid	t	\N	\N	\N	2025-08-23 22:52:38.627674	2025-08-23 22:52:38.627674
wh_twilio_sms	Twilio SMS Events	https://api.example.com/webhooks/twilio	f	\N	\N	\N	2025-08-23 22:52:38.661969	2025-08-23 22:52:38.661969
wh_analytics	Analytics Events	https://analytics.example.com/webhook	t	\N	\N	\N	2025-08-23 22:52:38.696608	2025-08-23 22:52:38.696608
wh_mailchimp	Mailchimp Marketing	https://marketing.example.com/webhook	t	\N	\N	\N	2025-08-23 22:52:38.730984	2025-08-23 22:52:38.730984
\.


--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integrations (id, tenant_id, provider, credentials, enabled, configured_by, last_tested_at, test_status, test_error_message, created_at, updated_at) FROM stdin;
15311708-7651-482c-92b6-29df3a2ba116	d98c4191-c7e0-474d-9dd7-672219d85e4d	braintree	{"publicKey": "r5d8g822hssxjqwx", "merchantId": "tjyz324nch665ymz", "privateKey": "de0307070fd2efa7a4402c7b338df87d", "environment": "sandbox"}	t	45392508	2025-08-11 04:19:38.649	success	\N	2025-08-11 04:18:52.920137	2025-08-11 04:19:38.649
\.


--
-- Data for Name: invitation_analytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invitation_analytics (id, invitation_id, tenant_id, event_type, event_data, user_agent, ip_address, created_at) FROM stdin;
21dfc559-3281-4804-813d-708a10d09e8c	57b15f7d-d9ae-4a59-9d22-b51904c777d8	bfc3beff-6455-44e0-bc54-de5424fe3ae2	sent	{"type": "email", "method": "single"}	\N	\N	2025-08-27 01:58:12.319945
923f6a75-632c-445e-a0bb-8bac4e308572	5e651082-2d27-440d-8c8f-5d59bb78a299	491b8540-93f2-4942-af55-f32e6920654e	sent	{"type": "email", "method": "single"}	\N	\N	2025-08-27 02:34:27.601314
372c2eaf-5c74-4616-8f0d-8277115c1f24	5e651082-2d27-440d-8c8f-5d59bb78a299	491b8540-93f2-4942-af55-f32e6920654e	accepted	{"method": "unified_api", "acceptedAt": "2025-08-27T02:36:06.649Z"}	\N	\N	2025-08-27 02:36:06.667902
49bcccf6-6c47-4318-8bc2-071009b3b08f	57b15f7d-d9ae-4a59-9d22-b51904c777d8	bfc3beff-6455-44e0-bc54-de5424fe3ae2	accepted	{"method": "unified_api", "acceptedAt": "2025-08-27T03:16:53.027Z"}	\N	\N	2025-08-27 03:16:53.053527
286dce7f-f562-4caa-b53b-da636cd0f736	442ac5ca-21bc-42da-a243-581b18dc7022	8b976f98-3921-49f2-acf5-006f41d69095	accepted	{"method": "unified_api", "acceptedAt": "2025-08-27T04:07:57.542Z"}	\N	\N	2025-08-27 04:07:57.562224
60338b38-633e-45af-af93-9d803d236e9a	35d6710e-067d-4c9d-85c3-236de663e270	8b976f98-3921-49f2-acf5-006f41d69095	sent	{"type": "email", "method": "single"}	\N	\N	2025-08-27 04:42:50.952508
5b8228c4-73ca-4b86-b4c9-08af082a7ae3	35d6710e-067d-4c9d-85c3-236de663e270	8b976f98-3921-49f2-acf5-006f41d69095	accepted	{"method": "unified_api", "acceptedAt": "2025-08-27T11:36:12.322Z"}	\N	\N	2025-08-27 11:36:12.33961
\.


--
-- Data for Name: invitation_batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invitation_batches (id, tenant_id, created_by, total_invitations, successful_invitations, failed_invitations, status, metadata, error_log, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: invite_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invite_codes (id, tenant_id, code, code_type, description, is_default, is_active, age_group, gender, location, club, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, metadata, created_by, created_at, updated_at, is_platform, discount_duration) FROM stdin;
\.


--
-- Data for Name: invite_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invite_tokens (id, token, tenant_id, invited_email, role, player_id, purpose, expires_at, used_at, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: message_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_logs (id, tenant_id, provider, external_id, "to", "from", body, direction, status, error_code, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_preferences (id, tenant_id, parent_id, email, sms, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_templates (id, tenant_id, name, type, method, subject, template, active, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, tenant_id, signup_id, type, recipient, recipient_user_id, subject, message, status, scheduled_for, sent_at, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, tenant_id, signup_id, payment_intent_id, amount_cents, status, paid_at, refunded_at, refund_reason, refunded_by, admin_notes, created_at) FROM stdin;
dcc85de7-b888-46f8-a059-58360c5a1cf3	c2d95cef-9cd3-4411-9e12-c478747e8c06	signup-1	\N	5000	paid	2025-08-22 04:08:41.156966	\N	\N	\N	\N	2025-08-22 04:08:41.156966
3d837059-0934-40f6-9c39-72436fe9562b	c2d95cef-9cd3-4411-9e12-c478747e8c06	signup-2	\N	7500	paid	2025-08-21 04:08:41.156966	\N	\N	\N	\N	2025-08-21 04:08:41.156966
0462f950-62d7-4935-9fea-3e34d30b8ce2	d98c4191-c7e0-474d-9dd7-672219d85e4d	signup-3	\N	3200	paid	2025-08-23 04:08:41.156966	\N	\N	\N	\N	2025-08-23 04:08:41.156966
e039217e-9032-4bef-a55a-30f22b3344c0	d98c4191-c7e0-474d-9dd7-672219d85e4d	signup-4	\N	4500	paid	2025-08-20 04:08:41.156966	\N	\N	\N	\N	2025-08-20 04:08:41.156966
b54e8246-6300-4440-bc65-ec17f6368125	c2d95cef-9cd3-4411-9e12-c478747e8c06	signup-5	\N	8900	paid	2025-08-19 04:08:41.156966	\N	\N	\N	\N	2025-08-19 04:08:41.156966
4445e468-4cb9-4428-9d83-52cd20663ee9	c2d95cef-9cd3-4411-9e12-c478747e8c06	signup-6	\N	6200	paid	2025-08-16 04:08:41.156966	\N	\N	\N	\N	2025-08-16 04:08:41.156966
cb1c6485-c1b2-44f9-b2d7-09a952965b54	d98c4191-c7e0-474d-9dd7-672219d85e4d	signup-7	\N	5100	paid	2025-08-15 04:08:41.156966	\N	\N	\N	\N	2025-08-15 04:08:41.156966
d3bcd07e-3c1a-4701-93bf-b60fd01e49b7	d98c4191-c7e0-474d-9dd7-672219d85e4d	signup-8	\N	7200	paid	2025-08-14 04:08:41.156966	\N	\N	\N	\N	2025-08-14 04:08:41.156966
payment-metro-1	uuid-1	signup-metro-1	pi_metro_1_test	2500	paid	2025-08-14 04:21:34.479384	\N	\N	\N	\N	2025-08-24 04:21:34.479384
payment-metro-2	uuid-1	signup-metro-2	pi_metro_2_test	3000	paid	2025-08-16 04:21:34.479384	\N	\N	\N	\N	2025-08-24 04:21:34.479384
payment-metro-3	uuid-1	signup-metro-3	pi_metro_3_test	2500	paid	2025-08-18 04:21:34.479384	\N	\N	\N	\N	2025-08-24 04:21:34.479384
payment-metro-4	uuid-1	signup-metro-4	pi_metro_4_test	3500	paid	2025-08-20 04:21:34.479384	\N	\N	\N	\N	2025-08-24 04:21:34.479384
payment-metro-5	uuid-1	signup-metro-5	pi_metro_5_test	2000	paid	2025-08-22 04:21:34.479384	\N	\N	\N	\N	2025-08-24 04:21:34.479384
payment-metro-6	uuid-1	signup-metro-6	pi_metro_6_test	2500	paid	2025-08-23 04:21:34.479384	\N	\N	\N	\N	2025-08-24 04:21:34.479384
payment-metro-7	uuid-1	signup-metro-7	pi_metro_7_test	3000	paid	2025-08-24 04:21:34.479384	\N	\N	\N	\N	2025-08-24 04:21:34.479384
payment-rising-1	uuid-2	signup-rising-1	pi_rising_1_test	2000	paid	2025-08-19 04:21:39.595002	\N	\N	\N	\N	2025-08-24 04:21:39.595002
payment-rising-2	uuid-2	signup-rising-2	pi_rising_2_test	2500	paid	2025-08-21 04:21:39.595002	\N	\N	\N	\N	2025-08-24 04:21:39.595002
payment-rising-3	uuid-2	signup-rising-3	pi_rising_3_test	3000	paid	2025-08-23 04:21:39.595002	\N	\N	\N	\N	2025-08-24 04:21:39.595002
payment-rising-4	uuid-2	signup-rising-4	pi_rising_4_test	2000	paid	2025-08-24 04:21:39.595002	\N	\N	\N	\N	2025-08-24 04:21:39.595002
payment-champ-1	uuid-3	signup-champ-1	pi_champ_1_test	4000	paid	2025-08-12 04:21:46.829271	\N	\N	\N	\N	2025-08-24 04:21:46.829271
payment-champ-2	uuid-3	signup-champ-2	pi_champ_2_test	3500	paid	2025-08-14 04:21:46.829271	\N	\N	\N	\N	2025-08-24 04:21:46.829271
payment-champ-3	uuid-3	signup-champ-3	pi_champ_3_test	3500	paid	2025-08-16 04:21:46.829271	\N	\N	\N	\N	2025-08-24 04:21:46.829271
payment-champ-4	uuid-3	signup-champ-4	pi_champ_4_test	3000	paid	2025-08-18 04:21:46.829271	\N	\N	\N	\N	2025-08-24 04:21:46.829271
payment-champ-5	uuid-3	signup-champ-5	pi_champ_5_test	4500	paid	2025-08-20 04:21:46.829271	\N	\N	\N	\N	2025-08-24 04:21:46.829271
payment-champ-6	uuid-3	signup-champ-6	pi_champ_6_test	3000	paid	2025-08-22 04:21:46.829271	\N	\N	\N	\N	2025-08-24 04:21:46.829271
payment-champ-7	uuid-3	signup-champ-7	pi_champ_7_test	4000	paid	2025-08-23 04:21:46.829271	\N	\N	\N	\N	2025-08-24 04:21:46.829271
payment-champ-8	uuid-3	signup-champ-8	pi_champ_8_test	3500	paid	2025-08-24 04:21:46.829271	\N	\N	\N	\N	2025-08-24 04:21:46.829271
payment-youth-1	uuid-4	signup-youth-1	pi_youth_1_test	2200	paid	2025-08-17 04:21:51.613866	\N	\N	\N	\N	2025-08-24 04:21:51.613866
payment-youth-2	uuid-4	signup-youth-2	pi_youth_2_test	2500	paid	2025-08-19 04:21:51.613866	\N	\N	\N	\N	2025-08-24 04:21:51.613866
payment-youth-3	uuid-4	signup-youth-3	pi_youth_3_test	2800	paid	2025-08-21 04:21:51.613866	\N	\N	\N	\N	2025-08-24 04:21:51.613866
payment-youth-4	uuid-4	signup-youth-4	pi_youth_4_test	2400	paid	2025-08-23 04:21:51.613866	\N	\N	\N	\N	2025-08-24 04:21:51.613866
payment-youth-5	uuid-4	signup-youth-5	pi_youth_5_test	2200	paid	2025-08-24 04:21:51.613866	\N	\N	\N	\N	2025-08-24 04:21:51.613866
payment-skill-1	uuid-5	signup-skill-1	pi_skill_1_test	2000	paid	2025-08-20 04:21:55.146494	\N	\N	\N	\N	2025-08-24 04:21:55.146494
payment-skill-2	uuid-5	signup-skill-2	pi_skill_2_test	2800	paid	2025-08-22 04:21:55.146494	\N	\N	\N	\N	2025-08-24 04:21:55.146494
payment-skill-3	uuid-5	signup-skill-3	pi_skill_3_test	2000	paid	2025-08-24 04:21:55.146494	\N	\N	\N	\N	2025-08-24 04:21:55.146494
payment-premier-1	uuid-6	signup-premier-1	pi_premier_1_test	4500	paid	2025-08-18 04:22:01.605494	\N	\N	\N	\N	2025-08-24 04:22:01.605494
payment-premier-2	uuid-6	signup-premier-2	pi_premier_2_test	4000	paid	2025-08-19 04:22:01.605494	\N	\N	\N	\N	2025-08-24 04:22:01.605494
payment-premier-3	uuid-6	signup-premier-3	pi_premier_3_test	4200	paid	2025-08-20 04:22:01.605494	\N	\N	\N	\N	2025-08-24 04:22:01.605494
payment-premier-4	uuid-6	signup-premier-4	pi_premier_4_test	5000	paid	2025-08-21 04:22:01.605494	\N	\N	\N	\N	2025-08-24 04:22:01.605494
payment-premier-5	uuid-6	signup-premier-5	pi_premier_5_test	3800	paid	2025-08-22 04:22:01.605494	\N	\N	\N	\N	2025-08-24 04:22:01.605494
payment-premier-6	uuid-6	signup-premier-6	pi_premier_6_test	4500	paid	2025-08-23 04:22:01.605494	\N	\N	\N	\N	2025-08-24 04:22:01.605494
payment-premier-7	uuid-6	signup-premier-7	pi_premier_7_test	4000	paid	2025-08-24 04:22:01.605494	\N	\N	\N	\N	2025-08-24 04:22:01.605494
\.


--
-- Data for Name: plan_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plan_catalog (code, name, price_cents, limits) FROM stdin;
core	Core Plan	9900	{}
growth	Growth Plan	19900	{}
elite	Elite Plan	49900	{}
free	Free Plan	0	{"playerLimit": 10}
\.


--
-- Data for Name: plan_features; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plan_features (id, plan_code, feature_key, enabled, variant, limit_value, metadata, created_at, updated_at, updated_by) FROM stdin;
7cb5a060-e0c7-463e-8030-7b62ffa7b650	core	core.session_management	\N	manual_only	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
8644389e-202a-4834-ac30-9fa6ec952426	core	core.parent_player_booking	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
6f3746d3-4001-4bfb-bcd0-52dffcde72f0	core	core.waitlist	\N	manual_only	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
b031b29d-0584-4fcb-bd9c-ea3016b06efe	core	core.csv_export	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
a4ef15f2-4efe-49a2-a136-0f07e5b6356b	core	core.csv_import	f	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
44dc0741-09b7-4c18-a2c0-7219481b702b	core	core.bulk_operations	f	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
dcfdff4a-75e2-4012-aaa1-f927bf6085f9	core	core.access_codes	f	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
f1f136f0-7778-4250-a3fa-e3e5bd274e24	core	core.discount_codes	f	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
2cad1488-b152-46fc-8283-8a4477981eec	core	comm.email_notifications	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
d5e99e48-8696-4ee8-b8c3-e02b87e84b5b	core	comm.email_sms_gateway	f	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
998b3b77-c148-4f98-b391-bda9b1029319	core	pay.accept_online_payments	f	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
f858e299-05af-4070-bd64-b53daf2ab845	core	pay.payment_integrations	\N	stripe_only	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
98ffb85b-f0a5-4016-a6f1-52aa99eb5d0a	core	analytics.level	\N	basic	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
ff441afd-fc64-487f-8903-2a8cf4f74c73	core	integrations.calendar	f	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
075e2209-1621-4507-bf8e-6a3c8dcbac5e	core	integrations.additional	\N	none	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
8c0f1877-1bca-4018-9573-3e54faa71485	core	dev.api_access	f	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
ddf96477-8705-4bba-a637-05491fe2f967	core	support.level	\N	basic	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
2a8c2560-1286-4311-8f92-d00186e9a4b5	core	support.feature_request_queue	\N	basic	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
18474486-e444-4474-aae4-1ae6cfd0a344	core	limit.players_max	\N	\N	150	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
64d6518d-27f1-4b65-9e06-ab7bd1600f70	core	limit.sessions_monthly	\N	\N	50	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
33c649bd-ec9f-41c8-b949-4ac50b34f557	growth	core.session_management	\N	recurring	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
f309b026-5f81-4b95-801d-5e0a294b71c4	growth	core.parent_player_booking	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
df7fa08c-6e76-49ac-8275-1bf8726dd11c	growth	core.waitlist	\N	auto_promote	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
d46aabba-42cd-4338-aa18-356082377501	growth	core.csv_export	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
0b2fb39a-9d5d-4eda-a301-9797f78a755e	growth	core.csv_import	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
5d7af401-19db-408a-9fde-7fdde01d8213	growth	core.bulk_operations	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
9a9e9299-4d54-4228-847a-eb05ad191690	growth	core.access_codes	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
f3cdbb54-1ad6-4f41-b1ef-bf4bf85377fe	growth	core.discount_codes	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
2c23d29f-312c-4571-92b8-56ede135a3d8	growth	comm.email_notifications	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
068021ab-88c3-4733-b2d0-afe5b6fc2349	growth	comm.sms_notifications	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
1a31992d-67bb-47da-b3b2-4b5abb2e1973	growth	comm.email_sms_gateway	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
c2dc9ea5-0d47-4dfe-ab24-b72fabcf8a67	growth	pay.accept_online_payments	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
c7b4108f-9a40-4b8f-b457-892fdd3f2b14	growth	pay.payment_integrations	\N	stripe_only	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
f73f5802-fc98-40e9-b737-7524dd06bd7a	growth	analytics.level	\N	advanced	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
ffe32739-f24f-4531-a428-f1112328aa01	growth	integrations.calendar	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
a5c2e1e0-7258-4b1c-8826-bbc1c4de9343	growth	integrations.additional	\N	sendgrid_mailchimp_quickbooks	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
a9e14c33-cc16-406e-b3d9-dc31fac3ce6e	growth	dev.api_access	f	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
a07184ae-5d7d-4f4a-9882-6023d279a32b	growth	support.level	\N	standard	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
b6a75290-67f9-4272-b85c-7b9bec5ea7fb	growth	support.feature_request_queue	\N	standard	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
9c6d5354-1b4e-4e4b-b1be-24e5b40347fc	growth	limit.players_max	\N	\N	500	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
3d95734b-0d10-468e-8a3e-fc43c6849fbe	growth	limit.sessions_monthly	\N	\N	200	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
4cbf8ac3-505a-4ad8-879e-314e93238552	growth	limit.storage_gb	\N	\N	25	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
041d12b2-946f-4b94-b7d1-5e9409b5f22b	elite	core.session_management	\N	recurring_bulk	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
fd100a08-67ce-44e1-8a6a-0797661e97eb	elite	core.parent_player_booking	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
307e8f01-0993-4497-b501-1381534de09d	elite	core.waitlist	\N	auto_promote	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
1e1bba0e-a2bf-4e6b-840c-072870f377b0	elite	core.csv_export	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
25fa98d2-4fb4-410c-b442-3c53ecca34f1	elite	core.csv_import	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
6bb14973-0472-4222-8125-97e8d751d806	elite	core.bulk_operations	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
007557ca-e9e9-44d7-a871-6dd63e247276	elite	core.access_codes	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
aa961517-28e2-4af6-b480-affcb2aefcd1	elite	core.discount_codes	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
675f5a4b-5983-4a9a-80b8-e5dfe2af269e	elite	comm.email_notifications	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
1a2b5d74-375b-45a8-b49f-62dc9c870b9e	elite	comm.sms_notifications	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
3e70102c-3e3c-42b4-b270-f682a6a987b8	elite	comm.email_sms_gateway	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
902afbc9-a9ec-467e-b401-c3dfd27a34f5	elite	pay.accept_online_payments	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
1fd8fd4f-aeec-4cd3-aef2-6cfa7d6af775	elite	pay.payment_integrations	\N	multiple_providers	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
76cd77b7-0e8c-4396-931a-5641f1706e77	elite	integrations.calendar	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
032de3ee-c0bb-404c-8862-a61d344ddda7	elite	integrations.additional	\N	sendgrid_mailchimp_quickbooks_braintree	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
bd818551-22f7-4fe2-905a-a66187f8cee0	elite	dev.api_access	t	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
768a23c3-6ef9-4ef5-8ecc-333544ba8c37	elite	support.level	\N	priority_phone	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
4c6557cb-4ed5-4f3e-b267-8e149e75e075	elite	support.feature_request_queue	\N	priority	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
77c3ed04-8e99-4bcd-bd78-62665b73ff0a	elite	limit.players_max	\N	\N	999999	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
e466d1b1-8066-46ec-9b88-491a1843f147	elite	limit.sessions_monthly	\N	\N	999999	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
c13c5431-3909-458b-bd29-4eee0ae0e8f8	elite	analytics.level	\N	ai_powered	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 02:38:00.482+00	\N
54caad6f-b944-409e-bf23-dc64f6354f57	elite	limit.storage_gb	\N	\N	100	\N	2025-08-24 00:37:21.445696+00	2025-08-24 00:37:21.445696+00	\N
cdabc609-eea9-44f1-9fae-1c7d278ba628	free	core.waitlist	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
327fbcb0-72a8-459f-9d8c-9bea94531fb1	free	core.csv_export	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
bebe0289-87eb-470d-aa77-558a235f220b	free	core.csv_import	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
0ca80095-1a2f-4847-9936-8828d811a8e5	free	core.bulk_operations	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
ecdeaff9-c0fe-4981-9eb9-984c3dea90dc	free	core.access_codes	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
edc58603-d44b-40ce-b437-ff9e03a892ea	free	core.discount_codes	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
830c9986-fd77-4a88-b74d-433053e5a566	free	comm.email_notifications	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
65400b4d-e78d-4240-ae08-c684a2a56693	free	comm.sms_notifications	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
f6fd1ba3-0fb6-4d9e-9fc3-173c19c2f29e	free	comm.email_sms_gateway	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
3572368b-f7fd-4fb9-9bfc-e0e00dfde836	free	pay.accept_online_payments	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
e780e4c5-4b17-4cd7-8b51-e852d842e65d	free	pay.payment_integrations	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
4df0fff8-b24f-4837-b186-11bd1e01c7f4	free	integrations.calendar	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
288e3790-e98a-48ba-a1f2-ba8876e61ff1	free	integrations.additional	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
de037167-ba0f-4318-99f5-667436b99b0b	free	dev.api_access	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
904d26b0-c711-4784-8479-2a5aa17df04b	free	support.feature_request_queue	f	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:42.735868+00	\N
b200e037-0aa0-43dc-982a-d5be277b94ce	free	core.session_management	t	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:54.020247+00	\N
768ef2f6-20a8-4bc0-abd3-ea54464d1513	free	core.parent_player_booking	t	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:54.020247+00	\N
b899d5a5-852a-4180-9cac-502c6718bd7c	free	support.level	t	\N	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 01:32:54.020247+00	\N
e22585e8-8013-41e8-b805-f58e7f35b379	core	limit.storage_gb	\N	\N	10	\N	2025-08-24 00:37:21.445696+00	2025-08-24 02:51:17.47+00	\N
07a526a0-7a5d-4c43-a80e-83ac59887439	core	comm.sms_notifications	f	\N	\N	\N	2025-08-24 00:37:21.445696+00	2025-08-24 02:35:35.876+00	\N
c97d306b-9c19-45a4-bdf3-770772df1407	free	analytics.level	f	none	\N	\N	2025-08-24 01:32:42.735868+00	2025-08-24 02:37:59.088+00	\N
f68479ed-d90b-4e52-b35f-d40c2232d370	free	limit.players_max	f	\N	20	\N	2025-08-24 01:32:42.735868+00	2025-08-24 02:44:51.062+00	\N
40d52612-da41-4995-926a-9f90b009970c	free	limit.sessions_monthly	f	\N	25	\N	2025-08-24 01:32:42.735868+00	2025-08-24 02:48:59.448+00	\N
61d0b3e9-7747-48ff-bc88-5002f29ba88d	free	limit.storage_gb	f	\N	5	\N	2025-08-24 01:32:42.735868+00	2025-08-24 02:49:10.673+00	\N
\.


--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.platform_settings (id, policies, tenant_defaults, updated_by, created_at, updated_at, trial_settings) FROM stdin;
f0f55bc6-5f4e-4bc1-bae1-ceeee242f9fd	{"mfa": {"requireSuperAdmins": false, "requireTenantAdmins": false}, "session": {"idleTimeoutMinutes": 120}, "subdomains": {"dnsOk": true, "sslOk": true, "enabled": true, "baseDomain": "futsalculture.app"}, "maintenance": {"enabled": false, "message": ""}, "impersonation": {"allow": true, "maxMinutes": 60, "requireReason": true}, "retentionDays": {"pii": 730, "logs": 90, "analytics": 365}, "autoApproveTenants": false, "requireTenantApproval": true}	{"defaultPlanCode": "core", "sessionCapacity": 16, "seedSampleContent": true, "bookingWindowHours": 24}	\N	2025-08-24 04:11:48.600775	2025-08-24 04:11:48.600775	\N
\.


--
-- Data for Name: player_assessment_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.player_assessment_items (id, tenant_id, assessment_id, skill_id, level, comment, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: player_assessments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.player_assessments (id, tenant_id, player_id, assessed_by, session_id, assessment_date, overall_comment, visibility, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: player_goal_updates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.player_goal_updates (id, tenant_id, goal_id, created_by, note, progress_percent, created_at) FROM stdin;
\.


--
-- Data for Name: player_goals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.player_goals (id, tenant_id, player_id, created_by, title, description, target_date, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.players (id, tenant_id, first_name, last_name, birth_year, gender, parent_id, parent2_id, soccer_club, can_access_portal, can_book_and_pay, invite_sent_via, invited_at, user_account_created, email, phone_number, is_approved, registration_status, approved_at, approved_by, created_at, avatar_color, avatar_text_color, date_of_birth, is_adult, portal_activated_at, payment_activated_at, adult_transition_at, age_band, is_teen, became_adult_at, user_id) FROM stdin;
eea503e1-2578-44e7-be6e-865b4ac26a49	d98c4191-c7e0-474d-9dd7-672219d85e4d	Joshua	Smith	2016	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-1	\N	\N	f	f	\N	\N	f	nancy849@email.com	\N	t	approved	2025-06-30 14:29:40.661	\N	2025-07-28 18:32:43.936032	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
da32f68e-a111-43ca-b896-41f4d0d27764	d98c4191-c7e0-474d-9dd7-672219d85e4d	Helen	King	2008	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-2	\N	\N	t	t	\N	\N	f	sharon10@email.com	+18469839598	t	approved	2025-07-19 23:06:40.464	\N	2025-07-28 18:32:43.968469	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
c237d3e5-7b7a-478d-99ba-54076f801f18	d98c4191-c7e0-474d-9dd7-672219d85e4d	Kenneth	King	2014	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-2	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-06-20 23:26:33.484	\N	2025-07-28 18:32:44.000698	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
c2b8dce6-de2d-4259-a0b7-30a5ffaadd77	d98c4191-c7e0-474d-9dd7-672219d85e4d	Joseph	Walker	2008	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-3	\N	\N	t	t	\N	\N	f	sandra600@email.com	+17707129666	t	approved	2025-05-09 21:08:32.737	\N	2025-07-28 18:32:44.033216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
c43d0c83-3c1a-4611-a61c-0741f8001438	d98c4191-c7e0-474d-9dd7-672219d85e4d	Nancy	Walker	2016	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-3	\N	\N	f	f	\N	\N	f	jennifer951@email.com	\N	t	approved	2025-06-20 12:21:54.591	\N	2025-07-28 18:32:44.065905	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
cd7ec495-620b-431f-a137-485bcbcdb730	d98c4191-c7e0-474d-9dd7-672219d85e4d	Kevin	Walker	2010	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-3	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-07-28 12:12:41.729	\N	2025-07-28 18:32:44.098482	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
0c36adca-30eb-4d5c-8b0b-02dc97ec2f15	d98c4191-c7e0-474d-9dd7-672219d85e4d	Joshua	White	2010	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-4	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-07-19 11:35:57.44	\N	2025-07-28 18:32:44.131065	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
5d0635df-93fc-4ec6-81a3-3ccb50c44dde	d98c4191-c7e0-474d-9dd7-672219d85e4d	George	White	2012	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-4	\N	\N	t	t	\N	\N	f	kenneth190@email.com	\N	t	approved	2025-06-24 19:43:48.672	\N	2025-07-28 18:32:44.16353	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
068afd5b-ccf3-480c-bd4d-21158ed3be0f	d98c4191-c7e0-474d-9dd7-672219d85e4d	William	Allen	2017	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-5	\N	\N	f	f	\N	\N	f	nancy913@email.com	\N	t	approved	2025-07-05 13:54:19.123	\N	2025-07-28 18:32:44.195733	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
24f561ad-9031-4e43-a47c-9ff0305065fc	d98c4191-c7e0-474d-9dd7-672219d85e4d	Deborah	Allen	2017	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-5	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-05-15 21:33:51.156	\N	2025-07-28 18:32:44.228501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
247808ba-b8be-4e02-b6a7-1dd47e9a9b5a	d98c4191-c7e0-474d-9dd7-672219d85e4d	Carol	Allen	2013	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-7	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-07-25 01:33:56.747	\N	2025-07-28 18:32:44.293532	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
2398f077-96fc-4d10-858e-3aface4b6321	d98c4191-c7e0-474d-9dd7-672219d85e4d	Steven	Allen	2008	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-7	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-04-08 21:32:32.533	\N	2025-07-28 18:32:44.325911	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
402e33c4-9433-4560-b657-7da456746eb8	d98c4191-c7e0-474d-9dd7-672219d85e4d	Jennifer	Moore	2016	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-8	\N	\N	f	f	\N	\N	f	jessica173@email.com	\N	t	approved	2025-06-20 00:12:24.414	\N	2025-07-28 18:32:44.358885	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
b2825bea-d28d-4a1a-b105-ee2bb84a9746	d98c4191-c7e0-474d-9dd7-672219d85e4d	Jennifer	Robinson	2016	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-9	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-05-22 17:42:04.714	\N	2025-07-28 18:32:44.393256	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
f2d55d1d-e071-4620-bed5-be5634575148	d98c4191-c7e0-474d-9dd7-672219d85e4d	Daniel	Robinson	2016	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-9	\N	\N	f	f	\N	\N	f	christopher788@email.com	\N	t	approved	2025-04-13 18:09:09.161	\N	2025-07-28 18:32:44.42564	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
05ff752c-079a-4d93-9522-59cb875773f2	d98c4191-c7e0-474d-9dd7-672219d85e4d	Michelle	Robinson	2009	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-9	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-06-11 08:07:48.5	\N	2025-07-28 18:32:44.457987	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
602445ec-d9e7-477d-b57d-17c72b4c5e00	d98c4191-c7e0-474d-9dd7-672219d85e4d	James	Johnson	2014	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-10	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-04-28 23:30:13.033	\N	2025-07-28 18:32:44.491351	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
290317ac-3b52-4e4c-a08f-5c15a6a27c82	d98c4191-c7e0-474d-9dd7-672219d85e4d	Lisa	Hill	2015	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-11	\N	\N	f	f	\N	\N	f	\N	+17877696327	t	approved	2025-07-20 18:10:41.146	\N	2025-07-28 18:32:44.524141	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
f66d9fbd-2139-45c9-bfd1-b541ee881f54	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mary	Hill	2017	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-11	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-04-23 16:07:09.476	\N	2025-07-28 18:32:44.555397	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
8235ac95-c43c-4715-89db-758fe563e123	d98c4191-c7e0-474d-9dd7-672219d85e4d	Daniel	Jackson	2017	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-12	\N	\N	f	f	\N	\N	f	joseph78@email.com	\N	t	approved	2025-05-19 05:59:07.473	\N	2025-07-28 18:32:44.587897	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
d760aa4f-f4d1-4c74-b02b-05a8c0b7e0e9	d98c4191-c7e0-474d-9dd7-672219d85e4d	Linda	King	2011	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-13	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-05-09 12:41:21.417	\N	2025-07-28 18:32:44.620786	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
0b34bf28-f014-4a6e-9343-5a1ca4e88dcd	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mark	King	2010	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-13	\N	\N	t	t	\N	\N	f	\N	+13592419454	t	approved	2025-05-21 12:08:14.609	\N	2025-07-28 18:32:44.653022	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
62810ef5-99fd-4322-9f51-e1b89d9dc404	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mark	Thompson	2014	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-14	\N	\N	f	f	\N	\N	f	\N	+19564853565	t	approved	2025-06-15 13:30:40.787	\N	2025-07-28 18:32:44.685172	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
448a3f4e-1b2e-4050-9b97-9a84c9b725c0	d98c4191-c7e0-474d-9dd7-672219d85e4d	Christopher	Thompson	2017	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-14	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-05-17 22:43:22.217	\N	2025-07-28 18:32:44.716428	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
1ab6ba8d-d05e-49aa-b444-33da503bb749	d98c4191-c7e0-474d-9dd7-672219d85e4d	Anthony	Thompson	2012	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-14	\N	\N	t	f	\N	\N	f	\N	\N	t	approved	2025-05-05 04:33:22.602	\N	2025-07-28 18:32:44.748662	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
a14aae9a-d003-48d8-8b84-99fdfc1715c5	d98c4191-c7e0-474d-9dd7-672219d85e4d	Karen	Hill	2016	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-15	\N	\N	f	f	\N	\N	f	\N	+15042993846	t	approved	2025-07-25 05:59:57.144	\N	2025-07-28 18:32:44.781533	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
fded7980-d732-4012-b129-47d1606577ac	d98c4191-c7e0-474d-9dd7-672219d85e4d	Kimberly	Hill	2007	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-15	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-06-07 00:45:46.418	\N	2025-07-28 18:32:44.813689	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
27a4fd14-aabe-465e-884e-479e7fed5b6d	c2d95cef-9cd3-4411-9e12-c478747e8c06	Jessica	Martinez	2009	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-0	\N	\N	t	f	\N	\N	f	joseph74@email.com	\N	t	approved	2025-06-06 00:20:17.844	\N	2025-07-28 18:33:12.973921	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
e055f634-7c33-483d-9064-5df09aaf60f7	c2d95cef-9cd3-4411-9e12-c478747e8c06	James	Martinez	2009	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-0	\N	\N	t	t	\N	\N	f	jennifer837@email.com	\N	t	approved	2025-04-19 01:15:11.139	\N	2025-07-28 18:33:13.006479	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
23216a29-1623-43fa-9743-a4265fe4414e	c2d95cef-9cd3-4411-9e12-c478747e8c06	Jessica	Martinez	2015	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-0	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-06-19 03:55:49.105	\N	2025-07-28 18:33:13.038831	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
b6437df8-df0d-4242-8d48-3f5d2022cc63	c2d95cef-9cd3-4411-9e12-c478747e8c06	Kimberly	Miller	2008	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-1	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-05-12 12:07:57.408	\N	2025-07-28 18:33:13.070914	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
aff704eb-b14f-4af1-8766-70286b99acd3	c2d95cef-9cd3-4411-9e12-c478747e8c06	Jessica	Miller	2014	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-1	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-06-08 09:16:00.566	\N	2025-07-28 18:33:13.102947	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
a96eefb7-5846-45d2-974c-cabaf909e260	c2d95cef-9cd3-4411-9e12-c478747e8c06	Sandra	Miller	2017	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-1	\N	\N	f	f	\N	\N	f	george174@email.com	+17262961813	t	approved	2025-05-12 21:02:10.056	\N	2025-07-28 18:33:13.135035	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
1db1142b-a549-4113-b241-73e4fe3726a4	c2d95cef-9cd3-4411-9e12-c478747e8c06	Helen	Lewis	2016	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-2	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-06-13 01:03:53.887	\N	2025-07-28 18:33:13.167497	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-9	uuid-1	Oliver	Davis	2010	boys	parent-metro-9	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
9ea9f7e2-0437-4c01-a0b8-a22193042ba2	d98c4191-c7e0-474d-9dd7-672219d85e4d	Karen	Smith	2007	girls	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-1	\N	\N	t	f	\N	\N	f	\N	\N	t	approved	2025-05-13 17:37:44.874	\N	2025-07-28 18:32:43.9036	#10b981	\N	\N	t	\N	\N	\N	adult	f	2025-08-28 01:00:01.147	\N
fd6405f4-f911-459e-8906-d4667c09cbf7	c2d95cef-9cd3-4411-9e12-c478747e8c06	Helen	Lewis	2014	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-2	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-05-13 00:16:30.096	\N	2025-07-28 18:33:13.198466	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
0ee6d24a-bf0c-4cb6-b94d-f3a6ec8eff60	c2d95cef-9cd3-4411-9e12-c478747e8c06	Thomas	Anderson	2017	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-3	\N	\N	f	f	\N	\N	f	\N	+12072578527	t	approved	2025-04-18 05:28:47.612	\N	2025-07-28 18:33:13.232317	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
6da4fa9b-8bea-4248-b50b-97cf5a7fb674	c2d95cef-9cd3-4411-9e12-c478747e8c06	Brian	Davis	2010	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-4	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-06-01 01:59:03.345	\N	2025-07-28 18:33:13.264764	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
aa8b88b6-fe69-4b17-9f90-bb329a5b556b	c2d95cef-9cd3-4411-9e12-c478747e8c06	Donna	Davis	2012	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-4	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-06-13 18:24:37.652	\N	2025-07-28 18:33:13.297029	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
70e34756-e64e-4f52-b6f3-04d593180a4e	c2d95cef-9cd3-4411-9e12-c478747e8c06	Barbara	Smith	2016	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-5	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-05-05 23:16:04.957	\N	2025-07-28 18:33:13.329879	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
2f61690a-e93a-420b-a791-d5e5f84e25a4	c2d95cef-9cd3-4411-9e12-c478747e8c06	Michael	Smith	2010	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-5	\N	\N	t	f	\N	\N	f	kevin556@email.com	+15673716133	t	approved	2025-04-05 01:56:26.137	\N	2025-07-28 18:33:13.362354	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
0f20d52f-df78-4bcd-960d-5c0d49c18b73	c2d95cef-9cd3-4411-9e12-c478747e8c06	Sarah	Williams	2012	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-6	\N	\N	t	f	\N	\N	f	\N	\N	t	approved	2025-07-18 20:01:52.43	\N	2025-07-28 18:33:13.394471	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
4d069187-1de9-4d17-bb43-de93dd12231e	c2d95cef-9cd3-4411-9e12-c478747e8c06	George	Davis	2010	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-7	\N	\N	t	t	\N	\N	f	helen800@email.com	+12946808471	t	approved	2025-04-03 08:08:58.588	\N	2025-07-28 18:33:13.425489	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
9ff9d8d7-59bf-4c64-a393-66833a3f0d38	c2d95cef-9cd3-4411-9e12-c478747e8c06	Kenneth	Davis	2016	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-8	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-06-23 02:15:17.096	\N	2025-07-28 18:33:13.457795	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
f770c081-a667-44c1-93d6-1a2ba045ada8	c2d95cef-9cd3-4411-9e12-c478747e8c06	Christopher	Lewis	2017	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-9	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-06-19 08:50:08.999	\N	2025-07-28 18:33:13.48981	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
c2ca1edc-719f-44ce-8b14-be2afd38e9a8	c2d95cef-9cd3-4411-9e12-c478747e8c06	Richard	Lewis	2008	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-9	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-06-24 11:19:23.532	\N	2025-07-28 18:33:13.522087	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
25e89215-18a6-453d-ab91-d10844aa48c8	c2d95cef-9cd3-4411-9e12-c478747e8c06	Jessica	King	2014	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-10	\N	\N	f	f	\N	\N	f	\N	+18718906964	t	approved	2025-07-17 20:57:59.61	\N	2025-07-28 18:33:13.554063	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
01ef3ed8-6c6e-44f6-94c3-c84d3d234887	c2d95cef-9cd3-4411-9e12-c478747e8c06	Elizabeth	King	2010	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-10	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-04-04 09:02:19.325	\N	2025-07-28 18:33:13.586229	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
8d04b06a-7f0c-4ee8-8b40-815a1a0ab9e8	c2d95cef-9cd3-4411-9e12-c478747e8c06	Brian	King	2011	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-10	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-07-13 18:23:41.863	\N	2025-07-28 18:33:13.618414	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
0c878add-69eb-41d0-8260-2f30ea100b14	c2d95cef-9cd3-4411-9e12-c478747e8c06	Matthew	Wilson	2010	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-11	\N	\N	t	f	\N	\N	f	\N	\N	t	approved	2025-04-08 16:44:07.792	\N	2025-07-28 18:33:13.650682	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
08065989-63bc-4fe2-8957-ab7e81a81a85	c2d95cef-9cd3-4411-9e12-c478747e8c06	Nancy	Wilson	2012	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-11	\N	\N	t	t	\N	\N	f	mary44@email.com	\N	t	approved	2025-04-19 18:27:50.594	\N	2025-07-28 18:33:13.682971	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
619bbcf5-2449-4848-a4cb-72c823cb7395	c2d95cef-9cd3-4411-9e12-c478747e8c06	Laura	Thompson	2010	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-12	\N	\N	t	f	\N	\N	f	kevin395@email.com	\N	t	approved	2025-06-04 00:20:54.283	\N	2025-07-28 18:33:13.715265	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
d0fcf1a6-528d-4061-a6b7-33eb6e2ec82f	c2d95cef-9cd3-4411-9e12-c478747e8c06	Sarah	Thompson	2017	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-12	\N	\N	f	f	\N	\N	f	james741@email.com	\N	t	approved	2025-05-31 06:18:47.678	\N	2025-07-28 18:33:13.74749	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
42897249-b00a-4e55-82a4-a707ccc5c256	c2d95cef-9cd3-4411-9e12-c478747e8c06	David	Thompson	2015	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-12	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-06-12 23:11:20.297	\N	2025-07-28 18:33:13.779798	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
502b5be1-5cfb-4271-b293-0b87973b440c	c2d95cef-9cd3-4411-9e12-c478747e8c06	David	Nguyen	2016	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-13	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-05-31 12:53:12.922	\N	2025-07-28 18:33:13.811922	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
6b94270e-0c27-473a-a4c1-a3a532394c54	c2d95cef-9cd3-4411-9e12-c478747e8c06	Christopher	Nguyen	2015	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-13	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-05-23 03:52:50.73	\N	2025-07-28 18:33:13.844114	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
abb098bf-ce9e-424f-9f35-5629817ef6d9	c2d95cef-9cd3-4411-9e12-c478747e8c06	Sandra	Thomas	2017	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-14	\N	\N	f	f	\N	\N	f	\N	+12719757179	t	approved	2025-05-25 19:39:58.562	\N	2025-07-28 18:33:13.876475	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
e242d77d-4000-4b34-a2a8-9e973a437c91	c2d95cef-9cd3-4411-9e12-c478747e8c06	Richard	Thomas	2010	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-14	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-05-04 20:12:41.803	\N	2025-07-28 18:33:13.908698	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
8649ad45-4023-4a1b-847d-6ad8d3e2e546	c2d95cef-9cd3-4411-9e12-c478747e8c06	Helen	Thomas	2014	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-14	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-05-07 11:28:24.197	\N	2025-07-28 18:33:13.941189	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
9f9864b4-a06b-4ce5-91c0-b0ff36384064	c2d95cef-9cd3-4411-9e12-c478747e8c06	Robert	Robinson	2013	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-15	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-05-05 09:50:03.034	\N	2025-07-28 18:33:13.973748	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
05b23f9f-711a-4577-9bd6-6e25d9090dc1	c2d95cef-9cd3-4411-9e12-c478747e8c06	Nancy	Robinson	2013	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-15	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-04-12 20:14:17.149	\N	2025-07-28 18:33:14.006044	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
252c8d96-e595-43e2-8a01-33a9f2c3012c	c2d95cef-9cd3-4411-9e12-c478747e8c06	Linda	Sanchez	2014	boys	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-16	\N	\N	f	f	\N	\N	f	\N	+13465399194	t	approved	2025-06-21 17:19:04.993	\N	2025-07-28 18:33:14.038265	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
14a5f7b2-f520-4b68-b0d2-2a90b73cd58a	c2d95cef-9cd3-4411-9e12-c478747e8c06	Karen	Sanchez	2010	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-16	\N	\N	t	f	\N	\N	f	\N	+17623133092	t	approved	2025-05-14 11:53:19.883	\N	2025-07-28 18:33:14.070866	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
adbd1720-6331-4c80-80ef-9535045f96df	c2d95cef-9cd3-4411-9e12-c478747e8c06	Michelle	Sanchez	2012	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-16	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-04-18 00:59:09.752	\N	2025-07-28 18:33:14.103127	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
b5913b44-bb5c-4d8c-982e-b07061f81665	c2d95cef-9cd3-4411-9e12-c478747e8c06	Charles	Robinson	2008	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-17	\N	\N	t	f	\N	\N	f	\N	\N	t	approved	2025-04-23 01:11:05.589	\N	2025-07-28 18:33:14.13527	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
af38dfe3-72b8-496e-aabf-d7ab84297cfa	c2d95cef-9cd3-4411-9e12-c478747e8c06	Steven	Lewis	2016	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-18	\N	\N	f	f	\N	\N	f	\N	\N	t	approved	2025-05-23 04:25:25.638	\N	2025-07-28 18:33:14.198524	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
293d49fc-9eb6-40fb-8981-fde73f640314	d98c4191-c7e0-474d-9dd7-672219d85e4d	Harper	Brind	2014	girls	45392508	\N	Team Boca	f	f	\N	\N	f			t	approved	\N	\N	2025-07-28 20:33:53.393736	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-1	uuid-1	Alex	Thompson	2010	boys	parent-metro-1	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-2	uuid-1	Emma	Rodriguez	2011	girls	parent-metro-2	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-3	uuid-1	Lucas	Chen	2009	boys	parent-metro-3	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-4	uuid-1	Sofia	Martinez	2012	girls	parent-metro-4	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-5	uuid-1	Ethan	Johnson	2010	boys	parent-metro-5	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-6	uuid-1	Zoe	Williams	2011	girls	parent-metro-6	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-7	uuid-1	Noah	Garcia	2009	boys	parent-metro-7	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-8	uuid-1	Lily	Brown	2012	girls	parent-metro-8	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-10	uuid-1	Grace	Miller	2011	girls	parent-metro-10	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-11	uuid-1	Mason	Wilson	2009	boys	parent-metro-11	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-12	uuid-1	Chloe	Moore	2012	girls	parent-metro-12	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-13	uuid-1	Liam	Taylor	2010	boys	parent-metro-13	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-14	uuid-1	Mia	Anderson	2011	girls	parent-metro-14	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-15	uuid-1	Benjamin	Thomas	2009	boys	parent-metro-15	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-16	uuid-1	Aria	Jackson	2012	girls	parent-metro-16	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-17	uuid-1	Sebastian	White	2010	boys	parent-metro-17	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-18	uuid-1	Luna	Harris	2011	girls	parent-metro-18	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-19	uuid-1	Jackson	Martin	2009	boys	parent-metro-19	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-20	uuid-1	Nova	Thompson	2012	girls	parent-metro-20	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-21	uuid-1	Aiden	Garcia	2010	boys	parent-metro-21	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-22	uuid-1	Stella	Martinez	2011	girls	parent-metro-22	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-23	uuid-1	Carter	Robinson	2009	boys	parent-metro-23	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-24	uuid-1	Violet	Clark	2012	girls	parent-metro-24	\N	Metro FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-metro-25	uuid-1	Luke	Rodriguez	2010	boys	parent-metro-25	\N	Metro FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:18:57.077216	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-1	uuid-2	Maya	Singh	2010	girls	parent-rising-1	\N	Rising Stars	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-2	uuid-2	Diego	Hernandez	2011	boys	parent-rising-2	\N	Rising Stars	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-3	uuid-2	Kaia	O'Connor	2009	girls	parent-rising-3	\N	Rising Stars	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-4	uuid-2	Mateo	Lopez	2012	boys	parent-rising-4	\N	Rising Stars	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-5	uuid-2	Ivy	Kim	2010	girls	parent-rising-5	\N	Rising Stars	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-6	uuid-2	Kai	Patel	2011	boys	parent-rising-6	\N	Rising Stars	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-7	uuid-2	Ruby	Smith	2009	girls	parent-rising-7	\N	Rising Stars	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-8	uuid-2	Felix	Jones	2012	boys	parent-rising-8	\N	Rising Stars	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-9	uuid-2	Sage	Wong	2010	girls	parent-rising-9	\N	Rising Stars	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-10	uuid-2	River	Blake	2011	boys	parent-rising-10	\N	Rising Stars	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-11	uuid-2	Aurora	Cruz	2009	girls	parent-rising-11	\N	Rising Stars	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-12	uuid-2	Phoenix	Reed	2012	boys	parent-rising-12	\N	Rising Stars	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-13	uuid-2	Willow	Foster	2010	girls	parent-rising-13	\N	Rising Stars	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-14	uuid-2	Atlas	Price	2011	boys	parent-rising-14	\N	Rising Stars	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-15	uuid-2	Iris	Bell	2009	girls	parent-rising-15	\N	Rising Stars	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-16	uuid-2	Orion	Murphy	2012	boys	parent-rising-16	\N	Rising Stars	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-17	uuid-2	Hazel	Cooper	2010	girls	parent-rising-17	\N	Rising Stars	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-rising-18	uuid-2	Cruz	Rivera	2011	boys	parent-rising-18	\N	Rising Stars	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:05.328193	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-1	uuid-3	Isabella	Rodriguez	2010	girls	parent-champ-1	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-2	uuid-3	Gabriel	Martinez	2011	boys	parent-champ-2	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-3	uuid-3	Scarlett	Johnson	2009	girls	parent-champ-3	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-4	uuid-3	Leonardo	Brown	2012	boys	parent-champ-4	\N	Champions FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-5	uuid-3	Camila	Davis	2010	girls	parent-champ-5	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-6	uuid-3	Santiago	Wilson	2011	boys	parent-champ-6	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-7	uuid-3	Valentina	Garcia	2009	girls	parent-champ-7	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-8	uuid-3	Emiliano	Miller	2012	boys	parent-champ-8	\N	Champions FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-9	uuid-3	Victoria	Martinez	2010	girls	parent-champ-9	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-10	uuid-3	Adrian	Anderson	2011	boys	parent-champ-10	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-11	uuid-3	Natalia	Thomas	2009	girls	parent-champ-11	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-12	uuid-3	Julian	Jackson	2012	boys	parent-champ-12	\N	Champions FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-13	uuid-3	Elena	White	2010	girls	parent-champ-13	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-14	uuid-3	Carlos	Harris	2011	boys	parent-champ-14	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-15	uuid-3	Lucia	Martin	2009	girls	parent-champ-15	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-16	uuid-3	Francisco	Thompson	2012	boys	parent-champ-16	\N	Champions FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-17	uuid-3	Amelia	Garcia	2010	girls	parent-champ-17	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-18	uuid-3	Nicolas	Martinez	2011	boys	parent-champ-18	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-19	uuid-3	Regina	Robinson	2009	girls	parent-champ-19	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-20	uuid-3	Eduardo	Clark	2012	boys	parent-champ-20	\N	Champions FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-21	uuid-3	Daniela	Rodriguez	2010	girls	parent-champ-21	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-22	uuid-3	Alejandro	Lewis	2011	boys	parent-champ-22	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-23	uuid-3	Martina	Lee	2009	girls	parent-champ-23	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-24	uuid-3	Sebastian	Walker	2012	boys	parent-champ-24	\N	Champions FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-25	uuid-3	Catalina	Hall	2010	girls	parent-champ-25	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-26	uuid-3	Joaquin	Allen	2011	boys	parent-champ-26	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-27	uuid-3	Esperanza	Young	2009	girls	parent-champ-27	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-28	uuid-3	Ricardo	Hernandez	2012	boys	parent-champ-28	\N	Champions FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-29	uuid-3	Paloma	King	2010	girls	parent-champ-29	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-30	uuid-3	Andres	Wright	2011	boys	parent-champ-30	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-31	uuid-3	Fernanda	Lopez	2009	girls	parent-champ-31	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-32	uuid-3	Diego	Hill	2012	boys	parent-champ-32	\N	Champions FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-33	uuid-3	Ximena	Scott	2010	girls	parent-champ-33	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-34	uuid-3	Emilio	Green	2011	boys	parent-champ-34	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-champ-35	uuid-3	Alejandra	Adams	2009	girls	parent-champ-35	\N	Champions FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:27.38501	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-1	uuid-4	Hannah	Nelson	2010	girls	parent-youth-1	\N	Youth Hub	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-2	uuid-4	Connor	Carter	2011	boys	parent-youth-2	\N	Youth Hub	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-3	uuid-4	Addison	Mitchell	2009	girls	parent-youth-3	\N	Youth Hub	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-4	uuid-4	Wyatt	Perez	2012	boys	parent-youth-4	\N	Youth Hub	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-5	uuid-4	Avery	Roberts	2010	girls	parent-youth-5	\N	Youth Hub	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-6	uuid-4	Hunter	Turner	2011	boys	parent-youth-6	\N	Youth Hub	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-7	uuid-4	Brooklyn	Phillips	2009	girls	parent-youth-7	\N	Youth Hub	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-8	uuid-4	Brayden	Campbell	2012	boys	parent-youth-8	\N	Youth Hub	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-9	uuid-4	Layla	Parker	2010	girls	parent-youth-9	\N	Youth Hub	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-10	uuid-4	Landon	Evans	2011	boys	parent-youth-10	\N	Youth Hub	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-11	uuid-4	Zoey	Edwards	2009	girls	parent-youth-11	\N	Youth Hub	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-12	uuid-4	Colton	Collins	2012	boys	parent-youth-12	\N	Youth Hub	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-13	uuid-4	Skylar	Stewart	2010	girls	parent-youth-13	\N	Youth Hub	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-14	uuid-4	Jaxon	Sanchez	2011	boys	parent-youth-14	\N	Youth Hub	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-15	uuid-4	Aubrey	Morris	2009	girls	parent-youth-15	\N	Youth Hub	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-16	uuid-4	Carson	Rogers	2012	boys	parent-youth-16	\N	Youth Hub	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-17	uuid-4	Leah	Reed	2010	girls	parent-youth-17	\N	Youth Hub	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-18	uuid-4	Easton	Cook	2011	boys	parent-youth-18	\N	Youth Hub	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-19	uuid-4	Anna	Morgan	2009	girls	parent-youth-19	\N	Youth Hub	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-20	uuid-4	Nolan	Bell	2012	boys	parent-youth-20	\N	Youth Hub	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-21	uuid-4	Madelyn	Murphy	2010	girls	parent-youth-21	\N	Youth Hub	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-youth-22	uuid-4	Owen	Bailey	2011	boys	parent-youth-22	\N	Youth Hub	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:37.29522	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-1	uuid-5	Evelyn	Rivera	2010	girls	parent-skill-1	\N	Skillful Feet	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-2	uuid-5	Caleb	Cooper	2011	boys	parent-skill-2	\N	Skillful Feet	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-3	uuid-5	Harper	Richardson	2009	girls	parent-skill-3	\N	Skillful Feet	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-4	uuid-5	Ian	Cox	2012	boys	parent-skill-4	\N	Skillful Feet	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-5	uuid-5	Abigail	Howard	2010	girls	parent-skill-5	\N	Skillful Feet	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-6	uuid-5	Jordan	Ward	2011	boys	parent-skill-6	\N	Skillful Feet	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-7	uuid-5	Ella	Torres	2009	girls	parent-skill-7	\N	Skillful Feet	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-8	uuid-5	Grayson	Peterson	2012	boys	parent-skill-8	\N	Skillful Feet	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-9	uuid-5	Elizabeth	Gray	2010	girls	parent-skill-9	\N	Skillful Feet	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-10	uuid-5	Xavier	Ramirez	2011	boys	parent-skill-10	\N	Skillful Feet	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-11	uuid-5	Avery	James	2009	girls	parent-skill-11	\N	Skillful Feet	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-12	uuid-5	Lincoln	Watson	2012	boys	parent-skill-12	\N	Skillful Feet	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-13	uuid-5	Sofia	Brooks	2010	girls	parent-skill-13	\N	Skillful Feet	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-14	uuid-5	Leo	Kelly	2011	boys	parent-skill-14	\N	Skillful Feet	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-skill-15	uuid-5	Victoria	Sanders	2009	girls	parent-skill-15	\N	Skillful Feet	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:44.545791	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-1	uuid-6	Madison	Price	2010	girls	parent-premier-1	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-2	uuid-6	Aiden	Bennett	2011	boys	parent-premier-2	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-3	uuid-6	Eleanor	Wood	2009	girls	parent-premier-3	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-4	uuid-6	Grayson	Barnes	2012	boys	parent-premier-4	\N	Premier FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-5	uuid-6	Chloe	Ross	2010	girls	parent-premier-5	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-6	uuid-6	Ethan	Henderson	2011	boys	parent-premier-6	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-7	uuid-6	Lillian	Coleman	2009	girls	parent-premier-7	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-8	uuid-6	Mason	Jenkins	2012	boys	parent-premier-8	\N	Premier FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-9	uuid-6	Natalie	Perry	2010	girls	parent-premier-9	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-10	uuid-6	Lucas	Powell	2011	boys	parent-premier-10	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-11	uuid-6	Audrey	Long	2009	girls	parent-premier-11	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-12	uuid-6	Jack	Patterson	2012	boys	parent-premier-12	\N	Premier FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-13	uuid-6	Savannah	Hughes	2010	girls	parent-premier-13	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-14	uuid-6	Ryan	Flores	2011	boys	parent-premier-14	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-15	uuid-6	Claire	Washington	2009	girls	parent-premier-15	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-16	uuid-6	Nathan	Butler	2012	boys	parent-premier-16	\N	Premier FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-17	uuid-6	Stella	Simmons	2010	girls	parent-premier-17	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-18	uuid-6	Eli	Foster	2011	boys	parent-premier-18	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-19	uuid-6	Paisley	Gonzales	2009	girls	parent-premier-19	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-20	uuid-6	Christian	Bryant	2012	boys	parent-premier-20	\N	Premier FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-21	uuid-6	Bella	Alexander	2010	girls	parent-premier-21	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-22	uuid-6	Luke	Russell	2011	boys	parent-premier-22	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-23	uuid-6	Aria	Griffin	2009	girls	parent-premier-23	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-24	uuid-6	Isaiah	Diaz	2012	boys	parent-premier-24	\N	Premier FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-25	uuid-6	Nora	Hayes	2010	girls	parent-premier-25	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-26	uuid-6	Colton	Myers	2011	boys	parent-premier-26	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-27	uuid-6	Leah	Ford	2009	girls	parent-premier-27	\N	Premier FC	t	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
player-premier-28	uuid-6	Jaxon	Hamilton	2012	boys	parent-premier-28	\N	Premier FC	f	f	\N	\N	f	\N	\N	f	pending	\N	\N	2025-08-24 04:19:57.120624	#10b981	\N	\N	f	\N	\N	\N	child	f	\N	\N
f9877acb-5573-4b7a-a5d1-b68fcfb6f843	c2d95cef-9cd3-4411-9e12-c478747e8c06	Donna	Lewis	2007	girls	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-18	\N	\N	t	t	\N	\N	f	sarah435@email.com	\N	t	approved	2025-05-20 20:51:11.136	\N	2025-07-28 18:33:14.166451	#10b981	\N	\N	t	\N	\N	\N	adult	f	2025-08-27 01:00:01.062	\N
51b9d716-0fe7-4fbe-8997-cf4f045f7d3e	d98c4191-c7e0-474d-9dd7-672219d85e4d	Donna	Thompson	2007	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-0	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-06-17 08:36:48.135	\N	2025-07-28 18:32:43.865471	#10b981	\N	\N	t	\N	\N	\N	adult	f	2025-08-27 01:00:01.301	\N
3e803348-6477-4ebc-a22e-766db6973352	d98c4191-c7e0-474d-9dd7-672219d85e4d	Mary	Torres	2007	boys	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-6	\N	\N	t	t	\N	\N	f	\N	\N	t	approved	2025-07-27 21:08:17.258	\N	2025-07-28 18:32:44.261135	#10b981	\N	\N	t	\N	\N	\N	adult	f	2025-11-19 01:00:01.423	\N
\.


--
-- Data for Name: progression_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.progression_snapshots (id, tenant_id, player_id, snapshot_date, skill_id, aggregate_level, notes, created_at) FROM stdin;
\.


--
-- Data for Name: quickbooks_account_mappings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quickbooks_account_mappings (id, tenant_id, transaction_type, qb_account_id, qb_account_name, qb_account_type, qb_class_id, qb_class_name, qb_location_id, qb_location_name, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quickbooks_connections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quickbooks_connections (id, tenant_id, access_token, refresh_token, token_expires_at, realm_id, company_name, company_country, is_connected, last_sync_at, sync_status, last_error, auto_sync_enabled, sync_frequency, connected_at, connected_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quickbooks_sync_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quickbooks_sync_logs (id, tenant_id, sync_type, status, records_processed, records_created, records_updated, records_failed, started_at, completed_at, duration_ms, error_message, error_details, triggered_by, created_at) FROM stdin;
\.


--
-- Data for Name: quickbooks_sync_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quickbooks_sync_preferences (id, tenant_id, sync_customers, sync_invoices, sync_payments, sync_refunds, fiscal_year_start, report_timezone, auto_email_reports, report_recipients, report_frequency, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: service_billing; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_billing (id, tenant_id, organization_name, contact_email, billing_email, phone_number, address, city, state, postal_code, country, tax_id, billing_frequency, payment_method, credit_card_token, ach_account_info, preferred_invoice_day, notes, is_active, configured_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
rv6U8PMscdpCk0D0Xb7kto6iNR2FJLQE	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T03:46:26.538Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 03:46:27
O89UDzpZBt2ZZKtCmFNzqCnKW_3IiLt1	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T04:30:38.690Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 04:30:39
-NTTAFq-1TixIutTkCH4PEBWbrYgKqhp	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T02:56:52.938Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 02:56:53
JUyBV2WlBBidPze8bECnFqkzS7YFrUcx	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T02:56:53.308Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 02:56:54
ZAXeh2H-XVQuJ53l3jCIoM7hje0oi9LC	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T02:56:53.347Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 02:56:54
BjfhXV0sr_wkHbW5tT_kPIP9VEapXm_W	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T04:30:39.027Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 04:30:40
57k041IqhpMF-47rCs-NPuKaHS3cO8oB	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:10:26.445Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 05:10:27
B4dpuFBTl-lM_WnYkCiwRoz5KpVxM4O1	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:10:26.557Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 05:10:27
NostzgQ_f9v5raSquVEMSXQCvGR0aq9g	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:24:21.284Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 05:24:22
4_jZTAWZFQKYlJCLqWh7pBHLdH_b0j7K	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:24:21.801Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 05:24:22
xYItJwEWhjwsWg5lF3bNbmDo7rKbW6mW	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:10:26.664Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 05:10:28
zTsdIURQy_2rwSBOHyrgFgS3KAZBc6vd	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:53:48.326Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 05:53:49
ZmQyfm9ysNRgANbwvrJZZ4W9v1lTZ6fF	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:53:48.744Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 05:53:49
WIgdupRBw4aQuSIC65HcMDhTqVgrOy_E	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T13:40:44.348Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 13:40:45
I8_e51-D8U3dOyADFrzBSm6D24SlMsxX	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T03:46:26.775Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 03:47:11
vvPRQrVOdUNysNv7SZXjdQDj61Q2etUn	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:00:45.198Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:01:35
LoTHPHIs_jXMOTXdv1HFsEUECwbAbv7X	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T04:30:39.139Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 04:32:01
i9Mh5Tp5GhRQZHuwh6LMFas_h4DwHmlK	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T04:00:26.042Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 04:00:27
hzb2j64HvmCNJY_P-slMaNZ1S5IBx8sx	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:24:21.909Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 05:48:35
8oWafB7itUqW3NGy1ELWL5dpLyqxPjNX	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:00:44.921Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:00:45
nj5Rc9KC0Z5BiOcdRin4CZ7NScmxam1Q	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T04:00:25.918Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 04:00:26
0Adkvllav_XMJIfko3ejMvyEL4qnYG0W	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:36:16.179Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:36:17
y_dj-CW17fgSOcpXlwABIehuS_i5mwBc	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:36:15.967Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:36:16
fIDhtBvTcaQ9YiGIm67lHDqZY9G077EE	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:36:16.337Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:36:29
M0NzZIps2d38jxFy78EEJhmIF_ImbHFr	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:53:48.859Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:36:55
Urk1vs4DPGGux6eRDpfKjHtrKlSsq3fh	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:26:12.838Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:26:13
YXq9ABDZ6V8jD7iETbMS0o4069qpizaB	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:44:39.632Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:44:40
Wav9J_SDPCE_WKHNR6vce1y7MO3ge-f8	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:44:39.199Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:44:40
tlX0vrIYtiCF2Bc_TgzKzIESqyJ4_p2D	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:26:13.002Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:26:14
GKCG2O857-mAdj8yQJ3kNViflMZsort4	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:44:39.742Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:44:41
yh7XzJPsnEstQcrxx261QKUoMz1VUf-o	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T12:27:38.991Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 12:27:40
-VJf5mXeMvJsRoCRH1_k57TrP63c-QGU	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:26:13.116Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:26:25
5uM0RTlVXI1pK9F7_T3eIa5OoeaBZIFJ	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T03:46:26.665Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 03:46:27
0TJVha9sVfxfhk3a-9PxgL9aZMluw11C	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T03:51:11.901Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 03:51:12
oya-1TIt2zlXY9iYKnEftK5JpZP4YECd	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:58:21.757Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 05:58:22
oa0-lxMVTBIdM8EmQN6xFXxLhe0e_OkA	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T06:00:45.047Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 06:00:46
eiL7wf0XMV-506MEzusnEJDzrrdxbXD1	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T02:56:52.942Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 02:56:53
gmeTX1Tiq0oTyHovnp5jlFqMNTpuo1TR	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T03:51:12.116Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 03:51:14
iZi0Buz6UxNr10kpI5ktGBZaqf-UM32U	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T04:00:26.170Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 04:00:54
79-NIzzcMwljaDyEfuae7U3cq1XNVUN6	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T13:49:14.375Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 13:49:15
Mep4EOSNeqba9UjHEyshsN5r0xxG3HNz	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T13:40:44.875Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 13:40:46
gY07VA8IEXYjHQrofCvR1mQiHrkhsoBl	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T13:49:18.312Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 13:49:19
pPFNUp1jkh6o1hLVACviLthSbjNkAMYH	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:29:05.710Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:29:06
O5yvYltLC7_99ljluoc0UcFhJzaHCNy3	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:31:01.365Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:31:02
E_-UNiGDhSWtoQes6EiKl8Hy77jwjUv3	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:46:49.310Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:46:50
wMGitCzoCck75jb5iS78U9FfCOy2h-Bo	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T12:27:38.489Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 12:27:42
DBiusFAMtnrhYZqYHfsEDZArvIQNYtGx	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T15:03:48.269Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 15:03:49
2MHYTA-XxVsmWyScb3nnqatjIXTJsJdu	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:31:01.604Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:31:03
hLWDbOz44EjKJrFqGfbADkkOfIDnMRif	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T15:28:48.298Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 15:28:49
ZunYOtaILGGRWjiWvBiLSkHVhPnEmZX1	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T15:03:48.392Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 15:03:49
Ern3gzd5j7pZvwNwJ6ZQ9fE2n1V0PTnU	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T15:28:48.808Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 15:28:49
KJe-YO2b1vv3G2vc3HFjMSpS58OqQB00	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T16:57:44.972Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 16:57:45
oFaf0tDV0q8CJNEUcDKqx6hNMDQ775Z4	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T15:28:48.916Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 15:28:50
oFs3B6n-717XzIm6V0k3OdqrCE2dPMA-	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T15:43:20.685Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 15:43:21
THA10odNjetOjGYKUm_ALVrwb1YAcikP	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T15:43:20.565Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 15:43:21
lz5xFnaKTjzC7hCogC0-DZNtlO_UP6F4	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T17:03:35.052Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 17:03:36
7eQ4bya6KDbptKmFLDharpLVJu0cmL6Q	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T16:57:45.402Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 16:57:47
A87T7V7CrYVO7oFoXP1tKG8E9G5KRB6e	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T17:28:02.215Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 17:28:03
0FfEq1D8JTJGv09xOwnVYnEseuU96WLY	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T17:28:02.572Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 17:28:03
8dOWRnUrZk7_byJXtd2BYOv775r4TIIx	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:46:49.811Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:54:29
b_POEYrvQQOJDDtk14FcHYz0MEcY3wUR	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T13:49:18.442Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 13:54:50
VGYgMtmyjTRbYXGO7kHXSZTC1pcy01df	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T15:03:48.507Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 15:08:18
s6Em4-HvViAzzDLUFs_qruyGEzjw2pPT	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T03:40:38.358Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 03:40:39
rN1O1Tu_faaO6dkMyMEpzJMLTZAaerwF	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T03:40:38.478Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 03:40:39
okAZ7ZLMKiH-406F8oKDnWiMURgsfpuo	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T03:51:12.012Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 03:51:13
L8B1QkBGC-n0pfLUgiIqgscZD1c5C04E	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:58:21.885Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 05:58:22
lzk_TA_ypzrlZeXJkizWBpjk8tYrjlof	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T13:49:14.500Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 13:49:15
-_pcCtPuaevsdNtPwVNEiKY6DYv5_QTP	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:29:05.859Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:29:06
rVmtulpo_DUYRnm5I7l45V1xJCBgxHqI	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:31:01.489Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:31:02
RqCg9XcVRChJa4T-AIDFAzuYt9kPZRGy	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:31:05.224Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:31:06
L7VuTiJjdXqHR1m6xWKKqU6dGttx5vM_	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:46:49.695Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:46:50
dycXnstNzJawLTtpdh3I-n6iSySFkR2M	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T16:57:45.298Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 16:57:46
Z42wvB7ORHFWTP5ewED-REBCHOnwxDYe	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T17:03:35.167Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 17:03:36
xPewlEr8lawm_Ds5HvxfbeadjZXB8T3f	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T18:26:59.472Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 18:27:00
DeioC-RJlgSjMAbw7XzWHL2hAnkDuLUz	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T03:40:38.647Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 03:41:08
nsmWoSoQ8BUBDh6EYGllxDU_D4FWmi5U	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T17:28:02.678Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 17:28:04
u7NaeQyrxKTA49jv8-pmHXGLIsJ9gEoq	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T18:26:59.936Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 18:27:01
OC8qkqo8JFTYjANj3wl3JHc2Th2w7xEr	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T18:38:42.056Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 18:38:43
EJEdNbY1wAWgT9E0-KoHYkvUX-Jg6X3D	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-11T04:50:59.668Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-11 04:51:00
fungbBkZfNeuU8UxsZUZ7n5KjVDfdeXk	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-11T04:50:59.795Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-11 04:51:00
-9wjyFR4i1gY3g9hlRKiNehcS9SOqIK-	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-11T04:56:37.592Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-11 04:56:38
LBjnBu0v6VzmsU2TmUUQ0uFq1Qug0M8t	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T05:58:22.053Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 05:59:33
AgB8Vc1qn96g7pP8CMt6qztRzYcHjY5U	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T15:43:20.788Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 15:44:49
_S3b2Lqya0liyZccsvVYHDmfQpf4qD-V	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:29:06.160Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:29:23
lgHbZE4uOGWozmYTWzDdK6DOXtC5xd4d	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T13:40:45.020Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 13:41:34
kgEUloPCSvV_JUsiASmL5XcGh-qlNbhy	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T03:12:40.581Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch", "passport": {"user": "b2c6f868-ac77-42bd-ae8c-fd7ae34a6105"}}	2025-12-11 18:53:12
3jFmt9JxLYO7j8ITNCsz8eAx5K9XixDs	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T17:03:35.271Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 17:13:39
hCtlwIk0u_1DpuINdBhsun6jx2gv_mMX	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T12:27:39.160Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-11 17:56:09
184QVxSGCci3rMf0sKeKRHb15wkeNJJ-	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:31:05.332Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:31:06
m2PisfUWkGp5ds7AOS8UebllGn-H4VaC	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-11T04:28:48.178Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-11 04:28:49
vqtJM-nplshRZRKQeVD_59a2ekDpqrw6	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T13:49:14.628Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 13:49:16
GN96BfsuM-fKba1e4q_MsDluWD3JnqVN	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T18:26:59.824Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 18:27:01
IXI6mND6pmIQ-Z-vtN6338oeVHpRkbk4	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T14:31:05.467Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 14:31:50
VkOMDeTvZOQXmzfqJUhGw2MpfjSALmmC	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-11T04:50:59.914Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-11 04:51:53
OX8bm9OMVMmL8k9oIWxwn5FsGblBo1QD	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T18:38:42.184Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 18:38:43
EfpnG4J2YkOFkKnHolNGusQyfzlUjUsv	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-11T04:28:48.321Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-11 04:28:49
yMAaUoXek4FEGfrqGGZ7w-wz6mo9sxb4	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T18:38:42.294Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 18:38:44
qkdjwSVDKSJAZy3KF9U6I9aV3gZY0kVM	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-11T04:56:37.368Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-11 04:56:38
k0i6IehSfbkTQO6oAsHOPtrByRk7epJj	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-11T04:28:48.449Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-11 04:29:22
Ccpcymq-9uyHdrVr_jY6eBGRHN7_nZcc	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T13:49:18.184Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 13:49:19
-dtcqP6Hiu08Iz4Kvt-7HvzBSbC1KMVJ	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-11T04:56:37.730Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-11 04:58:49
-1psu23xpywN7dpqVa91O0vuaMNx1Whv	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T16:37:15.681Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 16:37:16
qrRuCJ2wbZ0PxdwI6nESQYjcvHXYyy28	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T16:37:15.816Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 16:37:16
RSHI5KTiUfhcUaGjS5HzsEd5dYu1nrbm	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-09T16:37:15.920Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ajosephfinch"}	2025-12-09 16:37:17
\.


--
-- Data for Name: signed_consents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.signed_consents (id, tenant_id, template_id, signed_by_id, signed_by_role, subject_id, subject_role, signature_data, signature_method, signed_at, created_at) FROM stdin;
\.


--
-- Data for Name: signups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.signups (id, tenant_id, player_id, session_id, paid, payment_intent_id, discount_code_id, discount_code_applied, discount_amount_cents, created_at, payment_id, payment_provider, updated_at, reservation_expires_at, refunded, refund_reason, refunded_at, refund_transaction_id) FROM stdin;
4189ae82-7e1a-420d-86b2-05d866933b9b	d98c4191-c7e0-474d-9dd7-672219d85e4d	293d49fc-9eb6-40fb-8981-fde73f640314	JEK39j3I5XYg4WDQeIeD3	t	\N	\N	\N	\N	2025-08-20 13:21:14.018526	8xf03pg2	braintree	2025-08-20 13:21:14.018526	\N	f	\N	\N	\N
signup-metro-1	uuid-1	player-metro-1	session-metro-1	t	\N	\N	\N	\N	2025-08-14 04:21:15.707746	\N	\N	2025-08-24 04:21:15.707746	\N	f	\N	\N	\N
signup-metro-2	uuid-1	player-metro-5	session-metro-3	t	\N	\N	\N	\N	2025-08-16 04:21:15.707746	\N	\N	2025-08-24 04:21:15.707746	\N	f	\N	\N	\N
signup-metro-3	uuid-1	player-metro-9	session-metro-2	t	\N	\N	\N	\N	2025-08-18 04:21:15.707746	\N	\N	2025-08-24 04:21:15.707746	\N	f	\N	\N	\N
signup-metro-4	uuid-1	player-metro-13	session-metro-4	t	\N	\N	\N	\N	2025-08-20 04:21:15.707746	\N	\N	2025-08-24 04:21:15.707746	\N	f	\N	\N	\N
signup-metro-5	uuid-1	player-metro-17	session-metro-5	t	\N	\N	\N	\N	2025-08-22 04:21:15.707746	\N	\N	2025-08-24 04:21:15.707746	\N	f	\N	\N	\N
signup-metro-6	uuid-1	player-metro-21	session-metro-1	t	\N	\N	\N	\N	2025-08-23 04:21:15.707746	\N	\N	2025-08-24 04:21:15.707746	\N	f	\N	\N	\N
signup-metro-7	uuid-1	player-metro-25	session-metro-3	t	\N	\N	\N	\N	2025-08-24 04:21:15.707746	\N	\N	2025-08-24 04:21:15.707746	\N	f	\N	\N	\N
signup-rising-1	uuid-2	player-rising-1	session-rising-1	t	\N	\N	\N	\N	2025-08-19 04:21:39.595002	\N	\N	2025-08-24 04:21:39.595002	\N	f	\N	\N	\N
signup-rising-2	uuid-2	player-rising-5	session-rising-2	t	\N	\N	\N	\N	2025-08-21 04:21:39.595002	\N	\N	2025-08-24 04:21:39.595002	\N	f	\N	\N	\N
signup-rising-3	uuid-2	player-rising-9	session-rising-3	t	\N	\N	\N	\N	2025-08-23 04:21:39.595002	\N	\N	2025-08-24 04:21:39.595002	\N	f	\N	\N	\N
signup-rising-4	uuid-2	player-rising-13	session-rising-1	t	\N	\N	\N	\N	2025-08-24 04:21:39.595002	\N	\N	2025-08-24 04:21:39.595002	\N	f	\N	\N	\N
signup-rising-5	uuid-2	player-rising-17	session-rising-2	f	\N	\N	\N	\N	2025-08-24 04:21:39.595002	\N	\N	2025-08-24 04:21:39.595002	\N	f	\N	\N	\N
signup-champ-1	uuid-3	player-champ-1	session-champ-1	t	\N	\N	\N	\N	2025-08-12 04:21:46.829271	\N	\N	2025-08-24 04:21:46.829271	\N	f	\N	\N	\N
signup-champ-2	uuid-3	player-champ-5	session-champ-2	t	\N	\N	\N	\N	2025-08-14 04:21:46.829271	\N	\N	2025-08-24 04:21:46.829271	\N	f	\N	\N	\N
signup-champ-3	uuid-3	player-champ-9	session-champ-3	t	\N	\N	\N	\N	2025-08-16 04:21:46.829271	\N	\N	2025-08-24 04:21:46.829271	\N	f	\N	\N	\N
signup-champ-4	uuid-3	player-champ-13	session-champ-4	t	\N	\N	\N	\N	2025-08-18 04:21:46.829271	\N	\N	2025-08-24 04:21:46.829271	\N	f	\N	\N	\N
signup-champ-5	uuid-3	player-champ-17	session-champ-5	t	\N	\N	\N	\N	2025-08-20 04:21:46.829271	\N	\N	2025-08-24 04:21:46.829271	\N	f	\N	\N	\N
signup-champ-6	uuid-3	player-champ-21	session-champ-6	t	\N	\N	\N	\N	2025-08-22 04:21:46.829271	\N	\N	2025-08-24 04:21:46.829271	\N	f	\N	\N	\N
signup-champ-7	uuid-3	player-champ-25	session-champ-1	t	\N	\N	\N	\N	2025-08-23 04:21:46.829271	\N	\N	2025-08-24 04:21:46.829271	\N	f	\N	\N	\N
signup-champ-8	uuid-3	player-champ-29	session-champ-2	t	\N	\N	\N	\N	2025-08-24 04:21:46.829271	\N	\N	2025-08-24 04:21:46.829271	\N	f	\N	\N	\N
signup-champ-9	uuid-3	player-champ-33	session-champ-3	f	\N	\N	\N	\N	2025-08-24 04:21:46.829271	\N	\N	2025-08-24 04:21:46.829271	\N	f	\N	\N	\N
signup-youth-1	uuid-4	player-youth-1	session-youth-1	t	\N	\N	\N	\N	2025-08-17 04:21:51.613866	\N	\N	2025-08-24 04:21:51.613866	\N	f	\N	\N	\N
signup-youth-2	uuid-4	player-youth-5	session-youth-2	t	\N	\N	\N	\N	2025-08-19 04:21:51.613866	\N	\N	2025-08-24 04:21:51.613866	\N	f	\N	\N	\N
signup-youth-3	uuid-4	player-youth-9	session-youth-3	t	\N	\N	\N	\N	2025-08-21 04:21:51.613866	\N	\N	2025-08-24 04:21:51.613866	\N	f	\N	\N	\N
signup-youth-4	uuid-4	player-youth-13	session-youth-4	t	\N	\N	\N	\N	2025-08-23 04:21:51.613866	\N	\N	2025-08-24 04:21:51.613866	\N	f	\N	\N	\N
signup-youth-5	uuid-4	player-youth-17	session-youth-1	t	\N	\N	\N	\N	2025-08-24 04:21:51.613866	\N	\N	2025-08-24 04:21:51.613866	\N	f	\N	\N	\N
signup-youth-6	uuid-4	player-youth-21	session-youth-2	f	\N	\N	\N	\N	2025-08-24 04:21:51.613866	\N	\N	2025-08-24 04:21:51.613866	\N	f	\N	\N	\N
signup-skill-1	uuid-5	player-skill-1	session-skill-1	t	\N	\N	\N	\N	2025-08-20 04:21:55.146494	\N	\N	2025-08-24 04:21:55.146494	\N	f	\N	\N	\N
signup-skill-2	uuid-5	player-skill-5	session-skill-2	t	\N	\N	\N	\N	2025-08-22 04:21:55.146494	\N	\N	2025-08-24 04:21:55.146494	\N	f	\N	\N	\N
signup-skill-3	uuid-5	player-skill-9	session-skill-1	t	\N	\N	\N	\N	2025-08-24 04:21:55.146494	\N	\N	2025-08-24 04:21:55.146494	\N	f	\N	\N	\N
signup-skill-4	uuid-5	player-skill-13	session-skill-2	f	\N	\N	\N	\N	2025-08-24 04:21:55.146494	\N	\N	2025-08-24 04:21:55.146494	\N	f	\N	\N	\N
signup-premier-1	uuid-6	player-premier-1	session-premier-1	t	\N	\N	\N	\N	2025-08-18 04:22:01.605494	\N	\N	2025-08-24 04:22:01.605494	\N	f	\N	\N	\N
signup-premier-2	uuid-6	player-premier-5	session-premier-2	t	\N	\N	\N	\N	2025-08-19 04:22:01.605494	\N	\N	2025-08-24 04:22:01.605494	\N	f	\N	\N	\N
signup-premier-3	uuid-6	player-premier-9	session-premier-3	t	\N	\N	\N	\N	2025-08-20 04:22:01.605494	\N	\N	2025-08-24 04:22:01.605494	\N	f	\N	\N	\N
signup-premier-4	uuid-6	player-premier-13	session-premier-4	t	\N	\N	\N	\N	2025-08-21 04:22:01.605494	\N	\N	2025-08-24 04:22:01.605494	\N	f	\N	\N	\N
signup-premier-5	uuid-6	player-premier-17	session-premier-5	t	\N	\N	\N	\N	2025-08-22 04:22:01.605494	\N	\N	2025-08-24 04:22:01.605494	\N	f	\N	\N	\N
signup-premier-6	uuid-6	player-premier-21	session-premier-1	t	\N	\N	\N	\N	2025-08-23 04:22:01.605494	\N	\N	2025-08-24 04:22:01.605494	\N	f	\N	\N	\N
signup-premier-7	uuid-6	player-premier-25	session-premier-2	t	\N	\N	\N	\N	2025-08-24 04:22:01.605494	\N	\N	2025-08-24 04:22:01.605494	\N	f	\N	\N	\N
signup-premier-8	uuid-6	player-premier-28	session-premier-3	f	\N	\N	\N	\N	2025-08-24 04:22:01.605494	\N	\N	2025-08-24 04:22:01.605494	\N	f	\N	\N	\N
\.


--
-- Data for Name: sms_credit_packages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sms_credit_packages (id, name, credits, price_in_cents, bonus_credits, is_active, sort_order, description, created_at, updated_at) FROM stdin;
25761c01-a3d1-41fa-a119-a31288c1862b	Starter Pack	100	999	0	t	1	Perfect for small clubs getting started with SMS notifications	2025-12-02 04:43:01.937627	2025-12-02 04:43:01.937627
2acaff94-14e9-4e5d-8993-7e6f30dde729	Growth Pack	500	3999	50	t	2	Great value for growing organizations - includes 50 bonus credits	2025-12-02 04:43:01.937627	2025-12-02 04:43:01.937627
9e4b73e5-a5e5-4870-b061-68eeb1fa641a	Pro Pack	1000	6999	150	t	3	Best value for high-volume messaging - includes 150 bonus credits	2025-12-02 04:43:01.937627	2025-12-02 04:43:01.937627
5f39afd5-1f1a-4539-91d0-bd63f0a30fcf	Enterprise Pack	5000	29999	1000	t	4	Maximum savings for enterprise-level communications - includes 1000 bonus credits	2025-12-02 04:43:01.937627	2025-12-02 04:43:01.937627
\.


--
-- Data for Name: sms_credit_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sms_credit_transactions (id, tenant_id, type, amount, balance_after, description, reference_id, reference_type, metadata, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: sms_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sms_events (id, provider, message_sid, tenant_id, to_number, event, error_code, created_at) FROM stdin;
a98261a4-521f-48af-b929-4d1b90ef2e31	twilio	SMq7bhma	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552887523	failed	\N	2025-08-10 00:14:08.933
bc91418f-0eb3-48d3-954a-d6c81bb6e1e1	vonage	SMi28rw7	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551723982	failed	\N	2025-08-21 10:21:21.115
a3700e05-2bb2-481e-be78-0017d2014c40	twilio	SMpagdmg	\N	+15551563835	sent	\N	2025-08-08 21:42:48.837
3631acc1-2716-4dc8-8879-997982d5f59c	twilio	SMivznw	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552557650	failed	\N	2025-08-13 12:56:32.761
224795ee-344d-4a91-abec-b0fc26d5555d	twilio	SM82mf3i	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554849066	sent	\N	2025-08-18 16:30:33.601
fc045471-cb1c-48c5-8e88-078804286c79	vonage	SMf5a9o8	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559912781	delivered	\N	2025-07-30 17:44:55.597
96c18a3e-c23a-432f-8435-c3ac3a88b870	twilio	SMbl6vkw	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15553182985	undelivered	\N	2025-08-12 05:28:53.872
3dbe8fcc-8f9b-4d00-890a-8aaa1f96aced	vonage	SMasavx	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15557361074	delivered	\N	2025-08-04 14:49:35.173
aed1e3d3-4b67-4cb7-9aeb-6de9983d71bc	twilio	SMuy69lf	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554795664	sent	\N	2025-08-22 09:35:41.272
0e49876b-d0c8-4747-baa5-33be22989c25	twilio	SMan6a29	\N	+15551688406	failed	\N	2025-08-13 17:56:27.841
79f0a5e0-79fc-46a6-90a8-3835cd16663b	twilio	SMiai8yc	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551229700	delivered	\N	2025-08-03 19:14:56.356
326e1cea-1823-4580-9f08-4545a48ac6a9	vonage	SMactvcy	\N	+15555030566	delivered	\N	2025-08-06 00:46:21.535
07e8d86b-c2d4-4868-85ac-040942bca2a2	twilio	SMvgqil	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551356843	undelivered	\N	2025-08-20 15:00:48.476
13a5da2b-d60d-4d95-b450-3a84959ef609	vonage	SM9pp4lh	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551279983	delivered	\N	2025-07-27 20:05:20.219
43a8769b-d138-49b0-b2ac-136235a82a3a	twilio	SMge3qf	\N	+15557281709	delivered	\N	2025-07-26 13:39:10.669
328f8be9-b9c8-4c07-adf7-9f37465c07d5	vonage	SM4j020i	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551522751	delivered	\N	2025-07-27 03:11:43.306
08d93928-002a-43db-b246-9b1fe2ba200e	vonage	SM3qcqxk	\N	+15556913980	failed	\N	2025-07-27 04:43:11.198
05e22966-03d1-433a-a80e-0c348d7550d0	vonage	SM7op5p7g	\N	+15554669937	undelivered	\N	2025-07-30 22:22:00.909
f2ee0d9c-35dd-40b3-ad2e-92a8ee72e8a4	twilio	SM6dqn9	\N	+15557255396	undelivered	30001	2025-08-20 15:53:45.923
74c0ddc5-8450-4524-9302-f285db37b1cb	twilio	SMw0v2e	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15552932837	failed	30001	2025-08-18 12:27:08.489
3761cde6-a8c5-446b-9ffd-7c947e0719c5	twilio	SMtinhym	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554345611	undelivered	30003	2025-08-22 14:41:58.13
2511eed7-640f-4280-9954-acc2c62006da	twilio	SM5cfbis	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554336812	failed	\N	2025-08-06 23:00:04.934
ed9b7de5-190a-461f-8cee-8f887767c982	twilio	SM3csbti	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15552271959	sent	\N	2025-08-13 20:32:16.588
5c3abdf6-9b18-46fc-b7e4-0965b6dd7714	twilio	SM73ipkf	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555845511	delivered	21211	2025-07-25 21:55:57.29
9c982bd8-21ea-48bd-91e9-a5b52ebd0b19	twilio	SMzd8fmt	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554971538	sent	30003	2025-07-26 02:11:42.308
551d8ad0-8670-4d8a-a011-a5bb048af337	twilio	SMdxzsma	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558502440	failed	\N	2025-08-11 10:15:17.075
c28e44f5-afde-40da-867c-1f99d60e394e	vonage	SM1bhpcm	\N	+15558268025	undelivered	\N	2025-08-09 02:35:11.724
8f914ecf-326d-43ad-afb0-fe0d94e1b7cc	vonage	SM4gavng	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554621433	delivered	\N	2025-08-19 13:08:45.522
e1f721c4-9fa5-42b2-9997-f08518776612	twilio	SMa6vr18	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552269077	undelivered	\N	2025-08-11 23:04:33.357
de3d136d-179a-450f-9684-1c17e2b8c9cd	twilio	SM7bdwf	\N	+15552950113	undelivered	\N	2025-08-07 22:08:41.681
53aa4ca0-8963-451a-a52a-6107e29e5375	twilio	SMrs41k7	\N	+15551491559	sent	\N	2025-07-25 01:28:58.643
d873ab5f-8c9c-460d-b342-1c84be894166	vonage	SMfym1a	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558554538	failed	\N	2025-07-26 02:09:51.801
bf0173de-0eac-4abe-a2f5-2056830f2792	twilio	SMks5rgb	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556231043	delivered	\N	2025-07-25 13:07:41.575
683eceef-4a85-4d83-9e2a-bc6d556614fe	vonage	SM83mdy4	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554892980	undelivered	\N	2025-07-30 14:02:17.086
da61b93c-4a8f-443b-907f-73150bea07f6	vonage	SMgjbg6n	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15558543019	delivered	\N	2025-08-09 16:19:13.968
4f1d9f85-5e9e-421c-8e9a-019b5afe73c6	twilio	SMn4c5hg	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558026264	undelivered	\N	2025-08-13 02:29:54.239
ecb4451b-716f-4d88-86f4-a280ec8a1237	vonage	SMvk51h	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553957295	sent	30001	2025-08-09 19:40:41.363
ece6385d-0ed9-4ff9-ac6d-f077d509fb8c	vonage	SM8kkc0k	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553666162	failed	30001	2025-08-09 13:21:34.508
bce42214-eb4c-4ec7-b1f8-60d68803e84e	vonage	SM9b7j0u	\N	+15557993595	undelivered	\N	2025-08-10 23:41:56.217
11c0571d-ffdb-43ca-9822-15ff9472ae46	twilio	SM0c4f5	\N	+15556174311	delivered	30003	2025-08-11 10:18:26.799
0a600494-6ff6-426e-b833-67d93cdd75fa	twilio	SMgxvpf7	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15552237955	delivered	\N	2025-08-23 02:44:23.938
d44adf61-ebfa-4727-a164-5539980aeace	vonage	SMrd46zm	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554470633	undelivered	30001	2025-08-16 18:55:17.666
a0103e30-fee7-4321-a5fd-a972608ffdbf	vonage	SMblr265	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559465764	sent	\N	2025-08-21 14:33:03.414
2570c636-9a89-42f0-a227-3635488191be	vonage	SMlhkgt	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15552296419	sent	\N	2025-08-04 08:56:27.321
10510898-d9dc-41ff-aa17-d4f3207f6f6b	vonage	SM2h874a	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554005795	delivered	\N	2025-07-30 22:32:31.898
c0c2fd6d-5f3d-45c4-b397-2bff6fc78c2c	twilio	SMjobjh4	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555124498	delivered	\N	2025-08-06 02:31:35.444
568bac27-8ad4-4c54-a690-8ea1fa49b976	vonage	SMunrbzr	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15557100789	undelivered	\N	2025-08-05 12:33:34.861
22432a82-09a7-4b18-a21c-aaa2ac668696	vonage	SM5efepa	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15556705314	undelivered	\N	2025-08-09 08:55:26.777
956fd31c-a798-416a-a899-ec6ed77a971e	vonage	SMala77	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15558253401	undelivered	\N	2025-07-28 12:38:27.425
f8f4875d-5436-4274-a73b-169d909fa13f	vonage	SMnp7nf	\N	+15555465489	delivered	\N	2025-08-03 00:55:41.693
bfebfe6f-584a-4288-a7ce-7cab8e5ca2ba	vonage	SM3cpcy	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551523638	delivered	\N	2025-08-21 21:42:40.82
5acf1674-a7c8-4372-8c14-13345f53821e	vonage	SM5vl1wo	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551919737	sent	\N	2025-08-01 12:59:07.886
96872843-9528-47ed-904d-7be2708e6c2a	twilio	SM2cytbp	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554029341	undelivered	30003	2025-08-10 12:44:23.731
4f899891-abe2-4153-b63f-c92e04cf69d7	vonage	SM4jkz1m	\N	+15554879720	failed	\N	2025-08-22 16:21:37.45
158c789e-f5d3-434e-b726-b9f8af7e0a01	vonage	SMo0pzle	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551218336	sent	\N	2025-08-01 12:20:10.379
4c8b322d-5b6b-4689-b8a5-5495ce12d514	vonage	SMyxeq29	\N	+15553414250	undelivered	\N	2025-08-06 16:26:34.905
8da84d43-7660-406b-89ed-2a7c459e974b	vonage	SM7yy56	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15559875982	delivered	30005	2025-08-19 11:54:15.391
7b26f45c-cc59-402e-92d9-9e7cb06b1647	vonage	SMp7m9w8	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555178680	undelivered	\N	2025-08-12 22:13:38.075
919732f0-54f2-42ae-94e8-9ef95136ac8a	twilio	SMikf7ml	\N	+15557528285	undelivered	\N	2025-08-22 18:22:03.135
fc3f5d44-448b-427a-b4b3-187024c6e7b4	twilio	SMc461vp	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552736363	undelivered	\N	2025-08-22 10:18:47.607
fd3f47ce-afac-4b8c-a6fe-afd2f50062b8	vonage	SMdeonx8	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554547552	delivered	30003	2025-08-10 09:21:11.865
f94cfc37-479d-49a6-bc65-d9dac70feba4	vonage	SMvgc1bd	\N	+15551192788	undelivered	\N	2025-08-14 08:07:15.016
fd04fac1-ba47-412e-90df-a3303d77efed	twilio	SMqvr4z7	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555132786	failed	\N	2025-08-23 22:08:58.123
9fd02847-604e-4f9a-9d19-eeee6a5d5b31	twilio	SM70ouqt	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15553181545	failed	\N	2025-08-12 10:01:50.515
135fd450-ed1a-4802-b620-e973594109f3	twilio	SMvlpnjo	\N	+15557238557	failed	21211	2025-08-07 14:49:33.139
ef1a713b-07e5-4e76-b609-419fb4dc3951	twilio	SM1iff7	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555302679	failed	\N	2025-07-30 05:14:17.562
3395e77f-c6a9-4fd1-81d2-778387c3eab6	twilio	SM1gsyi3	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559693839	undelivered	\N	2025-08-10 08:40:02.106
bb036250-ace6-42bb-92c2-1e9d57ba9144	vonage	SMbc01zr	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554875314	undelivered	30001	2025-08-16 08:44:14.578
fad596c2-fea2-4b72-95f4-44976f9c6be1	vonage	SMo6nqbc	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551015910	delivered	30001	2025-08-22 21:42:23.568
a4c059de-f580-42bb-9c9a-61ab865d4a0c	vonage	SMc57akr	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558431052	failed	\N	2025-08-22 16:24:09.269
a580b6f8-e3c9-4f1f-bc2e-ff6285a79f2b	vonage	SMnbv5ze	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552040148	sent	30003	2025-08-18 23:09:00.16
ef8ae470-8279-4c9c-9878-98b676348c19	vonage	SM65g5qn	\N	+15558121875	failed	\N	2025-08-08 18:43:23.672
20d6a324-a6e4-42fb-8a00-81be595e259e	twilio	SMjzg057	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554763727	sent	\N	2025-08-18 18:53:26.345
f8b215a4-fcb8-49f1-bdea-655439805576	twilio	SMh19nl8	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554094048	undelivered	30003	2025-08-19 10:33:38.174
70e4b1da-1549-4b9d-8937-2e49aad46d4c	vonage	SMgred3i	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554596552	undelivered	\N	2025-07-30 15:17:47.319
5528d161-2368-47a7-9d2c-dd3adc9c5466	vonage	SMfaol7	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556718584	sent	\N	2025-08-13 07:24:43.073
08705208-731f-478d-805d-96b7ca0e53c1	vonage	SMuenw3	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552047312	failed	\N	2025-08-04 12:12:48.937
9f43388c-2f61-4f9c-8a7a-ed0898b78640	vonage	SM30ywtk8	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15556517353	delivered	\N	2025-08-13 12:08:34.89
ab44d883-d495-4256-aa15-8c55074cb87c	vonage	SMwu29va	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555087424	delivered	\N	2025-08-11 18:19:13.869
cb756024-93a3-4d02-aa0c-56c7411fa55a	twilio	SMe74bgm	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15557013833	sent	\N	2025-08-09 16:06:55.152
c77bebf1-dfca-44b1-bf84-ed9cc87a4f1c	vonage	SMyzmrp	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15552342571	sent	\N	2025-07-31 13:45:42.508
051f69b6-e22a-4e49-8882-7f68f9c66af7	twilio	SMatq5gq	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554381860	delivered	\N	2025-08-12 16:05:09.812
99d899c5-3c8b-4bb4-9cad-7f004070ab47	vonage	SMns85u5	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554672173	sent	\N	2025-08-02 14:01:07.178
157d8924-abf6-4bf2-bdfc-3d9110fb061a	twilio	SMilkkr9	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556828732	sent	\N	2025-08-12 07:34:03.248
ddfcfca8-e982-4352-96ef-b6f62f6ad551	vonage	SM7cpeag	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559026414	undelivered	\N	2025-08-08 06:18:29.005
aae2c0a5-5ac6-4679-b3f7-7b280c2f173a	vonage	SMf2ntr	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15559874854	failed	\N	2025-08-03 11:17:11.013
be4577d8-c781-43b6-a53f-49a1e11a818e	vonage	SMm6kstv	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551168775	undelivered	21211	2025-07-28 00:43:18.498
c7e8ab31-4b7f-4e6e-a6b8-453772b34763	vonage	SMg4cctf	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554502076	undelivered	\N	2025-08-12 04:06:47.925
2dfc3971-6f2a-4383-a2ef-831f95045817	vonage	SMdo9rcu	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15557688003	failed	\N	2025-07-27 00:48:31.696
c750f790-e309-4b76-ba8a-3af588c14af3	twilio	SM9d0z9	\N	+15553824385	sent	\N	2025-07-31 04:19:20.156
dbd68e15-6087-456e-9b8b-0464d2502a56	vonage	SM7t858	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15559040874	undelivered	\N	2025-08-21 06:50:22.488
ff1cf3f0-8229-4e2f-82c9-5d8ddc200452	vonage	SMwxt4h	\N	+15558654588	sent	\N	2025-08-09 08:42:21.28
f634884b-8ec9-4f3e-a0ad-3da1b19b5e92	vonage	SM0u0rn4	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555505074	undelivered	\N	2025-08-06 00:27:05.594
adf0c47b-e9be-4de9-9570-ceca1b031376	vonage	SMxqret	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555114846	failed	\N	2025-07-30 03:20:35.831
004e1a6d-0fda-486b-ad0d-3952d4d75d88	twilio	SMgrkyo	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551615856	undelivered	30005	2025-07-24 23:57:24.952
49940c8d-da19-4b88-8a76-89f11e96f3f2	vonage	SM03k3nb	\N	+15556778534	sent	\N	2025-08-11 06:59:34.839
6df2faec-33a9-4017-857c-f06a1f2e3816	vonage	SMlex1sf	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553512535	delivered	\N	2025-08-03 22:47:27.135
aa6fc072-6f6d-4100-b7c9-c42c66b9fbe1	vonage	SMllmuk	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553922690	sent	\N	2025-08-22 12:27:09.177
4d14c82b-cdd1-47d4-bec2-853e459dbfca	vonage	SM04rm21	\N	+15551011191	sent	\N	2025-08-09 16:33:03.083
4fb66f07-c60a-452a-8772-90a918201c93	vonage	SMbupyj	\N	+15558966866	failed	30005	2025-08-15 15:35:44.34
e45a9d51-6e6b-4a9a-a44a-4f1374c77019	twilio	SM5im05c	\N	+15556037791	failed	30001	2025-08-20 11:59:23.962
17299678-6f64-4f4d-901f-6505f1513cc1	vonage	SMt5a2h	\N	+15557140272	sent	\N	2025-08-13 08:01:16.32
31829330-98fb-4114-af5b-a41fa93bbd66	twilio	SMt97jjg	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556348058	undelivered	\N	2025-07-31 16:31:01.448
219776fe-b059-4273-8448-1ebf2712ebfc	vonage	SMc4lww	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15557712018	undelivered	\N	2025-07-25 16:57:02.851
0728b068-8c10-401c-81c6-494294900e8a	twilio	SMw2tyui	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556955676	delivered	\N	2025-08-01 15:21:53.273
787d3d55-0e9d-4e5c-8a87-492fb9f98800	twilio	SMzsro7f	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558470772	failed	\N	2025-08-13 11:22:46.629
b3db1bbf-68e1-4100-b20e-1b3c36255721	vonage	SMhdqsya	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15552357515	sent	30003	2025-07-30 18:49:05.562
448d48ec-e2f7-4ff2-a0da-34934342d593	twilio	SMwnuz9	\N	+15551408694	sent	30001	2025-08-02 03:54:05.941
408955e1-58a0-41ee-ad06-e8a7fb5131ba	twilio	SM1e5icr	\N	+15559685252	failed	30003	2025-08-20 22:03:15.417
38971ccf-9f5d-419a-914c-495f04359f7b	twilio	SMn2xhsq	\N	+15559838933	sent	\N	2025-08-08 00:32:14.757
50a2993a-e0fa-4437-a0af-2938b1e228c8	twilio	SMehh4o	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555806565	sent	\N	2025-08-07 11:35:58.514
16de8ab9-37d9-4cbb-8973-616636faa0ee	twilio	SMhibmgf	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15556260046	sent	\N	2025-08-11 02:48:06.086
925bcbb4-d5e2-477e-9e58-bdfc9a17f579	vonage	SM9uv2ho	\N	+15557886400	failed	\N	2025-08-21 05:47:44.163
f87d51a2-a334-43c3-9d04-4cb041819cef	vonage	SM0mme96	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559926855	sent	\N	2025-07-29 22:26:01.181
92f113c1-cd6f-4a62-8f2f-b2dc03368a1a	vonage	SMy4fq4	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553364346	sent	\N	2025-08-04 01:44:58.924
1346d9b5-b2f2-4a34-9ed7-f2481d677a4b	vonage	SMou9h7b	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559597771	delivered	\N	2025-07-30 07:04:42.863
66119b30-ddba-408b-93dd-a6167c6e2b7b	vonage	SMkqxni	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15556061396	failed	\N	2025-08-08 15:01:53.332
942942e7-28a3-40e2-bb23-1e3f69f8426a	vonage	SMr6vzh	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556731446	sent	\N	2025-08-10 06:47:46.756
d8ca48c2-0607-480a-8a8a-52bc22600089	twilio	SMeu1awi	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552025736	failed	21211	2025-08-15 21:31:59.074
d54d6f4d-3514-41e3-ab31-bdede433a551	twilio	SM4r3iqh	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15553408515	failed	\N	2025-07-29 16:20:52.845
f3f0a92d-c49c-447b-ad46-8f9b19b3a38e	vonage	SM753qxm	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554601350	undelivered	\N	2025-08-21 11:37:42.854
8dd56ee6-4bce-46e0-bdfe-4825e7b79df8	vonage	SMl3j1b1h	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553643215	failed	\N	2025-08-09 04:12:00.388
3642fb54-5dd1-439f-9f2b-14acc60ced22	vonage	SMb1lbj2	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555482506	undelivered	\N	2025-08-14 06:23:42.858
2fc39636-8d24-4882-b28b-6db3b5b7166d	twilio	SMfz8wl5	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553276980	failed	\N	2025-08-08 07:32:40.744
37b39f45-5f68-4e9b-8111-4a85502650b4	twilio	SMtam0rm	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15553533906	failed	\N	2025-07-29 08:48:37.15
571abd2f-4a51-4162-a4b6-afbb7f1af8e8	vonage	SM27etjm	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15556271667	sent	\N	2025-08-17 22:06:03.836
bb3ea4e3-b2f3-44a9-875b-bb1082d04bfe	twilio	SM3z1z56	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559352385	delivered	\N	2025-07-31 22:20:56.177
a293e8c7-3e7e-4b5d-8685-fde3294bf7d0	twilio	SMsp8glc	\N	+15555482656	sent	\N	2025-08-22 02:44:47.515
4bebd8c1-9b61-45a5-8153-d175bf67da2d	twilio	SMxnqn2j	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552784479	undelivered	\N	2025-08-20 07:47:17.94
a166e904-4caf-4abd-9dc3-767ee81cc288	vonage	SMzajkif	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15552024987	undelivered	30005	2025-08-15 06:06:17.656
320aa090-cdab-41fd-bf11-da2d6fa7e2ed	vonage	SMouibl	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551190654	sent	\N	2025-08-21 12:45:51.394
1c541f9f-3804-41a0-a5b7-f33b46c92c01	vonage	SM4dhw9n	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558910768	sent	\N	2025-08-09 12:11:25.112
4193fe65-ce15-422d-a366-b965d2156c10	twilio	SMsqebr3	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553438825	undelivered	\N	2025-08-13 02:02:31.85
23bbba08-62aa-4b6e-b96f-7514c6f66a24	vonage	SM310yju	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555315672	failed	30005	2025-07-26 07:28:38.835
d1dfe035-83ce-4840-a850-b646f558b2fe	twilio	SMpsqyhh	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554554077	failed	\N	2025-08-19 05:08:52.995
634068a1-eb60-41ec-8b86-15c79196e730	twilio	SMimh9d	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554439491	undelivered	21211	2025-08-10 05:22:21.548
7cc8c394-8a78-42d9-93fe-0960bfec88a4	vonage	SM7hoab	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554485096	sent	30001	2025-08-09 13:53:47.495
91eb1744-6f9d-49eb-93f2-d689c101989f	vonage	SMcfzozl	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15557822259	sent	\N	2025-07-27 19:27:37.849
b2e34a47-8c9d-47ad-8352-bb7cd29c91c7	twilio	SMm3r9tl	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558079851	failed	\N	2025-07-25 20:30:55.903
a113322f-11af-44f2-82b1-bdcb7b0aa2db	twilio	SMhg3o3x	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15552506078	undelivered	\N	2025-07-31 00:07:11.259
c3d551d3-c3f3-4e08-a754-911c37e9e788	twilio	SMcw6ym	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15558229487	failed	\N	2025-08-21 23:55:40.949
dae55ace-b0db-4260-95cf-30c923238306	vonage	SMlletoa	\N	+15557190366	undelivered	\N	2025-07-31 07:10:58.592
b8fed47d-693d-4dbe-8042-b4c760e19a7e	vonage	SMw6d5bh	\N	+15558440912	sent	\N	2025-07-31 17:31:46.562
892202da-6fa2-43e1-aa62-80e2ec6e7751	vonage	SMykt2tf	\N	+15559202229	delivered	\N	2025-08-23 00:18:31.771
4fcb6072-2bee-4617-a25e-3649fdd28228	twilio	SMg4eari	\N	+15552473803	undelivered	30001	2025-08-03 06:14:38.213
c965faa2-a0ff-4fce-ac0b-5399cb9c4b9d	twilio	SMr8k61r	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15553967659	undelivered	21211	2025-08-03 00:20:01.695
38d57dd4-aca1-48b6-98e4-cf51b467ad8f	vonage	SMas22es	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551640310	undelivered	\N	2025-07-26 07:16:24.927
a8bf5f5b-8c24-4b95-9dce-696ce0669ed4	twilio	SM34ar2	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15553612318	sent	\N	2025-08-09 04:38:19.444
ab86d278-cf53-4478-a1bd-61da98650ea1	vonage	SMtxwidt	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15557733064	sent	\N	2025-08-07 20:59:14.141
2926e526-3aa5-4b31-b06a-d2a2c7a57e38	twilio	SMmkb5bt	\N	+15551207646	undelivered	\N	2025-08-22 11:56:31.641
4693560c-b9e4-48a8-8387-52146db04adb	vonage	SM7j79j	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555458928	sent	30003	2025-07-26 13:37:31.699
e4870b7b-1217-44c0-828d-e826fd21c3b5	vonage	SMtah7hm	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555919863	sent	30003	2025-08-06 11:58:37
b498dea3-d831-4841-8ff5-ed5d0bb7dc44	twilio	SM62u09	\N	+15557919226	sent	\N	2025-08-12 04:39:30.006
21d52c7c-8b36-443a-9011-5c0c8892ba7a	vonage	SMllgt8i	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15553210855	sent	\N	2025-08-07 02:30:11.563
567ff106-ef91-466b-806a-08e5b0d601c6	vonage	SMnvakh	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554540197	failed	30005	2025-08-09 10:03:21.678
30f85bb7-ebf5-40ab-8f77-1847c8227e1b	twilio	SM5at695	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552174884	undelivered	\N	2025-08-02 21:20:06.219
272bdd5d-2420-448b-89c4-a789d3369724	vonage	SMzqw67p	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554896096	failed	\N	2025-08-03 16:58:41.092
b0226e57-796c-4725-9e82-49edd4d0822e	twilio	SMtlddn	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559565546	failed	21211	2025-07-26 13:58:18.265
5b59efb9-8f0e-4cce-a5a2-568cd27387d4	twilio	SMydcy8q	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15553702096	delivered	\N	2025-08-20 03:31:09.87
dbd3745f-667d-4003-8dac-adaf4a5248c4	vonage	SM0iq1c5	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552180513	delivered	\N	2025-08-11 23:03:05.612
6a59861b-f254-4594-bd07-6715a1ec9e84	vonage	SMt3tkjl	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552468279	delivered	\N	2025-08-16 03:41:43.027
dbc9ae84-b6f3-4130-86ea-878010feab6a	twilio	SMvwb2g	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552840416	delivered	\N	2025-08-23 08:36:41.396
1a913f7d-daa8-4e76-b15d-506494751358	twilio	SM7hr4s	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556214662	undelivered	30005	2025-07-27 10:21:14.457
ac4ad46f-7a95-4e7f-a017-4478324c4c15	twilio	SMj0ksvo	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552610983	sent	\N	2025-08-07 18:50:14.268
e8695b16-25d0-46b8-ad23-293b1e35a5f8	vonage	SMp22k7l	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559352552	undelivered	\N	2025-08-02 02:48:45.302
dd9c1f38-b96a-4767-bd9c-e51ba4562567	twilio	SM4vhria	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551058738	delivered	\N	2025-08-21 01:43:06.851
32d6e992-1ce7-4bda-bb0e-f5bf65659cd2	vonage	SM4vvgg	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551752717	failed	\N	2025-08-23 01:46:53.409
3158d5de-78b7-48ef-bb01-774bd92a1490	twilio	SMjwb2ue	\N	+15558185276	failed	30003	2025-08-15 17:24:03.935
87433eac-5fd3-4efe-878f-114648daf15c	vonage	SM78nwv	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555612822	sent	\N	2025-07-30 07:37:40.053
04a9fc6f-101d-477a-a315-855154f73829	twilio	SMaklamf	\N	+15557661111	delivered	\N	2025-08-09 07:43:02.368
1ab1caee-b861-45de-bfdd-076a1722b5df	twilio	SMqssl49b	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556475184	undelivered	\N	2025-08-05 09:26:43.035
4437e845-14be-4b0a-86f2-7d4a39919772	twilio	SM5bfxji	\N	+15555227280	undelivered	\N	2025-08-17 15:32:39.545
2424cf3a-c563-4357-999f-60b7399aba4f	twilio	SM351t3o	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554007977	sent	\N	2025-07-26 01:12:54.529
5d02607b-d45c-4afa-8a23-77d2e29489f7	twilio	SM0cx8p	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15558225518	sent	30005	2025-08-18 00:37:40.494
7d1be79d-63c0-4016-b93f-3c9309a7defe	vonage	SMcemg6	\N	+15559107011	failed	30003	2025-07-26 15:59:54.04
0f674533-b67f-411e-9ae3-0bdb5b5c7a6c	twilio	SMb856vd	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551377856	failed	\N	2025-08-14 17:44:23.869
a028cbe2-7adf-43d0-9710-c4e899cad9f2	twilio	SMdpr03	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559612961	failed	\N	2025-08-04 11:07:54.587
b2f62d77-8e06-47d5-a924-b5f4b920590b	twilio	SM44v97e	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554670617	undelivered	21211	2025-08-11 18:37:44.672
7486f44c-7334-4e2c-be2e-56c402139256	twilio	SMoodx9g	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555845642	failed	30001	2025-08-04 17:42:57.753
5ced77ac-e49d-4b24-a3a2-c953f05f8521	twilio	SMknl574	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554627876	delivered	\N	2025-07-31 09:36:30.562
b51543c3-a24a-4371-8ed0-c1011cdb0022	twilio	SMmqwqf	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554620718	failed	\N	2025-08-19 18:04:24.099
5390d5de-701f-495c-b2f6-0ed7e5d95e6f	twilio	SMj70wcr	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553653789	sent	\N	2025-08-02 10:21:56.293
e6656d7e-5922-4540-8448-5c5c1bc295c2	twilio	SMw6ew39	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551010964	undelivered	\N	2025-08-15 04:27:49.332
a5f3ee1e-2c0e-421e-8cfc-ec5d21a1c590	twilio	SMer2dea	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554884192	delivered	\N	2025-08-07 12:18:48.413
f4264896-3922-4a76-9545-5881b61e9406	twilio	SMy6rn8	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553676600	undelivered	\N	2025-07-30 22:27:59.919
9688bf9c-b09c-4510-9030-c5dbb4088309	vonage	SMps6pbr	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553462825	undelivered	30005	2025-08-20 00:37:27.06
14d2c2c4-c5e2-4df5-a4b6-efcf3553d63f	twilio	SMelxsm	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15557538367	failed	\N	2025-08-04 18:22:54.316
39cb5b6f-7faa-4c1a-92ff-1e061299fdce	vonage	SMzwavjq	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554726951	undelivered	\N	2025-08-01 17:58:22.826
76386cb5-36e6-41a8-8b4c-a32d855a2917	twilio	SMnxuvs6	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556577160	sent	\N	2025-08-01 23:47:32.091
1a01d279-3687-4594-bbf3-73f715c2a823	vonage	SMa2tvd	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558068458	failed	30005	2025-08-20 17:26:37.588
9c7bedd4-b06a-42a8-b164-d26abdedec90	vonage	SMul7c8	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555521792	undelivered	\N	2025-08-23 10:08:40.162
2a6aca82-2243-4d5e-aa15-fb58c3e2b76c	twilio	SMyqwcxc	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556725451	delivered	\N	2025-08-04 19:22:11.1
3ec1fd05-adc8-4d1c-ae41-3f9481254c81	twilio	SMel3ouc	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558879061	delivered	30001	2025-08-17 05:50:02.269
93eabf50-f360-4131-bbd7-1a7ef6400ec5	twilio	SMtws5ac	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15557327099	sent	30003	2025-08-03 05:10:42.082
b13eb34d-a379-44c7-ba74-3ab62b906ca9	vonage	SMa1jr1s	\N	+15556872519	delivered	30001	2025-08-05 01:10:03.258
7fbba521-317a-46e7-8e08-367e05be9df4	twilio	SM83nbl	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15558265904	sent	\N	2025-08-23 14:15:52.713
0b796cea-21bd-451a-8e14-065511740025	twilio	SMuoc1qv	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553928931	sent	\N	2025-08-06 09:56:20.594
e113d0b3-e294-4474-9a5f-b6e780a6918a	twilio	SMpyucrq	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556341065	delivered	\N	2025-08-01 17:25:56.322
f273a1a3-2f68-4498-a525-f0c0d0dda12a	twilio	SMql1noj	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559498112	undelivered	\N	2025-08-22 08:36:07.106
6688e5da-ec48-41cc-85a6-0b29b56fc773	twilio	SMf1tjmq	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556255475	failed	\N	2025-08-13 04:50:03.657
21e26054-a21f-43b2-a959-10b6c39be5b0	twilio	SMsiohns	\N	+15555187917	failed	30005	2025-08-21 01:53:27.335
5f4c6c7e-8f9a-460b-b1db-264a4ef9da15	vonage	SM1879z	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558040908	failed	30001	2025-08-04 14:58:35.235
57be8f34-c36c-45c0-8645-b6a88627539a	twilio	SM55u1qf	\N	+15552914078	delivered	\N	2025-08-22 14:12:23.483
cb327dc9-734f-40ae-82d9-335504a22e0e	twilio	SM256n5o	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555767303	sent	\N	2025-08-13 17:46:31.908
5c576d95-a4c9-4476-9829-d2c677b1caae	twilio	SMn6ii2	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15557744115	undelivered	\N	2025-08-20 17:07:53.177
a264e3a2-192d-42f2-ad9e-fd65a402510e	vonage	SM3zdm7	\N	+15554507067	failed	\N	2025-08-20 22:20:34.098
9b6e0eff-f2ac-4156-b1b5-614dc43749c6	vonage	SMnaklvw	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554888533	failed	\N	2025-07-29 05:46:13.168
c3656e65-2087-4049-a866-30036a9161d7	vonage	SMujcz7a	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554098814	sent	\N	2025-08-12 22:13:34.496
90e05e0e-1672-46e0-8ddc-e31566dc8159	vonage	SMx18ex	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15557279126	delivered	21211	2025-07-31 21:32:01.142
659d5eab-2d9a-4a4e-b628-8e60975a6256	vonage	SMswz3g8	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15558176506	delivered	30003	2025-08-19 21:56:38.306
709f6ca0-fa66-43d0-b447-b81c365a5fad	vonage	SMk5hbvr	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553336651	delivered	\N	2025-08-19 10:33:40.801
e9056417-398d-4bca-829a-26e72e0b7524	twilio	SMu7zfef	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15556252194	undelivered	\N	2025-08-09 00:41:35.801
a4d7290a-b4f6-457c-805b-f2c2be53c9ce	vonage	SM4v8mb	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553218648	failed	\N	2025-07-29 12:59:22.411
bf7bf5af-508e-4463-af17-d772005fd7b1	twilio	SMtjfdc	\N	+15559748304	sent	\N	2025-07-29 01:19:10.914
e78ed925-5cba-4a0b-9659-315816e91fc9	vonage	SMc650fh	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554002319	delivered	\N	2025-08-20 12:52:54.437
5d0ebcab-7ab4-400f-8a62-fc99b6ecf89a	twilio	SMu66y2r	\N	+15552887079	undelivered	\N	2025-07-31 06:56:53.879
2d6ff89c-eea2-4573-a8ef-41a7524394d2	twilio	SMhd7ulr	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554874826	undelivered	\N	2025-08-09 05:22:02.683
082ff763-7567-4fb1-9c21-ee317ea7d8de	vonage	SMn133b	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15556228535	delivered	\N	2025-07-25 10:58:53.613
e8127b07-058c-4ef0-8610-5ceea28843d0	vonage	SMwc0dlb	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558202987	delivered	\N	2025-08-05 20:08:14.038
13efe6ff-2515-4252-be70-0d910cdb4592	vonage	SM4vlu0r	\N	+15552721415	failed	\N	2025-08-04 13:05:20.781
61649b0d-e245-45d6-a3cd-9bce3dc639f3	twilio	SMu0c60s	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555348260	failed	\N	2025-08-18 19:01:41.993
6467a1c4-cd0e-474c-ad51-3ae2d7156c4a	vonage	SMv2dsr9	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15558414670	failed	30005	2025-08-06 15:52:00.859
191381b9-1f2d-49c9-8ac6-afa194d823c0	twilio	SMmv953	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551424492	sent	\N	2025-08-23 12:57:49.464
74caeeb2-4a36-485f-a7cc-fe4cbc881b47	vonage	SM7zpwwq	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551593733	undelivered	\N	2025-08-03 23:03:47.095
6e3d23cb-14d5-4f6e-9756-ef912ab9be0b	vonage	SMjx2x	\N	+15558226487	undelivered	\N	2025-08-20 08:04:07.872
3e5afddf-9e19-4b28-a1ab-31ea3d5fd93f	twilio	SMjdvyp	\N	+15551206013	sent	\N	2025-07-27 06:14:34.24
2a200fb5-e38b-4b2f-ae40-682a07729ba7	vonage	SMpfy5w	\N	+15551455286	delivered	30003	2025-08-21 22:11:47.981
8042bccd-4255-4208-8ac5-68c884c6ec87	twilio	SM7hnhm8	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556323380	undelivered	\N	2025-07-31 10:03:39.867
5b96de2b-d1b5-4865-854b-e58ecd2eb1d0	twilio	SMkc53d9	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15557650714	failed	\N	2025-08-04 03:20:46.919
ed1bd01a-30b5-4edd-99c5-7c2870f13d3b	vonage	SMp2bqwl	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15552776618	failed	\N	2025-07-29 02:11:50.935
f5adca8c-fa45-460a-b372-3bdfadb1fafa	vonage	SMdbuvhb	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556979849	failed	\N	2025-08-09 07:04:56.734
3e9cc944-1b62-44db-b54e-61f6c1ddba5e	vonage	SMfas28	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554828497	delivered	\N	2025-08-03 02:07:18.847
bdbfd02a-a40c-4ea9-b4bc-9e873e2e379f	twilio	SM5pa8x3	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551023979	failed	\N	2025-08-11 20:52:55.618
17d9c94a-35ad-48c4-b9a8-a977244368b7	twilio	SM07s9kd	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555627192	undelivered	\N	2025-07-30 01:59:41.083
d6e5cebe-791d-4ae7-8146-517b21cd4be7	twilio	SMgfolq1k	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15557191979	failed	\N	2025-08-23 13:15:17.126
545aaa70-8cc9-414b-a52a-8bc86411ac53	twilio	SMiknkks	\N	+15558376366	failed	\N	2025-08-04 17:18:23.292
f51852c4-1078-4aeb-8028-80d9475acb6d	vonage	SM8u7io	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555602245	failed	\N	2025-07-31 13:22:12.078
82346b5c-e4ff-4c54-a6d8-4db8d6465534	twilio	SMb21zkx	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555667939	undelivered	\N	2025-08-18 06:30:53.696
fbce31d0-2f38-489a-9dc6-0d37ba96b11d	twilio	SMl646ik	\N	+15552080259	delivered	\N	2025-07-25 07:44:30.758
ab66d31f-6451-4651-b877-2c6701d66408	vonage	SMmcks57	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556306603	undelivered	21211	2025-07-31 08:19:53.571
7cc33a0c-6c22-4671-af7a-3c93571138bc	vonage	SMl3j17k	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15552883606	failed	21211	2025-07-31 03:28:46.737
c9654f4d-c19d-4237-a939-8fed029c2c00	vonage	SMu2y3g5	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15553177593	sent	\N	2025-07-31 02:09:44.475
e4247ceb-3f69-47b2-97ec-9e942eeaaa10	twilio	SMm5emia	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15557036612	undelivered	\N	2025-07-28 14:09:32.131
3d5db45e-8e89-45ec-8c96-11420219b4d9	vonage	SM8ojiuj	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553460060	delivered	\N	2025-08-02 21:59:00.888
f6e6e263-be33-4e12-911c-cdf2ba7e12d5	vonage	SMc1xfrh	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556601787	delivered	\N	2025-07-27 06:45:18.012
cba88c95-695e-435a-ac1e-ed87bcbb346b	vonage	SMat58bb	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558561339	sent	\N	2025-08-10 06:14:37.68
3be0d484-9c92-4ab3-8868-fb29a5d7e163	vonage	SMljilbf	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555745948	sent	21211	2025-08-10 04:41:01.359
2c634cdd-b024-4069-8422-a483713c84f2	twilio	SM1bfda8	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15558243369	delivered	\N	2025-07-27 16:39:19.143
b3d64a0f-3474-440a-8a56-7e106df6cd45	vonage	SMrnb7n	\N	+15554084792	failed	\N	2025-07-27 18:45:29.034
1d93fcec-d326-474c-9bfc-eb4200674000	vonage	SMeobl39	\N	+15554379280	failed	\N	2025-08-17 01:43:24.755
2fda3b39-2d62-4737-9fe1-582d48d3a102	vonage	SMcik82o	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15558864030	undelivered	30005	2025-08-15 14:23:48.508
e61ba0ff-5623-4766-b7aa-8e3a06d32668	vonage	SMzz7lkw	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15551490628	delivered	\N	2025-07-25 05:58:46.911
d640920d-473a-4c27-a028-484a608e8a78	vonage	SMl49odc	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15559546903	sent	\N	2025-08-13 18:48:56.613
cbd11fa4-da0e-4767-b26f-d80e44341ef3	vonage	SM7f31al	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551249243	sent	30001	2025-08-16 04:47:20.888
d0d581b4-8ff7-4c56-8fea-c7dcc211ec44	vonage	SM0fii98	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551827006	sent	\N	2025-08-15 11:50:06.823
0433b5e8-517b-427b-a14c-090f6dbdd715	twilio	SMkyo5rf	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555110874	delivered	\N	2025-07-26 23:22:26.131
0384670f-4136-403c-81dc-d3806ebe0517	vonage	SMxhi0ns	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15557983961	failed	\N	2025-08-21 03:25:31.441
0bf12b95-99e6-4823-967c-72996712546e	twilio	SMa63hhh	\N	+15559959135	undelivered	\N	2025-08-02 02:03:45.07
edc1f40b-c733-4a48-ae17-d7b00cb227ad	vonage	SMw5jm9j	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556328731	delivered	\N	2025-07-25 22:57:58.2
5f6de552-cc22-44c8-8f5e-54d929ebbf18	vonage	SMtmkd3h	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553292807	undelivered	\N	2025-07-29 00:08:39.975
3229a82a-2339-4182-956d-eb6ca96716dc	twilio	SMkm9thzj	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15553565886	failed	30005	2025-07-30 19:04:40.263
b806ae01-ee04-4f73-80b8-85049ae9e2d7	twilio	SM3lhr8e	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15559609745	undelivered	\N	2025-08-07 01:57:17.015
cebd56b6-4bfd-4849-8086-1b03e029110c	vonage	SMo896k9	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554614922	undelivered	\N	2025-07-29 05:39:21.754
3fb8b73a-50db-47d7-bdc1-ac385f9dfec9	vonage	SMs11z6m	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552857306	sent	\N	2025-07-25 10:41:29.979
6f99354b-1a27-46bc-9212-bcfb825fe265	twilio	SMac9nh	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555519262	sent	\N	2025-08-15 21:30:48.376
5919d8b3-c1f9-4094-9e6f-ad71aa11a1e7	vonage	SM96zw4	\N	+15559769038	delivered	\N	2025-08-19 00:40:27.615
ec798800-4fc6-4be5-a3bf-ea45f35c2ce1	vonage	SMj6m27s	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556126757	undelivered	\N	2025-08-09 14:56:40.41
64d4ea11-91df-42de-b8c9-cee43b8b251f	twilio	SMk5wjmd	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555819711	undelivered	\N	2025-08-20 20:52:02.808
a282ab5e-4804-4278-8071-20cbeb6039e5	twilio	SM5nb0nb	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15553561710	sent	\N	2025-08-05 01:10:48.074
6da28161-92cd-43d5-8e4f-5038466d0c17	twilio	SMq8fb9h	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15554710243	undelivered	\N	2025-07-28 07:54:38.64
95961f30-89c8-4b98-a14f-2435a1741f12	twilio	SMqk8m1i	\N	+15552189110	failed	\N	2025-08-15 11:42:36.295
4728938a-6bb4-4df5-8b1d-c04e65e5b72d	twilio	SMoxsxg	\N	+15551291354	undelivered	\N	2025-08-13 05:37:17.307
73a77c9c-4df4-49e0-b89d-ef2f7f111166	twilio	SMaug5kk	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15554996241	undelivered	\N	2025-07-26 03:55:53.148
9c7b34f5-fbea-4484-a699-499840578160	vonage	SM1bqxb	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15556940885	delivered	21211	2025-08-18 12:42:07.284
7ef8ba64-284e-4b0d-b6df-f7479cdd3a34	twilio	SMao56o	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15557691122	sent	\N	2025-08-16 23:53:13.726
3510116b-a40e-47ca-9390-94bbd8f42344	twilio	SMoua6jl	\N	+15553398050	failed	\N	2025-07-30 17:21:03.479
47ec37bf-e875-472f-a7a3-83ff65df48ba	vonage	SMx4uzr9	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15557138386	failed	\N	2025-08-10 06:11:19.01
d38a4aa6-a333-4f74-b85a-8db7247b0753	twilio	SMpdc5un	\N	+15557437324	sent	\N	2025-07-28 23:16:42.606
195d7d1a-7222-4229-baf1-05c14336f3fc	twilio	SMdgid2	\N	+15552450807	delivered	30005	2025-08-10 22:11:13.935
4e484e1f-5937-4a56-8d16-0f5d91672287	vonage	SM8rmb5	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15556917793	undelivered	\N	2025-08-10 09:05:23.285
ac51f9c9-94ff-4aff-9c7a-6c0864617df5	vonage	SMq9bqjb	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556624360	failed	\N	2025-08-19 13:34:23.949
5304f57c-6290-401b-87f9-a205e94303b8	vonage	SMo2xnvd	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555969292	undelivered	\N	2025-08-15 03:12:58.661
3e0bc929-5323-47c7-8b30-805c8e6beb59	vonage	SMxz9e6	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15558702552	delivered	\N	2025-08-16 22:56:31.969
3b96fe8f-f50e-44a3-af16-933eb92d17a1	twilio	SM7oc83h	\N	+15554975196	delivered	30001	2025-08-14 23:16:44.772
30afd812-a1b8-4112-94cb-1c1052649957	twilio	SMehb08c	\N	+15559127308	failed	\N	2025-07-28 05:44:06.223
0dfd10dd-1ba4-49a5-b4b0-2dd9b05d2492	twilio	SMj0p6g	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559178580	undelivered	\N	2025-08-12 20:45:10.276
7e85b13d-2028-4049-83d3-388d420318fa	vonage	SMbarbcg	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15556342477	sent	\N	2025-07-29 23:44:36.324
1166b7de-d9d6-48e9-9f6f-b25bc844b358	vonage	SMz9raqj	\N	+15552090649	failed	\N	2025-07-26 01:36:37.35
8d55be39-9378-402c-b8b3-fcbe9a142b90	twilio	SMadwnka	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15555662684	undelivered	\N	2025-08-15 18:48:00.81
5346c4d2-5bfa-4ec6-88a6-a001d8e29bc5	vonage	SM6gmft	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15556417343	failed	\N	2025-08-23 11:30:23.305
0c3eb1d6-40e2-447d-9aed-380118b52ca3	twilio	SMck00bh	\N	+15557431169	delivered	30003	2025-08-12 09:38:08.671
ea13cb81-764c-4d05-8783-2c095acd983a	vonage	SMwyt1hm	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15551221395	sent	\N	2025-07-30 13:52:22.762
5e1b99f9-a4d3-4658-87d1-3cfd0dc69e2b	vonage	SMgf26vn	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15556199264	delivered	\N	2025-08-21 23:44:54.611
c33b2032-cda7-46c4-af9d-98ed48e2a1d8	twilio	SMcr5jaj	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555349698	sent	\N	2025-08-22 07:42:37.511
e822ffe5-7efe-4a35-a603-b384ffe66d25	twilio	SM9fhb8s	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15558701819	delivered	\N	2025-08-10 22:51:44.25
a01927ff-3c5b-4f91-a0c7-d5afc37d58de	twilio	SMpomqaj	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15552663360	failed	\N	2025-08-07 12:03:10.106
a78423b8-5624-4466-bb65-080cfe3ee9cf	twilio	SMwdp7a	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15552963786	undelivered	21211	2025-08-21 21:46:38.66
e0c6d820-a06c-44a8-bf7c-095dfa268817	vonage	SMe415x8	d98c4191-c7e0-474d-9dd7-672219d85e4d	+15559047137	sent	\N	2025-07-31 05:54:24.09
4ddcb5dc-1441-455c-b824-efef57fcb99b	vonage	SMo0hs45	\N	+15553767380	sent	\N	2025-08-21 01:49:32.143
9f023ecd-fa27-45c5-8a41-b026a5b14723	twilio	SM7kbr3	c2d95cef-9cd3-4411-9e12-c478747e8c06	+15555855905	sent	\N	2025-08-14 22:35:28.064
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, tenant_id, stripe_customer_id, stripe_subscription_id, plan_key, status, created_at, updated_at) FROM stdin;
a80c03a2-ee5a-48f3-a308-cc541cbc2190	c33747b7-1de7-4a0a-8a6c-2a4768ddccca	\N	\N	free	inactive	2025-08-26 22:15:20.003626+00	2025-08-26 22:15:20.003626+00
9f1a92e0-641b-4c93-87f6-97044ef53e3b	d98c4191-c7e0-474d-9dd7-672219d85e4d	cus_test_elite_123	sub_test_final_complete	elite	active	2025-08-29 01:55:51.186209+00	2025-08-29 21:58:46.76+00
ad539988-6427-438a-9790-3acaa370c325	6602d4c2-19e6-49be-b596-40fc58430f73	cus_test_new_tenant_123	sub_test_debug	elite	active	2025-08-29 22:46:32.503574+00	2025-08-29 22:48:08.912+00
323cbca2-8cb5-4825-8a21-939b9e6caec9	b1a54a1c-b8ec-43c8-b2c6-a86d359e5e16	cus_payment_test_123	sub_payment_test_growth	growth	active	2025-08-29 22:50:52.315838+00	2025-08-29 22:50:56.715+00
15df5d93-33ac-4df4-9bd7-2624298c1cc6	05ff7706-40d7-4248-8ea0-44f5c093bb81	\N	\N	growth	active	2025-10-08 01:42:22.10202+00	2025-10-08 01:42:22.10202+00
65a5797a-06ca-4496-8ff7-f31f9f30847d	4b7d3a08-e945-4cb9-974c-ac6d05405977	\N	\N	free	inactive	2025-12-04 04:01:09.931471+00	2025-12-04 04:01:09.931471+00
08ce7f1c-8a95-48f2-8abe-2c2e805717d1	b91569ce-22ba-4645-b1a2-9db34bd7c4ab	\N	\N	free	inactive	2025-12-04 05:40:55.763854+00	2025-12-04 05:40:55.763854+00
629322f8-21ce-42de-8bf0-6c7843ac6dcf	fe2f5f15-ab93-43c8-a483-3d3d7cabf754	\N	\N	free	inactive	2025-12-04 13:30:20.973229+00	2025-12-04 13:30:20.973229+00
50752d37-261d-42be-aded-df62ccb11d74	f858260d-1f30-4c8a-a89d-fc0be31cc25e	\N	\N	free	inactive	2025-12-04 20:22:41.642011+00	2025-12-04 20:22:41.642011+00
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, tenant_id, key, value, description, updated_at, updated_by) FROM stdin;
f8bf7f09-c4af-49f0-a524-f8dc3d539ec3	\N	autoApproveRegistrations	true	\N	2025-07-28 18:32:42.833961	\N
e0affd8f-2d0f-400b-9a8f-4432a45daa06	\N	businessName	Futsal Culture	\N	2025-07-28 18:32:42.871869	\N
3c1fff69-6020-4f1c-b183-cebaa250df03	\N	supportEmail	support@futsalculture.com	\N	2025-07-28 18:32:42.903334	\N
0f446804-f02b-4d02-8ffb-4d7863763e5d	\N	supportPhone	+1 (555) 123-4567	\N	2025-07-28 18:32:42.936033	\N
2694e5b1-e1c7-4892-8d8f-52a4a6b0161e	\N	supportHours	Mon-Fri 9AM-6PM EST	\N	2025-07-28 18:32:42.968347	\N
4b91a48f-8970-4074-a15f-2f1e534be102	\N	businessLocation	123 Sports Center Dr, Athletic City, AC 12345	\N	2025-07-28 18:32:43.000998	\N
e7b693f4-503c-42fa-af5d-31c1f513e2a9	d98c4191-c7e0-474d-9dd7-672219d85e4d	smsNotifications	0	\N	2025-08-08 03:42:52.447	45392508
29c7b7fe-1a38-49bb-b234-b3d48a710960	d98c4191-c7e0-474d-9dd7-672219d85e4d	sessionCapacityWarning	5	\N	2025-08-08 03:42:52.481	45392508
cbf66b79-e33f-4c56-8d3a-6939876d744e	d98c4191-c7e0-474d-9dd7-672219d85e4d	paymentReminderMinutes	15	\N	2025-08-08 03:42:52.516	45392508
970f3355-ccf5-46e1-9030-931ca732ba95	d98c4191-c7e0-474d-9dd7-672219d85e4d	weekdayStart	monday	\N	2025-08-08 03:42:52.551	45392508
5e3e8aa1-2f78-4867-8ad3-31f6c7382b63	d98c4191-c7e0-474d-9dd7-672219d85e4d	weekdayEnd	sunday	\N	2025-08-08 03:42:52.589	45392508
9ee20705-8257-4d4d-9b9d-d710e7ac1f5f	8b976f98-3921-49f2-acf5-006f41d69095	requireParent	13	\N	2025-08-26 17:13:20.069	98c7aad9-1d62-454a-8a8a-9664e0286c61
395592f1-b151-408d-8a38-0f0241f51f16	d98c4191-c7e0-474d-9dd7-672219d85e4d	fiscalYearType	calendar	\N	2025-08-08 03:42:52.623	45392508
b2121b1b-d989-4733-9be9-a1d4a66b6b5a	d98c4191-c7e0-474d-9dd7-672219d85e4d	fiscalYearStartMonth	1	\N	2025-08-08 03:42:52.658	45392508
a7527888-9343-450a-8fb6-c9856ff59840	d98c4191-c7e0-474d-9dd7-672219d85e4d	audience	youth	\N	2025-08-25 01:47:39.329	45392508
a923ec45-e287-49a9-a286-6155a2c50f75	d98c4191-c7e0-474d-9dd7-672219d85e4d	availableLocations	[{"name":"Sports Hub","addressLine1":"59 Lancaster Rd","country":"US","city":"Boynton Beach","state":"Fl","postalCode":"33426"},{"name":"Jurong East","addressLine1":"118 Montgomery Sst","country":"US","city":"Rhinebeck","state":"NY","postalCode":"12572"},{"name":"Turf City","addressLine1":"123 Main Street","country":"US","city":"Singapore","state":"SG","postalCode":"12345"},{"name":"Test","addressLine1":"3011 Dunlin Rd.","country":"US","city":"Delray Beach","state":"FL","postalCode":"33444"}]	\N	2025-08-08 03:42:52.693	45392508
bc4ea07c-1521-4cd7-9196-aaa512217a89	d98c4191-c7e0-474d-9dd7-672219d85e4d	minAge	5	\N	2025-08-25 01:47:39.364	45392508
b701f399-8a4e-4aff-ab49-bfbbfc2e21cf	d98c4191-c7e0-474d-9dd7-672219d85e4d	maxAge	18	\N	2025-08-25 01:47:39.399	45392508
4c9f48d9-bf99-418e-97b9-b4b7b213c7e3	d98c4191-c7e0-474d-9dd7-672219d85e4d	requireParent	13	\N	2025-08-25 01:47:39.431	45392508
f481f4e4-b89f-46e6-86e1-d0fac8d839c7	d98c4191-c7e0-474d-9dd7-672219d85e4d	teenSelfMin	13	\N	2025-08-25 01:47:39.463	45392508
ccedcedc-7157-43ef-adf2-5aef6c604798	d98c4191-c7e0-474d-9dd7-672219d85e4d	teenPayMin	16	\N	2025-08-25 01:47:39.496	45392508
58ca11aa-c811-4998-b372-6421d3d8c650	d98c4191-c7e0-474d-9dd7-672219d85e4d	enforceAgeGating	true	\N	2025-08-25 01:47:39.537	45392508
a645b913-828c-4270-8d8b-1bd1c3cd4482	d98c4191-c7e0-474d-9dd7-672219d85e4d	requireConsent	true	\N	2025-08-25 01:47:39.574	45392508
9a21e770-c46f-45ca-b2fa-5f40a0a7fedd	8b976f98-3921-49f2-acf5-006f41d69095	teenSelfMin	13	\N	2025-08-26 17:13:20.102	98c7aad9-1d62-454a-8a8a-9664e0286c61
5e0a2ae8-6eec-4219-8fc2-ce96ca6b9b8e	8b976f98-3921-49f2-acf5-006f41d69095	teenPayMin	16	\N	2025-08-26 17:13:20.134	98c7aad9-1d62-454a-8a8a-9664e0286c61
c710e618-0d55-40ad-92e7-5e6b2affa961	8b976f98-3921-49f2-acf5-006f41d69095	audience	youth	\N	2025-08-26 17:13:20.166	98c7aad9-1d62-454a-8a8a-9664e0286c61
f86480a7-5be3-4ea5-be85-8d7afc3ffea0	d98c4191-c7e0-474d-9dd7-672219d85e4d	autoApproveRegistrations	1	\N	2025-08-08 03:42:52.05	45392508
33736b50-77c9-4997-98fd-6349eee703db	d98c4191-c7e0-474d-9dd7-672219d85e4d	businessName	Futsal Culture	\N	2025-08-08 03:42:52.098	45392508
6d342146-3c0a-431a-a8cb-23bbfb240063	d98c4191-c7e0-474d-9dd7-672219d85e4d	businessLogo	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/7QCEUGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAGgcAigAYkZCTUQwYTAwMGFlMzAxMDAwMDE5MDUwMDAwMzUwOTAwMDA0MTA5MDAwMDRkMDkwMDAwOTYwZjAwMDA0ZDE2MDAwMDg3MTcwMDAwOTMxNzAwMDA5ZjE3MDAwMGUyMWUwMDAwAP/bAIQABQYGCwgLCwsLCw0LCwsNDg4NDQ4ODw0ODg4NDxAQEBEREBAQEA8TEhMPEBETFBQTERMWFhYTFhUVFhkWGRYWEgEFBQUKBwoICQkICwgKCAsKCgkJCgoMCQoJCgkMDQsKCwsKCw0MCwsICwsMDAwNDQwMDQoLCg0MDQ0MExQTExOc/8IAEQgBQAFAAwEiAAIRAQMRAf/EAK4AAQACAwEBAQAAAAAAAAAAAAAHCAQFBgIDARAAAQMCBAUEAgIDAAAAAAAAAwECBAAFBhATIBESFRYwFDIzQCGAI3AiUGARAAEBAwUNBwMCBgMAAAAAAAECAAMREBIhIjEgMDIzQVFScXKRobHRQEJhgZLB4RMjgmKiQ1BTcPDxYHOyEgEAAQEFCAIDAQEBAQAAAAABESEAMUFRYRAgMHGBkaHwscFA0fHhcFBg/9oADAMBAAIAAwAAAAGGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHqQiO95YHriCetkkV0j+Ro5AJV6fTzOQDwtuPJTZZGIzigAAAAAAAAAD9Pzqu0mo5rqANbCxKkGch5AAP2QY9Fsd1TuWyaWNknDQTa/FKfJFjoAAAAAAAA9Tx8pWBwZ28URdoTMwwAAAAA2011+Fyv2sM5HVwlNwpolWKgAAAAABJ8YSuTpz0XRUdrwwAAAAAAAAP38ElzXUnJLOVh8fMAAAAAAAAASnFlpj6RHPuGVAWvFUFrxVBa7TlaUmRmAAAAAD0eQAAAPt87WlUEyQ2AAbO29frBAAAACutiq6EfgAAAff4bQnLkJ048rIAAADpbTQDPxiU/uBT8AH6T/Jeq2pzXJcfGxPKBhPKBhPKBhZ+Oe/7MghO4ghO4gbjbV/Ipy7PjBtNXtC2/z+gp9i9dyIAABNExxTKxiU/uBT8AdHzksk5ArHrLXiqC14qgteKobKzo8+gAAA4Cudi66DaavaFtwV9jaV4oAAAJ3lSIJfMSn9wKfgCyFdLemSAAAABG8kVgOdYwyWMMljfh9viDaavaFtwQZE8mxkAAASpO9Y7OGJT+4FPwDs7MQ9MJ8a/SlWkkJHokJHokJHuQWAkPV7Q881045h045h045jD7MVs4e4tUzTbTV7QtufhWritjrgAAD7W8p7YY7qn9wKfgzyyXVefRCcQdPzAAA7/gM4t6ivOJGRyJGRyJGRyJGRyJGr73kPnNbTV5xb3nNjFpDAAAAHbcT+lrKpZWKJEjvdFsdbXjDOb8gAAAAAAAAABl/XXgAAAAAAdOcw22pAAAAAAAAADopuK3puhY+QAAAAAAJNnuodkjpIgmgU7+FsoQI8fv4AAAAAHuUyOJmkfPPHtHRiQJ78AAAAAAADJxhYmQqaykTww8w42DbSeSmyeoWNcAAbw0fbSt35znRgamCDs4Q8gAAAAAAAAADZS9B4uBl0+70sJhcF1pAvFyjFwBJc9RP3Z0aLeDJ7iiI/kZOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/9oACAEBAAEFAv6vBAMeg4cItDw8BtXuKOO/OywBSWEw6FaNh0zaNFIH7aJxqJYilqNaAA2X47Clzw7IY1MlTjUmyANUuzmj/Yg2wkqodsFF2TLmKLU27Fk7oV8ICos0clM51mFIqXCJGX6lssfNTWo1MpEkYEnX95KVePgY9WLBxBQytImRRNK252Z0f6SJxq02fSzc5GpNxAjaKZ5V8caWSOsK+jLsu1m5fo2W1aec69Cj1Lnlkr54V1LFqFdBSs71atPz2S26q1LuAoqTryWR9SDfiCqNLHISdPFHR6oq+W3X3SSdiBzqc5XL9UZXDVzlcv1LLbGSE6bHq9W1kb/TWsOlHooGFrp4K6eCungrp4K6eCi2WM+ptheJPIqcPErFRN0UOqTxX6MgjeFjOd0GxjDWIo3K/wACfmhRGIGdYOG7D4ec3ivx9Q/hifNV4Bqx/Baxasijezbh4PKGp9wZETuQVdyCruQVdyCruQVdyCruQVQrkkun4eM5e2y122Wu2y122Wlw4WpVvNG2RPmpycyFZyO34dHxNRvZthh0RViE3MbfZo+jH3Oajku0D0pMonzZXgfJJ34abkb2bLaHVPlKjHMX0B69AevQHr0B69AevQHqNbDPIicPBfhc0fKJ82WIW8D78Np/HRvZsw4Hi/6V+Lyx8onzZYk+Tfhv4qN7NljDpx/Hf5WmLVfWq+tV9ar61X1qvpz1dnE+bLEnyb8NO/FG9mbG8yiHpt8d1leoN4YnzZYid/Pvw4/gWjezOyh1JFPdyJ3BIrr8iuvyK6/Irr8iuvyK6/IqzyzyslTjXSo1dKjV0qNXSo1dKjV0qNRLLGfVxtL4ucT5sr2/mk77OXTk0b2Z4bD+KvRtOPuGNSOix0jj8L2I9Jsb05aifNlJJqE3sdyqIiEab2Z2kOlHrEhv8t1haiyPHiJP56ifNVzPog8NgkagTezKOLVIicMrobVkbgHcF4sRjVO4Y9dwx67hj13DHruGPXcMeu4Y9dwx67hj13DHq5S0kmoD0YQEkZ0xHI8VmlaB5skYR5WAPOepRtIf1hGcJZEhx3eIhXEXKNNLHrrUqjXQ5m/8bDtpZVSYhI6/Th24sqolkCFJuHkWntVq+ayQgHpE4UQTSJOw/TxuYvnDHeZYNgaykajcrzdNJPOEzhOt1ybLblKhDkpNsZA+VEVag2Bz6BHYFMrrdkjoq8fojI4brbeGyNk20Ck1MtpYvihWcsmoduFF2XO9o2lXj9S331w6CZhUyVONTrAwlHjPAu2LBLJWFZBA2SZY46XC8vk/XBJIBYmIWrQjMKmRgMMl3gtikzstuHJpjEYmR5QwJLxCq0QriL9kZXDUGIDMoOIQuodwASsRLxJnh1yNGS5xx0bEQm1IvpyU5yu/q7//2gAIAQMAAT8B/ZD/2gAIAQIAAT8B/ZD/2gAIAQEBBj8C/tfUdkjPYN5autKdVbo1YrV5w5MhLtM0FPicvjcPPqJiQoQpIyNVUtO5TVFJX+09OLV0FOuzfZ2yK/tJ8cLd1bBnKzqp+LhMxQVNTAwzxuFoKgFKIgM9EtLUD6as6bN1jRhPTnT7i3tFFVGmbPLO1URVpG34uKxirRFvw0MBGiPc5bqav7iP3Dz6tFCo5xlHlcRH215xYdYaCxqOQ9lDx/QMiOvRoCgCWc8VNHPU011UTn7x6XmKSQRlDTX4/Me46NOSQoHKJSlYnJORit3Wd8U/Hj2MPHor5E6PzyliTADKWmuKx0zZ5DK05aio+N8i7VDkdYaa8+2rP3T087gvXIo7yM3iPDsIfPBWOCNHx1ywT9xeYWDWWrqoyJGCOwQBnI0TZ5ZmgDNXom3yzy/WdiocIaPjqv8A9VYqJsGkegkrmnIkWtAfbRmFp1nsk179xOfvDq0Xao8xrDQeUk9y0liUiaI0C2F+S7eJqigKT7hprmqNI2+WZokxJy9mnJUUnOGiTEnL2UvHlIBgA0Poo3MlbugKMJvT+TOxlhE/lTJXSFQziLYl36Q2Jd+kNiXfpDYl36Q2Jd+kNgTdkw+GKnZ+onN3vns4MDA2HPdoRpKAvcU0B4I+eW9BItUQN7Tnn3F/tHl1ZL0d8QOsfHK9IdKSFAJApz/7YrcmymafY9boq/pp4mjre4D+GJvnab06208xIvOmsPx+I3l0P1R9NMitk8ror01cE0c4yJKgTOzeDYtfDq2LXw6ti18OrYtfDq2LXw6ti18OrYtfDqy5iCJulCETqYqLxESYm3L5NjEcejYxHHo2MRx6NjEcejYaOPRq6aNIUi4dbaeYkIzspOiSN14UrRRzMitk8rp2jRSN+XjIE6CeJp6XhOddY+dnC7IIiDaGoxa6U9JXW2nmJXviY7xeHx2RzkVsnlcu0/qidSaZVr+i8rKJwTZkbEvPSWxLz0lsS89JbEvPSWxLz0lsS89JZCVO1pSTSSCKMt5J0CD7e8rrbTzEoOdA5m8PNv2kVsnlcvHmiJo8/wDXYyNNQHv7SuttPMSu9j3vDzb9pFbJ5XKTlWSr2HAXwIBrPDwH+BsI7y2Ed5bCO8thHeWwjvLYR3lqSTK6208xK72TzvD4eKTzkVsnlcAC0mG9kpFiQBuvij3U1U6h83p1tp5iVIzIHM3h4nOiO4/Mitk8rhGZFbdZxkKjYBHc3c9Ldz0t3PS3c9Ldz0t3PS3c9LKU8hMFAgIRMuJS2JS2JS2JS2JS2JS2BN8Ukj4acK7vPm1yuttPMSr8IDheHfjV9XzIrZPK4ePNSRzPtIvOurvt4XYSm1RgGS7HdG85TeilQiDQWW7zGjVkkdbaeYlWvSUTxvAItBjuZKhYoA72VsnlcOxlInH8qZHbvMCo+dAuxHIlRGu+D/rHMyOttPMSPFZYQGtVF6mZXZh5GkMrZPKVCNJQErw5AZo/Gi7C04SWroUD4QI9msXuHVrF7h1axe4dWsXuHVrF7h1axe4dWsXuHVrF7h1axe4dWsXuHVisYNAEcwkQo2JUk7i052oKDIdfkeQ970I4K6p9uLKnqhEGGc+Us7+mknzNEi16KSezzkKKTnDFazFR9r3OWoqOcyn6aps62gGzW2M/anoxQtcUm0QA9v8Ah1UQTpGxoPEw5HUeyVBV0jY1YfUVnVZ5Bpzgw/QbPIsQbRRfyVmcpP8ADyQz+LQFAaaoBQOQtOcH8D7Hq01QIIyHsE1CSotOfVzojB+WgKBIXTs1zhHRHXsAWgwUGzPBhJ9x4SweJjmOUebTkfcR+4eXS+wFJac+qDR73w01CQkSzHdL3/z8tE0k9hCkmChYWCF1XnBWrpcRwF6Q9xlasIp0hZ8XqOAjSPsGqitpG24LtyYqyryDV2UIfVk6XeHVpyFBQ8JaWnOaitHuno01aSk/5ZdQQnWrIPNoq+4vxsGoXEXioczqDTU1HebKdfTs852opLQfCadIWbrebRQoKHhLNWkKHiwCCYKEaclNwpbyJCTg59bQSIAZBLF4sJ57rWg5TD9SvYdWnKJUc57VFKik+FDV4PBuO8dGrBSOI4dGqvUb4c2dw0Pc3D2JArDk1L1PlW5NUQpeuqOrUEOx+m3e0SYnx/td/9oACAEBAgE/If8Al/aKPhC0K6aFfTy2vxeQ9hPm1VwLWRkYncaoaIQDoS1+7rB5B82qIOX0M2H418eF53/LRAErcWj6xklHx6jlaKSNr+hc6Fo2LFr8gCoJGJuem4m4pqYFMJ0v2iEAjeNS04zX9H1RaeoetB2Hk1/IXk5noLl1bFDm9fpwHLruFRk9frwHPpaflq9/k+Gm9FS6zQ0xcu4tDEi9pzvtdruSJ6PU7DzIbUfxua8t+mv4qxDeXK65TuzysAABABAGhthYwJv0C96WkBfbZdEutkSqq1VqvAP3VkhOtlIkGTX2x7LF7mSSbRi3he362qCv3Hn5/wBM/wAJEAStxYDLX2qa3P2rdsdGrFIDmtpoNAp8nMwc7O0HFfGAaHEkceJf4BtGw91c/wDDWwzUx2JNudSXd8owwpd+BAxKfA4tWGRrdskKTiVvShLytIukHIPtl/AguoPqX9FNLQ2YKfUu6K6bZLVFPE4NXh0u42N5rXD6atMHZ5w0+mBqwWkXlx6HceRB+GMVKJaBk7K5/autoDDiXeQLL0CJCgcy4HNtP5Uy0MCcY4wGcYBCHYdUrotpEe/eS7yeVkCqhTKur+MXEbkhsgVUKZV1fxTPa74FAVYq3hanceWe99jpU7TMMSKaxSp/41G4XXf6RsCAe4FDvb1P6t6n9W9T+rep/VlfS8Wz1zTwr4WhxFWEE5XdFdOKlCQ68JIhLIMQYYbmu/reHKa+JsEUOFB6ow1p3Uea8JriAnNQWiYNUq6K/n2WiZT4P78GCgKrdZwxgEjCrzqbGIsCnwPWO7enW5HwvHDCt0Poax04k668j9zg2KIS8v8AHZ7XNvT1e0dhsJUXQIzRVqmZwFlllllli6LlaiSCpcK2RmUmNUu6GGGGh0d6bK5Hh+RLusb04UKgR5NLO7er1RwNbDuR8Ts9rm3S2ggeifk2Q7cR5XjgK5I966d80woQkTUti2poRf04aJvToFgHbL5ngU9X5uz2ubdp9JDuD4jbdzA12jKLe5/Vvc/q3uf1b3P6t7n9W9z+rGhDGgK1Ol2tgAFAu4BY+P1Z+N5O12/YOBU9Hg/vZ7XNuzgXPMcvjy/DLHQujPeThX1eP98BUPUnZ7XNuzoVRyf2HXiSaALmEeV7w729u+7e3fdvbvu3t33b277t7d92wJM1fnenPgN5F7gH1s9rm3Fu0hzUFguUXkI4kTs/sHrJ4s6b+pPwPcIWx7XNuc3D9s5sO9iXIS2ZKUes7a/pztr+nO2v6c7a/pztr+nO2v6c7UTcWV61m4PnYARuSHrb+C/u38F/dv4L+7fwX92/gv7t/Bf3YiK2YDy+Fq6SuGrbg/Ddy3p2j/HM+V4ExwauhD4bPa5tyNeL0X7Njl4Ppld8ppIGqxa6lqPU6jXhHwGg4jZEKlZm6rs7k5Yt/jzKjxwFu8hzUlroovITb2ubcotHVH6INko/kX0B777te7QHwvEAcvZez8bk6o0S9ofM8Kqn3I7nS3tc21yPqFr4sAAoBByNle56E/YLvsvCSZajolGxTO/ipV44c2bNmzZs2bNmzLkA3oMesuy+EJF8Ats9kRecy862u99/2uFGVHR1v9PBbOgRQvRIpedtdXeAHy9tmh8cwp5iyyy3v4wUBxI95NqHASxFyChThv0HEl25LjEKouObsppUTeaGbwN5/wDHV7pnymK8h1tL5lb/AAD+Ihc4qR64uhNqSnIQxX4Jzq62k5HN/YOs87UWlVUalGpTjqzSmVNRiJwpGN9jIAFAKAcrM72QSWUmVq16/wAd1md5YIT8Auo4GGq3Bq2hlOjObf4HOxAAFACANDZdydDGw5zsVvj8BHDZE9ucS2HC+hf8LnXZBRkacq90u0tNylkUNcXPsOK6ApQAlXQtDK5O9zbvJ5WD6I46reurtcMIVbyeL8Dq6u1FEq1VcX8F07ZC8sfBu8vqP8abZqMuDe9jwdbPTltfrxXPhRDJ8Gqd550NbAX+Ks+uBoRuRpXAV0M7rcYTgiVVVlWqr+GMWqouy9zMnnnYWg4r5xHR2iEAjRGo2kEM54seiTS2V0JudVcnLerpGJTnfQltEU3EVvSrPTchcyl/kG0lO2B78w0Uzn8fPZEXPMueto3nzeu46WaoiQ/zrtQqOA+MR1LJkRZU1CJx3KYBAKEiar+hFhhLsEB0NunBC1chV0LTnLKvw+XKzdZvSX8rW2CV4tSxrv1ney875eaqy/loldoNjUhMYzuTwRfKHlbLPgpdp2pjGcPs8LSZlAfLL2iyipr1KvVr/wAu/9oADAMBAAIAAwIAABDzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzSChTyTjDzzzzzzzzzzjBzxzzxxjSzzzzzzzzzxTjzzzzzzxzTzzzzzzzzjTzzzzzzzzzxyzzzzzzzzzygjzzzTzzzzzzzzzyDTzxTzzzzzzzzywzzzzzRTzhQQwwxTzxzTzxzzzxxTyyzzzyzzDDDzzxTzzxxTzzzzzzyjDDRzzxTzzxxTzyTzzxxzzzxDzxTzzwxTzRzzyzjDDDDTijzzzyjTjhzzzzzzzzzzwzzzzzzzjzzzzzzzzzzjTzzzzzzzCzTTzzzzzgxjzzzzzzzyxDwjTzzzTyhzzzzzzzzzzxxThzzjgTzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz/2gAIAQMAAT8Q/ZD/2gAIAQIAAT8Q/ZD/2gAIAQECAT8Q/wCXwSmx+qcG0GZbPOYCmwlowl5lXKi43KqIBcGEvzLVzVDsbHmNVC9kaUUmXInoflkAIACVW4AqtsHqe0FFgQp5SlzQ87rYBQKF2wBLQLX+752TI1k7jA0rpl5apZuTaWVoAIZI0bTy5BJav29bRnl2r+iv5ALwVgrcvBfo0GBamAaI1PiOs7jCibk2XzEdDaQ5mIgewU3YYtSoaeZdw1NLEX4T3Hq9ErDcQWLX4g/9BbV2Q/3rzgGJ+IE0KtgKGeieL3DJeAeAcBcBABkbVdTMRjAy+g52wOnOINL/AOJWdMygob1Wq68BZySw7QVtkPRSOTf6O12/IE0pcmIwmJtJDMFkdcwYCEwbZKI+jdne/BQAgAFVaABVVuLHEeOWDA8GDFtDrqEGzQBaM24fhF/ggtftnmUyHQABlxJbdpvJP3GCWjKulXQOvLYmRBAIjIjcjlsAIkjRGtG0Wl5J6V684H4MKK0Poiyrnm7Upyk+UMp8pZOoln9qL+0/AYzPZDyP+isZQ6qPgH/QbEtiUgdME5155nHX3KWanri7ETSdkwe/9RsXtgJHYf7AH8N2IoERhEuRztAQcFXcactr1PdjJPMQ4LYrIyMZHdKE52mIMVZb2DBSY41AsZbftYOKwkfuIjzoatkqzpU5ikq8/wAa/RefKkvHEaWfZ0qcxSVef4tWSYng8AIAJjNlPaT3m0t4FhlTBSUixSP/ABpDgOdf55R6Njq8UtSQoBhTdYMGDAaLSFYb5a623rRb2Ilzy2UjiISoBgIwklHMRNOFTVulNSRQCMNHfQ4nlxifQqxACAIAuAu8cICC4KARZwiI961oI0zgSktqbtWPkkn6hb4KJNfg4IQJAAvVoHewtLGdoaUhW2TxgYlxrt4xKpZ9/wCrhs1LLrewniR6EEC51XehwZHITJhVPOngMIHX8zLYKOTB9CkSCDrwBxxxxxx8pCE7gmaLQ6PRfQ6m38S1/EtfxLX8S0NacfmnaohGETvmOAVvHjjh1mMjs28rrj/XgSFdH9lRv2AVAqt3O1EYe7w6rYk1XxwPsQQz7kOg61337aJLXiUS0NWkLXOnGsljjJ3j0QXL99XwGo0HQT5N9hJ/IliXPzbG3xyeA5N+4cOHDhwy2bNnAExTkWAIAAKAFAORwEoV9x+88G8e/wBsz4sOBziG+DC60SdMcuLJtNptNptNph029inlvHueB7nActF9em+wpAZhSfAcQxgkgCnFSec30iRIkSJEIEXKbyk7x6g5eb/HAm3p3WAbSC5g8jbxTIs/HE7OS5n1NEtFotFotHAPf3jfEcApG6Gr9Z7zCpyex2wVohXyR4CzVQlQqg38cccccYCorBBvC59dOw25UGYISlbt+BAgQIEB+Mt0AKOrtWfAXV0BQm4anNA7p6IlyXW8BJQY3vlLCBF+ND8/Y2RIYXr8756gnMjP90tdmAzCo574cKsceIFCe87M41KvL1yU6zuHgCrAVVyL7V6mJ5p8HAbKFfIHkLVX+SLHzusJp5hpYTyfS2Twuhq+DfaKyrOjw8T3uic4Tw3D14gznAuXi4U3KXqqr33MwvBuRjF0k2NsCAuAgO2yNOQCO7z6hv1NcDVUgGKEMm1OlYidQvJ6uGsWLFixYsWLFgqRPAOAClXfY7Jk6Rpo6MWChbWIRf4PD6AtTz4+4e2HC7ADE/Ck2GOjrzYFiXtxi7aFexfRdgHPLGR6xWdklFVvVq+fxrro6FyczOQtBWpAGBioKGGMvCGKlokHCuIuJcDIpt6yb2YQowNjTb8sEjkgx/8AjlYBzMs5iQ9FMlphZ03mHYvMQ/EuKjE3P3J0lWuqqSiECpzHJWzCeQvSrpkWiwrgpAjoCKqXinHpF2ciVsEaGbCw0RAgC4BQNC1xfIG1huTBKmDagYv8ReLFlSQxzw1/Awi6NB/qQFsU0Enhl0siJjDiLgIA0DYVy0Xc7j6q8/AfJhEwlyFEolG3OaH+p35R2p9QPgeo5pWNmP0vFu4amthIv4jsxlyFwEq6FsR0kPnh/jYLdYGqzU6oXbHtVcPoHt8mCx/4HlBKjVVqv4M4rAwn2NyNEo0soF1YnOfVXfduOQ2TxXMslFRX5svgCaLwseuSOyeasjtcIi5+5GkjOdqhVsLWlz44H+8LHzOQUEqrVVqr+GikYS5sdB0Do/jf3ctcvnmVyFwxATLaWR0AA3iNE0bYhCqSd38Ss9y4KeRnXJ3pizY/08/QWpvrO8jRTVYhZG2K0dd5B3LjFLYdCaB9TmH47WIRTMHk9A2yeaFWtf1AsTfcOmjFVpB25hVpDmugQdbUXDi6EqlJJzm/cqsXidUhWfsOFie5BBtIA2wKP+kzqFqZ26I89QaKs36tw5VbgwCAw/KEi/74RPJtFlGJ9BmWhjHKm2V4g+h90tN5SgHS3LlClveLTch/wwtlMFfkfxbSavkll63SeaMiu/8Ay7//2Q==	\N	2025-08-08 03:42:52.132	45392508
e317cd66-c47e-47d1-bec1-bacf43565dbb	d98c4191-c7e0-474d-9dd7-672219d85e4d	contactEmail	admin@dmcfutsalculture.com	\N	2025-08-08 03:42:52.203	45392508
16a8174b-6430-40cf-8367-0c5ccf4371e7	d98c4191-c7e0-474d-9dd7-672219d85e4d	supportEmail	support@dmcfutsalculture.com	\N	2025-08-08 03:42:52.238	45392508
c8c5585c-38a8-4ca0-9118-614827a7a415	d98c4191-c7e0-474d-9dd7-672219d85e4d	supportPhone	(555) 123-GOAL	\N	2025-08-08 03:42:52.273	45392508
c1b1d9bc-6e8d-4798-af97-3c8120aaf88c	d98c4191-c7e0-474d-9dd7-672219d85e4d	supportHours	Monday - Friday	\N	2025-08-08 03:42:52.307	45392508
59b9b981-fdd1-409c-91c5-8e3d8c9ee25b	d98c4191-c7e0-474d-9dd7-672219d85e4d	supportLocation	Boca Raton, Florida	\N	2025-08-08 03:42:52.344	45392508
4aaf1baa-8738-4075-9490-5c71762822d0	d98c4191-c7e0-474d-9dd7-672219d85e4d	timezone	America/New_York	\N	2025-08-08 03:42:52.378	45392508
62a6f4b0-0a67-4c6b-b2fa-71234105646c	d98c4191-c7e0-474d-9dd7-672219d85e4d	emailNotifications	1	\N	2025-08-08 03:42:52.412	45392508
dbc6f56f-d7f7-458d-ab82-0d7c77d28b36	8b976f98-3921-49f2-acf5-006f41d69095	enforceAgeGating	true	\N	2025-08-26 17:13:20.198	98c7aad9-1d62-454a-8a8a-9664e0286c61
1cfebd13-536c-4a48-8d9d-0d7a42734b84	8b976f98-3921-49f2-acf5-006f41d69095	minAge	5	\N	2025-08-26 17:13:19.999	98c7aad9-1d62-454a-8a8a-9664e0286c61
8524f2db-8974-449a-a176-ff479979787a	8b976f98-3921-49f2-acf5-006f41d69095	maxAge	18	\N	2025-08-26 17:13:20.037	98c7aad9-1d62-454a-8a8a-9664e0286c61
3a43f0cf-5efc-483c-89ae-1ac2949e784c	8b976f98-3921-49f2-acf5-006f41d69095	autoApproveRegistrations	true	\N	2025-08-26 03:39:19.51	98c7aad9-1d62-454a-8a8a-9664e0286c61
47a6a34d-272e-4747-9556-2dea2ab227ab	8b976f98-3921-49f2-acf5-006f41d69095	businessName	PlayHQ	\N	2025-08-26 03:39:19.555	98c7aad9-1d62-454a-8a8a-9664e0286c61
49a25402-d564-4ae7-a40a-dbd55e5c53ad	8b976f98-3921-49f2-acf5-006f41d69095	businessLogo		\N	2025-08-26 03:39:19.588	98c7aad9-1d62-454a-8a8a-9664e0286c61
7c9dcd73-617c-41f6-a7b3-2d33ff2f5afe	8b976f98-3921-49f2-acf5-006f41d69095	contactEmail	ajosephfinch@gmail.com	\N	2025-08-26 03:39:19.621	98c7aad9-1d62-454a-8a8a-9664e0286c61
723592e5-50b9-4b10-976c-4f593f3572f5	8b976f98-3921-49f2-acf5-006f41d69095	supportEmail	ajosephfinch@gmail.com	\N	2025-08-26 03:39:19.654	98c7aad9-1d62-454a-8a8a-9664e0286c61
373927dd-4cdb-4954-ad19-b542beca9d10	8b976f98-3921-49f2-acf5-006f41d69095	requireConsent	false	\N	2025-08-26 17:13:20.231	98c7aad9-1d62-454a-8a8a-9664e0286c61
cc869f01-e584-4b4b-a3c2-e52b237d0cc0	8b976f98-3921-49f2-acf5-006f41d69095	supportPhone		\N	2025-08-26 03:39:19.687	98c7aad9-1d62-454a-8a8a-9664e0286c61
016fd469-8c8a-48fa-a083-adb0ec7ef036	8b976f98-3921-49f2-acf5-006f41d69095	supportHours	Monday - Friday	\N	2025-08-26 03:39:19.723	98c7aad9-1d62-454a-8a8a-9664e0286c61
a93831ae-7f91-4848-9645-1feb792e13d4	8b976f98-3921-49f2-acf5-006f41d69095	supportLocation		\N	2025-08-26 03:39:19.757	98c7aad9-1d62-454a-8a8a-9664e0286c61
7bce19d4-9397-4247-94b9-9f19c556f9f6	8b976f98-3921-49f2-acf5-006f41d69095	timezone	America/New_York	\N	2025-08-26 03:39:19.79	98c7aad9-1d62-454a-8a8a-9664e0286c61
0d69332d-4d81-4f39-9481-9fa84e043ea2	8b976f98-3921-49f2-acf5-006f41d69095	emailNotifications	true	\N	2025-08-26 03:39:19.823	98c7aad9-1d62-454a-8a8a-9664e0286c61
c08d29bd-de4a-4d79-a654-3d55d0533678	8b976f98-3921-49f2-acf5-006f41d69095	smsNotifications	false	\N	2025-08-26 03:39:19.856	98c7aad9-1d62-454a-8a8a-9664e0286c61
2fff0a6f-1531-40bf-ae81-c903ee244fc9	8b976f98-3921-49f2-acf5-006f41d69095	sessionCapacityWarning	3	\N	2025-08-26 03:39:19.889	98c7aad9-1d62-454a-8a8a-9664e0286c61
ab53d403-151a-453f-b74e-b7b1c5e30890	8b976f98-3921-49f2-acf5-006f41d69095	paymentReminderMinutes	60	\N	2025-08-26 03:39:19.922	98c7aad9-1d62-454a-8a8a-9664e0286c61
e661cb4e-3b81-4462-b2e1-d646bb1f8676	8b976f98-3921-49f2-acf5-006f41d69095	paymentSubmissionTimeMinutes	30	\N	2025-08-26 03:39:19.955	98c7aad9-1d62-454a-8a8a-9664e0286c61
7c389eb3-a4c1-441e-acbe-8adf1773f8a0	8b976f98-3921-49f2-acf5-006f41d69095	refundCutoffMinutes	60	\N	2025-08-26 03:39:19.988	98c7aad9-1d62-454a-8a8a-9664e0286c61
869bda36-d1f4-41fe-8a7d-0ef4e4c1cde6	8b976f98-3921-49f2-acf5-006f41d69095	weekdayStart	monday	\N	2025-08-26 03:39:20.021	98c7aad9-1d62-454a-8a8a-9664e0286c61
e6226ea8-222b-4259-88c4-7c1c7f4445f3	8b976f98-3921-49f2-acf5-006f41d69095	weekdayEnd	sunday	\N	2025-08-26 03:39:20.053	98c7aad9-1d62-454a-8a8a-9664e0286c61
c0ae2fed-e60d-4339-8ba0-13fa3b865a34	8b976f98-3921-49f2-acf5-006f41d69095	fiscalYearType	calendar	\N	2025-08-26 03:39:20.088	98c7aad9-1d62-454a-8a8a-9664e0286c61
a695f247-9977-43f1-8f4c-0dd1b3958af6	8b976f98-3921-49f2-acf5-006f41d69095	fiscalYearStartMonth	1	\N	2025-08-26 03:39:20.121	98c7aad9-1d62-454a-8a8a-9664e0286c61
48254785-d225-4706-b967-22dd410b5eb7	8b976f98-3921-49f2-acf5-006f41d69095	availableLocations	[]	\N	2025-08-26 03:39:20.154	98c7aad9-1d62-454a-8a8a-9664e0286c61
0e884ca3-9985-438b-9fa3-83ca88674b15	491b8540-93f2-4942-af55-f32e6920654e	autoApproveRegistrations	true	\N	2025-08-27 02:44:33.168	94f24015-c007-418f-8092-ade6ce00478a
913b7383-6f24-4c01-882a-69c5516aa2ae	491b8540-93f2-4942-af55-f32e6920654e	businessName	PlayHQ	\N	2025-08-27 02:44:33.211	94f24015-c007-418f-8092-ade6ce00478a
f55c88a2-c066-4102-9649-1a757180e6ea	491b8540-93f2-4942-af55-f32e6920654e	businessLogo		\N	2025-08-27 02:44:33.245	94f24015-c007-418f-8092-ade6ce00478a
b033a56d-76a1-4397-970e-85de814d85f2	491b8540-93f2-4942-af55-f32e6920654e	contactEmail	sprout565656@gmail.com	\N	2025-08-27 02:44:33.279	94f24015-c007-418f-8092-ade6ce00478a
a3fbf0f0-16a7-4fca-bfc8-790f3dcdc934	491b8540-93f2-4942-af55-f32e6920654e	supportEmail	sprout565656@gmail.com	\N	2025-08-27 02:44:33.312	94f24015-c007-418f-8092-ade6ce00478a
ce624100-ece9-4ea9-be54-e765b7df9f70	491b8540-93f2-4942-af55-f32e6920654e	supportPhone	123-456-7890	\N	2025-08-27 02:44:33.345	94f24015-c007-418f-8092-ade6ce00478a
1dc8f1e7-7d94-4835-bbd6-c208844c551b	491b8540-93f2-4942-af55-f32e6920654e	supportHours	Monday - Friday	\N	2025-08-27 02:44:33.378	94f24015-c007-418f-8092-ade6ce00478a
5037f196-fafd-453e-bf14-a880edf1dff9	491b8540-93f2-4942-af55-f32e6920654e	supportLocation	Palm Beach County	\N	2025-08-27 02:44:33.411	94f24015-c007-418f-8092-ade6ce00478a
7735e68d-8ca8-47fc-b478-407ff9fbbd10	491b8540-93f2-4942-af55-f32e6920654e	timezone	America/New_York	\N	2025-08-27 02:44:33.443	94f24015-c007-418f-8092-ade6ce00478a
056dce4e-0de9-457f-9ca3-6888b3a71f36	491b8540-93f2-4942-af55-f32e6920654e	emailNotifications	true	\N	2025-08-27 02:44:33.476	94f24015-c007-418f-8092-ade6ce00478a
d8129d1b-ad5d-493a-a229-be75ab6e8bb1	491b8540-93f2-4942-af55-f32e6920654e	smsNotifications	false	\N	2025-08-27 02:44:33.508	94f24015-c007-418f-8092-ade6ce00478a
3f3426db-0a3e-413f-91a3-1e6d984980af	491b8540-93f2-4942-af55-f32e6920654e	sessionCapacityWarning	3	\N	2025-08-27 02:44:33.541	94f24015-c007-418f-8092-ade6ce00478a
635304cc-b282-4523-a2e8-0fc3b92168ae	491b8540-93f2-4942-af55-f32e6920654e	paymentReminderMinutes	60	\N	2025-08-27 02:44:33.574	94f24015-c007-418f-8092-ade6ce00478a
e89fcf1c-e294-47d6-a72e-97cbf0be7e51	491b8540-93f2-4942-af55-f32e6920654e	paymentSubmissionTimeMinutes	30	\N	2025-08-27 02:44:33.607	94f24015-c007-418f-8092-ade6ce00478a
2ac10648-3fe7-464a-a978-8d5078a05c18	491b8540-93f2-4942-af55-f32e6920654e	refundCutoffMinutes	60	\N	2025-08-27 02:44:33.639	94f24015-c007-418f-8092-ade6ce00478a
85f26ad1-ecac-4402-8ce4-8563ed126d09	491b8540-93f2-4942-af55-f32e6920654e	weekdayStart	monday	\N	2025-08-27 02:44:33.671	94f24015-c007-418f-8092-ade6ce00478a
502f918b-1cdc-431f-b9f7-d2e8a0ef2fb7	491b8540-93f2-4942-af55-f32e6920654e	weekdayEnd	sunday	\N	2025-08-27 02:44:33.703	94f24015-c007-418f-8092-ade6ce00478a
982eab59-1570-4ad8-a3df-5d3238422a8e	491b8540-93f2-4942-af55-f32e6920654e	fiscalYearType	calendar	\N	2025-08-27 02:44:33.736	94f24015-c007-418f-8092-ade6ce00478a
4d23254b-0d99-4819-9a00-755876dba7e7	491b8540-93f2-4942-af55-f32e6920654e	fiscalYearStartMonth	1	\N	2025-08-27 02:44:33.769	94f24015-c007-418f-8092-ade6ce00478a
17895342-8d04-40bc-97fd-9d2a7cc39bea	491b8540-93f2-4942-af55-f32e6920654e	availableLocations	[]	\N	2025-08-27 02:44:33.807	94f24015-c007-418f-8092-ade6ce00478a
\.


--
-- Data for Name: tenant_feature_overrides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_feature_overrides (id, tenant_id, feature_key, enabled, variant, limit_value, reason, expires_at, created_at, updated_at, created_by) FROM stdin;
\.


--
-- Data for Name: tenant_invite_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_invite_codes (id, tenant_id, code, name, description, is_active, usage_count, max_usage, created_by, created_at, updated_at) FROM stdin;
7faa0f1c-b482-4821-a1ce-c000c3fd5578	8b976f98-3921-49f2-acf5-006f41d69095	BEA9AD49	Main Registration Code	Primary code for parent and player registration	t	0	\N	\N	2025-08-26 16:25:00.505819	2025-08-26 16:40:20.139
63696ed8-fa6f-4cef-bbad-f7c9abebc664	bfc3beff-6455-44e0-bc54-de5424fe3ae2	VF2BDX8P	testing	\N	t	0	\N	\N	2025-08-27 01:45:36.519357	2025-08-27 01:45:46.508
5e4a8846-4fda-4a28-8b33-6a62be45bd89	e9f5e573-4170-4f29-bec4-3e2f33d1589e	7B18EF2B	Main Registration Code	Primary code for parent and player registration	t	0	\N	d9fd4e4d-4e63-4a2b-8a61-cb02fb5a16a2	2025-08-27 02:30:58.454152	2025-08-27 02:30:58.454152
f2e23015-223a-40b9-8bd5-d65ec80b5d5f	323239fc-076a-4507-85e6-97d28ab45281	28390E19	Main Registration Code	Primary code for parent and player registration	t	0	\N	5096273e-3b4f-48f4-a1b6-f40b8ca8c463	2025-08-27 02:31:20.955983	2025-08-27 02:31:20.955983
d56cae1a-444f-4863-8ef0-cd42d7671c22	491b8540-93f2-4942-af55-f32e6920654e	2F00B1C5	Main Registration Code	Primary code for parent and player registration	t	0	\N	94f24015-c007-418f-8092-ade6ce00478a	2025-08-27 02:33:13.457752	2025-08-27 02:33:13.457752
31ac3a5f-85a3-4481-92a8-9e9bae88fd18	e81b7d5c-ad82-480c-b24f-93dc6a8d3c07	17EEA758	Main Registration Code	Primary code for parent and player registration	t	0	\N	ca235680-87cf-4b11-bd5c-c0ba1065fd82	2025-08-27 02:42:32.919304	2025-08-27 02:42:32.919304
fe941f09-7827-4a22-8f75-905e367cc79c	052c851a-fe39-42a4-b0fc-676fe6202518	FD5A4627	Main Registration Code	Primary code for parent and player registration	t	0	\N	eb672165-c275-4ef1-b9a1-9f7e0fcc79a9	2025-08-27 02:43:00.941603	2025-08-27 02:43:00.941603
3b8bfa38-c6de-4234-9a75-dde6ea91dfd1	c7cd7cd4-177e-4ae5-9e5f-81954bc03b77	25A1BCF0	Main Registration Code	Primary code for parent and player registration	t	0	\N	865b9d24-de32-4b12-8d2b-022271a74b9a	2025-08-27 02:48:16.229181	2025-08-27 02:48:16.229181
795d527c-40ec-4002-96c6-365da83ac294	f4095def-88a4-4d17-8c1d-ebaac8d9529e	D6BC817B	Main Registration Code	Primary code for parent and player registration	t	0	\N	ccc1d1fc-bc5e-4963-91b1-85ced1b5f31e	2025-08-27 02:52:52.886715	2025-08-27 02:52:52.886715
24371c81-1f05-46cf-9649-cb56b4f5fb4f	8b976f98-3921-49f2-acf5-006f41d69095	PLAYHQAA	Parent Registration	Primary code for parent and player registration	t	0	\N	\N	2025-08-26 23:38:57.459198	2025-08-27 04:08:38.46
7f95bb0e-cd54-4791-9c65-e1dcf4618c0b	05ff7706-40d7-4248-8ea0-44f5c093bb81	DABC9E9A	Main Registration Code	Primary code for parent and player registration	t	0	\N	d576db26-32ba-4256-86f1-1478b2d8fbc7	2025-10-08 01:42:22.058854	2025-10-08 01:42:22.058854
a9a8676b-9d73-417b-8943-b8125596ad1b	4b7d3a08-e945-4cb9-974c-ac6d05405977	86E30A39	Main Registration Code	Primary code for parent and player registration	t	0	\N	ac0b38f9-b135-4242-8d90-2c8511357026	2025-12-04 04:01:09.891512	2025-12-04 04:01:09.891512
\.


--
-- Data for Name: tenant_invoice_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_invoice_lines (id, invoice_id, type, qty, unit_price_cents, amount_cents) FROM stdin;
\.


--
-- Data for Name: tenant_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_invoices (id, tenant_id, period_start, period_end, subtotal_cents, tax_cents, total_cents, status, due_at, paid_at, currency, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_memberships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_memberships (id, tenant_id, user_id, role, status, created_at) FROM stdin;
228cd060-3141-441e-b2df-e8f710640795	d98c4191-c7e0-474d-9dd7-672219d85e4d	admin-d98c4191-c7e0-474d-9dd7-672219d85e4d-0	admin	active	2025-08-26 12:17:09.059669+00
c81b667a-7edf-4f3d-939e-8672a112c472	d98c4191-c7e0-474d-9dd7-672219d85e4d	admin-d98c4191-c7e0-474d-9dd7-672219d85e4d-1	admin	active	2025-08-26 12:17:09.059669+00
1339dc59-8e0d-4a97-b1ac-1b4bfc933bbf	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-0	parent	active	2025-08-26 12:17:09.059669+00
2678b234-3d8d-445d-8999-8ce30b763362	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-1	parent	active	2025-08-26 12:17:09.059669+00
3731adc6-d923-4353-af55-28a68752aa5a	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-2	parent	active	2025-08-26 12:17:09.059669+00
9e9ea8e7-d2cc-41a0-94dc-9f95f3f0c013	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-3	parent	active	2025-08-26 12:17:09.059669+00
fd07d00e-726c-4f16-b04b-c8d46664c521	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-4	parent	active	2025-08-26 12:17:09.059669+00
6607a249-1925-40e4-bfb9-74ae77eb7ad0	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-5	parent	active	2025-08-26 12:17:09.059669+00
82aeb40f-7f64-4394-ad26-73a63fef42c4	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-6	parent	active	2025-08-26 12:17:09.059669+00
dfa796bb-7404-4c90-bc8e-ff0a75860a3f	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-7	parent	active	2025-08-26 12:17:09.059669+00
ba906654-02d7-4e0a-8b52-6f4126f1503d	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-8	parent	active	2025-08-26 12:17:09.059669+00
8467e71d-ef3e-428c-8f69-97dfbde30e83	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-9	parent	active	2025-08-26 12:17:09.059669+00
fc1665d0-ddc4-4185-b1a4-13acefb21e4f	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-10	parent	active	2025-08-26 12:17:09.059669+00
677cf1b1-346f-4251-9a27-08e5585043d3	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-11	parent	active	2025-08-26 12:17:09.059669+00
8a7397ba-9967-456d-aa6f-d7da073f0076	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-12	parent	active	2025-08-26 12:17:09.059669+00
5d6fd244-b352-4e8a-b750-26a02ee778b2	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-13	parent	active	2025-08-26 12:17:09.059669+00
5f1e6eda-0802-414f-8e41-1f2ea08c3f9a	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-14	parent	active	2025-08-26 12:17:09.059669+00
6c6393b8-ff2b-41e0-812c-6d9d5007ce22	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-15	parent	active	2025-08-26 12:17:09.059669+00
6339f02f-8e7a-4dde-b9b0-cfff977f7fd6	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-16	parent	active	2025-08-26 12:17:09.059669+00
1e050a5a-767d-4f31-8aa0-da95f4cbcf47	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-17	parent	active	2025-08-26 12:17:09.059669+00
ed0cd9f9-36bc-442e-bbfe-97ba9dbe31ba	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-18	parent	active	2025-08-26 12:17:09.059669+00
ff49c274-d95a-47be-a950-430780d398b2	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-19	parent	active	2025-08-26 12:17:09.059669+00
ea8c063c-9db4-4185-89cc-2baee62f646d	c2d95cef-9cd3-4411-9e12-c478747e8c06	admin-c2d95cef-9cd3-4411-9e12-c478747e8c06-0	admin	active	2025-08-26 12:17:09.059669+00
b7273f3b-d4cc-48dc-834b-64d99b522810	c2d95cef-9cd3-4411-9e12-c478747e8c06	admin-c2d95cef-9cd3-4411-9e12-c478747e8c06-1	admin	active	2025-08-26 12:17:09.059669+00
566ae92a-c449-4c38-9da2-f6dcedd9e0f2	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-0	parent	active	2025-08-26 12:17:09.059669+00
3289232a-1e0f-4f65-bfce-327a201e4f3e	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-1	parent	active	2025-08-26 12:17:09.059669+00
1195895b-1b74-4e07-9ae0-727a58357f43	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-2	parent	active	2025-08-26 12:17:09.059669+00
8365adcc-441e-4084-a9cb-41f76dd4719d	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-3	parent	active	2025-08-26 12:17:09.059669+00
0510f2c6-63e2-4b4c-a30f-e14becca7b88	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-4	parent	active	2025-08-26 12:17:09.059669+00
b8f9954b-a8fe-48a4-97b3-84a0359af026	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-5	parent	active	2025-08-26 12:17:09.059669+00
99016fea-9066-44d1-a6a5-d2acecd701f0	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-6	parent	active	2025-08-26 12:17:09.059669+00
6f725ddb-81ef-496d-a28b-803af932b8d2	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-7	parent	active	2025-08-26 12:17:09.059669+00
0657ff5a-05b8-421a-8127-8f896c75f62a	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-8	parent	active	2025-08-26 12:17:09.059669+00
ef06c3a1-28e4-4142-962d-0141036c62ce	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-9	parent	active	2025-08-26 12:17:09.059669+00
823ec17e-e07f-489b-a13b-405123e2323c	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-10	parent	active	2025-08-26 12:17:09.059669+00
9a151b3e-382a-4949-a83c-30910ecee579	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-11	parent	active	2025-08-26 12:17:09.059669+00
cdc063e1-ddb8-4d74-b099-fb1345035927	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-12	parent	active	2025-08-26 12:17:09.059669+00
fb63fed2-d65b-440a-9732-fe58da10ee59	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-13	parent	active	2025-08-26 12:17:09.059669+00
951409b4-5b73-4e34-b5b2-22d5bfc0ae65	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-14	parent	active	2025-08-26 12:17:09.059669+00
9e249726-9c23-4088-9d1c-ff9a52075d1c	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-15	parent	active	2025-08-26 12:17:09.059669+00
c8b87719-0837-4ff8-a073-878b27445160	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-16	parent	active	2025-08-26 12:17:09.059669+00
8c4fe233-9a0b-42fa-a486-e8e28b81a32e	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-17	parent	active	2025-08-26 12:17:09.059669+00
b84917b8-775b-4303-9544-51a6f569486c	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-18	parent	active	2025-08-26 12:17:09.059669+00
a356a9f4-ed7a-4279-99d7-9fa0b6eb0967	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-19	parent	active	2025-08-26 12:17:09.059669+00
7db20416-b35d-4b66-9f28-bd501a367c0f	3c94ae2b-a8cd-4885-b1f5-54832fc7819c	70724bfd-e373-494e-a91d-4af04c4a61d4	admin	active	2025-08-26 12:17:09.059669+00
25bd06b3-289a-4c17-8672-d927584db80d	06054761-1f4c-415a-83db-f13bab32c3f3	b1abb08f-df65-48b7-83f8-675c7bc71c7a	admin	active	2025-08-26 12:17:09.059669+00
39d82cc4-8cfd-4a9a-a066-ad357b11635d	028cf9cd-eb91-4762-972f-c19abb95ffd8	3c2d76d8-4767-4ef5-93a7-84b92ea4026d	admin	active	2025-08-26 12:17:09.059669+00
644baf63-1e8c-423b-8335-9b49acebb488	8b976f98-3921-49f2-acf5-006f41d69095	98c7aad9-1d62-454a-8a8a-9664e0286c61	admin	active	2025-08-26 12:17:09.059669+00
\.


--
-- Data for Name: tenant_plan_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_plan_assignments (id, tenant_id, plan_code, since, until) FROM stdin;
8dd32a17-4576-4104-8538-8c18fb71c47c	c6764097-ae3d-4668-a713-a461972e26f0	elite	2025-08-27 13:23:02.685	\N
57c78a91-99cf-4124-b0d2-e5b0a620514a	a8747632-df9d-4b92-8e1b-de507f0f78f6	core	2025-08-29 01:40:46.289057	\N
fd7a95b2-1ee1-421c-ad25-f95319e07e67	b814113a-caeb-45c3-9b97-971f5eaf50da	core	2025-08-29 01:40:46.289057	\N
1b7f126f-ac1f-4c3e-b128-20c1553cfc9d	df92c112-d581-479a-9a14-c2f640b11ae3	core	2025-08-29 01:40:46.289057	\N
26165e16-fdff-4f90-ab45-009c57bf752b	c2d95cef-9cd3-4411-9e12-c478747e8c06	growth	2025-08-29 01:40:46.289057	\N
49a8059c-d4b5-4003-825b-b057411f3c50	uuid-1	growth	2025-08-29 01:40:46.289057	\N
c64c4316-58b7-4c2a-a17a-73ebfa00ade7	uuid-2	core	2025-08-29 01:40:46.289057	\N
47bf7fd3-d2be-496c-b545-fff5d6f6d0e6	uuid-3	elite	2025-08-29 01:40:46.289057	\N
3c3c4146-076f-4be9-92fc-b4455ec51a5c	uuid-4	growth	2025-08-29 01:40:46.289057	\N
6247cf5e-6514-4c57-8021-9daee077a505	uuid-5	core	2025-08-29 01:40:46.289057	\N
c615cb4c-ddbe-49cb-85fd-8d2a694539f2	uuid-6	elite	2025-08-29 01:40:46.289057	\N
bcbdd313-0f18-4f47-b8a4-1e39904ca3ba	0955b963-05ba-4cce-ac72-4d1179e43a7e	core	2025-08-29 01:40:46.289057	\N
f9c846df-d417-4d35-8460-bbb0f073f42e	2650fbbf-0be0-4eec-9880-e3cef81cf027	core	2025-08-29 01:40:46.289057	\N
c81f76db-14d8-4626-a008-6b908475ba49	5da535b8-5419-400f-9072-5643f27f393f	core	2025-08-29 01:40:46.289057	\N
22611813-e939-4810-be83-104a7e2847b5	31a190dc-ef4f-4b19-8f2e-26eccc0da91a	core	2025-08-29 01:40:46.289057	\N
0161dc85-40e6-46ca-a515-dbdba8fc16a4	548d1e28-3e74-494d-a0b6-10f203398f20	core	2025-08-29 01:40:46.289057	\N
eb42fd9b-886f-4e62-ba63-9ae1eead0e57	3c94ae2b-a8cd-4885-b1f5-54832fc7819c	core	2025-08-29 01:40:46.289057	\N
a4de1825-85b5-460e-aee3-20a1de1c7668	06054761-1f4c-415a-83db-f13bab32c3f3	core	2025-08-29 01:40:46.289057	\N
6906b2da-5600-400d-9c0b-929665368029	a3c19f14-b8ab-4796-85e5-50a4aa1d76c3	core	2025-08-29 01:40:46.289057	\N
95c6ef9a-ea4f-4142-b704-dd7560ba3853	06f690fd-4bab-4f39-afc8-b86fe8eaf6a2	core	2025-08-29 01:40:46.289057	\N
9088ac16-8207-4244-9570-7eaa0286a248	028cf9cd-eb91-4762-972f-c19abb95ffd8	core	2025-08-29 01:40:46.289057	\N
fcf539e8-921b-4c3c-abcd-0f0fb1a57e81	936ca080-f9fb-4097-a46a-85ae21167b26	core	2025-08-29 01:40:46.289057	\N
3af95df0-f8db-4242-bee3-07bcadeb1084	773a61e1-a62a-42c5-b87c-d09f8a37f1a9	core	2025-08-29 01:40:46.289057	\N
4e4cf739-9a9c-4144-8e85-d740c65df241	9353302a-80ca-4f0e-b1a7-0b22c3a1773d	core	2025-08-29 01:40:46.289057	\N
ce46402b-1bc0-4d08-bd38-a5a64a5d9c1f	d8c6bd45-0698-4f9a-ae7e-c51a6f0c5c54	core	2025-08-29 01:40:46.289057	\N
b246b973-a5e5-44c1-bdd6-bb902a833846	c33747b7-1de7-4a0a-8a6c-2a4768ddccca	core	2025-08-29 01:40:46.289057	\N
108d0f3e-4979-4ad3-893a-cf8f3247f4d1	e9f5e573-4170-4f29-bec4-3e2f33d1589e	core	2025-08-29 01:40:46.289057	\N
30588b29-9f66-4058-b744-115406067a50	323239fc-076a-4507-85e6-97d28ab45281	core	2025-08-29 01:40:46.289057	\N
9ba0770d-d82c-403d-b4dc-78e008300c23	c6764097-ae3d-4668-a713-a461972e26f0	core	2025-08-29 01:40:46.289057	\N
46dd3b1e-de7a-4ce3-97f0-6a7e82b20aad	bfc3beff-6455-44e0-bc54-de5424fe3ae2	growth	2025-08-29 01:40:46.289057	\N
07812273-b39b-4c16-bd09-57fb0dc496a9	491b8540-93f2-4942-af55-f32e6920654e	core	2025-08-29 01:40:46.289057	\N
92f41805-1486-4505-87f3-36f0a4c7339a	e81b7d5c-ad82-480c-b24f-93dc6a8d3c07	core	2025-08-29 01:40:46.289057	\N
3bcaeb5b-bf5e-4dce-a090-fcb4034c529d	052c851a-fe39-42a4-b0fc-676fe6202518	core	2025-08-29 01:40:46.289057	\N
6c694c7a-7997-48e3-a409-be4cd024afdd	c7cd7cd4-177e-4ae5-9e5f-81954bc03b77	core	2025-08-29 01:40:46.289057	\N
07e56e73-94a4-4166-b88b-a17fe50da036	f4095def-88a4-4d17-8c1d-ebaac8d9529e	core	2025-08-29 01:40:46.289057	\N
db2826b8-9a83-4925-8395-e2d61c210d2b	8b976f98-3921-49f2-acf5-006f41d69095	core	2025-08-29 01:40:46.289057	\N
5e99269d-0c37-45c9-8a34-c30a33b554e4	f858260d-1f30-4c8a-a89d-fc0be31cc25e	free	2025-12-04 20:22:41.82	\N
43726c11-c2ec-43ef-bd0e-6ea0f2d883ab	d98c4191-c7e0-474d-9dd7-672219d85e4d	elite	2025-08-29 01:40:46.289057	2025-08-29 21:58:46.802
d28007e3-a3d7-4fe5-a19b-58b374f4f01e	d98c4191-c7e0-474d-9dd7-672219d85e4d	elite	2025-08-29 01:56:28.129	2025-08-29 21:58:46.802
05efb51a-d503-44bb-980f-3bb3deaa6bc4	d98c4191-c7e0-474d-9dd7-672219d85e4d	elite	2025-08-29 21:58:46.843	\N
22b43dad-87f3-489c-bf45-dca0fd696ad4	6602d4c2-19e6-49be-b596-40fc58430f73	free	2025-08-29 22:46:32.503574	2025-08-29 22:48:08.947
da76a477-b28f-42bd-9176-c22bfc554383	6602d4c2-19e6-49be-b596-40fc58430f73	elite	2025-08-29 22:48:08.98	\N
952ab0ad-4211-4ff4-9f86-1900a390f874	b1a54a1c-b8ec-43c8-b2c6-a86d359e5e16	core	2025-08-29 22:50:52.315838	2025-08-29 22:50:56.749
71996886-6d2b-400d-9c81-0c701cb9b89e	b1a54a1c-b8ec-43c8-b2c6-a86d359e5e16	growth	2025-08-29 22:50:56.782	\N
ae955a72-ded5-4288-a8c9-04812b16537e	05ff7706-40d7-4248-8ea0-44f5c093bb81	free	2025-10-08 01:42:22.123	2025-10-08 01:54:27.615329
ba5a0f2c-3d98-4091-867c-9a9d686a804d	05ff7706-40d7-4248-8ea0-44f5c093bb81	growth	2025-10-08 01:54:28.692982	\N
5f2c274e-5bf1-4fb4-87ea-c9a565bdacb3	4b7d3a08-e945-4cb9-974c-ac6d05405977	free	2025-12-04 04:01:09.952	\N
5179e090-f3d7-44ce-b2c8-6e28f014f240	b91569ce-22ba-4645-b1a2-9db34bd7c4ab	free	2025-12-04 05:40:55.864	\N
1eee1546-ac2c-47b7-91c2-b1cc63090d8a	fe2f5f15-ab93-43c8-a483-3d3d7cabf754	free	2025-12-04 13:30:21.082	\N
\.


--
-- Data for Name: tenant_plan_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_plan_history (id, tenant_id, from_plan, to_plan, change_type, reason, changed_by, automated_trigger, mrr, annual_value, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_policies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_policies (id, tenant_id, region, audience_mode, parent_required_below, teen_self_access_at, adult_age, allow_teen_payments, allow_split_payments, require_saved_method_for_adult, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_subscription_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_subscription_events (id, tenant_id, event_type, processor, subscription_id, plan_id, plan_level, previous_plan_level, amount_cents, currency, status, failure_reason, failure_code, processor_event_id, triggered_by, metadata, created_at) FROM stdin;
91d06328-5309-4c22-8da5-cd1d3ec9640d	fe2f5f15-ab93-43c8-a483-3d3d7cabf754	subscription_created	braintree	cbbc8f	plan_core_123	core	free	9900	USD	success	\N	\N	\N	user	{}	2025-12-04 18:00:25.568575
\.


--
-- Data for Name: tenant_usage_daily; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_usage_daily (id, tenant_id, date, counters, created_at) FROM stdin;
ea881752-7f39-4216-9ba0-b22420f393ab	c2d95cef-9cd3-4411-9e12-c478747e8c06	2025-08-23 00:00:00	{"sms": 1, "emails": 1, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-24 03:12:00.034447
509e5232-9df6-483e-9c96-1c509ce949f5	d98c4191-c7e0-474d-9dd7-672219d85e4d	2025-08-23 00:00:00	{"sms": 1, "emails": 4, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-24 03:12:00.034447
a3be5731-b062-4209-a482-1770245483a8	c2d95cef-9cd3-4411-9e12-c478747e8c06	2025-08-24 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-25 03:12:02.767458
440bdad6-64cb-4621-b3eb-3a35e7f4e77c	d98c4191-c7e0-474d-9dd7-672219d85e4d	2025-08-24 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-25 03:12:02.767458
8cfe1c81-910f-4fa5-90ad-0fc6e247be7d	uuid-1	2025-08-24 00:00:00	{"sms": 0, "emails": 0, "players": 25, "sessions": 5, "api_calls": 0}	2025-08-25 03:12:02.767458
921dc8b9-0380-466f-94a9-3509f5498237	uuid-2	2025-08-24 00:00:00	{"sms": 0, "emails": 0, "players": 18, "sessions": 3, "api_calls": 0}	2025-08-25 03:12:02.767458
911a89bd-7767-4f3d-812b-d6ba5712b193	uuid-3	2025-08-24 00:00:00	{"sms": 0, "emails": 0, "players": 35, "sessions": 6, "api_calls": 0}	2025-08-25 03:12:02.767458
7149cd5d-8d71-444a-b852-ac7cf4be1d9c	uuid-4	2025-08-24 00:00:00	{"sms": 0, "emails": 0, "players": 22, "sessions": 4, "api_calls": 0}	2025-08-25 03:12:02.767458
a4154570-5cc6-4951-b815-dc888cd40a06	uuid-5	2025-08-24 00:00:00	{"sms": 0, "emails": 0, "players": 15, "sessions": 2, "api_calls": 0}	2025-08-25 03:12:02.767458
9f465f38-6327-4603-bc70-ca024e342b70	uuid-6	2025-08-24 00:00:00	{"sms": 0, "emails": 0, "players": 28, "sessions": 5, "api_calls": 0}	2025-08-25 03:12:02.767458
2ccbb5eb-eeb0-496c-8bcf-bde55e7a80ee	c2d95cef-9cd3-4411-9e12-c478747e8c06	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
21ac28b9-3902-4c6e-9488-88c159383a65	a8747632-df9d-4b92-8e1b-de507f0f78f6	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
b4481659-cc7f-49e2-a0c7-a66adb4a8823	b814113a-caeb-45c3-9b97-971f5eaf50da	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
28e7d9af-96c1-48c2-be80-c7fe4ba5c7ee	df92c112-d581-479a-9a14-c2f640b11ae3	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
069048e9-f917-4896-85c2-6304d8ce9f7f	d98c4191-c7e0-474d-9dd7-672219d85e4d	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
82c5dbb3-e79f-48ed-aa6e-8ea5bc126d97	uuid-1	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
5179f9db-b056-4700-9185-7a5c8d63bf85	uuid-2	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
0c703fc1-bf23-4011-8de6-35a0499dddcf	uuid-3	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
ff4c340c-be7e-4bf0-a23d-64daa706c89a	uuid-4	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
0406b91f-99fa-4281-921b-eb05d2b0a2ac	uuid-5	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
454a59ac-1ed6-40c4-a802-6dc4d875aaa3	uuid-6	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
5eaf4dea-b60a-4b21-b1d5-4c579a55a1b4	0955b963-05ba-4cce-ac72-4d1179e43a7e	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
f5970ee8-d740-4dbb-bc9f-6a33d7e8d6dc	2650fbbf-0be0-4eec-9880-e3cef81cf027	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
a0649ad7-9433-46b4-b0d3-a3e537eb9693	5da535b8-5419-400f-9072-5643f27f393f	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
f63d5dff-f145-4c9e-8a3d-9dea982dca21	31a190dc-ef4f-4b19-8f2e-26eccc0da91a	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
44fde901-fe6f-4d28-a537-17b51935d7c8	548d1e28-3e74-494d-a0b6-10f203398f20	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
63338fe2-b827-4bef-89cc-3ce1e1fbe1e1	3c94ae2b-a8cd-4885-b1f5-54832fc7819c	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
2e26a520-0c36-4c7b-aa06-c24727430e35	06054761-1f4c-415a-83db-f13bab32c3f3	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
e023aa3c-14f9-4b16-922d-0857b27c4490	a3c19f14-b8ab-4796-85e5-50a4aa1d76c3	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
1ab2e309-0ef4-46d0-bf11-73377db8cbde	06f690fd-4bab-4f39-afc8-b86fe8eaf6a2	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
d560ed82-4067-4b57-b449-9dffc5acf137	028cf9cd-eb91-4762-972f-c19abb95ffd8	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
83d11130-4e06-4e14-b2c2-4a283bf8be6e	936ca080-f9fb-4097-a46a-85ae21167b26	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
e60f5e4e-102d-4148-b28a-ffdd52db9103	773a61e1-a62a-42c5-b87c-d09f8a37f1a9	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
e5026ce5-ff17-4874-8ff4-3d46adef97d8	9353302a-80ca-4f0e-b1a7-0b22c3a1773d	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
7ac63411-1c90-4104-9823-36aba907af06	8b976f98-3921-49f2-acf5-006f41d69095	2025-08-25 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-26 03:12:00.033245
9be88c68-ca05-4efe-b827-61bd0fc3b2ad	c2d95cef-9cd3-4411-9e12-c478747e8c06	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
0226c6e7-1d29-4e0d-9950-dc7152b82cbe	a8747632-df9d-4b92-8e1b-de507f0f78f6	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
533eb265-8be8-4995-af7c-16bd217e054a	b814113a-caeb-45c3-9b97-971f5eaf50da	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
8e70697a-54b4-43e0-b6b4-3d6817ddd52f	df92c112-d581-479a-9a14-c2f640b11ae3	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
72f13afa-bef7-4320-bb55-108698f4b320	d98c4191-c7e0-474d-9dd7-672219d85e4d	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
5b2138fc-4cfb-4504-92a7-f3c3504bb62b	uuid-1	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
a08c647c-5bfa-4378-ab07-9de0e574fc11	uuid-2	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
724aa941-d9b0-4dd6-8bd1-2b11998124d9	uuid-3	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
8304cea0-1f4d-4e1d-aa0a-4dcf44c5d71a	uuid-4	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
fbdeb5f7-78eb-4283-9e9c-8f16ccec60de	uuid-5	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
8914f6f8-b630-450f-9773-d94d58378bf9	uuid-6	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
5967df9d-82d6-421b-9a4d-4036000793cf	0955b963-05ba-4cce-ac72-4d1179e43a7e	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
b21d10f4-2cbe-46a3-b1b3-d04abc6ad595	2650fbbf-0be0-4eec-9880-e3cef81cf027	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
838fbed6-b9e1-4d98-bcf0-4358a3414bdf	5da535b8-5419-400f-9072-5643f27f393f	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
f0023787-d10a-4710-bcf7-31deec81d2b6	31a190dc-ef4f-4b19-8f2e-26eccc0da91a	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
51838693-586d-4c32-b28b-839542ee9543	548d1e28-3e74-494d-a0b6-10f203398f20	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
b5ea309a-8f35-4446-ad55-645cacec0e2d	3c94ae2b-a8cd-4885-b1f5-54832fc7819c	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
15138777-b9e4-46ab-99d9-5dbcb9ed49de	06054761-1f4c-415a-83db-f13bab32c3f3	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
32afb33c-ac2c-4e38-a66c-c3a3d74ace72	a3c19f14-b8ab-4796-85e5-50a4aa1d76c3	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
06ad97a4-cff1-49b5-b266-a6b7e39ebb6a	06f690fd-4bab-4f39-afc8-b86fe8eaf6a2	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
4ff87a89-7361-4b69-9164-17168dff0795	028cf9cd-eb91-4762-972f-c19abb95ffd8	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
9d9d5236-ca24-42e4-9062-0d30b1394c9f	936ca080-f9fb-4097-a46a-85ae21167b26	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
fc14ff4b-6318-4d32-8e4e-59cf58a7c470	773a61e1-a62a-42c5-b87c-d09f8a37f1a9	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
7f0a534b-75d7-47f2-8860-bb894ef9ce39	9353302a-80ca-4f0e-b1a7-0b22c3a1773d	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
b1ae5be5-c07e-4b9f-89ee-6934e07bf88d	8b976f98-3921-49f2-acf5-006f41d69095	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
b69508a2-b3e1-444b-8d23-ccd0a6e9a68b	d8c6bd45-0698-4f9a-ae7e-c51a6f0c5c54	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
ede57216-e22e-4f6b-8e1f-d862c9012c38	bfc3beff-6455-44e0-bc54-de5424fe3ae2	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
a20a4157-6f89-4654-80bc-466558c05251	c33747b7-1de7-4a0a-8a6c-2a4768ddccca	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
3fe4f97c-e60d-48cd-8dfc-543738881e65	e9f5e573-4170-4f29-bec4-3e2f33d1589e	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
29f25e34-c078-42d1-967b-98ec1b66da40	323239fc-076a-4507-85e6-97d28ab45281	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
ab617e82-58c6-4cf6-a414-c517e929d805	c6764097-ae3d-4668-a713-a461972e26f0	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
17de710e-ac6d-48b5-85d0-ed94f8d9e96e	491b8540-93f2-4942-af55-f32e6920654e	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
047ac26e-30d1-4b3d-a983-32a9e57de673	e81b7d5c-ad82-480c-b24f-93dc6a8d3c07	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
94338ca6-68f2-4c92-8a49-1031861aa71c	052c851a-fe39-42a4-b0fc-676fe6202518	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
8fd570f6-8819-43b3-9090-c8e2cf54613a	c7cd7cd4-177e-4ae5-9e5f-81954bc03b77	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
5b5d3ceb-5d1d-45f8-8cce-013de28ad3dc	f4095def-88a4-4d17-8c1d-ebaac8d9529e	2025-08-26 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-27 03:12:02.64753
13a5126f-d248-46e0-a2ab-0933c4bd9af8	a8747632-df9d-4b92-8e1b-de507f0f78f6	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
04cf8d58-f71b-4571-b7bd-790fb8e120d6	b814113a-caeb-45c3-9b97-971f5eaf50da	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
53e2f69b-c4de-4190-a2e3-56e7169c23a1	df92c112-d581-479a-9a14-c2f640b11ae3	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
89c479f9-c17e-4521-82c0-6d3ebcb90f6e	d98c4191-c7e0-474d-9dd7-672219d85e4d	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
ea89bd6c-ea7c-465d-9db2-f65599688cdc	c2d95cef-9cd3-4411-9e12-c478747e8c06	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
8a79e353-cbb1-4676-9a9b-2a45f568292e	uuid-1	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
77ef898a-fa9f-465c-a82b-7bc1832033cd	uuid-2	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
dcbffc6e-2436-4946-9bc7-77752b4f122c	uuid-3	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
3cff7f3d-2bc1-452b-8394-abeebecf7bbc	uuid-4	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
a3f17805-9086-492d-8826-96e64cb7b9c6	uuid-5	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
b5479aa6-06ec-440c-b69d-b3d3c5516dec	uuid-6	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
45d623e0-a218-4c92-97c8-b251cc2ed613	0955b963-05ba-4cce-ac72-4d1179e43a7e	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
fc01dfbc-10af-4d07-9ffc-ffcd3011d9cd	2650fbbf-0be0-4eec-9880-e3cef81cf027	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
fd1bd3ef-f574-48a8-ba9d-f2cdf32b2f34	5da535b8-5419-400f-9072-5643f27f393f	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
d334b569-2257-4852-81f8-e5897fe4e9c2	31a190dc-ef4f-4b19-8f2e-26eccc0da91a	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
f790bd9f-3397-4f62-b393-2ee89c038698	548d1e28-3e74-494d-a0b6-10f203398f20	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
a871497f-b0cd-4be9-a844-63323a79fd12	3c94ae2b-a8cd-4885-b1f5-54832fc7819c	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
a492db0c-0963-4707-8070-3be651044d2e	06054761-1f4c-415a-83db-f13bab32c3f3	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
99651f73-5467-48d2-8bfa-16544a04f11d	a3c19f14-b8ab-4796-85e5-50a4aa1d76c3	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
02795006-b606-46a8-8cf9-fe8a73427557	06f690fd-4bab-4f39-afc8-b86fe8eaf6a2	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
aa24c5fa-d8f3-4e9f-a3cf-be98bb9dd1ed	028cf9cd-eb91-4762-972f-c19abb95ffd8	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
0bed823f-eb4c-4da7-86e0-827b721d2a3d	936ca080-f9fb-4097-a46a-85ae21167b26	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
bc6e96e4-4039-4ad2-99b1-7aaed99963d1	773a61e1-a62a-42c5-b87c-d09f8a37f1a9	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
6581f297-6aad-421d-abee-5012d7c43286	9353302a-80ca-4f0e-b1a7-0b22c3a1773d	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
0b921ff2-9cfa-4eb3-a585-648aad196210	d8c6bd45-0698-4f9a-ae7e-c51a6f0c5c54	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
1fc7b076-0e89-4ec9-a506-fc0eafbfc2ea	c33747b7-1de7-4a0a-8a6c-2a4768ddccca	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
5c5bf201-513c-404e-bad7-01283cd1c7db	e9f5e573-4170-4f29-bec4-3e2f33d1589e	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
75b5f1a0-ad6f-434a-b92b-ce652f2b36f2	323239fc-076a-4507-85e6-97d28ab45281	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
d0c97c44-c98b-4e27-9cb6-1fdb53c600cc	c6764097-ae3d-4668-a713-a461972e26f0	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
c106c9a2-3bca-4101-81af-6ebbdafa840f	bfc3beff-6455-44e0-bc54-de5424fe3ae2	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
f81567af-087c-402e-a1eb-5feeefa1f414	491b8540-93f2-4942-af55-f32e6920654e	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
478d94c2-e100-4ab9-9452-6f45f492217c	e81b7d5c-ad82-480c-b24f-93dc6a8d3c07	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
2e0f62c3-3cf7-4bbc-a821-0f78bdb9d6dd	052c851a-fe39-42a4-b0fc-676fe6202518	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
a15d3e50-6284-4e00-8995-dfe33b8659a8	c7cd7cd4-177e-4ae5-9e5f-81954bc03b77	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
fd7db5a5-1988-4a73-9675-244edc382806	f4095def-88a4-4d17-8c1d-ebaac8d9529e	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
3404dd8f-35b4-4fff-9c64-12453655ee50	8b976f98-3921-49f2-acf5-006f41d69095	2025-08-27 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-08-28 03:12:00.221138
36f47134-d3b3-4853-bed1-e28c5284f027	a8747632-df9d-4b92-8e1b-de507f0f78f6	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
f0a8fd79-6860-46eb-abad-d3837d1df718	b814113a-caeb-45c3-9b97-971f5eaf50da	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
635618ac-d9b1-4a77-b6a3-ca231158a29d	df92c112-d581-479a-9a14-c2f640b11ae3	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
634feaa1-bfa5-4b8c-b7c2-8f55072df6c3	c2d95cef-9cd3-4411-9e12-c478747e8c06	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
afb0d0ca-87fb-419e-a4b3-965d815f91a4	d98c4191-c7e0-474d-9dd7-672219d85e4d	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
598b74a7-d101-49ff-a777-af3f6801189a	uuid-1	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
29d09b8f-ffd2-418c-85f6-7f67c5100b51	uuid-2	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
633ad92e-356c-4d25-a935-66c35bc1afa0	uuid-3	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
ea55cf14-2f05-46d6-846e-8980aaa79247	uuid-4	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
d2635b35-ecdb-4116-8ec0-d9869cc91ba4	uuid-5	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
8a840693-708c-4b9a-bd91-5814d8a7de66	uuid-6	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
8025c3ec-155e-49b9-9ab2-6501a613d049	0955b963-05ba-4cce-ac72-4d1179e43a7e	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
dc5c1f9e-1d56-44bb-a2e9-73159dbd53e8	2650fbbf-0be0-4eec-9880-e3cef81cf027	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
d2b4df07-5f9a-4c91-8da9-bf75f94a4387	5da535b8-5419-400f-9072-5643f27f393f	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
b12b525d-34e2-4ed6-9d3e-e5591074cb75	31a190dc-ef4f-4b19-8f2e-26eccc0da91a	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
0e5a6d32-82b3-4b5c-853a-56242983beb7	548d1e28-3e74-494d-a0b6-10f203398f20	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
385fa7d4-ee28-4a92-b085-7c47ed9654aa	3c94ae2b-a8cd-4885-b1f5-54832fc7819c	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
1df6b5e4-0bff-4724-a3e7-8dd68f8f9355	06054761-1f4c-415a-83db-f13bab32c3f3	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
2c8a10ef-c15b-451a-b292-ac4169c531f3	a3c19f14-b8ab-4796-85e5-50a4aa1d76c3	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
0e8c3acc-8aff-44e1-a439-0b07a7039a20	06f690fd-4bab-4f39-afc8-b86fe8eaf6a2	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
bb137e14-66f3-4f5d-a40e-a5494a912c24	028cf9cd-eb91-4762-972f-c19abb95ffd8	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
6f4bc945-8ee8-467c-8cae-b4f953a7cbbd	936ca080-f9fb-4097-a46a-85ae21167b26	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
4a2148ba-0364-4aca-9a67-6150dab54bf7	773a61e1-a62a-42c5-b87c-d09f8a37f1a9	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
1fbd446e-8a18-4619-8040-6a3e88fc701c	9353302a-80ca-4f0e-b1a7-0b22c3a1773d	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
cf9f5e6e-8a2e-464e-8491-c2cea06d3f86	d8c6bd45-0698-4f9a-ae7e-c51a6f0c5c54	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
16e0a6b7-9bd5-4858-b7c8-106d1578a0cf	c33747b7-1de7-4a0a-8a6c-2a4768ddccca	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
282c24a4-e13d-4185-aa8b-f7ad0f6fd5d4	e9f5e573-4170-4f29-bec4-3e2f33d1589e	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
bdd1cce1-a250-47f6-988c-9734e83a4176	323239fc-076a-4507-85e6-97d28ab45281	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
0d4602de-406c-4cc8-8cfc-d82e396f5ca2	c6764097-ae3d-4668-a713-a461972e26f0	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
a3b11e4e-f854-4ae4-a42d-a0d89d95c180	bfc3beff-6455-44e0-bc54-de5424fe3ae2	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
4b64ab70-c6d3-4e75-86bb-3a87800660af	491b8540-93f2-4942-af55-f32e6920654e	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
930ec1af-0312-4e5e-96ec-34a6835a64e9	e81b7d5c-ad82-480c-b24f-93dc6a8d3c07	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
210569b0-d50b-4c61-b9d5-8be407228732	052c851a-fe39-42a4-b0fc-676fe6202518	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
d4b0496b-5612-4f08-9e38-29fccff52878	c7cd7cd4-177e-4ae5-9e5f-81954bc03b77	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
33ab2e99-9d5f-459d-b673-72fb20baacea	f4095def-88a4-4d17-8c1d-ebaac8d9529e	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
fc1d2732-dbca-4851-aff6-2bb93a4f5a75	8b976f98-3921-49f2-acf5-006f41d69095	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
0bde63d3-7920-4bf4-ab04-cc94af4b3f40	6602d4c2-19e6-49be-b596-40fc58430f73	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
4f2d6eba-98c2-44a2-8769-616cccea119a	b1a54a1c-b8ec-43c8-b2c6-a86d359e5e16	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
cc25031f-cc62-49f7-ab2d-434eb4fb334f	ca71aea2-7b29-43dd-90a0-e166f20519a8	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
7fb7f8f7-96b5-4cca-82cd-7e4e58301564	05ff7706-40d7-4248-8ea0-44f5c093bb81	2025-10-07 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-08 03:12:00.031011
29ab5e48-b646-47d6-97a8-cdcbef2fa2d3	a8747632-df9d-4b92-8e1b-de507f0f78f6	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
21e69362-5aab-4064-b372-af1ba31122f3	b814113a-caeb-45c3-9b97-971f5eaf50da	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
4b731465-19a2-473a-9905-1f3a53069bbd	df92c112-d581-479a-9a14-c2f640b11ae3	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
6df8b01a-9513-4c82-95c9-45c9267fce98	c2d95cef-9cd3-4411-9e12-c478747e8c06	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
1c560c6a-37d5-4ee3-bb5f-4fc28e50a922	d98c4191-c7e0-474d-9dd7-672219d85e4d	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
31561a02-091a-4e03-90eb-21821a424b86	uuid-1	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
2491c132-4621-4261-9219-4ce0bbe5266b	uuid-2	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
e6d68801-a153-4ae5-8bef-a0fa000f112b	uuid-3	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
58b7a47a-1b86-494b-84bc-7661768139fb	uuid-4	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
4af7159d-be40-4fa3-83ac-8c1fa3811e5a	uuid-5	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
58af75bc-7498-4287-868d-70c23f280971	uuid-6	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
3c3fdc22-dd4d-4719-8e3c-e7acad256b02	0955b963-05ba-4cce-ac72-4d1179e43a7e	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
484d9f7a-b7c2-43dc-8682-9d21287b06ae	2650fbbf-0be0-4eec-9880-e3cef81cf027	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
0290aa78-17b5-483e-adb2-25b6d466e797	5da535b8-5419-400f-9072-5643f27f393f	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
feecf1e3-065b-419a-a774-1d8ee6688e62	31a190dc-ef4f-4b19-8f2e-26eccc0da91a	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
e2f75059-111c-4537-886a-e5a66623f02f	548d1e28-3e74-494d-a0b6-10f203398f20	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
b369be3b-6b6f-45c3-95f2-367d4491f3fe	3c94ae2b-a8cd-4885-b1f5-54832fc7819c	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
d994ce64-e77b-4fbc-aea3-fd694f93c10b	06054761-1f4c-415a-83db-f13bab32c3f3	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
3f5d2d46-d477-4dea-a632-dc6ccb62ce6f	a3c19f14-b8ab-4796-85e5-50a4aa1d76c3	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
2a965477-6e73-4760-a8ef-b87c743b7561	06f690fd-4bab-4f39-afc8-b86fe8eaf6a2	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
6c7f0df2-7905-4a23-b8d5-7f1276f42aba	028cf9cd-eb91-4762-972f-c19abb95ffd8	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
376c4ac9-05ce-4d0f-9b81-0f699f0a2fca	936ca080-f9fb-4097-a46a-85ae21167b26	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
5d2a7d9d-4d0f-438d-a180-22a9b82f8f4d	773a61e1-a62a-42c5-b87c-d09f8a37f1a9	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
62304e56-d1a4-4e58-943d-ff5aa4947155	9353302a-80ca-4f0e-b1a7-0b22c3a1773d	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
b98900cd-9d48-4d3b-a563-3064aebe2c8d	d8c6bd45-0698-4f9a-ae7e-c51a6f0c5c54	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
7280afcb-b9b4-46da-aae5-3e0a7e243c44	c33747b7-1de7-4a0a-8a6c-2a4768ddccca	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
5f02b874-4341-4497-b942-91bb356db92a	e9f5e573-4170-4f29-bec4-3e2f33d1589e	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
139b23aa-098c-4bf0-8fe1-90a4a142bcfb	323239fc-076a-4507-85e6-97d28ab45281	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
5c96ed30-6e7f-47ed-8e92-58c57ee6c69d	c6764097-ae3d-4668-a713-a461972e26f0	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
8b9c95a5-ae03-4b85-a636-cc2f4ea884fa	bfc3beff-6455-44e0-bc54-de5424fe3ae2	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
e0d83797-0765-4291-8c9a-3e7eac88e075	491b8540-93f2-4942-af55-f32e6920654e	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
11f9d82b-1432-4f71-9832-31dcd38b331b	e81b7d5c-ad82-480c-b24f-93dc6a8d3c07	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
539983cd-adaf-4ed7-8e5d-405372970d34	052c851a-fe39-42a4-b0fc-676fe6202518	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
e59ca666-91d0-433b-aeac-888d5cfb5ba0	c7cd7cd4-177e-4ae5-9e5f-81954bc03b77	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
a972977a-dff8-48be-944f-3e60fb7b9f72	f4095def-88a4-4d17-8c1d-ebaac8d9529e	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
f80321c4-7186-420e-88dd-b06b669d5a0f	8b976f98-3921-49f2-acf5-006f41d69095	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
2b89f4e6-0dfa-43b6-a8c7-e681a194f179	6602d4c2-19e6-49be-b596-40fc58430f73	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
ebf68544-5d14-4f43-a64c-382d3c275b53	b1a54a1c-b8ec-43c8-b2c6-a86d359e5e16	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
db553681-9793-42ff-9a87-4b1830d4f779	ca71aea2-7b29-43dd-90a0-e166f20519a8	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
22dcad2a-95cb-438e-92e6-6b5508842919	05ff7706-40d7-4248-8ea0-44f5c093bb81	2025-10-09 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-10-10 03:12:02.49521
3f90bd5a-451a-4d99-b614-8b6b24b28084	a8747632-df9d-4b92-8e1b-de507f0f78f6	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
79e11012-9f0b-414f-9fd4-904016f4bcb4	b814113a-caeb-45c3-9b97-971f5eaf50da	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
1233e042-bf02-42b3-9186-2f46632a8f8f	df92c112-d581-479a-9a14-c2f640b11ae3	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
32f747b1-d85c-4783-968e-7a706fbd2b6f	c2d95cef-9cd3-4411-9e12-c478747e8c06	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
852158aa-5264-41e6-ab88-9541c7057f33	d98c4191-c7e0-474d-9dd7-672219d85e4d	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
6fec9688-6689-4db6-b0ce-c687f4023255	uuid-1	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
e7e382f4-54dc-4490-a612-0b67e6c1dac9	uuid-2	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
2355fc03-f8fb-41a5-9a55-75ac2a4281f4	uuid-3	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
f654d74f-17fb-4a49-bed2-d0c098949230	uuid-4	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
7e1adf59-5561-4e39-a117-bd85b39de1ca	uuid-5	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
a39041f0-f6d4-4125-a506-0abcb8866683	uuid-6	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
8c827d07-dbbd-4033-acb9-42cb1553b4d8	0955b963-05ba-4cce-ac72-4d1179e43a7e	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
5ff7ca3a-f944-41b5-a468-344e1648b771	2650fbbf-0be0-4eec-9880-e3cef81cf027	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
7f4d6cf2-8410-42f2-9d6a-881a5408e742	5da535b8-5419-400f-9072-5643f27f393f	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
318fb8fc-21c2-413e-aef4-f0ffb18d3289	31a190dc-ef4f-4b19-8f2e-26eccc0da91a	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
dd18fe36-e292-47f2-b6ce-83ebf7046735	548d1e28-3e74-494d-a0b6-10f203398f20	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
b6898e67-97cc-4040-a223-8fa8b279b42b	3c94ae2b-a8cd-4885-b1f5-54832fc7819c	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
3cb2fca1-c3dd-4bd2-885a-2b30b1d26b24	06054761-1f4c-415a-83db-f13bab32c3f3	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
ce65e4f8-c24e-4d27-83ae-0c28fbb292af	a3c19f14-b8ab-4796-85e5-50a4aa1d76c3	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
75b514aa-2aac-4770-8566-f63949bf5865	06f690fd-4bab-4f39-afc8-b86fe8eaf6a2	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
e5582f62-c7ec-4629-ab21-a3ba5334560c	028cf9cd-eb91-4762-972f-c19abb95ffd8	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
95f2efed-70d5-41db-b946-2dbbf1cf7f54	936ca080-f9fb-4097-a46a-85ae21167b26	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
23aa6ff7-085f-4698-a14f-fa020144870d	773a61e1-a62a-42c5-b87c-d09f8a37f1a9	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
85061932-d84a-427a-a5e9-c56b6f5493dc	9353302a-80ca-4f0e-b1a7-0b22c3a1773d	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
04290cd8-7114-4f1c-bba6-4e0d16f6d112	d8c6bd45-0698-4f9a-ae7e-c51a6f0c5c54	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
dca89ae4-241b-4c70-adf7-98d76de883b2	c33747b7-1de7-4a0a-8a6c-2a4768ddccca	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
407f2625-3fab-429c-aaef-e5cd0c4b643c	e9f5e573-4170-4f29-bec4-3e2f33d1589e	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
10551d89-cd34-4f95-8023-d2077fb8a093	323239fc-076a-4507-85e6-97d28ab45281	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
d6d0654a-1272-421e-b56e-7158bb61a6e7	c6764097-ae3d-4668-a713-a461972e26f0	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
bf5f542e-34b5-4290-a4cf-f30c005a6673	bfc3beff-6455-44e0-bc54-de5424fe3ae2	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
55e21051-7cd5-4868-82e4-1e7c939d250b	491b8540-93f2-4942-af55-f32e6920654e	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
a701330b-6138-4588-b673-566446497eb7	e81b7d5c-ad82-480c-b24f-93dc6a8d3c07	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
efd723b5-acb9-48b7-bac7-bec795f0f2ab	052c851a-fe39-42a4-b0fc-676fe6202518	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
6f726696-044e-44b5-ae33-fa6dc3bd8508	c7cd7cd4-177e-4ae5-9e5f-81954bc03b77	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
8b4f8455-0d29-42aa-a6a2-0f9ecbda3d4a	f4095def-88a4-4d17-8c1d-ebaac8d9529e	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
3c7a177f-ca0e-409f-a691-a83657e8f7f5	8b976f98-3921-49f2-acf5-006f41d69095	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
3cad55b6-e76c-4158-b5ab-27aaaa1572d5	6602d4c2-19e6-49be-b596-40fc58430f73	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
aebd1fdb-71f7-41a0-9895-4c38e0c95823	b1a54a1c-b8ec-43c8-b2c6-a86d359e5e16	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
c4361a16-982c-40bc-9154-b8aaf5bd574f	ca71aea2-7b29-43dd-90a0-e166f20519a8	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
15b552bc-373d-4242-b0af-a649526c7750	05ff7706-40d7-4248-8ea0-44f5c093bb81	2025-12-01 00:00:00	{"sms": 0, "emails": 0, "players": 0, "sessions": 0, "api_calls": 0}	2025-12-02 03:12:00.026045
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenants (id, name, subdomain, created_at, plan_level, stripe_customer_id, stripe_subscription_id, trial_status, trial_started_at, trial_ends_at, trial_plan, trial_extensions_used, trial_payment_method_provided, trial_conversion_data, abuse_prevention_fingerprint, city, state, country, slug, tenant_code, contact_name, contact_email, billing_status, payment_method_required, payment_method_verified, max_trial_extensions, pending_plan_change, pending_plan_change_at, last_plan_level, plan_change_reason, data_retention_policy, archived_data_paths, data_cleanup_scheduled_at, trial_history, signup_ip_address, signup_user_agent, risk_score, grace_period_ends_at, grace_period_reason, grace_period_notifications_sent, invite_code, invite_code_updated_at, invite_code_updated_by, custom_domain, pending_plan_code, last_plan_change_at, pending_plan_effective_date, sms_credits_balance, sms_credits_low_threshold, sms_credits_last_purchased_at, sms_credits_auto_recharge, sms_credits_auto_recharge_amount, payment_processor, braintree_customer_id, braintree_subscription_id, braintree_status, braintree_plan_id, braintree_payment_method_token, braintree_oauth_merchant_id, braintree_next_billing_date, braintree_last_charge_at, braintree_last_failure_at, braintree_failure_count, display_name, applied_discount_code_id, applied_discount_code, applied_discount_type, applied_discount_value, applied_discount_duration, applied_discount_remaining_cycles, applied_discount_started_at, applied_discount_applied_by, applied_discount_is_platform, is_staging) FROM stdin;
c2d95cef-9cd3-4411-9e12-c478747e8c06	Elite Footwork Academy	elite-footwork	2025-07-28 18:32:43.068534	growth	cus_SwoWu5C1DbQ8GQ	sub_1S0vsiKA9oSeqOY8TJEIGthH	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	\N	\N	\N	\N	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	9E2F27CB	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Elite Footwork Academy	\N	\N	\N	\N	\N	\N	\N	\N	f	f
d98c4191-c7e0-474d-9dd7-672219d85e4d	Futsal Culture	futsal-culture	2025-07-28 18:32:43.034786	elite	cus_test_elite_123	sub_test_final_complete	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	\N	\N	\N	\N	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	93CCDE12	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Futsal Culture	\N	\N	\N	\N	\N	\N	\N	\N	f	f
a8747632-df9d-4b92-8e1b-de507f0f78f6	Liverpool FC	liverpool-fc	2025-08-26 02:18:38.560567	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	West Palm Beach	FL	USA	\N	\N	John Smith	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	EC10A924	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Liverpool FC	\N	\N	\N	\N	\N	\N	\N	\N	f	f
b814113a-caeb-45c3-9b97-971f5eaf50da	Team Boca	team-boca-1	2025-08-26 02:41:06.93837	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	West Palm Beach	FL	USA	\N	\N	Attius Brind	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	D58560D0	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Team Boca	\N	\N	\N	\N	\N	\N	\N	\N	f	f
df92c112-d581-479a-9a14-c2f640b11ae3	Liverpool	liverpool	2025-08-26 02:48:01.024657	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	Boynton Beach	FL	US	\N	\N	Atticus Brind	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	4B0FC7D5	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Liverpool	\N	\N	\N	\N	\N	\N	\N	\N	f	f
platform-staging	PlayHQ Platform	platform-staging	2025-12-04 22:41:51.899347	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	\N	\N	\N	\N	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	PLATA6VHVNH6	2025-12-04 22:41:51.899347+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	PlayHQ Platform	\N	\N	\N	\N	\N	\N	\N	\N	f	t
uuid-1	Metro Soccer Academy	metro-soccer	2025-07-10 04:18:16.538682	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	\N	\N	\N	\N	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	12388307	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Metro Soccer Academy	\N	\N	\N	\N	\N	\N	\N	\N	f	f
bfc3beff-6455-44e0-bc54-de5424fe3ae2	Atticus Test Club	atticus-test-club	2025-08-26 22:14:46.172798	growth	cus_SwoBGH7WjKky4a	sub_1S0uYwKA9oSeqOY8vjcSyRqd	\N	\N	\N	\N	0	f	\N	\N	Miami	FL	US	atticus-test-club	98KYR398	Atticus Brind	atticus.brind@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	\N	2025-08-26 22:14:46.172798+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Atticus Test Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
491b8540-93f2-4942-af55-f32e6920654e	PlayHQ	playhq-1	2025-08-27 02:33:13.380024	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	Boynton Beach	FL	US	\N	\N	Atticus Brind	sprout565656@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	EB15F404	2025-08-27 02:33:13.380024+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	PlayHQ	\N	\N	\N	\N	\N	\N	\N	\N	f	f
6602d4c2-19e6-49be-b596-40fc58430f73	Test Upgrade Club	test-upgrade-club	2025-08-29 22:46:25.772193	elite	cus_test_new_tenant_123	sub_test_debug	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	\N	\N	Test Admin	test@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	TEST123	2025-08-29 22:46:25.772193+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Test Upgrade Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
b1a54a1c-b8ec-43c8-b2c6-a86d359e5e16	Payment Test Club	payment-test-club	2025-08-29 22:50:43.211385	growth	cus_payment_test_123	sub_payment_test_growth	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	\N	\N	Test Owner	owner@paymenttest.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	PAY123	2025-08-29 22:50:43.211385+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Payment Test Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
e81b7d5c-ad82-480c-b24f-93dc6a8d3c07	Working Test Club	working-test-club	2025-08-27 02:42:32.835913	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Working Test User	workingtest@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	73580905	2025-08-27 02:42:32.835913+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Working Test Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
052c851a-fe39-42a4-b0fc-676fe6202518	Final Working Test	final-working-test	2025-08-27 02:43:00.567503	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Final Working User	finalworking@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	2F81E579	2025-08-27 02:43:00.567503+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Final Working Test	\N	\N	\N	\N	\N	\N	\N	\N	f	f
c7cd7cd4-177e-4ae5-9e5f-81954bc03b77	Test UI Fix	test-ui-fix	2025-08-27 02:48:16.155439	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Test User	testui@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	5E476787	2025-08-27 02:48:16.155439+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Test UI Fix	\N	\N	\N	\N	\N	\N	\N	\N	f	f
f4095def-88a4-4d17-8c1d-ebaac8d9529e	PlayHQ	playhq-2	2025-08-27 02:52:52.813184	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	Boynton Beach	FL	US	\N	\N	Atticus Brind	sprout565656@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	B38093ED	2025-08-27 02:52:52.813184+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	PlayHQ	\N	\N	\N	\N	\N	\N	\N	\N	f	f
8b976f98-3921-49f2-acf5-006f41d69095	PlayHQ	liverpool-2	2025-08-26 03:04:11.293755	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	Boynton Beach	FL	US	\N	\N	Atticus Brind	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	PLAYHQAA	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	PlayHQ	\N	\N	\N	\N	\N	\N	\N	\N	f	f
05ff7706-40d7-4248-8ea0-44f5c093bb81	This is a test Club	this-is-a-test-club	2025-10-08 01:42:21.974458	free	cus_TD5B1X1nCwT8Sa	\N	\N	2025-10-08 16:26:12.503578	2025-10-11 16:26:12.503578	growth	0	f	\N	\N	Boynton Beach	FL	US	\N	\N	Atticus Brind	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	101D1CAB	2025-10-08 01:42:21.974458+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	This is a test Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
uuid-6	Premier Futsal Club	premier-futsal	2025-08-16 04:18:16.538682	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	\N	\N	\N	\N	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	BDEA4F5C	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Premier Futsal Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
0955b963-05ba-4cce-ac72-4d1179e43a7e	TEsting	testing	2025-08-25 16:11:55.113091	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N				\N	\N	\N	\N	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	53CC2369	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	TEsting	\N	\N	\N	\N	\N	\N	\N	\N	f	f
2650fbbf-0be0-4eec-9880-e3cef81cf027	Boynton Beach	boynton-beach	2025-08-25 16:33:11.833588	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	Boca	Florida	USA	\N	\N	\N	\N	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	3F3C7A89	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Boynton Beach	\N	\N	\N	\N	\N	\N	\N	\N	f	f
uuid-2	Rising Stars FC	rising-stars	2025-07-23 04:18:16.538682	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	\N	\N	\N	\N	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	846E8582	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Rising Stars FC	\N	\N	\N	\N	\N	\N	\N	\N	f	f
uuid-3	Champions Training Center	champions-training	2025-07-27 04:18:16.538682	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	\N	\N	\N	\N	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	3B77F201	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Champions Training Center	\N	\N	\N	\N	\N	\N	\N	\N	f	f
uuid-4	Youth Development Hub	youth-development	2025-08-03 04:18:16.538682	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	\N	\N	\N	\N	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	6C70A4FD	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Youth Development Hub	\N	\N	\N	\N	\N	\N	\N	\N	f	f
uuid-5	Skillful Feet Academy	skillful-feet	2025-08-09 04:18:16.538682	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	\N	\N	\N	\N	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	64242BE2	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Skillful Feet Academy	\N	\N	\N	\N	\N	\N	\N	\N	f	f
ca71aea2-7b29-43dd-90a0-e166f20519a8	Sport Haus	sport-haus	2025-09-03 00:14:40.930569	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	Boynton Beach	FL	US	\N	\N	Atticus Brind	atticus.brind@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	E24B84A9	2025-09-03 00:14:40.930569+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Sport Haus	\N	\N	\N	\N	\N	\N	\N	\N	f	f
5da535b8-5419-400f-9072-5643f27f393f	Test Club	test-club	2025-08-26 02:07:23.174251	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Test User	test@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	A37D9371	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Test Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
31a190dc-ef4f-4b19-8f2e-26eccc0da91a	Team Boca FC	team-boca-fc	2025-08-26 02:08:09.10362	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Atticus Brind	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	7B8306EE	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Team Boca FC	\N	\N	\N	\N	\N	\N	\N	\N	f	f
548d1e28-3e74-494d-a0b6-10f203398f20	Unique Test Club 2025	unique-test-club-2025	2025-08-26 02:08:39.516984	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Atticus Brind	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	EDBA2D77	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Unique Test Club 2025	\N	\N	\N	\N	\N	\N	\N	\N	f	f
3c94ae2b-a8cd-4885-b1f5-54832fc7819c	Final Test FC $(date +%s)	final-test-fc-date-s	2025-08-26 02:09:02.70518	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Atticus Brind	finaltest$(date +%s)@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	DB553A26	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Final Test FC $(date +%s)	\N	\N	\N	\N	\N	\N	\N	\N	f	f
06054761-1f4c-415a-83db-f13bab32c3f3	Working Test Club 2025	working-test-club-2025	2025-08-26 02:09:21.168089	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Atticus Brind	working.test@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	E83057EB	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Working Test Club 2025	\N	\N	\N	\N	\N	\N	\N	\N	f	f
fe2f5f15-ab93-43c8-a483-3d3d7cabf754	Abra's Club	abra-s-club-i_T8	2025-12-04 13:30:20.973229	core	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	abra-s-club-i_T8	UGUHLAEA	Abra Cadabra	ajosephfinch@gmail.com	none	f	f	1	\N	\N	free	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	6L7GPTJP	2025-12-04 13:30:20.973229+00	\N	\N	\N	2025-12-04 18:00:25.582	\N	0	50	\N	f	\N	braintree	86205562551	cbbc8f	Active	plan_core_123	17d0n5jf	\N	2026-01-04 00:00:00	\N	\N	0	Abra's Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
a3c19f14-b8ab-4796-85e5-50a4aa1d76c3	Team Boca	team-boca	2025-08-26 02:10:19.299607	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	West Palm	Fl	USA	\N	\N	Atticus Brind	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	0F4ED224	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Team Boca	\N	\N	\N	\N	\N	\N	\N	\N	f	f
06f690fd-4bab-4f39-afc8-b86fe8eaf6a2	Team Boca testing	team-boca-testing	2025-08-26 02:10:56.921062	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	West Palm	Fl	USA	\N	\N	Atticus Brind	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	1D9FF83C	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Team Boca testing	\N	\N	\N	\N	\N	\N	\N	\N	f	f
028cf9cd-eb91-4762-972f-c19abb95ffd8	New Test Club	new-test-club	2025-08-26 02:11:54.508506	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Test User	newtest@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	23583AA1	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	New Test Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
936ca080-f9fb-4097-a46a-85ae21167b26	Your Actual Club Name	your-actual-club-name	2025-08-26 02:12:44.868704	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	FL	\N	\N	\N	John Smith	ajospehfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	58B48F19	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Your Actual Club Name	\N	\N	\N	\N	\N	\N	\N	\N	f	f
773a61e1-a62a-42c5-b87c-d09f8a37f1a9	Boynton Beach	boynton-beach-1	2025-08-26 02:55:12.042844	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	Boynton Beach	FL	US	\N	\N	Atticus Brind	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	6C9F461D	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Boynton Beach	\N	\N	\N	\N	\N	\N	\N	\N	f	f
9353302a-80ca-4f0e-b1a7-0b22c3a1773d	Liverpool	liverpool-1	2025-08-26 03:00:22.008737	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	Boynton Beach	FL	US	\N	\N	Atticus Brind	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	F0F45E7E	2025-08-26 12:17:07.947888+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Liverpool	\N	\N	\N	\N	\N	\N	\N	\N	f	f
d8c6bd45-0698-4f9a-ae7e-c51a6f0c5c54	Test Club Debug	test-club-debug	2025-08-26 21:17:06.125112	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Test User	test@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	\N	2025-08-26 21:17:06.125112+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Test Club Debug	\N	\N	\N	\N	\N	\N	\N	\N	f	f
c33747b7-1de7-4a0a-8a6c-2a4768ddccca	Final Test Club	final-test-club	2025-08-26 22:15:19.971351	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	Orlando	FL	US	final-test-club	P3A648S4	Test User	test.final@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	\N	2025-08-26 22:15:19.971351+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Final Test Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
e9f5e573-4170-4f29-bec4-3e2f33d1589e	Test Club 3	test-club-3	2025-08-27 02:30:58.363159	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Test User 3	test3@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	7B983581	2025-08-27 02:30:58.363159+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Test Club 3	\N	\N	\N	\N	\N	\N	\N	\N	f	f
323239fc-076a-4507-85e6-97d28ab45281	Final Test Club	final-test-club-1	2025-08-27 02:31:20.888997	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N	Final Test User	finaltest@example.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	F0D7CB41	2025-08-27 02:31:20.888997+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Final Test Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
c6764097-ae3d-4668-a713-a461972e26f0	PlayHQ	playhq	2025-08-27 02:32:21.224975	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	Boynton Beach	FL	US	\N	\N	Atticus Brind	atticus.brind@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	75E137F5	2025-08-27 02:32:21.224975+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	PlayHQ	\N	\N	\N	\N	\N	\N	\N	\N	f	f
4b7d3a08-e945-4cb9-974c-ac6d05405977	test club	test-club-1	2025-12-04 04:01:09.813586	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	Boynton Beach	FL	US	\N	\N	atticus brind	abrind@callsprout.com	pending_approval	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	C5D61543	2025-12-04 04:01:09.813586+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	test club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
b91569ce-22ba-4645-b1a2-9db34bd7c4ab	Abra's Club	abra-s-club	2025-12-04 05:40:55.763854	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	abra-s-club	SWGVSHKE	Abra Cadabra	ajosephfinch@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	PLDXPKPD	2025-12-04 05:40:55.763854+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Abra's Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
f858260d-1f30-4c8a-a89d-fc0be31cc25e	Patricia's Club	patricia-s-club	2025-12-04 20:22:41.642011	free	\N	\N	\N	\N	\N	\N	0	f	\N	\N	\N	\N	US	patricia-s-club	X3A8LJKQ	Patricia Mitchell	sprout565656@gmail.com	none	f	f	1	\N	\N	\N	\N	{"players": 730, "payments": 2555, "sessions": 365, "analytics": 90}	{}	\N	[]	\N	\N	0	\N	\N	0	2GNHDPPD	2025-12-04 20:22:41.642011+00	\N	\N	\N	\N	\N	0	50	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Patricia's Club	\N	\N	\N	\N	\N	\N	\N	\N	f	f
\.


--
-- Data for Name: training_plan_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.training_plan_items (id, tenant_id, plan_id, day_of_week, drill_id, custom_text, duration_minutes, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: training_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.training_plans (id, tenant_id, player_id, created_by, title, start_date, end_date, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: unified_invitations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unified_invitations (id, tenant_id, batch_id, type, recipient_email, recipient_name, role, token, status, custom_message, metadata, expires_at, sent_at, viewed_at, accepted_at, created_by, created_at, updated_at) FROM stdin;
5e651082-2d27-440d-8c8f-5d59bb78a299	491b8540-93f2-4942-af55-f32e6920654e	\N	email	ajosephfinch@gmail.com	\N	admin	j9jgoTCmN59gJ8j-b5JqNBlL2xOaZXkQwrHCsmMKZOE	accepted	\N	{}	2025-09-10 02:34:27.131	2025-08-27 02:34:27.55	\N	2025-08-27 02:36:06.616	94f24015-c007-418f-8092-ade6ce00478a	2025-08-27 02:34:27.149587	2025-08-27 02:36:06.616
57b15f7d-d9ae-4a59-9d22-b51904c777d8	bfc3beff-6455-44e0-bc54-de5424fe3ae2	\N	email	sprout565656@gmail.com	\N	parent	4tVDEpYGZWnsXTuW56P2LTNsEGQi4UA_FH0yvN0x5Xo	accepted	\N	{}	2025-09-10 01:58:11.741	2025-08-27 01:58:12.268	\N	2025-08-27 03:16:52.98	9a9e4637-2f49-4ae1-abb4-a02d8c062a30	2025-08-27 01:58:11.760571	2025-08-27 03:16:52.98
442ac5ca-21bc-42da-a243-581b18dc7022	8b976f98-3921-49f2-acf5-006f41d69095	\N	email	test@example.com	\N	parent	test-token-123	accepted	\N	{}	2025-09-03 04:07:47.442298	\N	\N	2025-08-27 04:07:57.506	\N	2025-08-27 04:07:47.442298	2025-08-27 04:07:57.506
35d6710e-067d-4c9d-85c3-236de663e270	8b976f98-3921-49f2-acf5-006f41d69095	\N	email	atticus.brind@gmail.com	\N	admin	6451a79f1814a0b05b8f5c055cb34a68cf107cfa537cbd80f645c59bb77ad576	accepted	\N	{}	2025-09-03 04:42:50.379	2025-08-27 04:42:50.898	\N	2025-08-27 11:36:12.278	\N	2025-08-27 04:42:50.398924	2025-08-27 11:36:12.278
\.


--
-- Data for Name: unsubscribes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unsubscribes (id, channel, address, reason, created_at) FROM stdin;
\.


--
-- Data for Name: user_credits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_credits (id, user_id, tenant_id, amount_cents, reason, session_id, signup_id, is_used, used_at, used_for_signup_id, created_at, expires_at, household_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, tenant_id, email, first_name, last_name, profile_image_url, phone, is_admin, is_assistant, is_super_admin, two_factor_enabled, two_factor_secret, customer_id, is_approved, registration_status, approved_at, approved_by, rejected_at, rejected_by, rejection_reason, parent2_invite_sent_via, parent2_invited_at, parent2_invite_email, parent2_invite_phone, created_at, updated_at, avatar_color, avatar_text_color, role, mfa_enabled, status, password_hash, auth_provider, auth_provider_id, email_verified_at, verification_status, date_of_birth, clerk_user_id, is_unaffiliated) FROM stdin;
admin-d98c4191-c7e0-474d-9dd7-672219d85e4d-0	d98c4191-c7e0-474d-9dd7-672219d85e4d	admin1@futsalculture.com	Steven	Torres	\N	\N	t	f	f	f	\N	\N	t	approved	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.136933	2025-07-28 18:32:43.136933	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
admin-d98c4191-c7e0-474d-9dd7-672219d85e4d-1	d98c4191-c7e0-474d-9dd7-672219d85e4d	admin2@futsalculture.com	Jessica	Moore	\N	\N	t	f	f	f	\N	\N	t	approved	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.169357	2025-07-28 18:32:43.169357	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-0	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent1@futsalculture.com	Jessica	Thompson	\N	+17096519439	f	f	f	f	\N	\N	t	approved	2025-04-01 11:51:37.871	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.201965	2025-07-28 18:32:43.201965	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-1	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent2@futsalculture.com	Anthony	Smith	\N	+16889914003	f	f	f	f	\N	\N	t	approved	2025-06-04 13:08:26.176	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.234513	2025-07-28 18:32:43.234513	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-2	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent3@futsalculture.com	Carol	King	\N	+17153618095	f	f	f	f	\N	\N	t	approved	2025-05-15 06:27:14.967	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.270613	2025-07-28 18:32:43.270613	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-3	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent4@futsalculture.com	Barbara	Walker	\N	+19671177233	f	f	f	f	\N	\N	t	approved	2025-07-26 13:06:47.999	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.303116	2025-07-28 18:32:43.303116	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-4	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent5@futsalculture.com	Jennifer	White	\N	+19547112530	f	f	f	f	\N	\N	t	approved	2025-04-20 20:21:23.078	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.335395	2025-07-28 18:32:43.335395	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-5	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent6@futsalculture.com	David	Allen	\N	+19658245690	f	f	f	f	\N	\N	t	approved	2025-04-08 14:52:12.273	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.367721	2025-07-28 18:32:43.367721	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-6	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent7@futsalculture.com	Karen	Torres	\N	+15235839030	f	f	f	f	\N	\N	t	approved	2025-05-12 22:47:52.195	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.400523	2025-07-28 18:32:43.400523	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-7	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent8@futsalculture.com	Steven	Allen	\N	+17943635626	f	f	f	f	\N	\N	t	approved	2025-04-25 07:05:43.852	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.433429	2025-07-28 18:32:43.433429	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-8	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent9@futsalculture.com	John	Moore	\N	+13703045353	f	f	f	f	\N	\N	t	approved	2025-04-14 16:32:46.725	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.473216	2025-07-28 18:32:43.473216	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-9	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent10@futsalculture.com	Joseph	Robinson	\N	+17182161736	f	f	f	f	\N	\N	t	approved	2025-04-19 14:24:33.965	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.504434	2025-07-28 18:32:43.504434	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-10	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent11@futsalculture.com	Mary	Johnson	\N	+19276026483	f	f	f	f	\N	\N	t	approved	2025-04-17 15:51:29.565	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.536746	2025-07-28 18:32:43.536746	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-11	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent12@futsalculture.com	Matthew	Hill	\N	+17589336865	f	f	f	f	\N	\N	t	approved	2025-06-22 19:13:53.649	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.568576	2025-07-28 18:32:43.568576	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-12	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent13@futsalculture.com	Anthony	Jackson	\N	+14742645156	f	f	f	f	\N	\N	t	approved	2025-06-30 01:38:18.248	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.600812	2025-07-28 18:32:43.600812	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-13	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent14@futsalculture.com	Kimberly	King	\N	+13975191715	f	f	f	f	\N	\N	t	approved	2025-06-21 01:17:15.812	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.633513	2025-07-28 18:32:43.633513	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-14	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent15@futsalculture.com	Thomas	Thompson	\N	+17192923812	f	f	f	f	\N	\N	t	approved	2025-06-01 07:13:44.299	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.667402	2025-07-28 18:32:43.667402	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-15	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent16@futsalculture.com	Lisa	Hill	\N	+14317203203	f	f	f	f	\N	\N	t	approved	2025-07-13 03:16:02.738	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.703002	2025-07-28 18:32:43.703002	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-16	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent17@futsalculture.com	Thomas	King	\N	+18909593020	f	f	f	f	\N	\N	t	approved	2025-06-20 07:07:51.53	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.735557	2025-07-28 18:32:43.735557	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-17	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent18@futsalculture.com	Thomas	Thompson	\N	+15871558509	f	f	f	f	\N	\N	t	approved	2025-04-03 02:48:57.647	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.768073	2025-07-28 18:32:43.768073	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-18	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent19@futsalculture.com	David	Garcia	\N	+18585302167	f	f	f	f	\N	\N	t	approved	2025-04-30 19:21:15.475	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.799708	2025-07-28 18:32:43.799708	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-d98c4191-c7e0-474d-9dd7-672219d85e4d-19	d98c4191-c7e0-474d-9dd7-672219d85e4d	parent20@futsalculture.com	Charles	Walker	\N	+14085363633	f	f	f	f	\N	\N	t	approved	2025-05-22 09:42:06.788	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:32:43.832435	2025-07-28 18:32:43.832435	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
admin-c2d95cef-9cd3-4411-9e12-c478747e8c06-0	c2d95cef-9cd3-4411-9e12-c478747e8c06	admin1@elitefootworkacademy.com	Kenneth	Hernandez	\N	\N	t	f	f	f	\N	\N	t	approved	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.253489	2025-07-28 18:33:12.253489	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
admin-c2d95cef-9cd3-4411-9e12-c478747e8c06-1	c2d95cef-9cd3-4411-9e12-c478747e8c06	admin2@elitefootworkacademy.com	Sarah	Johnson	\N	\N	t	f	f	f	\N	\N	t	approved	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.285911	2025-07-28 18:33:12.285911	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-0	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent1@elitefootworkacademy.com	Sandra	Martinez	\N	+17997029279	f	f	f	f	\N	\N	t	approved	2025-05-28 03:18:00.176	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.318731	2025-07-28 18:33:12.318731	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-1	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent2@elitefootworkacademy.com	Susan	Miller	\N	+18792556252	f	f	f	f	\N	\N	t	approved	2025-04-08 07:22:42.594	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.351483	2025-07-28 18:33:12.351483	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-2	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent3@elitefootworkacademy.com	Patricia	Lewis	\N	+12886839776	f	f	f	f	\N	\N	t	approved	2025-06-05 21:09:20.532	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.383977	2025-07-28 18:33:12.383977	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-3	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent4@elitefootworkacademy.com	Betty	Anderson	\N	+13708741130	f	f	f	f	\N	\N	t	approved	2025-07-18 07:06:50.8	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.416411	2025-07-28 18:33:12.416411	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-4	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent5@elitefootworkacademy.com	Barbara	Davis	\N	+14101179842	f	f	f	f	\N	\N	t	approved	2025-06-03 18:45:49.492	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.449299	2025-07-28 18:33:12.449299	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-5	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent6@elitefootworkacademy.com	Michael	Smith	\N	+15494599984	f	f	f	f	\N	\N	t	approved	2025-04-06 05:10:44.581	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.481363	2025-07-28 18:33:12.481363	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-6	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent7@elitefootworkacademy.com	Nancy	Williams	\N	+19355228728	f	f	f	f	\N	\N	t	approved	2025-04-12 10:52:27.627	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.512495	2025-07-28 18:33:12.512495	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-7	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent8@elitefootworkacademy.com	Kimberly	Davis	\N	+12322513015	f	f	f	f	\N	\N	t	approved	2025-07-22 08:51:20.334	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.543436	2025-07-28 18:33:12.543436	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-8	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent9@elitefootworkacademy.com	Michelle	Davis	\N	+14408896989	f	f	f	f	\N	\N	t	approved	2025-07-27 16:15:00.549	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.575664	2025-07-28 18:33:12.575664	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-9	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent10@elitefootworkacademy.com	Charles	Lewis	\N	+16998207580	f	f	f	f	\N	\N	t	approved	2025-05-07 12:06:12.993	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.608221	2025-07-28 18:33:12.608221	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-10	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent11@elitefootworkacademy.com	Deborah	King	\N	+13792824793	f	f	f	f	\N	\N	t	approved	2025-04-22 21:11:23.792	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.64106	2025-07-28 18:33:12.64106	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-11	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent12@elitefootworkacademy.com	Robert	Wilson	\N	+13166403767	f	f	f	f	\N	\N	t	approved	2025-04-17 21:32:28.878	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.67737	2025-07-28 18:33:12.67737	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-12	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent13@elitefootworkacademy.com	Elizabeth	Thompson	\N	+19014882888	f	f	f	f	\N	\N	t	approved	2025-06-11 02:37:54.474	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.709434	2025-07-28 18:33:12.709434	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-13	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent14@elitefootworkacademy.com	Mary	Nguyen	\N	+15006749840	f	f	f	f	\N	\N	t	approved	2025-04-03 08:47:02.324	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.741639	2025-07-28 18:33:12.741639	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-14	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent15@elitefootworkacademy.com	William	Thomas	\N	+16588263851	f	f	f	f	\N	\N	t	approved	2025-07-14 15:38:11.23	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.774056	2025-07-28 18:33:12.774056	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-15	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent16@elitefootworkacademy.com	Laura	Robinson	\N	+17545201385	f	f	f	f	\N	\N	t	approved	2025-06-28 12:53:40.021	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.806242	2025-07-28 18:33:12.806242	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-16	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent17@elitefootworkacademy.com	Mary	Sanchez	\N	+17122022787	f	f	f	f	\N	\N	t	approved	2025-05-03 12:07:31.062	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.839881	2025-07-28 18:33:12.839881	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-17	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent18@elitefootworkacademy.com	Michelle	Robinson	\N	+15014427968	f	f	f	f	\N	\N	t	approved	2025-05-13 05:24:49.514	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.872506	2025-07-28 18:33:12.872506	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-18	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent19@elitefootworkacademy.com	Ruth	Lewis	\N	+19173868156	f	f	f	f	\N	\N	t	approved	2025-04-01 01:39:52.627	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.904881	2025-07-28 18:33:12.904881	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
parent-c2d95cef-9cd3-4411-9e12-c478747e8c06-19	c2d95cef-9cd3-4411-9e12-c478747e8c06	parent20@elitefootworkacademy.com	William	Lee	\N	+12698523273	f	f	f	f	\N	\N	t	approved	2025-04-20 12:32:51.239	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-28 18:33:12.940889	2025-07-28 18:33:12.940889	#2563eb	\N	parent	f	active	\N	\N	\N	\N	verified	\N	\N	f
ccc1d1fc-bc5e-4963-91b1-85ced1b5f31e	bfc3beff-6455-44e0-bc54-de5424fe3ae2	sprout@gmail.com	Test	User	\N	\N	f	f	f	f	\N	\N	t	approved	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-27 02:52:52.847692	2025-08-27 03:16:53.177	#2563eb	\N	parent	f	active	$2b$10$82a1.Zog6DgoS/HYj5NnaOG6l7sQk3krITGCRfJqZAY4a/QkwyCDm	local	\N	2025-08-27 03:16:53.177	pending_verify	\N	\N	f
ca235680-87cf-4b11-bd5c-c0ba1065fd82	e81b7d5c-ad82-480c-b24f-93dc6a8d3c07	workingtest@example.com	Working	Test User	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-27 02:42:32.879097	2025-08-27 02:42:32.879097	#2563eb	\N	tenant_admin	f	active	\N	local	\N	\N	pending_verify	\N	\N	f
eb672165-c275-4ef1-b9a1-9f7e0fcc79a9	052c851a-fe39-42a4-b0fc-676fe6202518	finalworking@example.com	Final	Working User	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-27 02:43:00.747752	2025-08-27 02:43:00.747752	#2563eb	\N	tenant_admin	f	active	\N	local	\N	\N	pending_verify	\N	\N	f
70724bfd-e373-494e-a91d-4af04c4a61d4	3c94ae2b-a8cd-4885-b1f5-54832fc7819c	finaltest$(date +%s)@example.com	Atticus	Brind	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-26 02:09:02.746074	2025-08-26 02:09:02.746074	#2563eb	\N	tenant_admin	f	active	\N	local	\N	\N	pending_verify	\N	\N	f
b1abb08f-df65-48b7-83f8-675c7bc71c7a	06054761-1f4c-415a-83db-f13bab32c3f3	working.test@example.com	Atticus	Brind	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-26 02:09:21.206444	2025-08-26 02:09:21.206444	#2563eb	\N	tenant_admin	f	active	\N	local	\N	\N	pending_verify	\N	\N	f
3c2d76d8-4767-4ef5-93a7-84b92ea4026d	028cf9cd-eb91-4762-972f-c19abb95ffd8	newtest@example.com	Test	User	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-26 02:11:54.549772	2025-08-26 02:11:54.549772	#2563eb	\N	tenant_admin	f	active	\N	local	\N	\N	pending_verify	\N	\N	f
865b9d24-de32-4b12-8d2b-022271a74b9a	c7cd7cd4-177e-4ae5-9e5f-81954bc03b77	testui@example.com	Test	User	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-27 02:48:16.194738	2025-08-27 02:48:16.194738	#2563eb	\N	tenant_admin	f	active	\N	local	\N	\N	pending_verify	\N	\N	f
94f24015-c007-418f-8092-ade6ce00478a	491b8540-93f2-4942-af55-f32e6920654e	\N	Atticus	Brind	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-27 02:33:13.421536	2025-08-27 02:33:13.421536	#2563eb	\N	tenant_admin	f	active	$2b$12$W/8vHs2sjjG.b7VBWI0lWOdc3rIq13LvDr4P.pAxhTpcK6bTnhrZO	local	\N	2025-08-27 02:33:53.165	verified	\N	\N	f
98c7aad9-1d62-454a-8a8a-9664e0286c61	8b976f98-3921-49f2-acf5-006f41d69095	\N	Atticus	Brind	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-26 03:04:11.330088	2025-08-26 03:04:11.330088	#2563eb	\N	tenant_admin	f	active	$2b$12$0B4c65RBhN5FeFySQVjQceHG4976ZIFM7zZL0XaKa8gRf5xvmKAGG	local	\N	2025-08-26 03:04:48.092	verified	\N	\N	f
9a9e4637-2f49-4ae1-abb4-a02d8c062a30	bfc3beff-6455-44e0-bc54-de5424fe3ae2	\N	Atticus	Brind	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-26 22:15:05.919159	2025-08-26 22:15:05.919159	#2563eb	\N	tenant_admin	f	active	$2b$12$0B4c65RBhN5FeFySQVjQceHG4976ZIFM7zZL0XaKa8gRf5xvmKAGG	local	\N	2025-08-26 22:15:05.919159	verified	\N	\N	f
d9fd4e4d-4e63-4a2b-8a61-cb02fb5a16a2	e9f5e573-4170-4f29-bec4-3e2f33d1589e	test3@example.com	Test	User 3	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-27 02:30:58.4097	2025-08-27 02:30:58.4097	#2563eb	\N	tenant_admin	f	active	\N	local	\N	\N	pending_verify	\N	\N	f
5096273e-3b4f-48f4-a1b6-f40b8ca8c463	323239fc-076a-4507-85e6-97d28ab45281	finaltest@example.com	Final	Test User	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-27 02:31:20.922282	2025-08-27 02:31:20.922282	#2563eb	\N	tenant_admin	f	active	\N	local	\N	\N	pending_verify	\N	\N	f
be809f62-7504-4b07-a6e3-7494f75ba49a	d8c6bd45-0698-4f9a-ae7e-c51a6f0c5c54	test@example.com	Test	User	\N	\N	t	f	f	f	\N	\N	f	approved	2025-08-27 03:35:10.438865	system	\N	\N	\N	\N	\N	\N	\N	2025-08-26 21:17:06.174056	2025-08-26 21:17:06.174056	#2563eb	\N	parent	f	active	\N	local	\N	\N	pending_verify	\N	\N	f
user_1756268735344_501l535pn	\N	newparent@example.com	New	Parent	\N	\N	f	f	f	f	\N	\N	f	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-27 04:25:35.367035	2025-08-27 04:25:35.367035	#2563eb	\N	parent	f	active	$2b$12$QJJPX53BJqvtmx22ipoT/eEH5KMl8JwFxnBGVyzEUxtztwRnkKbPC	local	\N	\N	verified	\N	\N	f
ffc30f02-57cc-4409-a9bc-622228d247b4	platform-staging	sprout565656@gmail.com	Atticus	Brind	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zNkdzV1gzVHhpTDBZSk1PU0Z0ZlZmUzJ6QVciLCJyaWQiOiJ1c2VyXzM2T3NhQkl3bnJxRmk3WUwzOXRENVVPWVhLWSIsImluaXRpYWxzIjoiQUIifQ	\N	f	f	f	f	\N	\N	t	approved	2025-12-04 22:56:56.585	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-04 22:56:56.606196	2025-12-04 22:56:56.661	#2563eb	\N	parent	f	active	\N	clerk	\N	\N	verified	\N	user_36OsaBIwnrqFi7YL39tD5UOYXKY	t
ac0b38f9-b135-4242-8d90-2c8511357026	4b7d3a08-e945-4cb9-974c-ac6d05405977	abrin@callsprout.com	atticus	brind	\N	\N	t	f	f	f	\N	\N	f	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-04 04:01:09.852686	2025-12-04 04:01:09.852686	#2563eb	\N	tenant_admin	f	active	\N	local	\N	\N	pending_verify	\N	\N	f
gsH4gz4OA8IWoxrkN7skf	\N	testuser@example.com	Test	User	\N	\N	f	f	f	f	\N	\N	f	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-27 12:52:32.270685	2025-08-27 12:52:32.270685	#2563eb	\N	parent	f	active	$2b$12$uXsqNgqiRON93mUUymgCsuX.GLe4h7x3wHEIv5UaNTztPO.GEyAK2	local	\N	\N	verified	\N	\N	f
user_1764825257131_f71rzjl8g	b91569ce-22ba-4645-b1a2-9db34bd7c4ab	ajosephfinch12@gmail.com	Abra	Cadabra	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zNk1xYUVRNWJiOUdtaFIyVUM4d2NvYVNuZ0MifQ	\N	t	f	f	f	\N	\N	t	approved	2025-12-04 05:40:55.904	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-04 05:14:17.151716	2025-12-04 05:36:52.784	#2563eb	\N	parent	f	active	\N	clerk	\N	\N	verified	\N	user_36MqaK0IQz3S9LNATjnWN5RwLnj	f
3ae91fb8-fdf5-45ce-b350-ba25c3df8899	05ff7706-40d7-4248-8ea0-44f5c093bb81	admin@example.com	Admin	User	\N	\N	t	f	f	f	\N	cus_TCxdS0n7ldKHWu	t	approved	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-10 04:10:46.956816	2025-10-10 04:10:46.956816	#2563eb	\N	parent	f	active	$2b$12$aT/n0YJCuq7h6mZoYsY.KO7S0Ll0ZoU0T/4KhSOekjw5ImUJUvQoa	local	\N	2025-10-10 04:10:46.932	verified	\N	\N	f
test-payment-admin-001	a8747632-df9d-4b92-8e1b-de507f0f78f6	payment.test@playhq.com	Payment	Tester	\N	\N	t	f	f	f	\N	\N	t	approved	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-10 20:02:40.237961	2025-10-10 20:02:40.237961	#2563eb	\N	parent	f	active	$2b$12$LQv3c1yqBwcVsvtV7c.nPOHx8QX6N5Y9J1Z7K8X9Y0Z1A2B3C4D5E	\N	\N	\N	verified	\N	\N	f
d576db26-32ba-4256-86f1-1478b2d8fbc7	05ff7706-40d7-4248-8ea0-44f5c093bb81	ajosephfinch11@gmail.com	Abra	Cadabra	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zNk1saHFkSVVTVnBuSFU3VkUwYW0yWFdZNTYifQ	\N	t	f	t	f	\N	cus_TCAuZkoNFclZ9U	f	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-08 01:42:22.019704	2025-12-04 05:00:48.211	#2563eb	\N	tenant_admin	f	active	$2b$12$wcdzb7x0kpodFbzQjkqJy.ZF.jQnuxsFOBW0Ju35jOidfAAwrZmYm	clerk	\N	2025-10-08 01:42:59.707	verified	\N	user_36MlhmefkHmAc2TGbmsywDvT7Yq	f
b2c6f868-ac77-42bd-ae8c-fd7ae34a6105	8b976f98-3921-49f2-acf5-006f41d69095	atticus.brind@gmail.com	Atticus	Brind	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zNk1raTZFcllLV0Y0TWVRak56SU9uUmk4RHcifQ	\N	t	f	t	f	\N	\N	t	approved	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-27 11:36:12.483123	2025-12-04 04:52:38.495	#2563eb	\N	tenant_admin	f	active	$2b$12$UJlZoyn1KI2fN0ZegsqSxecSmZbLNWIt0kVK9c5j6Zr3ZyqYOZaN6	clerk	\N	2025-12-02 03:12:36.725	verified	\N	user_36Mki53yInsTmvkuSda8hnuinPX	f
8367db3a-005d-47b7-aca1-da9fb96daa52	fe2f5f15-ab93-43c8-a483-3d3d7cabf754	ajosephfinch@gmail.com	Abra	Cadabra	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zNk5sZmhTVU9BRnZNODhORlI3QWtWZTd5MUMifQ	\N	t	f	f	f	\N	\N	t	approved	2025-12-04 13:30:21.136	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-04 13:30:20.973229	2025-12-04 13:30:20.973229	#2563eb	\N	parent	f	active	\N	clerk	\N	\N	verified	\N	user_36NlfjD5yWpPTpQJsFpVDEV70jJ	f
f414c865-c831-409e-a76b-de14ddd287f5	f858260d-1f30-4c8a-a89d-fc0be31cc25e	55555@gmail.com	Patricia	Mitchell	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zNk9abEtIYmFpZmU1TzJ6amlWN2F3bkJxeDMifQ	\N	t	f	f	f	\N	\N	t	approved	2025-12-04 20:22:41.877	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-04 20:22:41.642011	2025-12-04 20:22:41.642011	#2563eb	\N	parent	f	active	\N	clerk	\N	\N	verified	\N	user_36OZlKhB8akAJBPfdyzixrck32l	f
\.


--
-- Data for Name: waitlists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.waitlists (id, tenant_id, session_id, player_id, parent_id, "position", status, notify_on_join, notify_on_position_change, offer_expires_at, joined_at, offer_status) FROM stdin;
\.


--
-- Data for Name: webhook_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhook_attempts (id, event_id, attempt_no, status, http_status, latency_ms, error, created_at) FROM stdin;
619b30ac-2438-412f-8e42-5a3ad28d20aa	evt_b8rt2e	1	success	200	1650	\N	2025-08-03 15:22:46.947
adac37c9-f440-4621-9f31-4658b46a4214	evt_b8rt2e	2	success	200	1159	\N	2025-08-03 15:23:46.947
de33108a-783b-467e-8b18-a432d8b7f995	evt_b8rt2e	3	failed	404	906	Invalid payload	2025-08-03 15:24:46.947
eca865fe-ae29-4d43-9c7d-e31b77b4b095	evt_r5vncm	1	success	200	1915	\N	2025-08-21 14:02:16.152
c4522581-1c73-419a-9e37-4bdc304cbff5	evt_r5vncm	2	success	200	1913	\N	2025-08-21 14:03:16.152
80f78e43-e11c-4dc2-94a6-f32171d6e5dd	evt_r5vncm	3	success	200	1393	\N	2025-08-21 14:04:16.152
7b9c4a0c-6c92-497d-9737-1488199b36cc	evt_g9r3uc	1	failed	404	1882	Connection timeout	2025-08-09 05:50:32.581
e8385104-4019-40cd-bf89-30b14d8013ce	evt_g9r3uc	2	success	200	778	\N	2025-08-09 05:51:32.581
30975bdc-b5d1-4cfb-a3e2-7ae9001ff539	evt_g9r3uc	3	success	200	1033	\N	2025-08-09 05:52:32.581
b134190e-1b6e-415d-9304-c8e914c85e17	evt_u08b9p	1	success	200	1418	\N	2025-08-08 07:44:51.11
024145e8-ce97-4105-865a-45776bb8d432	evt_u08b9p	2	success	200	897	\N	2025-08-08 07:45:51.11
0d0fd8a5-5150-4e2b-87da-5b5fbd777e3e	evt_u08b9p	3	failed	500	1354	Bad gateway	2025-08-08 07:46:51.11
d661486d-2eb6-4f23-ac80-f1e09b2cf313	evt_si4qz6c	1	success	200	851	\N	2025-08-20 03:21:43.733
fe78473b-e18b-4d19-afa1-c12becf02ea3	evt_si4qz6c	2	success	201	1867	\N	2025-08-20 03:22:43.733
91240657-190a-40bc-8e0b-611e928527fd	evt_si4qz6c	3	success	200	1850	\N	2025-08-20 03:23:43.733
b9594f7d-85b5-4abf-8120-b2ab2932f225	evt_znbmjr	1	success	200	541	\N	2025-08-12 16:54:31.608
0720ac1d-41b4-4381-b33c-dbb1b0e48ed9	evt_2anvgw	1	success	200	137	\N	2025-08-23 21:14:25.228
c35c4544-4eed-4e40-b33a-8f1a1d3a0721	evt_pge51j	1	success	200	1439	\N	2025-08-11 09:23:28.638
83d42e7c-a1cc-4ea9-89b0-4c1e8cea43e6	evt_pge51j	2	success	201	1412	\N	2025-08-11 09:24:28.638
e1cd0aaa-c8b2-4ebb-9fb9-ebab8537f646	evt_if6dgb	1	success	200	742	\N	2025-08-02 14:40:36.065
41935b52-9673-437b-a8c0-1d8b94749ff1	evt_tf1hos	1	success	200	2051	\N	2025-08-19 11:52:12.008
3c12eac0-b4b6-41fa-b526-5be7a03227bd	evt_tf1hos	2	success	200	681	\N	2025-08-19 11:53:12.008
28cc2cc9-0674-4672-a9c9-3a2673178818	evt_tf1hos	3	success	200	691	\N	2025-08-19 11:54:12.008
bd71616b-405a-4aa1-9325-eaaa50dec47f	evt_hft5kw	1	success	200	533	\N	2025-08-08 10:07:34.42
afcfb436-fd77-4da6-9c48-3a9dd84b1950	evt_if6kkd	1	success	200	550	\N	2025-08-04 03:16:40.31
ffaa42c1-8392-4cfa-b359-c6af631bb4d1	evt_if6kkd	2	success	200	1112	\N	2025-08-04 03:17:40.31
1e49f06f-4859-476b-bbde-36b8e1bd22aa	evt_q674aw	1	success	200	463	\N	2025-07-31 11:23:40.568
0600adb2-9bdb-446e-9776-743e5dc61bfd	evt_q674aw	2	failed	500	416	Connection timeout	2025-07-31 11:24:40.568
21d8e878-4bb6-4c58-a5b4-0380aeb26498	evt_q674aw	3	success	200	1257	\N	2025-07-31 11:25:40.568
f10522ff-5b63-4630-8fe9-83d40bc43550	evt_7g2lgo	1	success	200	423	\N	2025-08-19 23:35:32.528
c1eef2c8-ac12-4436-bee3-1dce2cac03d1	evt_7g2lgo	2	failed	404	418	Bad gateway	2025-08-19 23:36:32.528
f53232af-b666-485a-bb39-43335e0a0010	evt_7g2lgo	3	success	200	540	\N	2025-08-19 23:37:32.528
e4168cbe-4a16-4eba-a1c6-68af68bd927d	evt_pcmf6i	1	success	200	1833	\N	2025-08-08 13:15:33.736
59e8da24-b868-4a24-9ccc-1c716a973724	evt_abm1av	1	success	201	505	\N	2025-07-26 16:25:21.356
ada3cde7-37af-44a6-8b22-eb6bcc2de05a	evt_5j8gvcf	1	success	200	417	\N	2025-08-19 23:43:52.722
54050fcb-62b7-4c15-b9f5-5b865fa2950d	evt_2e1xb8	1	failed	404	1816	Invalid payload	2025-08-09 06:27:32.154
09432e40-e572-4c16-aaaa-d44b18d9dfc3	evt_2e1xb8	2	success	200	1721	\N	2025-08-09 06:28:32.154
a25ba6fb-3da5-4a0e-882b-7826b2e3072b	evt_2e1xb8	3	success	200	1978	\N	2025-08-09 06:29:32.154
d9fec420-adc2-4f7d-b6e4-dc5db4d78d74	evt_t7exyi	1	success	200	486	\N	2025-08-16 17:00:12.684
06f3083a-e79b-4789-a919-5eedb5127fc8	evt_t7exyi	2	success	200	1265	\N	2025-08-16 17:01:12.684
76d76e7d-2f4f-40c5-b785-62e96033fa4d	evt_t7exyi	3	failed	500	803	Internal server error	2025-08-16 17:02:12.684
82847536-c20c-4868-ad81-989499920a04	evt_8f1mkg	1	success	200	250	\N	2025-07-31 07:10:19.497
2e933ce2-4678-433b-8af5-981807dea7fc	evt_c5z2y	1	success	201	1256	\N	2025-08-09 05:20:14.316
d82cb254-714e-48c5-905f-f4b7ecd86759	evt_of1i1w	1	success	200	1028	\N	2025-07-25 19:18:41.427
8ff61f66-7c56-4eb2-a027-e21325af6e8f	evt_of1i1w	2	success	201	1091	\N	2025-07-25 19:19:41.427
5688bacb-9c4c-4975-827f-24448cae3d99	evt_p0scdb	1	success	200	2013	\N	2025-08-07 23:34:34.215
684cefcb-434f-4246-8130-b210ad489fc3	evt_p0scdb	2	success	200	598	\N	2025-08-07 23:35:34.215
6a3d2094-6ec9-495a-8121-66277e93e0a5	evt_nwzij	1	success	201	1698	\N	2025-08-15 02:42:11.213
b87ded64-f09c-4747-ae15-e928a8e65daf	evt_nwzij	2	success	200	1256	\N	2025-08-15 02:43:11.213
18e96e64-f7ab-4df4-85bb-38bd82efc7b2	evt_nwzij	3	failed	404	1741	Internal server error	2025-08-15 02:44:11.213
de2a9471-49c5-49b9-b199-94786cc9d859	evt_myxjtc	1	success	200	1988	\N	2025-08-21 22:18:50.88
b886d28b-9844-40a6-9046-68bf0c7881c4	evt_myxjtc	2	success	200	500	\N	2025-08-21 22:19:50.88
d5a09774-1cb2-4da0-9346-3762a8a09b83	evt_myxjtc	3	success	200	1355	\N	2025-08-21 22:20:50.88
9ee7f52b-ba4c-4f93-9b7b-fc1778d80e00	evt_czwmu	1	success	200	1117	\N	2025-07-31 23:16:15.685
02399327-da21-4adf-b13e-a8f9726ad614	evt_1cues8	1	success	200	819	\N	2025-08-05 12:53:26.842
28bf3786-b5f4-4f6b-996c-fc17158cd58b	evt_1cues8	2	failed	500	1861	Connection timeout	2025-08-05 12:54:26.842
250e1d2a-d176-410f-99c3-6b9d7e872324	evt_1cues8	3	failed	500	815	Service unavailable	2025-08-05 12:55:26.842
2fc57d16-aed6-45c5-9ba2-aa1e66eb96fb	evt_71ti7m	1	success	200	1081	\N	2025-07-29 16:05:16.136
d6aa0aba-f823-4637-b5cc-f238d5aeccac	evt_71ti7m	2	success	200	1503	\N	2025-07-29 16:06:16.136
c3edb46d-ed42-4b62-8b66-2a59e29ec02e	evt_71ti7m	3	success	200	184	\N	2025-07-29 16:07:16.136
07dd1e5a-a32b-4b9a-ab62-7650a57450ae	evt_wjrmcm	1	success	200	1451	\N	2025-08-01 07:12:02.368
836783f2-3425-488d-8d72-18c01789ad38	evt_nqmgag	1	success	200	910	\N	2025-08-17 02:33:29.267
eb78ad78-67f4-41eb-86d4-86c881c7f633	evt_5vz24s	1	success	200	843	\N	2025-08-06 17:52:49.582
f4abe86d-e390-4a53-adec-842bfb546749	evt_5vz24s	2	success	200	1630	\N	2025-08-06 17:53:49.582
deb1a00d-b13d-48c9-a720-606b6d5b20d2	evt_m197oq	1	success	200	191	\N	2025-08-04 16:51:40.275
0fcb78f3-726a-4c19-9d40-273c83550490	evt_pyum1l	1	success	200	779	\N	2025-08-16 07:18:54.322
70a00044-2335-41b0-a338-0c412550c2bc	evt_1zi5z6	1	success	200	1274	\N	2025-08-13 11:47:22.559
b15e7cc4-f4e8-4c93-9bab-ae3436e34e39	evt_1zi5z6	2	failed	500	1927	Invalid payload	2025-08-13 11:48:22.559
99847fbe-4e62-4267-af68-a71c687f6c9d	evt_1zi5z6	3	success	200	431	\N	2025-08-13 11:49:22.559
029c83ce-6c8a-4890-a83c-05ad07e76f21	evt_objlx6	1	success	200	1135	\N	2025-08-12 10:15:22.35
ed5bb6b2-14e1-498c-88f5-45869da65ff4	evt_objlx6	2	failed	404	773	Bad gateway	2025-08-12 10:16:22.35
109a3122-6875-4896-8088-865f2adfa81e	evt_fylht8	1	failed	404	1013	Internal server error	2025-08-05 20:37:09.574
ad40b558-92d1-4dab-a35d-c9a1202ce160	evt_15qzjq	1	success	200	1426	\N	2025-08-12 19:03:50.764
390964b6-88b2-4af2-b587-e7a78717f8f1	evt_15qzjq	2	success	200	1584	\N	2025-08-12 19:04:50.764
187f2a49-e2aa-40f6-baf5-26dbb993f78a	evt_15qzjq	3	success	201	1630	\N	2025-08-12 19:05:50.764
23cc1b31-dc92-4640-88d8-c6997e7e591d	evt_4r70x	1	success	200	1826	\N	2025-08-10 21:07:12.081
d18e3c33-ec6a-4431-9e01-84a17d2614e0	evt_4r70x	2	failed	500	410	Connection timeout	2025-08-10 21:08:12.081
5a5521ac-4d70-4b7f-8686-ef0c7e57983e	evt_sfjim9	1	success	200	242	\N	2025-07-29 23:26:21.663
b657ec37-f72f-49a3-a62b-be444114e8ef	evt_sfjim9	2	success	200	1498	\N	2025-07-29 23:27:21.663
dbe8492d-edda-4b35-9857-d9c53b835217	evt_sfjim9	3	success	200	1274	\N	2025-07-29 23:28:21.663
200bb5b0-07ec-43d9-b8f8-063c0e6a9308	evt_pe5s08	1	failed	500	1498	Internal server error	2025-08-02 11:05:31.312
73c2331e-76cc-44ae-9c0b-210166f1db4c	evt_pe5s08	2	success	200	1973	\N	2025-08-02 11:06:31.312
d4565a05-4017-4403-b9ca-724b53e7d852	evt_pe5s08	3	failed	404	1479	Invalid payload	2025-08-02 11:07:31.312
5b680796-fcea-4e96-b5ae-a3c2adaed079	evt_b553svo	1	success	200	1805	\N	2025-08-11 01:14:31.053
d4d62b65-ebc8-42b9-bedc-bf9e2b49ea52	evt_b553svo	2	success	200	579	\N	2025-08-11 01:15:31.053
d38cd53e-2eef-406a-a020-fead3f1d4cc6	evt_b553svo	3	failed	404	417	Bad gateway	2025-08-11 01:16:31.053
3b28e9bb-13d9-4c69-aa99-5e78cf784e5f	evt_3jxef	1	failed	500	613	Invalid payload	2025-08-05 00:29:52.977
b0be5d6a-092e-476c-bb96-1c23ad7d5130	evt_3jxef	2	success	200	1197	\N	2025-08-05 00:30:52.977
a05df9f5-ba67-487e-b697-37445d0bebf8	evt_3jxef	3	failed	500	612	Connection timeout	2025-08-05 00:31:52.977
5baf508a-9215-4217-a5ad-98d562475ffa	evt_to53	1	failed	500	1105	Connection timeout	2025-08-08 10:48:52.168
de721b68-c5ad-42d8-89f0-48d0a38033f0	evt_to53	2	success	200	275	\N	2025-08-08 10:49:52.168
048bc8e1-0e48-4a0c-8278-257b827e5d89	evt_rnkgv	1	success	201	1496	\N	2025-07-27 20:26:09.547
b80c0dd8-1771-4073-b8f9-4aa2ad499070	evt_tm86wq	1	success	200	993	\N	2025-08-08 03:07:22.598
dc948ca0-a928-455d-9349-738658928333	evt_tm86wq	2	success	200	1308	\N	2025-08-08 03:08:22.598
10cb96f1-139e-411e-85f3-0a7ef0a83fe3	evt_tm86wq	3	success	200	1097	\N	2025-08-08 03:09:22.598
89b09456-14e5-43b5-bc98-4d93a899e134	evt_3w2bmi	1	success	200	925	\N	2025-07-26 11:44:14.55
6f453943-d397-45ed-a561-26077095b53c	evt_3w2bmi	2	success	200	907	\N	2025-07-26 11:45:14.55
6aeebff7-5819-4d0d-b405-0b19e8a911c0	evt_3w2bmi	3	success	200	1977	\N	2025-07-26 11:46:14.55
856fb5d2-f9ba-4cf4-a840-f92539365f2b	evt_rzqqu2	1	success	200	234	\N	2025-08-13 13:26:02.808
eadd0f75-995d-4a57-b041-88a9d902ff39	evt_f084k	1	success	200	463	\N	2025-07-29 16:17:37.214
38d6fd5f-c196-4705-adc4-419dc45d9a3c	evt_f084k	2	success	200	1865	\N	2025-07-29 16:18:37.214
097a299e-5cc5-4d30-8848-8383c674c15d	evt_f084k	3	success	200	1375	\N	2025-07-29 16:19:37.214
d146eded-e01f-4220-a7ba-38d4ec324700	evt_wcrxc	1	success	200	1582	\N	2025-08-08 10:10:21.841
92e2592e-0f5e-4de7-928d-4ae63ac2cb5a	evt_jqlxtk	1	success	201	1644	\N	2025-08-01 20:55:13.854
99ca6a44-8da2-4b4e-9d14-37151b30956f	evt_jqlxtk	2	success	200	2099	\N	2025-08-01 20:56:13.854
1d735cd2-9f87-4152-afeb-61353a3ce044	evt_jqlxtk	3	success	200	2068	\N	2025-08-01 20:57:13.854
bb27651d-6c20-4f9a-9e60-33aac03596ad	evt_mvs9ll	1	success	200	1316	\N	2025-08-08 09:31:39.436
9df1e420-cbb8-41d1-b758-6bf5339f124d	evt_8hdhyg	1	success	201	395	\N	2025-08-22 14:41:59.834
2fe80797-3fdf-4854-93d3-34c8026c19de	evt_8hdhyg	2	success	200	331	\N	2025-08-22 14:42:59.834
b9c1ad31-016e-4b57-9a0c-a4dd51af8755	evt_86lhx9	1	success	200	362	\N	2025-08-11 10:17:21.81
1695ce87-f851-41a0-a848-e315efe2e751	evt_ec4qag	1	success	201	2099	\N	2025-07-30 21:31:56.877
9af5d7cb-d544-4085-835d-0bb50fd10218	evt_jydfkt	1	success	200	539	\N	2025-08-15 10:01:18.216
9e19704e-736f-4ce7-b707-7061e0003159	evt_jydfkt	2	success	200	1742	\N	2025-08-15 10:02:18.216
5b790640-7484-48bd-8eba-36642dfdd69c	evt_1pzib	1	success	201	416	\N	2025-07-25 10:37:37.217
89d26401-3905-438c-bb3a-aa497abdd994	evt_1pzib	2	success	200	1122	\N	2025-07-25 10:38:37.217
82babfbc-23a8-41da-ab46-50130b7b4e26	evt_1pzib	3	success	201	337	\N	2025-07-25 10:39:37.217
3b8e250f-d9ff-4425-b873-f331921cb345	evt_9fdog	1	success	200	1747	\N	2025-08-02 00:54:35.914
995269d8-607c-45f8-8483-a9ceafcb351e	evt_9fdog	2	success	201	1824	\N	2025-08-02 00:55:35.914
7fab6e83-78f4-4a08-a8c2-21acb2c32df3	evt_9fdog	3	failed	404	1573	Invalid payload	2025-08-02 00:56:35.914
2ae17278-e36c-400d-9d7a-7dc25ac09de3	evt_amcm62	1	success	200	288	\N	2025-08-08 13:58:46.132
48702121-02f6-4ce6-b490-c3fed22e23b4	evt_amcm62	2	success	200	1944	\N	2025-08-08 13:59:46.132
dd7f20ff-d8cd-44fe-ad78-fced3463b6bb	evt_amcm62	3	success	200	338	\N	2025-08-08 14:00:46.132
1ad47c9f-a9ed-4c30-a8b8-4bc1248d1fd1	evt_5fiiwl	1	failed	404	1201	Internal server error	2025-08-02 02:08:41.068
b78cad3b-3413-4548-861b-16607891fab7	evt_5fiiwl	2	failed	500	1087	Service unavailable	2025-08-02 02:09:41.068
78fcbbd5-bf50-434a-89ad-88a5ee5fe233	evt_fmwc3qg	1	success	200	1110	\N	2025-08-07 14:12:16.432
246c0b5f-39ff-417a-a9ba-cdcd23d23e51	evt_g68p5h	1	success	200	800	\N	2025-08-20 15:01:29.705
c7b410cc-f716-4a8d-879f-bc3a7631b895	evt_b2zcqb	1	success	201	1171	\N	2025-08-15 02:02:28.897
2ea84405-54d8-451c-8f2f-ab5d184e91b6	evt_b2zcqb	2	failed	500	386	Service unavailable	2025-08-15 02:03:28.897
2fe1ec90-d0dd-4ac7-a295-a27341d31562	evt_b2zcqb	3	success	200	818	\N	2025-08-15 02:04:28.897
9451407a-8e6c-4615-bc33-8f4b73fff9c8	evt_y11y2i	1	success	200	546	\N	2025-08-06 12:02:39.597
22c4ed0b-98c4-4cec-9e3e-c983e92386f8	evt_y11y2i	2	success	200	576	\N	2025-08-06 12:03:39.597
547d3ec3-ab6d-4ca8-85a4-317c74ea3a34	evt_y11y2i	3	success	201	738	\N	2025-08-06 12:04:39.597
c462999d-8d5c-4986-8b63-f69806b6b3ff	evt_h96j8	1	failed	404	817	Service unavailable	2025-08-10 19:28:46.008
6e606d20-ec38-46b3-b147-3891bfd5f222	evt_h96j8	2	failed	404	128	Bad gateway	2025-08-10 19:29:46.008
fed3391b-0e72-47a2-9ebc-4e95cca2bd0f	evt_s7qnqm	1	success	201	518	\N	2025-08-09 06:04:48.582
108c2e47-9fa7-4142-8153-af8dac09aff5	evt_s7qnqm	2	failed	500	745	Internal server error	2025-08-09 06:05:48.582
ee3f8c32-423b-41c0-ad4e-549d0cefc101	evt_s7qnqm	3	success	200	402	\N	2025-08-09 06:06:48.582
d20eca89-604d-4995-863e-f1509d4cb776	evt_dlwprv	1	success	200	790	\N	2025-08-16 03:56:43.913
b6038d09-47db-4bf8-9aea-ec48d179bb9b	evt_ss9wv	1	success	200	1541	\N	2025-08-05 15:46:38.959
86031c16-198e-492c-b4d9-bdc4f859bd29	evt_ss9wv	2	failed	500	476	Connection timeout	2025-08-05 15:47:38.959
4203f5b4-c0dc-4a7d-aa21-329b9754e8b4	evt_5vi4ti	1	success	200	1525	\N	2025-08-17 05:41:05.812
4aa23b98-fb90-4566-91f0-e5a5c0b48447	evt_5vi4ti	2	success	200	1857	\N	2025-08-17 05:42:05.812
18260194-7da5-47ac-bc16-e2263fea2789	evt_5vi4ti	3	success	200	1090	\N	2025-08-17 05:43:05.812
53a20908-bb8e-4da2-bb0e-646e5d45dba6	evt_gp2sj6	1	success	200	324	\N	2025-08-01 09:16:53.881
a2b15ddd-925b-4885-8811-28ed4251f42e	evt_gp2sj6	2	success	200	382	\N	2025-08-01 09:17:53.881
b086c490-f3d0-4bd5-a549-5da0df023750	evt_7txoxc	1	success	200	754	\N	2025-08-10 02:28:22.504
5850e1e1-2e8a-479a-92eb-a65824ee6203	evt_7txoxc	2	success	200	1774	\N	2025-08-10 02:29:22.504
d02890e5-8162-481a-8f7c-64ca3679a07a	evt_tmrzgi	1	success	201	1276	\N	2025-07-31 01:26:34.362
15aa76de-3e33-4d9d-8ace-a1135729023b	evt_brq6gp	1	success	200	561	\N	2025-08-06 06:20:54.447
4b82f724-5084-4d6f-a10c-3151afb26338	evt_brq6gp	2	success	200	661	\N	2025-08-06 06:21:54.447
b2d2e97a-1a74-4d8f-a4de-ddf3f9152307	evt_brq6gp	3	success	201	1082	\N	2025-08-06 06:22:54.447
1a0110c7-479a-4077-bbe3-274beec9442b	evt_1cmhpo	1	success	200	1890	\N	2025-07-31 13:35:12.601
22c56467-2e2b-4a83-9011-39c74804d4ed	evt_6y75j	1	failed	500	375	Invalid payload	2025-08-09 08:26:50.843
6fb9c65d-165d-44b5-bdf1-d270314877b5	evt_v62gjs	1	success	200	2021	\N	2025-08-08 19:15:37.214
62162d04-d053-401e-99de-87ea86dcd5be	evt_pxs9si	1	failed	500	1997	Bad gateway	2025-07-28 16:07:41.091
f5f159be-5035-4c1e-9f21-4fc284858938	evt_1mrjcg6	1	failed	500	678	Internal server error	2025-08-13 14:34:17.372
64842706-411f-411d-b46e-364b7b12d526	evt_76cwc	1	success	200	203	\N	2025-08-13 21:37:02.781
2ec525f6-0ae6-46d6-afbd-382d54f9ae91	evt_dm0otp	1	success	200	1770	\N	2025-08-16 08:45:28.447
8383e1b4-8407-47c8-84e2-77820af2a3a1	evt_1sg8kw	1	success	200	319	\N	2025-08-23 11:49:53.758
2b425289-0a3c-4378-92e2-c138a22ee810	evt_1sg8kw	2	failed	404	1522	Internal server error	2025-08-23 11:50:53.758
00bd5fee-3d2a-4a46-84c1-ac1e84f73739	evt_1sg8kw	3	failed	404	128	Bad gateway	2025-08-23 11:51:53.758
7c622c19-1775-495a-8e2b-480fd04646b9	evt_n8n6m7	1	success	200	994	\N	2025-08-17 17:08:58.658
afecf201-c183-4ef8-b498-896c1b736264	evt_of58c	1	failed	500	159	Invalid payload	2025-07-27 18:31:38.807
cf162a72-9566-4c35-8609-773d3e6c9341	evt_8ooxb	1	success	200	994	\N	2025-08-12 05:17:00.494
d8b99476-b86d-4891-a062-00c0a584ba1a	evt_lqc6p	1	success	200	1913	\N	2025-08-03 18:16:49.62
17486275-de0a-4c5d-a2f5-f0ce9f5e2d94	evt_lqc6p	2	success	200	1666	\N	2025-08-03 18:17:49.62
63fa1ced-eb15-4127-b790-c0d9e3d7047a	evt_ako5ib	1	success	200	1215	\N	2025-08-21 01:59:14.283
5a2e3c9b-765f-40ac-a369-d4a8e819d4b2	evt_ako5ib	2	success	200	1632	\N	2025-08-21 02:00:14.283
ba09555c-8363-4921-a6cb-d85e90b114ac	evt_ako5ib	3	failed	500	364	Service unavailable	2025-08-21 02:01:14.283
8621ad33-38a1-401f-85fc-bc5c2831de16	evt_a0smu9	1	failed	404	421	Connection timeout	2025-08-10 12:09:09.583
dff1623d-2e0d-41c4-a429-430a7a385ae4	evt_a0smu9	2	success	200	759	\N	2025-08-10 12:10:09.583
3de587b7-7eb2-4179-97a9-53554036daef	evt_a0smu9	3	success	200	831	\N	2025-08-10 12:11:09.583
7a54e02a-b163-45a3-af67-d89a200e224a	evt_or0ocfu	1	failed	404	1402	Internal server error	2025-08-16 23:53:01.296
2600ec13-8617-438a-8690-845eff4e76f6	evt_u3nmge	1	success	200	1166	\N	2025-08-19 00:43:27.24
33853909-bbd8-406f-b6d9-e08ba3ed5df9	evt_xvhjv9	1	success	200	543	\N	2025-08-22 15:35:57.19
fa848aea-b697-498f-901c-c849c99342a3	evt_xvhjv9	2	success	201	1828	\N	2025-08-22 15:36:57.19
56f2810b-2f0f-42ae-9460-4d4311d30fd1	evt_xvhjv9	3	success	200	1434	\N	2025-08-22 15:37:57.19
6bcf3277-345e-4d11-9d07-86046883e25d	evt_93fn6r	1	success	200	1633	\N	2025-07-25 09:28:54.288
70886886-8bcc-4c14-bf64-ccf580b4e21a	evt_93fn6r	2	success	200	413	\N	2025-07-25 09:29:54.288
29ee1c70-2869-49ae-bff9-4299937c93ed	evt_bfzsxp	1	success	200	1468	\N	2025-08-14 05:19:27.162
930cee5c-e206-4ff5-88e7-83106515734b	evt_bfzsxp	2	success	200	544	\N	2025-08-14 05:20:27.162
44836f30-bfcf-4e59-a4d3-d885f2227643	evt_bfzsxp	3	success	200	809	\N	2025-08-14 05:21:27.162
0a55a77b-e62c-40cd-863a-461939a14905	evt_xgrvy	1	success	200	1195	\N	2025-08-18 06:15:20.598
ec29d134-b25b-4194-bd90-82eb66065724	evt_m8icom	1	success	201	1348	\N	2025-08-06 14:58:44.429
18df1b7d-c150-4ee0-9c82-9b60998ed2f3	evt_m8icom	2	success	200	238	\N	2025-08-06 14:59:44.429
6fe2b87f-5708-4856-a6c9-45784114ccf9	evt_9zkjaa	1	success	200	1615	\N	2025-07-25 21:13:46.28
84922619-c5cb-4cde-985e-26b17b6629e3	evt_9zkjaa	2	failed	404	166	Connection timeout	2025-07-25 21:14:46.28
d90333f3-3b5b-4c59-851a-d61c62f2e645	evt_0o9i5j	1	failed	404	1958	Connection timeout	2025-07-25 22:30:06.093
a0684ebc-501d-4185-8841-adea70672236	evt_gdwot	1	success	200	1860	\N	2025-08-05 19:55:55.296
d6adde46-9341-4c98-bb24-d46fba7b9012	evt_gdwot	2	failed	404	731	Internal server error	2025-08-05 19:56:55.296
46758aef-5248-4fd4-85f8-f94338cd9694	evt_8vx59	1	success	200	391	\N	2025-08-11 19:39:56.769
a0723471-6505-4ef1-af51-ae000ff7f709	evt_8vx59	2	success	200	997	\N	2025-08-11 19:40:56.769
26113235-7e6e-423a-a9f2-e22ad4c41abf	evt_8vx59	3	success	200	1588	\N	2025-08-11 19:41:56.769
7861cbed-8443-4f1b-b125-7ae0a17f6fdc	evt_1feb3	1	success	200	1528	\N	2025-07-29 07:39:28.152
79725a95-7592-499f-9e60-60c496aa4eca	evt_1feb3	2	failed	500	1033	Invalid payload	2025-07-29 07:40:28.152
b5b80c99-3eee-49e6-b40f-b632d23fc552	evt_1feb3	3	failed	500	2064	Service unavailable	2025-07-29 07:41:28.152
074a869f-2593-4c3b-9cbc-dfc10952ef5e	evt_pazsz5	1	success	201	1668	\N	2025-08-08 08:52:09.808
d9a9b1ae-677f-4d31-a2c4-2f69f56866d6	evt_pazsz5	2	failed	500	247	Bad gateway	2025-08-08 08:53:09.808
52f71875-3a93-4643-a6d8-62661b501d98	evt_0curhq	1	failed	500	1019	Internal server error	2025-08-11 21:00:08.264
ca344608-0a6c-410e-9d85-41bd2b134295	evt_0curhq	2	success	200	1229	\N	2025-08-11 21:01:08.264
3c26b7cc-5b20-4fed-8e67-1ec916bc2da8	evt_ua8e88	1	success	200	442	\N	2025-08-09 01:10:55.906
87ded469-c2e1-4e96-8b2e-99d722f42e4d	evt_ua8e88	2	success	200	1219	\N	2025-08-09 01:11:55.906
92120566-9ba4-474b-8ea3-45dc6e51eeb1	evt_ua8e88	3	success	200	1176	\N	2025-08-09 01:12:55.906
840bb261-5269-4b67-b5a8-d07e0341de11	evt_f1kl7v	1	success	200	518	\N	2025-08-07 10:25:49.538
a6817e88-8bf1-4673-803a-9a69f348ee33	evt_f1kl7v	2	success	200	1810	\N	2025-08-07 10:26:49.538
99df955c-cab4-48a2-ab97-ccaf34dc67bb	evt_f1kl7v	3	success	201	795	\N	2025-08-07 10:27:49.538
aa42c0ab-a76c-4fb9-a933-cac6e56108c4	evt_pfz2gn	1	failed	500	1220	Invalid payload	2025-07-26 21:00:58.074
ae6cf7a7-ed06-4751-b0cc-2a72ebfbce11	evt_kvuota	1	success	200	511	\N	2025-07-27 05:46:23.846
854852aa-4d2e-4297-bf3a-b43a149a697b	evt_htawir	1	success	200	1610	\N	2025-08-19 18:10:52.85
15902533-7c67-41de-b8ef-1086904c51c2	evt_htawir	2	failed	404	1530	Bad gateway	2025-08-19 18:11:52.85
6b0a744b-3059-4aff-90b0-1f7afc9fff21	evt_htawir	3	success	200	2020	\N	2025-08-19 18:12:52.85
0e9af4bb-1c60-4961-9ddc-bcc8cb652984	evt_zt27tc	1	success	201	1874	\N	2025-07-27 04:44:31.949
433db968-7ee5-48d6-8343-c96de229e3be	evt_wnzu4j	1	success	200	902	\N	2025-08-20 19:26:18.702
2e11b5b4-c594-4992-aef6-89b1966424c4	evt_wnzu4j	2	success	200	1154	\N	2025-08-20 19:27:18.702
552c0d62-7881-4e45-a0ed-a275cac4bddf	evt_wnzu4j	3	failed	404	1578	Connection timeout	2025-08-20 19:28:18.702
e69c6de2-653e-4eb4-b879-8c4d5308f3e7	evt_nf2cup	1	success	201	1751	\N	2025-07-28 11:41:20.653
0e0d640e-f589-4a6c-91e1-bd4a647325dc	evt_nf2cup	2	success	200	1736	\N	2025-07-28 11:42:20.653
47e96dee-5333-47df-95d7-d0803cc96c0b	evt_nf2cup	3	success	200	919	\N	2025-07-28 11:43:20.653
e2b423bb-4bff-43f9-92d8-df2f9cf93e17	evt_xprpnm	1	success	200	249	\N	2025-07-30 01:04:37.081
8094fa0b-1366-41d8-a894-94c6439df8d0	evt_xprpnm	2	success	200	1230	\N	2025-07-30 01:05:37.081
06e455b6-ceba-4be9-9661-fd9a6f7abf9b	evt_olam4s	1	success	200	1386	\N	2025-08-16 20:04:28.797
d5dddf05-0df2-45c7-bf57-a84fbf7a27d6	evt_olam4s	2	failed	404	782	Service unavailable	2025-08-16 20:05:28.797
824e46b0-7922-41da-86c7-25859ee67fd9	evt_h9jb8t	1	success	200	1611	\N	2025-08-16 04:59:02.008
8b5b48d2-5073-48c1-84f2-cf3a1c5ac2af	evt_uiladh	1	failed	500	2031	Service unavailable	2025-08-21 08:15:59.505
2a1dd6fc-c9ef-490a-8230-1af51dcb8190	evt_uiladh	2	success	200	1879	\N	2025-08-21 08:16:59.505
58a4c92f-a8ec-4bfe-a477-b075a03546a7	evt_uiladh	3	success	200	587	\N	2025-08-21 08:17:59.505
242f6a9d-32c1-449e-9ceb-bada9d946835	evt_xzrwfa	1	success	200	1715	\N	2025-08-02 19:10:37.291
d5679f4c-83ef-40f0-8ffe-b007f42ac6e7	evt_xzrwfa	2	success	200	108	\N	2025-08-02 19:11:37.291
01980af1-b0eb-447e-9eb1-a6c09cc02e65	evt_xzrwfa	3	success	200	1501	\N	2025-08-02 19:12:37.291
a684f424-b5e6-4f0c-bb2a-51be1cd258cc	evt_0y882nd	1	success	200	1518	\N	2025-08-19 11:59:04.199
701674c7-594d-4d10-ad14-176f09ff2493	evt_jr3yuh	1	success	201	2097	\N	2025-08-08 18:44:29.426
6cafcabd-a910-4447-b21e-a2ddb4d032ef	evt_jr3yuh	2	success	200	417	\N	2025-08-08 18:45:29.426
61771359-b4b0-41b1-aca1-eb619e76c139	evt_v152ss	1	success	200	147	\N	2025-08-15 02:28:12.432
bfbb0fe6-ab24-488b-8360-64a6a7a8461f	evt_2icovn	1	failed	404	968	Service unavailable	2025-08-03 18:32:11.453
77fdfced-f638-4da7-abf6-38c95affb202	evt_2icovn	2	success	200	515	\N	2025-08-03 18:33:11.453
2865455e-8c3d-4eb0-a626-556f57e09924	evt_2icovn	3	success	200	965	\N	2025-08-03 18:34:11.453
b53a08c0-9227-4b76-902f-020a361de180	evt_omgzkd	1	success	201	218	\N	2025-07-26 17:36:01.461
5b04d830-1f6a-48b6-9e1c-23a06464e58c	evt_cf980s	1	success	200	1014	\N	2025-08-23 09:52:42.616
9f3d01fd-4fe9-4b33-b1d0-2d1673e2c8fd	evt_cf980s	2	success	200	523	\N	2025-08-23 09:53:42.616
641c5c85-9c20-4309-8aae-bdc1de4f88cc	evt_cf980s	3	success	200	1932	\N	2025-08-23 09:54:42.616
56c36285-d4bf-427c-816a-a2ad59c8dd58	evt_k5q60n	1	success	200	1448	\N	2025-08-07 09:01:36.619
3c9c4392-1d55-41a1-acac-86d369843790	evt_og2o5m	1	success	200	933	\N	2025-07-28 15:50:49.967
3bbfbbbc-3999-4cd2-a3e5-03eb170f0367	evt_e9zvig	1	success	200	1959	\N	2025-08-07 05:18:59.539
b42c05d5-50c5-4ebc-b1b0-112735b3ff8d	evt_e9zvig	2	success	200	128	\N	2025-08-07 05:19:59.539
34e009b6-17ab-463f-962a-5a138b7c7dd8	evt_e9zvig	3	failed	500	150	Connection timeout	2025-08-07 05:20:59.539
74f8ff4b-52d5-4a39-b8bc-4f484b3bf7ea	evt_8dalcu	1	success	200	1361	\N	2025-08-05 05:28:54.242
75082342-1ea4-4274-85d5-06fe2018a29b	evt_8dalcu	2	failed	500	1061	Invalid payload	2025-08-05 05:29:54.242
f6ca9b70-6517-4a4c-917c-7f96d1872273	evt_pk9k8	1	success	201	1048	\N	2025-07-29 10:59:18.739
f4aeb2ab-61bd-4a81-9f78-bbf0fdd271d1	evt_pk9k8	2	success	200	1082	\N	2025-07-29 11:00:18.739
d120a673-e73e-4d8e-8e83-4a0e5404f071	evt_pk9k8	3	failed	500	1718	Internal server error	2025-07-29 11:01:18.739
3737261f-fcf9-46fd-b490-34f2d21f4c98	evt_o3onzd	1	success	200	140	\N	2025-08-20 11:18:44.761
1e435cf2-65ef-48af-87a1-7b02827a4a13	evt_o3onzd	2	success	200	1369	\N	2025-08-20 11:19:44.761
0c53533d-2bc6-42a3-9dc4-3976ccd3d4bf	evt_js1lsn	1	success	200	1439	\N	2025-07-29 00:18:36.346
aeb6a55f-147f-4e51-91fe-e385e1eabe30	evt_js1lsn	2	success	200	1055	\N	2025-07-29 00:19:36.346
35771d0e-d0b3-4bad-aa06-f0e63ab5d8b6	evt_sspp6	1	success	200	1144	\N	2025-07-25 15:10:24.359
a40f282c-26b7-4a99-a0f7-39d0f259ce2d	evt_sspp6	2	failed	500	2002	Service unavailable	2025-07-25 15:11:24.359
8518702c-8315-4b5c-9677-56b88072107a	evt_sspp6	3	success	200	2085	\N	2025-07-25 15:12:24.359
ac9dfad5-4b95-4f76-9a99-323ed0d701d4	evt_20e4br	1	success	200	1386	\N	2025-08-18 02:22:22.51
d34e36e7-725c-44b2-bcdf-26c04ab6c358	evt_20e4br	2	success	200	1415	\N	2025-08-18 02:23:22.51
cdd2ea4a-b00a-428f-95d6-7cd6ce2cd672	evt_20e4br	3	failed	404	1391	Invalid payload	2025-08-18 02:24:22.51
75756322-c73f-4474-b9b6-06b3f6f42d74	evt_ngpjj8	1	success	200	1726	\N	2025-07-28 02:19:19.315
b805bbe9-be95-4e84-ba4d-a8efcf6ab2c4	evt_ngpjj8	2	failed	500	471	Service unavailable	2025-07-28 02:20:19.315
42e1da83-9067-48d6-8cf0-202e6bede812	evt_ngpjj8	3	success	200	570	\N	2025-07-28 02:21:19.315
446c2c0c-69ea-4c85-88e6-6b0b20976f7a	evt_cu7ud	1	success	200	414	\N	2025-08-23 07:49:42.894
e4210f17-4534-4360-8f17-eae6d7db8b65	evt_xn5yap	1	success	200	1284	\N	2025-07-26 23:25:52.794
1c3a22a6-f9e6-4f4f-800b-a20b84b08c39	evt_xn5yap	2	success	200	1461	\N	2025-07-26 23:26:52.794
074eab15-c78e-4c52-9c76-268a1fea55cd	evt_lnvdl	1	success	200	440	\N	2025-07-27 23:02:45.632
5a758410-7fcd-42e4-95ab-ba9a1334805f	evt_g5fhvt	1	success	200	1342	\N	2025-08-04 15:05:15.631
2819eb15-09df-4eba-8530-09bb61c14f5b	evt_g5fhvt	2	success	200	1705	\N	2025-08-04 15:06:15.631
59c05288-b2e8-40d0-954a-c7ee1f33cef2	evt_g5fhvt	3	success	200	1792	\N	2025-08-04 15:07:15.631
81168d64-c5b1-4450-ade6-8ac481d45f10	evt_3ftgjw	1	success	200	1288	\N	2025-08-10 15:18:09.167
b7907055-5d38-4fd9-a385-d5ead5ee9f2f	evt_yw5qt2	1	success	200	974	\N	2025-08-12 00:23:58.592
50740838-f6c5-419b-b1ca-ab69431f157b	evt_jhsqkh	1	success	200	1321	\N	2025-08-09 08:48:18.066
cfa533bc-a579-46c5-a118-ebcbcf774dab	evt_jhsqkh	2	success	200	711	\N	2025-08-09 08:49:18.066
ef01d4a5-5ee4-4e61-8695-0c4afbe71998	evt_dpd388	1	success	200	136	\N	2025-08-14 15:57:01.996
c8988241-cbdc-4a45-8386-8168c571effb	evt_dpd388	2	success	200	236	\N	2025-08-14 15:58:01.996
14906fcf-01a8-4156-b631-1daa4de43ee5	evt_jjquc	1	success	200	1459	\N	2025-07-25 02:42:18.584
0148f50c-0fc7-412c-a4c8-8f214b055014	evt_jjquc	2	failed	500	906	Service unavailable	2025-07-25 02:43:18.584
c33ec66c-b347-4873-80bc-0c046ff11a79	evt_pskl2	1	success	200	884	\N	2025-07-25 03:45:15.395
247b06e8-d082-41ca-aa88-6f396515854a	evt_pskl2	2	success	200	1993	\N	2025-07-25 03:46:15.395
2d8cd9c1-448c-463a-8cd6-0ea56957101a	evt_bf7m7fn	1	failed	404	1013	Service unavailable	2025-08-03 10:00:02.828
ce75b064-c8e0-47eb-8a70-8908ebe7d477	evt_bf7m7fn	2	success	200	1271	\N	2025-08-03 10:01:02.828
1bd03451-9aec-4ab2-a381-ed7621001015	evt_bf7m7fn	3	success	201	208	\N	2025-08-03 10:02:02.828
1fcdb162-f81f-404a-af19-8226becb9d60	evt_di2yjh	1	success	200	1326	\N	2025-08-13 15:22:05.549
1f1d71c8-586a-4dce-9efd-842d52fb8d72	evt_di2yjh	2	failed	500	363	Service unavailable	2025-08-13 15:23:05.549
b959a38c-7257-4604-9f46-f40da4e0c1a4	evt_3haxlg	1	success	201	1237	\N	2025-08-12 21:26:20.835
2e4723e8-643f-4f07-9a74-3422d245b3d1	evt_3haxlg	2	success	200	1361	\N	2025-08-12 21:27:20.835
19272833-2651-49e7-b7ec-9f0340ede18f	evt_mjabtt	1	success	200	628	\N	2025-08-11 04:48:58.007
1f4d3eb1-82e9-4441-ac26-78b07f95a7dc	evt_q1firl	1	success	200	1176	\N	2025-08-18 03:06:14.457
30d988b6-bc08-429c-a2b1-2ea7bd251960	evt_tqftm	1	success	200	1286	\N	2025-08-15 05:12:01.145
ff481161-d7a5-4153-ae16-d8da82d3d455	evt_a61q7	1	success	200	185	\N	2025-08-18 08:24:16.919
484ca05a-9979-459c-a46b-0bb3086f40d5	evt_xnr1we	1	success	200	1533	\N	2025-08-20 11:43:58.799
8bf3e840-c127-4575-a3af-67f3411bb846	evt_u2jh5m	1	success	201	2079	\N	2025-08-02 10:41:52.051
43948a01-e936-48b3-8113-192d3c5e5cf7	evt_u2jh5m	2	success	200	205	\N	2025-08-02 10:42:52.051
5513d163-0fba-46ba-96fd-923f78b4728b	evt_u2jh5m	3	success	200	1240	\N	2025-08-02 10:43:52.051
85627ed1-2fd4-4fef-9e52-d6101a75a456	evt_fm8bb9	1	success	201	2049	\N	2025-08-22 13:53:38.709
56879367-229a-4ed4-9a85-0659d403692d	evt_4mwo19	1	success	200	107	\N	2025-08-05 04:25:25.9
3537568b-23fc-4c49-a28e-fa9acb6b17b5	evt_4mwo19	2	failed	404	1133	Bad gateway	2025-08-05 04:26:25.9
b5cfa150-b5ab-4e1d-acd9-e022a6ee938e	evt_vt4fy	1	failed	500	737	Invalid payload	2025-08-02 03:17:00.45
6507d4a5-e328-4e61-8c40-5d4f20a023f6	evt_amcb8	1	success	200	1625	\N	2025-08-22 05:51:49.697
a1a26124-2f14-4cff-ad34-d012e73d7f93	evt_8v4p0n	1	success	200	1716	\N	2025-07-26 22:13:35.816
84205eaa-9a96-4340-bfca-2f06cffc31d8	evt_30fp4f	1	success	201	684	\N	2025-08-08 03:05:51.206
68db17a2-b85d-4cd6-939a-6c2f82d356ce	evt_30fp4f	2	failed	500	270	Bad gateway	2025-08-08 03:06:51.206
ecd788f0-8825-4e92-8637-a5423a6ae183	evt_mudgcf	1	success	200	693	\N	2025-08-01 12:34:51.829
88c87a6d-c7bb-49d2-ae45-d40097aaea69	evt_mudgcf	2	success	200	1620	\N	2025-08-01 12:35:51.829
8f7d1475-743c-4c06-970f-88b71bee7fdc	evt_sp3itj	1	success	200	1739	\N	2025-07-27 03:12:50.501
916651b3-92d2-44e3-bc50-f72f370fadd3	evt_sp3itj	2	success	200	1553	\N	2025-07-27 03:13:50.501
c810d94d-43fc-4c14-899d-cfcc7fdd27a4	evt_pnl9r6	1	success	200	1736	\N	2025-08-07 19:24:45.162
c11ebb36-d388-469a-8965-66e7fb896593	evt_wbo8vc	1	success	200	1171	\N	2025-08-07 21:25:24.433
4844007d-c5ee-4755-9320-65a115130116	evt_j2wks	1	failed	500	1022	Bad gateway	2025-08-07 08:13:45.012
315af515-c41d-45d6-8274-150064154279	evt_0svtec	1	success	200	303	\N	2025-08-05 01:59:53.254
b78cc0e8-7d35-4938-ae70-46048079e19e	evt_0svtec	2	success	200	1953	\N	2025-08-05 02:00:53.254
f42e75da-f590-4f3a-aeff-a52d59523ad8	evt_0svtec	3	failed	500	1484	Bad gateway	2025-08-05 02:01:53.254
564fa87d-36ed-4429-ae4f-b5213529a530	evt_jvvov	1	success	200	1742	\N	2025-08-10 13:54:33.158
457cb3c4-24eb-4e2e-9d70-39fb47d4c298	evt_vkxop	1	success	200	1153	\N	2025-07-29 11:07:10.264
0cd23559-c49e-4c9d-b6ba-98ff0bfb6a3b	evt_vkxop	2	success	200	598	\N	2025-07-29 11:08:10.264
92a959a8-0c79-4dc0-9b4a-2769451b8cbc	evt_g9ugdn	1	success	200	1377	\N	2025-08-01 05:33:31.492
2121ab64-6d9e-4e2b-a48c-ae311011bc13	evt_g9ugdn	2	failed	500	1578	Bad gateway	2025-08-01 05:34:31.492
5807579e-281c-41be-9b7d-a1b7f84104dc	evt_ysf20i	1	success	200	1748	\N	2025-08-20 03:42:31.865
53ea33a5-42f6-42a0-ad72-b9561f7c46e2	evt_ysf20i	2	success	200	1986	\N	2025-08-20 03:43:31.865
45ab7b82-d25c-4806-b371-35e406fdf57a	evt_ysf20i	3	failed	500	1561	Bad gateway	2025-08-20 03:44:31.865
c145cf53-95e7-4ed0-93fa-9fe155ce3b94	evt_4psu0o	1	success	200	1103	\N	2025-08-06 16:41:49.544
e473fa9c-617c-49dc-90c0-160752e425dd	evt_4psu0o	2	success	200	1232	\N	2025-08-06 16:42:49.544
94645dd4-9047-461b-aec0-4ecc459371c0	evt_4psu0o	3	success	200	1007	\N	2025-08-06 16:43:49.544
6c816d48-7406-47b6-9f7c-a71d428477e6	evt_uy8bwd	1	success	200	662	\N	2025-08-11 20:27:22.61
a6904ddd-6c72-4176-8769-00e1f941c6a4	evt_uy8bwd	2	success	200	1162	\N	2025-08-11 20:28:22.61
abbaddda-1599-418c-b450-ca7d2461aebc	evt_uy8bwd	3	success	200	1454	\N	2025-08-11 20:29:22.61
7754740e-a26a-497f-b18a-46a9586ca710	evt_7j5vog	1	success	200	249	\N	2025-08-11 00:13:24.969
dea19ab8-cb5e-45ac-8fe6-324e40b10cf8	evt_7j5vog	2	success	200	1789	\N	2025-08-11 00:14:24.969
39cb1516-2a95-4cfc-9012-298b27424a9d	evt_4dsek	1	success	200	1500	\N	2025-07-30 10:05:20.544
044ff7e7-6f55-437b-9f29-4a1fa25791f9	evt_8n1a6pn	1	success	201	1455	\N	2025-08-02 16:17:04.9
25c44391-3c67-40fd-b3ad-2bca683f2c55	evt_em6qer	1	success	200	715	\N	2025-08-07 14:41:36.183
5636f9c8-c646-4866-afca-0f07f8c9341c	evt_em6qer	2	success	200	1352	\N	2025-08-07 14:42:36.183
feb8dcc3-9d0a-46ce-b104-d4d38c84a244	evt_cxzwf	1	success	200	1935	\N	2025-08-09 23:46:19.873
e8befa1d-b7f5-4f53-99dc-a8e13d9e74f3	evt_cxzwf	2	success	200	1525	\N	2025-08-09 23:47:19.873
013736a9-e09f-40a8-91c5-75089ad36c09	evt_cxzwf	3	failed	500	793	Bad gateway	2025-08-09 23:48:19.873
b0e4a74a-cf2d-44fe-aea0-fafdaf2d24aa	evt_bktb0l	1	success	200	510	\N	2025-07-25 16:23:48.488
6c20b744-dba9-4368-b4da-7e96a53ca09d	evt_bktb0l	2	success	201	282	\N	2025-07-25 16:24:48.488
a59755a8-39e5-41e3-a80c-761cd3d10f9e	evt_ytijc	1	success	200	1546	\N	2025-08-19 04:35:21.861
2f778884-9dc6-466a-96a1-70c327c8a7b9	evt_ytijc	2	success	200	1753	\N	2025-08-19 04:36:21.861
3cc582ec-f9cb-4b1e-8914-65b310e863b0	evt_w032sg	1	success	200	730	\N	2025-07-29 21:11:59.576
fd010f2a-4e90-424f-b5d4-ab39dedaaec4	evt_sug1y8y	1	failed	404	2039	Connection timeout	2025-07-25 14:00:29.514
4c3e3be4-900e-44ae-9f6a-b289193deb8b	evt_oskad9	1	success	200	1339	\N	2025-08-22 15:59:00.883
f7d02fac-371d-455e-9181-34b61b6628dc	evt_oskad9	2	success	200	662	\N	2025-08-22 16:00:00.883
e5c18522-e640-45a3-a682-458ccf13cb69	evt_oskad9	3	failed	404	1321	Service unavailable	2025-08-22 16:01:00.883
1f66df66-c165-4b2b-a197-5551b6020d72	evt_1wbfo	1	success	200	1034	\N	2025-07-30 09:51:53.824
c00c0b39-20e0-423e-9179-71e6e223686b	evt_1wbfo	2	success	200	612	\N	2025-07-30 09:52:53.824
d31da24e-1612-4e96-8100-ff343ff6db23	evt_1wbfo	3	success	200	620	\N	2025-07-30 09:53:53.824
7fd1ed58-f15c-49ca-857d-8498cf505b8b	evt_n8fjsn	1	success	200	1372	\N	2025-07-25 17:39:17.565
32f670f3-7c69-4109-a347-e45b9d49fd02	evt_zaykdf	1	success	200	501	\N	2025-08-10 08:02:08.561
c42a8c1c-13c9-4535-8ae3-8f030c56b5a0	evt_swrmzr	1	success	200	2010	\N	2025-08-21 14:29:36.752
f2c68f3a-5d19-46b9-b6cb-c9323938ce21	evt_0k4dc	1	success	201	609	\N	2025-08-10 10:15:50.376
f5d2265b-1cd9-431f-a792-97a1307d1b23	evt_0k4dc	2	success	200	139	\N	2025-08-10 10:16:50.376
f50a46c7-520f-4cf1-8663-7e0183837b46	evt_0k4dc	3	failed	500	1859	Invalid payload	2025-08-10 10:17:50.376
80e5c392-2ca0-45c7-9e49-8e76c9e96ff3	evt_3h44y6	1	success	200	354	\N	2025-08-18 07:25:44.558
fa787c22-f9a5-44e1-a29d-d8fe2f1b5399	evt_3h44y6	2	success	201	1829	\N	2025-08-18 07:26:44.558
e08654ad-38dd-4fa3-9c65-b6077760ddc2	evt_3h44y6	3	success	200	764	\N	2025-08-18 07:27:44.558
b5ef1b62-00e2-4b89-92b2-3ba4dbf7006e	evt_dyq73i	1	success	200	991	\N	2025-07-28 10:47:26.119
905d5549-332c-4629-baf4-f75dc369de4e	evt_dyq73i	2	failed	404	1986	Service unavailable	2025-07-28 10:48:26.119
ac3876e7-f5c3-4792-a737-b30298ac7964	evt_u4wf9s	1	success	200	1298	\N	2025-08-01 09:37:10.205
7e24cb7b-9468-4fc1-bb77-b0f88b1caa3b	evt_u4wf9s	2	failed	500	552	Internal server error	2025-08-01 09:38:10.205
ceb9906a-9b26-4156-b83a-75723be44fb7	evt_mreq7r	1	failed	500	742	Internal server error	2025-08-19 09:03:35.122
ee074735-89bf-429f-a1b4-cc531af813b5	evt_uzzhuj	1	success	200	473	\N	2025-08-06 04:25:46.925
986c513a-9ae8-4b42-be1e-c28bad1e2559	evt_uzzhuj	2	failed	404	1338	Bad gateway	2025-08-06 04:26:46.925
1fc2ed8a-de7c-4107-84b3-69ad0546dd0f	evt_dwya7	1	success	200	845	\N	2025-08-22 06:57:58.599
c30f6ce0-3ac9-456a-97ef-76ed7c9e54d3	evt_dwya7	2	success	200	563	\N	2025-08-22 06:58:58.599
dc8c79f5-d23b-4665-a4d1-546ef96594ed	evt_j1fi1n	1	success	200	564	\N	2025-07-31 06:55:34.57
ca1ac34e-283c-4a32-a5b8-837244764958	evt_j1fi1n	2	success	200	1801	\N	2025-07-31 06:56:34.57
0793f010-f4bb-4f22-bd38-3f676017c56e	evt_j1fi1n	3	success	200	513	\N	2025-07-31 06:57:34.57
8bc19b59-dfef-4fa6-8c99-fbdadd805399	evt_brt6lf	1	failed	404	1621	Service unavailable	2025-08-19 23:10:35.407
360ad976-9c7a-4034-944a-b4879cdae8ff	evt_brt6lf	2	success	200	853	\N	2025-08-19 23:11:35.407
7f5eb04d-38b3-418a-b877-2789f00cb74b	evt_qlb6zl	1	success	200	542	\N	2025-07-27 19:42:17.407
94a410b9-09bc-452e-969b-c417c06b5608	evt_qlb6zl	2	success	200	1377	\N	2025-07-27 19:43:17.407
38422c0d-365b-4c56-9cd5-d4450487090c	evt_fh3pt3	1	success	201	1576	\N	2025-08-17 05:32:46.172
24bddbcc-00a9-4f94-9d2e-8f834e39a06b	evt_fh3pt3	2	success	200	1576	\N	2025-08-17 05:33:46.172
6f7d1aaf-94a7-4755-9b73-b7eda460fe2b	evt_3oavpp	1	success	200	832	\N	2025-08-08 20:57:00.29
81358dcb-0be6-4205-ac70-9fa32f7ea1a1	evt_3oavpp	2	success	200	1773	\N	2025-08-08 20:58:00.29
2f1c3320-aadf-49a3-be74-53c917d167cf	evt_aasdab	1	success	200	1903	\N	2025-08-19 18:03:52.969
453294bc-545e-491a-8b40-01c22b1837df	evt_15h11	1	success	200	380	\N	2025-08-03 20:09:09.954
ccfc3eb1-bb7b-4635-98ed-a9e9a1e0689c	evt_7h7ygm	1	success	200	417	\N	2025-08-04 11:43:30.258
7deab9e0-1b96-439b-a84b-afece672393d	evt_dg11no	1	success	200	847	\N	2025-08-01 04:21:19.354
82bd5fb2-e797-458a-8701-1f259305f7f2	evt_dg11no	2	success	200	1349	\N	2025-08-01 04:22:19.354
04f81736-b405-4fd4-9d68-6a32696df091	evt_khdqfe	1	success	201	146	\N	2025-08-22 12:50:47.716
1585f56d-d02f-42e0-a2e8-2b91159ec0b2	evt_khdqfe	2	failed	404	1315	Internal server error	2025-08-22 12:51:47.716
59e88eb6-72c7-457c-bc57-f7d3ee15e1c4	evt_khdqfe	3	success	200	323	\N	2025-08-22 12:52:47.716
0d3e4924-bc74-4cdd-9010-7e25389dda7c	evt_jev57u	1	success	200	1918	\N	2025-08-05 10:39:02.101
16aa931d-2175-4a30-9d76-b36f189bdb9f	evt_8g5rzd	1	success	200	1812	\N	2025-08-20 03:00:00.734
3a3bfeac-66ec-4db7-b9f5-bf412157a292	evt_abdong	1	success	200	1179	\N	2025-08-18 08:04:45.435
93daf333-c9ac-403e-b330-400c451e81ef	evt_abdong	2	failed	500	1175	Internal server error	2025-08-18 08:05:45.435
\.


--
-- Data for Name: webhook_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhook_events (id, webhook_id, source, event_type, payload_json, created_at, delivered_at) FROM stdin;
evt_htawir	wh_stripe_payments	seed_script	sms.delivered	{"id": "obj_k9ubyo", "data": {"amount": 2932}, "type": "test_event"}	2025-08-19 18:10:52.85	\N
evt_zt27tc	wh_mailchimp	seed_script	email.delivered	{"id": "obj_f123a8", "data": {"amount": 5916}, "type": "test_event"}	2025-07-27 04:44:31.949	\N
evt_wnzu4j	wh_sendgrid_email	seed_script	email.bounce	{"id": "obj_czwczo", "data": {"amount": 2972}, "type": "test_event"}	2025-08-20 19:26:18.702	\N
evt_nf2cup	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_bueelo", "data": {"amount": 8533}, "type": "test_event"}	2025-07-28 11:41:20.653	\N
evt_xprpnm	wh_analytics	seed_script	sms.delivered	{"id": "obj_63tgz9", "data": {"amount": 8684}, "type": "test_event"}	2025-07-30 01:04:37.081	\N
evt_olam4s	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_adr7ij", "data": {"amount": 3841}, "type": "test_event"}	2025-08-16 20:04:28.797	\N
evt_h9jb8t	wh_mailchimp	seed_script	payment.failed	{"id": "obj_44lvsl", "data": {"amount": 2492}, "type": "test_event"}	2025-08-16 04:59:02.008	\N
evt_uiladh	wh_mailchimp	seed_script	user.registered	{"id": "obj_hm277", "data": {"amount": 3369}, "type": "test_event"}	2025-08-21 08:15:59.505	\N
evt_xzrwfa	wh_stripe_payments	seed_script	sms.failed	{"id": "obj_okbx8", "data": {"amount": 2432}, "type": "test_event"}	2025-08-02 19:10:37.291	\N
evt_0y882nd	wh_mailchimp	seed_script	analytics.track	{"id": "obj_2npcqa", "data": {"amount": 5108}, "type": "test_event"}	2025-08-19 11:59:04.199	\N
evt_jr3yuh	wh_mailchimp	seed_script	payment.succeeded	{"id": "obj_sv8oaf", "data": {"amount": 3154}, "type": "test_event"}	2025-08-08 18:44:29.426	\N
evt_v152ss	wh_twilio_sms	seed_script	sms.failed	{"id": "obj_64vpoq", "data": {"amount": 2202}, "type": "test_event"}	2025-08-15 02:28:12.432	\N
evt_3w2bmi	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_mvnp7", "data": {"amount": 6100}, "type": "test_event"}	2025-07-26 11:44:14.55	\N
evt_rzqqu2	wh_mailchimp	seed_script	email.delivered	{"id": "obj_gidhyf", "data": {"amount": 3495}, "type": "test_event"}	2025-08-13 13:26:02.808	\N
evt_f084k	wh_mailchimp	seed_script	user.registered	{"id": "obj_s31v2", "data": {"amount": 630}, "type": "test_event"}	2025-07-29 16:17:37.214	\N
evt_wcrxc	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_59ugem", "data": {"amount": 3837}, "type": "test_event"}	2025-08-08 10:10:21.841	\N
evt_jqlxtk	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_khkuxd", "data": {"amount": 9037}, "type": "test_event"}	2025-08-01 20:55:13.854	\N
evt_mvs9ll	wh_twilio_sms	seed_script	payment.succeeded	{"id": "obj_3yovdl", "data": {"amount": 9258}, "type": "test_event"}	2025-08-08 09:31:39.436	\N
evt_8hdhyg	wh_twilio_sms	seed_script	analytics.track	{"id": "obj_6v51r8", "data": {"amount": 598}, "type": "test_event"}	2025-08-22 14:41:59.834	\N
evt_86lhx9	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_czrpv", "data": {"amount": 4641}, "type": "test_event"}	2025-08-11 10:17:21.81	\N
evt_ec4qag	wh_twilio_sms	seed_script	payment.succeeded	{"id": "obj_s8iox", "data": {"amount": 4463}, "type": "test_event"}	2025-07-30 21:31:56.877	\N
evt_jydfkt	wh_analytics	seed_script	analytics.track	{"id": "obj_de1vi", "data": {"amount": 8323}, "type": "test_event"}	2025-08-15 10:01:18.216	\N
evt_1pzib	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_v4e6w9", "data": {"amount": 1373}, "type": "test_event"}	2025-07-25 10:37:37.217	\N
evt_9fdog	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_uigtk", "data": {"amount": 9800}, "type": "test_event"}	2025-08-02 00:54:35.914	\N
evt_amcm62	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_aan4yj", "data": {"amount": 6642}, "type": "test_event"}	2025-08-08 13:58:46.132	\N
evt_5fiiwl	wh_twilio_sms	seed_script	session.booked	{"id": "obj_8icw2f", "data": {"amount": 6679}, "type": "test_event"}	2025-08-02 02:08:41.068	\N
evt_fmwc3qg	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_3wial8", "data": {"amount": 3836}, "type": "test_event"}	2025-08-07 14:12:16.432	\N
evt_g68p5h	wh_analytics	seed_script	payment.succeeded	{"id": "obj_lwhrg", "data": {"amount": 9112}, "type": "test_event"}	2025-08-20 15:01:29.705	\N
evt_b2zcqb	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_kljtyc", "data": {"amount": 5447}, "type": "test_event"}	2025-08-15 02:02:28.897	\N
evt_y11y2i	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_43ykaj", "data": {"amount": 9610}, "type": "test_event"}	2025-08-06 12:02:39.597	\N
evt_h96j8	wh_analytics	seed_script	payment.succeeded	{"id": "obj_qqum8o", "data": {"amount": 7431}, "type": "test_event"}	2025-08-10 19:28:46.008	\N
evt_s7qnqm	wh_analytics	seed_script	user.registered	{"id": "obj_lnj6f", "data": {"amount": 9915}, "type": "test_event"}	2025-08-09 06:04:48.582	\N
evt_dlwprv	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_1h80q", "data": {"amount": 8525}, "type": "test_event"}	2025-08-16 03:56:43.913	\N
evt_ss9wv	wh_twilio_sms	seed_script	user.registered	{"id": "obj_pbxjdc", "data": {"amount": 6780}, "type": "test_event"}	2025-08-05 15:46:38.959	\N
evt_5vi4ti	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_l86dmr", "data": {"amount": 7402}, "type": "test_event"}	2025-08-17 05:41:05.812	\N
evt_gp2sj6	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_ouc3wb", "data": {"amount": 9908}, "type": "test_event"}	2025-08-01 09:16:53.881	\N
evt_7txoxc	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_0p6olh", "data": {"amount": 9492}, "type": "test_event"}	2025-08-10 02:28:22.504	\N
evt_tmrzgi	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_95gi6k", "data": {"amount": 3695}, "type": "test_event"}	2025-07-31 01:26:34.362	\N
evt_brq6gp	wh_analytics	seed_script	sms.failed	{"id": "obj_1uuo3", "data": {"amount": 4787}, "type": "test_event"}	2025-08-06 06:20:54.447	\N
evt_1cmhpo	wh_analytics	seed_script	email.delivered	{"id": "obj_uoyko", "data": {"amount": 6688}, "type": "test_event"}	2025-07-31 13:35:12.601	\N
evt_6y75j	wh_analytics	seed_script	payment.failed	{"id": "obj_2kj6vz", "data": {"amount": 6331}, "type": "test_event"}	2025-08-09 08:26:50.843	\N
evt_v62gjs	wh_stripe_payments	seed_script	email.delivered	{"id": "obj_2trmj", "data": {"amount": 483}, "type": "test_event"}	2025-08-08 19:15:37.214	\N
evt_pxs9si	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_q25bwg", "data": {"amount": 1170}, "type": "test_event"}	2025-07-28 16:07:41.091	\N
evt_1mrjcg6	wh_mailchimp	seed_script	payment.failed	{"id": "obj_9kveyo", "data": {"amount": 8569}, "type": "test_event"}	2025-08-13 14:34:17.372	\N
evt_76cwc	wh_twilio_sms	seed_script	payment.succeeded	{"id": "obj_qrpwgc", "data": {"amount": 9312}, "type": "test_event"}	2025-08-13 21:37:02.781	\N
evt_dm0otp	wh_analytics	seed_script	sms.failed	{"id": "obj_ewkq4o", "data": {"amount": 2167}, "type": "test_event"}	2025-08-16 08:45:28.447	\N
evt_1sg8kw	wh_twilio_sms	seed_script	payment.failed	{"id": "obj_8w6te", "data": {"amount": 1375}, "type": "test_event"}	2025-08-23 11:49:53.758	\N
evt_n8n6m7	wh_twilio_sms	seed_script	analytics.track	{"id": "obj_a9h00n", "data": {"amount": 2111}, "type": "test_event"}	2025-08-17 17:08:58.658	\N
evt_of58c	wh_sendgrid_email	seed_script	session.booked	{"id": "obj_c3fdk", "data": {"amount": 8001}, "type": "test_event"}	2025-07-27 18:31:38.807	\N
evt_8ooxb	wh_twilio_sms	seed_script	user.registered	{"id": "obj_5zldpw", "data": {"amount": 6156}, "type": "test_event"}	2025-08-12 05:17:00.494	\N
evt_lqc6p	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_w62qpq", "data": {"amount": 1475}, "type": "test_event"}	2025-08-03 18:16:49.62	\N
evt_ako5ib	wh_stripe_payments	seed_script	email.bounce	{"id": "obj_2gvey7", "data": {"amount": 588}, "type": "test_event"}	2025-08-21 01:59:14.283	\N
evt_a0smu9	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_cfbz9d", "data": {"amount": 8304}, "type": "test_event"}	2025-08-10 12:09:09.583	\N
evt_or0ocfu	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_enb7ti", "data": {"amount": 7519}, "type": "test_event"}	2025-08-16 23:53:01.296	\N
evt_u3nmge	wh_analytics	seed_script	session.cancelled	{"id": "obj_alm96k", "data": {"amount": 8603}, "type": "test_event"}	2025-08-19 00:43:27.24	\N
evt_xvhjv9	wh_twilio_sms	seed_script	analytics.track	{"id": "obj_95j99", "data": {"amount": 9472}, "type": "test_event"}	2025-08-22 15:35:57.19	\N
evt_93fn6r	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_shlwqa", "data": {"amount": 6159}, "type": "test_event"}	2025-07-25 09:28:54.288	\N
evt_bfzsxp	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_ue21bp", "data": {"amount": 120}, "type": "test_event"}	2025-08-14 05:19:27.162	\N
evt_xgrvy	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_172avo", "data": {"amount": 6455}, "type": "test_event"}	2025-08-18 06:15:20.598	\N
evt_m8icom	wh_stripe_payments	seed_script	payment.succeeded	{"id": "obj_7mpxfe", "data": {"amount": 7520}, "type": "test_event"}	2025-08-06 14:58:44.429	\N
evt_9zkjaa	wh_sendgrid_email	seed_script	email.bounce	{"id": "obj_zrlfve", "data": {"amount": 468}, "type": "test_event"}	2025-07-25 21:13:46.28	\N
evt_0o9i5j	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_r3y9a", "data": {"amount": 9342}, "type": "test_event"}	2025-07-25 22:30:06.093	\N
evt_gdwot	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_vq6zve", "data": {"amount": 8786}, "type": "test_event"}	2025-08-05 19:55:55.296	\N
evt_8vx59	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_somrhs", "data": {"amount": 7567}, "type": "test_event"}	2025-08-11 19:39:56.769	\N
evt_1feb3	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_ct6uqe", "data": {"amount": 9498}, "type": "test_event"}	2025-07-29 07:39:28.152	\N
evt_pazsz5	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_mwf6ck", "data": {"amount": 1991}, "type": "test_event"}	2025-08-08 08:52:09.808	\N
evt_0curhq	wh_stripe_payments	seed_script	user.registered	{"id": "obj_5gmi9f", "data": {"amount": 4717}, "type": "test_event"}	2025-08-11 21:00:08.264	\N
evt_ua8e88	wh_analytics	seed_script	email.bounce	{"id": "obj_0y5bqn", "data": {"amount": 6379}, "type": "test_event"}	2025-08-09 01:10:55.906	\N
evt_f1kl7v	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_qy62g", "data": {"amount": 8132}, "type": "test_event"}	2025-08-07 10:25:49.538	\N
evt_pfz2gn	wh_sendgrid_email	seed_script	email.bounce	{"id": "obj_ep0uzr", "data": {"amount": 2994}, "type": "test_event"}	2025-07-26 21:00:58.074	\N
evt_kvuota	wh_sendgrid_email	seed_script	email.bounce	{"id": "obj_n0a4t9", "data": {"amount": 7997}, "type": "test_event"}	2025-07-27 05:46:23.846	\N
evt_2icovn	wh_analytics	seed_script	session.booked	{"id": "obj_23y757", "data": {"amount": 6419}, "type": "test_event"}	2025-08-03 18:32:11.453	\N
evt_omgzkd	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_fwml0l", "data": {"amount": 8183}, "type": "test_event"}	2025-07-26 17:36:01.461	\N
evt_cf980s	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_sb0095", "data": {"amount": 8628}, "type": "test_event"}	2025-08-23 09:52:42.616	\N
evt_k5q60n	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_pyl4gvj", "data": {"amount": 453}, "type": "test_event"}	2025-08-07 09:01:36.619	\N
evt_og2o5m	wh_stripe_payments	seed_script	email.delivered	{"id": "obj_1im5ud", "data": {"amount": 3313}, "type": "test_event"}	2025-07-28 15:50:49.967	\N
evt_e9zvig	wh_stripe_payments	seed_script	user.registered	{"id": "obj_ayf2kg", "data": {"amount": 4750}, "type": "test_event"}	2025-08-07 05:18:59.539	\N
evt_8dalcu	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_uh8oz", "data": {"amount": 7578}, "type": "test_event"}	2025-08-05 05:28:54.242	\N
evt_pk9k8	wh_analytics	seed_script	payment.failed	{"id": "obj_aesbbn", "data": {"amount": 5101}, "type": "test_event"}	2025-07-29 10:59:18.739	\N
evt_o3onzd	wh_analytics	seed_script	payment.succeeded	{"id": "obj_uebt8g", "data": {"amount": 8751}, "type": "test_event"}	2025-08-20 11:18:44.761	\N
evt_js1lsn	wh_analytics	seed_script	analytics.track	{"id": "obj_6tkgof", "data": {"amount": 2565}, "type": "test_event"}	2025-07-29 00:18:36.346	\N
evt_sspp6	wh_stripe_payments	seed_script	email.delivered	{"id": "obj_ascejj", "data": {"amount": 1523}, "type": "test_event"}	2025-07-25 15:10:24.359	\N
evt_20e4br	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_nmii1r", "data": {"amount": 2765}, "type": "test_event"}	2025-08-18 02:22:22.51	\N
evt_ngpjj8	wh_stripe_payments	seed_script	sms.failed	{"id": "obj_syfvr", "data": {"amount": 9443}, "type": "test_event"}	2025-07-28 02:19:19.315	\N
evt_cu7ud	wh_analytics	seed_script	sms.failed	{"id": "obj_gdxjt", "data": {"amount": 2776}, "type": "test_event"}	2025-08-23 07:49:42.894	\N
evt_xn5yap	wh_mailchimp	seed_script	email.bounce	{"id": "obj_ge93bw", "data": {"amount": 6810}, "type": "test_event"}	2025-07-26 23:25:52.794	\N
evt_lnvdl	wh_twilio_sms	seed_script	analytics.track	{"id": "obj_iijc5f", "data": {"amount": 9600}, "type": "test_event"}	2025-07-27 23:02:45.632	\N
evt_g5fhvt	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_q32pxc", "data": {"amount": 6012}, "type": "test_event"}	2025-08-04 15:05:15.631	\N
evt_3ftgjw	wh_mailchimp	seed_script	sms.failed	{"id": "obj_hr3omm", "data": {"amount": 8224}, "type": "test_event"}	2025-08-10 15:18:09.167	\N
evt_yw5qt2	wh_stripe_payments	seed_script	email.delivered	{"id": "obj_om3ff", "data": {"amount": 7075}, "type": "test_event"}	2025-08-12 00:23:58.592	\N
evt_jhsqkh	wh_twilio_sms	seed_script	session.booked	{"id": "obj_gggdad", "data": {"amount": 4528}, "type": "test_event"}	2025-08-09 08:48:18.066	\N
evt_dpd388	wh_analytics	seed_script	payment.succeeded	{"id": "obj_7272f", "data": {"amount": 1726}, "type": "test_event"}	2025-08-14 15:57:01.996	\N
evt_jjquc	wh_mailchimp	seed_script	user.registered	{"id": "obj_9yfhf7", "data": {"amount": 4903}, "type": "test_event"}	2025-07-25 02:42:18.584	\N
evt_pskl2	wh_mailchimp	seed_script	session.booked	{"id": "obj_w9vyxd", "data": {"amount": 9745}, "type": "test_event"}	2025-07-25 03:45:15.395	\N
evt_bf7m7fn	wh_twilio_sms	seed_script	payment.failed	{"id": "obj_vyq9a9", "data": {"amount": 6582}, "type": "test_event"}	2025-08-03 10:00:02.828	\N
evt_di2yjh	wh_analytics	seed_script	session.booked	{"id": "obj_anwyqd", "data": {"amount": 4646}, "type": "test_event"}	2025-08-13 15:22:05.549	\N
evt_3haxlg	wh_analytics	seed_script	session.cancelled	{"id": "obj_tdu7rj", "data": {"amount": 3322}, "type": "test_event"}	2025-08-12 21:26:20.835	\N
evt_mjabtt	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_kwlhvd", "data": {"amount": 4142}, "type": "test_event"}	2025-08-11 04:48:58.007	\N
evt_q1firl	wh_mailchimp	seed_script	payment.succeeded	{"id": "obj_csixt5", "data": {"amount": 977}, "type": "test_event"}	2025-08-18 03:06:14.457	\N
evt_tqftm	wh_mailchimp	seed_script	session.booked	{"id": "obj_3373y", "data": {"amount": 1155}, "type": "test_event"}	2025-08-15 05:12:01.145	\N
evt_a61q7	wh_analytics	seed_script	email.delivered	{"id": "obj_1cejj", "data": {"amount": 2129}, "type": "test_event"}	2025-08-18 08:24:16.919	\N
evt_xnr1we	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_aewqpg", "data": {"amount": 5844}, "type": "test_event"}	2025-08-20 11:43:58.799	\N
evt_u2jh5m	wh_analytics	seed_script	email.delivered	{"id": "obj_8n4n3h", "data": {"amount": 5871}, "type": "test_event"}	2025-08-02 10:41:52.051	\N
evt_fm8bb9	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_5yosqr", "data": {"amount": 5877}, "type": "test_event"}	2025-08-22 13:53:38.709	\N
evt_4mwo19	wh_twilio_sms	seed_script	sms.failed	{"id": "obj_14zwhl", "data": {"amount": 8923}, "type": "test_event"}	2025-08-05 04:25:25.9	\N
evt_vt4fy	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_4u3v7", "data": {"amount": 5366}, "type": "test_event"}	2025-08-02 03:17:00.45	\N
evt_amcb8	wh_stripe_payments	seed_script	sms.failed	{"id": "obj_pcgoh1", "data": {"amount": 9819}, "type": "test_event"}	2025-08-22 05:51:49.697	\N
evt_8v4p0n	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_s42ex", "data": {"amount": 3341}, "type": "test_event"}	2025-07-26 22:13:35.816	\N
evt_30fp4f	wh_sendgrid_email	seed_script	session.booked	{"id": "obj_vsofd", "data": {"amount": 4349}, "type": "test_event"}	2025-08-08 03:05:51.206	\N
evt_mudgcf	wh_analytics	seed_script	user.registered	{"id": "obj_wdn0dg", "data": {"amount": 3816}, "type": "test_event"}	2025-08-01 12:34:51.829	\N
evt_sp3itj	wh_analytics	seed_script	sms.delivered	{"id": "obj_hsnuq", "data": {"amount": 618}, "type": "test_event"}	2025-07-27 03:12:50.501	\N
evt_pnl9r6	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_34s4ep", "data": {"amount": 6539}, "type": "test_event"}	2025-08-07 19:24:45.162	\N
evt_wbo8vc	wh_sendgrid_email	seed_script	payment.failed	{"id": "obj_x4cbh", "data": {"amount": 2549}, "type": "test_event"}	2025-08-07 21:25:24.433	\N
evt_j2wks	wh_twilio_sms	seed_script	user.registered	{"id": "obj_eg2cxf", "data": {"amount": 430}, "type": "test_event"}	2025-08-07 08:13:45.012	\N
evt_0svtec	wh_analytics	seed_script	payment.failed	{"id": "obj_r5gvfe", "data": {"amount": 3298}, "type": "test_event"}	2025-08-05 01:59:53.254	\N
evt_jvvov	wh_analytics	seed_script	user.registered	{"id": "obj_1lh460r", "data": {"amount": 6224}, "type": "test_event"}	2025-08-10 13:54:33.158	\N
evt_vkxop	wh_twilio_sms	seed_script	sms.delivered	{"id": "obj_08zvnx", "data": {"amount": 7936}, "type": "test_event"}	2025-07-29 11:07:10.264	\N
evt_g9ugdn	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_c4aspl", "data": {"amount": 6130}, "type": "test_event"}	2025-08-01 05:33:31.492	\N
evt_ysf20i	wh_twilio_sms	seed_script	session.booked	{"id": "obj_rgx25", "data": {"amount": 5323}, "type": "test_event"}	2025-08-20 03:42:31.865	\N
evt_4psu0o	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_qzdygv", "data": {"amount": 7226}, "type": "test_event"}	2025-08-06 16:41:49.544	\N
evt_uy8bwd	wh_twilio_sms	seed_script	user.registered	{"id": "obj_0l58z", "data": {"amount": 8150}, "type": "test_event"}	2025-08-11 20:27:22.61	\N
evt_7j5vog	wh_twilio_sms	seed_script	sms.delivered	{"id": "obj_oud054", "data": {"amount": 2484}, "type": "test_event"}	2025-08-11 00:13:24.969	\N
evt_4dsek	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_49ii7p", "data": {"amount": 7491}, "type": "test_event"}	2025-07-30 10:05:20.544	\N
evt_8n1a6pn	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_hrvnr", "data": {"amount": 2723}, "type": "test_event"}	2025-08-02 16:17:04.9	\N
evt_em6qer	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_ua7dmd", "data": {"amount": 299}, "type": "test_event"}	2025-08-07 14:41:36.183	\N
evt_cxzwf	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_48v7in", "data": {"amount": 4105}, "type": "test_event"}	2025-08-09 23:46:19.873	\N
evt_bktb0l	wh_sendgrid_email	seed_script	payment.failed	{"id": "obj_6i5a7a", "data": {"amount": 6647}, "type": "test_event"}	2025-07-25 16:23:48.488	\N
evt_ytijc	wh_stripe_payments	seed_script	payment.succeeded	{"id": "obj_zdazgx", "data": {"amount": 9547}, "type": "test_event"}	2025-08-19 04:35:21.861	\N
evt_w032sg	wh_stripe_payments	seed_script	email.bounce	{"id": "obj_aspvj1", "data": {"amount": 1983}, "type": "test_event"}	2025-07-29 21:11:59.576	\N
evt_sug1y8y	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_dlrvk", "data": {"amount": 8717}, "type": "test_event"}	2025-07-25 14:00:29.514	\N
evt_oskad9	wh_analytics	seed_script	sms.delivered	{"id": "obj_bftmow", "data": {"amount": 4550}, "type": "test_event"}	2025-08-22 15:59:00.883	\N
evt_1wbfo	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_v0zm9h", "data": {"amount": 7194}, "type": "test_event"}	2025-07-30 09:51:53.824	\N
evt_n8fjsn	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_wj6zvr", "data": {"amount": 966}, "type": "test_event"}	2025-07-25 17:39:17.565	\N
evt_zaykdf	wh_sendgrid_email	seed_script	payment.failed	{"id": "obj_bkn159", "data": {"amount": 8974}, "type": "test_event"}	2025-08-10 08:02:08.561	\N
evt_swrmzr	wh_twilio_sms	seed_script	sms.delivered	{"id": "obj_ap6t1f", "data": {"amount": 6175}, "type": "test_event"}	2025-08-21 14:29:36.752	\N
evt_0k4dc	wh_analytics	seed_script	session.cancelled	{"id": "obj_e24dc", "data": {"amount": 6087}, "type": "test_event"}	2025-08-10 10:15:50.376	\N
evt_3h44y6	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_uw9dofn", "data": {"amount": 2073}, "type": "test_event"}	2025-08-18 07:25:44.558	\N
evt_dyq73i	wh_analytics	seed_script	sms.failed	{"id": "obj_4ng5ra", "data": {"amount": 4738}, "type": "test_event"}	2025-07-28 10:47:26.119	\N
evt_u4wf9s	wh_twilio_sms	seed_script	payment.succeeded	{"id": "obj_rem4fl", "data": {"amount": 2199}, "type": "test_event"}	2025-08-01 09:37:10.205	\N
evt_mreq7r	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_0b6oln", "data": {"amount": 2868}, "type": "test_event"}	2025-08-19 09:03:35.122	\N
evt_uzzhuj	wh_sendgrid_email	seed_script	session.booked	{"id": "obj_0voa", "data": {"amount": 4142}, "type": "test_event"}	2025-08-06 04:25:46.925	\N
evt_dwya7	wh_stripe_payments	seed_script	payment.succeeded	{"id": "obj_olb275", "data": {"amount": 223}, "type": "test_event"}	2025-08-22 06:57:58.599	\N
evt_j1fi1n	wh_mailchimp	seed_script	session.booked	{"id": "obj_a8h0g", "data": {"amount": 1558}, "type": "test_event"}	2025-07-31 06:55:34.57	\N
evt_brt6lf	wh_stripe_payments	seed_script	email.bounce	{"id": "obj_wvjhm", "data": {"amount": 1152}, "type": "test_event"}	2025-08-19 23:10:35.407	\N
evt_qlb6zl	wh_stripe_payments	seed_script	session.booked	{"id": "obj_2fbaza", "data": {"amount": 1458}, "type": "test_event"}	2025-07-27 19:42:17.407	\N
evt_fh3pt3	wh_twilio_sms	seed_script	sms.failed	{"id": "obj_igf2u", "data": {"amount": 3751}, "type": "test_event"}	2025-08-17 05:32:46.172	\N
evt_3oavpp	wh_analytics	seed_script	session.booked	{"id": "obj_gb0tyh", "data": {"amount": 3496}, "type": "test_event"}	2025-08-08 20:57:00.29	\N
evt_aasdab	wh_mailchimp	seed_script	session.booked	{"id": "obj_qgxffw", "data": {"amount": 4272}, "type": "test_event"}	2025-08-19 18:03:52.969	\N
evt_15h11	wh_stripe_payments	seed_script	email.delivered	{"id": "obj_fdjs3s", "data": {"amount": 1102}, "type": "test_event"}	2025-08-03 20:09:09.954	\N
evt_7h7ygm	wh_mailchimp	seed_script	email.bounce	{"id": "obj_2z8pza", "data": {"amount": 7567}, "type": "test_event"}	2025-08-04 11:43:30.258	\N
evt_dg11no	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_7f3c2p", "data": {"amount": 7887}, "type": "test_event"}	2025-08-01 04:21:19.354	\N
evt_khdqfe	wh_mailchimp	seed_script	payment.failed	{"id": "obj_q3zx4", "data": {"amount": 5293}, "type": "test_event"}	2025-08-22 12:50:47.716	\N
evt_jev57u	wh_analytics	seed_script	session.cancelled	{"id": "obj_5lxvgf", "data": {"amount": 8823}, "type": "test_event"}	2025-08-05 10:39:02.101	\N
evt_8g5rzd	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_lvhxcg", "data": {"amount": 1629}, "type": "test_event"}	2025-08-20 03:00:00.734	\N
evt_abdong	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_8btth", "data": {"amount": 1707}, "type": "test_event"}	2025-08-18 08:04:45.435	\N
evt_b8rt2e	wh_mailchimp	seed_script	payment.failed	{"id": "obj_7jfz8", "data": {"amount": 9734}, "type": "test_event"}	2025-08-03 15:22:46.947	\N
evt_r5vncm	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_xkaihm", "data": {"amount": 4337}, "type": "test_event"}	2025-08-21 14:02:16.152	\N
evt_g9r3uc	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_zf97b", "data": {"amount": 1167}, "type": "test_event"}	2025-08-09 05:50:32.581	\N
evt_u08b9p	wh_analytics	seed_script	session.cancelled	{"id": "obj_n2q8n", "data": {"amount": 9425}, "type": "test_event"}	2025-08-08 07:44:51.11	\N
evt_si4qz6c	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_mj5h05", "data": {"amount": 6893}, "type": "test_event"}	2025-08-20 03:21:43.733	\N
evt_znbmjr	wh_mailchimp	seed_script	email.delivered	{"id": "obj_tha0l96", "data": {"amount": 4644}, "type": "test_event"}	2025-08-12 16:54:31.608	\N
evt_2anvgw	wh_twilio_sms	seed_script	user.registered	{"id": "obj_ksfsfb", "data": {"amount": 7734}, "type": "test_event"}	2025-08-23 21:14:25.228	\N
evt_pge51j	wh_mailchimp	seed_script	payment.failed	{"id": "obj_64avoo", "data": {"amount": 4191}, "type": "test_event"}	2025-08-11 09:23:28.638	\N
evt_if6dgb	wh_twilio_sms	seed_script	sms.delivered	{"id": "obj_jwuur8", "data": {"amount": 1714}, "type": "test_event"}	2025-08-02 14:40:36.065	\N
evt_tf1hos	wh_stripe_payments	seed_script	email.bounce	{"id": "obj_a627nt", "data": {"amount": 5648}, "type": "test_event"}	2025-08-19 11:52:12.008	\N
evt_hft5kw	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_3m3l6j", "data": {"amount": 6418}, "type": "test_event"}	2025-08-08 10:07:34.42	\N
evt_if6kkd	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_gaaprr", "data": {"amount": 3474}, "type": "test_event"}	2025-08-04 03:16:40.31	\N
evt_q674aw	wh_analytics	seed_script	sms.failed	{"id": "obj_0zbcm", "data": {"amount": 6244}, "type": "test_event"}	2025-07-31 11:23:40.568	\N
evt_7g2lgo	wh_analytics	seed_script	payment.failed	{"id": "obj_1j4pei", "data": {"amount": 7801}, "type": "test_event"}	2025-08-19 23:35:32.528	\N
evt_pcmf6i	wh_analytics	seed_script	payment.failed	{"id": "obj_ekv33", "data": {"amount": 3697}, "type": "test_event"}	2025-08-08 13:15:33.736	\N
evt_abm1av	wh_analytics	seed_script	payment.succeeded	{"id": "obj_qoq9hm", "data": {"amount": 2109}, "type": "test_event"}	2025-07-26 16:25:21.356	\N
evt_5j8gvcf	wh_stripe_payments	seed_script	payment.succeeded	{"id": "obj_0zqtp1h", "data": {"amount": 3954}, "type": "test_event"}	2025-08-19 23:43:52.722	\N
evt_2e1xb8	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_rcp75o", "data": {"amount": 4375}, "type": "test_event"}	2025-08-09 06:27:32.154	\N
evt_t7exyi	wh_mailchimp	seed_script	session.booked	{"id": "obj_vdkulk", "data": {"amount": 6176}, "type": "test_event"}	2025-08-16 17:00:12.684	\N
evt_8f1mkg	wh_twilio_sms	seed_script	sms.delivered	{"id": "obj_qpfvk", "data": {"amount": 5}, "type": "test_event"}	2025-07-31 07:10:19.497	\N
evt_c5z2y	wh_analytics	seed_script	payment.failed	{"id": "obj_bbzcvr", "data": {"amount": 9598}, "type": "test_event"}	2025-08-09 05:20:14.316	\N
evt_of1i1w	wh_stripe_payments	seed_script	email.delivered	{"id": "obj_qt8auf", "data": {"amount": 6901}, "type": "test_event"}	2025-07-25 19:18:41.427	\N
evt_p0scdb	wh_mailchimp	seed_script	payment.failed	{"id": "obj_x2wdr5", "data": {"amount": 8415}, "type": "test_event"}	2025-08-07 23:34:34.215	\N
evt_nwzij	wh_twilio_sms	seed_script	payment.failed	{"id": "obj_ypkehe", "data": {"amount": 7379}, "type": "test_event"}	2025-08-15 02:42:11.213	\N
evt_myxjtc	wh_analytics	seed_script	payment.succeeded	{"id": "obj_04h48", "data": {"amount": 2748}, "type": "test_event"}	2025-08-21 22:18:50.88	\N
evt_czwmu	wh_analytics	seed_script	user.registered	{"id": "obj_e3lrw", "data": {"amount": 7117}, "type": "test_event"}	2025-07-31 23:16:15.685	\N
evt_1cues8	wh_stripe_payments	seed_script	sms.failed	{"id": "obj_or1n9o", "data": {"amount": 15}, "type": "test_event"}	2025-08-05 12:53:26.842	\N
evt_71ti7m	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_4uubgs", "data": {"amount": 2453}, "type": "test_event"}	2025-07-29 16:05:16.136	\N
evt_wjrmcm	wh_stripe_payments	seed_script	sms.failed	{"id": "obj_mjqjj", "data": {"amount": 2878}, "type": "test_event"}	2025-08-01 07:12:02.368	\N
evt_nqmgag	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_le493t", "data": {"amount": 6962}, "type": "test_event"}	2025-08-17 02:33:29.267	\N
evt_5vz24s	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_6h68i", "data": {"amount": 2357}, "type": "test_event"}	2025-08-06 17:52:49.582	\N
evt_m197oq	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_nm4m37", "data": {"amount": 5066}, "type": "test_event"}	2025-08-04 16:51:40.275	\N
evt_pyum1l	wh_analytics	seed_script	email.delivered	{"id": "obj_3fvlxr", "data": {"amount": 7173}, "type": "test_event"}	2025-08-16 07:18:54.322	\N
evt_1zi5z6	wh_analytics	seed_script	payment.failed	{"id": "obj_oa8gjr", "data": {"amount": 6086}, "type": "test_event"}	2025-08-13 11:47:22.559	\N
evt_objlx6	wh_twilio_sms	seed_script	session.booked	{"id": "obj_9hbzxd", "data": {"amount": 7016}, "type": "test_event"}	2025-08-12 10:15:22.35	\N
evt_fylht8	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_mxcwr", "data": {"amount": 9749}, "type": "test_event"}	2025-08-05 20:37:09.574	\N
evt_15qzjq	wh_mailchimp	seed_script	session.booked	{"id": "obj_aez60o", "data": {"amount": 384}, "type": "test_event"}	2025-08-12 19:03:50.764	\N
evt_4r70x	wh_twilio_sms	seed_script	payment.failed	{"id": "obj_z6n76", "data": {"amount": 2693}, "type": "test_event"}	2025-08-10 21:07:12.081	\N
evt_sfjim9	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_hehi4s", "data": {"amount": 6036}, "type": "test_event"}	2025-07-29 23:26:21.663	\N
evt_pe5s08	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_koty4o", "data": {"amount": 3263}, "type": "test_event"}	2025-08-02 11:05:31.312	\N
evt_b553svo	wh_analytics	seed_script	session.booked	{"id": "obj_j67o1g", "data": {"amount": 7490}, "type": "test_event"}	2025-08-11 01:14:31.053	\N
evt_3jxef	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_1w8elm", "data": {"amount": 103}, "type": "test_event"}	2025-08-05 00:29:52.977	\N
evt_to53	wh_twilio_sms	seed_script	sms.delivered	{"id": "obj_u7zclc", "data": {"amount": 3669}, "type": "test_event"}	2025-08-08 10:48:52.168	\N
evt_rnkgv	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_ukpwf", "data": {"amount": 4873}, "type": "test_event"}	2025-07-27 20:26:09.547	\N
evt_tm86wq	wh_analytics	seed_script	analytics.track	{"id": "obj_8mrj6", "data": {"amount": 2295}, "type": "test_event"}	2025-08-08 03:07:22.598	\N
evt_ol6y1a	wh_mailchimp	seed_script	email.delivered	{"id": "obj_93s2h", "data": {"amount": 6438}, "type": "test_event"}	2025-08-21 09:17:55.473	\N
evt_fnmwc	wh_mailchimp	seed_script	payment.succeeded	{"id": "obj_yngv9j", "data": {"amount": 9874}, "type": "test_event"}	2025-08-21 18:18:57.277	\N
evt_3z4f3f	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_17s1ln", "data": {"amount": 8874}, "type": "test_event"}	2025-08-02 02:22:05.79	\N
evt_uityj	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_3dw2g8", "data": {"amount": 2005}, "type": "test_event"}	2025-08-02 01:34:29.44	\N
evt_3pgee8	wh_analytics	seed_script	payment.failed	{"id": "obj_yhtc0o", "data": {"amount": 3724}, "type": "test_event"}	2025-08-09 05:33:10.769	\N
evt_pq4znw	wh_analytics	seed_script	payment.failed	{"id": "obj_9jwpui", "data": {"amount": 1349}, "type": "test_event"}	2025-08-10 00:02:29.964	\N
evt_ukf58q	wh_twilio_sms	seed_script	user.registered	{"id": "obj_7ay094", "data": {"amount": 4920}, "type": "test_event"}	2025-07-29 00:05:14.832	\N
evt_wv4xcf	wh_analytics	seed_script	email.delivered	{"id": "obj_od8doh", "data": {"amount": 2091}, "type": "test_event"}	2025-08-19 00:50:56.861	\N
evt_9shncs	wh_analytics	seed_script	user.registered	{"id": "obj_98v9k", "data": {"amount": 2163}, "type": "test_event"}	2025-08-16 02:00:03.809	\N
evt_pof8n8	wh_stripe_payments	seed_script	session.booked	{"id": "obj_ddl49", "data": {"amount": 4706}, "type": "test_event"}	2025-08-05 23:52:28.141	\N
evt_qa9vb	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_uplke", "data": {"amount": 9035}, "type": "test_event"}	2025-08-22 17:39:55.816	\N
evt_r5sir2	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_5ssbr9", "data": {"amount": 7639}, "type": "test_event"}	2025-08-06 16:18:06.048	\N
evt_yfw3xq	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_7fbr2a", "data": {"amount": 5660}, "type": "test_event"}	2025-08-05 22:22:50.003	\N
evt_zj67ce	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_4zj3pj", "data": {"amount": 3356}, "type": "test_event"}	2025-08-04 09:16:44.54	\N
evt_4zfy0b	wh_mailchimp	seed_script	payment.succeeded	{"id": "obj_18hxc1", "data": {"amount": 2457}, "type": "test_event"}	2025-08-14 18:32:09.572	\N
evt_bjplzq	wh_mailchimp	seed_script	analytics.track	{"id": "obj_3t9hr", "data": {"amount": 1100}, "type": "test_event"}	2025-08-06 14:51:04.708	\N
evt_7h67w9	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_ijbyll", "data": {"amount": 359}, "type": "test_event"}	2025-07-26 05:25:05.252	\N
evt_1uiqpj	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_ch5g9", "data": {"amount": 8560}, "type": "test_event"}	2025-08-14 11:58:51.742	\N
evt_nujexf	wh_mailchimp	seed_script	email.bounce	{"id": "obj_4xg068", "data": {"amount": 7144}, "type": "test_event"}	2025-08-16 05:18:13.549	\N
evt_d9sipf	wh_twilio_sms	seed_script	user.registered	{"id": "obj_kpc5cg", "data": {"amount": 1412}, "type": "test_event"}	2025-08-23 16:22:08.446	\N
evt_7rkpr8	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_cwq2vn", "data": {"amount": 2498}, "type": "test_event"}	2025-08-15 20:31:40.869	\N
evt_819qyg	wh_analytics	seed_script	sms.failed	{"id": "obj_gbki1j", "data": {"amount": 1911}, "type": "test_event"}	2025-08-05 00:59:24.164	\N
evt_gmbcfi	wh_sendgrid_email	seed_script	user.registered	{"id": "obj_oy209q", "data": {"amount": 8838}, "type": "test_event"}	2025-07-25 19:31:47.059	\N
evt_wmnog	wh_analytics	seed_script	email.delivered	{"id": "obj_i9tx2o", "data": {"amount": 2347}, "type": "test_event"}	2025-07-31 12:59:56.944	\N
evt_vf6x6f	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_s5n69l", "data": {"amount": 2618}, "type": "test_event"}	2025-08-10 08:17:16.964	\N
evt_f8tdjb	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_g4n6op", "data": {"amount": 9550}, "type": "test_event"}	2025-07-29 14:30:23.261	\N
evt_t4aaao	wh_analytics	seed_script	analytics.track	{"id": "obj_fx5nql", "data": {"amount": 9877}, "type": "test_event"}	2025-08-18 09:06:53.82	\N
evt_25o5x8	wh_twilio_sms	seed_script	analytics.track	{"id": "obj_q1wsfx", "data": {"amount": 457}, "type": "test_event"}	2025-07-25 21:58:42.121	\N
evt_3sqcor	wh_analytics	seed_script	session.cancelled	{"id": "obj_ycj6co", "data": {"amount": 8157}, "type": "test_event"}	2025-08-18 10:54:47.105	\N
evt_nuu7me	wh_stripe_payments	seed_script	user.registered	{"id": "obj_ch5d28", "data": {"amount": 733}, "type": "test_event"}	2025-08-19 22:58:30.904	\N
evt_m146a	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_fykftr", "data": {"amount": 8480}, "type": "test_event"}	2025-08-07 02:17:02.349	\N
evt_tc767i	wh_mailchimp	seed_script	sms.failed	{"id": "obj_ddyqqq", "data": {"amount": 785}, "type": "test_event"}	2025-08-23 17:06:22.121	\N
evt_ahaxun	wh_twilio_sms	seed_script	user.registered	{"id": "obj_lch7z", "data": {"amount": 7968}, "type": "test_event"}	2025-08-02 12:29:50.586	\N
evt_1bm6l	wh_mailchimp	seed_script	analytics.track	{"id": "obj_5l9okor", "data": {"amount": 3073}, "type": "test_event"}	2025-08-08 09:47:11.351	\N
evt_7z46db	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_ewtk62", "data": {"amount": 2986}, "type": "test_event"}	2025-08-04 09:01:38.854	\N
evt_w1ffjp	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_wm4wbl", "data": {"amount": 6901}, "type": "test_event"}	2025-08-09 11:04:50.366	\N
evt_nln0eo	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_4a5ci", "data": {"amount": 3344}, "type": "test_event"}	2025-08-01 22:39:31.206	\N
evt_gq1itq	wh_stripe_payments	seed_script	sms.delivered	{"id": "obj_jbvx3c", "data": {"amount": 2131}, "type": "test_event"}	2025-07-27 03:09:31.198	\N
evt_fnykls	wh_mailchimp	seed_script	email.delivered	{"id": "obj_xjsvqh", "data": {"amount": 5103}, "type": "test_event"}	2025-08-07 10:35:31.111	\N
evt_jn0m7t	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_mxbyii", "data": {"amount": 4732}, "type": "test_event"}	2025-08-16 08:48:23.673	\N
evt_6n2rvp	wh_stripe_payments	seed_script	email.delivered	{"id": "obj_8eq83k", "data": {"amount": 5134}, "type": "test_event"}	2025-08-01 02:53:24.657	\N
evt_dnbhtg	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_vtb3d", "data": {"amount": 8522}, "type": "test_event"}	2025-08-15 16:38:13.043	\N
evt_7w7vx	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_h2swjx", "data": {"amount": 1546}, "type": "test_event"}	2025-07-28 21:55:09.349	\N
evt_28wg2g	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_0abzu", "data": {"amount": 8031}, "type": "test_event"}	2025-08-13 07:01:04.469	\N
evt_j10xd	wh_analytics	seed_script	email.bounce	{"id": "obj_p9tz96", "data": {"amount": 7139}, "type": "test_event"}	2025-07-31 22:58:19.185	\N
evt_g3o4jr	wh_twilio_sms	seed_script	analytics.track	{"id": "obj_yfuk09", "data": {"amount": 2015}, "type": "test_event"}	2025-08-22 20:26:36.805	\N
evt_wwjur	wh_mailchimp	seed_script	payment.succeeded	{"id": "obj_0le31e", "data": {"amount": 7238}, "type": "test_event"}	2025-08-10 09:37:48.584	\N
evt_x7h1qp	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_s2rqe", "data": {"amount": 7043}, "type": "test_event"}	2025-08-19 12:22:18.079	\N
evt_hpbqrx	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_2wg9a", "data": {"amount": 9107}, "type": "test_event"}	2025-08-21 20:29:20.294	\N
evt_q8sbi	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_4mg8sa", "data": {"amount": 8944}, "type": "test_event"}	2025-07-26 23:04:37.332	\N
evt_064zjf	wh_sendgrid_email	seed_script	user.registered	{"id": "obj_s458oe", "data": {"amount": 9755}, "type": "test_event"}	2025-08-16 11:04:31.499	\N
evt_t1nn3b	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_t0zk2n", "data": {"amount": 8137}, "type": "test_event"}	2025-08-10 19:02:36.349	\N
evt_sslwpn	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_5p61e", "data": {"amount": 7428}, "type": "test_event"}	2025-08-14 05:17:23.928	\N
evt_jtnv4	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_l47pv9", "data": {"amount": 2028}, "type": "test_event"}	2025-08-01 04:14:59.848	\N
evt_hm505e	wh_analytics	seed_script	email.bounce	{"id": "obj_h0z89", "data": {"amount": 3322}, "type": "test_event"}	2025-08-23 17:07:40.202	\N
evt_ppm3r8	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_1u76kc", "data": {"amount": 3686}, "type": "test_event"}	2025-08-17 18:40:24.345	\N
evt_p1qvls	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_hffzyi", "data": {"amount": 5469}, "type": "test_event"}	2025-08-05 06:58:28.901	\N
evt_39ppmu	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_kchspk", "data": {"amount": 8870}, "type": "test_event"}	2025-08-09 23:41:06.523	\N
evt_mp64j	wh_twilio_sms	seed_script	session.booked	{"id": "obj_zmrjy", "data": {"amount": 6262}, "type": "test_event"}	2025-08-11 18:28:26.299	\N
evt_kkq014	wh_twilio_sms	seed_script	sms.failed	{"id": "obj_bhontm", "data": {"amount": 2078}, "type": "test_event"}	2025-07-30 15:10:18.324	\N
evt_xhdg4	wh_analytics	seed_script	sms.failed	{"id": "obj_g72xf6", "data": {"amount": 954}, "type": "test_event"}	2025-08-08 19:02:02.477	\N
evt_71vhwc	wh_mailchimp	seed_script	analytics.track	{"id": "obj_wuu9l", "data": {"amount": 834}, "type": "test_event"}	2025-08-08 12:11:47.096	\N
evt_fnw3y	wh_mailchimp	seed_script	analytics.track	{"id": "obj_rx6msu", "data": {"amount": 3437}, "type": "test_event"}	2025-08-14 19:13:15.573	\N
evt_pi8pdc	wh_analytics	seed_script	email.delivered	{"id": "obj_jlyp9", "data": {"amount": 8852}, "type": "test_event"}	2025-08-21 21:34:19.09	\N
evt_n0ozaq	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_wyot1", "data": {"amount": 6304}, "type": "test_event"}	2025-08-05 18:05:55.795	\N
evt_ywzp1t	wh_sendgrid_email	seed_script	user.registered	{"id": "obj_2nimws", "data": {"amount": 620}, "type": "test_event"}	2025-08-22 20:18:10.698	\N
evt_9m0wrf	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_2kqav", "data": {"amount": 1028}, "type": "test_event"}	2025-08-17 15:43:00.775	\N
evt_57n13	wh_mailchimp	seed_script	sms.delivered	{"id": "obj_yrpb4u", "data": {"amount": 6249}, "type": "test_event"}	2025-07-30 12:45:43.279	\N
evt_3zc2ad	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_813je", "data": {"amount": 6530}, "type": "test_event"}	2025-08-02 00:08:18.674	\N
evt_vfe4yg	wh_stripe_payments	seed_script	payment.succeeded	{"id": "obj_rilu9h", "data": {"amount": 4806}, "type": "test_event"}	2025-08-09 04:36:43.836	\N
evt_pfy43	wh_mailchimp	seed_script	session.booked	{"id": "obj_wqmd4", "data": {"amount": 3474}, "type": "test_event"}	2025-08-22 13:44:58.937	\N
evt_jkl063	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_kdyj5k", "data": {"amount": 1484}, "type": "test_event"}	2025-07-25 15:11:00.672	\N
evt_tqnbks	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_2cdmjcj", "data": {"amount": 4617}, "type": "test_event"}	2025-08-19 04:19:21.399	\N
evt_in06mn	wh_mailchimp	seed_script	analytics.track	{"id": "obj_gdjydg", "data": {"amount": 9136}, "type": "test_event"}	2025-07-29 07:15:59.245	\N
evt_6pn1w	wh_twilio_sms	seed_script	user.registered	{"id": "obj_020q2c", "data": {"amount": 8771}, "type": "test_event"}	2025-08-23 07:04:37.84	\N
evt_5i7t38	wh_analytics	seed_script	analytics.track	{"id": "obj_a1qin", "data": {"amount": 7045}, "type": "test_event"}	2025-07-26 16:06:06.066	\N
evt_tcypyg	wh_stripe_payments	seed_script	payment.succeeded	{"id": "obj_anh86c", "data": {"amount": 195}, "type": "test_event"}	2025-07-31 00:04:06.996	\N
evt_w543z	wh_stripe_payments	seed_script	sms.delivered	{"id": "obj_mzc7fx", "data": {"amount": 9857}, "type": "test_event"}	2025-07-30 14:23:34.454	\N
evt_n2wce7	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_76re7", "data": {"amount": 2960}, "type": "test_event"}	2025-07-28 03:48:36.473	\N
evt_s2gty	wh_mailchimp	seed_script	email.delivered	{"id": "obj_3wrv7p", "data": {"amount": 4300}, "type": "test_event"}	2025-07-26 02:07:17.743	\N
evt_rnl0hb	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_eht3oq", "data": {"amount": 7033}, "type": "test_event"}	2025-08-11 21:46:08.572	\N
evt_dvr67l	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_2omeb5", "data": {"amount": 3996}, "type": "test_event"}	2025-08-02 13:35:55.536	\N
evt_uby526	wh_analytics	seed_script	analytics.track	{"id": "obj_2kxtjn", "data": {"amount": 4934}, "type": "test_event"}	2025-08-10 09:48:01.586	\N
evt_g1l78q	wh_mailchimp	seed_script	sms.delivered	{"id": "obj_l1o7dj", "data": {"amount": 1951}, "type": "test_event"}	2025-08-01 05:41:49.353	\N
evt_jhy1ja	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_2zk1rj", "data": {"amount": 6210}, "type": "test_event"}	2025-08-08 13:52:49.722	\N
evt_wn1kz	wh_mailchimp	seed_script	payment.succeeded	{"id": "obj_c55nf", "data": {"amount": 2812}, "type": "test_event"}	2025-08-19 03:17:31.761	\N
evt_icw9p	wh_analytics	seed_script	sms.failed	{"id": "obj_bnesr9", "data": {"amount": 8387}, "type": "test_event"}	2025-08-10 21:44:27.392	\N
evt_ht865r	wh_stripe_payments	seed_script	payment.succeeded	{"id": "obj_wtepus", "data": {"amount": 2582}, "type": "test_event"}	2025-08-01 22:56:15.214	\N
evt_mpzngs	wh_analytics	seed_script	sms.failed	{"id": "obj_zeqd88", "data": {"amount": 1868}, "type": "test_event"}	2025-08-05 07:31:45.79	\N
evt_bow61	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_y54qgp", "data": {"amount": 2761}, "type": "test_event"}	2025-08-13 20:20:05.208	\N
evt_d0uxd	wh_twilio_sms	seed_script	analytics.track	{"id": "obj_ehzjb", "data": {"amount": 8559}, "type": "test_event"}	2025-08-16 21:14:53.261	\N
evt_ffp179	wh_mailchimp	seed_script	email.delivered	{"id": "obj_hh7pew", "data": {"amount": 7365}, "type": "test_event"}	2025-07-30 00:45:12.703	\N
evt_xqhxd	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_o66gdm", "data": {"amount": 5979}, "type": "test_event"}	2025-07-30 02:10:49.417	\N
evt_dhzcm	wh_twilio_sms	seed_script	user.registered	{"id": "obj_rsd9h8", "data": {"amount": 7640}, "type": "test_event"}	2025-08-21 17:45:03.757	\N
evt_bb9yzj	wh_analytics	seed_script	session.booked	{"id": "obj_gpw8ge", "data": {"amount": 271}, "type": "test_event"}	2025-07-29 07:04:00.392	\N
evt_ougact	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_alnx2", "data": {"amount": 7355}, "type": "test_event"}	2025-08-03 04:45:02.383	\N
evt_y5w6pr	wh_analytics	seed_script	session.booked	{"id": "obj_bkb4i9", "data": {"amount": 2149}, "type": "test_event"}	2025-07-30 02:45:42.434	\N
evt_ckza05	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_6f7tda", "data": {"amount": 4449}, "type": "test_event"}	2025-08-23 11:35:13.426	\N
evt_2pip7	wh_mailchimp	seed_script	sms.failed	{"id": "obj_funwks", "data": {"amount": 7734}, "type": "test_event"}	2025-07-28 19:35:18.129	\N
evt_vjcnee	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_n42uai", "data": {"amount": 3353}, "type": "test_event"}	2025-08-12 10:17:39.028	\N
evt_bzjzfr	wh_twilio_sms	seed_script	sms.failed	{"id": "obj_iajv4", "data": {"amount": 6956}, "type": "test_event"}	2025-07-25 01:50:06.737	\N
evt_9kh23o	wh_stripe_payments	seed_script	session.booked	{"id": "obj_2wu068", "data": {"amount": 8306}, "type": "test_event"}	2025-07-29 08:32:08.943	\N
evt_nb5a16	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_7ktbl5", "data": {"amount": 9400}, "type": "test_event"}	2025-08-06 14:01:54.934	\N
evt_82mo	wh_twilio_sms	seed_script	payment.succeeded	{"id": "obj_ry4xt", "data": {"amount": 701}, "type": "test_event"}	2025-08-18 05:10:18.148	\N
evt_2dfzz9	wh_mailchimp	seed_script	analytics.track	{"id": "obj_k4huhk", "data": {"amount": 7755}, "type": "test_event"}	2025-08-05 02:48:37.243	\N
evt_y6138	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_zxfw9", "data": {"amount": 8927}, "type": "test_event"}	2025-07-28 08:33:25.31	\N
evt_cwyfxl	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_u8268j", "data": {"amount": 4845}, "type": "test_event"}	2025-08-01 08:16:44.069	\N
evt_m2nr5r	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_0penz", "data": {"amount": 9651}, "type": "test_event"}	2025-08-19 15:45:56.971	\N
evt_f4dajqg	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_2mcrey", "data": {"amount": 8080}, "type": "test_event"}	2025-07-26 22:40:12.77	\N
evt_o8z0uj	wh_analytics	seed_script	email.bounce	{"id": "obj_jrxfim", "data": {"amount": 8608}, "type": "test_event"}	2025-08-18 16:38:26.702	\N
evt_darnhk	wh_mailchimp	seed_script	user.registered	{"id": "obj_0do4lo", "data": {"amount": 1839}, "type": "test_event"}	2025-08-12 12:42:08.475	\N
evt_mri407	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_qpz0b", "data": {"amount": 3047}, "type": "test_event"}	2025-08-03 22:28:45.041	\N
evt_3wijq	wh_twilio_sms	seed_script	payment.succeeded	{"id": "obj_edgap", "data": {"amount": 2087}, "type": "test_event"}	2025-08-22 18:55:06.668	\N
evt_koj42u	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_40lzzh", "data": {"amount": 5795}, "type": "test_event"}	2025-08-07 05:38:56.287	\N
evt_whlyj9	wh_stripe_payments	seed_script	sms.delivered	{"id": "obj_t7yo2p", "data": {"amount": 7817}, "type": "test_event"}	2025-08-08 05:59:12.404	\N
evt_8pkhdl	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_gbxtub", "data": {"amount": 4194}, "type": "test_event"}	2025-08-21 17:30:33.956	\N
evt_jg75ws	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_xmo3iq", "data": {"amount": 4539}, "type": "test_event"}	2025-08-20 15:44:06.766	\N
evt_mqakr	wh_mailchimp	seed_script	payment.failed	{"id": "obj_klfk16", "data": {"amount": 7090}, "type": "test_event"}	2025-07-29 16:03:52.534	\N
evt_eg2wr9	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_hsm9l", "data": {"amount": 544}, "type": "test_event"}	2025-08-11 22:08:20.048	\N
evt_p16zafy	wh_twilio_sms	seed_script	session.booked	{"id": "obj_v5b5n", "data": {"amount": 9153}, "type": "test_event"}	2025-08-03 10:48:31.01	\N
evt_uskcn	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_36t03", "data": {"amount": 2898}, "type": "test_event"}	2025-08-13 19:33:55.124	\N
evt_b8jiz	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_sc4oao", "data": {"amount": 9093}, "type": "test_event"}	2025-08-20 17:32:29.171	\N
evt_oc3can	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_1jnq5", "data": {"amount": 4994}, "type": "test_event"}	2025-08-14 17:29:46.21	\N
evt_bxvvm	wh_analytics	seed_script	user.registered	{"id": "obj_iq6n4n", "data": {"amount": 8686}, "type": "test_event"}	2025-07-29 19:27:28.143	\N
evt_tm5yt6	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_npi0mg", "data": {"amount": 1973}, "type": "test_event"}	2025-07-27 16:49:29.006	\N
evt_oj9e8o	wh_stripe_payments	seed_script	sms.delivered	{"id": "obj_x6fcwb", "data": {"amount": 4134}, "type": "test_event"}	2025-07-30 12:49:39.146	\N
evt_v89t4a	wh_analytics	seed_script	session.booked	{"id": "obj_gegi3", "data": {"amount": 4290}, "type": "test_event"}	2025-08-11 13:16:50.385	\N
evt_t07m0b	wh_mailchimp	seed_script	user.registered	{"id": "obj_63x6c", "data": {"amount": 5044}, "type": "test_event"}	2025-08-13 01:58:11.852	\N
evt_8wp9k	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_gv8s1k", "data": {"amount": 6160}, "type": "test_event"}	2025-08-13 23:42:32.956	\N
evt_d1rvs	wh_stripe_payments	seed_script	payment.succeeded	{"id": "obj_3sol3p", "data": {"amount": 2211}, "type": "test_event"}	2025-07-25 22:23:03.446	\N
evt_4bi1gd	wh_mailchimp	seed_script	analytics.track	{"id": "obj_iov9dw", "data": {"amount": 9966}, "type": "test_event"}	2025-08-16 23:08:50.223	\N
evt_h6u1io	wh_analytics	seed_script	sms.failed	{"id": "obj_mei4g", "data": {"amount": 3953}, "type": "test_event"}	2025-07-27 13:32:02.643	\N
evt_35g2scq	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_1w92we", "data": {"amount": 3060}, "type": "test_event"}	2025-07-28 09:43:08.543	\N
evt_gg5ux	wh_analytics	seed_script	payment.succeeded	{"id": "obj_yoj0c8", "data": {"amount": 1234}, "type": "test_event"}	2025-08-19 21:11:54.866	\N
evt_po96d	wh_stripe_payments	seed_script	sms.delivered	{"id": "obj_02lxhg", "data": {"amount": 4249}, "type": "test_event"}	2025-07-28 00:51:10.544	\N
evt_zb7v3q	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_mysywu", "data": {"amount": 3162}, "type": "test_event"}	2025-07-28 02:35:02.15	\N
evt_l66j1v	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_kzrlzl", "data": {"amount": 5792}, "type": "test_event"}	2025-07-28 01:51:04.823	\N
evt_r21d	wh_stripe_payments	seed_script	user.registered	{"id": "obj_jwnx5k", "data": {"amount": 4499}, "type": "test_event"}	2025-08-16 21:11:34.429	\N
evt_c3qdu	wh_mailchimp	seed_script	payment.failed	{"id": "obj_cu76im", "data": {"amount": 6760}, "type": "test_event"}	2025-08-19 22:59:37.756	\N
evt_y4ttu	wh_analytics	seed_script	email.bounce	{"id": "obj_wrk6qa", "data": {"amount": 2341}, "type": "test_event"}	2025-08-05 16:54:02.372	\N
evt_0gkb9u	wh_stripe_payments	seed_script	user.registered	{"id": "obj_6px68", "data": {"amount": 6688}, "type": "test_event"}	2025-08-23 13:27:33.249	\N
evt_yrxey7	wh_twilio_sms	seed_script	sms.delivered	{"id": "obj_zb0z7v", "data": {"amount": 7327}, "type": "test_event"}	2025-07-27 10:15:11.666	\N
evt_vkaxf	wh_twilio_sms	seed_script	analytics.track	{"id": "obj_i725im", "data": {"amount": 3208}, "type": "test_event"}	2025-08-01 20:04:48.363	\N
evt_rel2uh	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_btydb", "data": {"amount": 9500}, "type": "test_event"}	2025-08-13 20:45:44.079	\N
evt_1jnqeg	wh_twilio_sms	seed_script	sms.delivered	{"id": "obj_z1key9", "data": {"amount": 5674}, "type": "test_event"}	2025-08-15 22:54:13.186	\N
evt_obm452	wh_mailchimp	seed_script	email.delivered	{"id": "obj_87czw", "data": {"amount": 7973}, "type": "test_event"}	2025-08-05 03:08:37.497	\N
evt_r3az5u	wh_twilio_sms	seed_script	session.booked	{"id": "obj_617yz", "data": {"amount": 7815}, "type": "test_event"}	2025-08-16 09:28:54.829	\N
evt_3mdaoa	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_959cs2", "data": {"amount": 8907}, "type": "test_event"}	2025-08-05 12:52:35.249	\N
evt_ngrif	wh_stripe_payments	seed_script	session.booked	{"id": "obj_g1xrhk", "data": {"amount": 2510}, "type": "test_event"}	2025-08-07 19:53:08.847	\N
evt_g2ps9u	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_2r37l9", "data": {"amount": 9406}, "type": "test_event"}	2025-08-10 09:58:02.13	\N
evt_nvffza	wh_sendgrid_email	seed_script	user.registered	{"id": "obj_r0p45", "data": {"amount": 2927}, "type": "test_event"}	2025-08-11 15:27:10.682	\N
evt_eprp5	wh_analytics	seed_script	session.booked	{"id": "obj_yxtj3s", "data": {"amount": 8253}, "type": "test_event"}	2025-08-20 23:18:53.4	\N
evt_wga0li	wh_twilio_sms	seed_script	payment.failed	{"id": "obj_j9fv4g", "data": {"amount": 7460}, "type": "test_event"}	2025-08-12 13:21:59.577	\N
evt_70sf7t	wh_stripe_payments	seed_script	sms.failed	{"id": "obj_xltn4b", "data": {"amount": 9201}, "type": "test_event"}	2025-08-23 05:01:29.689	\N
evt_yu5ow3	wh_mailchimp	seed_script	session.booked	{"id": "obj_xvplxs", "data": {"amount": 2612}, "type": "test_event"}	2025-08-17 07:48:04.409	\N
evt_9yu1h	wh_analytics	seed_script	payment.succeeded	{"id": "obj_pepiqj", "data": {"amount": 4525}, "type": "test_event"}	2025-08-09 00:18:14.236	\N
evt_x1juhp	wh_sendgrid_email	seed_script	session.booked	{"id": "obj_k1tt8h", "data": {"amount": 2875}, "type": "test_event"}	2025-08-16 14:16:24.785	\N
evt_vejrvh	wh_twilio_sms	seed_script	payment.failed	{"id": "obj_rn6q7", "data": {"amount": 2197}, "type": "test_event"}	2025-08-22 21:11:47.321	\N
evt_gu5jwv	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_einznw", "data": {"amount": 4848}, "type": "test_event"}	2025-08-08 02:24:01.065	\N
evt_p6ntw	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_6jmvgb", "data": {"amount": 1181}, "type": "test_event"}	2025-08-19 12:17:04.88	\N
evt_g991yg	wh_stripe_payments	seed_script	email.bounce	{"id": "obj_p256hk", "data": {"amount": 2291}, "type": "test_event"}	2025-08-22 15:13:26.376	\N
evt_4oh89b	wh_twilio_sms	seed_script	session.booked	{"id": "obj_y70ty", "data": {"amount": 1024}, "type": "test_event"}	2025-08-20 16:21:04.076	\N
evt_njuq1s	wh_mailchimp	seed_script	sms.delivered	{"id": "obj_2pinoz", "data": {"amount": 502}, "type": "test_event"}	2025-08-08 20:17:58.231	\N
evt_q20az	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_gzncq", "data": {"amount": 979}, "type": "test_event"}	2025-08-06 14:26:51.562	\N
evt_v7qji	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_8pqdrn", "data": {"amount": 2521}, "type": "test_event"}	2025-08-16 16:01:05.478	\N
evt_9vc52h	wh_sendgrid_email	seed_script	payment.failed	{"id": "obj_3rvvw", "data": {"amount": 8531}, "type": "test_event"}	2025-07-28 00:21:11.334	\N
evt_bzy829	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_7bbh4p", "data": {"amount": 148}, "type": "test_event"}	2025-07-25 06:01:00.907	\N
evt_9py3ct	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_mt693", "data": {"amount": 7213}, "type": "test_event"}	2025-08-16 21:16:28.827	\N
evt_50ten	wh_stripe_payments	seed_script	sms.failed	{"id": "obj_udkpe8uh", "data": {"amount": 8130}, "type": "test_event"}	2025-08-19 16:20:28.217	\N
evt_rp58cd	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_baqea9", "data": {"amount": 9534}, "type": "test_event"}	2025-08-16 20:35:53.179	\N
evt_od3x26	wh_mailchimp	seed_script	email.bounce	{"id": "obj_njju8n", "data": {"amount": 7255}, "type": "test_event"}	2025-08-01 19:35:47.238	\N
evt_5ovq9f	wh_stripe_payments	seed_script	session.booked	{"id": "obj_i479ap", "data": {"amount": 714}, "type": "test_event"}	2025-07-30 23:29:35.62	\N
evt_zo4qh9	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_6vubyh", "data": {"amount": 7048}, "type": "test_event"}	2025-07-29 19:30:18.948	\N
evt_sg97j	wh_sendgrid_email	seed_script	sms.delivered	{"id": "obj_lriqhf", "data": {"amount": 8012}, "type": "test_event"}	2025-08-16 09:58:07.95	\N
evt_2fkt49	wh_sendgrid_email	seed_script	session.booked	{"id": "obj_2j0mfp", "data": {"amount": 9458}, "type": "test_event"}	2025-08-18 12:51:05.211	\N
evt_qptnuj	wh_mailchimp	seed_script	sms.failed	{"id": "obj_c650cv", "data": {"amount": 5650}, "type": "test_event"}	2025-08-05 04:24:18.542	\N
evt_nocjg	wh_analytics	seed_script	sms.failed	{"id": "obj_pwlh5", "data": {"amount": 2109}, "type": "test_event"}	2025-08-06 18:01:11.86	\N
evt_on5e8	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_l1o1ye", "data": {"amount": 5417}, "type": "test_event"}	2025-08-20 07:56:01.418	\N
evt_rvy57d	wh_analytics	seed_script	session.booked	{"id": "obj_0v78dp", "data": {"amount": 2185}, "type": "test_event"}	2025-07-28 04:18:46.451	\N
evt_8v5zxh	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_0d9wwk", "data": {"amount": 306}, "type": "test_event"}	2025-07-30 13:34:49.873	\N
evt_lwvkjj	wh_stripe_payments	seed_script	analytics.track	{"id": "obj_87eqit", "data": {"amount": 2482}, "type": "test_event"}	2025-07-25 11:51:37.874	\N
evt_stpy7t	wh_stripe_payments	seed_script	session.booked	{"id": "obj_fhiq28", "data": {"amount": 6139}, "type": "test_event"}	2025-08-22 23:30:33.131	\N
evt_pa02j	wh_mailchimp	seed_script	payment.failed	{"id": "obj_tlgtkk", "data": {"amount": 657}, "type": "test_event"}	2025-08-16 17:44:52.193	\N
evt_pome35	wh_stripe_payments	seed_script	sms.delivered	{"id": "obj_ywp9jm", "data": {"amount": 6091}, "type": "test_event"}	2025-08-11 00:08:54.55	\N
evt_rwfc4b	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_mof7dt", "data": {"amount": 6920}, "type": "test_event"}	2025-08-11 01:29:46.143	\N
evt_8bod6	wh_analytics	seed_script	email.delivered	{"id": "obj_7vwniw", "data": {"amount": 1634}, "type": "test_event"}	2025-08-11 06:08:10.344	\N
evt_rduir5	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_k0k0ql", "data": {"amount": 4013}, "type": "test_event"}	2025-07-28 15:18:24.584	\N
evt_r6767i	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_ctfiwr", "data": {"amount": 366}, "type": "test_event"}	2025-08-08 21:18:51.276	\N
evt_2pob7	wh_mailchimp	seed_script	session.booked	{"id": "obj_fsmykk", "data": {"amount": 6922}, "type": "test_event"}	2025-08-03 00:03:41.25	\N
evt_qluan	wh_twilio_sms	seed_script	email.delivered	{"id": "obj_5uulpr", "data": {"amount": 824}, "type": "test_event"}	2025-08-15 22:31:18.974	\N
evt_j5dg5j	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_8xblpe", "data": {"amount": 9771}, "type": "test_event"}	2025-08-12 08:12:44.254	\N
evt_78npp	wh_sendgrid_email	seed_script	email.bounce	{"id": "obj_79wydp", "data": {"amount": 7951}, "type": "test_event"}	2025-08-08 21:32:08.893	\N
evt_owg19w	wh_twilio_sms	seed_script	sms.failed	{"id": "obj_7x6ta", "data": {"amount": 7772}, "type": "test_event"}	2025-07-28 03:34:57.803	\N
evt_mhae1f	wh_mailchimp	seed_script	session.cancelled	{"id": "obj_684k1", "data": {"amount": 3706}, "type": "test_event"}	2025-07-28 20:38:27.082	\N
evt_wjqyf	wh_sendgrid_email	seed_script	email.bounce	{"id": "obj_40dcr9", "data": {"amount": 3247}, "type": "test_event"}	2025-08-08 11:47:30.834	\N
evt_phx8jv	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_nqiuip", "data": {"amount": 5416}, "type": "test_event"}	2025-08-19 11:01:32.157	\N
evt_jjsotx	wh_stripe_payments	seed_script	sms.failed	{"id": "obj_nhvon9", "data": {"amount": 8962}, "type": "test_event"}	2025-08-01 07:54:21.321	\N
evt_cjeqtd	wh_sendgrid_email	seed_script	email.bounce	{"id": "obj_15fate", "data": {"amount": 116}, "type": "test_event"}	2025-07-30 16:52:27.464	\N
evt_ggk0w	wh_stripe_payments	seed_script	email.delivered	{"id": "obj_f2tg0d", "data": {"amount": 7900}, "type": "test_event"}	2025-08-23 09:54:58.212	\N
evt_jf6h4	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_k5q25g", "data": {"amount": 3675}, "type": "test_event"}	2025-08-14 13:23:21.922	\N
evt_p0ig08	wh_sendgrid_email	seed_script	payment.failed	{"id": "obj_sslq1j", "data": {"amount": 420}, "type": "test_event"}	2025-08-07 03:41:49.748	\N
evt_hf3kum	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_duztu", "data": {"amount": 9610}, "type": "test_event"}	2025-07-31 01:59:36.033	\N
evt_7znwbw	wh_mailchimp	seed_script	email.delivered	{"id": "obj_6guopd", "data": {"amount": 8096}, "type": "test_event"}	2025-08-05 04:35:42.91	\N
evt_nuhwmd	wh_mailchimp	seed_script	analytics.track	{"id": "obj_4gqev", "data": {"amount": 7599}, "type": "test_event"}	2025-08-11 19:29:40.4	\N
evt_5tid2b	wh_stripe_payments	seed_script	session.booked	{"id": "obj_2qac5c", "data": {"amount": 5415}, "type": "test_event"}	2025-08-23 16:48:45.791	\N
evt_qr39y	wh_mailchimp	seed_script	user.registered	{"id": "obj_x2ggk5", "data": {"amount": 5861}, "type": "test_event"}	2025-07-31 07:35:38.659	\N
evt_r6f9fj	wh_analytics	seed_script	payment.succeeded	{"id": "obj_4w3n3", "data": {"amount": 246}, "type": "test_event"}	2025-07-25 08:44:23.782	\N
evt_eis45g	wh_analytics	seed_script	analytics.track	{"id": "obj_gcj0yp", "data": {"amount": 9241}, "type": "test_event"}	2025-08-02 03:09:29.972	\N
evt_mx2oc	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_azl2yi", "data": {"amount": 3134}, "type": "test_event"}	2025-08-10 01:37:05.098	\N
evt_iqzzqr	wh_sendgrid_email	seed_script	email.bounce	{"id": "obj_hwg9ij", "data": {"amount": 5075}, "type": "test_event"}	2025-08-21 05:37:37.771	\N
evt_mbll8	wh_sendgrid_email	seed_script	email.bounce	{"id": "obj_e5z1w8", "data": {"amount": 393}, "type": "test_event"}	2025-07-31 02:47:58.534	\N
evt_2o82r5	wh_analytics	seed_script	session.booked	{"id": "obj_lpeb5", "data": {"amount": 1522}, "type": "test_event"}	2025-08-17 13:29:02.421	\N
evt_6mrv4a	wh_stripe_payments	seed_script	session.booked	{"id": "obj_08ju9", "data": {"amount": 8600}, "type": "test_event"}	2025-08-03 05:37:04.236	\N
evt_zxxb9fk	wh_analytics	seed_script	user.registered	{"id": "obj_ez1x4w", "data": {"amount": 7765}, "type": "test_event"}	2025-08-15 13:00:09.014	\N
evt_wz9tvf	wh_sendgrid_email	seed_script	email.bounce	{"id": "obj_a91lam", "data": {"amount": 2082}, "type": "test_event"}	2025-08-08 21:41:21.945	\N
evt_csly0i	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_o4m2zm", "data": {"amount": 4128}, "type": "test_event"}	2025-07-26 04:13:18.052	\N
evt_769l4	wh_stripe_payments	seed_script	sms.delivered	{"id": "obj_6lk3es", "data": {"amount": 5722}, "type": "test_event"}	2025-08-05 09:46:43.882	\N
evt_hoyxjh	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_m5ibq", "data": {"amount": 486}, "type": "test_event"}	2025-08-06 00:05:35.103	\N
evt_f9kycf	wh_analytics	seed_script	analytics.track	{"id": "obj_w5hiu7", "data": {"amount": 615}, "type": "test_event"}	2025-08-09 02:31:48.299	\N
evt_evvbpg	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_ocrfr", "data": {"amount": 5656}, "type": "test_event"}	2025-08-13 04:40:03.09	\N
evt_cpa9cg	wh_analytics	seed_script	user.registered	{"id": "obj_8fx8s7", "data": {"amount": 5945}, "type": "test_event"}	2025-08-07 03:26:00.143	\N
evt_5ycoge	wh_mailchimp	seed_script	analytics.track	{"id": "obj_2vebii", "data": {"amount": 9455}, "type": "test_event"}	2025-08-06 16:44:36.245	\N
evt_nodjge	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_hjinl", "data": {"amount": 3176}, "type": "test_event"}	2025-07-25 02:23:28.706	\N
evt_d2wx2g	wh_mailchimp	seed_script	email.delivered	{"id": "obj_b07vhe", "data": {"amount": 3028}, "type": "test_event"}	2025-08-23 01:21:51.677	\N
evt_2bqqaj	wh_stripe_payments	seed_script	payment.failed	{"id": "obj_idy3x1l", "data": {"amount": 3849}, "type": "test_event"}	2025-07-28 11:55:57.691	\N
evt_9laena	wh_mailchimp	seed_script	payment.failed	{"id": "obj_nrsdv", "data": {"amount": 8486}, "type": "test_event"}	2025-08-11 22:00:52.52	\N
evt_97294mn	wh_analytics	seed_script	session.booked	{"id": "obj_yt19o", "data": {"amount": 3261}, "type": "test_event"}	2025-08-06 19:52:12.79	\N
evt_64846d	wh_analytics	seed_script	analytics.track	{"id": "obj_cisynn", "data": {"amount": 2891}, "type": "test_event"}	2025-08-03 01:31:41.14	\N
evt_haqnjd	wh_mailchimp	seed_script	user.registered	{"id": "obj_s5ttuq", "data": {"amount": 3291}, "type": "test_event"}	2025-08-01 16:36:52.652	\N
evt_h6v9gu	wh_mailchimp	seed_script	payment.failed	{"id": "obj_5z8x5n", "data": {"amount": 117}, "type": "test_event"}	2025-07-29 11:49:26.549	\N
evt_n468y9	wh_stripe_payments	seed_script	payment.succeeded	{"id": "obj_rklxgw", "data": {"amount": 2311}, "type": "test_event"}	2025-08-09 08:43:30.499	\N
evt_l6ydnd	wh_stripe_payments	seed_script	sms.delivered	{"id": "obj_ci1kt1", "data": {"amount": 8303}, "type": "test_event"}	2025-08-17 19:58:48.532	\N
evt_b8r6ab	wh_analytics	seed_script	email.bounce	{"id": "obj_b4q8a4", "data": {"amount": 1601}, "type": "test_event"}	2025-08-16 14:18:41.159	\N
evt_dneorx	wh_analytics	seed_script	session.booked	{"id": "obj_xp33c", "data": {"amount": 58}, "type": "test_event"}	2025-08-03 08:46:56.243	\N
evt_48wtn	wh_twilio_sms	seed_script	email.bounce	{"id": "obj_rc1nmb", "data": {"amount": 4629}, "type": "test_event"}	2025-08-10 07:48:53.642	\N
evt_c3itk	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_3jyxdd", "data": {"amount": 1233}, "type": "test_event"}	2025-08-08 04:42:30.211	\N
evt_n1sneb	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_jeu5d", "data": {"amount": 1528}, "type": "test_event"}	2025-08-21 20:17:07.695	\N
evt_sspzd	wh_twilio_sms	seed_script	payment.succeeded	{"id": "obj_ktgzxk", "data": {"amount": 8722}, "type": "test_event"}	2025-08-10 12:21:59.709	\N
evt_j32od	wh_mailchimp	seed_script	payment.failed	{"id": "obj_c0ojg", "data": {"amount": 9758}, "type": "test_event"}	2025-08-03 13:23:40.444	\N
evt_6359ql	wh_analytics	seed_script	payment.failed	{"id": "obj_suk5xx", "data": {"amount": 2057}, "type": "test_event"}	2025-08-16 08:15:39.478	\N
evt_qnja1q	wh_analytics	seed_script	analytics.track	{"id": "obj_n6t019", "data": {"amount": 2424}, "type": "test_event"}	2025-08-21 21:14:02.956	\N
evt_z3pql	wh_mailchimp	seed_script	payment.succeeded	{"id": "obj_dpdqbk", "data": {"amount": 4474}, "type": "test_event"}	2025-08-17 00:52:39.954	\N
evt_dy1xeg	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_q7ilcf", "data": {"amount": 991}, "type": "test_event"}	2025-08-15 02:45:16.349	\N
evt_3vesd	wh_twilio_sms	seed_script	user.registered	{"id": "obj_9a51mo", "data": {"amount": 65}, "type": "test_event"}	2025-07-24 23:37:18.309	\N
evt_rhuqof	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_9dqgbv", "data": {"amount": 2985}, "type": "test_event"}	2025-08-16 02:42:02.662	\N
evt_muwv3f	wh_stripe_payments	seed_script	email.bounce	{"id": "obj_ybfql", "data": {"amount": 6704}, "type": "test_event"}	2025-07-25 02:08:39.887	\N
evt_075iee	wh_sendgrid_email	seed_script	analytics.track	{"id": "obj_iwgdbp", "data": {"amount": 1963}, "type": "test_event"}	2025-08-03 06:53:36.228	\N
evt_523o6	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_j6wkw", "data": {"amount": 4964}, "type": "test_event"}	2025-08-04 23:46:29.558	\N
evt_tkluz5	wh_analytics	seed_script	sms.delivered	{"id": "obj_q5j0i", "data": {"amount": 7826}, "type": "test_event"}	2025-08-15 05:46:39.027	\N
evt_gc7e5q	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_wrxty", "data": {"amount": 3669}, "type": "test_event"}	2025-07-25 01:57:09.864	\N
evt_f9h05z	wh_mailchimp	seed_script	email.delivered	{"id": "obj_r23wu4", "data": {"amount": 2666}, "type": "test_event"}	2025-08-22 09:30:33.293	\N
evt_ekqm5l	wh_stripe_payments	seed_script	user.registered	{"id": "obj_7465v8", "data": {"amount": 9682}, "type": "test_event"}	2025-08-07 10:12:05.007	\N
evt_be66bu	wh_stripe_payments	seed_script	sms.failed	{"id": "obj_z2gl56", "data": {"amount": 9929}, "type": "test_event"}	2025-08-20 06:14:24.818	\N
evt_5vav6s	wh_analytics	seed_script	sms.delivered	{"id": "obj_w6t8", "data": {"amount": 5633}, "type": "test_event"}	2025-08-13 22:05:31.478	\N
evt_wtigjl	wh_sendgrid_email	seed_script	session.booked	{"id": "obj_jabhme", "data": {"amount": 8509}, "type": "test_event"}	2025-08-01 09:11:37.082	\N
evt_ckjux	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_g0za0h", "data": {"amount": 719}, "type": "test_event"}	2025-08-18 03:12:45.647	\N
evt_q4pnb	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_zqb2uw", "data": {"amount": 2710}, "type": "test_event"}	2025-08-22 22:29:23.096	\N
evt_ug6s7b	wh_sendgrid_email	seed_script	session.booked	{"id": "obj_rdctc4", "data": {"amount": 7001}, "type": "test_event"}	2025-08-06 07:52:49.008	\N
evt_htzxqf	wh_analytics	seed_script	payment.succeeded	{"id": "obj_6rb5pr", "data": {"amount": 2269}, "type": "test_event"}	2025-07-29 18:47:12.152	\N
evt_lmxlib	wh_sendgrid_email	seed_script	session.cancelled	{"id": "obj_x5u2lb", "data": {"amount": 2274}, "type": "test_event"}	2025-07-30 14:55:44.65	\N
evt_to1quj	wh_stripe_payments	seed_script	user.registered	{"id": "obj_bi2ji9", "data": {"amount": 7340}, "type": "test_event"}	2025-08-20 20:37:50.47	\N
evt_o5umag	wh_stripe_payments	seed_script	payment.succeeded	{"id": "obj_qvonuo", "data": {"amount": 2300}, "type": "test_event"}	2025-08-22 15:33:57.396	\N
evt_x28zufr	wh_sendgrid_email	seed_script	email.bounce	{"id": "obj_530xng", "data": {"amount": 2118}, "type": "test_event"}	2025-07-26 03:40:54.155	\N
evt_j6o9an	wh_twilio_sms	seed_script	session.cancelled	{"id": "obj_9c4ngb", "data": {"amount": 9806}, "type": "test_event"}	2025-08-06 00:08:24.673	\N
evt_nzwbl2	wh_mailchimp	seed_script	payment.failed	{"id": "obj_xdu76w", "data": {"amount": 9761}, "type": "test_event"}	2025-08-15 14:39:15.499	\N
evt_ovbtqh	wh_analytics	seed_script	session.booked	{"id": "obj_aseaik", "data": {"amount": 8433}, "type": "test_event"}	2025-07-25 03:18:02.783	\N
evt_9r1wx3	wh_twilio_sms	seed_script	payment.failed	{"id": "obj_npem6o", "data": {"amount": 1081}, "type": "test_event"}	2025-08-17 06:35:38.642	\N
evt_720qz	wh_mailchimp	seed_script	payment.failed	{"id": "obj_guor2k", "data": {"amount": 7430}, "type": "test_event"}	2025-08-17 11:08:39.393	\N
evt_3qspe	wh_mailchimp	seed_script	sms.failed	{"id": "obj_lxfb5", "data": {"amount": 2695}, "type": "test_event"}	2025-08-16 05:56:25.614	\N
evt_e3vrt	wh_stripe_payments	seed_script	sms.failed	{"id": "obj_6masm3", "data": {"amount": 2170}, "type": "test_event"}	2025-08-17 02:04:00.544	\N
evt_hv2ujo	wh_analytics	seed_script	user.registered	{"id": "obj_yn3x0h", "data": {"amount": 5095}, "type": "test_event"}	2025-07-25 11:01:49.954	\N
evt_fyuab	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_83pwfs", "data": {"amount": 9616}, "type": "test_event"}	2025-08-21 00:16:30.499	\N
evt_4f7t8i	wh_analytics	seed_script	payment.failed	{"id": "obj_m40in", "data": {"amount": 9674}, "type": "test_event"}	2025-08-23 16:39:08.891	\N
evt_0n5xvf	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_77hvpk", "data": {"amount": 8871}, "type": "test_event"}	2025-08-10 08:53:58.184	\N
evt_t0nium	wh_mailchimp	seed_script	user.registered	{"id": "obj_13ipn", "data": {"amount": 1987}, "type": "test_event"}	2025-07-25 13:10:04.259	\N
evt_qwlzwh	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_vqhips", "data": {"amount": 3912}, "type": "test_event"}	2025-08-21 05:50:58.003	\N
evt_b1jaom	wh_sendgrid_email	seed_script	email.delivered	{"id": "obj_vdz46", "data": {"amount": 5362}, "type": "test_event"}	2025-08-06 14:53:08.488	\N
evt_7zq2qe	wh_analytics	seed_script	payment.succeeded	{"id": "obj_5abfo", "data": {"amount": 2363}, "type": "test_event"}	2025-08-06 12:29:15.1	\N
evt_qmjktq	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_5syeae", "data": {"amount": 3314}, "type": "test_event"}	2025-08-06 10:40:16.679	\N
evt_uheylg	wh_mailchimp	seed_script	sms.delivered	{"id": "obj_f978yp", "data": {"amount": 7}, "type": "test_event"}	2025-08-02 17:01:41.814	\N
evt_810nrr	wh_sendgrid_email	seed_script	sms.failed	{"id": "obj_z4x9ra", "data": {"amount": 6697}, "type": "test_event"}	2025-08-20 05:54:48.301	\N
evt_52k4ob	wh_analytics	seed_script	analytics.track	{"id": "obj_qpa6l", "data": {"amount": 600}, "type": "test_event"}	2025-08-04 01:32:05.716	\N
evt_ba17he	wh_stripe_payments	seed_script	session.cancelled	{"id": "obj_8myoif", "data": {"amount": 5336}, "type": "test_event"}	2025-08-07 17:20:45.006	\N
evt_bbb4ra	wh_stripe_payments	seed_script	sms.failed	{"id": "obj_bip0k4", "data": {"amount": 8102}, "type": "test_event"}	2025-08-06 06:18:22.943	\N
evt_1c8vta	wh_sendgrid_email	seed_script	payment.succeeded	{"id": "obj_1p5e1i", "data": {"amount": 1723}, "type": "test_event"}	2025-07-31 12:58:58.539	\N
evt_885c2	wh_sendgrid_email	seed_script	user.registered	{"id": "obj_jiqa4k", "data": {"amount": 5949}, "type": "test_event"}	2025-08-14 21:27:19.02	\N
evt_3gr64	wh_twilio_sms	seed_script	sms.delivered	{"id": "obj_haikf", "data": {"amount": 563}, "type": "test_event"}	2025-08-22 00:33:15.557	\N
evt_i1lijm	wh_analytics	seed_script	sms.delivered	{"id": "obj_r2tnyk", "data": {"amount": 2687}, "type": "test_event"}	2025-07-25 21:36:33.597	\N
evt_2dmzhk	wh_mailchimp	seed_script	email.bounce	{"id": "obj_jqmwos", "data": {"amount": 8277}, "type": "test_event"}	2025-08-07 11:37:18.778	\N
evt_oaqcv	wh_stripe_payments	seed_script	sms.delivered	{"id": "obj_feznhc", "data": {"amount": 9085}, "type": "test_event"}	2025-08-05 20:38:17.411	\N
evt_8owj77	wh_twilio_sms	seed_script	session.booked	{"id": "obj_fgufix", "data": {"amount": 924}, "type": "test_event"}	2025-08-02 12:31:56.459	\N
evt_lwbi6	wh_twilio_sms	seed_script	user.registered	{"id": "obj_ju5mg5", "data": {"amount": 7268}, "type": "test_event"}	2025-07-28 14:31:03.109	\N
evt_50hi3i	wh_analytics	seed_script	analytics.track	{"id": "obj_3r7fd", "data": {"amount": 1475}, "type": "test_event"}	2025-08-23 10:43:24.571	\N
evt_py6ms	wh_stripe_payments	seed_script	email.delivered	{"id": "obj_7mw5zf", "data": {"amount": 4800}, "type": "test_event"}	2025-08-09 01:17:32.464	\N
evt_n2e0fr	wh_analytics	seed_script	email.bounce	{"id": "obj_rwa9h", "data": {"amount": 3523}, "type": "test_event"}	2025-08-23 16:11:54.98	\N
evt_4j5cpr	wh_mailchimp	seed_script	payment.succeeded	{"id": "obj_w34lvu", "data": {"amount": 6973}, "type": "test_event"}	2025-08-13 14:13:45.39	\N
evt_b74h9g	wh_twilio_sms	seed_script	analytics.track	{"id": "obj_zt0mvls", "data": {"amount": 863}, "type": "test_event"}	2025-08-08 19:34:33.946	\N
evt_f9rcd	wh_twilio_sms	seed_script	payment.failed	{"id": "obj_froa1f", "data": {"amount": 5185}, "type": "test_event"}	2025-07-29 14:31:46.294	\N
evt_vukmjr	wh_twilio_sms	seed_script	sms.failed	{"id": "obj_v9vuj4", "data": {"amount": 394}, "type": "test_event"}	2025-07-28 15:50:23.655	\N
evt_c17scs	wh_mailchimp	seed_script	analytics.track	{"id": "obj_23meij", "data": {"amount": 7322}, "type": "test_event"}	2025-08-22 15:04:20.756	\N
\.


--
-- Data for Name: webhook_stats_hourly; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhook_stats_hourly (webhook_id, hour, attempts, success, failed, p95_latency_ms, created_at) FROM stdin;
\.


--
-- Name: ai_anomalies ai_anomalies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_anomalies
    ADD CONSTRAINT ai_anomalies_pkey PRIMARY KEY (id);


--
-- Name: ai_contributions ai_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_contributions
    ADD CONSTRAINT ai_contributions_pkey PRIMARY KEY (id);


--
-- Name: ai_forecasts_daily ai_forecasts_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_forecasts_daily
    ADD CONSTRAINT ai_forecasts_daily_pkey PRIMARY KEY (id);


--
-- Name: ai_narratives ai_narratives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_narratives
    ADD CONSTRAINT ai_narratives_pkey PRIMARY KEY (id);


--
-- Name: ai_tenant_scores ai_tenant_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_tenant_scores
    ADD CONSTRAINT ai_tenant_scores_pkey PRIMARY KEY (id);


--
-- Name: attendance_snapshots attendance_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_snapshots
    ADD CONSTRAINT attendance_snapshots_pkey PRIMARY KEY (id);


--
-- Name: audit_events audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: comm_templates comm_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comm_templates
    ADD CONSTRAINT comm_templates_pkey PRIMARY KEY (id);


--
-- Name: consent_documents consent_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_documents
    ADD CONSTRAINT consent_documents_pkey PRIMARY KEY (id);


--
-- Name: consent_events consent_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_events
    ADD CONSTRAINT consent_events_pkey PRIMARY KEY (id);


--
-- Name: consent_templates consent_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_templates
    ADD CONSTRAINT consent_templates_pkey PRIMARY KEY (id);


--
-- Name: contact_group_members contact_group_members_group_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_group_members
    ADD CONSTRAINT contact_group_members_group_id_user_id_key UNIQUE (group_id, user_id);


--
-- Name: contact_group_members contact_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_group_members
    ADD CONSTRAINT contact_group_members_pkey PRIMARY KEY (id);


--
-- Name: contact_groups contact_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_groups
    ADD CONSTRAINT contact_groups_pkey PRIMARY KEY (id);


--
-- Name: dev_achievements dev_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_achievements
    ADD CONSTRAINT dev_achievements_pkey PRIMARY KEY (id);


--
-- Name: dev_skill_categories dev_skill_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_skill_categories
    ADD CONSTRAINT dev_skill_categories_pkey PRIMARY KEY (id);


--
-- Name: dev_skill_rubrics dev_skill_rubrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_skill_rubrics
    ADD CONSTRAINT dev_skill_rubrics_pkey PRIMARY KEY (id);


--
-- Name: dev_skills dev_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_skills
    ADD CONSTRAINT dev_skills_pkey PRIMARY KEY (id);


--
-- Name: discount_codes discount_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_pkey PRIMARY KEY (id);


--
-- Name: drills_library drills_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drills_library
    ADD CONSTRAINT drills_library_pkey PRIMARY KEY (id);


--
-- Name: dunning_events dunning_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dunning_events
    ADD CONSTRAINT dunning_events_pkey PRIMARY KEY (id);


--
-- Name: email_events email_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_events
    ADD CONSTRAINT email_events_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: feature_adoption_events feature_adoption_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_adoption_events
    ADD CONSTRAINT feature_adoption_events_pkey PRIMARY KEY (id);


--
-- Name: feature_audit_log feature_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_audit_log
    ADD CONSTRAINT feature_audit_log_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: feature_requests feature_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_requests
    ADD CONSTRAINT feature_requests_pkey PRIMARY KEY (id);


--
-- Name: features features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_pkey PRIMARY KEY (key);


--
-- Name: financial_transactions financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_pkey PRIMARY KEY (id);


--
-- Name: futsal_sessions futsal_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.futsal_sessions
    ADD CONSTRAINT futsal_sessions_pkey PRIMARY KEY (id);


--
-- Name: guardian_links guardian_links_parent_id_player_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_links
    ADD CONSTRAINT guardian_links_parent_id_player_id_key UNIQUE (parent_id, player_id);


--
-- Name: guardian_links guardian_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_links
    ADD CONSTRAINT guardian_links_pkey PRIMARY KEY (id);


--
-- Name: help_requests help_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_requests
    ADD CONSTRAINT help_requests_pkey PRIMARY KEY (id);


--
-- Name: household_members household_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_pkey PRIMARY KEY (id);


--
-- Name: households households_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_pkey PRIMARY KEY (id);


--
-- Name: impersonation_events impersonation_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impersonation_events
    ADD CONSTRAINT impersonation_events_pkey PRIMARY KEY (id);


--
-- Name: integration_status_pings integration_status_pings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_status_pings
    ADD CONSTRAINT integration_status_pings_pkey PRIMARY KEY (id);


--
-- Name: integration_webhook integration_webhook_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_webhook
    ADD CONSTRAINT integration_webhook_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: invitation_analytics invitation_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_analytics
    ADD CONSTRAINT invitation_analytics_pkey PRIMARY KEY (id);


--
-- Name: invitation_batches invitation_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_batches
    ADD CONSTRAINT invitation_batches_pkey PRIMARY KEY (id);


--
-- Name: invite_codes invite_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_pkey PRIMARY KEY (id);


--
-- Name: invite_tokens invite_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_tokens
    ADD CONSTRAINT invite_tokens_pkey PRIMARY KEY (id);


--
-- Name: invite_tokens invite_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_tokens
    ADD CONSTRAINT invite_tokens_token_key UNIQUE (token);


--
-- Name: message_logs message_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_logs
    ADD CONSTRAINT message_logs_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_parent_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_parent_id_unique UNIQUE (parent_id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: plan_catalog plan_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_catalog
    ADD CONSTRAINT plan_catalog_pkey PRIMARY KEY (code);


--
-- Name: plan_features plan_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_pkey PRIMARY KEY (id);


--
-- Name: plan_features plan_features_plan_code_feature_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_plan_code_feature_key_key UNIQUE (plan_code, feature_key);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: player_assessment_items player_assessment_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_assessment_items
    ADD CONSTRAINT player_assessment_items_pkey PRIMARY KEY (id);


--
-- Name: player_assessments player_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_assessments
    ADD CONSTRAINT player_assessments_pkey PRIMARY KEY (id);


--
-- Name: player_goal_updates player_goal_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_goal_updates
    ADD CONSTRAINT player_goal_updates_pkey PRIMARY KEY (id);


--
-- Name: player_goals player_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_goals
    ADD CONSTRAINT player_goals_pkey PRIMARY KEY (id);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: progression_snapshots progression_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progression_snapshots
    ADD CONSTRAINT progression_snapshots_pkey PRIMARY KEY (id);


--
-- Name: quickbooks_account_mappings quickbooks_account_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quickbooks_account_mappings
    ADD CONSTRAINT quickbooks_account_mappings_pkey PRIMARY KEY (id);


--
-- Name: quickbooks_connections quickbooks_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quickbooks_connections
    ADD CONSTRAINT quickbooks_connections_pkey PRIMARY KEY (id);


--
-- Name: quickbooks_sync_logs quickbooks_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quickbooks_sync_logs
    ADD CONSTRAINT quickbooks_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: quickbooks_sync_preferences quickbooks_sync_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quickbooks_sync_preferences
    ADD CONSTRAINT quickbooks_sync_preferences_pkey PRIMARY KEY (id);


--
-- Name: service_billing service_billing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_billing
    ADD CONSTRAINT service_billing_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: signed_consents signed_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signed_consents
    ADD CONSTRAINT signed_consents_pkey PRIMARY KEY (id);


--
-- Name: signups signups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signups
    ADD CONSTRAINT signups_pkey PRIMARY KEY (id);


--
-- Name: sms_credit_packages sms_credit_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_credit_packages
    ADD CONSTRAINT sms_credit_packages_pkey PRIMARY KEY (id);


--
-- Name: sms_credit_transactions sms_credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_credit_transactions
    ADD CONSTRAINT sms_credit_transactions_pkey PRIMARY KEY (id);


--
-- Name: sms_events sms_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_events
    ADD CONSTRAINT sms_events_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_feature_overrides tenant_feature_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_feature_overrides
    ADD CONSTRAINT tenant_feature_overrides_pkey PRIMARY KEY (id);


--
-- Name: tenant_feature_overrides tenant_feature_overrides_tenant_id_feature_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_feature_overrides
    ADD CONSTRAINT tenant_feature_overrides_tenant_id_feature_key_key UNIQUE (tenant_id, feature_key);


--
-- Name: tenant_invite_codes tenant_invite_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invite_codes
    ADD CONSTRAINT tenant_invite_codes_code_key UNIQUE (code);


--
-- Name: tenant_invite_codes tenant_invite_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invite_codes
    ADD CONSTRAINT tenant_invite_codes_pkey PRIMARY KEY (id);


--
-- Name: tenant_invoice_lines tenant_invoice_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invoice_lines
    ADD CONSTRAINT tenant_invoice_lines_pkey PRIMARY KEY (id);


--
-- Name: tenant_invoices tenant_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invoices
    ADD CONSTRAINT tenant_invoices_pkey PRIMARY KEY (id);


--
-- Name: tenant_memberships tenant_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_memberships
    ADD CONSTRAINT tenant_memberships_pkey PRIMARY KEY (id);


--
-- Name: tenant_memberships tenant_memberships_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_memberships
    ADD CONSTRAINT tenant_memberships_unique UNIQUE (tenant_id, user_id, role);


--
-- Name: tenant_plan_assignments tenant_plan_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_plan_assignments
    ADD CONSTRAINT tenant_plan_assignments_pkey PRIMARY KEY (id);


--
-- Name: tenant_plan_history tenant_plan_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_plan_history
    ADD CONSTRAINT tenant_plan_history_pkey PRIMARY KEY (id);


--
-- Name: tenant_policies tenant_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_policies
    ADD CONSTRAINT tenant_policies_pkey PRIMARY KEY (id);


--
-- Name: tenant_policies tenant_policies_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_policies
    ADD CONSTRAINT tenant_policies_tenant_id_key UNIQUE (tenant_id);


--
-- Name: tenant_subscription_events tenant_subscription_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscription_events
    ADD CONSTRAINT tenant_subscription_events_pkey PRIMARY KEY (id);


--
-- Name: tenant_usage_daily tenant_usage_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_usage_daily
    ADD CONSTRAINT tenant_usage_daily_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_custom_domain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_custom_domain_key UNIQUE (custom_domain);


--
-- Name: tenants tenants_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_invite_code_key UNIQUE (invite_code);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_subdomain_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_subdomain_unique UNIQUE (subdomain);


--
-- Name: training_plan_items training_plan_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_plan_items
    ADD CONSTRAINT training_plan_items_pkey PRIMARY KEY (id);


--
-- Name: training_plans training_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT training_plans_pkey PRIMARY KEY (id);


--
-- Name: unified_invitations unified_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_invitations
    ADD CONSTRAINT unified_invitations_pkey PRIMARY KEY (id);


--
-- Name: unified_invitations unified_invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_invitations
    ADD CONSTRAINT unified_invitations_token_key UNIQUE (token);


--
-- Name: unsubscribes unsubscribes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unsubscribes
    ADD CONSTRAINT unsubscribes_pkey PRIMARY KEY (id);


--
-- Name: user_credits user_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_pkey PRIMARY KEY (id);


--
-- Name: users users_clerk_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: waitlists waitlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_pkey PRIMARY KEY (id);


--
-- Name: webhook_attempts webhook_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_attempts
    ADD CONSTRAINT webhook_attempts_pkey PRIMARY KEY (id);


--
-- Name: webhook_events webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);


--
-- Name: webhook_stats_hourly webhook_stats_hourly_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_stats_hourly
    ADD CONSTRAINT webhook_stats_hourly_pkey PRIMARY KEY (webhook_id, hour);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: attendance_snapshots_player_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_snapshots_player_id_idx ON public.attendance_snapshots USING btree (player_id);


--
-- Name: attendance_snapshots_player_session_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX attendance_snapshots_player_session_idx ON public.attendance_snapshots USING btree (player_id, session_id);


--
-- Name: attendance_snapshots_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_snapshots_session_id_idx ON public.attendance_snapshots USING btree (session_id);


--
-- Name: attendance_snapshots_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_snapshots_tenant_id_idx ON public.attendance_snapshots USING btree (tenant_id);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_actor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_actor_id_idx ON public.audit_logs USING btree (actor_id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_section_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_section_idx ON public.audit_logs USING btree (section);


--
-- Name: comm_templates_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comm_templates_key_idx ON public.comm_templates USING btree (key);


--
-- Name: comm_templates_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comm_templates_type_idx ON public.comm_templates USING btree (type);


--
-- Name: consent_documents_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consent_documents_parent_idx ON public.consent_documents USING btree (parent_id);


--
-- Name: consent_documents_player_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consent_documents_player_idx ON public.consent_documents USING btree (player_id);


--
-- Name: consent_documents_signed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consent_documents_signed_idx ON public.consent_documents USING btree (signed_at);


--
-- Name: consent_documents_template_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consent_documents_template_idx ON public.consent_documents USING btree (template_id);


--
-- Name: consent_documents_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consent_documents_tenant_idx ON public.consent_documents USING btree (tenant_id);


--
-- Name: dev_achievements_awarded_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dev_achievements_awarded_at_idx ON public.dev_achievements USING btree (awarded_at);


--
-- Name: dev_achievements_player_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dev_achievements_player_id_idx ON public.dev_achievements USING btree (player_id);


--
-- Name: dev_achievements_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dev_achievements_tenant_id_idx ON public.dev_achievements USING btree (tenant_id);


--
-- Name: dev_skill_categories_sort_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dev_skill_categories_sort_order_idx ON public.dev_skill_categories USING btree (sort_order);


--
-- Name: dev_skill_categories_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dev_skill_categories_tenant_id_idx ON public.dev_skill_categories USING btree (tenant_id);


--
-- Name: dev_skill_rubrics_skill_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dev_skill_rubrics_skill_id_idx ON public.dev_skill_rubrics USING btree (skill_id);


--
-- Name: dev_skill_rubrics_skill_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX dev_skill_rubrics_skill_level_idx ON public.dev_skill_rubrics USING btree (skill_id, level);


--
-- Name: dev_skill_rubrics_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dev_skill_rubrics_tenant_id_idx ON public.dev_skill_rubrics USING btree (tenant_id);


--
-- Name: dev_skills_age_band_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dev_skills_age_band_idx ON public.dev_skills USING btree (age_band);


--
-- Name: dev_skills_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dev_skills_category_id_idx ON public.dev_skills USING btree (category_id);


--
-- Name: dev_skills_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dev_skills_status_idx ON public.dev_skills USING btree (status);


--
-- Name: dev_skills_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dev_skills_tenant_id_idx ON public.dev_skills USING btree (tenant_id);


--
-- Name: discount_codes_locked_to_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX discount_codes_locked_to_parent_idx ON public.discount_codes USING btree (locked_to_parent_id);


--
-- Name: discount_codes_locked_to_player_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX discount_codes_locked_to_player_idx ON public.discount_codes USING btree (locked_to_player_id);


--
-- Name: discount_codes_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX discount_codes_tenant_id_idx ON public.discount_codes USING btree (tenant_id);


--
-- Name: drills_library_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX drills_library_tenant_id_idx ON public.drills_library USING btree (tenant_id);


--
-- Name: drills_library_title_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX drills_library_title_idx ON public.drills_library USING btree (title);


--
-- Name: dunning_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dunning_events_created_at_idx ON public.dunning_events USING btree (created_at);


--
-- Name: dunning_events_invoice_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dunning_events_invoice_id_idx ON public.dunning_events USING btree (invoice_id);


--
-- Name: dunning_events_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dunning_events_status_idx ON public.dunning_events USING btree (status);


--
-- Name: email_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_events_created_at_idx ON public.email_events USING btree (created_at);


--
-- Name: email_events_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_events_event_idx ON public.email_events USING btree (event);


--
-- Name: email_events_template_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_events_template_key_idx ON public.email_events USING btree (template_key);


--
-- Name: email_events_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_events_tenant_id_idx ON public.email_events USING btree (tenant_id);


--
-- Name: feature_audit_changed_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_audit_changed_by_idx ON public.feature_audit_log USING btree (changed_by);


--
-- Name: feature_audit_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_audit_created_at_idx ON public.feature_audit_log USING btree (created_at);


--
-- Name: feature_audit_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_audit_entity_idx ON public.feature_audit_log USING btree (entity_type, entity_id);


--
-- Name: feature_audit_feature_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_audit_feature_key_idx ON public.feature_audit_log USING btree (feature_key);


--
-- Name: feature_flags_plan_feature_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX feature_flags_plan_feature_idx ON public.feature_flags USING btree (plan_level, feature_key);


--
-- Name: feature_requests_plan_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_requests_plan_level_idx ON public.feature_requests USING btree (plan_level);


--
-- Name: feature_requests_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_requests_priority_idx ON public.feature_requests USING btree (priority);


--
-- Name: feature_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_requests_status_idx ON public.feature_requests USING btree (status);


--
-- Name: feature_requests_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_requests_tenant_id_idx ON public.feature_requests USING btree (tenant_id);


--
-- Name: features_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX features_category_idx ON public.features USING btree (category);


--
-- Name: features_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX features_is_active_idx ON public.features USING btree (is_active);


--
-- Name: financial_txns_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX financial_txns_date_idx ON public.financial_transactions USING btree (transaction_date);


--
-- Name: financial_txns_qb_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX financial_txns_qb_status_idx ON public.financial_transactions USING btree (qb_sync_status);


--
-- Name: financial_txns_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX financial_txns_source_idx ON public.financial_transactions USING btree (source_type, source_id);


--
-- Name: financial_txns_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX financial_txns_tenant_idx ON public.financial_transactions USING btree (tenant_id);


--
-- Name: financial_txns_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX financial_txns_type_idx ON public.financial_transactions USING btree (transaction_type);


--
-- Name: futsal_sessions_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX futsal_sessions_tenant_id_idx ON public.futsal_sessions USING btree (tenant_id);


--
-- Name: help_requests_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX help_requests_tenant_id_idx ON public.help_requests USING btree (tenant_id);


--
-- Name: household_members_household_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX household_members_household_id_idx ON public.household_members USING btree (household_id);


--
-- Name: household_members_player_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX household_members_player_id_idx ON public.household_members USING btree (player_id);


--
-- Name: household_members_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX household_members_tenant_id_idx ON public.household_members USING btree (tenant_id);


--
-- Name: household_members_tenant_player_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX household_members_tenant_player_unique_idx ON public.household_members USING btree (tenant_id, player_id);


--
-- Name: household_members_tenant_user_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX household_members_tenant_user_unique_idx ON public.household_members USING btree (tenant_id, user_id);


--
-- Name: household_members_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX household_members_user_id_idx ON public.household_members USING btree (user_id);


--
-- Name: households_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX households_tenant_id_idx ON public.households USING btree (tenant_id);


--
-- Name: idx_consent_events_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_events_channel ON public.consent_events USING btree (channel);


--
-- Name: idx_consent_events_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_events_tenant ON public.consent_events USING btree (tenant_id);


--
-- Name: idx_consent_events_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_events_user ON public.consent_events USING btree (user_id);


--
-- Name: idx_contact_group_members_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_group_members_group_id ON public.contact_group_members USING btree (group_id);


--
-- Name: idx_contact_group_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_group_members_user_id ON public.contact_group_members USING btree (user_id);


--
-- Name: idx_contact_groups_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_groups_tenant_id ON public.contact_groups USING btree (tenant_id);


--
-- Name: idx_guardian_links_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_links_parent ON public.guardian_links USING btree (parent_id);


--
-- Name: idx_guardian_links_player; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_links_player ON public.guardian_links USING btree (player_id);


--
-- Name: idx_message_logs_direction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_logs_direction ON public.message_logs USING btree (direction);


--
-- Name: idx_message_logs_external; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_logs_external ON public.message_logs USING btree (external_id);


--
-- Name: idx_message_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_logs_status ON public.message_logs USING btree (status);


--
-- Name: idx_message_logs_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_logs_tenant ON public.message_logs USING btree (tenant_id);


--
-- Name: idx_notification_templates_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_templates_method ON public.notification_templates USING btree (method);


--
-- Name: idx_notification_templates_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_templates_tenant ON public.notification_templates USING btree (tenant_id);


--
-- Name: idx_notification_templates_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_templates_type ON public.notification_templates USING btree (type);


--
-- Name: idx_notifications_recipient_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_recipient_user ON public.notifications USING btree (recipient_user_id);


--
-- Name: idx_notifications_signup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_signup ON public.notifications USING btree (signup_id);


--
-- Name: idx_notifications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_status ON public.notifications USING btree (status);


--
-- Name: idx_notifications_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_tenant ON public.notifications USING btree (tenant_id);


--
-- Name: idx_tenant_policies_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenant_policies_tenant ON public.tenant_policies USING btree (tenant_id);


--
-- Name: idx_user_credits_is_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_credits_is_used ON public.user_credits USING btree (is_used);


--
-- Name: idx_user_credits_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_credits_tenant_id ON public.user_credits USING btree (tenant_id);


--
-- Name: idx_user_credits_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_credits_user_id ON public.user_credits USING btree (user_id);


--
-- Name: impersonation_events_started_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX impersonation_events_started_at_idx ON public.impersonation_events USING btree (started_at);


--
-- Name: impersonation_events_super_admin_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX impersonation_events_super_admin_id_idx ON public.impersonation_events USING btree (super_admin_id);


--
-- Name: impersonation_events_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX impersonation_events_tenant_id_idx ON public.impersonation_events USING btree (tenant_id);


--
-- Name: integration_status_pings_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX integration_status_pings_created_at_idx ON public.integration_status_pings USING btree (created_at);


--
-- Name: integration_status_pings_integration_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX integration_status_pings_integration_idx ON public.integration_status_pings USING btree (integration);


--
-- Name: integrations_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX integrations_tenant_id_idx ON public.integrations USING btree (tenant_id);


--
-- Name: invitation_analytics_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitation_analytics_created_at_idx ON public.invitation_analytics USING btree (created_at);


--
-- Name: invitation_analytics_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitation_analytics_event_idx ON public.invitation_analytics USING btree (event_type);


--
-- Name: invitation_analytics_invitation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitation_analytics_invitation_idx ON public.invitation_analytics USING btree (invitation_id);


--
-- Name: invitation_analytics_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitation_analytics_tenant_idx ON public.invitation_analytics USING btree (tenant_id);


--
-- Name: invitation_batches_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitation_batches_created_at_idx ON public.invitation_batches USING btree (created_at);


--
-- Name: invitation_batches_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitation_batches_status_idx ON public.invitation_batches USING btree (status);


--
-- Name: invitation_batches_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitation_batches_tenant_idx ON public.invitation_batches USING btree (tenant_id);


--
-- Name: invite_codes_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_codes_code_idx ON public.invite_codes USING btree (code);


--
-- Name: invite_codes_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_codes_is_active_idx ON public.invite_codes USING btree (is_active);


--
-- Name: invite_codes_is_default_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_codes_is_default_idx ON public.invite_codes USING btree (is_default);


--
-- Name: invite_codes_is_platform_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_codes_is_platform_idx ON public.invite_codes USING btree (is_platform);


--
-- Name: invite_codes_tenant_code_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invite_codes_tenant_code_unique_idx ON public.invite_codes USING btree (tenant_id, code);


--
-- Name: invite_codes_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_codes_tenant_id_idx ON public.invite_codes USING btree (tenant_id);


--
-- Name: invite_tokens_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_tokens_email_idx ON public.invite_tokens USING btree (invited_email);


--
-- Name: invite_tokens_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_tokens_expires_idx ON public.invite_tokens USING btree (expires_at);


--
-- Name: invite_tokens_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_tokens_tenant_idx ON public.invite_tokens USING btree (tenant_id);


--
-- Name: invite_tokens_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_tokens_token_idx ON public.invite_tokens USING btree (token);


--
-- Name: notification_preferences_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_preferences_tenant_id_idx ON public.notification_preferences USING btree (tenant_id);


--
-- Name: payments_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_tenant_id_idx ON public.payments USING btree (tenant_id);


--
-- Name: plan_features_feature_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plan_features_feature_key_idx ON public.plan_features USING btree (feature_key);


--
-- Name: plan_features_plan_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plan_features_plan_code_idx ON public.plan_features USING btree (plan_code);


--
-- Name: player_assessment_items_assessment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_assessment_items_assessment_id_idx ON public.player_assessment_items USING btree (assessment_id);


--
-- Name: player_assessment_items_assessment_skill_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX player_assessment_items_assessment_skill_idx ON public.player_assessment_items USING btree (assessment_id, skill_id);


--
-- Name: player_assessment_items_skill_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_assessment_items_skill_id_idx ON public.player_assessment_items USING btree (skill_id);


--
-- Name: player_assessment_items_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_assessment_items_tenant_id_idx ON public.player_assessment_items USING btree (tenant_id);


--
-- Name: player_assessments_assessed_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_assessments_assessed_by_idx ON public.player_assessments USING btree (assessed_by);


--
-- Name: player_assessments_assessment_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_assessments_assessment_date_idx ON public.player_assessments USING btree (assessment_date);


--
-- Name: player_assessments_player_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_assessments_player_id_idx ON public.player_assessments USING btree (player_id);


--
-- Name: player_assessments_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_assessments_tenant_id_idx ON public.player_assessments USING btree (tenant_id);


--
-- Name: player_goal_updates_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_goal_updates_created_at_idx ON public.player_goal_updates USING btree (created_at);


--
-- Name: player_goal_updates_goal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_goal_updates_goal_id_idx ON public.player_goal_updates USING btree (goal_id);


--
-- Name: player_goal_updates_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_goal_updates_tenant_id_idx ON public.player_goal_updates USING btree (tenant_id);


--
-- Name: player_goals_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_goals_created_by_idx ON public.player_goals USING btree (created_by);


--
-- Name: player_goals_player_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_goals_player_id_idx ON public.player_goals USING btree (player_id);


--
-- Name: player_goals_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_goals_status_idx ON public.player_goals USING btree (status);


--
-- Name: player_goals_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX player_goals_tenant_id_idx ON public.player_goals USING btree (tenant_id);


--
-- Name: players_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX players_tenant_id_idx ON public.players USING btree (tenant_id);


--
-- Name: progression_snapshots_player_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX progression_snapshots_player_id_idx ON public.progression_snapshots USING btree (player_id);


--
-- Name: progression_snapshots_snapshot_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX progression_snapshots_snapshot_date_idx ON public.progression_snapshots USING btree (snapshot_date);


--
-- Name: progression_snapshots_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX progression_snapshots_tenant_id_idx ON public.progression_snapshots USING btree (tenant_id);


--
-- Name: quickbooks_connections_realm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quickbooks_connections_realm_idx ON public.quickbooks_connections USING btree (realm_id);


--
-- Name: quickbooks_connections_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX quickbooks_connections_tenant_idx ON public.quickbooks_connections USING btree (tenant_id);


--
-- Name: quickbooks_logs_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quickbooks_logs_created_idx ON public.quickbooks_sync_logs USING btree (created_at);


--
-- Name: quickbooks_logs_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quickbooks_logs_status_idx ON public.quickbooks_sync_logs USING btree (status);


--
-- Name: quickbooks_logs_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quickbooks_logs_tenant_idx ON public.quickbooks_sync_logs USING btree (tenant_id);


--
-- Name: quickbooks_mappings_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quickbooks_mappings_tenant_idx ON public.quickbooks_account_mappings USING btree (tenant_id);


--
-- Name: quickbooks_mappings_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX quickbooks_mappings_unique_idx ON public.quickbooks_account_mappings USING btree (tenant_id, transaction_type);


--
-- Name: quickbooks_prefs_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX quickbooks_prefs_tenant_idx ON public.quickbooks_sync_preferences USING btree (tenant_id);


--
-- Name: service_billing_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_billing_tenant_id_idx ON public.service_billing USING btree (tenant_id);


--
-- Name: signups_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX signups_tenant_id_idx ON public.signups USING btree (tenant_id);


--
-- Name: sms_credit_transactions_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sms_credit_transactions_created_at_idx ON public.sms_credit_transactions USING btree (created_at);


--
-- Name: sms_credit_transactions_reference_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sms_credit_transactions_reference_idx ON public.sms_credit_transactions USING btree (reference_id, reference_type);


--
-- Name: sms_credit_transactions_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sms_credit_transactions_tenant_id_idx ON public.sms_credit_transactions USING btree (tenant_id);


--
-- Name: sms_credit_transactions_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sms_credit_transactions_type_idx ON public.sms_credit_transactions USING btree (type);


--
-- Name: sms_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sms_events_created_at_idx ON public.sms_events USING btree (created_at);


--
-- Name: sms_events_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sms_events_event_idx ON public.sms_events USING btree (event);


--
-- Name: sms_events_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sms_events_tenant_id_idx ON public.sms_events USING btree (tenant_id);


--
-- Name: subscriptions_tenant_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX subscriptions_tenant_unique ON public.subscriptions USING btree (tenant_id);


--
-- Name: system_settings_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX system_settings_tenant_id_idx ON public.system_settings USING btree (tenant_id);


--
-- Name: system_settings_tenant_key_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX system_settings_tenant_key_unique_idx ON public.system_settings USING btree (tenant_id, key);


--
-- Name: tenant_feature_overrides_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_feature_overrides_expires_at_idx ON public.tenant_feature_overrides USING btree (expires_at);


--
-- Name: tenant_feature_overrides_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_feature_overrides_tenant_id_idx ON public.tenant_feature_overrides USING btree (tenant_id);


--
-- Name: tenant_invite_codes_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_invite_codes_code_idx ON public.tenant_invite_codes USING btree (code);


--
-- Name: tenant_invite_codes_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_invite_codes_tenant_idx ON public.tenant_invite_codes USING btree (tenant_id);


--
-- Name: tenant_invoice_lines_invoice_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_invoice_lines_invoice_id_idx ON public.tenant_invoice_lines USING btree (invoice_id);


--
-- Name: tenant_invoices_due_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_invoices_due_at_idx ON public.tenant_invoices USING btree (due_at);


--
-- Name: tenant_invoices_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_invoices_status_idx ON public.tenant_invoices USING btree (status);


--
-- Name: tenant_invoices_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_invoices_tenant_id_idx ON public.tenant_invoices USING btree (tenant_id);


--
-- Name: tenant_memberships_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_memberships_tenant_idx ON public.tenant_memberships USING btree (tenant_id);


--
-- Name: tenant_memberships_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_memberships_user_idx ON public.tenant_memberships USING btree (user_id);


--
-- Name: tenant_plan_assignments_plan_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_plan_assignments_plan_code_idx ON public.tenant_plan_assignments USING btree (plan_code);


--
-- Name: tenant_plan_assignments_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_plan_assignments_tenant_id_idx ON public.tenant_plan_assignments USING btree (tenant_id);


--
-- Name: tenant_plan_history_change_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_plan_history_change_type_idx ON public.tenant_plan_history USING btree (change_type);


--
-- Name: tenant_plan_history_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_plan_history_created_at_idx ON public.tenant_plan_history USING btree (created_at);


--
-- Name: tenant_plan_history_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_plan_history_tenant_idx ON public.tenant_plan_history USING btree (tenant_id);


--
-- Name: tenant_subscription_events_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_subscription_events_created_idx ON public.tenant_subscription_events USING btree (created_at);


--
-- Name: tenant_subscription_events_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_subscription_events_tenant_idx ON public.tenant_subscription_events USING btree (tenant_id);


--
-- Name: tenant_subscription_events_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_subscription_events_type_idx ON public.tenant_subscription_events USING btree (event_type);


--
-- Name: tenant_usage_daily_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_usage_daily_date_idx ON public.tenant_usage_daily USING btree (date);


--
-- Name: tenant_usage_daily_tenant_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_usage_daily_tenant_date_idx ON public.tenant_usage_daily USING btree (tenant_id, date);


--
-- Name: tenant_usage_daily_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_usage_daily_tenant_id_idx ON public.tenant_usage_daily USING btree (tenant_id);


--
-- Name: training_plan_items_day_of_week_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_plan_items_day_of_week_idx ON public.training_plan_items USING btree (day_of_week);


--
-- Name: training_plan_items_plan_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_plan_items_plan_id_idx ON public.training_plan_items USING btree (plan_id);


--
-- Name: training_plan_items_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_plan_items_tenant_id_idx ON public.training_plan_items USING btree (tenant_id);


--
-- Name: training_plans_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_plans_created_by_idx ON public.training_plans USING btree (created_by);


--
-- Name: training_plans_player_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_plans_player_id_idx ON public.training_plans USING btree (player_id);


--
-- Name: training_plans_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_plans_tenant_id_idx ON public.training_plans USING btree (tenant_id);


--
-- Name: unified_invitations_batch_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unified_invitations_batch_idx ON public.unified_invitations USING btree (batch_id);


--
-- Name: unified_invitations_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unified_invitations_email_idx ON public.unified_invitations USING btree (recipient_email);


--
-- Name: unified_invitations_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unified_invitations_expires_at_idx ON public.unified_invitations USING btree (expires_at);


--
-- Name: unified_invitations_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unified_invitations_status_idx ON public.unified_invitations USING btree (status);


--
-- Name: unified_invitations_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unified_invitations_tenant_idx ON public.unified_invitations USING btree (tenant_id);


--
-- Name: unified_invitations_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unified_invitations_token_idx ON public.unified_invitations USING btree (token);


--
-- Name: unified_invitations_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unified_invitations_type_idx ON public.unified_invitations USING btree (type);


--
-- Name: unsubscribes_address_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unsubscribes_address_idx ON public.unsubscribes USING btree (address);


--
-- Name: unsubscribes_channel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX unsubscribes_channel_idx ON public.unsubscribes USING btree (channel);


--
-- Name: user_credits_household_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_credits_household_id_idx ON public.user_credits USING btree (household_id);


--
-- Name: users_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_tenant_id_idx ON public.users USING btree (tenant_id);


--
-- Name: waitlists_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX waitlists_session_id_idx ON public.waitlists USING btree (session_id);


--
-- Name: waitlists_session_player_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX waitlists_session_player_unique_idx ON public.waitlists USING btree (session_id, player_id);


--
-- Name: waitlists_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX waitlists_tenant_id_idx ON public.waitlists USING btree (tenant_id);


--
-- Name: waitlists_tenant_offer_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX waitlists_tenant_offer_expires_idx ON public.waitlists USING btree (tenant_id, offer_expires_at);


--
-- Name: waitlists_tenant_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX waitlists_tenant_status_idx ON public.waitlists USING btree (tenant_id, status);


--
-- Name: webhook_attempts_event_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhook_attempts_event_id_idx ON public.webhook_attempts USING btree (event_id);


--
-- Name: webhook_attempts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhook_attempts_status_idx ON public.webhook_attempts USING btree (status);


--
-- Name: webhook_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhook_events_created_at_idx ON public.webhook_events USING btree (created_at);


--
-- Name: webhook_events_webhook_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhook_events_webhook_id_idx ON public.webhook_events USING btree (webhook_id);


--
-- Name: ai_tenant_scores ai_tenant_scores_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_tenant_scores
    ADD CONSTRAINT ai_tenant_scores_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: attendance_snapshots attendance_snapshots_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_snapshots
    ADD CONSTRAINT attendance_snapshots_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: attendance_snapshots attendance_snapshots_session_id_futsal_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_snapshots
    ADD CONSTRAINT attendance_snapshots_session_id_futsal_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.futsal_sessions(id);


--
-- Name: attendance_snapshots attendance_snapshots_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_snapshots
    ADD CONSTRAINT attendance_snapshots_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: consent_documents consent_documents_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_documents
    ADD CONSTRAINT consent_documents_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id);


--
-- Name: consent_documents consent_documents_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_documents
    ADD CONSTRAINT consent_documents_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: consent_documents consent_documents_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_documents
    ADD CONSTRAINT consent_documents_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.consent_templates(id);


--
-- Name: consent_documents consent_documents_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_documents
    ADD CONSTRAINT consent_documents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: consent_events consent_events_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_events
    ADD CONSTRAINT consent_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: consent_events consent_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_events
    ADD CONSTRAINT consent_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: contact_group_members contact_group_members_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_group_members
    ADD CONSTRAINT contact_group_members_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id);


--
-- Name: contact_group_members contact_group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_group_members
    ADD CONSTRAINT contact_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.contact_groups(id) ON DELETE CASCADE;


--
-- Name: contact_group_members contact_group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_group_members
    ADD CONSTRAINT contact_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contact_groups contact_groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_groups
    ADD CONSTRAINT contact_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: contact_groups contact_groups_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_groups
    ADD CONSTRAINT contact_groups_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: dev_achievements dev_achievements_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_achievements
    ADD CONSTRAINT dev_achievements_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: dev_achievements dev_achievements_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_achievements
    ADD CONSTRAINT dev_achievements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: dev_skill_categories dev_skill_categories_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_skill_categories
    ADD CONSTRAINT dev_skill_categories_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: dev_skill_rubrics dev_skill_rubrics_skill_id_dev_skills_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_skill_rubrics
    ADD CONSTRAINT dev_skill_rubrics_skill_id_dev_skills_id_fk FOREIGN KEY (skill_id) REFERENCES public.dev_skills(id);


--
-- Name: dev_skill_rubrics dev_skill_rubrics_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_skill_rubrics
    ADD CONSTRAINT dev_skill_rubrics_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: dev_skills dev_skills_category_id_dev_skill_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_skills
    ADD CONSTRAINT dev_skills_category_id_dev_skill_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.dev_skill_categories(id);


--
-- Name: dev_skills dev_skills_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_skills
    ADD CONSTRAINT dev_skills_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: discount_codes discount_codes_locked_to_parent_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_locked_to_parent_id_users_id_fk FOREIGN KEY (locked_to_parent_id) REFERENCES public.users(id);


--
-- Name: discount_codes discount_codes_locked_to_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_locked_to_player_id_players_id_fk FOREIGN KEY (locked_to_player_id) REFERENCES public.players(id);


--
-- Name: discount_codes discount_codes_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: drills_library drills_library_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drills_library
    ADD CONSTRAINT drills_library_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: dunning_events dunning_events_invoice_id_tenant_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dunning_events
    ADD CONSTRAINT dunning_events_invoice_id_tenant_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.tenant_invoices(id);


--
-- Name: email_events email_events_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_events
    ADD CONSTRAINT email_events_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: feature_adoption_events feature_adoption_events_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_adoption_events
    ADD CONSTRAINT feature_adoption_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: feature_adoption_events feature_adoption_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_adoption_events
    ADD CONSTRAINT feature_adoption_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feature_audit_log feature_audit_log_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_audit_log
    ADD CONSTRAINT feature_audit_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: feature_requests feature_requests_submitted_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_requests
    ADD CONSTRAINT feature_requests_submitted_by_users_id_fk FOREIGN KEY (submitted_by) REFERENCES public.users(id);


--
-- Name: feature_requests feature_requests_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_requests
    ADD CONSTRAINT feature_requests_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: financial_transactions financial_transactions_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: financial_transactions financial_transactions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: financial_transactions financial_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: futsal_sessions futsal_sessions_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.futsal_sessions
    ADD CONSTRAINT futsal_sessions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: guardian_links guardian_links_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_links
    ADD CONSTRAINT guardian_links_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id);


--
-- Name: guardian_links guardian_links_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_links
    ADD CONSTRAINT guardian_links_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: guardian_links guardian_links_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_links
    ADD CONSTRAINT guardian_links_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: help_requests help_requests_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_requests
    ADD CONSTRAINT help_requests_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: household_members household_members_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id);


--
-- Name: household_members household_members_household_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;


--
-- Name: household_members household_members_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: household_members household_members_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: household_members household_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: households households_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: households households_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: impersonation_events impersonation_events_super_admin_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impersonation_events
    ADD CONSTRAINT impersonation_events_super_admin_id_users_id_fk FOREIGN KEY (super_admin_id) REFERENCES public.users(id);


--
-- Name: impersonation_events impersonation_events_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impersonation_events
    ADD CONSTRAINT impersonation_events_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: integrations integrations_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: invitation_analytics invitation_analytics_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_analytics
    ADD CONSTRAINT invitation_analytics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: invitation_batches invitation_batches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_batches
    ADD CONSTRAINT invitation_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: invitation_batches invitation_batches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_batches
    ADD CONSTRAINT invitation_batches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: invite_codes invite_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: invite_codes invite_codes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: invite_tokens invite_tokens_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_tokens
    ADD CONSTRAINT invite_tokens_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: invite_tokens invite_tokens_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_tokens
    ADD CONSTRAINT invite_tokens_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: invite_tokens invite_tokens_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_tokens
    ADD CONSTRAINT invite_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: message_logs message_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_logs
    ADD CONSTRAINT message_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: notification_preferences notification_preferences_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: notification_templates notification_templates_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: notifications notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: payments payments_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: plan_features plan_features_feature_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_feature_key_fkey FOREIGN KEY (feature_key) REFERENCES public.features(key) ON DELETE CASCADE;


--
-- Name: plan_features plan_features_plan_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_plan_code_fkey FOREIGN KEY (plan_code) REFERENCES public.plan_catalog(code) ON DELETE CASCADE;


--
-- Name: plan_features plan_features_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: platform_settings platform_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: player_assessment_items player_assessment_items_assessment_id_player_assessments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_assessment_items
    ADD CONSTRAINT player_assessment_items_assessment_id_player_assessments_id_fk FOREIGN KEY (assessment_id) REFERENCES public.player_assessments(id);


--
-- Name: player_assessment_items player_assessment_items_skill_id_dev_skills_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_assessment_items
    ADD CONSTRAINT player_assessment_items_skill_id_dev_skills_id_fk FOREIGN KEY (skill_id) REFERENCES public.dev_skills(id);


--
-- Name: player_assessment_items player_assessment_items_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_assessment_items
    ADD CONSTRAINT player_assessment_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: player_assessments player_assessments_assessed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_assessments
    ADD CONSTRAINT player_assessments_assessed_by_users_id_fk FOREIGN KEY (assessed_by) REFERENCES public.users(id);


--
-- Name: player_assessments player_assessments_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_assessments
    ADD CONSTRAINT player_assessments_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: player_assessments player_assessments_session_id_futsal_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_assessments
    ADD CONSTRAINT player_assessments_session_id_futsal_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.futsal_sessions(id);


--
-- Name: player_assessments player_assessments_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_assessments
    ADD CONSTRAINT player_assessments_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: player_goal_updates player_goal_updates_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_goal_updates
    ADD CONSTRAINT player_goal_updates_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: player_goal_updates player_goal_updates_goal_id_player_goals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_goal_updates
    ADD CONSTRAINT player_goal_updates_goal_id_player_goals_id_fk FOREIGN KEY (goal_id) REFERENCES public.player_goals(id);


--
-- Name: player_goal_updates player_goal_updates_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_goal_updates
    ADD CONSTRAINT player_goal_updates_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: player_goals player_goals_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_goals
    ADD CONSTRAINT player_goals_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: player_goals player_goals_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_goals
    ADD CONSTRAINT player_goals_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: player_goals player_goals_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_goals
    ADD CONSTRAINT player_goals_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: players players_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: progression_snapshots progression_snapshots_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progression_snapshots
    ADD CONSTRAINT progression_snapshots_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: progression_snapshots progression_snapshots_skill_id_dev_skills_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progression_snapshots
    ADD CONSTRAINT progression_snapshots_skill_id_dev_skills_id_fk FOREIGN KEY (skill_id) REFERENCES public.dev_skills(id);


--
-- Name: progression_snapshots progression_snapshots_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progression_snapshots
    ADD CONSTRAINT progression_snapshots_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: quickbooks_account_mappings quickbooks_account_mappings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quickbooks_account_mappings
    ADD CONSTRAINT quickbooks_account_mappings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quickbooks_connections quickbooks_connections_connected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quickbooks_connections
    ADD CONSTRAINT quickbooks_connections_connected_by_fkey FOREIGN KEY (connected_by) REFERENCES public.users(id);


--
-- Name: quickbooks_connections quickbooks_connections_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quickbooks_connections
    ADD CONSTRAINT quickbooks_connections_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quickbooks_sync_logs quickbooks_sync_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quickbooks_sync_logs
    ADD CONSTRAINT quickbooks_sync_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quickbooks_sync_preferences quickbooks_sync_preferences_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quickbooks_sync_preferences
    ADD CONSTRAINT quickbooks_sync_preferences_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: service_billing service_billing_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_billing
    ADD CONSTRAINT service_billing_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: signups signups_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signups
    ADD CONSTRAINT signups_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: sms_credit_transactions sms_credit_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_credit_transactions
    ADD CONSTRAINT sms_credit_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: sms_credit_transactions sms_credit_transactions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_credit_transactions
    ADD CONSTRAINT sms_credit_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sms_events sms_events_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_events
    ADD CONSTRAINT sms_events_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: subscriptions subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: system_settings system_settings_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_feature_overrides tenant_feature_overrides_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_feature_overrides
    ADD CONSTRAINT tenant_feature_overrides_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tenant_feature_overrides tenant_feature_overrides_feature_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_feature_overrides
    ADD CONSTRAINT tenant_feature_overrides_feature_key_fkey FOREIGN KEY (feature_key) REFERENCES public.features(key) ON DELETE CASCADE;


--
-- Name: tenant_feature_overrides tenant_feature_overrides_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_feature_overrides
    ADD CONSTRAINT tenant_feature_overrides_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_invite_codes tenant_invite_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invite_codes
    ADD CONSTRAINT tenant_invite_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: tenant_invite_codes tenant_invite_codes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invite_codes
    ADD CONSTRAINT tenant_invite_codes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_invoice_lines tenant_invoice_lines_invoice_id_tenant_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invoice_lines
    ADD CONSTRAINT tenant_invoice_lines_invoice_id_tenant_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.tenant_invoices(id);


--
-- Name: tenant_invoices tenant_invoices_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invoices
    ADD CONSTRAINT tenant_invoices_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_memberships tenant_memberships_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_memberships
    ADD CONSTRAINT tenant_memberships_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_memberships tenant_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_memberships
    ADD CONSTRAINT tenant_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tenant_plan_assignments tenant_plan_assignments_plan_code_plan_catalog_code_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_plan_assignments
    ADD CONSTRAINT tenant_plan_assignments_plan_code_plan_catalog_code_fk FOREIGN KEY (plan_code) REFERENCES public.plan_catalog(code);


--
-- Name: tenant_plan_assignments tenant_plan_assignments_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_plan_assignments
    ADD CONSTRAINT tenant_plan_assignments_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_plan_history tenant_plan_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_plan_history
    ADD CONSTRAINT tenant_plan_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_policies tenant_policies_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_policies
    ADD CONSTRAINT tenant_policies_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_subscription_events tenant_subscription_events_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscription_events
    ADD CONSTRAINT tenant_subscription_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_usage_daily tenant_usage_daily_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_usage_daily
    ADD CONSTRAINT tenant_usage_daily_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: training_plan_items training_plan_items_drill_id_drills_library_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_plan_items
    ADD CONSTRAINT training_plan_items_drill_id_drills_library_id_fk FOREIGN KEY (drill_id) REFERENCES public.drills_library(id);


--
-- Name: training_plan_items training_plan_items_plan_id_training_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_plan_items
    ADD CONSTRAINT training_plan_items_plan_id_training_plans_id_fk FOREIGN KEY (plan_id) REFERENCES public.training_plans(id);


--
-- Name: training_plan_items training_plan_items_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_plan_items
    ADD CONSTRAINT training_plan_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: training_plans training_plans_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT training_plans_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: training_plans training_plans_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT training_plans_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: training_plans training_plans_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT training_plans_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: unified_invitations unified_invitations_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_invitations
    ADD CONSTRAINT unified_invitations_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.invitation_batches(id);


--
-- Name: unified_invitations unified_invitations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_invitations
    ADD CONSTRAINT unified_invitations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: unified_invitations unified_invitations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_invitations
    ADD CONSTRAINT unified_invitations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: user_credits user_credits_household_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id);


--
-- Name: user_credits user_credits_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.futsal_sessions(id);


--
-- Name: user_credits user_credits_signup_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_signup_id_fkey FOREIGN KEY (signup_id) REFERENCES public.signups(id);


--
-- Name: user_credits user_credits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: user_credits user_credits_used_for_signup_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_used_for_signup_id_fkey FOREIGN KEY (used_for_signup_id) REFERENCES public.signups(id);


--
-- Name: user_credits user_credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: waitlists waitlists_parent_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_parent_id_users_id_fk FOREIGN KEY (parent_id) REFERENCES public.users(id);


--
-- Name: waitlists waitlists_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: waitlists waitlists_session_id_futsal_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_session_id_futsal_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.futsal_sessions(id);


--
-- Name: waitlists waitlists_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: webhook_attempts webhook_attempts_event_id_webhook_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_attempts
    ADD CONSTRAINT webhook_attempts_event_id_webhook_events_id_fk FOREIGN KEY (event_id) REFERENCES public.webhook_events(id);


--
-- Name: webhook_events webhook_events_webhook_id_integration_webhook_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_webhook_id_integration_webhook_id_fk FOREIGN KEY (webhook_id) REFERENCES public.integration_webhook(id);


--
-- Name: webhook_stats_hourly webhook_stats_hourly_webhook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_stats_hourly
    ADD CONSTRAINT webhook_stats_hourly_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES public.integration_webhook(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict qs8Y2Im3ng6OvQ4fcocua2YOhZm6Nr1AcYspZTMHK8E1vO5zXzaVq88WbxaWUOs

