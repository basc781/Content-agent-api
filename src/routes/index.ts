import { Router } from 'express';
import { contentGeneratorController } from '../controllers/contentGeneratorController';

export const routes = Router();

routes.post('/generate-content-calender', contentGeneratorController.generateContentCalender); 
routes.post('/generate-article', contentGeneratorController.generateArticle);
routes.post('/check-form-data', contentGeneratorController.checkFormData);