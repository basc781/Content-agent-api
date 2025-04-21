import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { analyseImageService } from "../services/bucketService.js";
import { aiGenerateService } from "../services/aiGenerateService.js";
import { imagePayloadWithUrls, imagesWithDescription, GenerateMetadataRequest, imagesWithEmbeddings } from "../types/types.js";
import { databaseService } from "../services/databaseService.js";


export const imagesController = {

  getUploadUrls: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("Getting upload URLs - Request received", req.body);
      const orgId = getAuth(req).orgId;
      
      if (!orgId) {
        console.log("Error: Unauthorized - No organization ID");
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const imagesToUpload = req.body;

      const imagesWithUrls = await analyseImageService.generateAuthenticatedUrls(imagesToUpload);
      console.log("Images with URLs:", imagesWithUrls);
      res.json({ images: imagesWithUrls.images });

    } catch (error) {
      console.error("Error getting upload URLs:", error);
      res.status(500).json({ error: "Failed to get upload URLs" });
    }
  },
 

  generateMetadata: async (req: Request, res: Response): Promise<void> => {
    try {
      
      console.log("Generating metadata - Request received");
      const orgId = getAuth(req).orgId;
      
      if (!orgId) {
        console.log("Error: Unauthorized - No organization ID");
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const body = req.body as GenerateMetadataRequest;
   

      const imagesToUpload: imagePayloadWithUrls = {
        images: body.images
      };
      const orgModuleAccessId = body.accessId;
      console.log("DIT IS DE ORG MODULE ACCESS ID", orgModuleAccessId);

      const imagesWithDescriptions: imagesWithDescription = await aiGenerateService.generateImageDescription(imagesToUpload);

      const imagesWithEmbeddings: imagesWithEmbeddings = await aiGenerateService.generateDescriptionEmbedding(imagesWithDescriptions);
      
      await databaseService.saveImage(imagesWithEmbeddings, orgModuleAccessId);

      res.json({ images: imagesWithDescriptions.images  });

    } catch (error) {
      console.error("Error generating metadata:", error);
      res.status(500).json({ error: "Failed to generate metadata" });
    }
  }
};