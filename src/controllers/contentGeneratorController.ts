import { Request, Response } from 'express';
import { generateContentCalender } from '../services/generateContentCalender';
import { articleGeneratorService } from '../services/generateArticle';

export const contentGeneratorController = {
    generateContentCalender: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body.companyinfo || !req.body.date || !req.body.website) {
                res.status(400).json({ error: "Missing required fields: companyinfo and date" });
                return;
            }

            const ideas = await generateContentCalender.generateIdeas(
                req.body.companyinfo,
                req.body.date,
                req.body.website
            );

            res.json(ideas);
        } catch (error) {
            res.status(500).json({ error: "Failed to generate content ideas" });
        }
    },
    generateArticle: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body.version) {
                res.status(400).json({ error: "Missing required field: version" });
                return;
            }

            const articles = await articleGeneratorService.generateArticles(req.body.version);
            res.json(articles);
        } catch (error) {
            console.error('Article generation error:', error);
            res.status(500).json({ error: "Failed to generate articles" });
        }
    }
}; 