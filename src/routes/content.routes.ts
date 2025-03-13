import { Router } from "express";
import {
  contentGeneratorController,
  contentRetrieverController,
} from "../controllers/contentGeneratorController.js";

export const contentRouter = Router();

contentRouter.post("/generate", contentGeneratorController.generateArticle);
contentRouter.post("/validate", contentGeneratorController.checkFormData);
contentRouter.get(
  "/published",
  contentRetrieverController.getPublishedArticles
);
contentRouter.get(
  "/calendar",
  contentRetrieverController.getPublishedContentCalendarItems
);
contentRouter.get("/:pagepath", contentRetrieverController.getArticleBySlug);
