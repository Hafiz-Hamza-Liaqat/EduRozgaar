import { Router } from 'express';
import { getCareerArticles, getCareerArticleBySlug } from '../controllers/careerArticlesController.js';

export const careerArticlesRouter = Router();

careerArticlesRouter.get('/career-articles', getCareerArticles);
careerArticlesRouter.get('/career-articles/:slug', getCareerArticleBySlug);
