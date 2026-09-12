import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { invoiceService } from '../services/invoiceService';
import { Invoice } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { UpgradeModal } from '../components/ui/UpgradeModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatusAlert } from '../components/ui/StatusAlert';
import {
  FileText,
  ArrowLeft,
  Download,
  Printer,
  CheckCircle2,
  Send,
  Trash2,
  Building2,
  Calendar,
  DollarSign,
  Sparkles,
  XCircle,
} from 'lucide-react';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);

  const fetchInvoice = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await invoiceService.getInvoiceById(id);
      setInvoice(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleStatusChange = async (newStatus: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED') => {
    if (!id) return;
    try {
      await invoiceService.updateInvoice(id, { status: newStatus });
      success(`Invoice status updated to ${newStatus}`);
      fetchInvoice();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update invoice status');
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    if (user?.plan !== 'PRO') {
      setUpgradeReason(
        'Puppeteer PDF Invoice Generation is a PRO feature. Upgrade your account to download itemized PDF invoices!'
      );
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsDownloadingPdf(true);
    try {
      await invoiceService.downloadPdf(invoice._id, invoice.invoiceNumber);
      success(`Invoice #${invoice.invoiceNumber}.pdf downloaded!`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to download PDF invoice');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await invoiceService.deleteInvoice(id);
      success('Invoice removed');
      navigate('/invoices');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setIsDeleting(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner label="Loading invoice document..." fullHeight />;
  }

  if (errorMessage || !invoice) {
    return <StatusAlert message={errorMessage || 'Invoice not found'} onRetry={fetchInvoice} />;
  }

  const client = typeof invoice.client === 'object' ? invoice.client : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status buttons */}
          {invoice.status !== 'PAID' && (
            <button
              id="btn-mark-invoice-paid"
              onClick={() => handleStatusChange('PAID')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
            </button>
          )}

          {invoice.status === 'DRAFT' && (
            <button
              id="btn-mark-invoice-sent"
              onClick={() => handleStatusChange('SENT')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Mark Sent
            </button>
          )}

          {/* Print Button */}
          <button
            id="btn-print-invoice"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>

          {/* Download PDF Button */}
          <button
            id="btn-download-pdf-detail"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
          </button>

          {/* Delete Button */}
          <button
            id="btn-delete-invoice-detail"
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Delete Invoice"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                F
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                Freelance<span className="text-blue-600">Flow</span>
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-500 space-y-0.5">
              <p className="font-semibold text-slate-700">{user?.name}</p>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="flex items-center sm:justify-end gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                INVOICE #{invoice.invoiceNumber}
              </h1>
            </div>
            <div className="mt-2">
              <StatusBadge status={invoice.status} />
            </div>
            <div className="mt-3 text-xs text-slate-500 space-y-1">
              <p>
                Issue Date: <strong className="text-slate-700">{new Date(invoice.issueDate).toLocaleDateString()}</strong>
              </p>
              <p>
                Due Date: <strong className="text-slate-700">{new Date(invoice.dueDate).toLocaleDateString()}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Billed To Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Billed To</h3>
            {client ? (
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-sm text-slate-900">{client.name}</p>
                {client.companyName && <p className="font-medium text-slate-600">{client.companyName}</p>}
                <p>{client.email}</p>
                {client.phone && <p>{client.phone}</p>}
                {client.address && <p className="whitespace-pre-line text-slate-500">{client.address}</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Unknown Client</p>
            )}
          </div>

          <div className="sm:text-right flex flex-col justify-end">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 sm:max-w-xs sm:ml-auto">
              <span className="text-xs font-semibold text-slate-500 block">Total Amount Due</span>
              <span className="text-2xl font-black text-blue-600 block mt-1">
                ${(invoice.total || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase tracking-wider">
                <th className="pb-3 w-1/2">Description</th>
                <th className="pb-3 text-center">Hours / Qty</th>
                <th className="pb-3 text-right">Rate</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3.5 pr-4 font-medium text-slate-900">
                    {item.description}
                  </td>
                  <td className="py-3.5 text-center text-slate-600 font-semibold">
                    {item.hours}
                  </td>
                  <td className="py-3.5 text-right text-slate-600">
                    ${item.rate}
                  </td>
                  <td className="py-3.5 text-right font-bold text-slate-900">
                    ${(item.amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200">
          <div className="max-w-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Payment Terms & Notes
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
              {invoice.notes || 'Payment due in full upon receipt.'}
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">${(invoice.subtotal || 0).toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Tax ({invoice.taxRate || 0}%):</span>
              <span className="font-bold text-slate-900">${(invoice.tax || 0).toLocaleString()}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-black text-sm text-slate-900">
              <span>Total:</span>
              <span className="text-lg text-blue-600">${(invoice.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal for PDF feature */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        triggerReason={upgradeReason}
      />

      {/* Delete Invoice Dialog */}
      <ConfirmDialog
        id="dialog-delete-invoice"
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete Invoice #${invoice.invoiceNumber}? Linked time logs will be unbilled again.`}
        confirmLabel="Delete Invoice"
        isLoading={isDeleting}
      />
    </div>
  );
};
