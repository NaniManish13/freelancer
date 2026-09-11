import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { InvoiceService } from './invoiceService.js';
import { AppError } from '../middleware/errorHandler.js';

export class PdfService {
  static async generateInvoiceHtml(invoiceId: string, userId: string): Promise<string> {
    const invoice = await InvoiceService.getInvoiceById(invoiceId, userId);
    const client = invoice.client as any;
    const freelancer = invoice.user as any;

    const templatePath = path.join(process.cwd(), 'server', 'src', 'templates', 'invoice.html');
    let template = '';
    if (fs.existsSync(templatePath)) {
      template = fs.readFileSync(templatePath, 'utf8');
    } else {
      // Fallback inline template
      template = `<!DOCTYPE html><html><body><h1>Invoice {{invoiceNumber}}</h1></body></html>`;
    }

    const itemsHtml = (invoice.items || [])
      .map(
        (item: any) => `
      <tr>
        <td><strong>${item.description || 'Service'}</strong></td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">$${item.rate.toFixed(2)}</td>
        <td class="text-right"><strong>$${item.amount.toFixed(2)}</strong></td>
      </tr>
    `
      )
      .join('');

    const formattedSubtotal = `$${invoice.subtotal.toFixed(2)}`;
    const formattedTax = `$${invoice.tax.toFixed(2)}`;
    const formattedTotal = `$${invoice.total.toFixed(2)}`;

    const issueDateStr = new Date(invoice.issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const dueDateStr = new Date(invoice.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    let rendered = template
      .replace(/{{invoiceNumber}}/g, invoice.invoiceNumber)
      .replace(/{{status}}/g, invoice.status)
      .replace(/{{freelancerName}}/g, freelancer?.name || 'Freelance Professional')
      .replace(/{{freelancerEmail}}/g, freelancer?.email || '')
      .replace(/{{clientName}}/g, client?.name || 'Client')
      .replace(/{{clientEmail}}/g, client?.email || '')
      .replace(/{{currency}}/g, client?.currency || 'USD')
      .replace(/{{issueDate}}/g, issueDateStr)
      .replace(/{{dueDate}}/g, dueDateStr)
      .replace(/{{itemsHtml}}/g, itemsHtml)
      .replace(/{{formattedSubtotal}}/g, formattedSubtotal)
      .replace(/{{formattedTax}}/g, formattedTax)
      .replace(/{{formattedTotal}}/g, formattedTotal);

    if (client?.companyName) {
      rendered = rendered
        .replace('{{#if clientCompanyName}}', '')
        .replace('{{/if}}', '')
        .replace('{{clientCompanyName}}', client.companyName);
    } else {
      rendered = rendered.replace(/{{#if clientCompanyName}}[\s\S]*?{{\/if}}/, '');
    }

    if (client?.address) {
      rendered = rendered
        .replace('{{#if clientAddress}}', '')
        .replace('{{/if}}', '')
        .replace('{{clientAddress}}', client.address);
    } else {
      rendered = rendered.replace(/{{#if clientAddress}}[\s\S]*?{{\/if}}/, '');
    }

    if (client?.phone) {
      rendered = rendered
        .replace('{{#if clientPhone}}', '')
        .replace('{{/if}}', '')
        .replace('{{clientPhone}}', client.phone);
    } else {
      rendered = rendered.replace(/{{#if clientPhone}}[\s\S]*?{{\/if}}/, '');
    }

    if (invoice.tax > 0) {
      rendered = rendered.replace('{{#if hasTax}}', '').replace('{{/if}}', '');
    } else {
      rendered = rendered.replace(/{{#if hasTax}}[\s\S]*?{{\/if}}/, '');
    }

    if (invoice.notes) {
      rendered = rendered
        .replace('{{#if notes}}', '')
        .replace('{{/if}}', '')
        .replace('{{notes}}', invoice.notes);
    } else {
      rendered = rendered.replace(/{{#if notes}}[\s\S]*?{{\/if}}/, '');
    }

    return rendered;
  }

  static async generateInvoicePdf(
    invoiceId: string,
    userId: string,
    userPlan: 'FREE' | 'PRO'
  ): Promise<Buffer> {
    // Enforce PRO restriction
    if (userPlan !== 'PRO') {
      throw new AppError('This feature requires a Pro plan.', 403);
    }

    const html = await this.generateInvoiceHtml(invoiceId, userId);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote',
        ],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      await browser.close();
      return Buffer.from(pdfUint8Array);
    } catch (error: any) {
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }
      console.error('Puppeteer generation error:', error);
      throw new AppError(
        `PDF generation encountered an error: ${error.message || 'Chromium runtime failure'}`,
        500
      );
    }
  }
}
