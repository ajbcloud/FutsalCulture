
-- Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR NOT NULL CHECK (type IN ('email', 'sms', 'push')),
    method VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'booking_confirmation', 'reminder_24h', 'status_update', 'manual', 'google_review', 're_engagement', 'discount_offer'
    subject TEXT, -- for email templates only
    template TEXT NOT NULL, -- template content with variables like {{customerName}}, {{appointmentDate}}
    active BOOLEAN DEFAULT true,
    tenant_id VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add tenant_id to existing communication_campaigns table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'communication_campaigns' 
        AND column_name = 'template_id'
    ) THEN
        ALTER TABLE communication_campaigns ADD COLUMN template_id VARCHAR REFERENCES notification_templates(id);
    END IF;
END $$;

-- Re-engagement Tracking Table
CREATE TABLE IF NOT EXISTS reengagement_tracking (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR NOT NULL, -- User ID or email
    notification_id VARCHAR NOT NULL, -- Reference to notification sent
    campaign_type VARCHAR NOT NULL, -- 're_engagement' or 'discount_offer'
    discount_code_id VARCHAR, -- If discount was offered
    response_booking_id VARCHAR, -- Booking made after notification
    days_between_notification_and_booking INTEGER,
    is_successful BOOLEAN DEFAULT false, -- Did they book after notification?
    tenant_id VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ -- When they made a booking in response
);

-- Message Log for SMS tracking (enhanced)
CREATE TABLE IF NOT EXISTS message_log (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'twilio',
    external_id TEXT,
    to_number TEXT NOT NULL,
    from_number TEXT NOT NULL,
    body TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    status TEXT NOT NULL DEFAULT 'queued',
    error_code TEXT,
    tenant_id VARCHAR NOT NULL,
    campaign_id VARCHAR,
    template_id VARCHAR REFERENCES notification_templates(id),
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consent Events for tracking opt-ins/opt-outs
CREATE TABLE IF NOT EXISTS consent_events (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    tenant_id VARCHAR NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
    type TEXT NOT NULL CHECK (type IN ('opt_in', 'opt_out')),
    source TEXT NOT NULL, -- 'signup', 'booking', 'keyword', 'admin'
    ip TEXT,
    user_agent TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_tenant ON notification_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_method ON notification_templates(method);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(active);
CREATE INDEX IF NOT EXISTS idx_reengagement_tracking_customer_id ON reengagement_tracking(customer_id);
CREATE INDEX IF NOT EXISTS idx_reengagement_tracking_campaign_type ON reengagement_tracking(campaign_type);
CREATE INDEX IF NOT EXISTS idx_reengagement_tracking_tenant ON reengagement_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_log_to ON message_log(to_number);
CREATE INDEX IF NOT EXISTS idx_message_log_direction ON message_log(direction);
CREATE INDEX IF NOT EXISTS idx_message_log_tenant ON message_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consent_events_user_id ON consent_events(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_events_channel_type ON consent_events(channel, type);
CREATE INDEX IF NOT EXISTS idx_consent_events_tenant ON consent_events(tenant_id);

-- Update existing email_events and sms_events to include template references
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_events' 
        AND column_name = 'template_id'
    ) THEN
        ALTER TABLE email_events ADD COLUMN template_id VARCHAR REFERENCES notification_templates(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sms_events' 
        AND column_name = 'template_id'
    ) THEN
        ALTER TABLE sms_events ADD COLUMN template_id VARCHAR REFERENCES notification_templates(id);
    END IF;
END $$;
