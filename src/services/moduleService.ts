import { databaseService } from "./databaseService.js";
import { Module } from "../entities/Module.js";
import { AppDataSource } from "../data-source.js";

export const moduleService = {
  /**
   * Generate article content through a configurable pipeline
   */
  getModules: async (orgId: string): Promise<Module[]> => {
    try {
      // Get user preferences
      const modules = await databaseService.getOrgModules(orgId);

      return modules;
    } catch (error) {
      console.error("Error getting modules:", error);
      throw error;
    }
  },

  /**
   * Get a specific module by slug if organization has access
   */
  getModuleBySlug: async (
    orgId: string,
    moduleSlug: string
  ): Promise<Module | null> => {
    try {
      const moduleRepository = AppDataSource.getRepository(Module);

      const module = await moduleRepository
        .createQueryBuilder("module")
        .leftJoinAndSelect("module.orgModuleAccess", "access")
        .leftJoinAndSelect("access.formSchema", "formSchema")
        .where("access.orgId = :orgId", { orgId })
        .andWhere("module.slug = :moduleSlug", { moduleSlug })
        .getOne();

      // Debug logging
      console.log("Full query result:", JSON.stringify(module, null, 2));
      
      return module;
    } catch (error) {
      console.error("Error getting module by slug:", error);
      throw error;
    }
  },
};
