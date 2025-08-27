
-- Email events tracking table
CREATE TABLE IF NOT EXISTS email_events (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  event VARCHAR(50) NOT NULL,
  tenant_id VARCHAR(255),
  campaign_id VARCHAR(255),
  template_key VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(message_id, event)
);

-- SMS events tracking table
CREATE TABLE IF NOT EXISTS sms_events (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  event VARCHAR(50) NOT NULL,
  tenant_id VARCHAR(255),
  campaign_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(message_id, event)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_events_tenant_date ON email_events(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_email_events_template ON email_events(template_key, created_at);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON email_events(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sms_events_tenant_date ON sms_events(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sms_events_campaign ON sms_events(campaign_id, created_at);

-- Communication preferences table
CREATE TABLE IF NOT EXISTS communication_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  notification_types JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, tenant_id)
);

-- Template performance materialized view for faster analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS template_performance AS
SELECT 
  template_key,
  tenant_id,
  DATE(created_at) as date,
  SUM(CASE WHEN event = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN event = 'delivered' THEN 1 ELSE 0 END) as delivered,
  SUM(CASE WHEN event = 'open' THEN 1 ELSE 0 END) as opened,
  SUM(CASE WHEN event = 'click' THEN 1 ELSE 0 END) as clicked,
  SUM(CASE WHEN event IN ('bounce', 'dropped', 'spamreport') THEN 1 ELSE 0 END) as bounced
FROM email_events
WHERE template_key IS NOT NULL
GROUP BY template_key, tenant_id, DATE(created_at);

-- Refresh the materialized view daily
CREATE UNIQUE INDEX IF NOT EXISTS idx_template_performance_unique 
ON template_performance(template_key, tenant_id, date);
