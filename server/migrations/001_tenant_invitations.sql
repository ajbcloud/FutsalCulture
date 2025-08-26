-- Migration: Add tenant invitation system
-- This adds support for tenant invite codes, memberships, and invitation tokens

-- Add new enums for tenant membership system
CREATE TYPE tenant_membership_role AS ENUM ('parent', 'player', 'coach', 'admin');
CREATE TYPE tenant_membership_status AS ENUM ('active', 'pending');  
CREATE TYPE invite_token_purpose AS ENUM ('signup_welcome', 'add_membership', 'player_link');

-- Add invite code columns to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS invite_code VARCHAR(12) UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 8)),
ADD COLUMN IF NOT EXISTS invite_code_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS invite_code_updated_by VARCHAR REFERENCES users(id);

-- Add user_id column to players table for 13+ player accounts
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id);

-- Create tenant_memberships table
CREATE TABLE IF NOT EXISTS tenant_memberships (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  role tenant_membership_role NOT NULL,
  status tenant_membership_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT tenant_memberships_unique UNIQUE (tenant_id, user_id, role)
);

-- Create invite_tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  invited_email TEXT NOT NULL,
  role tenant_membership_role NOT NULL,
  player_id VARCHAR REFERENCES players(id),
  purpose invite_token_purpose NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  created_by VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS tenant_memberships_tenant_idx ON tenant_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_memberships_user_idx ON tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS invite_tokens_tenant_idx ON invite_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS invite_tokens_email_idx ON invite_tokens(invited_email);
CREATE INDEX IF NOT EXISTS invite_tokens_token_idx ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS invite_tokens_expires_idx ON invite_tokens(expires_at);

-- Backfill invite codes for existing tenants (generate secure random codes)
UPDATE tenants 
SET invite_code = upper(substr(md5(random()::text || id), 1, 8))
WHERE invite_code IS NULL;

-- Create initial tenant memberships for existing users
INSERT INTO tenant_memberships (tenant_id, user_id, role, status)
SELECT 
  u.tenant_id,
  u.id,
  CASE 
    WHEN u.is_admin = true THEN 'admin'::tenant_membership_role
    ELSE 'parent'::tenant_membership_role
  END,
  'active'::tenant_membership_status
FROM users u
WHERE u.tenant_id IS NOT NULL
ON CONFLICT (tenant_id, user_id, role) DO NOTHING;