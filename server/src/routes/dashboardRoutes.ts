import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', DashboardController.getDashboard);

export default router;
