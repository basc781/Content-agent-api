import { Router } from "express";
import { contentRouter } from "./content.routes.js";
import { moduleRouter } from "./module.routes.js";

export const routes = Router();

routes.use("/content", contentRouter);
routes.use("/modules", moduleRouter);
