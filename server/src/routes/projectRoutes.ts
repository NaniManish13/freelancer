import { Router } from 'express';
import { ProjectController } from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { projectValidator } from '../validators/index.js';
import { validateRequest } from '../middleware/validator.js';

const router = Router();

router.use(authenticate);

router.get('/', ProjectController.getProjects);
router.get('/:id', ProjectController.getProjectById);
router.post('/', projectValidator, validateRequest, ProjectController.createProject);
router.put('/:id', ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);

export default router;
