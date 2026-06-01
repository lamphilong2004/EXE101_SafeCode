import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMyNotifications, markAsRead } from '../controllers/notifications.controller.js';

export const notificationsRoutes = Router();

notificationsRoutes.use(requireAuth);

notificationsRoutes.get('/', getMyNotifications);
notificationsRoutes.patch('/:id/read', markAsRead);
