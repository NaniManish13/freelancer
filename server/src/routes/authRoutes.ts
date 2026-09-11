import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { registerValidator, loginValidator, profileValidator } from '../validators/index.js';
import { validateRequest } from '../middleware/validator.js';

const router = Router();

router.post('/register', registerValidator, validateRequest, AuthController.register);
router.post('/login', loginValidator, validateRequest, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);
router.put('/plan', authenticate, AuthController.updatePlan);
router.put('/profile', authenticate, profileValidator, validateRequest, AuthController.updateProfile);

export default router;
