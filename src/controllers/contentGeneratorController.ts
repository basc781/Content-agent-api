import { Request, Response } from 'express';
import { scraperService } from '../services/scraperService';
import { aiGenerateService } from '../services/aiGenerateService';
// import { generateContentCalender } from '../services/generateContentCalender';
// import { articleGeneratorService } from '../services/generateArticle';

// export const contentGeneratorController = {
//     generateContentCalender: async (req: Request, res: Response): Promise<void> => {
//         try {
//             if (!req.body.companyinfo || !req.body.date || !req.body.website) {
//                 res.status(400).json({ error: "Missing required fields: companyinfo and date" });
//                 return;
//             }

//             const ideas = await generateContentCalender.generateIdeas(
//                 req.body.companyinfo,
//                 req.body.date,
//                 req.body.website
//             );

//             res.json(ideas);
//         } catch (error) {
//             res.status(500).json({ error: "Failed to generate content ideas" });
//         }
//     },
//     generateArticle: async (req: Request, res: Response): Promise<void> => {
//         try {
//             if (!req.body.version) {
//                 res.status(400).json({ error: "Missing required field: version" });
//                 return;
//             }

//             const articles = await articleGeneratorService.generateArticles(req.body.version);
//             res.json(articles);
//         } catch (error) {
//             console.error('Article generation error:', error);
//             res.status(500).json({ error: "Failed to generate articles" });
//         }
//     }
// }; 


export const contentGeneratorController = {
    generateContentCalender: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body.companyinfo || !req.body.date || !req.body.website) {
                res.status(400).json({ error: "Missing required fields: companyinfo and date" });
                return;
            }
            console.log("Starting to scrape website: ", req.body.website);
            const extraCompanyInfo = await scraperService.companyContext(req.body.website);

            console.log("Generating content calender");
            const contentCalender = await aiGenerateService.generateCalender(req.body.companyinfo, req.body.date, JSON.stringify(extraCompanyInfo));

            console.log("Content calender generated");
            res.json(contentCalender);
        } 
        catch (error) {
            console.error('Content calender generation error:', error);
            res.status(500).json({ error: "Failed to generate content ideas" });
        }
    },
    generateArticle: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body.contentId || !req.body.website) {
                res.status(400).json({ error: "Missing required field: contentIds or website" });
                return;
            }    

            const availableStores = await scraperService.companyContext(req.body.website);

            const filteredStoreList = await aiGenerateService.generateStoreList(req.body.contentId, JSON.stringify(availableStores));
            console.log("Filtered store list: ", filteredStoreList);

            //Function to add more info to the the filteredstorelist json by scraping the url's that are in the
            res.json(filteredStoreList);
        } 
        catch (error) {
            console.error('Article generation error:', error);
            res.status(500).json({ error: "Failed to generate articles" });
        }
    }
}; 