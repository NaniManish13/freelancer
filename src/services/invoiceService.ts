import api from './api';
import { Invoice, InvoiceItem } from '../types';

export const invoiceService = {
  async getInvoices(filters?: { client?: string; status?: string; search?: string }) {
    const res = await api.get<{ success: boolean; data: { invoices: Invoice[] } }>('/invoices', {
      params: filters,
    });
    return res.data.data.invoices;
  },

  async getInvoiceById(id: string) {
    const res = await api.get<{ success: boolean; data: { invoice: Invoice } }>(`/invoices/${id}`);
    return res.data.data.invoice;
  },

  async createInvoice(data: {
    clientId: string;
    issueDate?: string | Date;
    dueDate: string | Date;
    taxPercent?: number;
    taxRate?: number;
    notes?: string;
    timeLogIds?: string[];
    items?: InvoiceItem[];
    customItems?: Array<{ description: string; quantity: number; rate: number }>;
  }) {
    const payload: any = {
      clientId: data.clientId,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      taxPercent: data.taxPercent ?? data.taxRate ?? 0,
      notes: data.notes,
      timeLogIds: data.timeLogIds,
    };

    if (data.items) {
      payload.customItems = data.items
        .filter((item) => !item.timeLogId)
        .map((item) => ({
          description: item.description,
          quantity: item.hours || item.quantity || 1,
          rate: item.rate,
        }));
    } else if (data.customItems) {
      payload.customItems = data.customItems;
    }

    const res = await api.post<{ success: boolean; data: { invoice: Invoice } }>('/invoices', payload);
    return res.data.data.invoice;
  },

  async updateInvoice(
    id: string,
    data: {
      status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
      dueDate?: string | Date;
      notes?: string;
    }
  ) {
    const res = await api.put<{ success: boolean; data: { invoice: Invoice } }>(`/invoices/${id}`, data);
    return res.data.data.invoice;
  },

  async deleteInvoice(id: string) {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/invoices/${id}`);
    return res.data.data;
  },

  async downloadPdf(id: string, invoiceNumber: string) {
    const res = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoiceNumber || id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async getInvoiceHtml(id: string) {
    const res = await api.get<string>(`/invoices/${id}/html`, {
      responseType: 'text',
    });
    return res.data;
  },
};
