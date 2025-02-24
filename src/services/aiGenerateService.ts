import OpenAI from 'openai';
import { ContentCalendar } from '../entities/ContentCalendar';
import { Article } from '../entities/Article';
import { AppDataSource } from '../data-source';
import fs from 'fs';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const contentRepository = AppDataSource.getRepository(ContentCalendar);
const articleRepository = AppDataSource.getRepository(Article);

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
        const contentItem = await contentRepository.findOneBy({ id: contentId });
        if (!contentItem) {
            throw new Error('No content item found for the provided ID');
        }

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
        
        return content.stores;
    },
    summarizeArticle: async (articleContext: Array<Record<string, any>>) => {
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
                            content: `${JSON.stringify(parsedContent)}\n\n${prompt} kan je deze in een json format teruggeven` 
                        }
                    ],
                    model: "gpt-4o",
                    response_format: { type: "json_object" }
                });

                const bestDeal = JSON.parse(completion.choices[0].message.content || '{}').best_deal;
                
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
    generateArticle: async (summarisedAritcleContext: Array<Record<string, any>>, contentId: number, imageUrls: Array<string>) => {
        console.log('Input context:', summarisedAritcleContext);
        
        const contentItem = await contentRepository.findOneBy({ id: contentId });
        if (!contentItem) {
            throw new Error('No content item found for the provided ID');
        }
        console.log('Content item:', contentItem);

        // Create a string of alternating URLs and summaries
        const contextString = summarisedAritcleContext.map(store => {
            const [storeName, data] = Object.entries(store)[0];
            console.log('Processing store data:', data);
            return `${storeName}\n${data.url}\n${data.summary}`;  // Access summary directly as it's a string
        }).join('\n\n');

        console.log('Generated context item AKJSNDJANJKDNJKASNKJDNJKASNJKDNKJASNDKsandjknaskjndjksanbjkdnaskjbdkjbasjkdbkjasbdjksabk asjkbdjksabkjdbkjasdbkjasbdkj\J', JSON.stringify(contentItem));

        const prompt = `
        ------- Onderwerp van het artikel ---------
        ${contentItem.title} Door acties.nl
        ${contentItem.description}
        ${contentItem.event}
        ${contentItem.date}

        ----- Begin schrijfregels -----
        Je bent een expert SEO schrijver en gaat een artikel voor mij schrijven met de volgende regels: ${fs.readFileSync('./src/prompts/prompt_generateArticle.txt', 'utf8')}
        
        ----Einde schrijfregels -----
        
        Belangrijk is dat je ALTIJD in markdown reageert. Zet ook lekker veel backlinks in van de relevante pagina's die je hieronder meekrijgt.
        
        ---- Assets die je kunt gebruiken -----
        Voeg deze toe aan relevante plekken in het artikel. Probeer ze tussen de subkoppen door te plaatsen:
        ${JSON.stringify(imageUrls)}



        ---- Context ---------        
        ${contextString}
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
        await articleRepository.save(newArticle);

        return article;
    },
    validateFormData: async (formData: any) => {
        const prompt = `
        Aan jou de taak om te gaan valideren of de form data correct is. Dit ga je doen op basis van de volgende regels:
        ${fs.readFileSync('./src/prompts/prompt_checkFormData.txt', 'utf8')}
        
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
            model: "o1",
            response_format: { type: "json_object" }
        });

        const validation = JSON.parse(completion.choices[0].message.content || '{}');
        return validation;
    }
}