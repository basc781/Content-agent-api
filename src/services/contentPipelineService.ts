import { scraperService } from './scraperService.js';
import { aiGenerateService } from './aiGenerateService.js';
import { databaseService } from './databaseService.js';

export const contentPipelineService = {
  /**
   * Generate article content through a configurable pipeline
   */
  generateArticleContent: async (
    userId: string,
    formData: any,
    website: string,
    contentCalendarId: number,
    imageUrls: string[] | string
  ) => {
    try {
      // Get user preferences
      const userPrefs = await databaseService.getUserPreferences(userId);
      
      // Parse tools JSON if needed
      let userTools: { [key: string]: boolean } = {};
      
      if (userPrefs?.tools) {
        try {
          let toolsData;
          
          if (typeof userPrefs.tools === 'string') {
            toolsData = JSON.parse(userPrefs.tools);
          } else {
            toolsData = userPrefs.tools;
          }
          
          // Extract userTools object
          userTools = toolsData.userTools || {};
          
          console.log("User tools configuration:", userTools);
        } catch (error) {
          console.error("Error parsing tools:", error);
          // Continue with empty object
        }
      }
      
      // Convert imageUrls to array if it's a string
      const imageUrlsArray = typeof imageUrls === 'string' 
        ? imageUrls.split(',').map(url => url.trim()) 
        : (imageUrls || []);
      
      // Initialize context
      let context: any = {
        formData,
        contentCalendarId,
        availableStores: [],
        filteredStores: [],
        articleContext: null,
        summarizedContext: null,
        finalArticle: null
      };
      
      // Check if websiteScraping is enabled
      if (userTools.websiteScraping) {
        console.log("Starting to scrape website:", website);
        context.availableStores = await scraperService.companyContext(website);
        console.log("Starting filter process with available stores: ", context.availableStores);
        
        // Step 2: Generate filtered store list
        context.filteredStores = await aiGenerateService.generateStoreList(
          contentCalendarId, 
          JSON.stringify(context.availableStores)
        );
        console.log("Filtered store list: ", context.filteredStores);
        
        // Step 3: Get article context by scraping filtered stores
        context.articleContext = await scraperService.articleContext(context.filteredStores);
        console.log("Article context: ", context.articleContext);
        
        // Step 4: Summarize article context (moved inside the websiteScraping condition)
        context.summarizedContext = await aiGenerateService.summarizeArticle(
          context.articleContext, 
          formData
        );
        console.log("Summarised article context: ", context.summarizedContext);
        //Add a timer that waits 10 seconds to continue
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        console.log("Web scraping disabled in user preferences, skipping related steps");
        // Provide fallback context when scraping is disabled
        context.articleContext = { basicInfo: formData };
      }
      
      // Step 5: Generate final article (always runs)
      context.finalArticle = await aiGenerateService.generateArticle(
        context.summarizedContext, // Use summarized if available, otherwise use article context
        contentCalendarId, 
        imageUrlsArray, 
        userId,
        userTools
      );
      console.log("Article generated successfully");
      
      return context.finalArticle;
    } catch (error) {
      console.error("Error in content pipeline:", error);
      throw error;
    }
  }
};