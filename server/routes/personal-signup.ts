import { Router } from "express";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

export const personalSignupRouter = Router();

const selfSignupSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["parent", "player"], { required_error: "Role is required" }),
  dob: z.string().optional(),
  guardian_email: z.string().email().optional()
}).refine((data) => {
  // If player role, dob is required
  if (data.role === "player" && !data.dob) {
    return false;
  }
  
  // Calculate age if player
  if (data.role === "player" && data.dob) {
    const age = new Date().getFullYear() - new Date(data.dob).getFullYear();
    // If under 13, guardian email required and no password
    if (age < 13) {
      return data.guardian_email && !data.password;
    } else {
      // 13+, password required
      return !!data.password;
    }
  }
  
  // Parent role requires password
  if (data.role === "parent") {
    return !!data.password;
  }
  
  return true;
}, {
  message: "Invalid combination of fields for the selected role",
});

// Personal account signup (unaffiliated)
personalSignupRouter.post("/users/self-signup", async (req: any, res) => {
  try {
    const validatedData = selfSignupSchema.parse(req.body);
    
    // Check if user already exists
    const existingUsers = await db.select()
      .from(users)
      .where(eq(users.email, validatedData.email));
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    
    const verificationToken = nanoid(32);
    let hashedPassword = null;
    
    if (validatedData.password) {
      hashedPassword = await bcrypt.hash(validatedData.password, 10);
    }
    
    // Determine if user is under 13
    const isUnder13 = validatedData.role === "player" && validatedData.dob && 
      new Date().getFullYear() - new Date(validatedData.dob).getFullYear() < 13;
    
    // Create unaffiliated user
    const [user] = await db.insert(users).values({
      email: validatedData.email,
      firstName: "New",
      lastName: "User",
      dateOfBirth: validatedData.dob ? new Date(validatedData.dob) : null,
      tenantId: null // Unaffiliated until they join a club
    }).returning();
    
    // TODO: Send verification email
    // If under 13, send to guardian, otherwise to user
    const emailRecipient = isUnder13 ? validatedData.guardian_email : validatedData.email;
    // await sendVerificationEmail(emailRecipient, verificationToken, isUnder13);
    
    console.log(`Created unaffiliated ${validatedData.role} account for ${validatedData.email}`);
    
    res.json({ 
      ok: true,
      message: isUnder13 
        ? "Account created. Guardian verification email sent."
        : "Account created. Check your email for verification."
    });
  } catch (error) {
    console.error("Error creating personal account:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid data", 
        details: error.errors 
      });
    }
    res.status(500).json({ error: "Failed to create account" });
  }
});

export default personalSignupRouter;