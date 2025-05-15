import { scraperService } from "../services/scraperService.js";
import { aiGenerateServiceGemini, aiGenerateServiceOpenAI } from "../services/aiGenerateService.js";
import { databaseService } from "../services/databaseService.js";
import { Module } from "../entities/Module.js";
import { contentItemContext } from "../types/types.js";
import { formData } from "../types/types.js";

export const contentPipelineService = {
  generateArticleContent: async (orgId: string, formData: formData, contentCalendarId: number, module: Module): Promise<string> => {
    // Initialize context
    const context: contentItemContext = {
      orgId: orgId,
      formData: formData,
      contentCalendarId: contentCalendarId,
      availableStores: "",
      filteredStoresUrls: [],
      scrapedWebPages: [],
      summarizedContext: [],
      draftArticle: "",
      module: module,
      internetSearch: "",
      nearestNeighborEmbeddings: [],
      relevantAssets: [],
      finalArticle: "",
      assetUrls: [],
      finalPrompt: "",
    };

    if (module.internetSearch) {
      const prompt = `Generate a prompt for an internet search that searches for current information about the following topic. Focus on information that is relevant at this current moment in time!!!!! Think of events, dates, etc. Current date: ${new Date().toISOString()} ${JSON.stringify(
        context.formData
      )}`;
      const internetSearchPrompt = await aiGenerateServiceOpenAI.simplePrompt(prompt, "gpt-4o");
      context.internetSearch = await aiGenerateServiceGemini.AIinternetSearch(internetSearchPrompt);
    }
    // Check if websiteScraping is enabled
    if (module.webScraper) {
      // Step 1: We scrape a Markdown file of the url that is saved in the database to be scraped for context
      context.availableStores = await scraperService.companyContext(context.module.scraperSources);
      // Step 2: Generate a string array of all the url's that possibly have relevant context.
      // Done by sending markdown to AI with a prompt.
      context.filteredStoresUrls = await aiGenerateServiceOpenAI.generateStoreList(context.contentCalendarId, context.availableStores);
      // Step 3: Scraping all url's that could have relevant context. from step 2.
      // Markdown of page is scraped and a entire Markdown string of the page is saved the scrapedWebPages object.
      context.scrapedWebPages = await scraperService.articleContext(context.filteredStoresUrls);
      // Step 4: The markdown content is to much to use as context in the prompt. Therefore we summarize every markdown file/string.
      //This than is being saved as summary in the summarizedContext object together with the .
      context.summarizedContext = await aiGenerateServiceOpenAI.summarizeArticle(
        context.scrapedWebPages,
        context.formData,
        context.orgId,
        context.module
      );
    } else {
      context.summarizedContext = [];
    }
    // Step 5: Generate a first version of the article. This is neccesary to find relevant images and possibly do any checks.
    context.draftArticle = await aiGenerateServiceOpenAI.generateArticle(
      context.summarizedContext, // Use summarized if available, otherwise use article context
      context.contentCalendarId,
      context.orgId,
      context.module,
      context.internetSearch
    );
    if (context.module.assetLibrary) {
      context.nearestNeighborEmbeddings = await aiGenerateServiceOpenAI.generateNearestNeighborEmbedding(context.draftArticle);

      context.relevantAssets = await databaseService.getRelevantAssets(context.module, context.orgId, context.nearestNeighborEmbeddings);
      context.assetUrls = context.relevantAssets
        .map((paragraph) => (paragraph.assets?.[0] ? process.env.R2_PUBLIC_URL + "/" + paragraph.assets[0].uniqueFilename : null))
        .filter((url) => url !== null);

      context.finalPrompt = `
        We hebben een draft artikel geschreven en daar achteraf afbeeldingen bij gevonden. Aan jouw de taak om in markdown annotatie de afbeeldingen toe te voegen aan het artikel. belangrijk is dat je dit op de relevante plekken doet.
        Belangrijk is dat je ALTIJD in ${context.module.outputFormat} format reageerd. Voeg nooit de '''markdown''' of '''emailHTML''' tags toe.
        ------ Hieronder vind je het artikel -------:
        ${context.draftArticle}

        ------ Hieronder vind je de afbeeldingen -------  :
        ${JSON.stringify(context.assetUrls)}`;

      context.finalArticle = await aiGenerateServiceOpenAI.simplePrompt(context.finalPrompt, "o1");
    } else {
      context.finalArticle = context.draftArticle;
    }
    const savedArticle = await databaseService.saveArticle(
      context.finalArticle,
      context.contentCalendarId,
      context.orgId,
      context.module.outputFormat
    );
    return savedArticle;
  },
};
