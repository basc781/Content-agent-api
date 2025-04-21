import { scraperService } from "./scraperService.js";
import { aiGenerateService } from "./aiGenerateService.js";
import { databaseService } from "./databaseService.js";
import { Module } from "../entities/Module.js";

export const contentPipelineService = {
  /**
   * Generate article content through a configurable pipeline
   */
  generateArticleContent: async (
    orgId: string,
    formData: any,
    website: string,
    contentCalendarId: number,
    imageUrls: string[] | string,
    module: Module,
  ) => {
    try {
      // Convert imageUrls to array if it's a string
      const imageUrlsArray =
        typeof imageUrls === "string"
          ? imageUrls.split(",").map((url) => url.trim())
          : imageUrls || [];

      // Initialize context
      let context: any = {
        formData,
        contentCalendarId,
        availableStores: [],
        filteredStores: [],
        articleContext: null,
        summarizedContext: null,
        finalArticle: null,
        module: module
      };

      if (module.assetLibrary) {
  
        console.log("Asset library enabled, generating asset library");
        
        const nearestNeighborEmbedding = await aiGenerateService.generateNearestNeighborEmbedding(context);
        context.nearestNeighborEmbedding = nearestNeighborEmbedding;

        const relevantAssets = await databaseService.getRelevantAssets(context.module, orgId, context.nearestNeighborEmbedding);

        imageUrlsArray.push(...relevantAssets.map((asset: any) => process.env.R2_PUBLIC_URL + "/" + asset.uniqueFilename));
        
      }else{
        console.log("Asset library disabled, skipping asset library");
      }      
      // Check if websiteScraping is enabled
      if (module.webScraper) {
        console.log("Starting to scrape website:", website);
        context.availableStores = await scraperService.companyContext(website);
        console.log(
          "Starting filter process with available stores: ",
          context.availableStores
        );

        // Step 2: Generate filtered store list
        context.filteredStores = await aiGenerateService.generateStoreList(
          contentCalendarId,
          JSON.stringify(context.availableStores)
        );
        console.log("Filtered store list: ", context.filteredStores);

        // Step 3: Get article context by scraping filtered stores
        context.articleContext = await scraperService.articleContext(
          context.filteredStores
        );
        console.log("Article context: ", context.articleContext);

        // Step 4: Summarize article context (moved inside the websiteScraping condition)
        context.summarizedContext = await aiGenerateService.summarizeArticle(
          context.articleContext,
          formData,
          orgId,
          module
        );
        console.log("Summarised article context: ", context.summarizedContext);
        //Add a timer that waits 10 seconds to continue
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } else {
        console.log(
          "Web scraping disabled in user preferences, skipping related steps"
        );
        // Provide fallback context when scraping is disabled
        context.articleContext = { basicInfo: formData };
      }

      // Step 5: Generate final article (always runs)
      context.finalArticle = await aiGenerateService.generateArticle(
        context.summarizedContext, // Use summarized if available, otherwise use article context
        contentCalendarId,
        imageUrlsArray,
        orgId,
        module
      );
      console.log("Article generated successfully");

      return context.finalArticle;
    } catch (error) {
      console.error("Error in content pipeline:", error);
      throw error;
    }
  },
};
