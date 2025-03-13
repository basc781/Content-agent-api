import { Router } from "express";
import { moduleController } from "../controllers/moduleController.js";

export const moduleRouter = Router();

moduleRouter.get("/", moduleController.getModules);
moduleRouter.get("/:moduleSlug", moduleController.checkModuleAccess);
