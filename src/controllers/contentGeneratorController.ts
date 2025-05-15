import { Request, Response } from "express";
import {
  aiGenerateServiceGemini,
  aiGenerateServiceOpenAI,
} from "../services/aiGenerateService.js";
import { databaseService } from "../services/databaseService.js";
import { generateContentItemPayload } from "../types/types.js";
import { getAuth } from "@clerk/express";
import { contentProcessorRouter } from "../services/contentProcessorRouter.js";

export const contentGeneratorController = {
  generateContentItem: async (req: Request, res: Response): Promise<void> => {
    try {
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
      const article = await contentProcessorRouter.routeContentItem(
        orgId,
        briefing.moduleId,
        briefing.formData
      );
      res.status(200).json({ article });
    } catch (error) {
      console.error("Error in generateContentItem:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  },
  deleteCalendarItem: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID format" });
        return;
      }

      await databaseService.deleteContentCalendar(id);
      res.status(200).json({ message: "Calendar item deleted successfully" });
    } catch (error) {
      console.error("Error in deleteCalendarItem:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  },
  checkFormData: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body.formData) {
        res.status(400).json({ error: "Missing required fields: formData, moduleId" });
        return;
      }

      const orgId = getAuth(req).orgId;
      if (!orgId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const formDataValidation = await aiGenerateServiceOpenAI.validateFormData(
        req.body.formData,
        orgId
      );
      res.status(200).json({ formDataValidation });
    } catch (error) {
      console.error("Error in checkFormData:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  },

  searchArticles: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body.query) {
        res.status(400).json({ error: "Missing required fields: query" });
        return;
      }
      const query = req.body.query;
      const response = await aiGenerateServiceGemini.AIinternetSearch(query);
      res.status(200).json({ "Internet Search": response });
    } catch (error) {
      console.error("Error in searchArticles:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  },
};

export const contentRetrieverController = {
  getPublishedArticles: async (_req: Request, res: Response): Promise<void> => {
    try {
      const publishedArticles = await databaseService.getPublishedArticles();
      res.status(200).json({ publishedArticles });
    } catch (error) {
      console.error("Error in getPublishedArticles:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  },
  getPublishedContentCalendarItems: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
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
      const publishedContentCalendarItems =
        await databaseService.getPublishedContentCalendarItems(orgId, moduleId);
      res.status(200).json({ publishedContentCalendarItems });
    } catch (error) {
      console.error("Error in getPublishedContentCalendarItems:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  },
  getAllPublishedContentCalendarItems: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const orgId = getAuth(req).orgId;
      if (!orgId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await databaseService.updateContentCalendarStatus();
      const publishedContentCalendarItems =
        await databaseService.getAllPublishedContentCalendarItems(orgId);

      res.status(200).json({ publishedContentCalendarItems });
    } catch (error) {
      console.error("Error in getAllPublishedContentCalendarItems:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  },
  getArticleBySlug: async (req: Request, res: Response): Promise<void> => {
    try {
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

      res.status(200).json(article);
    } catch (error) {
      console.error("Error in getArticleBySlug:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  },
};
