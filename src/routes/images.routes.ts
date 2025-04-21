import { Router } from "express";
import { imagesController } from "../controllers/imagesController.js";

export const imageRouter = Router();

imageRouter.post("/get-upload-urls", imagesController.getUploadUrls);
imageRouter.post("/generate-metadata", imagesController.generateMetadata);