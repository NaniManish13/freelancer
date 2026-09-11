import { Router } from 'express';
import { ClientController } from '../controllers/clientController.js';
import { authenticate } from '../middleware/auth.js';
import { clientValidator } from '../validators/index.js';
import { validateRequest } from '../middleware/validator.js';

const router = Router();

router.use(authenticate);

router.get('/', ClientController.getClients);
router.get('/:id', ClientController.getClientById);
router.post('/', clientValidator, validateRequest, ClientController.createClient);
router.put('/:id', clientValidator, validateRequest, ClientController.updateClient);
router.delete('/:id', ClientController.deleteClient);

export default router;
