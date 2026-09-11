import { Router } from 'express';
import { TaskController } from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { taskValidator } from '../validators/index.js';
import { validateRequest } from '../middleware/validator.js';

const router = Router();

router.use(authenticate);

router.get('/', TaskController.getTasks);
router.get('/:id', TaskController.getTaskById);
router.post('/', taskValidator, validateRequest, TaskController.createTask);
router.put('/:id', TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

export default router;
