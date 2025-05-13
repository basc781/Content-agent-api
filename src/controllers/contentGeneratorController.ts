import { Request, Response } from "express";
import { aiGenerateServiceGemini, aiGenerateServiceOpenAI } from "../services/aiGenerateService.js";
import { databaseService } from "../services/databaseService.js";
import { generateContentItemPayload } from "../types/types.js";
import { getAuth } from "@clerk/express";
import { contentProcessorRouter } from "../services/contentProcessorRouter.js";

export const contentGeneratorController = {
  generateContentItem: async (req: Request, res: Response): Promise<void> => {
    const briefing = req.body as generateContentItemPayload;
    if (!briefing.formData || !briefing.moduleId) {
      res.status(400).json({ error: "Missing required fields: formData, moduleId" });
      return;
    }

    const orgId = getAuth(req).orgId;
    if (!orgId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const article = await contentProcessorRouter.routeContentItem(orgId,briefing.moduleId,briefing.formData);
    res.status(200).json({ article });
  },
  deleteCalendarItem: async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID format" });
      return;
    }

    await databaseService.deleteContentCalendar(id);
    res.status(200).json({ message: "Calendar item deleted successfully" });
  },
  checkFormData: async (req: Request, res: Response): Promise<void> => {
    if (!req.body.formData || !req.body.moduleId) {
      res.status(400).json({ error: "Missing required fields: formData, moduleId" });
      return;
    }
    
    const orgId = getAuth(req).orgId;
    if (!orgId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const formDataValidation = await aiGenerateServiceOpenAI.validateFormData(req.body.formData,orgId);
    res.status(200).json({ formDataValidation });
  },

  searchArticles: async (req: Request, res: Response): Promise<void> => {
    if (!req.body.query) {
      res.status(400).json({ error: "Missing required fields: query" });
      return;
    }
    const query = req.body.query;
    const response = await aiGenerateServiceGemini.AIinternetSearch(query);
    res.status(200).json({ "Internet Search": response });
  },
};

export const contentRetrieverController = {
  getPublishedArticles: async (_req: Request, res: Response): Promise<void> => {  
    const publishedArticles = await databaseService.getPublishedArticles();
    res.status(200).json({ publishedArticles });
  },
  getPublishedContentCalendarItems: async (req: Request,res: Response): Promise<void> => {
    const orgId = getAuth(req).orgId;
    if (!orgId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const moduleId = parseInt(req.query.moduleId as string);
    if (!moduleId) {
      res.status(400).json({ error: "Module ID is required" });
      return;
    }

    await databaseService.updateContentCalendarStatus();
    const publishedContentCalendarItems = await databaseService.getPublishedContentCalendarItems(orgId, moduleId);
    res.status(200).json({ publishedContentCalendarItems });
  },
  getAllPublishedContentCalendarItems: async (req: Request,res: Response): Promise<void> => {
    const orgId = getAuth(req).orgId;
    if (!orgId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await databaseService.updateContentCalendarStatus();
    const publishedContentCalendarItems = await databaseService.getAllPublishedContentCalendarItems(orgId);

    res.status(200).json({ publishedContentCalendarItems });
  },
  getArticleBySlug: async (req: Request, res: Response): Promise<void> => {  
    const { pagepath } = req.params;
      if (!pagepath) {
        res.status(400).json({ error: "Article slug is required" });
        return;
      }
      
      const orgId = getAuth(req).orgId;
      if (!orgId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const article = await databaseService.getArticleBySlug(pagepath, orgId);
      if (!article) {
        res.status(400).json({ error: "Article not found" });
        return;
      }

      res.json(article);
  },
};
