import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

// Ensure admin user exists for testing/development
export async function ensureAdminUser() {
  try {
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
      
      // Create the admin user
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
        verificationStatus: "verified"
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
            verificationStatus: "verified"
          })
          .where(eq(users.id, existingAdmin.id));
        console.log("✅ Admin user password updated");
      } else {
        // Ensure admin privileges are set
        if (!existingAdmin.isAdmin || !existingAdmin.isApproved) {
          await db
            .update(users)
            .set({ 
              isAdmin: true,
              isApproved: true,
              registrationStatus: "approved",
              verificationStatus: "verified"
            })
            .where(eq(users.id, existingAdmin.id));
          console.log("✅ Admin user privileges updated");
        }
      }
    }
  } catch (error) {
    console.error("Error ensuring admin user:", error);
  }
}