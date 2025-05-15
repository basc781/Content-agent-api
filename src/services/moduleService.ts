import { databaseService } from "./databaseService.js";
import { Module } from "../entities/Module.js";
import { AppDataSource } from "../data-source.js";

export const moduleService = {
  /**
   * Generate article content through a configurable pipeline
   */
  getModules: async (
    orgId: string
    ): Promise<(Module & { accessId?: number })[]> => {
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
  ): Promise<Module> => {
    try {
      const moduleRepository = AppDataSource.getRepository(Module);

      const module = await moduleRepository
        .createQueryBuilder("module")
        .leftJoinAndSelect("module.orgModuleAccess", "access")
        .leftJoinAndSelect("access.formSchema", "formSchema")
        .where("access.orgId = :orgId", { orgId })
        .andWhere("module.slug = :moduleSlug", { moduleSlug })
        .getOne();

      if (!module) {
        throw new Error("Module not found");
      }
      return module;
    } catch (error) {
      console.error("Error getting module by slug:", error);
      throw new Error("Failed to find module by slug");
    }
  },
};
