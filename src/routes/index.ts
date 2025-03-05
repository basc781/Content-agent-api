import { Router } from 'express';
import { contentGeneratorController, contentRetrieverController } from '../controllers/contentGeneratorController.js';

export const routes = Router();

routes.post('/generate-article', contentGeneratorController.generateArticle);
routes.post('/check-form-data', contentGeneratorController.checkFormData);
routes.get('/get-published-articles', contentRetrieverController.getPublishedArticles);
routes.get('/get-published-content-calendar-items', contentRetrieverController.getPublishedContentCalendarItems);   