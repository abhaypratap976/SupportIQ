import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Staff can view user list (e.g. for assigning tickets)
router.get('/', requireRole(['Admin', 'Agent']), userController.getUsers);

// Admin-only user management
router.post('/', requireRole(['Admin']), userController.createUserByAdmin);
router.delete('/:id', requireRole(['Admin']), userController.deleteUser);

export default router;
