import { aiGenerateServiceOpenAI } from "../services/aiGenerateService.js";
import { databaseService } from "../services/databaseService.js";
import { Module } from "../entities/Module.js";
import { formData, translateItemContext } from "../types/types.js";

export const translatePipelineService = {
  translateArticle: async (orgId: string, formData: formData, contentCalendarId: number, module: Module) => {
    try {
      // Initialize context
      const context: translateItemContext = {
        orgId: orgId,
        formData: formData,
        contentCalendarId: contentCalendarId,
        module: module,
        finalContentItem: {
          results: [],
        },
      };

      if (!formData.article || typeof formData.article !== "string") {
        throw new Error("Content needs to be send as .article in the formData");
      }

      context.finalContentItem = await aiGenerateServiceOpenAI.translateContent(formData.article);
      //step 7: save the article to the database
      const savedArticle = await databaseService.saveArticle(JSON.stringify(context.finalContentItem), contentCalendarId, orgId, module.outputFormat);

      return savedArticle;
    } catch (error) {
      console.error("Error in translate pipeline:", error);
      throw error;
    }
  },
};
