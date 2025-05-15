import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { analyseImageService } from "../services/bucketService.js";
import { aiGenerateServiceOpenAI } from "../services/aiGenerateService.js";
import {
  imagePayloadWithUrls,
  imagesWithDescription,
  GenerateMetadataRequest,
  imagesWithEmbeddings,
} from "../types/types.js";
import { databaseService } from "../services/databaseService.js";

export const imagesController = {
  getUploadUrls: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = getAuth(req).orgId;
      if (!orgId) {
        console.log("Error: Unauthorized - No organization ID");
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const imagesToUpload = req.body;
      if (!imagesToUpload) {
        res.status(400).json({ error: "No images to upload" });
        return;
      }
      const imagesWithUrls =
        await analyseImageService.generateAuthenticatedUrls(imagesToUpload);
      res.status(200).json({ images: imagesWithUrls.images });
    } catch (error) {
      console.error("Error in getUploadUrls:", error);
      res.status(500).json({
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  },
  generateMetadata: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = getAuth(req).orgId;
      if (!orgId) {
        console.log("Error: Unauthorized - No organization ID");
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const body = req.body as GenerateMetadataRequest;
      const imagesToUpload: imagePayloadWithUrls = {
        images: body.images,
      };
      const orgModuleAccessId = body.accessId;

      res
        .status(200)
        .json({
          response: "Successfully started generating metadata",
          images: imagesToUpload.images,
        });

      const imagesWithDescriptions: imagesWithDescription =
        await aiGenerateServiceOpenAI.generateImageDescription(imagesToUpload);
      const imagesWithEmbeddings: imagesWithEmbeddings =
        await aiGenerateServiceOpenAI.generateDescriptionEmbedding(
          imagesWithDescriptions
        );
      await databaseService.saveImage(imagesWithEmbeddings, orgModuleAccessId);
    } catch (error) {
      console.error("Error in generateMetadata:", error);
      res.status(500).json({
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  },
};
