import { contentPipelineService } from "../processors/contentPipeline.js";
import { translatePipelineService } from "../processors/translatePipeline.js";
import { databaseService } from "./databaseService.js";
import { formData } from "../types/types.js";

export const contentProcessorRouter = {
  routeContentItem: async (orgId: string, moduleId: number, formData: formData): Promise<String> => {

    let finalContentItem: string;

    const module = await databaseService.getModuleById(orgId,moduleId);
      if (!module) {
        throw new Error("Module not found");
      }

    const contentCalendar = await databaseService.createContentCalendar(formData,orgId,formData.titel,module.id);

    if (module.translation) {
        finalContentItem = await translatePipelineService.translateArticle(orgId,formData,contentCalendar.id,module);}
    else {
        finalContentItem = await contentPipelineService.generateArticleContent(orgId,formData,contentCalendar.id,module);
        }

      const savedContentItem = await databaseService.saveArticle(finalContentItem, contentCalendar.id, orgId, module.outputFormat);

      return savedContentItem;
  },
};
