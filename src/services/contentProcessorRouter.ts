import { contentPipelineService } from "../processors/contentPipeline.js";
import { translatePipelineService } from "../processors/translatePipeline.js";
import { databaseService } from "./databaseService.js";
import { formData } from "../types/types.js";

export const contentProcessorRouter = {
  routeContentItem: async (orgId: string, moduleId: number, formData: formData): Promise<string> => {
    console.log("begin met het routen van de content item");
    let finalContentItem: string;

    const module = await databaseService.getModuleById(orgId, moduleId);
    if (!module) {
      throw new Error("Module not found to select the correct pipeline");
    }

    const contentCalendar = await databaseService.createContentCalendar(formData, orgId, module.id);

    if (module.translation) {
      finalContentItem = await translatePipelineService.translateArticle(orgId, formData, contentCalendar.id, module);
    } else {
      finalContentItem = await contentPipelineService.generateArticleContent(orgId, formData, contentCalendar.id, module);
    }
    return finalContentItem;
  },
};
