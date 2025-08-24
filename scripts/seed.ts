import { db } from "../src/db/index";
import { tenants } from "../src/db/schema/tenants";
import { tenant_users } from "../src/db/schema/tenantUsers";
import { plan_features } from "../src/db/schema/planFeatures";
import { generateTenantCode } from "../src/lib/ids";

async function ensureUser(email: string, password: string, profile: any): Promise<string> {
// This would normally create/find a user in your auth system
// For testing purposes, return a mock ID based on email
return "user-" + Buffer.from(email).toString('base64').slice(0, 8);
}

async function run() {
console.log("🌱 Starting beta onboarding seed...");

// Create a test tenant
const t = await db.insert(tenants).values({ 
name: "Charter Club", 
slug: "charter-club", 
tenant_code: generateTenantCode(), 
contact_name: "Owner One", 
contact_email: "owner1@example.com",
city: "San Francisco",
state: "California", 
country: "USA"
}).returning();

// Create owner user
const ownerId = await ensureUser("owner1@example.com", "Password123", { name: "Owner One" });
await db.insert(tenant_users).values({ 
tenant_id: t[0].id, 
user_id: ownerId, 
role: "tenant_owner" 
});

// Seed plan features
const features = [
{ plan_key: "free", feature_key: "basic_features", enabled: true },
{ plan_key: "free", feature_key: "max_users", enabled: true, limits_json: { count: 10 } },
{ plan_key: "paid", feature_key: "basic_features", enabled: true },
{ plan_key: "paid", feature_key: "advanced_features", enabled: true },
{ plan_key: "paid", feature_key: "max_users", enabled: true, limits_json: { count: 100 } },
{ plan_key: "enterprise", feature_key: "basic_features", enabled: true },
{ plan_key: "enterprise", feature_key: "advanced_features", enabled: true },
{ plan_key: "enterprise", feature_key: "enterprise_features", enabled: true },
{ plan_key: "enterprise", feature_key: "max_users", enabled: true, limits_json: { count: 1000 } }
];

for (const feature of features) {
await db.insert(plan_features).values(feature);
}

console.log("✅ Seeded tenant:", t[0].id);
console.log("✅ Tenant code:", t[0].tenant_code);
console.log("✅ Owner user:", ownerId);
console.log("✅ Plan features configured");
console.log("🎉 Seed completed successfully!");
}

run().catch(console.error);