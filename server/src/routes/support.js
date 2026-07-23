import { Router } from 'express';
import { submitTicket, getMyTickets, getMyTicket, replyToMyTicket } from '../controllers/supportController.js';
import { requireAuth, requireEmployerAuth, optionalAuth } from '../middleware/auth.js';
import { supportLimiter } from '../middleware/rateLimit.js';

export const supportRouter = Router();

supportRouter.post('/support/tickets', supportLimiter, optionalAuth, submitTicket);
supportRouter.get('/support/tickets/my', requireAuth, getMyTickets);
supportRouter.get('/support/tickets/my/:id', requireAuth, getMyTicket);
supportRouter.post('/support/tickets/my/:id/reply', requireAuth, replyToMyTicket);

supportRouter.get('/employer/support/tickets/my', requireAuth, requireEmployerAuth, getMyTickets);
supportRouter.get('/employer/support/tickets/my/:id', requireAuth, requireEmployerAuth, getMyTicket);
supportRouter.post('/employer/support/tickets/my/:id/reply', requireAuth, requireEmployerAuth, replyToMyTicket);
supportRouter.post('/employer/support/tickets', supportLimiter, requireAuth, requireEmployerAuth, submitTicket);
