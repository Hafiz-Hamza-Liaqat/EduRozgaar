import { Router } from 'express';
import { submitContact } from '../controllers/contactController.js';
import { contactLimiter } from '../middleware/rateLimit.js';

export const contactRouter = Router();

contactRouter.post('/contact', contactLimiter, submitContact);
