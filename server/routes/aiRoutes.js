import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/summarize', authenticate, aiController.summarize);
router.post('/suggest-category', authenticate, aiController.suggestCategory);
router.post('/suggest-priority', authenticate, aiController.suggestPriority);
router.post('/draft-response', authenticate, aiController.draftResponse);
router.post('/rephrase', authenticate, aiController.rephrase);
router.post('/generate-article', authenticate, requireRole(['Admin', 'Agent']), aiController.generateArticle);
router.post('/ask-help', optionalAuth, aiController.askInstantHelp);

export default router;
