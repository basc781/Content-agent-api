import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { ContentCalendar } from "../entities/ContentCalendar.js";
import { Article } from "../entities/Article.js";
import { AppDataSource } from "../data-source.js";
import { OrgPreference } from "../entities/OrgPreferences.js";
import { OrgModuleAccess } from "../entities/OrgModuleAccess.js";
import { Module } from "../entities/Module.js";
import { databaseService } from "./databaseService.js";
import { imagePayloadWithUrls, imagesWithDescription, imagesWithEmbeddings, imagesSearchEmbeddings } from "../types/types.js";

//Intiliase API keys for model providers
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY,});
const gemini = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY,});

const contentRepository = AppDataSource.getRepository(ContentCalendar);
const articleRepository = AppDataSource.getRepository(Article);
const orgPreferenceRepository = AppDataSource.getRepository(OrgPreference);
const orgModuleAccessRepository = AppDataSource.getRepository(OrgModuleAccess);

export const aiGenerateServiceOpenAI = {
  // Generate a content calender for a company of which you have all necessary information. The calender structure is
  // hardcoded and the only variables in this version is the specific company and information about the company.
  generateCalender: async (
    companyInfo: string,
    date: string,
    scrapeResult: string
  ) => {
    const prompt = `
            Generate 20 SEO content ideas for:
            -------------   COMPANY INFO  -------------
            Company context: ${companyInfo}
            -------------   SHOPS LIST  -------------
            Available shops: ${JSON.stringify(scrapeResult)}
            -------------   DATE  -------------
            Current date: ${date}. Make sure to ONLY generate idea's for the future. This can be days/weeks or 1 or 2 months from now. NEVER generate idea's for the past.
            -------------   SEASONAL EVENTS, HOLIDAYS, AND CURRENT TRENDS  -------------
            Consider seasonal events, holidays, and current trends.
            -------------   FORMAT  -------------
            Format each idea as: Title | Event | Description

            Make sure the idea's are aimed at SEO and not just random content. It needs to fit search patterns of regular users. 

            Zorg ervoor dat de categorie winkels bevat die actie.nl ook echt op de website heeft.

            Always answer in the followingJSON format.:
            {
                "ideas": [
                    {
                        "title": "Title of the content",
                        "event": "Event of the content",
                        "description": "Description of the content",
                        "status": "draft",
                        "potential_keywords": "Potential keywords of the content",
                        "search_potential": "Score between 1 and 10 based on search potential",
                        "winkel_voorbeelden": "Winkel voorbeelden of winkels die actie.nl ook echt op de website heeft",
                        "date": "Date of the content"
                    }
                ]
            }
        `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "o1",
      response_format: { type: "json_object" },
    });

    if (!completion.choices[0].message.content) {
      throw new Error("No content generated");
    }

    const content = JSON.parse(completion.choices[0].message.content);
    console.log("Parsed content:", content);
    // Access the ideas array from the content
    const contentItems = content.ideas || [];
    const parsedContent = contentItems.map((item: any) => ({
      title: item.title || "",
      event: item.event || "",
      description: item.description || "",
      status: item.status || "draft",
      potential_keywords: item.potential_keywords || "",
      search_potential: item.search_potential || "",
      winkel_voorbeelden: item.winkel_voorbeelden || "",
      date: item.date || "",
    }));

    console.log("Formatted content for database:", parsedContent);
    // Save to database
    return await contentRepository.save(parsedContent);
  },
  generateStoreList: async (contentId: number, availableStores: string) => {
    console.log(`Starting generateStoreList for contentId: ${contentId}`);

    const contentItem = await contentRepository.findOneBy({ id: contentId });
    if (!contentItem) {
      console.error(`No content item found for contentId: ${contentId}`);
      throw new Error("No content item found for the provided ID");
    }

    console.log(`Found content item: ${contentItem.title}`);

    const prompt = `
            
            -------------   INSTRUCTIONS  -------------
            Generate a list of relevant stores for the article content. Try to find 50 relevant stores, but if there are less availabe that are relevant to the content answer with less.
            
            -------------   CONTENT  -------------
            The content is: ${contentItem.title}

            -------------   AVAILABLE STORES  -------------
            The set of Available stores is: ${availableStores}

            -------------   FORMAT  -------------
            Format the response as a JSON object with the following fields:
            {
                "stores": [
                {"name of store1":"https://www.store1.nl"}, 
                {"name of store2":"https://www.store2.nl"}, 
                {"name of store3":"https://www.store3.nl"}
                ]
            }
        `;

    console.log("Sending prompt to OpenAI...");

    try {
      // Add timeout and retry logic
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("OpenAI API timeout after 3 minutes")),
          180000
        );
      });

      let completion: OpenAI.Chat.Completions.ChatCompletion;
      try {
        completion = (await Promise.race([
          openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "o1",
            response_format: { type: "json_object" },
          }),
          timeoutPromise,
        ])) as OpenAI.Chat.Completions.ChatCompletion;
      } catch (timeoutError) {
        console.log("OpenAI API timed out, retrying...");
        // Retry the API call
        completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "o1",
          response_format: { type: "json_object" },
        });
      }

      console.log("Received response from OpenAI");

      if (!completion.choices[0].message.content) {
        console.error("No content generated from OpenAI");
        throw new Error("No content generated");
      }

      console.log("Parsing JSON response...");
      const content = JSON.parse(completion.choices[0].message.content);
      console.log(`Parsed content with ${content.stores.length} stores`);

      return content.stores;
    } catch (error) {
      console.error("OpenAI API error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error; // Re-throw the error after logging
    }
  },
  summarizeArticle: async (
    articleContext: Array<Record<string, any>>,
    formData: string,
    orgId: string,
    module: Module
  ) => {
    for (const store of articleContext) {
      const [storeName, data] = Object.entries(store)[0];
      try {
        // Parse the JSON content string
        const parsedContent = JSON.parse(data.content);
        const orgModuleAccess = await orgModuleAccessRepository.findOneBy({
          orgId: orgId,
          moduleId: module.id,
        });

        const prompt = `${orgModuleAccess?.summaryPrompt}
        ----- BEGIN FORM DATA ----- ${JSON.stringify(formData)} ----- END FORM DATA ----- 
        
        ----- BEGIN background information ----- ${JSON.stringify(parsedContent)} ----- END background information -----`;

        console.log("Prompt--->:", prompt);

        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          model: "gpt-4o",
          response_format: { type: "json_object" },
        });

        const summary = JSON.parse(
          completion.choices[0].message.content || "{}"
        ).information;

        console.log("Summary--->:", summary);

        if (!summary) {
          throw new Error("No summary found");
        }

        // Add summary directly to the store object
        store[storeName].summary = summary;
      } catch (error) {
        console.error(`Error processing ${storeName}:`, error);
        store[storeName].summary = {
          error: `Failed to process: ${(error as Error).message}`,
        };
      }
    }

    return articleContext;
  },
  generateArticle: async (
    articleContext: Array<Record<string, any>> | any,
    contentId: number,
    imageUrls: Array<string>,
    orgId: string,
    module: Module,
    internetSearch: string
  ) => {
    console.log("Input context size:", JSON.stringify(articleContext).length);
    console.log("Input context type:", typeof articleContext);

    // Add null check before using Object.keys
    console.log(
      "Input context structure:",
      articleContext ? Object.keys(articleContext) : "No context available"
    );

    const orgPreference = await orgPreferenceRepository.findOneBy({
      orgId: orgId,
    });
    if (!orgPreference) {
      throw new Error("No org preference found for the provided ID");
    }

    const contentItem = await contentRepository.findOneBy({ id: contentId });
    if (!contentItem) {
      throw new Error("No content item found for the provided ID");
    }
    console.log("Content item:", contentItem);

    // Filter only essential data if websiteScraping is enabled
    const contextForPrompt = module.webScraper && Array.isArray(articleContext) && articleContext
        ? articleContext.map((store) => {
            const [storeName, data] = Object.entries(store)[0];
            return {
              store: storeName,
              summary:
                (data as { summary?: string }).summary ||
                "No summary available",
              url: (data as { url?: string }).url || "No url available",
            };
          })
        : articleContext || { basicInfo: "No context available" }; // Fallback if articleContext is null/undefined

    const orgModulePrompt = await databaseService.getPromptByModuleAndOrgId(
      module.id,
      orgId
    );

    let outputFormat = module.outputFormat; 
    // Default format

    // Check if module has a promptTemplate, if not, fall back to the org's generateContentPrompt
    const promptInstructions = module.promptTemplate;

    const prompt = `
        ------- Onderwerp ---------
        ${contentItem.title} 
        ${JSON.stringify(contentItem.formData)}

        ----- Begin instructies -----
        MODULE INSTRUCTIES:
        ${promptInstructions}

        ORG INSTRUCTIES:
        ${orgPreference.organizationPrompt}

        MODULE + ORG INSTRUCTIES:
        ${orgModulePrompt}
        
        ----- Einde instructies -----
        
        Belangrijk is dat je ALTIJD in ${outputFormat} format reageerd. Voeg nooit de '''markdown''' of '''emailHTML''' tags toe.
        
        ----- Assets die je kunt gebruiken -----
        Voeg deze toe aan relevante plekken in het artikel. Probeer ze tussen de subkoppen door te plaatsen:
        ${JSON.stringify(imageUrls)}
        Als er geen assets zijn, hoef je ze niet te gebruiken.

        ----- Extra Context -----        
        If there is extra content always try to add links to the content. The urls are defined as "url" in the context.

        ${JSON.stringify(contextForPrompt)}

        ----- Internet Search -----
        Below you can find relevant information that was found by searching the internet. This means it is very relevant for current topics and events of which you can make use of in the article. Always try to include current events and topics in the article if any relevant information is found.
        ${internetSearch}
        
        ----- Module Purpose -----
        ${module.purpose || "Genereer een SEO-vriendelijk artikel"}
        `;

    console.log("DIT IS DE Prompt:", prompt);

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "o3",
    });

    const article = completion.choices[0].message.content;
    console.log("Generated article:", article);

    // const newArticle = new Article();
    // newArticle.text = article || "";
    // newArticle.contentCalendarId = contentItem.id || 0;
    // newArticle.status = "published";
    // newArticle.pagepath =
    //   contentItem.title
    //     .toLowerCase()
    //     .replace(/[^a-z0-9\s-]/g, "")
    //     .replace(/\s+/g, "-") + contentItem.id.toString() || "";
    // newArticle.orgId = orgId;
    // newArticle.outputFormat = outputFormat;
    // await articleRepository.save(newArticle);

    // contentItem.status = "published";
    // await contentRepository.save(contentItem);

    return article;
  },
  validateFormData: async (formData: any, orgId: string) => {
    const orgPreference = await orgPreferenceRepository.findOneBy({
      orgId: orgId,
    });
    if (!orgPreference) {
      throw new Error("No user preference found for the provided ID");
    }

    const prompt = `        

        Aan jou de taak om te gaan valideren of de form data correct is. Dit ga je doen op basis van de volgende regels:
        ${JSON.stringify(orgPreference.checkFormDataPrompt)}
        
        -------------- EIND REGELS EN BEGIN FORM DATA --------------

        Hier is de form data die je moet valideren:
        ${JSON.stringify(formData)}

        -------------- EIND FORM DATA BEGIN JSON FORMAT --------------
        Antwoord met valid wanneer er geen brekende of kritieke fouten zijn.
        Als er wel grote/brekende fouten zijn, geef dan aan wat de fout is en geef beknopte en actie gerichte feedback.
        {
            "valid": true,
            "feedback": [
                "feedback1",
                "feedback2",
                ...
            ]
        }


        `;
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
      response_format: { type: "json_object" },
    });

    const validation = JSON.parse(
      completion.choices[0].message.content || "{}"
    );
    return validation;
  },
  generateImageDescription: async (images: imagePayloadWithUrls) => {
    const result: imagesWithDescription = { images: [] };

    for (const image of images.images) {
      console.log("Now at number:", result.images.length + 1, "of", images.images.length);
      try {
        console.log("Generating image description for", image);
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "You are an expert at describing images. Please describe the image in as much detail as possible. These descriptions will be used to find similar images for the user via a vector search." },
                { type: "image_url", image_url: { url: process.env.R2_PUBLIC_URL +"/" + image.uniqueFilename } }
              ]
            }
          ],
          max_tokens: 300
        });

        console.log("Response of",image,response.choices[0])

        result.images.push({
          ...image,
          description: response.choices[0]?.message?.content || "No description generated"
        });
      } catch (error) {
        console.error("Error generating image description:", error);
        result.images.push({
          ...image,
          description: "No description generated by OpenAI"
        });
      }
    }
    console.log("Result--->:", result);
    return result;
  },


  generateDescriptionEmbedding: async (images: imagesWithDescription): Promise<imagesWithEmbeddings> => {
    const result: imagesWithEmbeddings = { images: [] };

    for (const image of images.images) {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: image.description,
        encoding_format: "float",
    });

    result.images.push({
      ...image,
      embedding: embedding.data[0].embedding
    });
  }

    return result;
  },
  generateNearestNeighborEmbedding: async (draftArticle: any) => {
    const prompt = `
      Je bent een expert in het zoeken naar afbeeldingen die relevant zijn voor dit artikel. Vandaar dat je per paragraaf/subkop een beschrijving maakt van het soort afbeeldingen die relevant zijn voor de context.
      De image library waar met deze beschrijvingen in gezocht gaat worden bestaat voornamelijk uit afbeeldingen van bloemen en planten etc etc. Houd hier dus rekening mee dat je omschrijvingen niet te specifiek zijn en gericht zijn op bloemen en planten.
      Hieronder vind je het artikel dat je moet lezen en per paragraaf/subkop een beschrijving maken van het soort afbeeldingen die relevant zijn voor de context.

      ${draftArticle}

      Antwoord in het volgende json formaat:
      {
        "paragraphs": [
          {
            "beschrijving_afbeelding": "Gedetailleerde beschrijving van het soort afbeelding dat relevant is voor deze paragraaf",
            "paragraaf": "De paragraaf waar de beschrijving van de afbeelding relevant is"
          },
          {
            "beschrijving_afbeelding": "Gedetailleerde beschrijving van het soort afbeelding dat relevant is voor deze paragraaf",
            "paragraaf": "De paragraaf waar de beschrijving van de afbeelding relevant is"
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    if (!completion.choices[0].message.content) {
      throw new Error("No content generated by OpenAI");
    }

    const description = JSON.parse(completion.choices[0].message.content).paragraphs;

    const searchEmbeddings: imagesSearchEmbeddings[] = [];

    for (const paragraph of description) {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: paragraph.beschrijving_afbeelding,
        encoding_format: "float",
      });
      searchEmbeddings.push({
        paragraaf: paragraph.paragraaf,
        beschrijving_afbeelding: paragraph.beschrijving_afbeelding,
        searchEmbedding: embedding.data[0].embedding
      });
    }

    return searchEmbeddings;
  },

  simplePrompt: async (prompt: string, model: string): Promise<string> => {
    
    console.log("Prompt--->:", prompt);
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });
    console.log("Completion--->:", completion.choices[0].message.content);
    return completion.choices[0].message.content || "No response from OpenAI";
  }
  
};

export const aiGenerateServiceGemini = {

  AIinternetSearch: async (query: string): Promise<string> => {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-pro-preview-03-25",
      contents: [query],
      config: {
        tools: [{googleSearch:{}}],
      },
    });

    if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("No response or wrong response format from Gemini");
    }
    return response.candidates[0].content.parts[0].text;
  }

}