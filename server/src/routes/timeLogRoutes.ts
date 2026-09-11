import { Router } from 'express';
import { TimeLogController } from '../controllers/timeLogController.js';
import { authenticate } from '../middleware/auth.js';
import { timeLogValidator } from '../validators/index.js';
import { validateRequest } from '../middleware/validator.js';

const router = Router();

router.use(authenticate);

router.get('/', TimeLogController.getTimeLogs);
router.get('/unbilled', TimeLogController.getUnbilledLogs);
router.post('/', timeLogValidator, validateRequest, TimeLogController.createTimeLog);
router.put('/:id', TimeLogController.updateTimeLog);
router.delete('/:id', TimeLogController.deleteTimeLog);

export default router;
