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
      // Full standalone responsive HTML template for serverless environments
      template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; padding: 40px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 30px; }
    .brand-title { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .brand-accent { color: #2563eb; }
    .invoice-tag { font-size: 28px; font-weight: 800; color: #0f172a; text-align: right; }
    .invoice-num { font-family: monospace; font-size: 14px; color: #64748b; margin-top: 4px; }
    .grid-2 { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 20px; }
    .info-box { flex: 1; }
    .info-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 6px; }
    .info-name { font-size: 16px; font-weight: 700; color: #0f172a; }
    .info-text { font-size: 13px; color: #475569; margin-top: 2px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-top: 6px; }
    .status-PAID { background: #dcfce7; color: #166534; }
    .status-SENT { background: #dbeafe; color: #1e40af; }
    .status-OVERDUE { background: #fee2e2; color: #991b1b; }
    .status-DRAFT { background: #f1f5f9; color: #475569; }
    .status-CANCELLED { background: #f3f4f6; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background-color: #f8fafc; color: #475569; font-size: 12px; font-weight: 600; text-align: left; padding: 12px 14px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; }
    td { padding: 14px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .text-right { text-align: right; }
    .totals-table { width: 280px; margin-left: auto; border-collapse: collapse; }
    .totals-table td { padding: 8px 12px; border-bottom: none; }
    .total-row { border-top: 2px solid #e2e8f0; font-size: 16px; font-weight: 800; color: #0f172a; }
    .notes-box { background: #f8fafc; border-left: 3px solid #cbd5e1; padding: 14px; border-radius: 4px; margin-top: 20px; }
    .notes-title { font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px; }
    .notes-content { font-size: 12px; color: #64748b; }
    .footer { margin-top: 50px; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">Freelance<span class="brand-accent">Flow</span></div>
      <div class="info-text">Professional Invoicing & Project Suite</div>
    </div>
    <div>
      <div class="invoice-tag">INVOICE</div>
      <div class="invoice-num">#{{invoiceNumber}}</div>
      <div class="status-badge status-{{status}}">{{status}}</div>
    </div>
  </div>
  <div class="grid-2">
    <div class="info-box">
      <div class="info-title">Billed By (Freelancer)</div>
      <div class="info-name">{{freelancerName}}</div>
      <div class="info-text">{{freelancerEmail}}</div>
    </div>
    <div class="info-box">
      <div class="info-title">Billed To (Client)</div>
      <div class="info-name">{{clientName}}</div>
      {{#if clientCompanyName}}<div class="info-text"><strong>{{clientCompanyName}}</strong></div>{{/if}}
      <div class="info-text">{{clientEmail}}</div>
      {{#if clientAddress}}<div class="info-text">{{clientAddress}}</div>{{/if}}
      {{#if clientPhone}}<div class="info-text">{{clientPhone}}</div>{{/if}}
    </div>
    <div class="info-box" style="text-align: right;">
      <div class="info-title">Dates & Terms</div>
      <div class="info-text"><strong>Issue Date:</strong> {{issueDate}}</div>
      <div class="info-text"><strong>Due Date:</strong> {{dueDate}}</div>
      <div class="info-text"><strong>Currency:</strong> {{currency}}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Description / Task</th>
        <th class="text-right">Qty / Hours</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>{{itemsHtml}}</tbody>
  </table>
  <table class="totals-table">
    <tr>
      <td class="info-text">Subtotal:</td>
      <td class="text-right font-medium">{{formattedSubtotal}}</td>
    </tr>
    {{#if hasTax}}
    <tr>
      <td class="info-text">Tax:</td>
      <td class="text-right font-medium">{{formattedTax}}</td>
    </tr>
    {{/if}}
    <tr class="total-row">
      <td>Total Due:</td>
      <td class="text-right brand-accent" style="color: #2563eb;">{{formattedTotal}}</td>
    </tr>
  </table>
  {{#if notes}}
  <div class="notes-box">
    <div class="notes-title">Notes & Payment Instructions</div>
    <div class="notes-content">{{notes}}</div>
  </div>
  {{/if}}
  <div class="footer">Thank you for your business! Generated by FreelanceFlow.</div>
</body>
</html>`;
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
