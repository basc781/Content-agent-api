import { Request, Response } from 'express';
import { scraperService } from '../services/scraperService';
import { aiGenerateService } from '../services/aiGenerateService';
import { uploadToDatabaseService } from '../services/uploadToDatabaseService';

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
            // Check if body has everything for content calendar based article
            if (req.body.contentId && req.body.website && req.body.imageUrls) {
                console.log("Making article from content calendar");
            }
            // Check if body has everything for form based article
            else if (req.body.titel && req.body.event && req.body.beschrijving && req.body.potentialKeywords && req.body.datum && req.body.winkelvoorbeelden && req.body.website && req.body.imageUrls) {
                console.log("Making article from input form");
                const contentCalendar = await uploadToDatabaseService.createContentCalendar(req.body);
                req.body.contentId = contentCalendar.id;
                console.log("Content calendar created with id: ", req.body.contentId);
            }
            else {
                res.status(400).json({ error: "Missing required fields for either content calendar or form based article" });
                return;
            }

            const availableStores = await scraperService.companyContext(req.body.website);

            const filteredStoreList = await aiGenerateService.generateStoreList(req.body.contentId, JSON.stringify(availableStores));
            console.log("Filtered store list: ", filteredStoreList);

            // Get article context by scraping all filtered stores
            const articleContext = await scraperService.articleContext(filteredStoreList);
            console.log("Article context: ", articleContext);
            
            const summarisedAritcleContext = await aiGenerateService.summarizeArticle(articleContext as any);
            console.log("Summarised article context: ", summarisedAritcleContext);
            

            const article = await aiGenerateService.generateArticle(summarisedAritcleContext, req.body.contentId, req.body.imageUrls);
            console.log("Article: ", article);

            res.json({article: article});
        } 
        catch (error) {
            console.error('Article generation error:', error);
            res.status(500).json({ error: "Failed to generate articles" });
        }
    },
    checkFormData: async (req: Request, res: Response): Promise<void> => {
        
        console.log("Checking form data");
        if (req.body.titel && req.body.event && req.body.beschrijving && req.body.potentialKeywords && req.body.datum && req.body.winkelvoorbeelden && req.body.website && req.body.imageUrls) {
            console.log("Form data is complete");
            const formDataValidation = await aiGenerateService.validateFormData(req.body);
            console.log("Form data validation: ", formDataValidation);
            res.json({formDataValidation});
        }
        else {
            res.status(400).json({ error: "Missing required fields for form based article" });
            return;
        }
    }
}; 