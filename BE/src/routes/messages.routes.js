import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMessagesByFile, sendMessage } from '../controllers/messages.controller.js';

export const messagesRoutes = Router();

messagesRoutes.use(requireAuth);

messagesRoutes.get('/:fileId', getMessagesByFile);
messagesRoutes.post('/:fileId', sendMessage);
