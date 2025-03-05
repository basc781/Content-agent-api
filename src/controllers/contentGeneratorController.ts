import { Request, Response } from 'express';
import { aiGenerateService } from '../services/aiGenerateService.js';
import { databaseService } from '../services/databaseService.js';
import { contentPipelineService } from '../services/contentPipelineService.js';
import { ArticleGenerationRequest } from '../types/types.js';
    
export const contentGeneratorController = {
    // Generate an article based on the content calendar or form data
    generateArticle: async (req: Request, res: Response): Promise<void> => {
        try {
            const request = req.body as ArticleGenerationRequest;
            
            // Validate request
            if (!request.userId || !request.formData) {
                res.status(400).json({ error: "Missing required fields: userId or formData" });
                return;
            }
            
            console.log("Making article from input form");
            
            // Create content calendar
            const contentCalendar = await databaseService.createContentCalendar(
                request.formData, 
                request.userId, 
                request.formData.titel
            );
            console.log("Content calendar created with id: ", contentCalendar.id);
            
            // Run the content generation pipeline
            const article = await contentPipelineService.generateArticleContent(
                request.userId,
                request.formData,
                request.website || '',
                contentCalendar.id,
                request.formData.imageUrls || []
            );
            
            res.json({ article });
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