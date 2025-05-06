import { scraperService } from "./scraperService.js";
import { aiGenerateServiceGemini, aiGenerateServiceOpenAI } from "./aiGenerateService.js";
import { databaseService } from "./databaseService.js";
import { Module } from "../entities/Module.js";
import { imagesSearchEmbeddings } from "../types/types.js";

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
    module: Module
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
        draftArticle: null,
        module: module,
        internetSearch: null
      };



      if (module.internetSearch) {
        console.log("Internet search enabled, starting internet search");
        const prompt = `Generate a prompt for an internet search that searches for current information about the following topic. Focus on information that is relevant at this current moment in time!!!!! Think of events, dates, etc. Current date: ${new Date().toISOString()} ${JSON.stringify(formData)}`;
        console.log("Prompt: ", prompt);
        const internetSearchPrompt = await aiGenerateServiceOpenAI.simplePrompt(prompt,"gpt-4o");
        console.log("Internet search prompt: ", internetSearchPrompt);
        context.internetSearch = await aiGenerateServiceGemini.AIinternetSearch(internetSearchPrompt);
        console.log("Internet search: ", context.internetSearch);
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
        context.filteredStores = await aiGenerateServiceOpenAI.generateStoreList(
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
        context.summarizedContext = await aiGenerateServiceOpenAI.summarizeArticle(
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
      context.draftArticle = await aiGenerateServiceOpenAI.generateArticle(
        context.summarizedContext, // Use summarized if available, otherwise use article context
        contentCalendarId,
        imageUrlsArray,
        orgId,
        module,
        context.internetSearch
      );
      console.log("Article generated successfully");


      if (module.assetLibrary) {
  
        console.log("Asset library enabled, generating asset library");
        
        const nearestNeighborEmbedding = await aiGenerateServiceOpenAI.generateNearestNeighborEmbedding(context.draftArticle) as imagesSearchEmbeddings[];
        context.nearestNeighborEmbeddings = nearestNeighborEmbedding as imagesSearchEmbeddings[];
        
        const relevantAssets = await databaseService.getRelevantAssets(context.module, orgId, context.nearestNeighborEmbeddings as imagesSearchEmbeddings[]);
        const assetUrls = relevantAssets.map(paragraph => paragraph.assets?.[0] ? process.env.R2_PUBLIC_URL + "/" + paragraph.assets[0].uniqueFilename : null).filter(url => url !== null);

        console.log("Asset URLs: ", assetUrls);
        imageUrlsArray.push(...assetUrls);
      }else{
        console.log("Asset library disabled, skipping asset library");
      }    

      //step 6: generate the final article
      const finalPrompt = `
      We hebben een draft artikel geschreven en daar achteraf afbeeldingen bij gevonden. Aan jouw de taak om in markdown annotatie de afbeeldingen toe te voegen aan het artikel. belangrijk is dat je dit op de relevante plekken doet.
      Belangrijk is dat je ALTIJD in ${module.outputFormat} format reageerd. Voeg nooit de '''markdown''' of '''emailHTML''' tags toe.
      ------ Hieronder vind je het artikel -------:
      ${context.draftArticle}

      ------ Hieronder vind je de afbeeldingen -------  :
      ${JSON.stringify(imageUrlsArray)}`
      context.finalArticle = await aiGenerateServiceOpenAI.simplePrompt(finalPrompt,"o1");
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
