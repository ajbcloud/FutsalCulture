import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env";

// Schema imports
import { tenants } from "./schema/tenants";
import { tenant_users } from "./schema/tenantUsers";
import { invites } from "./schema/invites";
import { email_verifications } from "./schema/emailVerifications";
import { subscriptions } from "./schema/subscriptions";
import { plan_features } from "./schema/planFeatures";
import { audit_events } from "./schema/auditEvents";
import { consent_records } from "./schema/consentRecords";
import { user_policy_acceptances } from "./schema/userPolicyAcceptances";
import { email_bounces } from "./schema/emailBounces";
import { parent_player_links } from "./schema/parentPlayerLinks";

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, {
  schema: {
    tenants,
    tenant_users,
    invites,
    email_verifications,
    subscriptions,
    plan_features,
    audit_events,
    consent_records,
    user_policy_acceptances,
    email_bounces,
    parent_player_links
  }
});