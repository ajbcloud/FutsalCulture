import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import * as schema from "@shared/schema";

// Validation schemas
const createSkillCategorySchema = createInsertSchema(schema.devSkillCategories).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

const createSkillSchema = createInsertSchema(schema.devSkills).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

const createSkillRubricSchema = createInsertSchema(schema.devSkillRubrics).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

const createPlayerAssessmentSchema = createInsertSchema(schema.playerAssessments).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

const createPlayerGoalSchema = createInsertSchema(schema.playerGoals).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

const createGoalUpdateSchema = createInsertSchema(schema.playerGoalUpdates).omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

function registerPlayerDevelopmentRoutes(app: Express) {
  
  // ============ SKILL CATEGORIES ============
  
  // Get all skill categories
  app.get("/api/dev/skill-categories", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const categories = await storage.getDevSkillCategories(req.user.tenantId);
      res.json(categories);
    } catch (error: any) {
      console.error("Error fetching skill categories:", error);
      res.status(500).json({ message: "Error fetching skill categories" });
    }
  });

  // Create skill category
  app.post("/api/dev/skill-categories", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      const data = createSkillCategorySchema.parse(req.body);
      const category = await storage.createDevSkillCategory({
        ...data,
        tenantId: req.user.tenantId,
      });
      res.json(category);
    } catch (error: any) {
      console.error("Error creating skill category:", error);
      res.status(400).json({ message: "Error creating skill category", error: error.message });
    }
  });

  // Update skill category
  app.put("/api/dev/skill-categories/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      const data = createSkillCategorySchema.partial().parse(req.body);
      const category = await storage.updateDevSkillCategory(req.params.id, req.user.tenantId, data);
      res.json(category);
    } catch (error: any) {
      console.error("Error updating skill category:", error);
      res.status(400).json({ message: "Error updating skill category", error: error.message });
    }
  });

  // Delete skill category
  app.delete("/api/dev/skill-categories/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      await storage.deleteDevSkillCategory(req.params.id, req.user.tenantId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting skill category:", error);
      res.status(400).json({ message: "Error deleting skill category", error: error.message });
    }
  });

  // ============ SKILLS ============
  
  // Get all skills
  app.get("/api/dev/skills", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { categoryId, ageBand, sport, status } = req.query;
      const skills = await storage.getDevSkills(req.user.tenantId, {
        categoryId: categoryId as string,
        ageBand: ageBand as string,
        sport: sport as string,
        status: status as string,
      });
      res.json(skills);
    } catch (error: any) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Error fetching skills" });
    }
  });

  // Create skill
  app.post("/api/dev/skills", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      const data = createSkillSchema.parse(req.body);
      const skill = await storage.createDevSkill({
        ...data,
        tenantId: req.user.tenantId,
      });
      res.json(skill);
    } catch (error: any) {
      console.error("Error creating skill:", error);
      res.status(400).json({ message: "Error creating skill", error: error.message });
    }
  });

  // Update skill
  app.put("/api/dev/skills/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      const data = createSkillSchema.partial().parse(req.body);
      const skill = await storage.updateDevSkill(req.params.id, req.user.tenantId, data);
      res.json(skill);
    } catch (error: any) {
      console.error("Error updating skill:", error);
      res.status(400).json({ message: "Error updating skill", error: error.message });
    }
  });

  // Delete skill
  app.delete("/api/dev/skills/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      await storage.deleteDevSkill(req.params.id, req.user.tenantId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting skill:", error);
      res.status(400).json({ message: "Error deleting skill", error: error.message });
    }
  });

  // ============ SKILL RUBRICS ============
  
  // Get rubrics for a skill
  app.get("/api/dev/skills/:skillId/rubrics", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const rubrics = await storage.getDevSkillRubrics(req.params.skillId, req.user.tenantId);
      res.json(rubrics);
    } catch (error: any) {
      console.error("Error fetching skill rubrics:", error);
      res.status(500).json({ message: "Error fetching skill rubrics" });
    }
  });

  // Create/update skill rubrics (batch operation)
  app.put("/api/dev/skills/:skillId/rubrics", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      const rubrics = z.array(createSkillRubricSchema).parse(req.body);
      const result = await storage.upsertDevSkillRubrics(req.params.skillId, req.user.tenantId, rubrics);
      res.json(result);
    } catch (error: any) {
      console.error("Error updating skill rubrics:", error);
      res.status(400).json({ message: "Error updating skill rubrics", error: error.message });
    }
  });

  // ============ PLAYER ASSESSMENTS ============
  
  // Get all assessments
  app.get("/api/dev/assessments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { playerId, assessedBy, startDate, endDate } = req.query;
      const assessments = await storage.getPlayerAssessments(req.user.tenantId, {
        playerId: playerId as string,
        assessedBy: assessedBy as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json(assessments);
    } catch (error: any) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Error fetching assessments" });
    }
  });

  // Get assessment by ID with skills
  app.get("/api/dev/assessments/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const assessment = await storage.getPlayerAssessmentWithSkills(req.params.id, req.user.tenantId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error: any) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Error fetching assessment" });
    }
  });

  // Create assessment
  app.post("/api/dev/assessments", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      const { assessment, skillAssessments } = req.body;
      const assessmentData = createPlayerAssessmentSchema.parse(assessment);
      
      const result = await storage.createPlayerAssessment({
        ...assessmentData,
        tenantId: req.user.tenantId,
        assessedBy: req.user.id,
      }, skillAssessments || []);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error creating assessment:", error);
      res.status(400).json({ message: "Error creating assessment", error: error.message });
    }
  });

  // Update assessment
  app.put("/api/dev/assessments/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      const { assessment, skillAssessments } = req.body;
      const assessmentData = createPlayerAssessmentSchema.partial().parse(assessment);
      
      const result = await storage.updatePlayerAssessment(
        req.params.id,
        req.user.tenantId,
        assessmentData,
        skillAssessments || []
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Error updating assessment:", error);
      res.status(400).json({ message: "Error updating assessment", error: error.message });
    }
  });

  // Delete assessment
  app.delete("/api/dev/assessments/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      await storage.deletePlayerAssessment(req.params.id, req.user.tenantId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting assessment:", error);
      res.status(400).json({ message: "Error deleting assessment", error: error.message });
    }
  });

  // ============ PLAYER GOALS ============
  
  // Get all goals
  app.get("/api/dev/goals", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { playerId, status, createdBy } = req.query;
      const goals = await storage.getPlayerGoals(req.user.tenantId, {
        playerId: playerId as string,
        status: status as string,
        createdBy: createdBy as string,
      });
      res.json(goals);
    } catch (error: any) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Error fetching goals" });
    }
  });

  // Get goal by ID with updates
  app.get("/api/dev/goals/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const goal = await storage.getPlayerGoalWithUpdates(req.params.id, req.user.tenantId);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(goal);
    } catch (error: any) {
      console.error("Error fetching goal:", error);
      res.status(500).json({ message: "Error fetching goal" });
    }
  });

  // Create goal
  app.post("/api/dev/goals", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      const data = createPlayerGoalSchema.parse(req.body);
      const goal = await storage.createPlayerGoal({
        ...data,
        tenantId: req.user.tenantId,
        createdBy: req.user.id,
      });
      res.json(goal);
    } catch (error: any) {
      console.error("Error creating goal:", error);
      res.status(400).json({ message: "Error creating goal", error: error.message });
    }
  });

  // Update goal
  app.put("/api/dev/goals/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      const data = createPlayerGoalSchema.partial().parse(req.body);
      const goal = await storage.updatePlayerGoal(req.params.id, req.user.tenantId, data);
      res.json(goal);
    } catch (error: any) {
      console.error("Error updating goal:", error);
      res.status(400).json({ message: "Error updating goal", error: error.message });
    }
  });

  // Add goal update
  app.post("/api/dev/goals/:id/updates", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      const data = createGoalUpdateSchema.parse(req.body);
      const update = await storage.createPlayerGoalUpdate({
        ...data,
        goalId: req.params.id,
        tenantId: req.user.tenantId,
        updatedBy: req.user.id,
      });
      res.json(update);
    } catch (error: any) {
      console.error("Error adding goal update:", error);
      res.status(400).json({ message: "Error adding goal update", error: error.message });
    }
  });

  // Delete goal
  app.delete("/api/dev/goals/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }

    try {
      await storage.deletePlayerGoal(req.params.id, req.user.tenantId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting goal:", error);
      res.status(400).json({ message: "Error deleting goal", error: error.message });
    }
  });

  // ============ ANALYTICS ============
  
  // Get player development analytics
  app.get("/api/dev/analytics", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { playerId, startDate, endDate, skillCategoryId } = req.query;
      const analytics = await storage.getPlayerDevelopmentAnalytics(req.user.tenantId, {
        playerId: playerId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        skillCategoryId: skillCategoryId as string,
      });
      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching development analytics:", error);
      res.status(500).json({ message: "Error fetching development analytics" });
    }
  });

  // Get player progress snapshots
  app.get("/api/dev/progress/:playerId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { startDate, endDate, skillId } = req.query;
      const progress = await storage.getPlayerProgressSnapshots(
        req.params.playerId,
        req.user.tenantId,
        {
          startDate: startDate as string,
          endDate: endDate as string,
          skillId: skillId as string,
        }
      );
      res.json(progress);
    } catch (error: any) {
      console.error("Error fetching player progress:", error);
      res.status(500).json({ message: "Error fetching player progress" });
    }
  });
}

export default registerPlayerDevelopmentRoutes;