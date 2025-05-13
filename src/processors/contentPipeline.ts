import { scraperService } from "../services/scraperService.js";
import { aiGenerateServiceGemini, aiGenerateServiceOpenAI } from "../services/aiGenerateService.js";
import { databaseService } from "../services/databaseService.js";
import { Module } from "../entities/Module.js";
import { imagesSearchEmbeddings, contentItemContext } from "../types/types.js";
import { formData } from "../types/types.js";

export const contentPipelineService = {
  generateArticleContent: async (
    orgId: string,
    formData: formData,
    contentCalendarId: number,
    module: Module
  ): Promise<string> => {
    
    try {
      // Initialize context
      let context: contentItemContext = {
        formData: formData,
        contentCalendarId: contentCalendarId,
        availableStores: "",
        filteredStoresUrls: [],
        scrapedWebPages: [],
        summarizedContext: [],
        draftArticle: "",
        module: module,
        internetSearch: "",
        nearestNeighborEmbeddings:[],
        relevantAssets:[],
        finalArticle:""
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
        console.log("Scraper sources: ", module.scraperSources);
        // Step 1: We scrape a Markdown file of the url that is saved in the database to be scraped for context
        context.availableStores = await scraperService.companyContext(module.scraperSources);
        console.log(
          "Starting filter process with available stores: ",
          context.availableStores
        );
        // Step 2: Generate a string array of all the url's that possibly have relevant context. 
        // Done by sending markdown to AI with a prompt.
        context.filteredStoresUrls = await aiGenerateServiceOpenAI.generateStoreList(
          contentCalendarId,
          context.availableStores
        );

        // Step 3: Scraping all url's that could have relevant context. from step 2. 
        // Markdown of page is scraped and a entire Markdown string of the page is saved the scrapedWebPages object.
        context.scrapedWebPages = await scraperService.articleContext(context.filteredStoresUrls);

        // Step 4: The markdown content is to much to use as context in the prompt. Therefore we summarize every markdown file/string.
        //This than is being saved as summary in the summarizedContext object together with the .
        context.summarizedContext = await aiGenerateServiceOpenAI.summarizeArticle(
          context.scrapedWebPages,
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
      }

      // Step 5: Generate a first version of the article. This is neccesary to find relevant images and possibly do any checks.
      context.draftArticle = await aiGenerateServiceOpenAI.generateArticle(
        context.summarizedContext, // Use summarized if available, otherwise use article context
        contentCalendarId,
        orgId,
        module,
        context.internetSearch
      );
      console.log("Article generated successfully");


      if (module.assetLibrary) {
  
        console.log("Asset library enabled, generating asset library");
        
        context.nearestNeighborEmbeddings = await aiGenerateServiceOpenAI.generateNearestNeighborEmbedding(context.draftArticle);
        
        context.relevantAssets = await databaseService.getRelevantAssets(context.module, orgId, context.nearestNeighborEmbeddings);
        const assetUrls = context.relevantAssets.map(paragraph => paragraph.assets?.[0] ? process.env.R2_PUBLIC_URL + "/" + paragraph.assets[0].uniqueFilename : null).filter(url => url !== null);

        const finalPrompt = `
        We hebben een draft artikel geschreven en daar achteraf afbeeldingen bij gevonden. Aan jouw de taak om in markdown annotatie de afbeeldingen toe te voegen aan het artikel. belangrijk is dat je dit op de relevante plekken doet.
        Belangrijk is dat je ALTIJD in ${module.outputFormat} format reageerd. Voeg nooit de '''markdown''' of '''emailHTML''' tags toe.
        ------ Hieronder vind je het artikel -------:
        ${context.draftArticle}

        ------ Hieronder vind je de afbeeldingen -------  :
        ${JSON.stringify(assetUrls)}`

        context.finalArticle = await aiGenerateServiceOpenAI.simplePrompt(finalPrompt,"o1");
      }else{
        console.log("Asset library disabled, skipping asset library");
        context.finalArticle = context.draftArticle;
      }          
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
