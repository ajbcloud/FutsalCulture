
-- Update PlayHQ tenant to Elite plan without payment requirement
UPDATE tenants 
SET 
  plan_level = 'elite',
  last_plan_level = 'free',
  plan_change_reason = 'admin_upgrade',
  pending_plan_change_at = NOW()
WHERE slug = 'playhq' OR name ILIKE '%PlayHQ%' OR contact_email ILIKE '%playhq%';

-- Verify the change
SELECT id, name, slug, plan_level, last_plan_level, plan_change_reason, created_at 
FROM tenants 
WHERE slug = 'playhq' OR name ILIKE '%PlayHQ%';
