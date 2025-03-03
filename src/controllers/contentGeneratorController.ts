import { Request, Response } from 'express';
import { scraperService } from '../services/scraperService';
import { aiGenerateService } from '../services/aiGenerateService';
import { databaseService } from '../services/databaseService';
    
export const contentGeneratorController = {
    // Generate an article based on the content calendar or form data
    generateArticle: async (req: Request, res: Response): Promise<void> => {
        try {
            // Check if body has everything for form based article
            if (req.body.userId && req.body.formData && req.body.website && req.body.imageUrls && req.body.titel && req.body.tools) {
                console.log("Making article from input form");
                const contentCalendar = await databaseService.createContentCalendar(req.body.formData, req.body.userId, req.body.titel);
                req.body.contentId = contentCalendar.id;
                console.log("Content calendar created with id: ", req.body.contentId);
            }
            else {
                res.status(400).json({ error: "Missing required fields for either content calendar or form based article" });
                return;
            }

            const availableStores = await scraperService.companyContext(req.body.website);
            console.log("Starting filter process with available stores: ", availableStores);
            const filteredStoreList = await aiGenerateService.generateStoreList(req.body.formData.contentId, JSON.stringify(availableStores));
            console.log("Filtered store list: ", filteredStoreList);

            // Get article context by scraping all filtered stores
            const articleContext = await scraperService.articleContext(filteredStoreList);
            console.log("Article context: ", articleContext);
            
            const summarisedAritcleContext = await aiGenerateService.summarizeArticle(articleContext as any, req.body.formData);
            console.log("Summarised article context: ", summarisedAritcleContext);
            

            const article = await aiGenerateService.generateArticle(summarisedAritcleContext, req.body.contentId, req.body.imageUrls, req.body.userId);
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
        if (req.body) {
            console.log("Form data is complete");            
            const formDataValidation = await aiGenerateService.validateFormData(req.body.formData, req.body.userId);
            console.log("Form data validation: ", formDataValidation);
            res.json({formDataValidation});
        }
        else {
            res.status(400).json({ error: "Missing input fields to check form" });
            return;
        }
    }
}

export const contentRetrieverController = {
    getPublishedArticles: async (_req: Request, res: Response): Promise<void> => {
        try {
            console.log("Getting published articles");
            const publishedArticles = await databaseService.getPublishedArticles();
            res.json({ publishedArticles });
        } catch (error) {
            console.error('Error retrieving published articles:', error);
            res.status(500).json({ error: "Failed to retrieve published articles" });
        }
    },
    getPublishedContentCalendarItems: async (req: Request, res: Response): Promise<void> => {
        try {
            console.log("Getting published content calendar items");
            
            // Haal userId uit de query parameters
            const userId = req.query.userId as string;
            
            if (!userId) {
                res.status(400).json({ error: "Missing required query parameter: userId" });
                return;
            }
            
            // Stuur userId door naar de database service
            const publishedContentCalendarItems = await databaseService.getPublishedContentCalendarItems(userId);
            res.json({ publishedContentCalendarItems });
        } catch (error) {
            console.error('Error retrieving published content calendar items:', error);
            res.status(500).json({ error: "Failed to retrieve published content calendar items" });
        }
    }
}; 