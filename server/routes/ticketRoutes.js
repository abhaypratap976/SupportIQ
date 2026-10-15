import { Router } from 'express';
import { ticketController } from '../controllers/ticketController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All ticket routes require authentication
router.use(authenticate);

router.get('/', ticketController.getTickets);
router.post('/', ticketController.createTicket);
router.get('/:id', ticketController.getTicketById);
router.post('/:id/messages', ticketController.addMessage);

// Staff-only mutations
router.patch('/:id/status', requireRole(['Admin', 'Agent']), ticketController.updateStatus);
router.patch('/:id/priority', requireRole(['Admin', 'Agent']), ticketController.updatePriority);
router.patch('/:id/category', requireRole(['Admin', 'Agent']), ticketController.updateCategory);
router.patch('/:id/assign', requireRole(['Admin', 'Agent']), ticketController.assignTicket);

export default router;
