import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { moduleService } from "../services/moduleService.js";

export const moduleController = {
  // Get all modules for the organization
  getModules: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = getAuth(req).orgId;

      if (!orgId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Get all modules for the organization
      const modules = await moduleService.getModules(orgId);

      const moduleMap = modules.map((module) => ({
        name: module.name,
        slug: module.slug,
      }));

      res.json({
        modules: moduleMap,
      });
    } catch (error) {
      console.error("Article generation error:", error);
      res.status(500).json({ error: "Failed to generate articles" });
    }
  },

  // Check if organization has access to a specific module
  checkModuleAccess: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = getAuth(req).orgId;
      const { moduleSlug } = req.params;

      if (!orgId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (!moduleSlug) {
        res.status(400).json({ error: "Module slug is required" });
        return;
      }

      const module = await moduleService.getModuleBySlug(orgId, moduleSlug);

      res.json({
        module: module || null,
      });
    } catch (error) {
      console.error("Module access check error:", error);
      res.status(500).json({ error: "Failed to check module access" });
    }
  },
};
