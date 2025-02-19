import { AppDataSource } from '../data-source';
import { ContentCalendar } from '../entities/ContentCalendar';
import { Article } from '../entities/Article';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const contentRepository = AppDataSource.getRepository(ContentCalendar);
const articleRepository = AppDataSource.getRepository(Article);

const schrijfRegels = readFileSync(join(__dirname, '../prompts/prompt.txt'), 'utf-8');


export const articleGeneratorService = {
    generateArticles: async (version: string) => {

        // Get all content calendar items
        const contentItems = await contentRepository.find();
        console.log(`Found ${contentItems.length} content items to process`);

        for (const item of contentItems) {
            console.log(`Generating article for content item: ${item.id}`);
            
            const prompt = `
                Write a detailed SEO article about:
                Title: ${item.title}
                Event: ${item.event}
                Description: ${item.description}
                Potential keywords: ${item.potential_keywords}
                Winkel voorbeelden: ${item.winkel_voorbeelden}
                Date: ${item.date}

                Use the following writing guidelines to write the article: 
                ${schrijfRegels}
                
                Make it engaging and optimized for search engines. Write it ALL in dutch and in markdown style!!!
            `;

            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "o1",
            });             


            // async function getGroqChatCompletion() {
            //     return groq.chat.completions.create({
            //       messages: [
            //         {
            //           role: "user",
            //           content: prompt,
            //         },
            //       ],
            //       model: "llama-3.3-70b-versatile",
            //     });
            //   }

            if (!completion.choices[0].message.content) {
                console.error(`No content generated for item ${item.id}`);
                continue;
            }

            const article = articleRepository.create({
                text: completion.choices[0].message.content,
                contentCalendarId: item.id,
                version: version
            });

            await articleRepository.save(article);
            console.log(`Saved article for content item: ${item.id} with version: ${version}`);
        }

        return await articleRepository.find();
    }

    
}; 