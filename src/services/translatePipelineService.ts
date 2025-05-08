import { scraperService } from "./scraperService.js";
import { aiGenerateServiceGemini, aiGenerateServiceOpenAI } from "./aiGenerateService.js";
import { databaseService } from "./databaseService.js";
import { Module } from "../entities/Module.js";
import { imagesSearchEmbeddings } from "../types/types.js";

export const translatePipelineService = {
  /**
   * Generate article content through a configurable pipeline
   */
  translateArticle: async (
    orgId: string,
    formData: any,
    contentCalendarId: number,
    module: Module
  ) => {
    try {

      // Initialize context
      let context: any = {
        formData,
        contentCalendarId,
        availableStores: [],
        filteredStores: [],
        articleContext: null,
        summarizedContext: null,
        draftArticle: null,
        module: module,
        internetSearch: null
      };
      
      

      context.finalArticle = await aiGenerateServiceOpenAI.translateContent(formData)
      
      //step 7: save the article to the database  
      const savedArticle = await databaseService.saveArticle(context.finalArticle, contentCalendarId, orgId, module.outputFormat);
      //

      return savedArticle;
    } catch (error) {
      console.error("Error in content pipeline:", error);
      throw error;
    }
  },
};
