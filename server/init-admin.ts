import { db } from "./db";
import { users, tenants } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

// Ensure admin user exists for testing/development
export async function ensureAdminUser() {
  try {
    // First, ensure a test tenant exists
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, "test-club"))
      .limit(1);

    let tenantId: string;

    if (!existingTenant) {
      console.log("Creating test tenant for admin user...");
      const [newTenant] = await db.insert(tenants).values({
        name: "This is a test Club",
        displayName: "This is a test Club",
        subdomain: "test-club",
        planLevel: "free",
        inviteCode: nanoid(10),
        contactEmail: "admin@example.com",
        contactName: "Admin User"
      }).returning();
      tenantId = newTenant.id;
      console.log("✅ Test tenant created");
    } else {
      tenantId = existingTenant.id;
    }

    // Check if admin@example.com exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@example.com"))
      .limit(1);

    if (!existingAdmin) {
      console.log("Creating default admin user: admin@example.com");
      
      // Hash the password
      const passwordHash = await bcrypt.hash("admin123", 12);
      
      // Create the admin user with tenant association
      await db.insert(users).values({
        email: "admin@example.com",
        passwordHash,
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        isSuperAdmin: false,
        isApproved: true,
        registrationStatus: "approved",
        authProvider: "local",
        emailVerifiedAt: new Date(),
        verificationStatus: "verified",
        tenantId // Associate with tenant
      });

      console.log("✅ Default admin user created successfully");
    } else {
      // Update password if needed (useful for reset)
      const passwordHash = await bcrypt.hash("admin123", 12);
      const passwordsMatch = await bcrypt.compare("admin123", existingAdmin.passwordHash || "");
      
      if (!passwordsMatch && existingAdmin.passwordHash) {
        // Only update if password is different
        await db
          .update(users)
          .set({ 
            passwordHash,
            isAdmin: true,
            isApproved: true,
            registrationStatus: "approved",
            verificationStatus: "verified",
            tenantId // Ensure tenant association
          })
          .where(eq(users.id, existingAdmin.id));
        console.log("✅ Admin user password updated");
      } else {
        // Ensure admin privileges and tenant association are set
        if (!existingAdmin.isAdmin || !existingAdmin.isApproved || !existingAdmin.tenantId) {
          await db
            .update(users)
            .set({ 
              isAdmin: true,
              isApproved: true,
              registrationStatus: "approved",
              verificationStatus: "verified",
              tenantId // Ensure tenant association
            })
            .where(eq(users.id, existingAdmin.id));
          console.log("✅ Admin user privileges and tenant association updated");
        }
      }
    }
  } catch (error) {
    console.error("Error ensuring admin user:", error);
  }
}