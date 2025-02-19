import OpenAI from 'openai';
import { AppDataSource } from '../data-source';
import { ContentCalendar } from '../entities/ContentCalendar';
import FireCrawlApp from '@mendable/firecrawl-js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const app = new FireCrawlApp({apiKey: process.env.FIRECRAWL_API_KEY});

const contentRepository = AppDataSource.getRepository(ContentCalendar);

export const generateContentCalender = {
    generateIdeas: async (companyInfo: string, date: string, website: string) => {
        console.log('Starting content generation with:', { companyInfo, date });
        
        // First scrape the shop overview page
        const scrapeResult = await app.scrapeUrl(website, {
            formats: [ "markdown" ],
        });
        
        console.log('Scrape result:', scrapeResult);

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
                        "date": "Date of the content",
                        "relevant_shops": ["shop1", "shop2", "shop3"],
                        "status": "Status of the content",
                        "potential_keywords": "Potential keywords of the content",
                        "search_potential": "Score between 1 and 10 based on search potential"
                    }
                ]
            }
        `;
        
        console.log('Using prompt:', prompt);

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "o1",
            response_format: { type: "json_object" }
        });

        console.log('OpenAI response:', completion.choices[0].message);

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
            relevant_shops: item.relevant_shops || [],
            date: item.date || ''
        }));

        console.log('Formatted content for database:', parsedContent);
        
        if (!content) {
            throw new Error('No content generated');
        }
        // Save to database
        return await contentRepository.save(parsedContent);
    }
}; 