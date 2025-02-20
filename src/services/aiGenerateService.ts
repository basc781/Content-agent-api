import OpenAI from 'openai';
import { ContentCalendar } from '../entities/ContentCalendar';
import { AppDataSource } from '../data-source';
import { Article } from '../entities/Article';
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
    }
}