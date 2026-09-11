import { Router } from 'express';
import { SampleDataController } from '../controllers/sampleDataController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', SampleDataController.loadSampleData);
router.delete('/', SampleDataController.clearSampleData);

export default router;
