import OpenAI from 'openai';
import { ContentCalendar } from '../entities/ContentCalendar.js';
import { Article } from '../entities/Article.js';
import { AppDataSource } from '../data-source.js';
import fs from 'fs';
import { UserPreference } from '../entities/UserPreference.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const contentRepository = AppDataSource.getRepository(ContentCalendar);
const articleRepository = AppDataSource.getRepository(Article);
const userPreferenceRepository = AppDataSource.getRepository(UserPreference);
export const aiGenerateService = {
    
    // Generate a content calender for a company of which you have all necessary information. The calender structure is 
    // hardcoded and the only variables in this version is the specific company and information about the company.
    generateCalender: async (companyInfo: string, date: string, scrapeResult: string) => {
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
            response_format: { type: "json_object" }
        });

        if (!completion.choices[0].message.content) {
        throw new Error('No content generated');
        }

        const content = JSON.parse(completion.choices[0].message.content);
        console.log('Parsed content:', content);
        // Access the ideas array from the content
        const contentItems = content.ideas || [];
        const parsedContent = contentItems.map((item: any) => ({   
            title: item.title || '',
            event: item.event || '',
            description: item.description || '',
            status: item.status || 'draft',
            potential_keywords: item.potential_keywords || '',
            search_potential: item.search_potential || '',
            winkel_voorbeelden: item.winkel_voorbeelden || '',
            date: item.date || ''
        }));

        console.log('Formatted content for database:', parsedContent);
        // Save to database
        return await contentRepository.save(parsedContent);
    },
    generateStoreList: async (contentId: number, availableStores: string) => {
        console.log(`Starting generateStoreList for contentId: ${contentId}`);
        
        const contentItem = await contentRepository.findOneBy({ id: contentId });
        if (!contentItem) {
            console.error(`No content item found for contentId: ${contentId}`);
            throw new Error('No content item found for the provided ID');
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
        
        console.log('Sending prompt to OpenAI...');
        
        try {
            // Add timeout and retry logic
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('OpenAI API timeout after 2 minutes')), 120000);
            });
            
            let completion: OpenAI.Chat.Completions.ChatCompletion;
            try {
                completion = await Promise.race([
                    openai.chat.completions.create({
                        messages: [{ role: "user", content: prompt }],
                        model: "o1",
                        response_format: { type: "json_object" }
                    }),
                    timeoutPromise
                ]) as OpenAI.Chat.Completions.ChatCompletion;
            } catch (timeoutError) {
                console.log('OpenAI API timed out, retrying...');
                // Retry the API call
                completion = await openai.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "o1",
                    response_format: { type: "json_object" }
                });
            }
            
            console.log('Received response from OpenAI');
            
            if (!completion.choices[0].message.content) {
                console.error('No content generated from OpenAI');
                throw new Error('No content generated');
            }

            console.log('Parsing JSON response...');
            const content = JSON.parse(completion.choices[0].message.content);
            console.log(`Parsed content with ${content.stores.length} stores`);
            
            return content.stores;
        } catch (error) {
            console.error('OpenAI API error:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            throw error; // Re-throw the error after logging
        }
    },
    summarizeArticle: async (articleContext: Array<Record<string, any>>, formData: string) => {
        for (const store of articleContext) {
            const [storeName, data] = Object.entries(store)[0];
            try {
                // Parse the JSON content string
                const parsedContent = JSON.parse(data.content);
                
                const prompt = `find the best most interesting deal on this page and summarise it in one sentence. Respond with {"best_deal":"the deal"}`;
                
                const completion = await openai.chat.completions.create({
                    messages: [
                        { 
                            role: "user", 
                            content: `${JSON.stringify(parsedContent)}\n\n${prompt} kan je deze in een json format teruggeven. Hieronder vind je de context van waar het artikel over gaat: ${JSON.stringify(formData)}` 
                        }
                    ],
                    model: "gpt-4o",
                    response_format: { type: "json_object" }
                });

                const bestDeal = JSON.parse(completion.choices[0].message.content || '{}').best_deal;
                
                console.log('Best deal:', bestDeal);
                
                if (!bestDeal) {
                    throw new Error('No best deal found');
                }
                
                // Add summary directly to the store object
                store[storeName].summary = bestDeal;

            } catch (error) {
                console.error(`Error processing ${storeName}:`, error);
                store[storeName].summary = { 
                    error: `Failed to process: ${(error as Error).message}` 
                };
            }
        }
        
        return articleContext;
    },
    generateArticle: async (articleContext: Array<Record<string, any>> | any, contentId: number, imageUrls: Array<string>, userId: string, userTools: any) => {
        console.log('Input context size:', JSON.stringify(articleContext).length);
        console.log('Input context type:', typeof articleContext);

        // Add null check before using Object.keys
        console.log('Input context structure:', articleContext ? Object.keys(articleContext) : 'No context available');
        
        // Add a timer that waits 10 seconds to continue
        await new Promise(resolve => setTimeout(resolve, 10000));
        console.log('Waiting almost done');
        await new Promise(resolve => setTimeout(resolve, 20000));
        
        const userPreference = await userPreferenceRepository.findOneBy({ userId: userId });
        if (!userPreference) {
            throw new Error('No user preference found for the provided ID');
        }
        if (!userPreference.generateContentPrompt) {
            throw new Error('No generateContentPrompt found for the provided ID');
        }

        const contentItem = await contentRepository.findOneBy({ id: contentId });
        if (!contentItem) {
            throw new Error('No content item found for the provided ID');
        }
        console.log('Content item:', contentItem);

        // Filter only essential data if websiteScraping is enabled
        const contextForPrompt = userTools.websiteScraping && Array.isArray(articleContext) && articleContext
            ? articleContext.map(store => {
                const [storeName, data] = Object.entries(store)[0];
                return {
                    store: storeName,
                    summary: (data as { summary?: string }).summary || 'No summary available',
                    url: (data as { url?: string }).url || 'No url available'
                };
            })
            : (articleContext || { basicInfo: 'No context available' }); // Fallback if articleContext is null/undefined

        console.log('Generated context item AKJSNDJANJKDNJKASNKJDNJKASNJKDNKJASNDKsandjknaskjndjksanbjkdnaskjbdkjbasjkdbkjasbdjksabk asjkbdjksabkjdbkjasdbkjasbdkj\J', JSON.stringify(contentItem));

        // Parse user tools to determine output format
        let outputFormat = "markdown"; // Default format
        if (userPreference.tools) {
            try {
                let toolsData;
                if (typeof userPreference.tools === 'string') {
                    toolsData = JSON.parse(userPreference.tools);
                } else {
                    toolsData = userPreference.tools;
                }
                
                const userTools = toolsData.userTools || {};
                
                // Check which output format is enabled
                if (userTools.jsonOutput === true) {
                    outputFormat = "json";
                } else if (userTools.markdownOutput === true) {
                    outputFormat = "markdown";
                }
                
                console.log(`Using output format: ${outputFormat}`);
            } catch (error) {
                console.error("Error parsing tools:", error);
                // Continue with default format
            }
        }

        const prompt = `
        ------- Onderwerp van het artikel ---------
        ${contentItem.title} 
        ${JSON.stringify(contentItem.formData)}

        ----- Begin schrijfregels -----
        Je bent een expert SEO schrijver en gaat een artikel voor mij schrijven met de volgende regels: ${JSON.stringify(userPreference.generateContentPrompt)}
        
        ----Einde schrijfregels -----
        
        Belangrijk is dat je ALTIJD in ${outputFormat} format reageerd.
         
        
        ---- Assets die je kunt gebruiken -----
        Voeg deze toe aan relevante plekken in het artikel. Probeer ze tussen de subkoppen door te plaatsen:
        ${JSON.stringify(imageUrls)}
        Als er geen assets zijn, hoef je ze niet te gebruiken.



        ---- extra Context ---------        
        ${JSON.stringify(contextForPrompt)}
        `

        console.log('DIT IS DE Prompt LUL:', prompt);

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "o1"
        });

        const article = completion.choices[0].message.content;
        console.log('Generated article:', article);

        const newArticle = new Article();
        newArticle.text = article  || '';
        newArticle.contentCalendarId = contentItem.id  || 0;
        newArticle.status = 'published';
        newArticle.pagepath = contentItem.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + contentItem.id.toString() || '';
        newArticle.userId = userId;
        newArticle.outputFormat = outputFormat;
        await articleRepository.save(newArticle);

        
        contentItem.status = 'published';
        await contentRepository.save(contentItem);

        return article;

        
    },
    validateFormData: async (formData: any, userId: string) => {
        
        const userPreference = await userPreferenceRepository.findOneBy({ userId: userId });
        if (!userPreference) {
            throw new Error('No user preference found for the provided ID');
        }

        const prompt = `        

        Aan jou de taak om te gaan valideren of de form data correct is. Dit ga je doen op basis van de volgende regels:
        ${JSON.stringify(userPreference.checkFormDataPrompt)}
        
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
            response_format: { type: "json_object" }
        });

        const validation = JSON.parse(completion.choices[0].message.content || '{}');
        return validation;
    }
}