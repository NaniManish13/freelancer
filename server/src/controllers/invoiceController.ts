import { Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoiceService.js';
import { PdfService } from '../services/pdfService.js';
import { AuthRequest } from '../middleware/auth.js';

export class InvoiceController {
  static async getInvoices(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { client, status, search } = req.query;
      const invoices = await InvoiceService.getInvoices(req.user!.id, {
        client: client as string,
        status: status as string,
        search: search as string,
      });
      res.status(200).json({ success: true, data: { invoices } });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.getInvoiceById(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: { invoice } });
    } catch (error) {
      next(error);
    }
  }

  static async createInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.createInvoice(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { invoice } });
    } catch (error) {
      next(error);
    }
  }

  static async updateInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.updateInvoice(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data: { invoice } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InvoiceService.deleteInvoice(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async generatePdf(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userPlan = req.user!.plan;

      const pdfBuffer = await PdfService.generateInvoicePdf(id, req.user!.id, userPlan);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${id}.pdf"`);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceHtml(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const html = await PdfService.generateInvoiceHtml(id, req.user!.id);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error) {
      next(error);
    }
  }
}
