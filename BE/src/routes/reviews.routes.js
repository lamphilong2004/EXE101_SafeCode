import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { submitReview, getFreelancerReviews } from '../controllers/reviews.controller.js';

export const reviewsRoutes = Router();

reviewsRoutes.post('/:fileId', requireAuth, submitReview);
reviewsRoutes.get('/freelancer/:freelancerId', getFreelancerReviews);
