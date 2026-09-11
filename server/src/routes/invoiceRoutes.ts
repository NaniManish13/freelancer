import { Router } from 'express';
import { InvoiceController } from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/auth.js';
import { invoiceValidator } from '../validators/index.js';
import { validateRequest } from '../middleware/validator.js';

const router = Router();

router.use(authenticate);

router.get('/', InvoiceController.getInvoices);
router.get('/:id', InvoiceController.getInvoiceById);
router.get('/:id/pdf', InvoiceController.generatePdf);
router.get('/:id/html', InvoiceController.getInvoiceHtml);
router.post('/', invoiceValidator, validateRequest, InvoiceController.createInvoice);
router.put('/:id', InvoiceController.updateInvoice);
router.delete('/:id', InvoiceController.deleteInvoice);

export default router;
