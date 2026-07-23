import { Router } from 'express';
import { chatbotQuery, getChatHistory } from '../controllers/chatbotController.js';
import { requireAuth, requireUserAuth } from '../middleware/auth.js';

export const chatbotRouter = Router();

chatbotRouter.post('/chatbot/query', requireAuth, requireUserAuth, chatbotQuery);
chatbotRouter.get('/chatbot/history', requireAuth, requireUserAuth, getChatHistory);
