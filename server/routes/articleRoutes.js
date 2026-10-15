import { Router } from 'express';
import { articleController } from '../controllers/articleController.js';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public / optional-auth read routes
router.get('/', optionalAuth, articleController.getArticles);
router.get('/:id', optionalAuth, articleController.getArticleById);
router.post('/:id/helpful', optionalAuth, articleController.markHelpful);

// Staff-only write routes
router.post('/', authenticate, requireRole(['Admin', 'Agent']), articleController.createArticle);
router.put('/:id', authenticate, requireRole(['Admin', 'Agent']), articleController.updateArticle);

// Admin-only deletion
router.delete('/:id', authenticate, requireRole(['Admin']), articleController.deleteArticle);

export default router;
