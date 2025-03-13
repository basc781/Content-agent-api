import { Request, Response } from "express";
import { aiGenerateService } from "../services/aiGenerateService.js";
import { databaseService } from "../services/databaseService.js";
import { contentPipelineService } from "../services/contentPipelineService.js";
import { ArticleGenerationRequest } from "../types/types.js";
import { getAuth } from "@clerk/express";

export const contentGeneratorController = {
  // Generate an article based on the content calendar or form data
  generateArticle: async (req: Request, res: Response): Promise<void> => {
    try {
      const request = req.body as ArticleGenerationRequest;

      // Validate request
      if (!request.formData || !request.moduleId) {
        res
          .status(400)
          .json({ error: "Missing required fields: formData, moduleId" });
        return;
      }

      const orgId = getAuth(req).orgId;

      if (!orgId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const module = await databaseService.getModuleById(
        orgId,
        request.moduleId
      );

      if (!module) {
        res.status(400).json({ error: "Module not found" });
        return;
      }

      // Create content calendar
      const contentCalendar = await databaseService.createContentCalendar(
        request.formData,
        orgId,
        request.formData.titel,
        module.id
      );

      // Run the content generation pipeline
      const article = await contentPipelineService.generateArticleContent(
        orgId,
        request.formData,
        request.website || "",
        contentCalendar.id,
        request.formData.imageUrls || [],
        module
      );

      res.json({ article });
    } catch (error) {
      console.error("Article generation error:", error);
      res.status(500).json({ error: "Failed to generate articles" });
    }
  },
  checkFormData: async (req: Request, res: Response): Promise<void> => {
    console.log("Checking form data");
    if (req.body) {
      const orgId = getAuth(req).orgId;

      if (!orgId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      console.log("Form data is complete");
      const formDataValidation = await aiGenerateService.validateFormData(
        req.body.formData,
        orgId
      );
      console.log("Form data validation: ", formDataValidation);
      res.json({ formDataValidation });
    } else {
      res.status(400).json({ error: "Missing input fields to check form" });
      return;
    }
  },
};

export const contentRetrieverController = {
  getPublishedArticles: async (_req: Request, res: Response): Promise<void> => {
    try {
      console.log("Getting published articles");
      const publishedArticles = await databaseService.getPublishedArticles();
      res.json({ publishedArticles });
    } catch (error) {
      console.error("Error retrieving published articles:", error);
      res.status(500).json({ error: "Failed to retrieve published articles" });
    }
  },
  getPublishedContentCalendarItems: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      console.log("Getting published content calendar items");

      const orgId = getAuth(req).orgId;

      if (!orgId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const moduleId = parseInt(req.query.moduleId as string);

      console.log("Module ID: ", moduleId);

      if (!moduleId) {
        res.status(400).json({ error: "Module ID is required" });
        return;
      }

      const publishedContentCalendarItems =
        await databaseService.getPublishedContentCalendarItems(orgId, moduleId);
      res.json({ publishedContentCalendarItems });
    } catch (error) {
      console.error(
        "Error retrieving published content calendar items:",
        error
      );
      res
        .status(500)
        .json({ error: "Failed to retrieve published content calendar items" });
    }
  },
  getArticleBySlug: async (req: Request, res: Response): Promise<void> => {
    try {
      const { pagepath } = req.params;
      const orgId = getAuth(req).orgId;

      if (!orgId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (!pagepath) {
        res.status(400).json({ error: "Article slug is required" });
        return;
      }

      const article = await databaseService.getArticleBySlug(pagepath, orgId);

      if (!article) {
        res.status(404).json({ error: "Article not found" });
        return;
      }

      res.json(article);
    } catch (error) {
      console.error("Error retrieving article:", error);
      res.status(500).json({ error: "Failed to retrieve article" });
    }
  },
};
